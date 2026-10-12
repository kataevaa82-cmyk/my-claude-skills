import {staticFile} from 'remotion';
import {FONT} from './theme';

const RANGES = {
  latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+20A0-20AB,U+20AD-20C0,U+2C60-2C7F,U+A720-A7FF',
  cyrillic: 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
} as const;

let promise: Promise<void> | null = null;

export const loadFonts = (): Promise<void> => {
  if (promise) return promise;
  const faces: FontFace[] = [];
  for (const weight of [400, 700, 800]) {
    for (const [subset, range] of Object.entries(RANGES)) {
      faces.push(
        new FontFace(FONT, `url(${staticFile(`fonts/jetbrains-mono-${subset}-${weight}-normal.woff2`)}) format('woff2')`, {
          weight: String(weight),
          unicodeRange: range,
        }),
      );
    }
  }
  promise = Promise.all(faces.map((f) => f.load()))
    .then((loaded) => {
      loaded.forEach((f) => (document.fonts as unknown as {add: (f: FontFace) => void}).add(f));
    })
    .catch((err) => {
      console.error(err);
    });
  return promise;
};
