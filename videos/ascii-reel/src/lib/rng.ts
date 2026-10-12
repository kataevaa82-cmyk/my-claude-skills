// Deterministic hash-based randomness (same output for the same frame on every render worker).
export const hash = (...n: number[]): number => {
  let h = 2166136261 >>> 0;
  for (const v of n) {
    h ^= Math.floor(v * 1000) | 0;
    h = Math.imul(h, 16777619) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995) >>> 0;
    h ^= h >>> 15;
  }
  return (h >>> 0) / 4294967296;
};

export const pick = (chars: string, r: number): string => chars[Math.min(chars.length - 1, Math.floor(r * chars.length))];

export const NOISE_CHARS = '01#%&@$*+=-:;<>/\\|?![]{}';
