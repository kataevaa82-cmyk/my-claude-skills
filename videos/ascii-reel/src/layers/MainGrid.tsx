import {useLayoutEffect, useMemo, useRef} from 'react';
import {useCurrentFrame} from 'remotion';
import {Grid, bloom, drawGrid} from '../lib/grid';
import {NOISE_CHARS, hash, pick} from '../lib/rng';
import {
  AUDIO, BPM, CODE, LANES, OUTRO_AT, STEP, WORDS, bands, glitchAmount, isCrash, laneState, level,
} from '../story';
import {C, CH, COLS, CW, FONT_PX, FPS, H, ROWS, W} from '../theme';

const EIGHTHS = '▁▂▃▄▅▆▇█';

const fmt = (t: number) => {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
};

// tiny JS-ish syntax colouring for the live-code panel
const colorize = (line: string): string[] => {
  const chars = Array.from(line);
  const out = chars.map(() => C.green as string);
  const paint = (re: RegExp, color: string) => {
    let m: RegExpExecArray | null;
    const s = chars.join('');
    re.lastIndex = 0;
    while ((m = re.exec(s))) {
      const start = Array.from(s.slice(0, m.index)).length;
      const len = Array.from(m[0]).length;
      for (let i = start; i < start + len; i++) out[i] = color;
    }
  };
  paint(/\b(const|let|await|import|from|if|throw|new)\b/g, C.amber);
  paint(/\b\d+\b/g, C.cyan);
  paint(/"[^"]*"?/g, C.white);
  paint(/\/\/.*$/g, C.greenDim);
  return out;
};

