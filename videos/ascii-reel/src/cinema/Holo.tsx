import {useThree} from '@react-three/fiber';
import {useMemo} from 'react';
import * as THREE from 'three';
import {clamp, fade, smooth} from '../characters/anim';
import {NUNITO} from '../fonts';
import {hash} from '../lib/rng';
import {OUTRO_AT, at} from '../story';
import {dotTexture, signTexture} from './tex';
import {cameraAt} from './shots';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** glowing hologram card texture (white; tinted by the material colour) */
const holoTex = (key: string, lines: string[], opts: {sub?: string; icon?: 'phone' | 'check' | 'coin' | 'store' | 'q' | 'heart'; w?: number; h?: number} = {}) =>
  signTexture(`holo-${key}`, opts.w ?? 1024, opts.h ?? 640, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 6;
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 24;
    const r = 46;
    ctx.beginPath();
    ctx.roundRect(18, 18, w - 36, h - 36, r);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fill();
    // corner ticks
    ctx.lineWidth = 10;
    [[40, 40], [w - 40, 40], [40, h - 40], [w - 40, h - 40]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const big = lines.length > 1 ? 150 : 190;
    ctx.font = `900 ${big}px ${NUNITO}, sans-serif`;
    let fs = big;
    const maxW = w - 140;
    lines.forEach((l) => {
      while (ctx.measureText(l).width > maxW && fs > 60) {
        fs -= 6;
        ctx.font = `900 ${fs}px ${NUNITO}, sans-serif`;
      }
    });
    const top = opts.sub ? h * 0.42 : h * 0.5;
    lines.forEach((l, i) => ctx.fillText(l, w / 2, top + (i - (lines.length - 1) / 2) * fs * 1.0));
    if (opts.sub) {
      ctx.font = `800 64px ${NUNITO}, sans-serif`;
      ctx.fillText(opts.sub, w / 2, h * 0.78);
    }
    // scanlines
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'destination-out';
    for (let y = 0; y < h; y += 6) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, y, w, 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  });

const Panel: React.FC<{
  tex: THREE.Texture; pos: THREE.Vector3; w: number; color: string; appear: number; out?: number; t: number; glitch?: number; aspect?: number;
}> = ({tex, pos, w, color, appear, out = 0, t, glitch = 0}) => {
  const camera = useThree((s) => s.camera);
  const a = clamp(appear) * (1 - clamp(out));
  if (a <= 0.001) return null;
  const img = tex.image as HTMLCanvasElement;
  const h = (w * img.height) / img.width;
  const flick = 0.82 + 0.18 * Math.sin(t * 37 + pos.x * 10) * Math.sin(t * 11);
  const gx = glitch > 0 && hash(Math.floor(t * 20), 3) < glitch ? (hash(Math.floor(t * 30), 4) - 0.5) * 0.06 : 0;
  const p = pos.clone().add(V(gx, Math.sin(t * 1.4 + pos.x * 3) * 0.012, 0));
  const yaw = Math.atan2(camera.position.x - p.x, camera.position.z - p.z);
  const inK = clamp(appear);
  const fly = 1 - inK; // 1 at the start of the entrance
  const spin = fly * fly * Math.PI * 1.2 * (pos.x >= camera.position.x ? 1 : -1);
  const slide = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)).multiplyScalar(fly * fly * 0.35 * (pos.x >= camera.position.x ? 1 : -1));
  const burst = appear > 0 && appear < 1.6 ? Math.min(1, appear) : 0;
  return (
    <group>
      <group position={p.clone().add(slide)} rotation={[0, yaw + spin, 0]} scale={[0.6 + 0.4 * inK, Math.min(1, appear * 1.6) * (0.6 + 0.4 * inK), 1]}>
        <mesh>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={tex} color={color} transparent opacity={a * flick} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, -0.002]} scale={[1.08, 1.12, 1]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={dotTexture()} color={color} transparent opacity={(0.22 + 0.5 * fly) * a} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      {burst > 0 && appear < 1
        ? Array.from({length: 10}).map((_, i) => {
            const ang = (i / 10) * Math.PI * 2 + pos.x * 7;
            const r = w * (0.25 + appear * 0.75);
            const q = p.clone().add(new THREE.Vector3(Math.cos(ang) * r * Math.cos(yaw), Math.sin(ang) * r * 0.7, -Math.cos(ang) * r * Math.sin(yaw)));
            return (
              <sprite key={i} position={q} scale={[w * 0.08, w * 0.08, 1]}>
                <spriteMaterial map={dotTexture()} color={color} transparent opacity={(1 - appear) * 0.9} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
              </sprite>
            );
          })
        : null}
    </group>
  );
};

