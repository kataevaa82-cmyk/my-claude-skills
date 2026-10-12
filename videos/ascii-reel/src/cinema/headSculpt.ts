// Sculpted stylised head: one sphere displaced into a face, with morph targets for speech/expressions
// and a skin texture painted from the very same feature functions (so paint and shape always agree).
import * as THREE from 'three';
import {hash} from '../lib/rng';

export const R = 0.11;
export const SY = 1.05;
export const MOUTH_Y = -0.054; // pre-scale
export const EYE_X = 0.042;
export const EYE_Y = -0.001;

const g2 = (x: number, y: number, cx: number, cy: number, sx: number, sy: number) =>
  Math.exp(-(((x - cx) ** 2) / (2 * sx * sx) + ((y - cy) ** 2) / (2 * sy * sy)));
const sstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** lip line (closed mouth) height at x, for a given smile amount */
const lipLine = (x: number, smile: number) => MOUTH_Y + smile * 0.006 * (x / 0.026) ** 2;

/** outward displacement (m) of the neutral face at front coords (X, Y) */
const sculpt = (X: number, Y: number) => {
  let d = 0;
  // eye sockets + brow ridge
  for (const s of [-1, 1]) {
    d -= 0.0085 * g2(X, Y, s * EYE_X, EYE_Y, 0.019, 0.014);
    d += 0.0022 * g2(X, Y, s * EYE_X, 0.032, 0.022, 0.007);
    d += 0.0048 * g2(X, Y, s * 0.056, -0.026, 0.022, 0.018); // cheeks
    d += 0.0024 * g2(X, Y, s * 0.0095, -0.03, 0.0042, 0.0035); // nostril wings
  }
  // nose: bridge ramps into a soft rounded tip
  const ramp = sstep(0.012, -0.027, Y) * (Y > -0.032 ? 1 : Math.exp(-(((Y + 0.032) / 0.005) ** 2)));
  d += 0.0055 * ramp * Math.exp(-(X * X) / (2 * 0.006 * 0.006));
  d += 0.0062 * g2(X, Y, 0, -0.027, 0.0095, 0.0082);
  // lips
  d += 0.0046 * g2(X, Y, 0, MOUTH_Y + 0.0058, 0.0185, 0.0034);
  d += 0.0058 * g2(X, Y, 0, MOUTH_Y - 0.0068, 0.0165, 0.0042);
  d -= 0.0016 * g2(X, Y, 0, MOUTH_Y + 0.013, 0.0035, 0.004); // philtrum
  d -= 0.0022 * g2(X, Y, 0, MOUTH_Y, 0.022, 0.0011); // closed-lip crease
  d += 0.0025 * g2(X, Y, 0, -0.09, 0.018, 0.012); // chin
  return d;
};

/** face shape: rounder cheeks, tapered jaw, bigger cranium (applied after sculpting) */
const shape = (x: number, y: number, z: number) => {
  const ny = y / R;
  const k = Math.pow(sstep(-0.25, -1.0, ny), 1.2);
  const cheek = Math.exp(-(((ny + 0.25) / 0.3) ** 2));
  const nx = x * (1 - 0.3 * k) * (1 + 0.07 * cheek);
  let nz = z;
  if (z > 0) nz *= 1 - 0.06 * k;
  else nz *= 1.06;
  return new THREE.Vector3(nx, y * SY, nz);
};

const frontMask = (dz: number) => sstep(0.2, 0.62, dz);

/** final surface point for front coords (X, Y) with optional expression deltas */
export const facePoint = (X: number, Y: number, lift = 0) => {
  const zz = Math.sqrt(Math.max(0, R * R - X * X - Y * Y));
  const dir = new THREE.Vector3(X, Y, zz).normalize();
  const disp = sculpt(X, Y) * frontMask(dir.z) + lift;
  const p = dir.multiplyScalar(R + disp);
  return shape(p.x, p.y, p.z);
};

/** expression deltas at front coords (X, Y): returns [dx, dy, dz] for open / smile / frown */
const exprDelta = (X: number, Y: number, which: 'open' | 'smile' | 'frown'): [number, number, number] => {
  const near = Math.exp(-(X * X) / (2 * 0.02 * 0.02));
  if (which === 'open') {
    const line = MOUTH_Y;
    const below = sstep(line + 0.0012, line - 0.004, Y); // 0 above lip line, 1 below
    const jaw = below * near * Math.exp(-(((Y - line) / 0.03) ** 2));
    const gap = Math.exp(-(((Y - line) / 0.0018) ** 2)) * near;
    const above = sstep(line - 0.001, line + 0.004, Y) * Math.exp(-(((Y - line - 0.004) / 0.008) ** 2)) * near;
    return [0, -0.0125 * jaw + 0.0012 * above, -0.002 * gap - 0.0025 * jaw];
  }
  if (which === 'smile') {
    const c = Math.exp(-(((Y - MOUTH_Y) / 0.012) ** 2));
    const side = Math.exp(-(((Math.abs(X) - 0.024) / 0.012) ** 2));
    const cheeks = 0.6 * g2(Math.abs(X), Y, 0.045, -0.035, 0.016, 0.014);
    return [Math.sign(X) * 0.0035 * c * side, 0.0055 * c * side + 0.003 * cheeks, 0.002 * cheeks];
  }
  const c = Math.exp(-(((Y - MOUTH_Y) / 0.012) ** 2));
  const side = Math.exp(-(((Math.abs(X) - 0.024) / 0.012) ** 2));
  return [0, -0.005 * c * side, 0];
};

