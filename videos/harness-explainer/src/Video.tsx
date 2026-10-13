import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {loadFonts} from './fonts';
import {SceneData, SceneProvider} from './lib/scene';
import {C, FONT, alpha, chapterColor, mix} from './theme';
import timeline from './timeline.json';
import {SCENES} from './scenes';

loadFonts();

const scenes = timeline.scenes as unknown as SceneData[];
const chapters: string[] = timeline.chapters;

const chapterAt = (frame: number) => {
  let s = scenes[0];
  for (const sc of scenes) if (frame >= sc.start) s = sc;
  return s;
};

/** Плавный цвет акцента: перетекает между частями ролика. */
const useAccent = () => {
  const frame = useCurrentFrame();
  const cur = chapterAt(frame);
  const prev = scenes.filter((s) => s.chapter === cur.chapter - 1).pop();
  const firstOfChapter = scenes.find((s) => s.chapter === cur.chapter)!;
  const t = interpolate(frame, [firstOfChapter.start, firstOfChapter.start + 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return prev ? mix(chapterColor(prev.chapter), chapterColor(cur.chapter), t) : chapterColor(cur.chapter);
};

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const accent = useAccent();
  const t = frame / 30;
  const b1 = {x: 22 + 8 * Math.sin(t * 0.07), y: 28 + 6 * Math.cos(t * 0.05)};
  const b2 = {x: 78 + 7 * Math.cos(t * 0.06), y: 70 + 8 * Math.sin(t * 0.045)};
  const b3 = {x: 60 + 10 * Math.sin(t * 0.035 + 1), y: 15 + 6 * Math.sin(t * 0.06)};
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(ellipse 55% 50% at ${b1.x}% ${b1.y}%, ${alpha(accent, 0.2)} 0%, transparent 70%)`,
            `radial-gradient(ellipse 50% 55% at ${b2.x}% ${b2.y}%, ${alpha(C.violet, 0.16)} 0%, transparent 70%)`,
            `radial-gradient(ellipse 40% 35% at ${b3.x}% ${b3.y}%, ${alpha(C.cyan, 0.08)} 0%, transparent 70%)`,
            'linear-gradient(180deg, #0B0C17 0%, #07080E 100%)',
          ].join(','),
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1.2px, transparent 1.6px)',
          backgroundSize: '44px 44px',
          backgroundPosition: `${(frame * 0.15) % 44}px ${(frame * 0.08) % 44}px`,
          WebkitMaskImage: 'radial-gradient(ellipse 75% 70% at 50% 45%, black 20%, transparent 85%)',
          opacity: 0.8,
        }}
      />
      <Particles accent={accent} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 80% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

const Particles: React.FC<{accent: string}> = ({accent}) => {
  const frame = useCurrentFrame();
  const items = Array.from({length: 26}, (_, i) => {
    const seed = Math.sin(i * 91.7) * 10000;
    const r = seed - Math.floor(seed);
    const x = (i * 137.5 + r * 300) % 1920;
    const speed = 0.25 + r * 0.45;
    const y = 1100 - ((frame * speed + i * 211) % 1250);
    const size = 2 + r * 4;
    const tw = 0.35 + 0.35 * Math.sin(frame / (20 + r * 30) + i);
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x + 30 * Math.sin(frame / 90 + i),
          top: y,
          width: size,
          height: size,
          borderRadius: '50%',
          background: i % 3 === 0 ? accent : 'rgba(255,255,255,0.9)',
          opacity: tw * 0.5,
          boxShadow: `0 0 ${size * 3}px ${i % 3 === 0 ? accent : 'rgba(255,255,255,0.6)'}`,
        }}
      />
    );
  });
  return <AbsoluteFill>{items}</AbsoluteFill>;
};

const isHidden = (s: SceneData) => ['hook', 'title', 'outro'].includes(s.id) || s.kind === 'chapter';
// непрерывные отрезки, где показывается плашка главы
const chipRuns: [number, number][] = [];
for (const s of scenes) {
  if (isHidden(s)) continue;
  const last = chipRuns[chipRuns.length - 1];
  if (last && last[1] === s.start) last[1] = s.end;
  else chipRuns.push([s.start, s.end]);
}

const ChapterChip: React.FC = () => {
  const frame = useCurrentFrame();
  const cur = chapterAt(frame);
  const accent = useAccent();
  const run = chipRuns.find(([a, b]) => frame >= a && frame < b);
  const o = run
    ? Math.min(
        interpolate(frame, [run[0], run[0] + 18], [0, 1], {extrapolateRight: 'clamp'}),
        interpolate(frame, [run[1] - 12, run[1]], [1, 0], {extrapolateLeft: 'clamp'}),
      )
    : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        top: 48,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        opacity: o * 0.95,
        fontFamily: FONT.body,
        fontWeight: 700,
        fontSize: 21,
        letterSpacing: 3,
        textTransform: 'uppercase',
        color: C.dim,
      }}
    >
      <div style={{width: 12, height: 12, borderRadius: '50%', background: accent, boxShadow: `0 0 16px ${accent}`}} />
      {cur.chapter > 0 ? <span style={{color: accent}}>Часть {cur.chapter}</span> : null}
      {cur.chapter > 0 ? <span style={{opacity: 0.5}}>·</span> : null}
      <span>{chapters[cur.chapter]}</span>
    </div>
  );
};

const Brand: React.FC = () => {
  const frame = useCurrentFrame();
  const cur = chapterAt(frame);
  const o = ['hook', 'title', 'outro'].includes(cur.id) ? 0 : 0.55;
  return (
    <div
      style={{
        position: 'absolute',
        right: 70,
        top: 46,
        fontFamily: FONT.display,
        fontWeight: 600,
        fontSize: 20,
        letterSpacing: 2,
        color: C.text,
        opacity: o,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <HarnessMark size={26} />
      HARNESS
      <span style={{fontFamily: FONT.body, fontWeight: 600, letterSpacing: 1, opacity: 0.7}}>· простыми словами</span>
    </div>
  );
};

export const HarnessMark: React.FC<{size?: number; color?: string}> = ({size = 26, color = C.coral}) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="7" fill={color} />
    <circle cx="20" cy="20" r="12.5" fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="10 4" />
    <circle cx="20" cy="20" r="18" fill="none" stroke={alpha(color, 0.6)} strokeWidth="2" />
  </svg>
);

/** Субтитры: фраза режется на куски ≤ 2 строк, время делится пропорционально длине. */
const splitCaption = (text: string, maxLen = 92): string[] => {
  if (text.length <= maxLen) return [text];
  const words = text.split(' ');
  const parts: string[] = [];
  let cur = '';
  const n = Math.ceil(text.length / maxLen);
  const target = text.length / n;
  for (const w of words) {
    const cand = cur ? cur + ' ' + w : w;
    const strongBreak = /[.!?…»]$/.test(cur) || /[,:;—]$/.test(cur);
    if (cur && (cand.length > maxLen || (cur.length > target * 0.8 && strongBreak && parts.length < n - 1))) {
      parts.push(cur);
      cur = w;
    } else cur = cand;
  }
  if (cur) parts.push(cur);
  return parts;
};

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const sc = chapterAt(frame);
  const local = frame - sc.start;
  let active: {text: string; a: number; b: number} | null = null;
  for (const ln of sc.lines) {
    if (local >= ln.start - 2 && local <= ln.end + 8) {
      const chunks = splitCaption(ln.text);
      const total = chunks.reduce((s, c) => s + c.length, 0);
      let t = ln.start;
      for (const c of chunks) {
        const d = ((ln.end - ln.start) * c.length) / total;
        if (local >= t - 2 && local < t + d + (c === chunks[chunks.length - 1] ? 8 : 0)) {
          active = {text: c, a: t, b: t + d};
        }
        t += d;
      }
    }
  }
  if (!active) return null;
  const inP = interpolate(local, [active.a - 2, active.a + 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 58, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          maxWidth: 1540,
          padding: '14px 34px 16px',
          borderRadius: 20,
          background: 'rgba(7,8,14,0.78)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
          color: C.text,
          fontFamily: FONT.body,
          fontWeight: 600,
          fontSize: 35,
          lineHeight: 1.36,
          textAlign: 'center',
          opacity: inP,
          transform: `translateY(${(1 - inP) * 8}px)`,
          textWrap: 'balance' as any,
        }}
      >
        {active.text}
      </div>
    </div>
  );
};

const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const total = timeline.durationInFrames;
  const accent = useAccent();
  const starts = chapters.map((_, i) => scenes.find((s) => s.chapter === i)!.start);
  const W = 1920 - 140;
  return (
    <div style={{position: 'absolute', left: 70, right: 70, bottom: 26, height: 6}}>
      {starts.map((s, i) => {
        const e = i + 1 < starts.length ? starts[i + 1] : total;
        const x = (s / total) * W;
        const w = ((e - s) / total) * W - 6;
        const fill = Math.max(0, Math.min(1, (frame - s) / (e - s)));
        return (
          <div key={i} style={{position: 'absolute', left: x, width: w, top: 0, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.10)', overflow: 'hidden'}}>
            <div style={{width: `${fill * 100}%`, height: '100%', background: `linear-gradient(90deg, ${alpha(chapterColor(i), 0.6)}, ${chapterColor(i)})`}} />
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: (frame / total) * W - 6,
          top: -3.5,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: accent,
          boxShadow: `0 0 18px ${accent}`,
        }}
      />
    </div>
  );
};

const SceneShell: React.FC<{scene: SceneData}> = ({scene}) => {
  const frame = useCurrentFrame();
  const Comp = SCENES[scene.kind];
  const fin = interpolate(frame, [0, 14], [0, 1], {extrapolateRight: 'clamp'});
  const fout = interpolate(frame, [scene.duration - 12, scene.duration], [1, 0], {extrapolateLeft: 'clamp'});
  const o = Math.min(fin, fout);
  return (
    <SceneProvider value={scene}>
      <AbsoluteFill style={{opacity: o, transform: `scale(${0.985 + 0.015 * o})`}}>
        {Comp ? <Comp {...scene.props} /> : <div style={{color: 'red', fontSize: 60, padding: 200}}>{scene.kind}</div>}
      </AbsoluteFill>
    </SceneProvider>
  );
};

export const Video: React.FC = () => (
  <AbsoluteFill style={{background: C.bg}}>
    <Background />
    {scenes.map((s) => (
      <Sequence key={s.id} from={s.start} durationInFrames={s.duration} name={s.id}>
        <SceneShell scene={s} />
      </Sequence>
    ))}
    <ChapterChip />
    <Brand />
    <Captions />
    <Progress />
    <Audio src={staticFile('audio/mix.wav')} />
  </AbsoluteFill>
);
