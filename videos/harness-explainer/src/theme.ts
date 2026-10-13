export const C = {
  bg: '#08090F',
  text: '#F6F2EA',
  dim: 'rgba(246,242,234,0.66)',
  faint: 'rgba(246,242,234,0.38)',
  line: 'rgba(255,255,255,0.10)',
  coral: '#FF8A5B',
  amber: '#FFC46B',
  cyan: '#5DD6F2',
  violet: '#A28CFF',
  green: '#5FDCA0',
  red: '#FF6B7A',
  pink: '#FF7EC1',
  terminal: '#161616',
};

export const FONT = {
  display: "'Unbounded', 'Noto Color Emoji', sans-serif",
  body: "'Manrope', 'Noto Color Emoji', sans-serif",
  mono: "'JetBrains Mono', 'DejaVu Sans Mono', 'Noto Color Emoji', monospace",
};

// акцент каждой части ролика
export const CHAPTER_COLORS = [C.coral, C.amber, C.cyan, C.violet, C.green, C.coral, C.amber, C.red, C.pink, C.green];

export const chapterColor = (i: number) => CHAPTER_COLORS[i % CHAPTER_COLORS.length];

export const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

export const alpha = (hex: string, a: number) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};

export const mix = (a: string, b: string, t: number) => {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};
