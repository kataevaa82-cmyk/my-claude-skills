import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C, FONT, alpha} from '../theme';
import {Appear, useAppear, useAt} from './scene';

export const Card: React.FC<{
  children?: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
  glow?: number;
  pad?: number;
  radius?: number;
}> = ({children, style, accent, glow = 0, pad = 32, radius = 28}) => (
  <div
    style={{
      position: 'relative',
      borderRadius: radius,
      padding: pad,
      background: `linear-gradient(160deg, rgba(255,255,255,0.085) 0%, rgba(255,255,255,0.035) 55%, rgba(255,255,255,0.02) 100%)`,
      border: `1.5px solid ${accent ? alpha(accent, 0.35 + 0.4 * glow) : 'rgba(255,255,255,0.11)'}`,
      boxShadow: `0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)${
        accent && glow > 0 ? `, 0 0 ${40 + 40 * glow}px ${alpha(accent, 0.28 * glow)}` : ''
      }`,
      color: C.text,
      fontFamily: FONT.body,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Emoji: React.FC<{e: string; size?: number; style?: React.CSSProperties}> = ({e, size = 48, style}) => (
  <span style={{fontFamily: "'Noto Color Emoji'", fontSize: size, lineHeight: 1, display: 'inline-block', ...style}}>{e}</span>
);

export const Orb: React.FC<{
  e?: string;
  size?: number;
  color?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  pulse?: number;
}> = ({e, size = 120, color = C.coral, children, style, pulse = 0}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `radial-gradient(circle at 35% 30%, ${alpha(color, 0.55)} 0%, ${alpha(color, 0.18)} 45%, rgba(10,11,20,0.9) 100%)`,
      border: `2px solid ${alpha(color, 0.6)}`,
      boxShadow: `0 0 ${50 + 30 * pulse}px ${alpha(color, 0.35 + 0.25 * pulse)}, inset 0 0 30px ${alpha(color, 0.25)}`,
      flexShrink: 0,
      ...style,
    }}
  >
    {e ? <Emoji e={e} size={size * 0.48} /> : children}
  </div>
);

export const Pill: React.FC<{children?: React.ReactNode; color?: string; style?: React.CSSProperties; solid?: boolean}> = ({
  children,
  color = C.coral,
  style,
  solid,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 22px',
      borderRadius: 999,
      background: solid ? color : alpha(color, 0.14),
      border: `1.5px solid ${alpha(color, solid ? 1 : 0.45)}`,
      color: solid ? '#140F0A' : color,
      fontFamily: FONT.body,
      fontWeight: 700,
      fontSize: 24,
      letterSpacing: 0.3,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

/** Заголовок сцены «Деталь N · Название». */
export const DetailHeader: React.FC<{num: number; title: string; color: string; total?: number}> = ({num, title, color, total = 7}) => {
  const p = useAppear(0);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 28, opacity: p, transform: `translateY(${(1 - p) * -24}px)`}}>
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 26,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT.display,
          fontWeight: 700,
          fontSize: 46,
          color: '#120D08',
          background: `linear-gradient(135deg, ${color}, ${alpha(color, 0.7)})`,
          boxShadow: `0 10px 40px ${alpha(color, 0.45)}`,
        }}
      >
        {num}
      </div>
      <div>
        <div style={{fontFamily: FONT.body, fontWeight: 700, fontSize: 24, letterSpacing: 4, color: alpha(color, 0.95), textTransform: 'uppercase'}}>
          Деталь {num} из {total}
        </div>
        <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 58, color: C.text, marginTop: 4, letterSpacing: -0.5}}>{title}</div>
      </div>
    </div>
  );
};

export const SceneTitle: React.FC<{kicker?: string; title: string; color: string; at?: number; size?: number}> = ({
  kicker,
  title,
  color,
  at = 0,
  size = 56,
}) => (
  <Appear at={at} from="top" dist={24}>
    {kicker ? (
      <div style={{fontFamily: FONT.body, fontWeight: 800, fontSize: 22, letterSpacing: 5, color, textTransform: 'uppercase', marginBottom: 8}}>
        {kicker}
      </div>
    ) : null}
    <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: size, color: C.text, letterSpacing: -0.5, lineHeight: 1.15}}>{title}</div>
  </Appear>
);

/** Печатающийся текст. */
export const Typewriter: React.FC<{text: string; at?: number; cps?: number; style?: React.CSSProperties; caret?: boolean}> = ({
  text,
  at = 0,
  cps = 38,
  style,
  caret = true,
}) => {
  const frame = useCurrentFrame();
  const toFrame = useAt();
  const f0 = toFrame(at);
  const n = Math.max(0, Math.floor(((frame - f0) / 30) * cps));
  const shown = text.slice(0, n);
  const done = n >= text.length;
  const blink = Math.floor(frame / 15) % 2 === 0;
  return (
    <span style={style}>
      {shown}
      {caret && frame >= f0 && (!done || blink) ? <span style={{opacity: 0.8, color: C.coral}}>▍</span> : null}
    </span>
  );
};

