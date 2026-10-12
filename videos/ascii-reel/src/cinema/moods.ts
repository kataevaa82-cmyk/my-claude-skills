import {mixColor, smooth} from '../characters/anim';
import {SCENES} from '../characters/Scenes';
import {at} from '../story';

export type Mood = {
  key: string; keyI: number;
  rim: string; rimI: number;
  amb: number;
  holo: string; holoI: number;
  screen: string;
  beams: number; beamColor: string;
  dust: number; dustColor: string;
  gradeTop: string; gradeBottom: string; gradeA: number;
};

const M = (o: Mood) => o;
const MOODS: Record<string, Mood> = {
  intro: M({key: '#ffcf9e', keyI: 2.6, rim: '#8fbcff', rimI: 7, amb: 0.4, holo: '#ffd29a', holoI: 0, screen: '#d6e6ff', beams: 1, beamColor: '#ffd9ab', dust: 0.9, dustColor: '#ffdcae', gradeTop: '#1a3b4a', gradeBottom: '#ff9b4a', gradeA: 0.16}),
  dream: M({key: '#ffc8a8', keyI: 2.3, rim: '#c49bff', rimI: 8, amb: 0.4, holo: '#b48cff', holoI: 1.6, screen: '#e5d8ff', beams: 0.8, beamColor: '#ffd0e8', dust: 0.9, dustColor: '#ffd6f0', gradeTop: '#2a1f55', gradeBottom: '#ff8aa8', gradeA: 0.16}),
  study: M({key: '#ffe0b8', keyI: 2.4, rim: '#8fd0ff', rimI: 7, amb: 0.42, holo: '#7cc8ff', holoI: 1.0, screen: '#d6ecff', beams: 0.9, beamColor: '#ffe6bf', dust: 0.9, dustColor: '#ffe6c0', gradeTop: '#123a52', gradeBottom: '#ffb066', gradeA: 0.14}),
  closed: M({key: '#a9c4ff', keyI: 1.25, rim: '#5f8cff', rimI: 8, amb: 0.3, holo: '#ff3b3b', holoI: 2.2, screen: '#9fb6d6', beams: 0.15, beamColor: '#b8ccff', dust: 0.35, dustColor: '#c8d8ff', gradeTop: '#0d1a33', gradeBottom: '#36506e', gradeA: 0.26}),
  yandex: M({key: '#ffd27a', keyI: 3.1, rim: '#ffb347', rimI: 6, amb: 0.45, holo: '#ffcc33', holoI: 1.8, screen: '#fff1cf', beams: 1.35, beamColor: '#ffd38a', dust: 1.1, dustColor: '#ffe0a0', gradeTop: '#3a2a10', gradeBottom: '#ffb02e', gradeA: 0.16}),
  success: M({key: '#fff0c8', keyI: 2.7, rim: '#7dffb2', rimI: 6, amb: 0.45, holo: '#3dff8f', holoI: 1.6, screen: '#dfffea', beams: 0.9, beamColor: '#fff0c8', dust: 0.9, dustColor: '#e8ffd8', gradeTop: '#0f3a2a', gradeBottom: '#ffc76a', gradeA: 0.13}),
  money: M({key: '#ffd67a', keyI: 2.9, rim: '#ffcf4a', rimI: 7, amb: 0.45, holo: '#ffc23a', holoI: 2.2, screen: '#fff0c0', beams: 1.1, beamColor: '#ffd27a', dust: 1.3, dustColor: '#ffd36a', gradeTop: '#3a2408', gradeBottom: '#ffb52e', gradeA: 0.16}),
  crash: M({key: '#ff6b6b', keyI: 1.5, rim: '#ff2a2a', rimI: 10, amb: 0.25, holo: '#ff2020', holoI: 3, screen: '#ff8f8f', beams: 0.2, beamColor: '#ff8080', dust: 0.4, dustColor: '#ff9090', gradeTop: '#3a0505', gradeBottom: '#ff2a2a', gradeA: 0.24}),
  rustore: M({key: '#cfe2ff', keyI: 2.1, rim: '#3d8bff', rimI: 9, amb: 0.38, holo: '#2f8cff', holoI: 2.2, screen: '#cfe2ff', beams: 0.55, beamColor: '#cfe2ff', dust: 0.8, dustColor: '#cfe6ff', gradeTop: '#071c3a', gradeBottom: '#5aa0ff', gradeA: 0.16}),
  vk: M({key: '#d8e6ff', keyI: 2.1, rim: '#2787f5', rimI: 8, amb: 0.38, holo: '#2787f5', holoI: 1.8, screen: '#d8e6ff', beams: 0.55, beamColor: '#d8e6ff', dust: 0.8, dustColor: '#d6e6ff', gradeTop: '#0a1a3a', gradeBottom: '#8a7dff', gradeA: 0.15}),
  outro: M({key: '#ffcfae', keyI: 2.6, rim: '#ff9ac8', rimI: 7, amb: 0.42, holo: '#ff6fae', holoI: 1.2, screen: '#ffe0ee', beams: 1.1, beamColor: '#ffd6c0', dust: 1.0, dustColor: '#ffd8e6', gradeTop: '#2a1030', gradeBottom: '#ff9a6a', gradeA: 0.15}),
};

const lerpMood = (a: Mood, b: Mood, k: number): Mood => {
  const out = {} as Mood;
  (Object.keys(a) as (keyof Mood)[]).forEach((key) => {
    const va = a[key];
    const vb = b[key];
    (out as Record<string, unknown>)[key] =
      typeof va === 'number' ? va + ((vb as number) - va) * k : mixColor(va as string, vb as string, k);
  });
  return out;
};

const hexify = (rgb: string) => {
  if (rgb.startsWith('#')) return rgb;
  const m = rgb.match(/\d+/g)!.map(Number);
  return '#' + m.map((v) => v.toString(16).padStart(2, '0')).join('');
};

export const moodAt = (t: number): Mood => {
  let i = 0;
  SCENES.forEach((s, j) => {
    if (s.a <= t) i = j;
  });
  const cur = MOODS[SCENES[i].id];
  const prev = MOODS[SCENES[Math.max(0, i - 1)].id];
  const k = smooth((t - SCENES[i].a) / 0.7);
  const m = lerpMood(prev, cur, k);
  (['key', 'rim', 'holo', 'screen', 'beamColor', 'dustColor', 'gradeTop', 'gradeBottom'] as const).forEach((c) => {
    m[c] = hexify(m[c]);
  });
  // crash: alarm flicker
  if (t >= at(93) && t < at(98)) {
    const f = Math.floor(t * 12) % 4;
    m.rimI *= f === 0 ? 0.25 : 1;
    m.holoI *= f === 1 ? 0.3 : 1.2;
  }
  return m;
};
