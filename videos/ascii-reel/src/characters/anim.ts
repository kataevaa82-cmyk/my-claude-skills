import {hash} from '../lib/rng';
import {AUDIO, WORDS, level} from '../story';

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const smooth = (x: number) => {
  const k = clamp(x);
  return k * k * (3 - 2 * k);
};
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
export const backOut = (x: number) => {
  const k = clamp(x);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
};
/** 0→1 with overshoot, starting at `start` seconds */
export const pop = (t: number, start: number, dur = 0.45) => backOut((t - start) / dur);
export const fade = (t: number, start: number, dur = 0.3) => smooth((t - start) / dur);
/** visible window with fade in/out */
export const windowed = (t: number, a: number, b: number, f = 0.3) => Math.min(fade(t, a, f), 1 - fade(t, b - f, f));

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const mixColor = (a: string, b: string, k: number) => {
  const A = hex(a);
  const B = hex(b);
  const m = A.map((v, i) => Math.round(mix(v, B[i], clamp(k))));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
};

/** Is a word being spoken at time t (with tiny margins)? */
export const speaking = (t: number) => WORDS.some((w) => t >= w.start - 0.03 && t <= w.end + 0.06);

/** Mouth openness 0..1 from the voice envelope, gated by word activity. */
export const mouthOpen = (t: number) => {
  if (!speaking(t)) return 0;
  const f = 1 / AUDIO.fps;
  const l = level(t) * 0.55 + level(t - f) * 0.3 + level(t - 2 * f) * 0.15;
  return clamp((l - 0.42) / 0.42);
};

/** Natural blinking: 0 = open, 1 = closed. */
export const blink = (t: number) => {
  let tb = 0.8;
  let i = 0;
  while (tb < t + 1) {
    const d = t - tb;
    if (d >= 0 && d < 0.16) return Math.sin((d / 0.16) * Math.PI);
    tb += 2.6 + hash(i, 99) * 2.2;
    i++;
  }
  return 0;
};
