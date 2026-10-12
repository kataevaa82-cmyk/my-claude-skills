import {Fragment, useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {NUNITO, loadNunito} from '../fonts';
import {hash} from '../lib/rng';
import {OUTRO_AT, PHRASES, WORDS, at, level} from '../story';
import {FPS} from '../theme';
import {blink, mouthOpen} from './anim';
import {Heroine} from './Heroine';
import {STAGE_H, STAGE_W, Stage, bgAt} from './Scenes';
import {emotionAt, poseAt} from './timeline';

const STAGE_TOP = 170;
const HEROINE_W = 780;
const HEROINE_TOP = 1000;
const CAPTION_TOP = 905;

const Captions: React.FC<{t: number; accent: string}> = ({t, accent}) => {
  if (t >= OUTRO_AT) return null;
  let pi = -1;
  PHRASES.forEach((p, i) => {
    if (p.start - 0.08 <= t) pi = i;
  });
  if (pi < 0) return null;
  const p = PHRASES[pi];
  const words = WORDS.slice(p.from, p.to + 1);
  const lastShown = words.reduce((acc, w, k) => (w.start - 0.08 <= t ? k : acc), -1);
  const cardIn = Math.min(1, (t - (p.start - 0.08)) / 0.12);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: CAPTION_TOP, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          maxWidth: 940,
          padding: '14px 30px 18px',
          borderRadius: 34,
          background: 'rgba(255,255,255,0.94)',
          boxShadow: '0 14px 40px rgba(43,35,80,0.22)',
          fontFamily: `${NUNITO}, sans-serif`,
          fontWeight: 900,
          fontSize: 56,
          lineHeight: '70px',
          color: '#2b2350',
          textAlign: 'center',
          transform: `scale(${0.94 + 0.06 * cardIn})`,
        }}
      >
        {words.map((w, k) => {
          if (k > lastShown) return null;
          const age = t - (w.start - 0.08);
          const popK = Math.min(1, age / 0.12);
          const active = k === lastShown && t < w.end + 0.2;
          const censored = w.text.startsWith('$#');
          const text = censored
            ? Array.from(w.text).map((_, j) => '$#%@!&*'[Math.floor(hash(Math.floor(t * 15), j) * 7)]).join('')
            : w.text;
          return (
            <Fragment key={k}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '0 10px',
                  margin: '0 -4px',
                  borderRadius: 16,
                  background: active ? accent : 'transparent',
                  color: censored ? '#ff3b5c' : active ? '#fff' : '#2b2350',
                  transform: `translateY(${(1 - popK) * 14}px) scale(${active ? 1.06 : 1})`,
                  opacity: 0.3 + 0.7 * popK,
                }}
              >
                {text}
              </span>{' '}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};

export const CharactersReel: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('Loading Nunito'));
  useEffect(() => {
    loadNunito().then(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);

  const [bgTop, bgBottom, accent] = bgAt(t);
  const crash = t >= at(93) && t < at(98);
  const shake = crash ? `translate(${(hash(frame, 1) - 0.5) * 18}px, ${(hash(frame, 2) - 0.5) * 12}px)` : 'none';
  const lv = level(t);

  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${bgTop} 0%, ${bgBottom} 70%)`}}>
      {/* soft floating blobs for depth */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 620,
            height: 620,
            borderRadius: '50%',
            left: [-180, 620, 160][i] + Math.sin(t * 0.3 + i * 2) * 40,
            top: [120, 520, 1180][i] + Math.cos(t * 0.25 + i) * 40,
            background: `radial-gradient(circle, ${['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.35)'][i]} 0%, rgba(255,255,255,0) 70%)`,
          }}
        />
      ))}
      {ready ? (
        <AbsoluteFill style={{transform: shake}}>
          <div style={{position: 'absolute', left: 0, top: STAGE_TOP, width: STAGE_W, height: STAGE_H}}>
            <Stage t={t} />
          </div>
          {/* floor glow behind the narrator */}
          <div
            style={{
              position: 'absolute', left: 90, top: 1180, width: 900, height: 900, borderRadius: '50%',
              background: `radial-gradient(circle, ${accent}33 0%, rgba(255,255,255,0) 65%)`,
            }}
          />
          <div style={{position: 'absolute', left: (1080 - HEROINE_W) / 2, top: HEROINE_TOP, width: HEROINE_W, height: (HEROINE_W / 600) * 800}}>
            <Heroine
              emo={emotionAt(t)}
              pose={poseAt(t)}
              mouth={mouthOpen(t)}
              blink={blink(t)}
              bob={Math.sin(t * 1.7) * 4 - lv * 6}
              nod={Math.sin(t * 2.3) * 1.5 + (mouthOpen(t) - 0.3) * 3}
            />
          </div>
          <Captions t={t} accent={accent} />
        </AbsoluteFill>
      ) : null}
      <Img src={staticFile('grain.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.07, mixBlendMode: 'overlay'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 62%, rgba(43,35,80,0.18) 100%)'}} />
      <Audio src={staticFile('voice.wav')} />
    </AbsoluteFill>
  );
};
