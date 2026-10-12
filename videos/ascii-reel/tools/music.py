"""Original cinematic underscore synthesised with numpy, cued to the story beats of the voiceover.

usage: music.py transcript.ts duration_s out.wav
Sections: warm intro → study pulse → 2022 drop (minor, boom on "закрылся") → Yandex lift →
success groove + money sparkle → crash impact & glitch → mysterious RuStore/VK pluck → warm resolve.
"""
import json
import re
import sys
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def load_times(ts_path):
    src = open(ts_path, encoding="utf-8").read()
    words = json.loads(re.search(r"WORDS: Word\[\] = (.*);", src).group(1))
    index = {int(k): v for k, v in json.loads(re.search(r"SRC_INDEX: Record<number, number> = (.*);", src).group(1)).items()}

    def at(i):
        while i > 0 and i not in index:
            i -= 1
        return words[index[i]]["start"]

    return at


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env_adsr(n, a, d, s, r, sustain_len):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    s_n = max(0, int(sustain_len * SR) - a_n - d_n)
    e = np.concatenate([
        np.linspace(0, 1, max(1, a_n)),
        np.linspace(1, s, max(1, d_n)),
        np.full(s_n, s),
        np.linspace(s, 0, max(1, r_n)),
    ])
    if len(e) < n:
        e = np.concatenate([e, np.zeros(n - len(e))])
    return e[:n]


def fft_filter(x, lo=None, hi=None, slope=1.0):
    """zero-phase brickwall-ish band filter with soft edges (works on mono or stereo [n,2])"""
    X = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(x.shape[0], 1 / SR)
    g = np.ones_like(f)
    if hi:
        g *= 1 / (1 + (f / hi) ** (4 * slope))
    if lo:
        g *= 1 / (1 + (lo / np.maximum(f, 1)) ** (4 * slope))
    if x.ndim == 2:
        g = g[:, None]
    return np.fft.irfft(X * g, n=x.shape[0], axis=0)


class Mix:
    def __init__(self, dur):
        self.n = int(dur * SR) + SR * 4
        self.dry = np.zeros((self.n, 2))
        self.wet = np.zeros((self.n, 2))  # reverb send

    def add(self, t, sig, pan=0.0, gain=1.0, send=0.3):
        i = int(t * SR)
        if i >= self.n or i + len(sig) <= 0:
            return
        sig = sig[: self.n - i]
        l = np.cos((pan + 1) * np.pi / 4) * gain
        r = np.sin((pan + 1) * np.pi / 4) * gain
        st = np.stack([sig * l, sig * r], 1)
        self.dry[i: i + len(sig)] += st
        self.wet[i: i + len(sig)] += st * send


# ── instruments ───────────────────────────────────────────────────────
def saw(freq, n, detune=0.0, phase=0.0):
    t = np.arange(n) / SR
    ph = (freq * (1 + detune) * t + phase) % 1.0
    return 2 * ph - 1


def pad_note(m, dur, bright=1.0):
    n = int((dur + 1.6) * SR)
    f = mtof(m)
    v = sum(saw(f, n, d, rng.random()) for d in (-0.006, -0.002, 0.003, 0.007)) / 4
    v += 0.4 * np.sin(2 * np.pi * f / 2 * np.arange(n) / SR)
    v = fft_filter(v, hi=900 + 1800 * bright, lo=70)
    return v * env_adsr(n, 0.9, 0.6, 0.75, 1.5, dur)


def piano(m, vel=0.6, dur=2.5):
    n = int((dur + 0.5) * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    out = np.zeros(n)
    for k in range(1, 9):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        if fk > 12000:
            break
        amp = (0.9 / k ** 1.25) * (0.6 + 0.4 * vel)
        dec = 1.6 / (1 + 0.55 * k) * (1.4 - 0.004 * m)
        out += amp * np.sin(2 * np.pi * fk * t + rng.random() * 6) * np.exp(-t / max(0.08, dec))
    att = np.minimum(1, t / 0.004)
    thump = fft_filter(rng.standard_normal(n) * np.exp(-t / 0.012), hi=900) * 0.12
    rel = np.where(t > dur, np.exp(-(t - dur) / 0.25), 1.0)
    return (out * att + thump) * rel * vel


def pluck(m, vel=0.6):
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    v = sum((0.7 / k) * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (6 + 5 * k)) for k in range(1, 6))
    return v * np.minimum(1, t / 0.002) * vel


def bell(m, vel=0.5):
    n = int(3.5 * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    v = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d) for r, a, d in ((1, 1, 1.6), (2.76, 0.45, 0.8), (5.4, 0.25, 0.4), (8.93, 0.12, 0.2)))
    return v * np.minimum(1, t / 0.002) * vel


