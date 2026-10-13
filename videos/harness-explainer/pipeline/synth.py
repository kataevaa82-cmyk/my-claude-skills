"""Синтез озвучки (RHVoice · Tatiana) по фразам и сборка таймлайна.

Выход:
  public/audio/voice.wav        — вся дорожка голоса, 48 кГц моно
  src/timeline.json             — сцены, фразы, кадры начала/конца, субтитры
  pipeline/.cache/*.wav         — кэш синтеза по хэшу текста
"""
import hashlib
import json
import os
import subprocess
import sys
import wave
from concurrent.futures import ThreadPoolExecutor

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from pron import caption_text, load_probe, tts_text, yandex_text  # noqa: E402
from script import CHAPTERS, SCENES  # noqa: E402

FPS = 30
SR = 48000
# движок озвучки: yandex (SpeechKit, нужен YANDEX_API_KEY) или rhvoice (офлайн)
ENGINE = os.environ.get("TTS_ENGINE", "yandex" if os.environ.get("YANDEX_API_KEY") else "rhvoice")
VOICE = os.environ.get("TTS_VOICE", "alena" if ENGINE == "yandex" else "mikhail")
RATE = os.environ.get("TTS_RATE", "100")  # скорость RHVoice, %
EMOTION = os.environ.get("TTS_EMOTION", "good")
SPEED = os.environ.get("TTS_SPEED", "1.0")
CACHE = os.path.join(HERE, ".cache")
os.makedirs(CACHE, exist_ok=True)

GAP = 0.42          # пауза между фразами внутри сцены
LEAD = 0.55         # тишина в начале сцены
TAIL = 0.75         # тишина в конце сцены
CH_LEAD, CH_TAIL = 0.9, 1.3   # для карточек глав
INTRO_PAD = 1.2     # тишина перед самой первой фразой ролика
OUTRO_PAD = 4.0     # хвост после последней фразы (музыка затухает)


def yandex_raw(text, raw_path):
    """Yandex SpeechKit v1: LPCM 48 кГц → WAV."""
    import urllib.parse
    import urllib.request
    data = urllib.parse.urlencode(dict(text=text, lang="ru-RU", voice=VOICE, emotion=EMOTION, speed=SPEED,
                                       format="lpcm", sampleRateHertz=str(SR))).encode()
    req = urllib.request.Request("https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize", data=data,
                                 headers={"Authorization": "Api-Key " + os.environ["YANDEX_API_KEY"]})
    for attempt in range(5):
        try:
            pcm = urllib.request.urlopen(req, timeout=120).read()
            break
        except Exception as e:  # сеть/лимиты — повторяем с паузой
            if attempt == 4:
                raise
            import time
            time.sleep(2 ** attempt)
    with wave.open(raw_path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm)


def synth(text):
    key = hashlib.sha1((ENGINE + "|" + VOICE + "|" + EMOTION + "|" + SPEED + "|" + RATE + "|" + text).encode()).hexdigest()[:16]
    out = os.path.join(CACHE, key + ".wav")
    if not os.path.exists(out):
        raw = out + ".raw.wav"
        if ENGINE == "yandex":
            yandex_raw(text, raw)
        else:
            subprocess.run(["RHVoice-test", "-q", "max", "-p", VOICE, "-r", RATE, "-o", raw], input=text.encode(), check=True)
        # 24 кГц → 48 кГц, срез НЧ-гула, лёгкое «присутствие», обрезка тишины по краям
        subprocess.run([
            "ffmpeg", "-v", "error", "-y", "-i", raw, "-af",
            "aresample=48000:resampler=soxr,"
            "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02,"
            "areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse",
            "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", out], check=True)
        os.unlink(raw)
    return out


def read_wav(path):
    with wave.open(path) as w:
        assert w.getframerate() == SR and w.getnchannels() == 1
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768


