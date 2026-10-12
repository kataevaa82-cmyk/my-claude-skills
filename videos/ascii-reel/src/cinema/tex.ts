// Procedural canvas textures (deterministic) for the cinematic 3D scene.
import * as THREE from 'three';
import {hash} from '../lib/rng';

const cache = new Map<string, THREE.Texture>();

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

const finish = (c: HTMLCanvasElement, key: string, srgb = true, repeat?: [number, number]) => {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  cache.set(key, t);
  return t;
};

/** height map (0..1 array) -> tangent-space normal map canvas */
const normalFromHeight = (hgt: Float32Array, w: number, h: number, strength: number) => {
  const c = canvas(w, h);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const l = hgt[y * w + ((x - 1 + w) % w)];
      const r = hgt[y * w + ((x + 1) % w)];
      const u = hgt[((y - 1 + h) % h) * w + x];
      const d = hgt[((y + 1) % h) * w + x];
      let nx = (l - r) * strength;
      let ny = (d - u) * strength;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * w + x) * 4;
      img.data[i] = (nx * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
};

// smooth value noise
const vnoise = (x: number, y: number, seed: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const s = (v: number) => v * v * (3 - 2 * v);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * s(xf) + (c - a) * s(yf) + (a - b - c + d) * s(xf) * s(yf);
};
const fbm = (x: number, y: number, seed: number, oct = 4) => {
  let v = 0;
  let amp = 0.5;
  let f = 1;
  for (let o = 0; o < oct; o++) {
    v += amp * vnoise(x * f, y * f, seed + o * 17);
    amp *= 0.5;
    f *= 2;
  }
  return v;
};

/** Emerald knit sweater: colour + normal (vertical stitch columns of V-shapes) */
export const knitTextures = () => {
  const key = 'knit';
  if (cache.has(key)) return {map: cache.get(key)!, normal: cache.get(key + 'n')!};
  const w = 256;
  const h = 256;
  const hgt = new Float32Array(w * h);
  const c = canvas(w, h);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const cols = 16;
  const rows = 22;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cx = (x / w) * cols;
      const cy = (y / h) * rows;
      const fx = cx - Math.floor(cx) - 0.5; // -0.5..0.5 within column
      const fy = cy - Math.floor(cy);
      // V stitch: two slanted loops per cell
      const slant = Math.abs(fx) * 1.1 - fy + 0.35;
      const loop = Math.max(0, 1 - Math.abs(Math.sin(slant * Math.PI)) * 1.25);
      const groove = Math.pow(Math.abs(fx) * 2, 6); // gap between columns
      const fuzz = fbm(x * 0.15, y * 0.15, 3, 3) * 0.25;
      const v = Math.max(0, loop * (1 - groove) + fuzz);
      hgt[y * w + x] = v;
      const shade = 0.55 + v * 0.45;
      const i = (y * w + x) * 4;
      img.data[i] = 18 * shade + 6;
      img.data[i + 1] = 110 * shade + 10;
      img.data[i + 2] = 78 * shade + 8;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const map = finish(c, key, true, [6, 6]);
  const n = finish(normalFromHeight(hgt, w, h, 3.5), key + 'n', false, [6, 6]);
  return {map, normal: n};
};

/** Oak desk */
export const woodTextures = () => {
  const key = 'wood';
  if (cache.has(key)) return {map: cache.get(key)!, normal: cache.get(key + 'n')!};
  const w = 1024;
  const h = 512;
  const hgt = new Float32Array(w * h);
  const c = canvas(w, h);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const warp = fbm(x * 0.004, y * 0.02, 7, 4) * 6;
      const ring = Math.sin((y * 0.06 + warp) * Math.PI);
      const fine = fbm(x * 0.05, y * 0.8, 9, 2);
      const v = 0.5 + 0.25 * ring + 0.25 * (fine - 0.5);
      hgt[y * w + x] = v;
      const i = (y * w + x) * 4;
      img.data[i] = 150 + 60 * v;
      img.data[i + 1] = 100 + 45 * v;
      img.data[i + 2] = 62 + 28 * v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return {map: finish(c, key, true), normal: finish(normalFromHeight(hgt, w, h, 1.2), key + 'n', false)};
};

/** Plaster wall */
export const plasterTextures = () => {
  const key = 'plaster';
  if (cache.has(key)) return {map: cache.get(key)!, normal: cache.get(key + 'n')!};
  const w = 512;
  const h = 512;
  const hgt = new Float32Array(w * h);
  const c = canvas(w, h);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = fbm(x * 0.02, y * 0.02, 21, 5);
      hgt[y * w + x] = v;
      const i = (y * w + x) * 4;
      const b = 196 + (v - 0.5) * 26;
      img.data[i] = b + 8;
      img.data[i + 1] = b;
      img.data[i + 2] = b - 10;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return {map: finish(c, key, true, [3, 3]), normal: finish(normalFromHeight(hgt, w, h, 2), key + 'n', false, [3, 3])};
};

