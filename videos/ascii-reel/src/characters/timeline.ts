import {OUTRO_AT, at} from '../story';
import {mix, smooth} from './anim';
import type {Emotion, Pose, Vec} from './Heroine';

const E = (o: Partial<Emotion>): Emotion => ({
  browRaise: 0, browTilt: 0, eyeOpen: 1, squint: 0, gazeX: 0, gazeY: 0, smile: 0.35, headTilt: 0, blush: 0.3, ...o,
});

export const EMO = {
  neutral: E({}),
  happy: E({browRaise: 4, squint: 0.4, smile: 1, blush: 0.55}),
  dreamy: E({browRaise: 7, gazeX: 7, gazeY: -9, smile: 0.7, squint: 0.2, headTilt: 5, blush: 0.6}),
  focused: E({browRaise: -2, browTilt: -3, eyeOpen: 0.85, gazeY: 7, smile: 0.15}),
  worried: E({browRaise: 4, browTilt: 7, smile: -0.25, gazeY: 2}),
  sad: E({browRaise: 2, browTilt: 10, eyeOpen: 0.82, smile: -0.75, gazeY: 5, headTilt: -5, blush: 0.1}),
  angry: E({browRaise: -7, browTilt: -11, eyeOpen: 0.92, smile: -0.65, blush: 0.6}),
  shocked: E({browRaise: 13, eyeOpen: 1.22, smile: -0.1, blush: 0.2}),
  thinking: E({browRaise: 3, browTilt: -3, gazeX: 8, gazeY: -9, smile: 0.05, headTilt: 6}),
  confused: E({browRaise: 6, browTilt: 6, gazeX: -6, gazeY: -4, smile: -0.2, headTilt: -7}),
  proud: E({browRaise: 3, squint: 0.35, smile: 0.95, headTilt: 4, blush: 0.5}),
  excited: E({browRaise: 9, eyeOpen: 1.08, smile: 1, blush: 0.7}),
};
type EmoName = keyof typeof EMO;

const REST: Pose = {L: [240, 700], R: [360, 700]};
export const POSES = {
  rest: REST,
  wave: {L: REST.L, R: [520, 280]} as Pose,
  chin: {L: REST.L, R: [318, 402]} as Pose,
  shrug: {L: [92, 470], R: [508, 470], palmUp: 1} as Pose,
  facepalm: {L: REST.L, R: [318, 262]} as Pose,
  cheer: {L: [110, 210], R: [490, 210]} as Pose,
  present: {L: [118, 580], R: [482, 580], palmUp: 1} as Pose,
  pointUp: {L: REST.L, R: [500, 150]} as Pose,
  heart: {L: [270, 452], R: [330, 452]} as Pose,
  fists: {L: [214, 600], R: [386, 600]} as Pose,
};
export type PoseName = keyof typeof POSES;

export type Key<T> = {t: number; v: T};

export const EMO_KEYS: Key<EmoName>[] = [
  {t: 0, v: 'happy'},
  {t: at(4), v: 'dreamy'},
  {t: at(12), v: 'focused'},
  {t: at(25), v: 'worried'},
  {t: at(32), v: 'angry'},
  {t: at(37), v: 'sad'},
  {t: at(47), v: 'thinking'},
  {t: at(55), v: 'confused'},
  {t: at(59), v: 'happy'},
  {t: at(66), v: 'proud'},
  {t: at(80), v: 'happy'},
  {t: at(87), v: 'excited'},
  {t: at(93), v: 'shocked'},
  {t: at(96), v: 'angry'},
  {t: at(99), v: 'thinking'},
  {t: at(106), v: 'confused'},
  {t: at(118), v: 'thinking'},
  {t: at(122), v: 'worried'},
  {t: at(130), v: 'happy'},
];

export const POSE_KEYS: Key<PoseName>[] = [
  {t: 0, v: 'wave'},
  {t: at(4), v: 'heart'},
  {t: at(9), v: 'rest'},
  {t: at(18), v: 'chin'},
  {t: at(25), v: 'rest'},
  {t: at(32), v: 'fists'},
  {t: at(37), v: 'shrug'},
  {t: at(42), v: 'rest'},
  {t: at(47), v: 'chin'},
  {t: at(55), v: 'shrug'},
  {t: at(59), v: 'rest'},
  {t: at(66), v: 'present'},
  {t: at(70), v: 'rest'},
  {t: at(80), v: 'cheer'},
  {t: at(84), v: 'rest'},
  {t: at(87), v: 'cheer'},
  {t: at(93), v: 'fists'},
  {t: at(96), v: 'facepalm'},
  {t: at(99), v: 'rest'},
  {t: at(101), v: 'pointUp'},
  {t: at(105), v: 'chin'},
  {t: at(115), v: 'shrug'},
  {t: at(122), v: 'present'},
  {t: at(126), v: 'shrug'},
  {t: at(130), v: 'present'},
  {t: OUTRO_AT, v: 'heart'},
];

export const current = <T,>(keys: Key<T>[], t: number) => {
  let i = 0;
  keys.forEach((k, j) => {
    if (k.t <= t) i = j;
  });
  return {cur: keys[i], prev: keys[Math.max(0, i - 1)]};
};

export const emotionAt = (t: number): Emotion => {
  const {cur, prev} = current(EMO_KEYS, t);
  const k = smooth((t - cur.t) / 0.35);
  const a = EMO[prev.v];
  const b = EMO[cur.v];
  const out = {} as Emotion;
  (Object.keys(a) as (keyof Emotion)[]).forEach((key) => {
    out[key] = mix(a[key], b[key], k);
  });
  return out;
};

const mixV = (a: Vec, b: Vec, k: number): Vec => [mix(a[0], b[0], k), mix(a[1], b[1], k)];

export const poseAt = (t: number): Pose => {
  const {cur, prev} = current(POSE_KEYS, t);
  const k = smooth((t - cur.t) / 0.38);
  const a = POSES[prev.v];
  const b = POSES[cur.v];
  const p: Pose = {L: mixV(a.L, b.L, k), R: mixV(a.R, b.R, k), palmUp: mix(a.palmUp ?? 0, b.palmUp ?? 0, k)};
  // live motion on top of the key pose
  if (cur.v === 'wave') p.R = [p.R[0] + Math.sin(t * 13) * 26 * k, p.R[1] + Math.cos(t * 13) * 8 * k];
  if (cur.v === 'cheer') {
    p.L = [p.L[0] + Math.sin(t * 10) * 10, p.L[1] + Math.cos(t * 10) * 12];
    p.R = [p.R[0] - Math.sin(t * 10) * 10, p.R[1] + Math.cos(t * 10 + 1) * 12];
  }
  if (cur.v === 'fists') {
    p.L = [p.L[0], p.L[1] + Math.sin(t * 16) * 9];
    p.R = [p.R[0], p.R[1] + Math.sin(t * 16 + 1.5) * 9];
  }
  if (cur.v === 'rest') {
    // typing
    p.L = [p.L[0] + Math.sin(t * 17) * 5, p.L[1] + Math.abs(Math.sin(t * 11)) * -6];
    p.R = [p.R[0] + Math.sin(t * 15 + 1) * 5, p.R[1] + Math.abs(Math.sin(t * 12 + 2)) * -6];
  }
  return p;
};
