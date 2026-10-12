import {useLayoutEffect, useMemo, useRef} from 'react';
import {useCurrentFrame} from 'remotion';
import {bloom} from '../lib/grid';
import {RAMP, rasterizeText} from '../lib/raster';
import {NOISE_CHARS, hash, pick} from '../lib/rng';
import {HEADLINES, glitchAmount, level} from '../story';
import {C, FONT, FPS, W} from '../theme';

// big text rendered as ASCII art on a fine 128-column character grid
const HCOLS = 128;
const HROWS = 30;
const HCW = W / HCOLS; // 8.4375
const HCH = 13.6;
const HH = Math.round(HROWS * HCH);
export const HEADLINE_TOP = 164;

const DECODE = 0.38; // seconds for the scramble-decode reveal

export const Headline: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const ref = useRef<HTMLCanvasElement>(null);
  const off = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = HH;
    return c;
  }, []);

  useLayoutEffect(() => {
    let idx = 0;
    HEADLINES.forEach((h, i) => {
      if (h.t <= t) idx = i;
    });
    const cur = HEADLINES[idx];
    const prev = idx > 0 ? HEADLINES[idx - 1] : null;
    const age = t - cur.t;
    const cov = rasterizeText(cur.lines, HCOLS, HROWS, HCW, HCH);
    const pcov = prev ? rasterizeText(prev.lines, HCOLS, HROWS, HCW, HCH) : null;
    const gl = glitchAmount(t);
    const pulse = 0.82 + 0.35 * level(t);

    const ctx = off.getContext('2d')!;
    ctx.clearRect(0, 0, W, HH);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 13px ${FONT}, monospace`;

    const drawLayer = (dx: number, tint: string | null, alphaMul: number) => {
      for (let r = 0; r < HROWS; r++) {
        let rowDx = dx;
        if (gl > 0.05 && hash(Math.floor(frame / 2), r, 21) < gl * 0.45) rowDx += (hash(frame, r, 23) - 0.5) * 90 * gl;
        for (let c = 0; c < HCOLS; c++) {
          const i = r * HCOLS + c;
          const v = cov[i];
          let ch = '';
          let a = 0;
          let color: string = cur.color;
          if (v > 0.06) {
            const reveal = hash(i, cur.t, 1) * DECODE;
            if (age < reveal) {
              ch = pick(NOISE_CHARS, hash(frame, i, 2));
              a = 0.55;
              color = C.white;
            } else {
              let k = Math.round(v * (RAMP.length - 1));
              if (hash(frame >> 1, i, 4) < 0.025) k = Math.max(1, k - 1 - Math.floor(hash(frame, i) * 2));
              ch = RAMP[Math.max(1, k)];
              a = Math.min(1, (0.35 + 0.75 * v) * pulse);
              // fresh-reveal flash
              if (age - reveal < 0.08) color = C.white;
            }
          } else if (pcov && pcov[i] > 0.06 && age < 0.22) {
            // previous headline dissolving
            if (hash(i, cur.t, 7) > age / 0.22) {
              ch = pick(NOISE_CHARS, hash(frame, i, 8));
              a = 0.35 * (1 - age / 0.22);
              color = prev!.color;
            }
          }
          if (!ch || ch === ' ') continue;
          ctx.globalAlpha = a * alphaMul;
          ctx.fillStyle = tint ?? color;
          ctx.fillText(ch, c * HCW + HCW / 2 + rowDx, r * HCH + HCH / 2);
        }
      }
    };

    if (gl > 0.15) {
      // chromatic split while glitching
      drawLayer(-6 * gl, C.red, 0.55);
      drawLayer(6 * gl, C.cyan, 0.45);
    }
    drawLayer(0, null, 1);
    ctx.globalAlpha = 1;
    bloom(ref.current!.getContext('2d')!, off, 1.05);
  }, [frame, t, off]);

  return <canvas ref={ref} width={W} height={HH} style={{position: 'absolute', left: 0, top: HEADLINE_TOP}} />;
};
