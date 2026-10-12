import {Fragment} from 'react';
import {useCurrentFrame} from 'remotion';
import {hash} from '../lib/rng';
import {OUTRO_AT, PHRASES, WORDS} from '../story';
import {C, FONT, FPS} from '../theme';

const CENSOR = '$#%@!&*';
export const CAPTION_TOP = 1296;

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  if (t >= OUTRO_AT) {
    const blink = Math.floor(t * 3) % 2 === 0;
    return (
      <div style={wrap}>
        <span style={{color: C.green}}>{'> '}</span>
        <span style={{color: C.amber}}>пишите в комменты ↓</span>
        <span style={{color: C.green, opacity: blink ? 1 : 0}}>█</span>
      </div>
    );
  }

  let pi = -1;
  PHRASES.forEach((p, i) => {
    if (p.start - 0.06 <= t) pi = i;
  });
  if (pi < 0) return null;
  const p = PHRASES[pi];
  const words = WORDS.slice(p.from, p.to + 1);
  const typing = words.some((w) => w.start > t);
  const blink = Math.floor(t * 3) % 2 === 0;
  const lastShown = words.reduce((acc, w, k) => (w.start - 0.06 <= t ? k : acc), -1);
  const cursor = <span style={{color: C.green, opacity: typing || blink ? 1 : 0.15, marginLeft: 8}}>█</span>;

  return (
    <div style={wrap}>
      <span style={{color: C.green}}>{'> '}</span>
      {words.map((w, k) => {
        const shown = w.start - 0.06 <= t;
        if (!shown) return null;
        const age = t - (w.start - 0.06);
        const pop = Math.min(1, age / 0.1);
        // exactly one highlighted word: the latest one that has started, while it is still sounding
        const active = k === lastShown && t < w.end + 0.2;
        const censored = w.text.startsWith('$#');
        const text = censored
          ? Array.from(w.text)
              .map((_, j) => CENSOR[Math.floor(hash(Math.floor(frame / 2), j) * CENSOR.length)])
              .join('')
          : w.text;
        return (
          <Fragment key={k}>
           <span style={{whiteSpace: 'nowrap'}}>
            <span
              style={{
                display: 'inline-block',
                color: censored ? C.red : active ? '#021308' : C.white,
                background: active && !censored ? C.green : 'transparent',
                boxShadow: active && !censored ? `0 0 26px ${C.green}` : 'none',
                padding: '0 6px',
                margin: '0 -6px',
                opacity: 0.35 + 0.65 * pop,
                transform: `translateY(${(1 - pop) * 10}px) scale(${1 + (1 - pop) * 0.12})`,
                textShadow: active ? 'none' : `0 0 18px ${censored ? C.red : 'rgba(61,255,146,0.55)'}`,
              }}
            >
              {text}
            </span>
            {k === lastShown ? cursor : null}
           </span>{' '}
          </Fragment>
        );
      })}
    </div>
  );
};

const wrap: React.CSSProperties = {
  position: 'absolute',
  left: 54,
  top: CAPTION_TOP,
  width: 900,
  fontFamily: `${FONT}, monospace`,
  fontWeight: 800,
  fontSize: 58,
  lineHeight: '78px',
  letterSpacing: -1,
  color: C.white,
  wordBreak: 'keep-all',
};
