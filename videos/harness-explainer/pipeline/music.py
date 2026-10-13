"""Процедурная фоновая музыка + звуковые эффекты, сведение с голосом.

Тёплый эмбиент/лоу-фай, ре мажор, 84 BPM: пэд, электропиано (FM), бас, мягкие барабаны, реверберация.
Аранжировка следует таймлайну ролика: вступление без барабанов, «вдох» и нарастание перед каждой главой,
тихий режим в мини-тесте с тиканьем часов во время пауз, затухание в финале.
Музыка автоматически приглушается под голос (ducking).

Выход: public/audio/mix.wav (стерео, 48 кГц, -16 LUFS)
"""
import json
import os
import subprocess
import wave

import numpy as np
from scipy.signal import butter, oaconvolve, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SR = 48000
BPM = 84
BEAT = 60 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(7)

TL = json.load(open(os.path.join(ROOT, "src/timeline.json"), encoding="utf-8"))
FPS = TL["fps"]
TOTAL = TL["durationInFrames"] / FPS
N = int(TOTAL * SR) + SR * 4


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ───────────────────────── гармония ─────────────────────────
PROGS = [
    # A: Dmaj9 – Bm9 – Gmaj9 – A6/9
    [([50, 57, 61, 64, 66], 38), ([47, 54, 57, 61, 62], 35), ([55, 59, 62, 66, 69], 43), ([52, 57, 61, 64, 66], 45)],
    # B: Em9 – A13sus – Dmaj7 – Bm7
    [([52, 55, 59, 62, 66], 40), ([55, 59, 61, 64, 66], 45), ([50, 54, 57, 61, 64], 38), ([47, 54, 57, 62, 64], 35)],
    # C: Gmaj7 – F#m7 – Em7 – Asus4
    [([50, 54, 57, 62, 67], 43), ([49, 52, 57, 61, 64], 42), ([47, 50, 55, 59, 62], 40), ([52, 57, 62, 64, 69], 45)],
]

scenes = TL["scenes"]


def scene_at(t):
    f = t * FPS
    for s in scenes:
        if s["start"] <= f < s["end"]:
            return s
    return scenes[-1]


title_start = next(s for s in scenes if s["id"] == "title")["start"] / FPS
quiz = next(s for s in scenes if s["id"] == "quiz")
outro = next(s for s in scenes if s["id"] == "outro")
last_line_end = (outro["start"] + outro["lines"][-1]["end"]) / FPS
chapter_cards = [(s["start"] / FPS, s["end"] / FPS) for s in scenes if s["kind"] == "chapter"]


def energy(t):
    """0 — только пэд, 1 — пэд+пиано, 2 — полный бит."""
    if t < title_start:
        return 1
    for a, b in chapter_cards:
        if a - 0.3 <= t < b:
            return 0
    if quiz["start"] / FPS <= t < quiz["end"] / FPS:
        return 1
    if t > last_line_end:
        return 1
    return 2


# ───────────────────────── инструменты ─────────────────────────
def wavetable():
    n = 4096
    ph = np.arange(n) / n
    w = np.zeros(n)
    for k in range(1, 18):
        w += np.sin(2 * np.pi * k * ph) / (k ** 1.35)
    return (w / np.abs(w).max()).astype(np.float32)


WT = wavetable()


def osc_wt(f, n, phase0=0.0):
    ph = (phase0 + f * np.arange(n) / SR) % 1.0
    return WT[(ph * len(WT)).astype(np.int32)]


def add(buf, i, sig):
    """buf: (2, N) stereo; sig: (2, n)"""
    if i >= buf.shape[1]:
        return
    j = min(buf.shape[1], i + sig.shape[1])
    buf[:, i:j] += sig[:, : j - i]


def pad_chord(notes, t0, dur, amp):
    rel = 2.2
    n = int((dur + rel) * SR)
    t = np.arange(n) / SR
    env = np.minimum(1, t / 0.9) * np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.55))
    env = env.astype(np.float32)
    out = np.zeros((2, n), np.float32)
    for m in notes:
        while m < 47:
            m += 12
        f = mtof(m)
        a = osc_wt(f * 2 ** (6 / 1200), n, rng.random())
        b = osc_wt(f * 2 ** (-6 / 1200), n, rng.random())
        s = np.sin(2 * np.pi * f * t + rng.random() * 6.28).astype(np.float32)
        out[0] += 0.65 * a + 0.35 * b + 0.5 * s
        out[1] += 0.35 * a + 0.65 * b + 0.5 * s
    return out * env * amp / len(notes)


