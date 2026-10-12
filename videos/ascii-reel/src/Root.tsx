import {Composition} from 'remotion';
import {AsciiReel} from './AsciiReel';
import {FPS, H, W} from './theme';
import {TOTAL_SECONDS} from './story';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="AsciiReel"
    component={AsciiReel}
    durationInFrames={Math.ceil(TOTAL_SECONDS * FPS)}
    fps={FPS}
    width={W}
    height={H}
  />
);
