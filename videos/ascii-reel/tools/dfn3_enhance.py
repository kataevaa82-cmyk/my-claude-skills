"""DeepFilterNet3 offline enhancement with onnxruntime + numpy DSP (port of libDF/df.enhance)."""
import sys
import numpy as np
import onnxruntime as ort

SR, FFT, HOP, NB_ERB, NB_DF, ORDER, DF_LA, CONV_LA = 48000, 960, 480, 32, 96, 5, 2, 2
ALPHA = 0.99  # calc_norm_alpha(48000, 480, tau=1) rounded like libDF


def freq2erb(f):
    return 9.265 * np.log1p(f / (24.7 * 9.265))


def erb2freq(e):
    return 24.7 * 9.265 * (np.exp(e / 9.265) - 1.0)


def erb_widths(sr=SR, fft=FFT, nb=NB_ERB, min_nb=2):
    fw = sr / fft
    lo, hi = freq2erb(0.0), freq2erb(sr / 2)
    step = (hi - lo) / nb
    erb, prev, over = [], 0, 0
    for i in range(1, nb + 1):
        fb = int(round(erb2freq(lo + i * step) / fw))
        n = fb - prev - over
        if n < min_nb:
            over = min_nb - n
            n = min_nb
        else:
            over = 0
        erb.append(n)
        prev = fb
    erb[-1] += 1
    too = sum(erb) - (fft // 2 + 1)
    if too > 0:
        erb[-1] -= too
    assert sum(erb) == fft // 2 + 1
    return np.array(erb)


def vorbis_window(n):
    i = np.arange(n)
    return np.sin(0.5 * np.pi * np.sin(np.pi * (i + 0.5) / n) ** 2).astype(np.float32)


def analysis(x, win):
    # libDF frame_analysis: buffer = [prev (FFT-HOP) samples, new HOP samples]
    n_frames = len(x) // HOP
    padded = np.concatenate([np.zeros(FFT - HOP, np.float32), x[: n_frames * HOP]])
    idx = np.arange(FFT)[None, :] + HOP * np.arange(n_frames)[:, None]
    frames = padded[idx] * win
    return (np.fft.rfft(frames, axis=1) / FFT).astype(np.complex64)


def synthesis(spec, win):
    frames = np.fft.irfft(spec, n=FFT, axis=1) * FFT * win
    n = spec.shape[0]
    out = np.zeros((n + 1) * HOP, np.float32)
    for t in range(n):
        out[t * HOP: t * HOP + FFT] += frames[t]
    # libDF emits first HOP samples of each OLA'd frame -> output frame t = out[t*HOP:(t+1)*HOP]
    return out[: n * HOP]


def main(inp, outp, atten_lim_db=None, model_dir=None):
    raw = np.fromfile(inp, dtype=np.float32)
    orig_len = len(raw)
    x = np.concatenate([raw, np.zeros(FFT, np.float32)])  # pad like enhance(pad=True)
    win = vorbis_window(FFT)
    spec = analysis(x, win)  # [T, 481]
    T = spec.shape[0]
    widths = erb_widths()
    # ERB features (band mean power, dB, exponential mean norm)
    pw = (spec.real ** 2 + spec.imag ** 2)
    bands = np.split(pw, np.cumsum(widths)[:-1], axis=1)
    erb = np.stack([b.mean(1) for b in bands], 1)
    erb_db = 10 * np.log10(erb + 1e-10)
    state = np.linspace(-60.0, -90.0, NB_ERB).astype(np.float32)
    feat_erb = np.zeros_like(erb_db, dtype=np.float32)
    for t in range(T):
        state = erb_db[t] * (1 - ALPHA) + state * ALPHA
        feat_erb[t] = (erb_db[t] - state) / 40.0
    # complex unit-norm features for the first NB_DF bins
    us = np.linspace(0.001, 0.0001, NB_DF).astype(np.float32)
    feat_spec = np.zeros((T, NB_DF), np.complex64)
    mag = np.abs(spec[:, :NB_DF])
    for t in range(T):
        us = mag[t] * (1 - ALPHA) + us * ALPHA
        feat_spec[t] = spec[t, :NB_DF] / np.sqrt(us)

    # pad_feat: drop CONV_LA leading frames, append zeros (model lookahead)
    fe = np.concatenate([feat_erb[CONV_LA:], np.zeros((CONV_LA, NB_ERB), np.float32)])
    fs = np.concatenate([feat_spec[CONV_LA:], np.zeros((CONV_LA, NB_DF), np.complex64)])
    fe = fe[None, None].astype(np.float32)
    fs = np.stack([fs.real, fs.imag], 0)[None].astype(np.float32)

    so = ort.SessionOptions()
    so.intra_op_num_threads = 4
    d = model_dir
    enc = ort.InferenceSession(d + "/enc.onnx", so, providers=["CPUExecutionProvider"])
    erbd = ort.InferenceSession(d + "/erb_dec.onnx", so, providers=["CPUExecutionProvider"])
    dfd = ort.InferenceSession(d + "/df_dec.onnx", so, providers=["CPUExecutionProvider"])
    e0, e1, e2, e3, emb, c0, lsnr = enc.run(None, {"feat_erb": fe, "feat_spec": fs})
    (m,) = erbd.run(["m"], {"emb": emb, "e3": e3, "e2": e2, "e1": e1, "e0": e0})
    coefs = dfd.run(["coefs"], {"emb": emb, "c0": c0})[0][0]  # [T, 96, 10]
    m = m[0, 0]  # [T, 32]
    gains = np.repeat(m, widths, axis=1)  # ERB inverse fb (indicator)
    spec_m = spec * gains
    # deep filter on noisy spectrum (first NB_DF bins): frames t-2..t+2
    c = coefs.reshape(T, NB_DF, ORDER, 2)
    c = c[..., 0] + 1j * c[..., 1]  # [T, F, O]
    pad_before = ORDER - 1 - DF_LA
    sp = np.concatenate([np.zeros((pad_before, NB_DF), np.complex64), spec[:, :NB_DF],
                         np.zeros((DF_LA, NB_DF), np.complex64)])
    df_out = np.zeros((T, NB_DF), np.complex64)
    for n in range(ORDER):
        df_out += sp[n: n + T] * c[:, :, n]
    spec_e = spec_m.copy()
    spec_e[:, :NB_DF] = df_out
    if atten_lim_db is not None:
        lim = 10 ** (-abs(atten_lim_db) / 20)
        spec_e = spec * lim + spec_e * (1 - lim)
    y = synthesis(spec_e, win)
    dly = FFT - HOP
    y = y[dly: dly + orig_len]
    y.astype(np.float32).tofile(outp)
    print("frames", T, "lsnr mean", float(lsnr.mean()), "mask mean", float(m.mean()))


if __name__ == "__main__":
    lim = float(sys.argv[4]) if len(sys.argv) > 4 else None
    main(sys.argv[1], sys.argv[2], lim, sys.argv[3])
