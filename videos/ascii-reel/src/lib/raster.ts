import {FONT} from '../theme';

// Coverage (0..1) per character cell for big text rendered as ASCII art.
const cache = new Map<string, Float32Array>();

export const rasterizeText = (
  lines: string[],
  cols: number,
  rows: number,
  cw: number,
  ch: number,
  weight = 800,
): Float32Array => {
  const key = `${lines.join('\n')}|${cols}x${rows}|${weight}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const w = Math.round(cols * cw);
  const h = Math.round(rows * ch);
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d', {willReadFrequently: true})!;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // fit: widest line within 94% width, all lines within 92% height
  ctx.font = `${weight} 100px ${FONT}, monospace`;
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const lineH = 1.0;
  const size = Math.min((w * 0.94 * 100) / widest, (h * 0.92) / (lines.length * lineH));
  ctx.font = `${weight} ${size}px ${FONT}, monospace`;
  const top = h / 2 - ((lines.length - 1) * size * lineH) / 2;
  lines.forEach((l, i) => ctx.fillText(l, w / 2, top + i * size * lineH + size * 0.04));

  const data = ctx.getImageData(0, 0, w, h).data;
  const out = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = Math.floor(c * cw);
      const x1 = Math.floor((c + 1) * cw);
      const y0 = Math.floor(r * ch);
      const y1 = Math.floor((r + 1) * ch);
      let sum = 0;
      let n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          sum += data[(y * w + x) * 4 + 3];
          n++;
        }
      }
      out[r * cols + c] = n ? sum / (n * 255) : 0;
    }
  }
  cache.set(key, out);
  return out;
};

export const RAMP = ' .:-=+*#%@';
