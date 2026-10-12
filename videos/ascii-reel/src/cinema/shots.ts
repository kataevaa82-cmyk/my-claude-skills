import {mix} from '../characters/anim';
import {hash} from '../lib/rng';
import {AUDIO, OUTRO_AT, PHRASES, TOTAL_SECONDS, at} from '../story';

type V3 = [number, number, number];
type Ease = 'inout' | 'out' | 'in' | 'lin';

/** a camera move around the heroine: azimuth (deg, + = camera to her screen-right), elevation (deg), distance (m) */
type Move = {
  az: [number, number];
  el: [number, number];
  d: [number, number];
  ty: [number, number]; // look target height
  fov: [number, number];
  roll?: number; // rad
  ease?: Ease;
  whip?: number; // deg of whip-pan into the NEXT shot
  flash?: boolean; // white flash on the cut into this shot
  shake?: number;
  tx?: number; // look target x offset
};

const MCU = 0.95;
const MS = 1.28;
const WIDE = 1.85;

// one move per spoken phrase (23 phrases)
const MOVES: Move[] = [
  {az: [14, 4], el: [6, 3], d: [MS, MCU], ty: [1.36, 1.41], fov: [32, 30], ease: 'out'}, // Девочки, смотрите
  {az: [32, 14], el: [2, 4], d: [MCU, 0.85], ty: [1.42, 1.43], fov: [30, 30], whip: 26}, // очень долго хотела
  {az: [-10, -2], el: [-12, -6], d: [MCU, 0.8], ty: [1.38, 1.42], fov: [32, 30], ease: 'out'}, // своё приложение
  {az: [-28, -12], el: [30, 20], d: [WIDE, 1.55], ty: [1.22, 1.28], fov: [36, 34], flash: true}, // училась
  {az: [-62, -54], el: [4, 2], d: [0.75, 0.68], ty: [1.45, 1.45], fov: [30, 29], whip: -30}, // думала ... 21-м году
  {az: [0, 0], el: [3, 1], d: [1.05, 0.62], ty: [1.43, 1.45], fov: [31, 29], ease: 'in', flash: true}, // И в 22-м году всё
  {az: [38, 26], el: [6, 4], d: [MS, 1.1], ty: [1.36, 1.38], fov: [32, 31], shake: 0.25}, // Google закрылся
  {az: [-16, -8], el: [-14, -10], d: [0.72, 0.66], ty: [1.43, 1.44], fov: [30, 30], roll: 0.07}, // денег не дадут
  {az: [6, 0], el: [12, 22], d: [MCU, WIDE + 0.3], ty: [1.38, 1.24], fov: [31, 34], ease: 'inout'}, // отложила идею
  {az: [-34, -12], el: [-12, 6], d: [1.2, 0.95], ty: [1.36, 1.41], fov: [33, 31], flash: true, whip: 28}, // есть же Яндекс
  {az: [-30, -38], el: [3, 3], d: [0.7, 0.66], ty: [1.45, 1.45], fov: [30, 30]}, // что же ей будет?
  {az: [-26, 26], el: [6, 6], d: [MS, 1.18], ty: [1.36, 1.37], fov: [32, 32], ease: 'inout'}, // наверное, сделаю
  {az: [0, 0], el: [4, 2], d: [1.2, 0.68], ty: [1.4, 1.45], fov: [32, 29], ease: 'out', flash: true}, // Всё замечательно
  {az: [-42, -28], el: [8, 5], d: [MS, 1.12], ty: [1.36, 1.38], fov: [32, 31], whip: -26}, // модерация
  {az: [12, 4], el: [-18, -12], d: [1.05, 0.85], ty: [1.38, 1.43], fov: [33, 31], ease: 'out'}, // начало работать
  {az: [20, 8], el: [26, 18], d: [1.4, 1.2], ty: [1.3, 1.34], fov: [35, 34]}, // начало приносить
  {az: [0, 0], el: [2, 2], d: [0.85, 0.6], ty: [1.43, 1.45], fov: [30, 28], ease: 'out', flash: true}, // денюжку
  {az: [8, -6], el: [1, 3], d: [0.72, 0.62], ty: [1.44, 1.45], fov: [30, 29], roll: -0.09, shake: 1}, // всё опять пошло по...
  {az: [46, 22], el: [5, 4], d: [MS, 1.1], ty: [1.37, 1.39], fov: [32, 31], flash: true, ease: 'out'}, // RuStore
  {az: [-6, 0], el: [3, 2], d: [1.15, 0.7], ty: [1.4, 1.45], fov: [31, 29], ease: 'inout', whip: 30}, // нужен ли нам Контакт
  {az: [60, 50], el: [3, 3], d: [0.78, 0.7], ty: [1.45, 1.45], fov: [30, 30]}, // как таковой
  {az: [32, -30], el: [8, 5], d: [MS, 1.15], ty: [1.36, 1.38], fov: [32, 32], ease: 'inout'}, // можно выкладывать
  {az: [8, 0], el: [3, 2], d: [1.1, 0.62], ty: [1.41, 1.45], fov: [31, 28], ease: 'out', flash: true}, // Чего думаете вообще?
];

