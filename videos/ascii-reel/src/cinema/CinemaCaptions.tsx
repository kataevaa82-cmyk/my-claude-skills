import {Fragment} from 'react';
import {hash} from '../lib/rng';
import {NUNITO} from '../fonts';
import {PHRASES, WORDS} from '../story';

export const CinemaCaptions: React.FC<{t: number}> = ({t}) => {
  const base: React.CSSProperties = {
    position: 'absolute', left: 70, right: 70, top: 1330, textAlign: 'center',
    fontFamily: `${NUNITO}, sans-serif`, fontWeight: 900, fontSize: 64, lineHeight: '80px', color: '#fff',
    textShadow: '0 4px 18px rgba(0,0,0,0.75), 0 0 2px rgba(0,0,0,0.9)', letterSpacing: 0.5,
  };
  let pi = -1;
  PHRASES.forEach((p, i) => {
    if (p.start - 0.08 <= t) pi = i;
  });
  if (pi < 0) return null;
  const p = PHRASES[pi];
  const words = WORDS.slice(p.from, p.to + 1);
  const last = words.reduce((acc, w, k) => (w.start - 0.08 <= t ? k : acc), -1);
  return (
    <div style={base}>
      {words.map((w, k) => {
        if (k > last) return null;
        const age = t - (w.start - 0.08);
        const pk = Math.min(1, age / 0.14);
        const active = k === last && t < w.end + 0.2;
        const censored = w.text.startsWith('$#');
        const text = censored
          ? Array.from(w.text).map((_, j) => '$#%@!&*'[Math.floor(hash(Math.floor(t * 15), j) * 7)]).join('')
          : w.text;
        return (
          <Fragment key={k}>
            <span
              style={{
                display: 'inline-block',
                color: censored ? '#ff5a5a' : active ? '#ffd38a' : '#ffffff',
                opacity: 0.25 + 0.75 * pk,
                filter: `blur(${(1 - pk) * 6}px)`,
                transform: `translateY(${(1 - pk) * 16}px) scale(${active ? 1.06 : 1})`,
                textShadow: active ? '0 0 28px rgba(255,190,90,0.85), 0 4px 18px rgba(0,0,0,0.8)' : base.textShadow as string,
              }}
            >
              {text}
            </span>{' '}
          </Fragment>
        );
      })}
    </div>
  );
};