def ep_note(m, vel, dur):
    f = mtof(m)
    n = int((dur + 1.6) * SR)
    t = (np.arange(n) / SR).astype(np.float32)
    idx = 1.6 * vel * np.exp(-t * 3.2) + 0.2
    car = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    tine = 0.12 * vel * np.sin(2 * np.pi * f * 14 * t) * np.exp(-t * 30)
    decay = 1.5 * (440 / f) ** 0.35
    env = (1 - np.exp(-t / 0.003)) * np.exp(-t / decay)
    env *= np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.18))
    mono = ((car + tine) * env * vel).astype(np.float32)
    p = rng.uniform(-0.35, 0.35)
    return np.stack([mono * (0.5 - p / 2) * 1.4, mono * (0.5 + p / 2) * 1.4])


def bass_note(m, dur, vel=1.0):
    f = mtof(m)
    n = int((dur + 0.08) * SR)
    t = (np.arange(n) / SR).astype(np.float32)
    s = np.sin(2 * np.pi * f * t) + 0.22 * np.sin(4 * np.pi * f * t) + 0.06 * np.sin(6 * np.pi * f * t)
    env = np.minimum(1, t / 0.008) * (0.72 + 0.28 * np.exp(-t / 0.25))
    env *= np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.02))
    mono = np.tanh(1.4 * s * env) / np.tanh(1.4) * vel
    return np.stack([mono, mono]).astype(np.float32)


def kick():
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    fr = 44 + 80 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    s = np.sin(ph) * np.exp(-t * 6.5) + 0.08 * rng.standard_normal(n) * np.exp(-t * 400)
    return np.stack([s, s]).astype(np.float32)


SOS_SN = butter(2, [900, 5200], btype="band", fs=SR, output="sos")
SOS_HH = butter(2, 6500, btype="high", fs=SR, output="sos")


def snare():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    nz = sosfilt(SOS_SN, rng.standard_normal(n)) * np.exp(-t * 20)
    body = 0.35 * np.sin(2 * np.pi * 185 * t) * np.exp(-t * 28)
    s = (nz * 1.6 + body)
    return np.stack([s * 0.9, s]).astype(np.float32)


def hat(open_=False):
    n = int((0.25 if open_ else 0.07) * SR)
    t = np.arange(n) / SR
    s = sosfilt(SOS_HH, rng.standard_normal(n)) * np.exp(-t * (14 if open_ else 70))
    p = rng.uniform(-0.3, 0.3)
    return np.stack([s * (0.5 - p), s * (0.5 + p)]).astype(np.float32)


KICK, SNARE = kick(), snare()

# ───────────────────────── партитура ─────────────────────────
pad = np.zeros((2, N), np.float32)
ep = np.zeros((2, N), np.float32)
bass = np.zeros((2, N), np.float32)
drums = np.zeros((2, N), np.float32)
kick_times = []

