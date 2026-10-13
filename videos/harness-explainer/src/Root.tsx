import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import timeline from './timeline.json';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="HarnessExplainer"
      component={Video}
      durationInFrames={timeline.durationInFrames}
      fps={timeline.fps}
      width={1920}
      height={1080}
    />
  </>
);
