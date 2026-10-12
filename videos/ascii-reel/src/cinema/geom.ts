import * as THREE from 'three';
import {hash} from '../lib/rng';

export const HEAD_R = 0.11;
export const HEAD_SY = 1.05;

const sstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Stylised face shape: tapered jaw, fuller cheeks, bigger cranium. Input: point on a sphere of radius R. */
export const deformHead = (x0: number, y0: number, z0: number, R: number): [number, number, number] => {
  const ny = y0 / R;
  const k = Math.pow(sstep(-0.25, -1.0, ny), 1.2);
  const cheek = Math.exp(-(((ny + 0.25) / 0.3) ** 2));
  const x = x0 * (1 - 0.3 * k) * (1 + 0.07 * cheek);
  const y = y0 * HEAD_SY;
  let z = z0;
  if (z0 > 0) z *= 1 - 0.06 * k;
  else z *= 1.06;
  return [x, y, z];
};

/** z of the front face surface at head-local (x, y) */
export const faceZ = (x: number, y: number, R = HEAD_R) => {
  const y0 = y / HEAD_SY;
  const ny = y0 / R;
  const k = sstep(0.15, -1.0, ny);
  const cheek = Math.exp(-(((ny + 0.15) / 0.25) ** 2));
  const x0 = x / ((1 - 0.38 * k) * (1 + 0.06 * cheek));
  const z0 = Math.sqrt(Math.max(0, R * R - x0 * x0 - y0 * y0));
  return z0 * (1 - 0.16 * k);
};

export const headGeometry = (R = HEAD_R, scale = 1, keep?: (x: number, y: number, z: number) => boolean) => {
  const g = new THREE.SphereGeometry(R * scale, 96, 64);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const [x, y, z] = deformHead(pos.getX(i), pos.getY(i), pos.getZ(i), R * scale);
    pos.setXYZ(i, x, y, z);
  }
  if (keep) {
    const idx = g.index!;
    const out: number[] = [];
    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i);
      const b = idx.getX(i + 1);
      const c = idx.getX(i + 2);
      const cx = (pos.getX(a) + pos.getX(b) + pos.getX(c)) / 3;
      const cy = (pos.getY(a) + pos.getY(b) + pos.getY(c)) / 3;
      const cz = (pos.getZ(a) + pos.getZ(b) + pos.getZ(c)) / 3;
      if (keep(cx, cy, cz)) out.push(a, b, c);
    }
    g.setIndex(out);
  }
  g.computeVertexNormals();
  return g;
};

