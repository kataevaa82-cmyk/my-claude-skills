"""Per-video-frame audio features for the visualizer: level + log-band spectrum.

usage: audio_features.py in.f32(48k mono) out.json fps bands
"""
import json
import sys
import numpy as np

SR = 48000


def main():
    inp, outp = sys.argv[1], sys.argv[2]
    fps = int(sys.argv[3]) if len(sys.argv) > 3 else 30
    nb = int(sys.argv[4]) if len(sys.argv) > 4 else 32
    x = np.fromfile(inp, dtype=np.float32)
    n_frames = int(np.ceil(len(x) / SR * fps))
    win = 2048
    w = np.hanning(win)
    edges = np.geomspace(90, 11000, nb + 1)
    f = np.fft.rfftfreq(win, 1 / SR)
    band_idx = [np.where((f >= edges[i]) & (f < edges[i + 1]))[0] for i in range(nb)]
    pad = np.concatenate([np.zeros(win), x, np.zeros(win)])
    lv, sp = [], []
    for i in range(n_frames):
        c = int((i + 0.5) / fps * SR) + win
        seg = pad[c - win // 2: c + win // 2] * w
        rms = np.sqrt(np.mean(pad[c - 800: c + 800] ** 2) + 1e-12)
        lv.append(20 * np.log10(rms))
        P = np.abs(np.fft.rfft(seg)) ** 2
        sp.append([10 * np.log10(P[ix].mean() + 1e-12) if len(ix) else -120 for ix in band_idx])
    lv = np.array(lv)
    sp = np.array(sp)
    # normalize: level -> 0..1 (floor -50 dBFS..-8), spectrum -> 0..1 per global range with tilt comp
    lvn = np.clip((lv + 50) / 42, 0, 1)
    tilt = np.linspace(0, 18, nb)  # compensate natural HF roll-off
    spc = sp + tilt[None, :]
    hi = np.percentile(spc, 99.5)
    spn = np.clip((spc - (hi - 55)) / 55, 0, 1)
    # simple onset strength (positive spectral flux)
    flux = np.concatenate([[0], np.clip(np.diff(spn, axis=0), 0, None).sum(1)])
    flux = flux / (np.percentile(flux, 99) + 1e-9)
    out = {
        "fps": fps,
        "frames": n_frames,
        "duration": len(x) / SR,
        "level": [round(float(v), 3) for v in lvn],
        "onset": [round(float(min(v, 1.5)), 3) for v in flux],
        "bands": [[round(float(v), 2) for v in row] for row in spn],
    }
    json.dump(out, open(outp, "w"), separators=(",", ":"))
    print("frames", n_frames, "dur", round(len(x) / SR, 3))


if __name__ == "__main__":
    main()
