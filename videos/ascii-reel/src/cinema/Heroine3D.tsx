import {useMemo} from 'react';
import * as THREE from 'three';
import {clamp, mix, smooth} from '../characters/anim';
import type {Emotion} from '../characters/Heroine';
import {type Key, type PoseName, current} from '../characters/timeline';
import {OUTRO_AT, at} from '../story';
import {emphasis} from './shots';
import {HEAD_R, HEAD_SY, capGeometry, hairSheetGeometry, headGeometry, ik} from './geom';
import {EYE_X, EYE_Y, MOUTH_Y, buildHead, facePoint, jawDrop, paintSkin} from './headSculpt';
import {signTexture} from './tex';
import {hairSheetTextures, irisTexture, knitTextures} from './tex';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ── 3D arm poses (hand targets, character space; x>0 = screen right) ──
type P3 = {L: THREE.Vector3; R: THREE.Vector3};
const REST: P3 = {L: V(-0.12, 0.8, 0.4), R: V(0.13, 0.8, 0.4)};
const POSES3: Record<PoseName, P3> = {
  rest: REST,
  wave: {L: REST.L, R: V(0.27, 1.45, 0.26)},
  heart: {L: V(-0.035, 1.12, 0.24), R: V(0.035, 1.12, 0.24)},
  chin: {L: REST.L, R: V(0.045, 1.25, 0.16)},
  fists: {L: V(-0.13, 1.0, 0.32), R: V(0.13, 1.0, 0.32)},
  shrug: {L: V(-0.36, 1.0, 0.26), R: V(0.36, 1.0, 0.26)},
  present: {L: V(-0.3, 0.98, 0.42), R: V(0.3, 0.98, 0.42)},
  cheer: {L: V(-0.3, 1.62, 0.12), R: V(0.3, 1.62, 0.12)},
  facepalm: {L: REST.L, R: V(0.035, 1.39, 0.17)},
  pointUp: {L: REST.L, R: V(0.33, 1.6, 0.26)},
};

// livelier gesture track for the 3D cut: a new gesture on almost every phrase
const G = (i: number, v: PoseName): Key<PoseName> => ({t: at(i) - 0.15, v});
const POSE_KEYS_3D: Key<PoseName>[] = [
  {t: 0, v: 'wave'}, G(2, 'present'), G(4, 'rest'), G(6, 'heart'), G(9, 'present'), G(12, 'rest'), G(18, 'chin'),
  G(25, 'rest'), G(29, 'fists'), G(32, 'shrug'), G(37, 'present'), G(42, 'rest'), G(47, 'chin'), G(52, 'pointUp'),
  G(55, 'shrug'), G(59, 'present'), G(66, 'cheer'), G(69, 'present'), G(71, 'rest'), G(74, 'pointUp'), G(80, 'cheer'),
  G(84, 'rest'), G(87, 'cheer'), G(93, 'fists'), G(96, 'facepalm'), G(99, 'rest'), G(103, 'pointUp'), G(106, 'chin'),
  G(110, 'present'), G(113, 'shrug'), G(118, 'present'), G(122, 'pointUp'), G(126, 'shrug'), G(130, 'present'),
  {t: OUTRO_AT, v: 'heart'},
];

export const pose3At = (t: number): P3 => {
  const {cur, prev} = current(POSE_KEYS_3D, t);
  const k = smooth((t - cur.t) / 0.32);
  const a = POSES3[prev.v];
  const b = POSES3[cur.v];
  const L = a.L.clone().lerp(b.L, k);
  const R = a.R.clone().lerp(b.R, k);
  if (cur.v === 'wave') R.add(V(Math.sin(t * 11) * 0.05 * k, Math.cos(t * 11) * 0.015 * k, 0));
  if (cur.v === 'cheer') {
    L.y += Math.sin(t * 9) * 0.02;
    R.y += Math.sin(t * 9 + 1.3) * 0.02;
  }
  if (cur.v === 'fists') {
    L.y += Math.sin(t * 15) * 0.012;
    R.y += Math.sin(t * 15 + 1.5) * 0.012;
  }
  if (cur.v === 'rest') {
    L.add(V(Math.sin(t * 13) * 0.008, Math.abs(Math.sin(t * 9)) * 0.01, 0));
    R.add(V(Math.sin(t * 12 + 1) * 0.008, Math.abs(Math.sin(t * 10 + 2)) * 0.01, 0));
  }
  return {L, R};
};