def bass(m, dur, vel=0.8):
    n = int((dur + 0.2) * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    v = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    v = np.tanh(1.6 * v)
    return v * env_adsr(n, 0.01, 0.15, 0.8, 0.12, dur) * vel


def kick(vel=1.0):
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    f = 45 + 95 * np.exp(-t / 0.045)
    ph = 2 * np.pi * np.cumsum(f) / SR
    v = np.sin(ph) * np.exp(-t / 0.22) + 0.3 * rng.standard_normal(n) * np.exp(-t / 0.004)
    return np.tanh(1.5 * v) * vel


def clap(vel=0.6):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    e = sum(np.exp(-np.maximum(0, t - d) / 0.012) * (t >= d) for d in (0, 0.011, 0.023)) + 0.6 * np.exp(-t / 0.12)
    return fft_filter(rng.standard_normal(n) * e, lo=900, hi=6000) * vel


def tick(vel=0.3, tone=7000):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    return fft_filter(rng.standard_normal(n) * np.exp(-t / 0.018), lo=tone, hi=14000) * vel


def boom(vel=1.0, length=3.0):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = 30 + 60 * np.exp(-t / 0.18)
    v = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.1)
    v += fft_filter(rng.standard_normal(n) * np.exp(-t / 0.35), hi=500) * 0.6
    return np.tanh(1.3 * v) * vel


def riser(length=2.0, vel=0.5):
    n = int(length * SR)
    t = np.arange(n) / SR
    k = t / length
    noise = rng.standard_normal(n)
    # sweep: progressively brighter by mixing band-limited layers
    lo = fft_filter(noise, hi=600)
    hi_ = fft_filter(noise, lo=2000, hi=9000)
    v = lo * (1 - k) + hi_ * k
    tone = np.sin(2 * np.pi * np.cumsum(200 + 900 * k ** 2) / SR) * 0.25
    return (v * 0.6 + tone) * (k ** 2) * vel


def reverse_swell(m_list, length=1.6, vel=0.5):
    sig = sum(pad_note(m, 0.6, 1.4) for m in m_list)
    n = int(length * SR)
    sig = sig[:n] if len(sig) >= n else np.concatenate([sig, np.zeros(n - len(sig))])
    t = np.arange(n) / SR
    return (sig * np.exp(-t / 0.5))[::-1] * vel