// keep close-ups breathable in the vertical frame (whole face + hair visible)
MOVES.forEach((m) => {
  m.d = [Math.max(0.86, m.d[0]), Math.max(0.86, m.d[1])];
});

export type Shot = Move & {a: number; b: number; blur?: number};
export const SHOTS: Shot[] = MOVES.map((m, i) => ({
  ...m,
  a: i === 0 ? 0 : PHRASES[i].start - 0.12,
  b: i + 1 < PHRASES.length ? PHRASES[i + 1].start - 0.12 : TOTAL_SECONDS + 1,
}));

export const shotAt = (t: number) => {
  let s = SHOTS[0];
  for (const x of SHOTS) if (x.a <= t) s = x;
  return s;
};
const shotIndex = (t: number) => {
  let k = 0;
  SHOTS.forEach((x, i) => {
    if (x.a <= t) k = i;
  });
  return k;
};

const easeFn = (e: Ease | undefined, k: number) => {
  const x = Math.min(1, Math.max(0, k));
  if (e === 'out') return 1 - Math.pow(1 - x, 3);
  if (e === 'in') return x * x * x;
  if (e === 'lin') return x;
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

// punch-in zooms on key words (ASR word indices)
const PUNCH = [32, 33, 54, 77, 91, 97, 104, 112, 129, 131].map((i) => at(i));
export const punchAt = (t: number) => {
  let p = 0;
  for (const tp of PUNCH) {
    const d = t - tp + 0.04;
    if (d < 0 || d > 0.9) continue;
    const v = d < 0.09 ? d / 0.09 : Math.exp(-(d - 0.09) / 0.32);
    p = Math.max(p, v);
  }
  return p;
};

const WHIP = 0.17;

/** whip-pan azimuth offset (deg) and its speed for motion blur */
const whipAt = (t: number) => {
  const i = shotIndex(t);
  const s = SHOTS[i];
  let off = 0;
  let speed = 0;
  if (s.whip && t > s.b - WHIP) {
    const k = (t - (s.b - WHIP)) / WHIP;
    off = s.whip * k * k;
    speed = Math.abs(s.whip) * 2 * k;
  }
  const prev = SHOTS[i - 1];
  if (prev?.whip && t < s.a + WHIP) {
    const k = (t - s.a) / WHIP;
    off = -prev.whip * (1 - k) * (1 - k);
    speed = Math.max(speed, Math.abs(prev.whip) * 2 * (1 - k));
  }
  return {off, speed};
};

/** camera position/target/fov for time t */
export const cameraAt = (t: number) => {
  const s = shotAt(t);
  const k = easeFn(s.ease, (t - s.a) / Math.max(0.4, s.b - s.a));
  const w = whipAt(t);
  const az = ((mix(s.az[0], s.az[1], k) + w.off) * Math.PI) / 180;
  const el = (mix(s.el[0], s.el[1], k) * Math.PI) / 180;
  const d = mix(s.d[0], s.d[1], k);
  const ty = mix(s.ty[0], s.ty[1], k);
  const look: V3 = [s.tx ?? 0, ty, 0.04];
  const pos: V3 = [look[0] + Math.sin(az) * Math.cos(el) * d, ty + Math.sin(el) * d, 0.04 + Math.cos(az) * Math.cos(el) * d];
  // handheld drift
  pos[0] += Math.sin(t * 0.9) * 0.006 + Math.sin(t * 2.3 + 1) * 0.002;
  pos[1] += Math.sin(t * 1.1 + 2) * 0.005 + Math.sin(t * 2.9) * 0.0015;
  const shake = (s.shake ?? 0) + punchAt(t) * 0.35;
  if (shake) {
    const f = Math.floor(t * 30);
    pos[0] += (hash(f, 1) - 0.5) * 0.026 * shake;
    pos[1] += (hash(f, 2) - 0.5) * 0.02 * shake;
  }
  const fov = mix(s.fov[0], s.fov[1], k) * (1 - 0.2 * punchAt(t));
  const flash = s.flash ? Math.max(0, 1 - (t - s.a) / 0.16) : 0;
  return {pos, look, fov, roll: s.roll ?? 0, cutAge: t - s.a, outro: t >= OUTRO_AT, blur: Math.min(16, w.speed * 0.22), flash};
};

/** speech emphasis 0..1 (onset strength), used for nods */
export const emphasis = (t: number) => {
  const i = Math.max(0, Math.min(AUDIO.frames - 1, Math.floor(t * AUDIO.fps)));
  return Math.min(1, (AUDIO.onset[i] ?? 0) * 0.8);
};