// ── materials (shared) ─────────────────────────────────────────────────
const useMaterials = () =>
  useMemo(() => {
    const knit = knitTextures();
    return {
      skin: new THREE.MeshPhysicalMaterial({
        map: paintSkin(), roughness: 0.5, sheen: 0.7, sheenColor: new THREE.Color('#ff8f7a'), sheenRoughness: 0.45, clearcoat: 0.06,
      }),
      skinPlain: new THREE.MeshPhysicalMaterial({color: '#f1c2a5', roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color('#ff8f7a')}),
      sweater: new THREE.MeshStandardMaterial({map: knit.map, normalMap: knit.normal, normalScale: new THREE.Vector2(1.4, 1.4), roughness: 0.92}),
      hair: (() => {
        const ht = hairSheetTextures();
        return new THREE.MeshStandardMaterial({
          map: ht.map, normalMap: ht.normal, normalScale: new THREE.Vector2(0.9, 0.9), alphaTest: 0.4, side: THREE.DoubleSide,
          roughness: 0.5, color: new THREE.Color('#cf9c86'), envMapIntensity: 0.4,
        });
      })(),
      hairBase: new THREE.MeshStandardMaterial({color: '#5c1f0c', roughness: 0.6}),
      eyeWhite: new THREE.MeshPhysicalMaterial({color: '#f7f3ef', roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05}),
      iris: new THREE.MeshPhysicalMaterial({map: irisTexture(), emissiveMap: irisTexture(), emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.28, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03}),
      lash: new THREE.MeshStandardMaterial({color: '#1d0f0a', roughness: 0.6}),
      brow: new THREE.MeshStandardMaterial({color: '#5a2210', roughness: 0.85}),
      lips: new THREE.MeshPhysicalMaterial({color: '#c55a5e', roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.2}),
      mouthIn: new THREE.MeshStandardMaterial({color: '#4a1219', roughness: 0.8}),
      teeth: new THREE.MeshStandardMaterial({color: '#f4efe8', roughness: 0.3}),
      gold: new THREE.MeshStandardMaterial({color: '#e2b65a', metalness: 1, roughness: 0.25}),
      catch: new THREE.MeshBasicMaterial({color: '#ffffff'}),
    };
  }, []);

// ── eye ───────────────────────────────────────────────────────────────
const EYE_R = 0.0262;
const Eye: React.FC<{x: number; m: ReturnType<typeof useMaterials>; lid: number; lower: number; gaze: [number, number]; side: number}> = ({x, m, lid, lower, gaze, side}) => {
  const p = facePoint(x, EYE_Y);
  const y = p.y;
  const z = p.z - EYE_R * 0.5;
  const iris = useMemo(() => capGeometry(EYE_R * 1.004, 0.7), []);
  const lidGeo = useMemo(() => new THREE.SphereGeometry(EYE_R * 1.09, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), []);
  const lowGeo = useMemo(() => new THREE.SphereGeometry(EYE_R * 1.07, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), []);
  const lashGeo = useMemo(() => new THREE.TorusGeometry(EYE_R * 1.1, 0.0021, 8, 40, Math.PI), []);
  const wingGeo = useMemo(() => new THREE.ConeGeometry(0.0022, 0.008, 6), []);
  return (
    <group position={[p.x, y, z]} rotation={[0, side * 0.1, 0]}>
      <group rotation={[gaze[1], gaze[0], 0]}>
        <mesh material={m.eyeWhite}>
          <sphereGeometry args={[EYE_R, 40, 28]} />
        </mesh>
        <mesh geometry={iris} material={m.iris} />
        <mesh position={[EYE_R * 0.22, EYE_R * 0.28, EYE_R * 0.98]} material={m.catch}>
          <sphereGeometry args={[EYE_R * 0.11, 12, 8]} />
        </mesh>
      </group>
      {/* upper lid + lashes */}
      <group rotation={[lid, 0, 0]}>
        <mesh geometry={lidGeo} material={m.skinPlain} />
        <mesh geometry={lashGeo} material={m.lash} rotation={[Math.PI / 2, 0, 0]} />
        <mesh geometry={wingGeo} material={m.lash} position={[side * EYE_R * 1.08, 0.002, EYE_R * 0.25]} rotation={[0, 0, -side * 1.1]} />
      </group>
      <group rotation={[lower, 0, 0]}>
        <mesh geometry={lowGeo} material={m.skinPlain} />
      </group>
    </group>
  );
};