def main():
    probe = load_probe()
    jobs = []
    for s in SCENES:
        for line in s["lines"]:
            t = line if isinstance(line, str) else line["t"]
            jobs.append(yandex_text(t) if ENGINE == "yandex" else tts_text(t, probe))
    print("engine:", ENGINE, VOICE, "lines:", len(jobs), "chars:", sum(map(len, jobs)), flush=True)
    with ThreadPoolExecutor(max_workers=4) as ex:
        paths = list(ex.map(synth, jobs))

    t = INTRO_PAD
    timeline, pieces, k = [], [], 0
    for s in SCENES:
        is_ch = s["kind"] == "chapter"
        start = t
        t += CH_LEAD if is_ch else LEAD
        lines = []
        for i, line in enumerate(s["lines"]):
            text = line if isinstance(line, str) else line["t"]
            pause = 0 if isinstance(line, str) else line.get("pause", 0)
            if i > 0:
                t += GAP
            t += pause
            audio = read_wav(paths[k])
            f0 = round(t * FPS)
            t0 = f0 / FPS  # фраза начинается ровно на кадре
            dur = len(audio) / SR
            pieces.append((t0, audio))
            lines.append(dict(text=caption_text(text), tts=jobs[k], start=f0, end=round((t0 + dur) * FPS),
                              pause=pause))
            t = t0 + dur
            k += 1
        t += CH_TAIL if is_ch else TAIL
        timeline.append(dict(id=s["id"], chapter=s["chapter"], kind=s["kind"], props=s["props"],
                             start=round(start * FPS), end=round(t * FPS), lines=lines))
    # сцены стыкуются кадр в кадр
    for a, b in zip(timeline, timeline[1:]):
        a["end"] = b["start"]
    total = t + OUTRO_PAD
    timeline[-1]["end"] = round(total * FPS)
    for sc in timeline:
        for ln in sc["lines"]:
            ln["start"] -= sc["start"]
            ln["end"] -= sc["start"]
        sc["duration"] = sc["end"] - sc["start"]

    track = np.zeros(int(total * SR) + SR, dtype=np.float32)
    for t0, a in pieces:
        i = int(round(t0 * SR))
        track[i:i + len(a)] += a
    peak = np.abs(track).max()
    track = track / peak * 0.89
    os.makedirs(os.path.join(ROOT, "public/audio"), exist_ok=True)
    tmp = os.path.join(CACHE, "voice_raw.wav")
    with wave.open(tmp, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(track, -1, 1) * 32767).astype(np.int16).tobytes())
    # тембр: срез НЧ-гула и «жужжания» вокодера, тепло и разборчивость, де-эссер, компрессия,
    # немного «комнаты» (свёртка с коротким импульсом), единая громкость -18 LUFS
    chain = ("highpass=f=75,lowpass=f=9500,equalizer=f=170:t=q:w=1:g=2,equalizer=f=2800:t=q:w=1.2:g=1.5,"
             "equalizer=f=6500:t=q:w=1.5:g=-3,deesser=i=0.4,acompressor=threshold=-22dB:ratio=2.5:attack=6:release=120:makeup=2")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-i", os.path.join(HERE, "room_ir.wav"), "-filter_complex",
                    f"[0]{chain},asplit[d][w];[1]pan=mono|c0=c0[ir];[w][ir]afir=dry=0:wet=1[r];"
                    "[d][r]amix=inputs=2:weights='1 0.18':normalize=0,loudnorm=I=-18:TP=-2:LRA=9",
                    "-ar", str(SR), "-ac", "1", os.path.join(ROOT, "public/audio/voice.wav")], check=True)
    # отметки речи для приглушения музыки
    speech = [(p[0], p[0] + len(p[1]) / SR) for p in pieces]
    json.dump(dict(fps=FPS, durationInFrames=round(total * FPS), chapters=CHAPTERS, scenes=timeline,
                   speech=speech),
              open(os.path.join(ROOT, "src/timeline.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"total {total/60:.2f} min, frames {round(total*FPS)}")


if __name__ == "__main__":
    main()
