import {useMemo} from 'react';
import * as THREE from 'three';
import {NUNITO} from '../fonts';
import {hash} from '../lib/rng';
import {beamTexture, dotTexture, plasterTextures, signTexture, woodTextures} from './tex';

const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

/** clock hands angle: time-lapse speed-ups are driven by `clockT` (hours) */
export const Clock: React.FC<{hours: number}> = ({hours}) => {
  const face = useMemo(
    () =>
      signTexture('clockface', 1024, 1024, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#16181c';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `800 104px ${NUNITO}, serif`;
        ROMAN.forEach((r, i) => {
          const a = (i / 12) * Math.PI * 2;
          const rr = w * 0.37;
          ctx.save();
          ctx.translate(w / 2 + Math.sin(a) * rr, h / 2 - Math.cos(a) * rr);
          ctx.rotate(a);
          ctx.fillText(r, 0, 0);
          ctx.restore();
        });
      }),
    [],
  );
  const black = useMemo(() => new THREE.MeshStandardMaterial({color: '#1b1d22', metalness: 0.6, roughness: 0.45}), []);
  const minA = -(hours % 1) * Math.PI * 2;
  const hrA = -((hours % 12) / 12) * Math.PI * 2;
  return (
    <group>
      <mesh material={black} castShadow>
        <torusGeometry args={[0.4, 0.014, 12, 96]} />
      </mesh>
      <mesh material={black}>
        <torusGeometry args={[0.24, 0.006, 8, 96]} />
      </mesh>
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[0.86, 0.86]} />
        <meshStandardMaterial map={face} transparent roughness={0.6} />
      </mesh>
      <group rotation={[0, 0, hrA]} position={[0, 0, 0.016]}>
        <mesh material={black} position={[0, 0.09, 0]}>
          <boxGeometry args={[0.018, 0.2, 0.006]} />
        </mesh>
      </group>
      <group rotation={[0, 0, minA]} position={[0, 0, 0.022]}>
        <mesh material={black} position={[0, 0.14, 0]}>
          <boxGeometry args={[0.011, 0.3, 0.006]} />
        </mesh>
      </group>
      <mesh material={black} position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.012, 20]} />
      </mesh>
    </group>
  );
};

const Laptop: React.FC<{screenColor: string}> = ({screenColor}) => {
  const alu = useMemo(() => new THREE.MeshStandardMaterial({color: '#c9ccd2', metalness: 0.85, roughness: 0.32}), []);
  return (
    <group position={[0.02, 0.76, 0.43]}>
      <mesh material={alu} position={[0, 0.008, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.32, 0.014, 0.225]} />
      </mesh>
      {/* lid hinged at the far edge, tilted back towards the camera */}
      <group position={[0, 0.016, 0.11]} rotation={[-0.22, 0, 0]}>
        <mesh material={alu} position={[0, 0.107, 0.004]} castShadow>
          <boxGeometry args={[0.32, 0.215, 0.007]} />
        </mesh>
        <mesh position={[0, 0.107, -0.0002]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.3, 0.195]} />
          <meshBasicMaterial color={screenColor} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
};

const Lamp: React.FC = () => {
  const metal = useMemo(() => new THREE.MeshStandardMaterial({color: '#2c2f36', metalness: 0.7, roughness: 0.35}), []);
  return (
    <group position={[-0.62, 0.76, 0.32]}>
      <mesh material={metal} position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.024, 32]} />
      </mesh>
      <mesh material={metal} position={[0.02, 0.2, 0]} rotation={[0, 0, -0.18]}>
        <cylinderGeometry args={[0.008, 0.008, 0.38, 12]} />
      </mesh>
      <group position={[0.08, 0.39, 0.02]} rotation={[0.2, 0, -1.0]}>
        <mesh material={metal}>
          <coneGeometry args={[0.085, 0.13, 32, 1, true]} />
        </mesh>
        <mesh position={[0, -0.03, 0]}>
          <sphereGeometry args={[0.03, 16, 12]} />
          <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
        </mesh>
      </group>
      <pointLight position={[0.12, 0.33, 0.06]} color="#ffb867" intensity={0.9} distance={2.2} decay={2} />
    </group>
  );
};