// mouth interior: a lens conforming to the face between the lips (teeth on top, tongue below)
const mouthTex = () =>
  signTexture('mouth-in', 256, 128, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#f2ece6');
    g.addColorStop(0.22, '#e8dfd6');
    g.addColorStop(0.3, '#3b0f16');
    g.addColorStop(0.7, '#5a1a24');
    g.addColorStop(0.86, '#c4505e');
    g.addColorStop(1, '#d9707c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

const MouthLens: React.FC<{open: number; smile: number}> = ({open, smile}) => {
  const geo = useMemo(() => {
    if (open < 0.04) return null;
    const W = 0.0175 + smile * 0.002;
    const NS = 24;
    const NK = 8;
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= NS; i++) {
      const sx = (i / NS) * 2 - 1;
      const x = sx * W;
      const bow = 1 - sx * sx;
      const top = MOUTH_Y + 0.0012 * open * bow + smile * 0.004 * sx * sx;
      const bot = MOUTH_Y - jawDrop(x, open) * Math.pow(bow, 0.7) + smile * 0.004 * sx * sx;
      for (let k = 0; k <= NK; k++) {
        const y = top + (bot - top) * (k / NK);
        const p = facePoint(x, y, 0.0006);
        pos.push(p.x, p.y, p.z);
        uv.push(i / NS, 1 - k / NK);
      }
    }
    for (let i = 0; i < NS; i++) {
      for (let k = 0; k < NK; k++) {
        const a = i * (NK + 1) + k;
        const b = a + NK + 1;
        idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, [open, smile]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({map: mouthTex(), roughness: 0.6, side: THREE.DoubleSide}), []);
  return geo ? <mesh geometry={geo} material={mat} /> : null;
};

const Brow: React.FC<{side: number; raise: number; tilt: number; m: ReturnType<typeof useMaterials>}> = ({side, raise, tilt, m}) => {
  const geo = useMemo(() => {
    const y = 0.04 + raise;
    const inner = V(side * 0.016, y + tilt, 0);
    const mid = V(side * 0.042, y + 0.007 + tilt * 0.3, 0);
    const outer = V(side * 0.07, y - 0.004, 0);
    const pts = [inner, mid, outer].map((p) => facePoint(p.x, p.y / HEAD_SY, 0.0012));
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.0024, 8, false);
    return g;
  }, [side, raise, tilt]);
  return <mesh geometry={geo} material={m.brow} />;
};

// ── arm ───────────────────────────────────────────────────────────────
const Arm: React.FC<{shoulder: THREE.Vector3; target: THREE.Vector3; side: number; m: ReturnType<typeof useMaterials>}> = ({shoulder, target, side, m}) => {
  const {upper, fore, elbow, hand, q} = useMemo(() => {
    const pole = V(side * 0.35, -1, -0.15);
    const {elbow: e, hand: h} = ik(shoulder, target, 0.29, 0.28, pole);
    const mk = (a: THREE.Vector3, b: THREE.Vector3, r0: number) =>
      new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 1, r0, 18, false);
    const dir = h.clone().sub(e).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir);
    return {upper: mk(shoulder, e, 0.05), fore: mk(e, h, 0.043), elbow: e, hand: h, q: quat};
  }, [shoulder, target, side]);
  return (
    <group>
      <mesh geometry={upper} material={m.sweater} castShadow />
      <mesh geometry={fore} material={m.sweater} castShadow />
      <mesh position={elbow} material={m.sweater} castShadow>
        <sphereGeometry args={[0.049, 20, 14]} />
      </mesh>
      <group position={hand} quaternion={q}>
        <mesh material={m.sweater} position={[0, -0.005, 0]}>
          <torusGeometry args={[0.04, 0.009, 8, 24]} />
        </mesh>
        <mesh material={m.skinPlain} position={[0, 0.04, 0]} scale={[0.031, 0.042, 0.017]} castShadow>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
        {[-1.5, -0.5, 0.5, 1.5].map((f) => (
          <mesh key={f} material={m.skinPlain} position={[f * 0.0145, 0.088 - Math.abs(f) * 0.004, 0.003]} rotation={[0.25, 0, 0]}>
            <capsuleGeometry args={[0.0072, 0.03 - Math.abs(f) * 0.004, 4, 8]} />
          </mesh>
        ))}
        <mesh material={m.skinPlain} position={[side * -0.03, 0.045, 0.012]} rotation={[0.3, 0, side * 0.8]}>
          <capsuleGeometry args={[0.0085, 0.026, 4, 8]} />
        </mesh>
      </group>
    </group>
  );
};

export type HeroineState = {
  emo: Emotion;
  mouth: number;
  blink: number;
  look: [number, number]; // head yaw/pitch towards camera (rad)
  t: number;
};

export const Heroine3D: React.FC<HeroineState> = ({emo, mouth, blink, look, t}) => {
  const m = useMaterials();
  const head = useMemo(() => buildHead(), []);
  const hairCap = useMemo(
    () => headGeometry(HEAD_R, 1.04, (x, y, z) => z < -0.03),
    [],
  );
  const hair = useMemo(() => [hairSheetGeometry(-1), hairSheetGeometry(1), hairSheetGeometry(-1, true), hairSheetGeometry(1, true)], []);
  const torso = useMemo(() => {
    const prof = [
      [0.0, 0.55], [0.12, 0.56], [0.124, 0.74], [0.136, 0.88], [0.152, 1.0], [0.163, 1.11], [0.172, 1.18], [0.162, 1.245], [0.11, 1.288], [0.05, 1.308], [0.0, 1.312],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const g = new THREE.LatheGeometry(prof, 64);
    g.scale(1, 1, 0.6);
    return g;
  }, []);
  const pose = pose3At(t);
  const shL = V(-0.165, 1.19, 0.0);
  const shR = V(0.165, 1.19, 0.0);

  const eyeOpen = clamp(emo.eyeOpen * (1 - blink), 0, 1.3);
  const lid = mix(0.3, -0.78, clamp(eyeOpen / 1.25, 0, 1));
  const lower = mix(0.8, 0.3, emo.squint);
  const gaze: [number, number] = [emo.gazeX * 0.03 + look[0] * 0.6, emo.gazeY * 0.03 + look[1] * 0.6];
  const shock = clamp(emo.eyeOpen - 1.05, 0, 0.2) * 5;
  const breath = Math.sin(t * 1.6) * 0.004;
  const mouthAmt = clamp(mouth * 1.05 + shock * 0.7, 0, 1.2);
  const emph = emphasis(t);
  const headRot: [number, number, number] = [
    look[1] * 0.45 + Math.sin(t * 2.1) * 0.016 + (mouth - 0.3) * 0.04 + emph * 0.07,
    look[0] * 0.45 + Math.sin(t * 0.7) * 0.05 + Math.sin(t * 1.9) * 0.02,
    (-emo.headTilt * Math.PI) / 180 * 1.3 + Math.sin(t * 1.3) * 0.025,
  ];
  const lean = Math.sin(t * 0.55) * 0.025 + emph * 0.03;

  return (
    <group rotation={[lean, Math.sin(t * 0.4) * 0.04, Math.sin(t * 0.33) * 0.015]} position={[0, 0, 0]}>
      {/* torso + sweater */}
      <mesh geometry={torso} material={m.sweater} position={[0, breath, 0]} castShadow receiveShadow />
      <mesh material={m.sweater} position={[0, 1.302 + breath, 0.0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.82, 1]}>
        <torusGeometry args={[0.058, 0.013, 12, 40]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={m.sweater} position={[s * 0.158, 1.2 + breath, 0]} castShadow>
          <sphereGeometry args={[0.062, 24, 16]} />
        </mesh>
      ))}
      {/* neck + necklace */}
      <mesh material={m.skinPlain} position={[0, 1.35, -0.012]}>
        <cylinderGeometry args={[0.045, 0.05, 0.1, 24]} />
      </mesh>
      {/* head */}
      <group position={[0, 1.445 + breath, 0]} rotation={headRot}>
        <mesh
          geometry={head}
          material={m.skin}
          castShadow
          receiveShadow
          morphTargetInfluences={[mouthAmt, clamp(emo.smile, 0, 1), clamp(-emo.smile, 0, 1)]}
        />
        <MouthLens open={Math.round(mouthAmt * 30) / 30} smile={Math.round(clamp(emo.smile, -1, 1) * 20) / 20} />
        <mesh geometry={hairCap} material={m.hairBase} />
        <Eye x={-0.041} m={m} lid={lid} lower={lower} gaze={gaze} side={-1} />
        <Eye x={0.041} m={m} lid={lid} lower={lower} gaze={gaze} side={1} />
        <Brow side={-1} raise={emo.browRaise * 0.001} tilt={emo.browTilt * 0.0009} m={m} />
        <Brow side={1} raise={emo.browRaise * 0.001} tilt={emo.browTilt * 0.0009} m={m} />
        {hair.map((g, i) => (
          <mesh key={i} geometry={g} material={m.hair} castShadow />
        ))}
      </group>

      <Arm shoulder={shL} target={pose.L} side={-1} m={m} />
      <Arm shoulder={shR} target={pose.R} side={1} m={m} />
    </group>
  );
};

export {HEAD_SY};
