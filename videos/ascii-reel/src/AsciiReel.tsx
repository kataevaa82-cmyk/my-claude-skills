import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {loadFonts} from './fonts';
import {Captions} from './layers/Captions';
import {Crt} from './layers/Crt';
import {Headline} from './layers/Headline';
import {MainGrid} from './layers/MainGrid';
import {hash} from './lib/rng';
import {glitchAmount} from './story';
import {C, FPS} from './theme';

export const AsciiReel: React.FC = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('Loading fonts'));
  useEffect(() => {
    loadFonts().then(() => setReady(true));
  }, []);
  // children draw their canvases in layout effects, so by now the first frame is painted
  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);
  const frame = useCurrentFrame();
  const gl = glitchAmount(frame / FPS);
  const shake = gl > 0.3 ? `translate(${(hash(frame, 1) - 0.5) * 16 * gl}px, ${(hash(frame, 2) - 0.5) * 10 * gl}px)` : 'none';

  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(40,160,90,0.10) 0%, rgba(0,0,0,0) 70%)'}}
      />
      {ready ? (
        <AbsoluteFill style={{transform: shake}}>
          <MainGrid />
          <Headline />
          <Captions />
        </AbsoluteFill>
      ) : null}
      <Crt />
      <Audio src={staticFile('voice.wav')} />
    </AbsoluteFill>
  );
};
