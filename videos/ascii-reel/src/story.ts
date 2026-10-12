import audio from './data/audio-data.json';
import {PHRASES, SRC_INDEX, WORDS} from './data/transcript';
import {C} from './theme';

export const AUDIO = audio as {
  fps: number;
  frames: number;
  duration: number;
  level: number[];
  onset: number[];
  bands: number[][];
};

/** Start time of the word with the given ASR index (merged words fall back to their head). */
export const at = (srcIdx: number): number => {
  let i = srcIdx;
  while (i > 0 && SRC_INDEX[i] === undefined) i--;
  return WORDS[SRC_INDEX[i]].start;
};

export const SPEECH_END = WORDS[WORDS.length - 1].end;
export const OUTRO_AT = SPEECH_END + 0.25;
export const TOTAL_SECONDS = AUDIO.duration + 1.7;

export const level = (t: number) => AUDIO.level[Math.max(0, Math.min(AUDIO.frames - 1, Math.floor(t * AUDIO.fps)))] ?? 0;
export const bands = (t: number) => AUDIO.bands[Math.max(0, Math.min(AUDIO.frames - 1, Math.floor(t * AUDIO.fps)))];

// ── big ASCII headlines ────────────────────────────────────────────────
export type Headline = {t: number; lines: string[]; color: string; glitch?: boolean};
export const HEADLINES: Headline[] = [
  {t: 0, lines: ['ВОПРОС?'], color: C.green},
  {t: at(4), lines: ['МЕЧТА'], color: C.green},
  {t: at(10), lines: ['ПРИЛОЖЕНИЕ'], color: C.green},
  {t: at(12), lines: ['УЧЁБА'], color: C.green},
  {t: at(22), lines: ['2021'], color: C.green},
  {t: at(26), lines: ['2022'], color: C.amber},
  {t: at(32), lines: ['GOOGLE'], color: C.red, glitch: true},
  {t: at(37), lines: ['0 ₽'], color: C.red},
  {t: at(43), lines: ['ПАУЗА'], color: C.amber},
  {t: at(47), lines: ['ПОТОМ...'], color: C.green},
  {t: at(53), lines: ['ЯНДЕКС'], color: C.amber},
  {t: at(66), lines: ['ВСЁ OK'], color: C.green},
  {t: at(74), lines: ['МОДЕРАЦИЯ'], color: C.green},
  {t: at(80), lines: ['РАБОТАЕТ'], color: C.green},
  {t: at(87), lines: ['+₽ +₽ +₽'], color: C.amber},
  {t: at(93), lines: ['CRASH'], color: C.red, glitch: true},
  {t: at(97), lines: ['$#%@!'], color: C.red, glitch: true},
  {t: at(101), lines: ['RUSTORE'], color: C.cyan},
  {t: at(106), lines: ['ВОПРОС'], color: C.green},
  {t: at(112), lines: ['VK ID?'], color: C.cyan},
  {t: at(118), lines: ['НУЖЕН?'], color: C.amber},
  {t: at(122), lines: ['БЕЗ VK?'], color: C.cyan},
  {t: at(130), lines: ['ЧТО', 'ДУМАЕТЕ?'], color: C.green},
  {t: OUTRO_AT, lines: ['ПИШИТЕ', 'В КОММЕНТЫ'], color: C.amber},
];

// ── live code (typed while she speaks) ─────────────────────────────────
export type CodeLine = {t: number; text: string};
export const CODE: CodeLine[] = [
  {t: 0.05, text: '// девочки, смотрите, вопрос ↓'},
  {t: at(4), text: 'const dream = new App("своё");'},
  {t: at(12), text: 'await learn("всякие штуки");'},
  {t: at(19), text: 'deploy(dream, { year: 2021 });'},
  {t: at(25), text: '// ── 2022 ───────────────────'},
  {t: at(32), text: 'google.play = null; // закрылся'},
  {t: at(37), text: 'let money = 0;'},
  {t: at(42), text: 'dream.pause(); // отложила'},
  {t: at(50), text: 'import ya from "yandex";'},
  {t: at(55), text: 'ya.risk(); // что же ей будет?'},
  {t: at(68), text: 'ya.build(dream); // разобралась'},
  {t: at(73), text: 'await ya.moderation(); // ok'},
  {t: at(78), text: 'dream.status = "работает";'},
  {t: at(86), text: 'money += денюжка; // ₽₽₽'},
  {t: at(92), text: 'throw new Error("опять!!!");'},
  {t: at(99), text: 'import RuStore from "rustore";'},
  {t: at(105), text: 'const needVK = ask("нужен?");'},
  {t: at(113), text: 'if (!needVK) RuStore.upload(dream);'},
  {t: at(130), text: 'comments.ask("что думаете?");'},
];

// ── sequencer lanes (story as a beat) ──────────────────────────────────
export type LaneState = 'off' | 'on' | 'dead' | 'zero' | 'money' | 'load' | 'ask' | 'vox';
export type Lane = {name: string; color: string; pattern: string; states: {t: number; s: LaneState}[]};
export const LANES: Lane[] = [
  {name: 'VOX', color: C.white, pattern: '', states: [{t: 0, s: 'vox'}]},
  {name: 'BEAT', color: C.amber, pattern: 'x.....x.x.......', states: [{t: 0, s: 'on'}, {t: at(93), s: 'dead'}, {t: at(99), s: 'on'}]},
  {name: 'GOOGLE', color: C.green, pattern: 'x.x.x.x.x.x.x.x.', states: [{t: 0, s: 'off'}, {t: at(18), s: 'on'}, {t: at(33), s: 'dead'}]},
  {name: 'YANDEX', color: C.amber, pattern: 'x..x..x...x..x..', states: [{t: 0, s: 'off'}, {t: at(53), s: 'load'}, {t: at(66), s: 'on'}, {t: at(93), s: 'dead'}]},
  {name: 'MONEY₽', color: C.amber, pattern: '', states: [{t: 0, s: 'off'}, {t: at(37), s: 'zero'}, {t: at(87), s: 'money'}, {t: at(93), s: 'zero'}]},
  {name: 'RUSTORE', color: C.cyan, pattern: 'x...x.x.x...x.xx', states: [{t: 0, s: 'off'}, {t: at(101), s: 'load'}, {t: at(105), s: 'on'}]},
  {name: 'VK ID', color: C.cyan, pattern: '', states: [{t: 0, s: 'off'}, {t: at(112), s: 'ask'}]},
];

export const laneState = (lane: Lane, t: number) => {
  let cur = lane.states[0];
  for (const s of lane.states) if (s.t <= t) cur = s;
  return {state: cur.s, since: t - cur.t};
};

// ── glitch windows ─────────────────────────────────────────────────────
export const glitchAmount = (t: number): number => {
  let g = 0;
  for (const h of HEADLINES) {
    const d = t - h.t;
    if (d >= 0 && d < 0.14) g = Math.max(g, 0.25 * (1 - d / 0.14));
    if (h.glitch && d >= 0 && d < 0.6) g = Math.max(g, 0.7 * (1 - d / 0.6));
  }
  const crashA = at(93);
  const crashB = at(98);
  if (t >= crashA && t < crashB) g = Math.max(g, 0.55 + 0.45 * Math.abs(Math.sin((t - crashA) * 9)));
  return Math.min(1, g);
};

export const isCrash = (t: number) => t >= at(93) && t < at(98);

export const BPM = 140;
export const STEP = 60 / BPM / 2; // 8th notes

export {PHRASES, WORDS};