PATTERNS = {
    "sparse": [(0, 0, 0.9), (6, 2, 0.6), (10, 3, 0.55)],
    "flow": [(0, 0, 0.85), (3, 2, 0.55), (6, 3, 0.6), (8, 1, 0.65), (11, 4, 0.5), (14, 2, 0.55)],
    "busy": [(0, 0, 0.8), (2, 1, 0.5), (4, 2, 0.55), (6, 3, 0.5), (8, 4, 0.6), (10, 3, 0.45), (12, 2, 0.5), (14, 1, 0.45)],
}
S16 = BEAT / 4
n_bars = int(np.ceil(TOTAL / BAR)) + 1
for bar in range(n_bars):
    t0 = bar * BAR
    if t0 > TOTAL + 2:
        break
    group_t = (bar - bar % 4) * BAR
    prog = PROGS[scene_at(group_t)["chapter"] % 3]
    notes, root = prog[bar % 4]
    e = energy(t0 + 0.05)
    fade_in = min(1.0, t0 / 6.0 + 0.15)
    add(pad, int(t0 * SR), pad_chord(notes, t0, BAR, 0.55 * fade_in))

    # электропиано
    tones = sorted(set(m + 12 for m in notes))
    pat = "sparse" if e <= 1 else ("busy" if (bar // 8) % 4 == 3 else "flow")
    if e >= 1 or bar % 2 == 0:
        for pos, deg, vel in PATTERNS[pat]:
            if e == 0 and pos > 0:
                continue
            jitter = rng.normal(0, 0.006)
            tt = t0 + pos * S16 + jitter
            m = tones[deg % len(tones)] + (12 if (bar % 8 >= 4 and deg == 4) else 0)
            add(ep, int(tt * SR), ep_note(m, vel * rng.uniform(0.85, 1.05) * (0.8 if e <= 1 else 1.0), S16 * 2.5))

    # бас и барабаны
    if e == 2:
        for pos, dur, v in [(0, 5, 1.0), (6, 2, 0.75), (8, 4, 0.9), (14, 2, 0.7)]:
            add(bass, int((t0 + pos * S16) * SR), bass_note(root if pos != 14 else root + 7, dur * S16 * 0.95, v))
        for b in range(4):
            bt = t0 + b * BEAT
            if b in (0, 2):
                add(drums, int(bt * SR), KICK * 0.9)
                kick_times.append(bt)
            if b == 2 and bar % 2 == 1:
                pass
            if b in (1, 3):
                add(drums, int(bt * SR), SNARE * 0.45)
            # хэты с лёгким свингом
            add(drums, int(bt * SR), hat() * 0.28)
            add(drums, int((bt + BEAT * 0.58) * SR), hat(open_=(b == 3 and bar % 4 == 3)) * 0.18)
        if bar % 2 == 1:
            add(drums, int((t0 + 2.75 * BEAT) * SR), KICK * 0.55)
            kick_times.append(t0 + 2.75 * BEAT)

# пампинг от бочки (сайдчейн) для пэда и баса
pump = np.ones(N, np.float32)
kt = np.array(kick_times)
if len(kt):
    tt = np.arange(N) / SR
    idx = np.searchsorted(kt, tt, side="right") - 1
    since = np.where(idx >= 0, tt - kt[np.clip(idx, 0, None)], 10)
    pump = (1 - 0.32 * np.exp(-since * 9)).astype(np.float32)
pad *= pump
bass *= pump

# фильтры
pad = sosfilt(butter(2, 2300, "low", fs=SR, output="sos"), pad, axis=1).astype(np.float32)
pad = sosfilt(butter(1, 110, "high", fs=SR, output="sos"), pad, axis=1).astype(np.float32)
drums = sosfilt(butter(2, 8500, "low", fs=SR, output="sos"), drums, axis=1).astype(np.float32)
drums = np.tanh(drums * 1.3) / 1.3

# ───────────────────────── эффекты ─────────────────────────
sfx = np.zeros((2, N), np.float32)
shimmer = np.zeros((2, N), np.float32)


def riser(dur=1.9):
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal((2, n))
    out = np.zeros((2, n))
    # переменный однополюсный ФНЧ блоками по 256 отсчётов
    y = np.zeros(2)
    for i0 in range(0, n, 256):
        fc = 250 * (9000 / 250) ** ((i0 / n) ** 1.6)
        a = np.exp(-2 * np.pi * fc / SR)
        blk = noise[:, i0:i0 + 256]
        o = np.empty_like(blk)
        for k in range(blk.shape[1]):
            y = a * y + (1 - a) * blk[:, k]
            o[:, k] = y
        out[:, i0:i0 + 256] = o
    env = (t / dur) ** 2.2
    return (out * env * 0.5).astype(np.float32)


def boom():
    n = int(1.8 * SR)
    t = np.arange(n) / SR
    fr = 42 + 30 * np.exp(-t * 5)
    s = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 2.4)
    s += 0.25 * sosfilt(butter(2, 400, "low", fs=SR, output="sos"), rng.standard_normal(n)) * np.exp(-t * 6)
    return np.stack([s, s]).astype(np.float32) * 0.8


def whoosh(dur=0.7):
    n = int(dur * SR)
    t = np.arange(n) / SR
    nz = rng.standard_normal((2, n))
    out = np.zeros((2, n))
    for i0 in range(0, n, 512):
        fc = 3500 * (500 / 3500) ** (i0 / n)
        sos = butter(2, [fc * 0.6, fc * 1.4], "band", fs=SR, output="sos")
        out[:, i0:i0 + 512] = sosfilt(sos, nz[:, i0:i0 + 512], axis=1)
    env = np.sin(np.pi * t / dur) ** 2
    return (out * env * 0.35).astype(np.float32)


def tick(hi=True):
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    f = 1900 if hi else 1350
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 90) + 0.3 * np.sin(2 * np.pi * f * 2.4 * t) * np.exp(-t * 160)
    return np.stack([s, s]).astype(np.float32) * 0.35


