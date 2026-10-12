import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {hash} from '../lib/rng';
import {glitchAmount} from '../story';
import {FPS} from '../theme';

// CRT feel: scanlines, vignette, faint flicker and a rolling bright band
export const Crt: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const flicker = 0.03 + 0.03 * hash(frame, 77) + glitchAmount(t) * 0.12;
  const bandY = ((t * 0.18) % 1.3) * 1920 - 200;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          background: 'repeating-linear-gradient(to bottom, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 4px)',
        }}
      />
      <div
        style={{
          position: 'absolute', left: 0, right: 0, top: bandY, height: 220,
          background: 'linear-gradient(to bottom, transparent, rgba(61,255,146,0.035), transparent)',
        }}
      />
      <AbsoluteFill style={{background: `rgba(180,255,210,${flicker})`, mixBlendMode: 'overlay'}} />
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)'}}
      />
    </AbsoluteFill>
  );
};