// ── coins ─────────────────────────────────────────────────────────────
const useCoinMats = () =>
  useMemo(() => {
    const face = signTexture('coinface', 256, 256, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w * 0.4, h * 0.35, 10, w / 2, h / 2, w / 2);
      g.addColorStop(0, '#ffe9a8');
      g.addColorStop(1, '#c8902a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#a8731c';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#9a6612';
      ctx.font = `900 150px ${NUNITO}, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('₽', w / 2, h / 2 + 8);
    });
    const side = new THREE.MeshStandardMaterial({color: '#d9a640', metalness: 1, roughness: 0.28});
    const cap = new THREE.MeshStandardMaterial({map: face, metalness: 0.9, roughness: 0.3});
    return [side, cap, cap];
  }, []);

const COINS = 46;
const Coins: React.FC<{t: number}> = ({t}) => {
  const mats = useCoinMats();
  const geo = useMemo(() => new THREE.CylinderGeometry(0.034, 0.034, 0.006, 40), []);
  const start = at(87);
  const crash = at(93) + 0.1;
  if (t < start - 0.1 || t > at(99)) return null;
  return (
    <group>
      {Array.from({length: COINS}).map((_, i) => {
        const t0 = start + (i / COINS) * 3.6;
        const x = (hash(i, 1) > 0.5 ? 1 : -1) * (0.12 + hash(i, 11) * 0.34);
        const z = 0.24 + hash(i, 2) * 0.62;
        const restY = 0.768 + (hash(i, 3) * 0.012);
        const d = t - t0;
        if (d < 0) return null;
        let y = 2.15 - 4.9 * d * d;
        let px = x;
        let pz = z;
        let rx = d * 9 + i;
        let rz = d * 5;
        if (y <= restY) {
          y = restY;
          rx = Math.PI / 2 * 0 + (hash(i, 6) - 0.5) * 0.2;
          rz = (hash(i, 7) - 0.5) * 0.3;
        }
        if (t > crash && t0 < crash) {
          // explosion: launched from where it lay
          const e = t - crash;
          const vx = (x >= 0 ? 1 : -1) * (0.6 + hash(i, 8) * 1.2);
          const vz = 0.4 + hash(i, 9) * 1.2;
          px = x + vx * e;
          pz = z + vz * e;
          y = restY + (1.6 + hash(i, 10) * 1.4) * e - 4.9 * e * e;
          rx = e * 14 + i;
          rz = e * 9;
          if (y < 0) return null;
        }
        return (
          <mesh key={i} geometry={geo} material={mats} position={[px, y, pz]} rotation={[rx, 0, rz]} castShadow />
        );
      })}
    </group>
  );
};

const Phone: React.FC<{t: number; pos: THREE.Vector3; appear: number; grey: number; color: string}> = ({t, pos, appear, grey, color}) => {
  const screen = useMemo(
    () =>
      signTexture('phone-screen', 256, 512, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#9b7bff');
        g.addColorStop(1, '#ff7ac0');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.roundRect(w * 0.27, h * 0.3, w * 0.46, w * 0.46, 30);
        ctx.fill();
        ctx.fillStyle = '#ff5c8a';
        ctx.font = `900 90px ${NUNITO}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♥', w / 2, h * 0.3 + w * 0.23 + 4);
        ctx.fillStyle = '#fff';
        ctx.font = `900 40px ${NUNITO}`;
        ctx.fillText('МОЁ APP', w / 2, h * 0.68);
      }),
    [],
  );
  const a = clamp(appear);
  if (a <= 0.001) return null;
  const s = (0.6 + 0.4 * a) * 0.42;
  return (
    <group position={pos} rotation={[0.1, -0.5 + Math.sin(t * 0.8) * 0.25 + (1 - a) * 3, 0.05]} scale={[s, s, s]}>
      <mesh castShadow>
        <boxGeometry args={[0.13, 0.26, 0.012]} />
        <meshPhysicalMaterial color="#1c1d26" metalness={0.6} roughness={0.25} clearcoat={1} transparent opacity={a} />
      </mesh>
      <mesh position={[0, 0, 0.0065]}>
        <planeGeometry args={[0.118, 0.244]} />
        <meshBasicMaterial map={screen} color={new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.6).lerp(new THREE.Color('#556070'), grey)} transparent opacity={a} toneMapped={false} />
      </mesh>
    </group>
  );
};

