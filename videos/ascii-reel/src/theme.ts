export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const C = {
  bg: '#030705',
  green: '#3dff92',
  greenMid: '#25b866',
  greenDim: '#17663d',
  greenFaint: '#0c3320',
  amber: '#ffb63f',
  red: '#ff4a4a',
  cyan: '#58e6ff',
  white: '#eafff3',
} as const;

export const FONT = 'JBM';

// main character grid: 64 x 60 cells
export const COLS = 64;
export const ROWS = 60;
export const CW = W / COLS; // 16.875
export const CH = H / ROWS; // 32
export const FONT_PX = 27;
