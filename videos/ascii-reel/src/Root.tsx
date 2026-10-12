import {Composition} from 'remotion';
import {AsciiReel} from './AsciiReel';
import {CharactersReel} from './characters/CharactersReel';
import {CinemaReel} from './cinema/CinemaReel';
import {FPS, H, W} from './theme';
import {TOTAL_SECONDS} from './story';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="AsciiReel" component={AsciiReel} durationInFrames={Math.ceil(TOTAL_SECONDS * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="CharactersReel" component={CharactersReel} durationInFrames={Math.ceil(TOTAL_SECONDS * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="CinemaReel" component={CinemaReel} durationInFrames={Math.ceil(TOTAL_SECONDS * 24)} fps={24} width={W} height={H} />
  </>
);