def make_ir(length=2.6):
    n = int(length * SR)
    t = np.arange(n) / SR
    ir = np.stack([rng.standard_normal(n), rng.standard_normal(n)], 1) * np.exp(-t / 0.55)[:, None]
    ir = fft_filter(ir, hi=6500, lo=120)
    ir[: int(0.012 * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum())


def convolve(x, ir):
    n = x.shape[0] + ir.shape[0]
    nfft = 1 << (n - 1).bit_length()
    out = np.zeros((x.shape[0], 2))
    for c in range(2):
        y = np.fft.irfft(np.fft.rfft(x[:, c], nfft) * np.fft.rfft(ir[:, c], nfft), nfft)
        out[:, c] = y[: x.shape[0]]
    return out


# ── score ─────────────────────────────────────────────────────────────
CH = {
    'Dmaj7': [50, 57, 61, 66], 'Bm7': [47, 54, 57, 62], 'G': [43, 50, 59, 62], 'A': [45, 52, 61, 64],
    'Em7': [52, 59, 62, 67], 'F#': [42, 49, 58, 61], 'Gmaj7': [43, 50, 54, 59, 61], 'Asus': [45, 52, 57, 62],
    'Bm9': [47, 54, 57, 61, 62], 'Dadd9': [50, 57, 64, 66], 'D': [50, 57, 62, 66], 'Bm': [47, 54, 59, 62],
    'Em': [40, 52, 59, 64], 'F#sus': [42, 49, 54, 59],
}


def main():
    ts_path, dur, out_path = sys.argv[1], float(sys.argv[2]), sys.argv[3]
    at = load_times(ts_path)
    mix = Mix(dur)
    T = {
        'study': at(12) - 0.15, 'y2022': at(25) - 0.15, 'closed': at(33), 'yandex': at(47) - 0.15, 'ya': at(54),
        'success': at(66) - 0.15, 'money': at(87), 'crash': at(93), 'curse': at(97), 'rustore': at(98) - 0.15,
        'vk': at(105) - 0.15, 'kontakt': at(112), 'outro': at(130) - 0.15, 'end': dur,
    }

    def chords(seq, t0, t1, bar, bright=1.0, gain=0.22):
        t = t0
        i = 0
        while t < t1 - 0.05:
            name = seq[i % len(seq)]
            d = min(bar, t1 - t)
            for k, m in enumerate(CH[name]):
                mix.add(t, pad_note(m, d, bright), pan=(k - 1.5) * 0.3, gain=gain, send=0.45)
            t += bar
            i += 1

    def arp(seq, t0, t1, bar, step, octave=12, vel=0.5, gain=0.35, inst=piano):
        t = t0
        k = 0
        while t < t1 - 0.02:
            name = seq[int((t - t0) // bar) % len(seq)]
            notes = sorted(CH[name])[1:] + [CH[name][1] + 12]
            m = notes[k % len(notes)] + octave
            mix.add(t, inst(m, vel * (0.85 + 0.15 * ((k % 4) == 0))), pan=0.35 * np.sin(k * 1.3), gain=gain, send=0.35)
            t += step
            k += 1

    # A: warm intro / dream
    chords(['Dmaj7', 'Bm7'], 0.0, T['study'], 2.4, bright=0.8, gain=0.2)
    arp(['Dmaj7', 'Bm7'], 0.15, T['study'], 2.4, 0.3, vel=0.45, gain=0.3)
    for i, tt in enumerate(np.arange(0.0, T['study'], 1.2)):
        mix.add(tt, bell(78 if i % 2 else 81, 0.25), pan=0.5, gain=0.18, send=0.7)

    # B: study — clock ticks + rising arp
    chords(['G', 'A', 'Dmaj7', 'Bm7'], T['study'], T['y2022'], 1.6, bright=1.0, gain=0.2)
    arp(['G', 'A', 'Dmaj7', 'Bm7'], T['study'], T['y2022'], 1.6, 0.2, vel=0.5, gain=0.3)
    for k, tt in enumerate(np.arange(T['study'], T['y2022'], 0.2)):
        mix.add(tt, tick(0.35 if k % 2 == 0 else 0.18), pan=-0.3, gain=0.5, send=0.1)
    mix.add(T['y2022'] - 1.6, reverse_swell(CH['Bm'], 1.6, 0.7), gain=0.4, send=0.3)

    # C: 2022 — minor drop, boom on "закрылся"
    chords(['Bm', 'G', 'Em', 'F#sus'], T['y2022'], T['yandex'], 2.1, bright=0.45, gain=0.24)
    for i, tt in enumerate(np.arange(T['y2022'] + 0.4, T['yandex'] - 0.5, 1.05)):
        name = ['Bm', 'G', 'Em', 'F#sus'][int((tt - T['y2022']) // 2.1) % 4]
        mix.add(tt, piano(CH[name][2] + 12, 0.38, 1.8), pan=0.2, gain=0.3, send=0.6)
    mix.add(T['y2022'], boom(0.7, 2.5), gain=0.45, send=0.25)
    mix.add(T['closed'] - 1.2, reverse_swell(CH['F#'], 1.2, 0.8), gain=0.35, send=0.3)
    mix.add(T['closed'], boom(1.0, 3.5), gain=0.75, send=0.35)
    mix.add(T['yandex'] - 2.2, riser(2.2, 0.6), gain=0.35, send=0.4)

    # D: Yandex — lift, soft pulse
    beat = 0.6
    chords(['G', 'D', 'Em7', 'A'], T['yandex'], T['success'], 1.65, bright=1.2, gain=0.22)
    arp(['G', 'D', 'Em7', 'A'], T['yandex'], T['success'], 1.65, 0.275, vel=0.5, gain=0.28)
    for k, tt in enumerate(np.arange(T['yandex'], T['success'] - 0.1, beat)):
        if k % 2 == 0:
            mix.add(tt, kick(0.7), gain=0.5, send=0.05)
        mix.add(tt + beat / 2, tick(0.25, 5000), pan=0.3, gain=0.5, send=0.1)
    mix.add(T['ya'], bell(81, 0.6), pan=0.3, gain=0.35, send=0.6)
    mix.add(T['success'] - 1.8, riser(1.8, 0.7), gain=0.4, send=0.4)

    # E: success groove → money sparkle
    beat = 0.5
    prog = ['D', 'A', 'Bm', 'G']
    roots = {'D': 38, 'A': 33, 'Bm': 35, 'G': 31}
    chords(prog, T['success'], T['crash'] - 0.05, 2.0, bright=1.4, gain=0.2)
    arp(prog, T['success'], T['crash'] - 0.05, 2.0, 0.25, vel=0.55, gain=0.28, inst=pluck, octave=24)
    for k, tt in enumerate(np.arange(T['success'], T['crash'] - 0.05, beat)):
        mix.add(tt, kick(0.9), gain=0.62, send=0.03)
        if k % 2 == 1:
            mix.add(tt, clap(0.55), pan=0.05, gain=0.5, send=0.25)
        mix.add(tt + beat / 2, tick(0.3, 6000), pan=-0.25, gain=0.5, send=0.05)
        name = prog[int((tt - T['success']) // 2.0) % 4]
        mix.add(tt, bass(roots[name], beat * 0.9, 0.8), gain=0.32, send=0.02)
    for k, tt in enumerate(np.arange(T['money'], T['crash'] - 0.05, 0.125)):
        mix.add(tt, bell(86 + [0, 4, 7, 12][k % 4], 0.3), pan=np.sin(k) * 0.6, gain=0.16, send=0.6)

    # F: crash — impact, silence, glitch stutter, scratch on the curse
    mix.add(T['crash'] - 0.35, reverse_swell(CH['D'], 0.35, 0.9), gain=0.5)
    mix.add(T['crash'], boom(1.2, 4.0), gain=0.95, send=0.4)
    noise = fft_filter(rng.standard_normal(int(0.6 * SR)) * np.exp(-np.arange(int(0.6 * SR)) / SR / 0.15), lo=300, hi=8000)
    mix.add(T['crash'], noise, gain=0.4, send=0.4)
    st = kick(0.8)[: int(0.09 * SR)]
    for k in range(6):
        mix.add(T['crash'] + 0.9 + k * 0.11, st * (1 - k / 7), pan=(-1) ** k * 0.4, gain=0.35, send=0.1)
    n = int(0.5 * SR)
    tt_ = np.arange(n) / SR
    scratch = np.sin(2 * np.pi * np.cumsum(900 * np.exp(-tt_ / 0.12) + 60) / SR) * np.exp(-tt_ / 0.25)
    mix.add(T['curse'] - 0.05, scratch, gain=0.3, send=0.2)

    # G: RuStore / VK — curious pluck motif, suspended harmony, soft pulse
    seq = ['Gmaj7', 'Asus', 'Bm9', 'F#sus']
    chords(seq, T['rustore'], T['outro'], 2.4, bright=0.9, gain=0.2)
    motif = [71, 74, 76, 74, 69, 71, 66, 69]
    for k, tt in enumerate(np.arange(T['rustore'] + 0.3, T['outro'] - 0.1, 0.3)):
        mix.add(tt, pluck(motif[k % 8] + (12 if (k // 16) % 2 else 0), 0.55), pan=0.4 * np.sin(k * 0.9), gain=0.3, send=0.45)
    for k, tt in enumerate(np.arange(T['vk'], T['outro'] - 0.1, 0.6)):
        mix.add(tt, kick(0.55), gain=0.45, send=0.03)
        mix.add(tt + 0.3, tick(0.22, 6500), pan=0.25, gain=0.5, send=0.05)
    mix.add(T['rustore'], bell(83, 0.5), pan=-0.3, gain=0.35, send=0.7)
    mix.add(T['kontakt'], bell(78, 0.55), pan=0.3, gain=0.35, send=0.7)
    mix.add(T['outro'] - 1.4, riser(1.4, 0.45), gain=0.3, send=0.4)

    # H: warm resolve
    chords(['Dadd9'], T['outro'], T['end'] + 1.5, 5.0, bright=1.0, gain=0.24)
    for k, m in enumerate([74, 78, 81, 86, 90]):
        mix.add(T['outro'] + k * 0.18, bell(m, 0.45), pan=(k - 2) * 0.25, gain=0.25, send=0.7)
    mix.add(T['outro'], piano(50, 0.6, 3.0), gain=0.35, send=0.5)

    ir = make_ir()
    out = mix.dry + convolve(mix.wet, ir) * 1.1
    out = fft_filter(out, lo=35)
    out = out[: int((dur + 0.1) * SR)]
    # fade in/out
    fi = int(0.4 * SR)
    out[:fi] *= np.linspace(0, 1, fi)[:, None]
    fo = int(1.0 * SR)
    out[-fo:] *= np.linspace(1, 0, fo)[:, None]
    out /= np.max(np.abs(out)) + 1e-9
    out *= 0.9
    pcm = (out * 32767).astype(np.int16)
    with wave.open(out_path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print('music written', out_path, round(len(out) / SR, 2), 's; cues', {k: round(v, 2) for k, v in T.items()})


if __name__ == '__main__':
    main()