RISER, BOOM = riser(), boom()
for s in scenes:
    st = s["start"] / FPS
    if s["kind"] == "chapter":
        add(sfx, int((st - RISER.shape[1] / SR + 0.15) * SR), RISER * 0.55)
        add(sfx, int((st + 0.12) * SR), BOOM * 0.9)
        prog = PROGS[s["chapter"] % 3]
        for k, m in enumerate(sorted(set(prog[0][0]))[-4:]):
            add(shimmer, int((st + 0.15 + k * 0.07) * SR), ep_note(m + 24, 0.5, 0.6))
    elif s["id"] not in ("hook",):
        w = whoosh()
        add(sfx, int((st - 0.35) * SR), w * 0.5)

# тиканье во время «подумайте» пауз в мини-тесте
for ln in quiz["lines"]:
    if ln.get("pause", 0) > 0:
        a = (quiz["start"] + ln["start"]) / FPS - ln["pause"]
        k = 0
        tt = a + 0.25
        while tt < a + ln["pause"] - 0.2:
            add(sfx, int(tt * SR), tick(k % 2 == 0))
            tt += 0.5
            k += 1

# ───────────────────────── реверберация ─────────────────────────
def impulse(rt60=2.8, pre=0.025):
    n = int((rt60 + pre) * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((2, n)) * np.exp(-t / (rt60 / 6.9))
    ir[:, : int(pre * SR)] = 0
    ir = sosfilt(butter(1, 5000, "low", fs=SR, output="sos"), ir, axis=1)
    return (ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True))).astype(np.float32)


IR = impulse()
send = pad * 0.35 + ep * 0.55 + drums * 0.08 + shimmer * 0.9
wet = np.stack([oaconvolve(send[c], IR[c])[:N] for c in range(2)]).astype(np.float32)

music = pad * 0.9 + ep * 0.55 + bass * 0.42 + drums * 0.33 + wet * 0.55 + shimmer * 0.4
del pad, ep, bass, drums, wet, send, shimmer
# общий плавный вход и финальное затухание
tt = np.arange(N) / SR
fade = np.clip(tt / 3.0, 0, 1) * np.clip(1 - (tt - (TOTAL - 6.5)) / 6.0, 0, 1)
music *= fade.astype(np.float32)

# ───────────────────────── сведение с голосом ─────────────────────────
with wave.open(os.path.join(ROOT, "public/audio/voice.wav")) as w:
    assert w.getframerate() == SR
    voice = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]

# ducking: под голосом музыка тише на ~11 дБ, плавная атака/отпускание
mask = np.zeros(N, np.float32)
for a, b in TL["speech"]:
    mask[int(max(0, a - 0.12) * SR): int((b + 0.25) * SR)] = 1
# сглаживание: атака 0.15 с, отпускание 0.7 с
def smooth(x, up, down):
    out = np.empty_like(x)
    au, ad = np.exp(-1 / (up * SR / 64)), np.exp(-1 / (down * SR / 64))
    y = 0.0
    xs = x[::64]
    ys = np.empty_like(xs)
    for i, v in enumerate(xs):
        y = (au if v > y else ad) * y + (1 - (au if v > y else ad)) * v
        ys[i] = y
    out[:] = np.repeat(ys, 64)[: len(x)]
    return out


duck = 1 - 0.62 * smooth(mask, 0.15, 0.7)
music_level = 0.30
mix = np.stack([voice, voice]) + music * (music_level * duck) + sfx * 0.22
peak = np.abs(mix).max()
mix = mix / max(peak, 1e-6) * 0.95
tmp = os.path.join(HERE, ".cache", "mix_raw.wav")
with wave.open(tmp, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(mix.T, -1, 1) * 32767).astype(np.int16).tobytes())
# музыка отдельно (для превью)
mtmp = os.path.join(HERE, ".cache", "music_only.wav")
with wave.open(mtmp, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    m = music / max(np.abs(music).max(), 1e-6) * 0.9
    w.writeframes((np.clip(m.T, -1, 1) * 32767).astype(np.int16).tobytes())
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
                "-ar", str(SR), "-ac", "2", "-t", f"{TOTAL:.3f}", os.path.join(ROOT, "public/audio/mix.wav")], check=True)
print("ok", TOTAL)