const compose = (t: number, frame: number): Grid => {
  const g = new Grid(COLS, ROWS);
  const lv = level(t);
  const outro = t >= OUTRO_AT;

  // ── header ──
  const recOn = Math.floor(t * 2) % 2 === 0;
  g.text(2, 3, '●', C.red, recOn ? 1 : 0.25);
  g.text(4, 3, 'REC', C.red, 0.9, true);
  g.text(8, 3, `${fmt(Math.min(t, AUDIO.duration))} / ${fmt(AUDIO.duration)}`, C.greenMid, 0.9);
  g.text(42, 3, `${BPM} BPM`, C.amber, 0.9, true);
  g.text(51, 3, 'story.seq', C.greenDim, 1);
  for (let x = 2; x <= 61; x++) g.set(x, 4, '─', C.greenDim, 0.6);

  // ── headline frame (corners + graph paper) ──
  for (let y = 6; y <= 16; y += 2) for (let x = 3; x <= 60; x += 4) g.set(x, y, '·', C.greenFaint, 0.8);
  g.set(1, 5, '┌', C.greenDim, 0.8);
  g.set(62, 5, '┐', C.greenDim, 0.8);
  g.set(1, 17, '└', C.greenDim, 0.8);
  g.set(62, 17, '┘', C.greenDim, 0.8);

  // ── live code panel ──
  g.box(1, 18, 62, 28, C.greenDim, 0.9, 'story.js — live');
  const visible = CODE.filter((c) => c.t <= t);
  const shown = visible.slice(-9);
  shown.forEach((line, i) => {
    const row = 19 + i;
    const n = CODE.indexOf(line) + 1;
    const chars = Array.from(line.text);
    const dur = Math.min(1.0, Math.max(0.35, chars.length * 0.03));
    const typed = Math.floor(Math.min(1, (t - line.t) / dur) * chars.length);
    const cols = colorize(line.text);
    g.text(3, row, String(n).padStart(2, '0'), C.greenDim, 0.7);
    const isLast = i === shown.length - 1;
    for (let k = 0; k < typed && k < 56; k++) g.set(6 + k, row, chars[k], cols[k], isLast ? 1 : 0.62, isLast);
    if (isLast && Math.floor(t * 3) % 2 === 0) g.set(6 + Math.min(typed, 55), row, '█', C.green, 0.85);
  });

  // ── sequencer ──
  const crash = isCrash(t);
  const stepF = t / STEP;
  let play = Math.floor(stepF) % 16;
  if (crash) play = Math.floor(hash(Math.floor(frame / 2), 7) * 16);
  if (outro) play = -1;
  const bar = Math.floor(stepF / 16) + 1;
  g.box(1, 30, 59, 39, crash ? C.red : C.greenDim, 0.9, `SEQ ─ ${BPM} BPM ─ BAR ${String(bar).padStart(2, '0')}`);
  g.text(50, 30, outro ? ' ■ STOP ' : ' ▶ PLAY ', outro ? C.red : C.green, 1, true);
  for (let s = 0; s < 16; s++) {
    const x = 11 + s * 3;
    if (s === play) g.text(x, 31, '▄▄', C.amber, 1);
    else if (s % 4 === 0) g.text(x, 31, String(s + 1).padStart(2, ' '), C.greenDim, 0.8);
  }
  const hitDecay = 1 - (stepF % 1); // flash fades over one step
  LANES.forEach((lane, li) => {
    const row = 32 + li;
    const {state, since} = laneState(lane, t);
    const labelColor = state === 'dead' || state === 'zero' ? C.red : state === 'off' ? C.greenDim : lane.color;
    g.text(3, row, lane.name.padEnd(7, ' '), labelColor, state === 'off' ? 0.6 : 1, state !== 'off');
    for (let s = 0; s < 16; s++) {
      const x = 11 + s * 3;
      const isPlay = s === play;
      const active = lane.pattern[s] === 'x';
      const beatCol = s % 4 === 0;
      const put = (ch: string, color: string, a: number) => {
        g.set(x, row, ch, color, a);
        g.set(x + 1, row, ch, color, a);
      };
      const idle = () => put('░', C.greenDim, beatCol ? 0.55 : 0.32);
      switch (state) {
        case 'off':
          put('·', C.greenDim, isPlay ? 0.9 : 0.4);
          break;
        case 'on':
          if (active) put('█', isPlay ? C.white : lane.color, isPlay ? 0.75 + 0.25 * hitDecay : 0.78);
          else isPlay ? put('▒', C.greenMid, 0.8) : idle();
          break;
        case 'load': {
          const p = Math.min(1, since / 1.1) * 16;
          if (s < p) put(active ? '█' : '▓', lane.color, active ? 0.85 : 0.45);
          else idle();
          break;
        }
        case 'dead': {
          const fl = 0.45 + 0.45 * hash(frame, li, s);
          put(isPlay ? '▓' : 'X', C.red, isPlay ? 0.95 : fl);
          break;
        }
        case 'zero':
          put('0', C.red, isPlay ? 0.95 : 0.45);
          break;
        case 'money': {
          const filled = Math.min(16, Math.floor(since / 0.11));
          if (s < filled) put('₽', isPlay ? C.white : C.amber, 0.95);
          else put('·', C.greenDim, 0.5);
          break;
        }
        case 'ask': {
          const blink = hash(Math.floor(t * 5), s) > 0.45 ? 1 : 0.35;
          put('?', isPlay ? C.white : lane.color, isPlay ? 1 : 0.55 * blink + 0.15);
          break;
        }
        case 'vox': {
          // value recorded the last time the playhead crossed this step
          const barT = STEP * 16;
          let tPass = Math.floor((t - s * STEP) / barT) * barT + s * STEP;
          if (tPass > t) tPass -= barT;
          if (tPass < 0 || outro) {
            put('·', C.greenDim, 0.4);
            break;
          }
          const raw = isPlay ? lv : level(tPass);
          const v = Math.max(0, Math.min(1, (raw - 0.35) / 0.6));
          if (v <= 0.02) {
            put('·', C.greenDim, 0.5);
            break;
          }
          const ch = EIGHTHS[Math.max(0, Math.min(7, Math.round(v * 7)))];
          put(ch, isPlay ? C.white : C.green, isPlay ? 1 : 0.45 + 0.55 * v);
          break;
        }
      }
    }
  });

  // ── spectrum analyzer ──
  const bNow = bands(t);
  const bP1 = bands(Math.max(0, t - 1 / FPS));
  const bP2 = bands(Math.max(0, t - 2 / FPS));
  const nCols = 28;
  for (let i = 0; i < nCols; i++) {
    const b = Math.floor((i * bNow.length) / nCols);
    const v0 = Math.max(bNow[b], bP1[b] * 0.82, bP2[b] * 0.66);
    const v = outro ? 0 : Math.pow(Math.max(0, Math.min(1, (v0 - 0.22) / 0.55)), 0.85);
    const units = Math.round(v * 4 * 8);
    for (let r = 0; r < 4; r++) {
      const u = Math.max(0, Math.min(8, units - r * 8));
      const row = 49 - r;
      const x = 2 + i * 2;
      if (u <= 0) {
        g.set(x, row, '·', C.greenFaint, 0.9);
        continue;
      }
      const color = r >= 3 ? C.red : r === 2 ? C.amber : C.green;
      g.set(x, row, EIGHTHS[u - 1], color, 0.85);
    }
  }

  // ── word log (bottom, sits under the Reels UI) ──
  const spoken = WORDS.filter((w) => w.start <= t).slice(-7);
  spoken.forEach((w, i) => {
    const row = 52 + i + (7 - spoken.length);
    const fresh = i === spoken.length - 1;
    const txt = `[${fmt(w.start)}] vox ▸ ${w.text}`;
    g.text(2, row, txt.slice(0, 58), fresh ? C.green : C.greenDim, fresh ? 0.75 : 0.45);
  });

  // ── glitch: corrupt characters ──
  const gl = glitchAmount(t);
  if (gl > 0.05) {
    for (let i = 0; i < g.cells.length; i++) {
      const r = hash(frame, i, 3);
      if (r < gl * 0.07) {
        const c = g.cells[i];
        g.cells[i] = {
          ch: pick(NOISE_CHARS, hash(frame, i, 5)),
          color: hash(frame, i, 9) > 0.5 ? C.red : C.cyan,
          alpha: c ? c.alpha : 0.5 * gl,
          bold: true,
        };
      }
    }
  }

  // ── boot wipe ──
  if (t < 0.45) {
    const lim = Math.floor((t / 0.45) * ROWS);
    for (let i = lim * COLS; i < g.cells.length; i++) g.cells[i] = null;
    for (let x = 0; x < COLS; x++) g.set(x, lim, '▀', C.green, 0.8);
  }
  return g;
};

export const MainGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const ref = useRef<HTMLCanvasElement>(null);
  const off = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    return c;
  }, []);

  useLayoutEffect(() => {
    const g = compose(t, frame);
    const octx = off.getContext('2d')!;
    octx.clearRect(0, 0, W, H);
    const gl = glitchAmount(t);
    const shift = (row: number) => {
      if (gl < 0.05) return 0;
      const r = hash(Math.floor(frame / 2), row, 11);
      return r < gl * 0.35 ? (hash(frame, row, 13) - 0.5) * 160 * gl : 0;
    };
    drawGrid(octx, g, CW, CH, FONT_PX, shift);
    bloom(ref.current!.getContext('2d')!, off, 0.9 + level(t) * 0.25);
  }, [frame, t, off]);

  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', left: 0, top: 0}} />;
};
