"""Mix voice (mono) with the music bed (stereo), sidechain-ducking the music under speech.

usage: mix_music.py voice.wav music.wav out.f32 [music_gain_db] [duck_db]
"""
import subprocess
import sys

import numpy as np

SR = 48000


def read(p, ch):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', p, '-ac', str(ch), '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, ch).astype(np.float64)


def main():
    vp, mp, outp = sys.argv[1:4]
    music_db = float(sys.argv[4]) if len(sys.argv) > 4 else -6.0
    duck_db = float(sys.argv[5]) if len(sys.argv) > 5 else -6.5
    v = read(vp, 1)[:, 0]
    m = read(mp, 2)
    n = max(len(v), len(m))
    v = np.pad(v, (0, n - len(v)))
    m = np.pad(m, ((0, n - len(m)), (0, 0)))
    hop = 240  # 5 ms
    fr = v[: n // hop * hop].reshape(-1, hop)
    db = 10 * np.log10((fr ** 2).mean(1) + 1e-12)
    act = np.clip((db + 45) / 20, 0, 1)
    env = np.zeros_like(act)
    s = 0.0
    for i, a in enumerate(act):
        c = 0.35 if a > s else 0.985  # fast attack, slow release
        s = c * s + (1 - c) * a
        env[i] = s
    g = np.repeat(10 ** (duck_db * env / 20), hop)
    g = np.pad(g, (0, n - len(g)), constant_values=g[-1])
    mix = np.stack([v, v], 1) + m * 10 ** (music_db / 20) * g[:, None]
    mix.astype(np.float32).tofile(outp)
    print('mixed', round(n / SR, 2), 's, peak', round(float(np.abs(mix).max()), 3))


if __name__ == '__main__':
    main()
