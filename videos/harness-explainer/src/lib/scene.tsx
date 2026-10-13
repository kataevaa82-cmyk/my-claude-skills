import React, {createContext, useContext} from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type Line = {text: string; start: number; end: number; pause: number};
export type SceneData = {
  id: string;
  chapter: number;
  kind: string;
  props: any;
  start: number;
  end: number;
  duration: number;
  lines: Line[];
};

const Ctx = createContext<SceneData | null>(null);
export const SceneProvider = Ctx.Provider;

export const useScene = () => useContext(Ctx) as SceneData;

/** Кадр внутри сцены для «момента» at: целая часть — номер фразы, дробная — доля её длительности. */
export const useAt = () => {
  const scene = useScene();
  return (at: number | undefined | null) => {
    if (at === undefined || at === null) return 0;
    const lines = scene.lines;
    if (at < 0) return 0;
    const i = Math.floor(at);
    if (i >= lines.length) return scene.duration;
    const l = lines[i];
    return Math.round(l.start + (at - i) * (l.end - l.start));
  };
};

/** Прогресс появления 0..1 (пружина) начиная с момента at. */
export const useAppear = (at: number | undefined, delay = 0, config: any = {damping: 200, mass: 0.9}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const toFrame = useAt();
  const f0 = toFrame(at ?? 0) + delay;
  return spring({frame: frame - f0, fps, config});
};

/** Линейный прогресс между двумя моментами (в кадрах сцены). */
export const useProgress = (fromFrame: number, toFrame: number, ease = Easing.inOut(Easing.cubic)) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [fromFrame, toFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
};

/** Индекс активной фразы (последней начавшейся). */
export const useActiveLine = () => {
  const frame = useCurrentFrame();
  const scene = useScene();
  let idx = 0;
  scene.lines.forEach((l, i) => {
    if (frame >= l.start - 3) idx = i;
  });
  return idx;
};

type AppearProps = {
  at?: number;
  delay?: number;
  from?: 'bottom' | 'top' | 'left' | 'right' | 'scale' | 'none';
  dist?: number;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
  blur?: boolean;
};

export const Appear: React.FC<AppearProps> = ({at = 0, delay = 0, from = 'bottom', dist = 40, style, children, blur = true}) => {
  const p = useAppear(at, delay);
  const d = (1 - p) * dist;
  const t =
    from === 'bottom'
      ? `translateY(${d}px)`
      : from === 'top'
        ? `translateY(${-d}px)`
        : from === 'left'
          ? `translateX(${-d}px)`
          : from === 'right'
            ? `translateX(${d}px)`
            : from === 'scale'
              ? `scale(${0.85 + 0.15 * p})`
              : 'none';
  return (
    <div
      style={{
        opacity: Math.min(1, p * 1.3),
        transform: t,
        filter: blur && p < 0.98 ? `blur(${(1 - p) * 8}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