/** Spherical cap facing +z with planar UVs (for the iris) */
export const capGeometry = (r: number, angle: number, rings = 16, segs = 48) => {
  const verts: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  const maxRho = Math.sin(angle) * r;
  for (let i = 0; i <= rings; i++) {
    const a = (i / rings) * angle;
    const rho = Math.sin(a) * r;
    const z = Math.cos(a) * r;
    for (let j = 0; j <= segs; j++) {
      const p = (j / segs) * Math.PI * 2;
      const x = Math.cos(p) * rho;
      const y = Math.sin(p) * rho;
      verts.push(x, y, z);
      uvs.push(0.5 + (x / maxRho) * 0.5, 0.5 + (y / maxRho) * 0.5);
    }
  }
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * (segs + 1) + j;
      const b = a + segs + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

/** Long straight hair with a centre part: many textured ribbons (head-local coordinates). */
export const hairGeometry = () => {
  const R = HEAD_R * 1.11;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const index: number[] = [];
  const SEG = 44;
  const strands: {alpha: number; side: number; layer: number; jitter: number}[] = [];
  const N = 78;
  for (let layer = 0; layer < 2; layer++) {
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < N; i++) {
        const s = (i + (layer ? 0.5 : 0)) / N;
        // part runs from the front hairline (55°) over the top to the crown (165°)
        strands.push({alpha: (55 + s * 110) * (Math.PI / 180), side, layer, jitter: hash(i, side + 5, layer)});
      }
    }
  }
  const pt = new THREE.Vector3();
  strands.forEach((st, si) => {
    const {alpha, side, layer, jitter} = st;
    const d = new THREE.Vector3(0, Math.sin(alpha), Math.cos(alpha));
    const sideV = new THREE.Vector3(side, 0, 0);
    const front = Math.cos(alpha); // 1 = front of head, -1 = back
    const pts: THREE.Vector3[] = [];
    const rr = R * (layer ? 0.975 : 1.025);
    // over the scalp: great circle from the part to below the side of the head
    const betaEnd = (100 + front * 6) * (Math.PI / 180);
    for (let k = 0; k <= 10; k++) {
      const b = (k / 10) * betaEnd;
      pt.copy(d).multiplyScalar(Math.cos(b)).addScaledVector(sideV, Math.sin(b)).normalize().multiplyScalar(rr);
      const [x, y, z] = deformHead(pt.x, pt.y, pt.z, rr);
      pts.push(new THREE.Vector3(x + side * 0.004 * Math.sin(b), y, z));
    }
    const e = pts[pts.length - 1];
    // fall: in front of the shoulders for front strands, behind for back strands
    const zFall = front > 0.15 ? 0.13 + front * 0.05 + jitter * 0.02 : front > -0.35 ? 0.02 + front * 0.1 : -0.1 + front * 0.03;
    const xs = side * (0.135 + Math.abs(front) * 0.01 + jitter * 0.035 + layer * 0.008);
    const tipY = -0.7 - jitter * 0.12 - (front < 0 ? 0.05 : 0);
    const ctrl = [
      e,
      new THREE.Vector3(e.x * 1.08 + side * 0.01, -0.12, e.z * 0.6 + zFall * 0.4),
      new THREE.Vector3(xs * 1.02, -0.26, zFall),
      new THREE.Vector3(xs * 0.98, -0.46, zFall + 0.01),
      new THREE.Vector3(xs * 0.93 + side * jitter * 0.01, tipY, zFall - 0.005),
    ];
    const fall = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal').getPoints(SEG - 10);
    const all = pts.concat(fall.slice(1));
    const total = all.length;
    const width = 0.026 + jitter * 0.01;
    const base = positions.length / 3;
    const shade = layer ? 0.78 + jitter * 0.12 : 0.95 + jitter * 0.15;
    for (let k = 0; k < total; k++) {
      const p = all[k];
      const prev = all[Math.max(0, k - 1)];
      const next = all[Math.min(total - 1, k + 1)];
      const dir = next.clone().sub(prev).normalize();
      const outward = k < 11 ? p.clone().normalize() : new THREE.Vector3(p.x, 0, p.z).normalize();
      const wdir = new THREE.Vector3().crossVectors(dir, outward).normalize();
      const v = k / (total - 1);
      const w = width * (1 - v * 0.35);
      for (const sgn of [-1, 1]) {
        positions.push(p.x + wdir.x * w * 0.5 * sgn, p.y + wdir.y * w * 0.5 * sgn, p.z + wdir.z * w * 0.5 * sgn);
        normals.push(outward.x, outward.y, outward.z);
        uvs.push(sgn < 0 ? 0 : 1, 1 - v);
        colors.push(shade, shade, shade);
      }
    }
    for (let k = 0; k < total - 1; k++) {
      const a = base + k * 2;
      index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    void si;
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(index);
  return g;
};

/** two-bone IK with a pole hint; returns elbow position */
export const ik = (s: THREE.Vector3, t: THREE.Vector3, a: number, b: number, pole: THREE.Vector3) => {
  const st = t.clone().sub(s);
  let d = st.length();
  d = Math.min(Math.max(d, Math.abs(a - b) + 0.01), a + b - 0.001);
  const dir = st.normalize();
  const cosA = (a * a + d * d - b * b) / (2 * a * d);
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  const p = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
  const elbow = s.clone().addScaledVector(dir, a * cosA).addScaledVector(p, a * sinA);
  const hand = s.clone().addScaledVector(dir, d);
  return {elbow, hand};
};

/**
 * Smooth hair mass for one side (side = -1 | 1): a continuous sheet whose columns run from the
 * centre part over the skull and fall down past the shoulders (u: front→back, v: root→tip).
 */
export const hairSheetGeometry = (side: number, inner = false) => {
  const NU = 46;
  const NS = 14; // scalp samples
  const NF = 46; // fall samples
  const positions: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  const pt = new THREE.Vector3();
  const sst = (e0: number, e1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };
  for (let iu = 0; iu < NU; iu++) {
    const u = iu / (NU - 1);
    const alpha = ((52 + u * 126) * Math.PI) / 180;
    const d = new THREE.Vector3(0, Math.sin(alpha), Math.cos(alpha));
    const sideV = new THREE.Vector3(side, 0, 0);
    const front = Math.cos(alpha);
    const vol = (inner ? 1.06 : 1.095) + 0.04 * Math.sin(Math.PI * Math.min(1, u * 1.25));
    const rr = HEAD_R * vol;
    const pts: THREE.Vector3[] = [];
    // end point on the side of the head spreads front→back with u, so the curtain stays wide
    const zS = 0.78 - 1.62 * u;
    const S = new THREE.Vector3(side * 0.93, -0.2 + 0.08 * Math.abs(zS), zS).normalize();
    const P = d.clone();
    const ang = P.angleTo(S);
    const axis = new THREE.Vector3().crossVectors(P, S).normalize();
    for (let k = 0; k < NS; k++) {
      const f = k / (NS - 1);
      const dir = P.clone().applyAxisAngle(axis, ang * f);
      const part = 1 - 0.035 * Math.exp(-(((f * ang) / 0.12) ** 2)); // slight dip along the parting
      const bulge = 1 + 0.03 * Math.sin(Math.PI * f);
      pt.copy(dir).multiplyScalar(rr * part * bulge);
      const [x, y, z] = deformHead(pt.x, pt.y, pt.z, rr);
      pts.push(new THREE.Vector3(x, y, z));
    }
    const e = pts[pts.length - 1];
    const s = sst(-0.25, 0.25, zS); // 1 = falls in front of the shoulder, 0 = behind
    const zFall = (1 - s) * (-0.06 + zS * 0.05) + s * (0.1 + 0.06 * zS) - (inner ? 0.008 : 0);
    const xs = side * (0.135 + 0.06 * (1 - Math.abs(zS)) + 0.01 * Math.sin(u * 7));
    const tipY = -0.8 - 0.03 * Math.sin(u * 11) - (1 - s) * 0.04;
    const ctrl = [
      e,
      new THREE.Vector3(e.x * 1.035 + side * 0.004, e.y - 0.085, e.z * 0.75 + zFall * 0.25),
      new THREE.Vector3(xs * 1.05, -0.3, zFall),
      new THREE.Vector3(xs * 1.0, -0.52, zFall + 0.006),
      new THREE.Vector3(xs * 0.95, tipY, zFall - 0.004),
    ];
    const fall = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal').getPoints(NF);
    const all = pts.concat(fall.slice(1));
    const total = all.length;
    all.forEach((p, k) => {
      positions.push(p.x, p.y, p.z);
      uvs.push(u, 1 - k / (total - 1));
    });
  }
  const NV = NS + NF;
  for (let iu = 0; iu < NU - 1; iu++) {
    for (let k = 0; k < NV - 1; k++) {
      const a = iu * NV + k;
      const b = (iu + 1) * NV + k;
      if (side > 0) index.push(a, a + 1, b, b, a + 1, b + 1);
      else index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
};