/**
 * camera-space slot -> world position: sx/sy in fractions of the half frame (x right, y up),
 * at distance D in front of the lens. Keeps the story holograms framed in every shot.
 */
export const slot = (t: number, sx: number, sy: number, D = 0.85) => {
  const c = cameraAt(t);
  const pos = new THREE.Vector3(...c.pos);
  const fwd = new THREE.Vector3(...c.look).sub(pos).normalize();
  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
  const halfH = Math.tan(((c.fov / 2) * Math.PI) / 180) * D;
  const halfW = (halfH * 9) / 16;
  return pos.addScaledVector(fwd, D).addScaledVector(right, sx * halfW).addScaledVector(up, sy * halfH);
};
export const slotW = (t: number, frac: number, D = 0.85) => {
  const c = cameraAt(t);
  return ((Math.tan(((c.fov / 2) * Math.PI) / 180) * D * 9) / 16) * 2 * frac;
};

/** what she looks at when not looking into the lens */
export const holoFocus = (t: number) => {
  if (t < at(4)) return V(0, 0.95, 0.45);
  if (t < at(12)) return slot(t, 0.45, -0.25, 0.75);
  if (t < at(25)) return slot(t, 0, -0.3);
  if (t < at(42)) return slot(t, -0.42, -0.22);
  if (t < at(47)) return V(0, 0.95, 0.45);
  if (t < at(66)) return slot(t, 0.42, -0.22);
  if (t < at(83)) return slot(t, -0.42, -0.2);
  if (t < at(92)) return V(0, 1.7, 0.4);
  if (t < at(105)) return slot(t, 0.42, -0.22);
  return slot(t, -0.42, -0.22);
};