/** Анимированная стрелка-линия (SVG). */
export const FlowArrow: React.FC<{
  d: string;
  progress: number;
  color?: string;
  width?: number;
  dashed?: boolean;
  head?: boolean;
  w?: number;
  h?: number;
  style?: React.CSSProperties;
}> = ({d, progress, color = C.coral, width = 4, dashed, head = true, w = 1920, h = 1080, style}) => {
  const frame = useCurrentFrame();
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...style}}>
      <defs>
        <marker id={`ah-${color.replace('#', '')}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={color} />
        </marker>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={dashed ? undefined : `${progress} 1`}
        style={dashed ? {strokeDasharray: '0.02 0.015', strokeDashoffset: -frame * 0.004, opacity: progress} : undefined}
        markerEnd={head && progress > 0.97 ? `url(#ah-${color.replace('#', '')})` : undefined}
        opacity={0.9}
      />
    </svg>
  );
};

export const Check: React.FC<{p: number; color?: string; size?: number}> = ({p, color = C.green, size = 40}) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill={alpha(color, 0.18 * p)} stroke={alpha(color, 0.3 + 0.7 * p)} strokeWidth="2.5" />
    <path d="M11 21 L17.5 27 L29 14" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1`} />
  </svg>
);

export const Spinner: React.FC<{size?: number; color?: string}> = ({size = 30, color = C.coral}) => {
  const frame = useCurrentFrame();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{transform: `rotate(${frame * 12}deg)`}}>
      <circle cx="20" cy="20" r="15" fill="none" stroke={alpha(color, 0.2)} strokeWidth="5" />
      <path d="M20 5 A15 15 0 0 1 35 20" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
};

/** Плавная пульсация 0..1. */
export const usePulse = (period = 60, offset = 0) => {
  const frame = useCurrentFrame();
  return 0.5 + 0.5 * Math.sin(((frame + offset) / period) * Math.PI * 2);
};

export const fadeBetween = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/** Окно в стиле macOS. */
export const Window: React.FC<{
  title?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  bar?: React.ReactNode;
  dark?: boolean;
}> = ({title, children, style, bodyStyle, bar, dark = true}) => (
  <div
    style={{
      borderRadius: 22,
      overflow: 'hidden',
      background: dark ? '#14151C' : '#F7F3EC',
      border: '1.5px solid rgba(255,255,255,0.14)',
      boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.4)',
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}
  >
    <div
      style={{
        height: 52,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 20px',
        background: dark ? 'linear-gradient(180deg,#24252E,#1C1D25)' : 'linear-gradient(180deg,#ECE6DC,#E2DACD)',
        borderBottom: '1px solid rgba(0,0,0,0.35)',
        position: 'relative',
      }}
    >
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
        <div key={c} style={{width: 15, height: 15, borderRadius: '50%', background: c}} />
      ))}
      {bar ?? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: FONT.body,
            fontWeight: 600,
            fontSize: 20,
            color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
          }}
        >
          {title}
        </div>
      )}
    </div>
    <div style={{flex: 1, position: 'relative', overflow: 'hidden', ...bodyStyle}}>{children}</div>
  </div>
);

/** Пузырь чата. */
export const Bubble: React.FC<{who?: 'user' | 'ai'; children?: React.ReactNode; style?: React.CSSProperties; color?: string}> = ({
  who = 'user',
  children,
  style,
  color = C.coral,
}) => (
  <div
    style={{
      padding: '20px 26px',
      borderRadius: 26,
      borderBottomRightRadius: who === 'user' ? 8 : 26,
      borderBottomLeftRadius: who === 'ai' ? 8 : 26,
      background: who === 'user' ? `linear-gradient(135deg, ${alpha(color, 0.95)}, ${alpha(color, 0.75)})` : 'rgba(255,255,255,0.08)',
      color: who === 'user' ? '#1A0F08' : C.text,
      border: who === 'ai' ? '1.5px solid rgba(255,255,255,0.12)' : 'none',
      fontFamily: FONT.body,
      fontWeight: who === 'user' ? 700 : 500,
      fontSize: 28,
      lineHeight: 1.4,
      boxShadow: who === 'user' ? `0 16px 40px ${alpha(color, 0.3)}` : '0 16px 40px rgba(0,0,0,0.3)',
      ...style,
    }}
  >
    {children}
  </div>
);