const Mug: React.FC<{t: number}> = ({t}) => {
  const dot = dotTexture();
  return (
    <group position={[-0.36, 0.76, 0.6]}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.042, 0.038, 0.1, 32]} />
        <meshPhysicalMaterial color="#e9e3da" roughness={0.25} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0.093, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.038, 24]} />
        <meshStandardMaterial color="#3a2116" roughness={0.2} />
      </mesh>
      <mesh position={[0.048, 0.05, 0]}>
        <torusGeometry args={[0.024, 0.007, 8, 20, Math.PI]} />
        <meshPhysicalMaterial color="#e9e3da" roughness={0.25} />
      </mesh>
      {Array.from({length: 7}).map((_, i) => {
        const k = (t * 0.25 + i / 7) % 1;
        return (
          <sprite key={i} position={[Math.sin(k * 6 + i) * 0.02, 0.12 + k * 0.28, 0]} scale={[0.06 + k * 0.08, 0.06 + k * 0.08, 1]}>
            <spriteMaterial map={dot} transparent opacity={0.16 * Math.sin(k * Math.PI)} depthWrite={false} color="#ffffff" />
          </sprite>
        );
      })}
    </group>
  );
};

const Plant: React.FC = () => {
  const leaf = useMemo(() => new THREE.MeshStandardMaterial({color: '#2f6b3a', roughness: 0.6, side: THREE.DoubleSide}), []);
  return (
    <group position={[0.78, 0.76, 0.05]}>
      <mesh position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.07, 0.18, 28]} />
        <meshStandardMaterial color="#c8775a" roughness={0.8} />
      </mesh>
      {Array.from({length: 11}).map((_, i) => {
        const a = (i / 11) * Math.PI * 2 + hash(i, 3);
        const tilt = 0.5 + hash(i, 4) * 0.6;
        const len = 0.22 + hash(i, 5) * 0.14;
        return (
          <group key={i} position={[0, 0.17, 0]} rotation={[0, a, tilt]}>
            <mesh material={leaf} position={[0, len * 0.6, 0]} scale={[0.07, len * 0.55, 0.012]}>
              <sphereGeometry args={[1, 14, 10]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export const Dust: React.FC<{t: number; color: string; amount: number}> = ({t, color, amount}) => {
  const dot = dotTexture();
  const n = 70;
  return (
    <group>
      {Array.from({length: n}).map((_, i) => {
        const x = -0.9 + hash(i, 61) * 1.8 + Math.sin(t * 0.2 + i) * 0.03;
        const y = 0.85 + ((hash(i, 62) + t * 0.012 * (0.5 + hash(i, 64))) % 1) * 1.3;
        const z = -0.4 + hash(i, 63) * 1.6;
        const s = 0.006 + hash(i, 65) * 0.01;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.3 + i * 1.7));
        return (
          <sprite key={i} position={[x, y, z]} scale={[s, s, 1]}>
            <spriteMaterial map={dot} color={color} transparent opacity={0.55 * tw * amount} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        );
      })}
    </group>
  );
};

export const Beams: React.FC<{color: string; amount: number}> = ({color, amount}) => {
  const tex = beamTexture();
  return (
    <group position={[1.2, 2.3, 0.2]} rotation={[0, 0, 0.62]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[i * 0.17 - 0.25, -1.1, i * 0.12 - 0.2]} rotation={[0, 0.25 * i - 0.3, 0]}>
          <planeGeometry args={[0.24 + hash(i, 71) * 0.12, 2.6]} />
          <meshBasicMaterial map={tex} color={color} transparent opacity={0.11 * amount} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};

const FairyLights: React.FC<{t: number}> = ({t}) => (
  <group>
    {Array.from({length: 16}).map((_, i) => {
      const x = -0.15 + i * 0.09;
      const y = 2.12 - Math.sin((i / 15) * Math.PI) * 0.2 - i * 0.008;
      const on = 0.75 + 0.25 * Math.sin(t * 2 + i * 1.3);
      return (
        <mesh key={i} position={[x, y, -0.86]}>
          <sphereGeometry args={[0.012, 10, 8]} />
          <meshBasicMaterial color={new THREE.Color('#ffc173').multiplyScalar(1.6 * on)} toneMapped={false} />
        </mesh>
      );
    })}
  </group>
);

/** far layer (rendered on the defocused background canvas) */
export const RoomBack: React.FC<{t: number; clockHours: number}> = ({t, clockHours}) => {
  const wall = plasterTextures();
  return (
    <group>
      <mesh position={[0, 1.6, -0.9]} receiveShadow>
        <planeGeometry args={[7, 4.5]} />
        <meshStandardMaterial map={wall.map} normalMap={wall.normal} roughness={0.95} color="#b9ab9e" />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#3b2a22" roughness={0.8} />
      </mesh>
      {/* soft shadow of the heroine on the wall */}
      <mesh position={[-0.22, 1.35, -0.895]}>
        <planeGeometry args={[0.9, 1.4]} />
        <meshBasicMaterial map={dotTexture()} color="#000000" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <group position={[-0.5, 2.0, -0.87]} scale={0.72}>
        <Clock hours={clockHours} />
      </group>
      <group position={[0.15, 0, -0.75]}>
        <Plant />
      </group>
      <FairyLights t={t} />
      <WindowPatch />
      <Shelf />
    </group>
  );
};

const WindowPatch: React.FC = () => {
  const tex = signTexture('window-gobo', 512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.filter = 'blur(10px)';
    ctx.fillStyle = 'rgba(255,214,160,0.95)';
    const pane = (x: number, y: number) => ctx.fillRect(x, y, w * 0.4, h * 0.4);
    pane(w * 0.06, h * 0.06);
    pane(w * 0.54, h * 0.06);
    pane(w * 0.06, h * 0.54);
    pane(w * 0.54, h * 0.54);
  });
  return (
    <mesh position={[0.62, 1.62, -0.893]} rotation={[0, 0, -0.18]} scale={[1, 1.3, 1]}>
      <planeGeometry args={[0.85, 0.85]} />
      <meshBasicMaterial map={tex} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

const Shelf: React.FC = () => {
  const wood = useMemo(() => new THREE.MeshStandardMaterial({color: '#6b4a34', roughness: 0.7}), []);
  const colors = ['#c9483b', '#e3b34c', '#3f6f8f', '#e9e1d4', '#2f5d4a', '#b86b3c', '#8a5fa8'];
  return (
    <group position={[-0.95, 1.35, -0.8]}>
      {[0, 0.36].map((y) => (
        <mesh key={y} material={wood} position={[0, y, 0]}>
          <boxGeometry args={[0.7, 0.025, 0.2]} />
        </mesh>
      ))}
      {Array.from({length: 9}).map((_, i) => {
        const hgt = 0.18 + hash(i, 91) * 0.1;
        return (
          <mesh key={i} position={[-0.3 + i * 0.065, 0.36 + 0.0125 + hgt / 2, 0]} rotation={[0, 0, i === 7 ? 0.25 : 0]}>
            <boxGeometry args={[0.05, hgt, 0.16]} />
            <meshStandardMaterial color={colors[i % colors.length]} roughness={0.7} />
          </mesh>
        );
      })}
      <mesh position={[0.18, 0.1, 0]}>
        <cylinderGeometry args={[0.06, 0.05, 0.14, 20]} />
        <meshStandardMaterial color="#e8e2d8" roughness={0.5} />
      </mesh>
      <mesh position={[0.18, 0.22, 0]} scale={[0.12, 0.12, 0.12]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#3d7a45" roughness={0.7} />
      </mesh>
    </group>
  );
};

/** near layer (sharp, same camera) */
export const RoomFront: React.FC<{t: number; screenColor: string}> = ({t, screenColor}) => {
  const wood = woodTextures();
  return (
    <group>
      <mesh position={[0, 0.74, 0.57]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 0.04, 0.85]} />
        <meshStandardMaterial map={wood.map} normalMap={wood.normal} roughness={0.55} />
      </mesh>
      <Laptop screenColor={screenColor} />
      <Lamp />
      <Mug t={t} />
    </group>
  );
};