/** lower-lip drop (pre-scale Y offset) for the jaw morph at x, open amount */
export const jawDrop = (x: number, open: number) => 0.0125 * open * Math.exp(-(x * x) / (2 * 0.02 * 0.02));

export const buildHead = () => {
  const geo = new THREE.SphereGeometry(R, 240, 180);
  const pos = geo.attributes.position;
  const morphs = {open: [] as number[], smile: [] as number[], frown: [] as number[]};
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    const dir = v.clone().normalize();
    const X = dir.x * R;
    const Y = dir.y * R;
    const fm = frontMask(dir.z);
    const base = shape(...(dir.clone().multiplyScalar(R + sculpt(X, Y) * fm).toArray() as [number, number, number]));
    pos.setXYZ(i, base.x, base.y, base.z);
    for (const k of ['open', 'smile', 'frown'] as const) {
      const [dx, dy, dz] = exprDelta(X, Y, k);
      morphs[k].push(dx * fm, dy * fm * SY, dz * fm);
    }
  }
  geo.computeVertexNormals();
  geo.morphAttributes.position = (['open', 'smile', 'frown'] as const).map((k) => new THREE.Float32BufferAttribute(morphs[k], 3));
  geo.morphTargetsRelative = true;
  return geo;
};

/** skin colour map painted in sphere-UV space from the same feature functions */
export const paintSkin = () => {
  const w = 2048;
  const h = 1024;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const base = [243, 199, 172];
  for (let py = 0; py < h; py++) {
    const vUV = 1 - py / h; // canvas top = uv.y 1 = top of head
    const theta = (1 - vUV) * Math.PI;
    for (let px = 0; px < w; px++) {
      const u = px / w;
      const phi = u * Math.PI * 2;
      const dx = -Math.cos(phi) * Math.sin(theta);
      const dy = Math.cos(theta);
      const dz = Math.sin(phi) * Math.sin(theta);
      const X = dx * R;
      const Y = dy * R;
      const fm = frontMask(dz);
      let r = base[0];
      let g = base[1];
      let b = base[2];
      const n = (hash(px >> 2, py >> 2, 5) - 0.5) * 6;
      r += n;
      g += n * 0.9;
      b += n * 0.8;
      if (fm > 0) {
        // blush + warm nose tip
        const blush = (g2(X, Y, -0.05, -0.028, 0.018, 0.013) + g2(X, Y, 0.05, -0.028, 0.018, 0.013)) * 0.55 + g2(X, Y, 0, -0.031, 0.008, 0.007) * 0.35;
        r += -6 * blush;
        g += -42 * blush;
        b += -32 * blush;
        // soft shadow in the sockets / under the brow
        const sock = (g2(X, Y, -EYE_X, EYE_Y + 0.004, 0.018, 0.012) + g2(X, Y, EYE_X, EYE_Y + 0.004, 0.018, 0.012)) * 0.4;
        r -= 26 * sock;
        g -= 34 * sock;
        b -= 24 * sock;
        // lips: crisp shapes (cupid's bow on top, fuller lower lip)
        const ax = Math.abs(X);
        const widthMask = sstep(0.0205, 0.0185, ax);
        const bow = 0.0016 * Math.exp(-(((ax - 0.0055) / 0.004) ** 2)) - 0.0008 * Math.exp(-((ax / 0.0025) ** 2));
        const upTop = MOUTH_Y + 0.0062 + bow - 0.0045 * (ax / 0.02) ** 2;
        const loBot = MOUTH_Y - 0.0085 + 0.0055 * (ax / 0.02) ** 2;
        const up = sstep(upTop + 0.0005, upTop - 0.0004, Y) * sstep(MOUTH_Y - 0.0002, MOUTH_Y + 0.0004, Y);
        const lo = sstep(loBot - 0.0005, loBot + 0.0004, Y) * sstep(MOUTH_Y + 0.0002, MOUTH_Y - 0.0004, Y);
        const lip = Math.min(1, up + lo) * widthMask * fm;
        const shine = lo * Math.exp(-(((Y - (MOUTH_Y - 0.0045)) / 0.0015) ** 2)) * Math.exp(-((X / 0.008) ** 2));
        r = r * (1 - lip) + (192 + 30 * shine) * lip;
        g = g * (1 - lip) + (92 + 40 * shine) * lip;
        b = b * (1 - lip) + (98 + 40 * shine) * lip;
        // mouth interior (only visible when the mouth opens)
        const gap = Math.exp(-(X * X) / (2 * 0.016 ** 2)) * Math.exp(-(((Y - MOUTH_Y) / 0.0006) ** 2)) * fm * 0.6;
        r = r * (1 - gap) + 70 * gap;
        g = g * (1 - gap) + 20 * gap;
        b = b * (1 - gap) + 28 * gap;
        // freckles
        if (Math.abs(Y + 0.025) < 0.016 && Math.abs(X) < 0.06 && hash(px >> 1, py >> 1, 9) > 0.992) {
          r -= 40;
          g -= 60;
          b -= 55;
        }
      }
      const i = (py * w + px) * 4;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // soften freckles slightly
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};