/** Skin: soft noise, blush on cheeks, freckles across nose & cheeks (sphere UV: face centre at u=0.25) */
export const skinTexture = () => {
  const key = 'skin';
  if (cache.has(key)) return cache.get(key)!;
  const w = 1024;
  const h = 512;
  const c = canvas(w, h);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f3c6aa';
  ctx.fillRect(0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = fbm(x * 0.03, y * 0.03, 31, 3) - 0.5;
      const i = (y * w + x) * 4;
      img.data[i] += n * 14;
      img.data[i + 1] += n * 12;
      img.data[i + 2] += n * 10;
    }
  }
  ctx.putImageData(img, 0, 0);
  // canvas y=0 is uv.y=1 (top of head)
  const blush = (u: number, vy: number, r: number, a: number) => {
    const g = ctx.createRadialGradient(u * w, (1 - vy) * h, 0, u * w, (1 - vy) * h, r);
    g.addColorStop(0, `rgba(240,110,110,${a})`);
    g.addColorStop(1, 'rgba(240,110,110,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };
  blush(0.25 - 0.075, 0.43, 60, 0.42);
  blush(0.25 + 0.075, 0.43, 60, 0.42);
  blush(0.25, 0.47, 26, 0.18); // nose tip warmth
  // freckles
  for (let i = 0; i < 140; i++) {
    const u = 0.25 + (hash(i, 1) - 0.5) * 0.2;
    const vy = 0.44 + (hash(i, 2) - 0.5) * 0.09;
    const dx = Math.abs(u - 0.25);
    if (dx < 0.012 && vy < 0.44) continue;
    ctx.fillStyle = `rgba(150,70,40,${0.18 + hash(i, 3) * 0.22})`;
    ctx.beginPath();
    ctx.arc(u * w, (1 - vy) * h, 1 + hash(i, 4) * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  return finish(c, key, true);
};

/** Long copper hair strand card: vertical streaks, darker roots, alpha-feathered sides */
export const hairTexture = () => {
  const key = 'hair';
  if (cache.has(key)) return cache.get(key)!;
  const w = 128;
  const h = 512;
  const c = canvas(w, h);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const streak = fbm(x * 0.35, y * 0.004, 41, 3);
      const fine = hash(x, 77);
      const v = 0.55 * streak + 0.45 * fine;
      const edge = Math.min(1, Math.min(x, w - 1 - x) / 22);
      const tip = Math.min(1, (h - 1 - y) / 60);
      const i = (y * w + x) * 4;
      const root = Math.min(1, y / 80);
      img.data[i] = (120 + 120 * v) * (0.75 + 0.25 * root);
      img.data[i + 1] = (42 + 52 * v) * (0.75 + 0.25 * root);
      img.data[i + 2] = (18 + 22 * v) * (0.8 + 0.2 * root);
      img.data[i + 3] = 255 * edge * tip * (0.75 + 0.25 * fine);
    }
  }
  ctx.putImageData(img, 0, 0);
  return finish(c, key, true);
};

/** Eye iris: grey-green with fibres, dark limbal ring */
export const irisTexture = () => {
  const key = 'iris';
  if (cache.has(key)) return cache.get(key)!;
  const s = 256;
  const c = canvas(s, s);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(s, s);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const dx = (x - s / 2) / (s / 2);
      const dy = (y - s / 2) / (s / 2);
      const r = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);
      const i = (y * s + x) * 4;
      if (r > 1) {
        img.data[i + 3] = 0;
        continue;
      }
      const fib = fbm(a * 6 + 10, r * 3, 51, 3);
      let R = 92 + 60 * fib;
      let G = 118 + 60 * fib;
      let B = 96 + 40 * fib;
      if (r < 0.45) {
        // warm amber ring around the pupil
        const k = 1 - r / 0.45;
        R += 60 * k;
        G += 25 * k;
      }
      const limbal = Math.max(0, (r - 0.82) / 0.18);
      const dark = 1 - limbal * 0.85;
      const pupil = r < 0.36 ? 0 : 1;
      img.data[i] = R * dark * pupil + 8 * (1 - pupil);
      img.data[i + 1] = G * dark * pupil + 6 * (1 - pupil);
      img.data[i + 2] = B * dark * pupil + 6 * (1 - pupil);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finish(c, key, true);
};

/** Text / sign painted on a canvas (for holograms and the clock face) */
export const signTexture = (
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
) => {
  if (cache.has(key)) return cache.get(key)!;
  const c = canvas(w, h);
  draw(c.getContext('2d')!, w, h);
  return finish(c, key, true);
};

/** soft round sprite for dust / bokeh */
export const dotTexture = () =>
  signTexture('dot', 64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

/** light-beam gradient for volumetric rays */
export const beamTexture = () =>
  signTexture('beam', 64, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const v = ctx.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(0.15, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  });

/** smooth-mass hair: colour (with jagged tip alpha) + strand-groove normal map; strands run along v */
export const hairSheetTextures = () => {
  const key = 'hairsheet';
  if (cache.has(key)) return {map: cache.get(key)!, normal: cache.get(key + 'n')!};
  const w = 512;
  const h = 1024;
  const hgt = new Float32Array(w * h);
  const c = canvas(w, h);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const v = 1 - y / h; // uv.y: 1 = root, 0 = tip
    for (let x = 0; x < w; x++) {
      const coarse = fbm(x * 0.06, y * 0.0025, 91, 3);
      const fine = fbm(x * 0.6, y * 0.01, 93, 2);
      const strand = 0.6 * coarse + 0.4 * fine;
      hgt[y * w + x] = strand;
      const tipLen = 0.05 + 0.12 * fbm(x * 0.09, 3, 95, 2);
      const alpha = v < tipLen ? Math.max(0, (v / tipLen - 0.35) / 0.65) : 1;
      const root = Math.min(1, (1 - v) / 0.12);
      const br = 0.55 + 0.6 * strand;
      const i = (y * w + x) * 4;
      img.data[i] = Math.min(255, (118 * br) * (0.72 + 0.28 * root));
      img.data[i + 1] = Math.min(255, (40 * br) * (0.72 + 0.28 * root));
      img.data[i + 2] = Math.min(255, (20 * br) * (0.75 + 0.25 * root));
      img.data[i + 3] = 255 * alpha;
    }
  }
  ctx.putImageData(img, 0, 0);
  return {map: finish(c, key, true), normal: finish(normalFromHeight(hgt, w, h, 4), key + 'n', false)};
};