export const Holograms: React.FC<{t: number; color: string; intensity: number}> = ({t, color, intensity}) => {
  const tx = useMemo(
    () => ({
      y2021: holoTex('2021', ['2021'], {sub: 'учусь'}),
      y2022: holoTex('2022', ['2022']),
      google: holoTex('google', ['Google Play'], {sub: 'ЗАКРЫТО'}),
      zero: holoTex('zero', ['0 ₽']),
      later: holoTex('later', ['ОТЛОЖЕНО']),
      yandex: holoTex('yandex', ['Яндекс'], {sub: 'новая надежда'}),
      q: holoTex('q', ['?'], {w: 512, h: 512}),
      check1: holoTex('c1', ['✓ разобралась'], {w: 1024, h: 300}),
      check2: holoTex('c2', ['✓ всё сделала'], {w: 1024, h: 300}),
      check3: holoTex('c3', ['✓ модерация'], {w: 1024, h: 300}),
      check4: holoTex('c4', ['✓ работает!'], {w: 1024, h: 300}),
      ok: holoTex('ok', ['ОДОБРЕНО']),
      money: holoTex('money', ['+ ₽ ₽ ₽']),
      err: holoTex('err', ['$#%@!'], {sub: 'ERROR'}),
      rustore: holoTex('rustore', ['RuStore']),
      vk: holoTex('vk', ['VK ID ?']),
      need: holoTex('need', ['нужен?']),
      novk: holoTex('novk', ['без VK?']),
      comments: holoTex('comments', ['ЧТО', 'ДУМАЕТЕ?']),
    }),
    [],
  );
  const L = slot(t, -0.42, -0.22);
  const R = slot(t, 0.42, -0.22);
  const up = slot(t, 0.0, -0.3);
  const PW = slotW(t, 0.52);
  const win = (a: number, b: number, f = 0.35) => Math.min(smooth((t - a) / f), 1 - smooth((t - (b - f)) / f));
  const focus = holoFocus(t);
  const GOLD = '#ffc23a';
  return (
    <group>
      {/* story light cast on her from the active hologram */}
      <pointLight position={focus.clone().add(V(0, 0, 0.1))} color={color} intensity={intensity * 0.35} distance={1.6} decay={2} />

      <Phone t={t} pos={slot(t, 0.58, -0.42 - smooth((t - at(44)) / 1.2) * 0.6, 0.8)} appear={win(at(4) + 0.2, at(12) + 0.1) + win(at(42), at(47))} grey={fade(t, at(42), 0.6)} color="#b48cff" />
      <Panel tex={tx.y2021} pos={up} w={PW} color="#7cc8ff" appear={win(at(22) - 0.2, at(25))} t={t} />
      <Panel tex={tx.y2022} pos={up} w={PW} color="#ffb347" appear={win(at(25), at(32))} t={t} glitch={0.15} />
      <Panel tex={tx.google} pos={L} w={PW} color="#ff3b3b" appear={win(at(32), at(42) + 0.3)} t={t} glitch={0.25} />
      <Panel tex={tx.zero} pos={slot(t, 0.45, 0.05)} w={PW * 0.7} color="#ff4d4d" appear={win(at(37) + 0.2, at(42) + 0.3)} t={t} glitch={0.2} />
      <Panel tex={tx.later} pos={slot(t, 0.38, -0.3)} w={PW * 0.8} color="#9aa7c0" appear={win(at(43), at(47))} t={t} />
      <Panel tex={tx.yandex} pos={R} w={PW} color="#ffcc33" appear={win(at(53) - 0.15, at(66))} t={t} />
      <Panel tex={tx.q} pos={slot(t, -0.5, 0.05)} w={PW * 0.35} color="#ffcc33" appear={win(at(55), at(59) + 0.3)} t={t} />
      <Panel tex={tx.check1} pos={slot(t, -0.42, -0.08)} w={PW} color="#3dff8f" appear={win(at(69), at(83))} t={t} />
      <Panel tex={tx.check2} pos={slot(t, -0.42, -0.2)} w={PW} color="#3dff8f" appear={win(at(72), at(83))} t={t} />
      <Panel tex={tx.check3} pos={slot(t, -0.42, -0.32)} w={PW} color="#3dff8f" appear={win(at(75), at(83))} t={t} />
      <Panel tex={tx.check4} pos={slot(t, -0.42, -0.44)} w={PW} color="#3dff8f" appear={win(at(81), at(83))} t={t} />
      <Panel tex={tx.ok} pos={slot(t, 0.42, -0.1)} w={PW * 0.9} color="#3dff8f" appear={win(at(77), at(83))} t={t} />
      <Panel tex={tx.money} pos={slot(t, 0.4, -0.25)} w={PW} color={GOLD} appear={win(at(88), at(93))} t={t} />
      <Panel tex={tx.err} pos={slot(t, 0.0, -0.3)} w={PW * 1.1} color="#ff2a2a" appear={win(at(96) - 0.1, at(99))} t={t} glitch={0.7} />
      <Panel tex={tx.rustore} pos={R} w={PW} color="#2f8cff" appear={win(at(101) - 0.15, at(106))} t={t} />
      <Panel tex={tx.vk} pos={L} w={PW} color="#2787f5" appear={win(at(110), at(130))} t={t} />
      <Panel tex={tx.need} pos={slot(t, 0.42, -0.02)} w={PW * 0.8} color="#8fb8ff" appear={win(at(118), at(122))} t={t} />
      <Panel tex={tx.novk} pos={slot(t, 0.42, -0.02)} w={PW * 0.8} color="#8fb8ff" appear={win(at(122), at(130))} t={t} />
      <Panel tex={tx.comments} pos={slot(t, 0, -0.32)} w={PW * 1.2} color="#ff6fae" appear={fade(t, at(130))} t={t} />
      {/* floating question marks orbiting her head during the VK question */}
      {t > at(106) && t < at(130) + 0.3
        ? [0, 1, 2].map((i) => {
            const a = t * 0.9 + (i * Math.PI * 2) / 3;
            return (
              <Panel key={i} tex={tx.q} pos={V(Math.cos(a) * 0.28, 1.62 + Math.sin(t * 1.3 + i) * 0.03, Math.sin(a) * 0.2 + 0.1)} w={0.07} color="#8fb8ff" appear={win(at(106) + i * 0.2, at(130) + 0.3)} t={t} />
            );
          })
        : null}
      {/* outro hearts rising */}
      {t > OUTRO_AT - 1.2
        ? Array.from({length: 8}).map((_, i) => {
            const k = ((t - (OUTRO_AT - 1.2)) * 0.35 + hash(i, 81)) % 1;
            return <Panel key={i} tex={holoTex('heart', ['♥'], {w: 512, h: 512})} pos={V((hash(i, 82) - 0.5) * 0.9, 1.0 + k * 1.0, 0.35 + hash(i, 83) * 0.2)} w={0.07} color="#ff6fae" appear={Math.sin(k * Math.PI)} t={t} />;
          })
        : null}
      <Coins t={t} />
    </group>
  );
};
