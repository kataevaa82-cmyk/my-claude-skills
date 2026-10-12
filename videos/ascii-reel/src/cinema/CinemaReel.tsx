import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {useEffect, useLayoutEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Audio, Img, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {blink, mouthOpen} from '../characters/anim';
import {emotionAt} from '../characters/timeline';
import {loadNunito} from '../fonts';
import {TOTAL_SECONDS, at} from '../story';
import {H, W} from '../theme';
import {CinemaCaptions} from './CinemaCaptions';
import {Heroine3D} from './Heroine3D';
import {Holograms, holoFocus} from './Holo';
import {moodAt} from './moods';
import {Beams, Dust, RoomBack, RoomFront} from './Room';
import {cameraAt} from './shots';

const FRONT_DPR = 0.78;

const Env: React.FC = () => {
  const {gl, scene} = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.14;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
    gl.shadowMap.type = THREE.PCFShadowMap;
  }, [gl, scene]);
  return null;
};

const CameraRig: React.FC<{t: number}> = ({t}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    const c = cameraAt(t);
    camera.position.set(...c.pos);
    camera.up.set(Math.sin(c.roll), Math.cos(c.roll), 0);
    camera.lookAt(...c.look);
    camera.fov = c.fov;
    camera.near = 0.05;
    camera.far = 20;
    camera.updateProjectionMatrix();
  }, [t, camera]);
  return null;
};

// where she looks: the camera (talking to the viewer) or the story hologram
const CONTACT: [number, number][] = [
  [0, 1], [at(4), 0.25], [at(9), 1], [at(12), 0.55], [at(25), 0.15], [at(32), 0.45], [at(42), 0.2], [at(47), 0.75],
  [at(66), 1], [at(83), 0.7], [at(92), 1], [at(98), 0.35], [at(105), 1],
];
const contactAt = (t: number) => {
  let c = CONTACT[0];
  let p = CONTACT[0];
  CONTACT.forEach((x, i) => {
    if (x[0] <= t) {
      c = x;
      p = CONTACT[Math.max(0, i - 1)];
    }
  });
  const k = Math.min(1, (t - c[0]) / 0.5);
  return p[1] + (c[1] - p[1]) * k;
};

const Lights: React.FC<{t: number; shadows?: boolean}> = ({t, shadows}) => {
  const mood = moodAt(t);
  return (
    <>
      <hemisphereLight args={['#ffe8d6', '#2a1d18', mood.amb * 0.6]} />
      <directionalLight
        position={[2.3, 2.4, 1.0]}
        color={mood.key}
        intensity={mood.keyI * 1.45}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-1.6}
        shadow-camera-right={1.6}
        shadow-camera-top={2.6}
        shadow-camera-bottom={-0.2}
        shadow-camera-near={0.5}
        shadow-camera-far={8}
      />
      <spotLight position={[-0.2, 2.5, -0.9]} target-position={[0, 1.45, 0]} color={mood.rim} intensity={mood.rimI * 1.3} angle={0.6} penumbra={0.85} distance={6} decay={1.2} />

    </>
  );
};

const clockHoursAt = (t: number) =>
  10.1 + t / 3600 + Math.max(0, Math.min(t, at(25) + 1) - at(19)) * 0.9 + Math.max(0, Math.min(t, at(66)) - at(47)) * 0.15;

const BackScene: React.FC<{t: number}> = ({t}) => (
  <>
    <Env />
    <CameraRig t={t} />
    <Lights t={t} />
    <RoomBack t={t} clockHours={clockHoursAt(t)} />
  </>
);

const FrontScene: React.FC<{t: number}> = ({t}) => {
  const mood = moodAt(t);
  const cam = cameraAt(t);
  const head = new THREE.Vector3(0, 1.445, 0);
  const focus = holoFocus(t);
  const camV = new THREE.Vector3(...cam.pos);
  const target = focus.clone().lerp(camV, contactAt(t));
  const d = target.sub(head);
  const yaw = Math.atan2(d.x, d.z);
  const pitch = -Math.atan2(d.y, Math.hypot(d.x, d.z));
  const emo = emotionAt(t);
  return (
    <>
      <Env />
      <CameraRig t={t} />
      <Lights t={t} shadows />
      <pointLight position={[0.02, 0.98, 0.5]} color={mood.screen} intensity={0.55} distance={1.2} decay={2} />
      <RoomFront t={t} screenColor={mood.screen} />
      <Beams color={mood.beamColor} amount={mood.beams} />
      <Dust t={t} color={mood.dustColor} amount={mood.dust} />
      <Heroine3D emo={emo} mouth={mouthOpen(t)} blink={blink(t)} look={[yaw, pitch]} t={t} />
      <Holograms t={t} color={mood.holo} intensity={mood.holoI} />
    </>
  );
};

export const CinemaReel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('fonts for 3D textures'));
  useEffect(() => {
    loadNunito().then(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);
  const mood = moodAt(t);
  const cam = cameraAt(t);
  const camDist = Math.hypot(cam.pos[0] - cam.look[0], cam.pos[1] - cam.look[1], cam.pos[2] - cam.look[2]);
  const bgBlur = Math.max(3.5, Math.min(11, 4 + (1.6 - camDist) * 6));
  const fadeIn = Math.min(1, t / 0.45);
  const end = Math.max(0, (t - (TOTAL_SECONDS - 0.7)) / 0.7);

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {ready ? (
        <div style={{position: 'absolute', inset: 0, filter: cam.blur > 0.5 ? `blur(${cam.blur}px)` : undefined}}>
          <div style={{position: 'absolute', inset: -30, filter: `blur(${bgBlur}px) brightness(0.92)`, transform: 'scale(1.06)'}}>
            <div style={{position: 'absolute', left: 30, top: 30, width: W, height: H}}>
              <ThreeCanvas width={W} height={H} dpr={0.3} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 30, position: [0, 1.5, 2]}}>
                <BackScene t={t} />
              </ThreeCanvas>
            </div>
          </div>
          <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
            <ThreeCanvas width={W} height={H} dpr={FRONT_DPR} shadows gl={{antialias: false, alpha: true, preserveDrawingBuffer: true}} camera={{fov: 30, position: [0, 1.5, 2]}}>
              <FrontScene t={t} />
            </ThreeCanvas>
          </div>
        </div>
      ) : null}
      {/* colour grade: teal shadows / warm highlights */}
      <AbsoluteFill style={{background: `linear-gradient(180deg, ${mood.gradeTop} 0%, rgba(0,0,0,0) 45%, ${mood.gradeBottom} 100%)`, opacity: mood.gradeA, mixBlendMode: 'soft-light'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.55) 100%)'}} />
      <Img src={staticFile('grain.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.1, mixBlendMode: 'overlay', transform: `translate(${(frame % 7) * 3}px, ${(frame % 5) * 4}px) scale(1.05)`}} />
      {ready ? <CinemaCaptions t={t} /> : null}
      <AbsoluteFill style={{backgroundColor: '#fff6e8', opacity: cam.flash * 0.55, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{backgroundColor: '#000', opacity: Math.max(1 - fadeIn, Math.min(1, end))}} />
    </AbsoluteFill>
  );
};
