import {FONT} from '../theme';

export type Cell = {ch: string; color: string; alpha: number; bold: boolean};

export class Grid {
  readonly cells: (Cell | null)[];

  constructor(
    readonly cols: number,
    readonly rows: number,
  ) {
    this.cells = new Array(cols * rows).fill(null);
  }

  set(x: number, y: number, ch: string, color: string, alpha = 1, bold = false) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
    this.cells[y * this.cols + x] = ch === ' ' ? null : {ch, color, alpha, bold};
  }

  get(x: number, y: number): Cell | null {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return null;
    return this.cells[y * this.cols + x];
  }

  text(x: number, y: number, s: string, color: string, alpha = 1, bold = false) {
    Array.from(s).forEach((ch, i) => this.set(x + i, y, ch, color, alpha, bold));
  }

  box(x0: number, y0: number, x1: number, y1: number, color: string, alpha = 1, title?: string) {
    for (let x = x0 + 1; x < x1; x++) {
      this.set(x, y0, '─', color, alpha);
      this.set(x, y1, '─', color, alpha);
    }
    for (let y = y0 + 1; y < y1; y++) {
      this.set(x0, y, '│', color, alpha);
      this.set(x1, y, '│', color, alpha);
    }
    this.set(x0, y0, '┌', color, alpha);
    this.set(x1, y0, '┐', color, alpha);
    this.set(x0, y1, '└', color, alpha);
    this.set(x1, y1, '┘', color, alpha);
    if (title) this.text(x0 + 2, y0, ` ${title} `, color, alpha, true);
  }
}

const EIGHTHS = '▁▂▃▄▅▆▇█';
const SHADES: Record<string, number> = {'░': 0.25, '▒': 0.5, '▓': 0.75};
// box drawing: [up, right, down, left] (1 = single, 2 = double)
const BOX: Record<string, [number, number, number, number]> = {
  '─': [0, 1, 0, 1], '│': [1, 0, 1, 0], '┌': [0, 1, 1, 0], '┐': [0, 0, 1, 1], '└': [1, 1, 0, 0],
  '┘': [1, 0, 0, 1], '├': [1, 1, 1, 0], '┤': [1, 0, 1, 1], '┬': [0, 1, 1, 1], '┴': [1, 1, 0, 1],
  '┼': [1, 1, 1, 1], '═': [0, 2, 0, 2], '║': [2, 0, 2, 0], '╔': [0, 2, 2, 0], '╗': [0, 0, 2, 2],
  '╚': [2, 2, 0, 0], '╝': [2, 0, 0, 2],
};

/** Draws one glyph into a cell. Block/box characters are drawn as rectangles so they tile perfectly. */
export const drawChar = (
  ctx: CanvasRenderingContext2D,
  ch: string,
  x: number,
  y: number,
  cw: number,
  chh: number,
  fontPx: number,
  bold: boolean,
) => {
  if (ch === '█') return ctx.fillRect(x, y, cw + 0.5, chh + 0.5);
  if (ch === '▀') return ctx.fillRect(x, y, cw + 0.5, chh / 2);
  if (ch === '▄') return ctx.fillRect(x, y + chh / 2, cw + 0.5, chh / 2 + 0.5);
  if (ch === '▌') return ctx.fillRect(x, y, cw / 2, chh + 0.5);
  if (ch === '▐') return ctx.fillRect(x + cw / 2, y, cw / 2 + 0.5, chh + 0.5);
  if (ch === '■') return ctx.fillRect(x + cw * 0.18, y + chh * 0.3, cw * 0.64, chh * 0.4);
  const e = EIGHTHS.indexOf(ch);
  if (e >= 0) {
    const hh = (chh * (e + 1)) / 8;
    return ctx.fillRect(x, y + chh - hh, cw + 0.5, hh);
  }
  if (ch in SHADES) {
    const a = ctx.globalAlpha;
    ctx.globalAlpha = a * SHADES[ch];
    ctx.fillRect(x, y, cw + 0.5, chh + 0.5);
    ctx.globalAlpha = a;
    return;
  }
  const b = BOX[ch];
  if (b) {
    const t = Math.max(1.5, cw * 0.11);
    const cx = x + cw / 2;
    const cy = y + chh / 2;
    const seg = (dir: number, kind: number) => {
      if (!kind) return;
      const offs = kind === 2 ? [-t * 1.3, t * 1.3] : [0];
      for (const o of offs) {
        if (dir === 0) ctx.fillRect(cx - t / 2 + o, y, t, chh / 2 + t / 2);
        if (dir === 2) ctx.fillRect(cx - t / 2 + o, cy - t / 2, t, chh / 2 + t / 2 + 0.5);
        if (dir === 1) ctx.fillRect(cx - t / 2, cy - t / 2 + o, cw / 2 + t / 2 + 0.5, t);
        if (dir === 3) ctx.fillRect(x, cy - t / 2 + o, cw / 2 + t / 2, t);
      }
    };
    b.forEach((k, d) => seg(d, k));
    return;
  }
  ctx.font = `${bold ? 800 : 500} ${fontPx}px ${FONT}, monospace`;
  ctx.fillText(ch, x + cw / 2, y + chh / 2 + fontPx * 0.04);
};

export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  g: Grid,
  cw: number,
  chh: number,
  fontPx: number,
  rowShift?: (row: number) => number,
) => {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let r = 0; r < g.rows; r++) {
    const dx = rowShift ? rowShift(r) : 0;
    for (let c = 0; c < g.cols; c++) {
      const cell = g.cells[r * g.cols + c];
      if (!cell) continue;
      ctx.globalAlpha = cell.alpha;
      ctx.fillStyle = cell.color;
      drawChar(ctx, cell.ch, c * cw + dx, r * chh, cw, chh, fontPx, cell.bold);
    }
  }
  ctx.globalAlpha = 1;
};

/** Phosphor bloom: composite a sharp offscreen layer onto the visible canvas with blurred copies. */
export const bloom = (dst: CanvasRenderingContext2D, src: HTMLCanvasElement, strength = 1) => {
  dst.clearRect(0, 0, dst.canvas.width, dst.canvas.height);
  dst.globalCompositeOperation = 'lighter';
  dst.filter = 'blur(14px)';
  dst.globalAlpha = 0.55 * strength;
  dst.drawImage(src, 0, 0);
  dst.filter = 'blur(4px)';
  dst.globalAlpha = 0.6 * strength;
  dst.drawImage(src, 0, 0);
  dst.filter = 'none';
  dst.globalAlpha = 1;
  dst.globalCompositeOperation = 'source-over';
  dst.drawImage(src, 0, 0);
};
