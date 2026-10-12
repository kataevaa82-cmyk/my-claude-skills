"""Pause tightening + spectral EQ / de-ess / breath expander for the denoised voice.

usage: voice_master.py in.f32 out.f32 editmap.json
in/out: mono float32 48 kHz raw.
"""
import json
import sys
import numpy as np

SR = 48000


def frame_db(x, hop=480):
    fr = x[: len(x) // hop * hop].reshape(-1, hop)
    return 10 * np.log10((fr ** 2).mean(1) + 1e-12)


def runs(b):
    out, s = [], 0
    for i in range(1, len(b) + 1):
        if i == len(b) or b[i] != b[s]:
            out.append((bool(b[s]), s, i))
            s = i
    return out


def find_pauses(x, thr_db=-45.0):
    db = frame_db(x)  # 10 ms frames
    sp = db > thr_db
    for v, s, e in runs(sp):
        if not v and e - s < 6 and s > 0:
            sp[s:e] = True
    for v, s, e in runs(sp):
        if v and e - s < 4:
            sp[s:e] = False
    return [(s / 100, e / 100) for v, s, e in runs(sp) if not v and e - s >= 15], len(db) / 100


def tighten(x, pauses, total):
    """Shorten pauses: keep KEEP_IN seconds inside sentences, KEEP_LONG for long breaks."""
    segs = []  # (src_start, src_end) kept
    cur = 0.0
    lead_pad = 0.06
    for (ps, pe) in pauses:
        dur = pe - ps
        if ps < 0.05:  # leading silence: trim to a short pad
            cur = max(0.0, pe - lead_pad)
            continue
        if pe >= total - 0.05:  # trailing silence
            segs.append((cur, min(total, ps + 0.25)))
            cur = None
            break
        keep = 0.22 if dur >= 0.5 else 0.13
        if dur <= keep + 0.03:
            continue
        cut_s = ps + keep * 0.55
        cut_e = pe - keep * 0.45
        segs.append((cur, cut_s))
        cur = cut_e
    if cur is not None:
        segs.append((cur, total))
    xf = int(0.012 * SR)
    fade_in = np.linspace(0, 1, xf, dtype=np.float32)
    out = []
    mapping = []
    pos = 0
    for i, (a, b) in enumerate(segs):
        seg = x[int(a * SR): int(b * SR)].copy()
        if i > 0 and len(out):
            # crossfade with tail of previous output
            prev = out[-1]
            n = min(xf, len(prev), len(seg))
            prev[-n:] = prev[-n:] * fade_in[::-1][:n] + seg[:n] * fade_in[:n]
            seg = seg[n:]
            mapping.append({"src": a, "src_end": b, "dst": (pos - n) / SR})
            pos += len(seg)
        else:
            mapping.append({"src": a, "src_end": b, "dst": pos / SR})
            pos += len(seg)
        out.append(seg)
    return np.concatenate(out), mapping


def stft(x, n=2048, hop=512):
    w = np.sqrt(np.hanning(n + 1)[:n]).astype(np.float32)
    pad = np.concatenate([np.zeros(n, np.float32), x, np.zeros(n, np.float32)])
    T = (len(pad) - n) // hop + 1
    idx = np.arange(n)[None, :] + hop * np.arange(T)[:, None]
    return np.fft.rfft(pad[idx] * w, axis=1), w, len(x)


def istft(S, w, length, n=2048, hop=512):
    fr = np.fft.irfft(S, n=n, axis=1) * w
    out = np.zeros(hop * (S.shape[0] - 1) + n, np.float64)
    norm = np.zeros_like(out)
    for t in range(S.shape[0]):
        out[t * hop: t * hop + n] += fr[t]
        norm[t * hop: t * hop + n] += w ** 2
    out /= np.maximum(norm, 1e-6)
    return out[n: n + length].astype(np.float32)


def eq_curve(freqs):
    # corrective EQ (dB) from LTAS analysis vs. polished speech target (~65% of the difference)
    pts = [(20, -12), (70, -6), (110, 0), (160, 0.5), (250, 1.5), (330, 1.5), (450, 0), (650, 0.5),
           (800, 3), (1000, 6), (1300, 7), (1700, 6), (2100, 4), (2600, 4.5),
           (3200, 4), (4000, 2), (5000, -1), (6300, -4.5), (8000, -2), (10000, 3),
           (12500, 3.5), (15000, 2.0), (20000, 0), (24000, 0)]
    lf = np.log10(np.maximum(freqs, 1.0))
    px = np.log10([p[0] for p in pts])
    py = np.array([p[1] for p in pts])
    return np.interp(lf, px, py)


def smooth(g, a_att, a_rel):
    out = np.empty_like(g)
    s = g[0]
    for i, v in enumerate(g):
        a = a_att if v < s else a_rel
        s = a * s + (1 - a) * v
        out[i] = s
    return out


def process(x):
    n, hop = 2048, 512
    S, w, L = stft(x, n, hop)
    f = np.fft.rfftfreq(n, 1 / SR)
    S *= (10 ** (eq_curve(f) / 20))[None, :]
    P = np.abs(S) ** 2
    frame_dt = hop / SR
    # de-esser: sibilant band energy vs body
    sib = P[:, (f >= 4500) & (f < 11000)].sum(1)
    body = P[:, (f >= 200) & (f < 4000)].sum(1) + 1e-12
    ratio_db = 10 * np.log10(sib / body + 1e-12)
    over = np.clip(ratio_db - (-6.0), 0, None)  # dB above threshold
    red_db = -np.minimum(over * 0.6, 8.0)
    red_db = smooth(red_db, np.exp(-frame_dt / 0.002), np.exp(-frame_dt / 0.06))
    sib_mask = np.clip((f - 3500) / 1500, 0, 1) * np.clip((11000 - f) / 2500, 0, 1)  # sibilant band only
    S *= 10 ** ((red_db[:, None] * sib_mask[None, :]) / 20)
    # breath / floor expander (relative to speech level)
    lvl = 10 * np.log10((np.abs(S) ** 2).sum(1) + 1e-12)
    ref = np.percentile(lvl, 75)
    below = np.clip((ref - 32.0) - lvl, 0, None)
    g_db = -np.minimum(below * 1.2, 14.0)
    g_db = smooth(g_db, np.exp(-frame_dt / 0.03), np.exp(-frame_dt / 0.005))
    S *= (10 ** (g_db / 20))[:, None]
    return istft(S, w, L, n, hop)


def main():
    inp, outp, mapp = sys.argv[1:4]
    x = np.fromfile(inp, dtype=np.float32)
    pauses, total = find_pauses(x)
    y, mapping = tighten(x, pauses, total)
    z = process(y)
    z.tofile(outp)
    json.dump({"segments": mapping, "src_total": total, "dst_total": len(z) / SR}, open(mapp, "w"), indent=1)
    print("src", round(total, 2), "s -> edited", round(len(z) / SR, 2), "s;", len(mapping), "segments")


if __name__ == "__main__":
    main()
