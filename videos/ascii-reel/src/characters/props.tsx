import React from 'react';
import {NUNITO} from '../fonts';
import {hash} from '../lib/rng';
import {clamp} from './anim';

const F = NUNITO;
const INK = '#2b2350';

type XY = {x: number; y: number; s?: number; r?: number; o?: number};
const tf = ({x, y, s = 1, r = 0}: XY) => `translate(${x} ${y}) rotate(${r}) scale(${s})`;

export const Shadow: React.FC<{x: number; y: number; w: number; o?: number}> = ({x, y, w, o = 0.18}) => (
  <ellipse cx={x} cy={y} rx={w / 2} ry={w * 0.09} fill="#2b2350" opacity={o} />
);

// ── the app: a cute smartphone ─────────────────────────────────────────
export type BuddyMood = 'happy' | 'excited' | 'sleep' | 'sad' | 'dizzy' | 'hopeful' | 'study';
export const AppBuddy: React.FC<XY & {mood: BuddyMood; t: number; cap?: boolean; wave?: boolean}> = ({mood, t, cap, wave, ...p}) => {
  const screen: Record<BuddyMood, [string, string]> = {
    happy: ['#8ef6e4', '#6c8cff'],
    excited: ['#ffe27a', '#ff7ab6'],
    hopeful: ['#9be7ff', '#7c83ff'],
    study: ['#b8f5ff', '#7aa2ff'],
    sleep: ['#3a416f', '#232845'],
    sad: ['#aeb7c9', '#717d99'],
    dizzy: ['#ff9b9b', '#ff4d6d'],
  };
  const [c1, c2] = screen[mood];
  const id = `scr-${mood}`;
  const bounce = mood === 'excited' ? Math.abs(Math.sin(t * 9)) * 22 : mood === 'sleep' ? 0 : Math.abs(Math.sin(t * 4)) * 6;
  const armA = wave ? Math.sin(t * 12) * 30 - 40 : mood === 'excited' ? -60 + Math.sin(t * 9) * 25 : mood === 'sad' ? 25 : 10;
  const eyeY = -205;
  const face = () => {
    if (mood === 'sleep')
      return (
        <g stroke="#cfd6ff" strokeWidth={7} fill="none" strokeLinecap="round">
          <path d={`M -44 ${eyeY} Q -30 ${eyeY + 12} -16 ${eyeY}`} />
          <path d={`M 16 ${eyeY} Q 30 ${eyeY + 12} 44 ${eyeY}`} />
          <path d="M -10 -150 Q 0 -145 10 -150" />
        </g>
      );
    if (mood === 'dizzy')
      return (
        <g stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round">
          <path d={`M -44 ${eyeY - 12} L -18 ${eyeY + 12} M -18 ${eyeY - 12} L -44 ${eyeY + 12}`} />
          <path d={`M 18 ${eyeY - 12} L 44 ${eyeY + 12} M 44 ${eyeY - 12} L 18 ${eyeY + 12}`} />
          <path d="M -26 -150 Q -13 -162 0 -150 Q 13 -138 26 -150" />
        </g>
      );
    const sad = mood === 'sad';
    return (
      <g>
        <ellipse cx={-30} cy={eyeY} rx={13} ry={sad ? 12 : 17} fill={INK} />
        <ellipse cx={30} cy={eyeY} rx={13} ry={sad ? 12 : 17} fill={INK} />
        <circle cx={-25} cy={eyeY - 6} r={5} fill="#fff" />
        <circle cx={35} cy={eyeY - 6} r={5} fill="#fff" />
        {sad ? (
          <>
            <path d="M -46 -232 L -18 -226" stroke={INK} strokeWidth={6} strokeLinecap="round" />
            <path d="M 46 -232 L 18 -226" stroke={INK} strokeWidth={6} strokeLinecap="round" />
            <path d="M -18 -148 Q 0 -162 18 -148" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
          </>
        ) : mood === 'excited' ? (
          <path d="M -26 -162 Q 0 -122 26 -162 Z" fill={INK} />
        ) : (
          <path d="M -22 -160 Q 0 -138 22 -160" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
        )}
        <ellipse cx={-50} cy={-172} rx={11} ry={7} fill="#ff6b8b" opacity={0.5} />
        <ellipse cx={50} cy={-172} rx={11} ry={7} fill="#ff6b8b" opacity={0.5} />
      </g>
    );
  };
  return (
    <g transform={tf(p)} opacity={p.o ?? 1}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <Shadow x={0} y={0} w={170} />
      <g transform={`translate(0 ${-bounce})`}>
        {/* legs */}
        <path d="M -30 -60 L -34 -10" stroke={INK} strokeWidth={12} strokeLinecap="round" />
        <path d="M 30 -60 L 34 -10" stroke={INK} strokeWidth={12} strokeLinecap="round" />
        <ellipse cx={-40} cy={-6} rx={20} ry={10} fill={INK} />
        <ellipse cx={40} cy={-6} rx={20} ry={10} fill={INK} />
        {/* arms */}
        <g transform={`rotate(${wave ? 10 : armA} -78 -170)`}>
          <path d="M -78 -170 L -128 -140" stroke={INK} strokeWidth={12} strokeLinecap="round" />
          <circle cx={-130} cy={-139} r={11} fill={INK} />
        </g>
        <g transform={`rotate(${-armA} 78 -170)`}>
          <path d="M 78 -170 L 128 -140" stroke={INK} strokeWidth={12} strokeLinecap="round" />
          <circle cx={130} cy={-139} r={11} fill={INK} />
        </g>
        {/* body */}
        <rect x={-85} y={-320} width={170} height={270} rx={34} fill={INK} />
        <rect x={-72} y={-304} width={144} height={238} rx={24} fill={`url(#${id})`} />
        <rect x={-22} y={-314} width={44} height={8} rx={4} fill="#5a5185" />
        <path d="M -60 -290 L -20 -290 L -60 -250 Z" fill="#fff" opacity={0.25} />
        {face()}
        {cap ? (
          <g transform="translate(0 -318)">
            <path d="M -90 0 L 0 -38 L 90 0 L 0 38 Z" fill="#2b2350" />
            <rect x={-46} y={0} width={92} height={30} rx={8} fill="#2b2350" />
            <path d="M 60 4 L 76 54" stroke="#ffd166" strokeWidth={5} />
            <circle cx={77} cy={58} r={8} fill="#ffd166" />
          </g>
        ) : null}
      </g>
      {mood === 'sleep'
        ? [0, 1, 2].map((i) => {
            const k = ((t * 0.7 + i / 3) % 1 + 1) % 1;
            return (
              <text key={i} x={70 + k * 70} y={-300 - k * 120} fontFamily={F} fontWeight={900} fontSize={34 + k * 30} fill="#6c5ce7" opacity={1 - k}>
                z
              </text>
            );
          })
        : null}
    </g>
  );
};

// ── a shop / store building ────────────────────────────────────────────
export const Shop: React.FC<
  XY & {name: string; wall: string; stripes: string[]; sign: string; signText?: string; shutter?: number; closedSign?: number; cracked?: number; t: number; glow?: number}
> = ({name, wall, stripes, sign, signText = '#fff', shutter = 0, closedSign = 0, cracked = 0, t, glow = 0, ...p}) => {
  const W = 360;
  const scallops = 9;
  const sw = (W + 20) / scallops;
  const sh = clamp(shutter);
  return (
    <g transform={tf(p)} opacity={p.o ?? 1}>
      <Shadow x={0} y={0} w={420} />
      {glow > 0 ? <circle cx={0} cy={-200} r={260} fill="#fff6c2" opacity={0.55 * glow} /> : null}
      <rect x={-W / 2} y={-290} width={W} height={290} rx={14} fill={wall} />
      <rect x={-W / 2} y={-290} width={W} height={290} rx={14} fill="#000" opacity={0.04} />
      {/* window + door */}
      <rect x={-150} y={-190} width={150} height={120} rx={14} fill="#bfe9ff" />
      <path d="M -140 -180 L -90 -180 L -140 -120 Z" fill="#fff" opacity={0.6} />
      <rect x={34} y={-200} width={110} height={200} rx={12} fill="#6b4f3a" />
      <rect x={46} y={-188} width={86} height={84} rx={8} fill="#bfe9ff" />
      <circle cx={118} cy={-90} r={7} fill="#ffd166" />
      {/* shutter */}
      {sh > 0 ? (
        <g>
          <rect x={-W / 2 + 6} y={-246} width={W - 12} height={246 * sh} fill="#9aa3b5" />
          {Array.from({length: Math.floor((246 * sh) / 18)}).map((_, i) => (
            <rect key={i} x={-W / 2 + 6} y={-246 + i * 18 + 12} width={W - 12} height={4} fill="#7d8699" />
          ))}
          <rect x={-W / 2 + 6} y={-246 + 246 * sh - 10} width={W - 12} height={10} fill="#6f778a" />
        </g>
      ) : null}
      {/* awning */}
      <g>
        {Array.from({length: scallops}).map((_, i) => (
          <g key={i}>
            <rect x={-W / 2 - 10 + i * sw} y={-262} width={sw + 0.5} height={44} fill={stripes[i % stripes.length]} />
            <circle cx={-W / 2 - 10 + i * sw + sw / 2} cy={-218} r={sw / 2} fill={stripes[i % stripes.length]} />
          </g>
        ))}
        <rect x={-W / 2 - 10} y={-266} width={W + 20} height={10} rx={5} fill="#000" opacity={0.08} />
      </g>
      {/* sign board */}
      <rect x={-W / 2 - 16} y={-352} width={W + 32} height={92} rx={22} fill={sign} />
      <text x={0} y={-292} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={name.length > 9 ? 48 : 58} fill={signText}>
        {name}
      </text>
      {/* hanging "closed" sign */}
      {closedSign > 0 ? (
        <g transform={`translate(-75 -180) rotate(${Math.sin(t * 5) * 8 * (1 - clamp(closedSign - 1))}) scale(${closedSign > 0 ? Math.min(1, closedSign) : 0})`}>
          <path d="M -60 -50 L 0 -90 L 60 -50" stroke="#5a5a6a" strokeWidth={4} fill="none" />
          <rect x={-100} y={-52} width={200} height={70} rx={14} fill="#ff4d6d" />
          <text x={0} y={-4} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={38} fill="#fff">
            ЗАКРЫТО
          </text>
        </g>
      ) : null}
      {cracked > 0 ? (
        <g stroke="#2b2350" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={clamp(cracked)}>
          <path d="M -40 -352 L -10 -300 L -50 -250 L -5 -190 L -40 -120" />
          <path d="M 120 -260 L 90 -200 L 130 -150" />
        </g>
      ) : null}
    </g>
  );
};

// ── money ──────────────────────────────────────────────────────────────
export const Coin: React.FC<XY & {face?: boolean; spin?: number}> = ({face, spin = 0, ...p}) => {
  const sx = Math.max(0.15, Math.abs(Math.cos(spin)));
  return (
    <g transform={`${tf(p)} scale(${sx} 1)`} opacity={p.o ?? 1}>
      <circle r={40} fill="#e8a316" />
      <circle r={34} fill="#ffcf3f" />
      <circle r={26} fill="none" stroke="#e8a316" strokeWidth={4} />
      {face ? (
        <g>
          <circle cx={-10} cy={-4} r={4} fill={INK} />
          <circle cx={10} cy={-4} r={4} fill={INK} />
          <path d="M -8 8 Q 0 15 8 8" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
        </g>
      ) : (
        <text y={14} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={40} fill="#b26d00">
          ₽
        </text>
      )}
    </g>
  );
};

export const Piggy: React.FC<XY & {crack?: number; t: number}> = ({crack = 0, t, ...p}) => {
  const c = clamp(crack);
  const split = c * 40;
  const body = (
    <g>
      <ellipse cx={0} cy={-110} rx={130} ry={98} fill="#ff9ebb" />
      <ellipse cx={-30} cy={-150} rx={60} ry={30} fill="#fff" opacity={0.25} />
      <path d="M -70 -190 L -50 -240 L -20 -196 Z" fill="#ff86a8" />
      <rect x={-30} y={-212} width={60} height={10} rx={5} fill="#c4466e" />
      <ellipse cx={128} cy={-110} rx={30} ry={36} fill="#ff86a8" />
      <circle cx={120} cy={-118} r={6} fill="#c4466e" />
      <circle cx={136} cy={-102} r={6} fill="#c4466e" />
      <circle cx={62} cy={-140} r={9} fill={INK} />
      <path d="M -128 -120 q -30 -10 -20 -40" stroke="#ff86a8" strokeWidth={10} fill="none" strokeLinecap="round" />
      {[-70, -20, 30, 80].map((x) => (
        <rect key={x} x={x - 14} y={-30} width={28} height={30} rx={8} fill="#ff86a8" />
      ))}
    </g>
  );
  return (
    <g transform={tf(p)} opacity={p.o ?? 1}>
      <Shadow x={0} y={0} w={300} />
      {c <= 0 ? (
        body
      ) : (
        <>
          <g transform={`translate(${-split} ${split * 0.3}) rotate(${-c * 12})`}>
            <clipPath id="pigL">
              <path d="M -200 -260 L 10 -260 L -20 -170 L 15 -110 L -15 -40 L 5 20 L -200 20 Z" />
            </clipPath>
            <g clipPath="url(#pigL)">{body}</g>
          </g>
          <g transform={`translate(${split} ${split * 0.3}) rotate(${c * 12})`}>
            <clipPath id="pigR">
              <path d="M 200 -260 L 10 -260 L -20 -170 L 15 -110 L -15 -40 L 5 20 L 200 20 Z" />
            </clipPath>
            <g clipPath="url(#pigR)">{body}</g>
          </g>
        </>
      )}
    </g>
  );
};

// ── VK guard at the door ───────────────────────────────────────────────
export const VkGuard: React.FC<XY & {t: number; shrug?: number}> = ({t, shrug = 0, ...p}) => {
  const bob = Math.sin(t * 3) * 4;
  const arm = shrug * 50;
  return (
    <g transform={tf(p)} opacity={p.o ?? 1}>
      <Shadow x={0} y={0} w={220} />
      <g transform={`translate(0 ${bob})`}>
        <path d="M -40 -50 L -44 -8" stroke={INK} strokeWidth={14} strokeLinecap="round" />
        <path d="M 40 -50 L 44 -8" stroke={INK} strokeWidth={14} strokeLinecap="round" />
        <ellipse cx={-50} cy={-4} rx={22} ry={11} fill={INK} />
        <ellipse cx={50} cy={-4} rx={22} ry={11} fill={INK} />
        <rect x={-100} y={-280} width={200} height={240} rx={56} fill="#2787f5" />
        <rect x={-100} y={-280} width={200} height={240} rx={56} fill="url(#vkShine)" />
        <defs>
          <linearGradient id="vkShine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity={0.25} />
            <stop offset="60%" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* cap */}
        <path d="M -90 -262 Q 0 -340 90 -262 Z" fill="#14398a" />
        <rect x={-104} y={-270} width={208} height={18} rx={9} fill="#0f2c6b" />
        <circle cx={0} cy={-292} r={12} fill="#ffd166" />
        {/* face */}
        <ellipse cx={-36} cy={-212} rx={12} ry={15} fill="#fff" />
        <ellipse cx={36} cy={-212} rx={12} ry={15} fill="#fff" />
        <circle cx={-34} cy={-210} r={7} fill={INK} />
        <circle cx={38} cy={-210} r={7} fill={INK} />
        <path d="M -54 -240 L -20 -234" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <path d="M 54 -246 L 20 -236" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <path d="M -16 -176 Q 0 -168 16 -176" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
        <text x={0} y={-90} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={60} fill="#fff">
          VK
        </text>
        {/* arms + clipboard */}
        <path d={`M -100 -150 L ${-150 - arm * 0.3} ${-110 - arm}`} stroke="#1f6fd1" strokeWidth={22} strokeLinecap="round" />
        <g transform={`translate(${110 + arm * 0.4} ${-150 - arm * 0.8}) rotate(${-8 - shrug * 14})`}>
          <rect x={0} y={-70} width={110} height={140} rx={12} fill="#c8935a" />
          <rect x={10} y={-56} width={90} height={116} rx={8} fill="#fff" />
          <rect x={35} y={-80} width={40} height={20} rx={6} fill="#7d8699" />
          <text x={55} y={0} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#2787f5">
            ID?
          </text>
          <rect x={22} y={20} width={66} height={8} rx={4} fill="#d6dbe6" />
          <rect x={22} y={36} width={46} height={8} rx={4} fill="#d6dbe6" />
        </g>
      </g>
    </g>
  );
};

// ── misc props ─────────────────────────────────────────────────────────
export const Calendar: React.FC<XY & {year: string; flip?: number}> = ({year, flip = 1, ...p}) => (
  <g transform={tf(p)} opacity={p.o ?? 1}>
    <rect x={-110} y={-120} width={220} height={240} rx={22} fill="#fff" />
    <rect x={-110} y={-120} width={220} height={70} rx={22} fill="#ff6b6b" />
    <rect x={-110} y={-80} width={220} height={30} fill="#ff6b6b" />
    <circle cx={-55} cy={-120} r={10} fill="#2b2350" />
    <circle cx={55} cy={-120} r={10} fill="#2b2350" />
    <text x={0} y={-68} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={30} fill="#fff">
      ГОД
    </text>
    <g transform={`translate(0 30) scale(1 ${Math.max(0.02, Math.abs(Math.cos((1 - clamp(flip)) * Math.PI * 0.5)))})`}>
      <text x={0} y={30} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={84} fill="#2b2350">
        {year}
      </text>
    </g>
  </g>
);

export const Books: React.FC<XY> = (p) => (
  <g transform={tf(p)} opacity={p.o ?? 1}>
    <Shadow x={0} y={0} w={240} />
    <rect x={-110} y={-48} width={220} height={48} rx={10} fill="#4ecdc4" />
    <rect x={-96} y={-40} width={190} height={8} rx={4} fill="#fff" opacity={0.6} />
    <rect x={-96} y={-94} width={200} height={46} rx={10} fill="#ff6b6b" transform="rotate(-4)" />
    <rect x={-84} y={-140} width={180} height={46} rx={10} fill="#ffd166" transform="rotate(3)" />
    <text x={0} y={-108} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={26} fill="#7a5200" transform="rotate(3)">
      JS / KOTLIN
    </text>
  </g>
);

export const Cloud: React.FC<XY & {fill?: string}> = ({fill = '#fff', ...p}) => (
  <g transform={tf(p)} opacity={p.o ?? 1} fill={fill}>
    <circle cx={-120} cy={10} r={80} />
    <circle cx={-30} cy={-50} r={110} />
    <circle cx={90} cy={-20} r={95} />
    <circle cx={160} cy={30} r={65} />
    <rect x={-200} y={10} width={420} height={90} rx={45} />
  </g>
);

export const Sparkle: React.FC<XY & {color?: string}> = ({color = '#ffd166', ...p}) => (
  <g transform={tf(p)} opacity={p.o ?? 1}>
    <path d="M 0 -30 C 4 -8 8 -4 30 0 C 8 4 4 8 0 30 C -4 8 -8 4 -30 0 C -8 -4 -4 -8 0 -30 Z" fill={color} />
  </g>
);

export const Heart: React.FC<XY & {color?: string}> = ({color = '#ff6b8b', ...p}) => (
  <g transform={tf(p)} opacity={p.o ?? 1}>
    <path d="M 0 -10 C -10 -34 -46 -30 -44 -2 C -42 22 0 44 0 44 C 0 44 42 22 44 -2 C 46 -30 10 -34 0 -10 Z" fill={color} />
  </g>
);

export const Bubble: React.FC<XY & {text: string; color?: string; textColor?: string; w?: number; spiky?: boolean; size?: number}> = ({
  text, color = '#fff', textColor = INK, w = 260, spiky, size = 54, ...p
}) => (
  <g transform={tf(p)} opacity={p.o ?? 1}>
    {spiky ? (
      <path
        d={Array.from({length: 18})
          .map((_, i) => {
            const a = (i / 18) * Math.PI * 2;
            const rr = i % 2 ? 0.78 : 1;
            return `${i ? 'L' : 'M'} ${Math.cos(a) * (w / 2) * rr} ${Math.sin(a) * (w / 3) * rr}`;
          })
          .join(' ') + ' Z'}
        fill={color}
      />
    ) : (
      <>
        <rect x={-w / 2} y={-62} width={w} height={124} rx={50} fill={color} />
        <path d="M -30 58 L -60 104 L 10 60 Z" fill={color} />
      </>
    )}
    <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={size} fill={textColor}>
      {text}
    </text>
  </g>
);

export const Checklist: React.FC<XY & {items: {label: string; on: number}[]}> = ({items, ...p}) => (
  <g transform={tf(p)} opacity={p.o ?? 1}>
    <rect x={-250} y={-30} width={500} height={items.length * 84 + 40} rx={30} fill="#fff" />
    {items.map((it, i) => {
      const y = 20 + i * 84;
      const k = clamp(it.on);
      return (
        <g key={i}>
          <rect x={-210} y={y - 4} width={56} height={56} rx={14} fill={k > 0 ? '#2ecc71' : '#e9ecf3'} />
          {k > 0 ? (
            <path
              d="M -198 26 L -186 40 L -164 12"
              stroke="#fff"
              strokeWidth={9}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={70}
              strokeDashoffset={70 * (1 - k)}
            />
          ) : null}
          <text x={-130} y={y + 38} fontFamily={F} fontWeight={800} fontSize={40} fill={k > 0 ? INK : '#9aa1b5'}>
            {it.label}
          </text>
        </g>
      );
    })}
  </g>
);

export const Stamp: React.FC<XY & {text: string; color?: string}> = ({text, color = '#2ecc71', ...p}) => (
  <g transform={tf(p)} opacity={p.o ?? 1}>
    <rect x={-190} y={-56} width={380} height={112} rx={20} fill="none" stroke={color} strokeWidth={10} />
    <rect x={-174} y={-40} width={348} height={80} rx={12} fill="none" stroke={color} strokeWidth={4} />
    <text x={0} y={22} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={60} fill={color}>
      {text}
    </text>
  </g>
);

export const Bolt: React.FC<XY> = (p) => (
  <g transform={tf(p)} opacity={p.o ?? 1}>
    <path d="M 20 -120 L -50 10 L 0 10 L -24 120 L 60 -20 L 8 -20 Z" fill="#ffd166" stroke="#ff9f1c" strokeWidth={6} strokeLinejoin="round" />
  </g>
);

export const Sun: React.FC<XY & {t: number}> = ({t, ...p}) => (
  <g transform={tf(p)} opacity={p.o ?? 1}>
    <g transform={`rotate(${t * 20})`}>
      {Array.from({length: 12}).map((_, i) => (
        <rect key={i} x={-8} y={-150} width={16} height={46} rx={8} fill="#ffcf3f" transform={`rotate(${i * 30})`} />
      ))}
    </g>
    <circle r={92} fill="#ffd84d" />
    <circle cx={-28} cy={-10} r={9} fill="#7a5200" />
    <circle cx={28} cy={-10} r={9} fill="#7a5200" />
    <path d="M -26 22 Q 0 46 26 22" stroke="#7a5200" strokeWidth={7} fill="none" strokeLinecap="round" />
  </g>
);

export const RainCloud: React.FC<XY & {t: number}> = ({t, ...p}) => (
  <g transform={tf(p)} opacity={p.o ?? 1}>
    {Array.from({length: 9}).map((_, i) => {
      const k = (t * 1.6 + hash(i, 3)) % 1;
      const x = -150 + i * 38;
      return <path key={i} d={`M ${x} ${60 + k * 160} l -8 26`} stroke="#6f8fd6" strokeWidth={6} strokeLinecap="round" opacity={1 - k} />;
    })}
    <Cloud x={0} y={0} s={0.8} fill="#a7b2c9" />
  </g>
);

export const Box: React.FC<XY & {lid: number; label: string}> = ({lid, label, ...p}) => (
  <g transform={tf(p)} opacity={p.o ?? 1}>
    <Shadow x={0} y={0} w={300} />
    <rect x={-130} y={-170} width={260} height={170} rx={10} fill="#d9a066" />
    <rect x={-130} y={-170} width={260} height={30} fill="#c48a52" />
    <rect x={-80} y={-100} width={160} height={50} rx={10} fill="#fff4e0" />
    <text x={0} y={-64} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={30} fill="#8a5a2b">
      {label}
    </text>
    <g transform={`rotate(${-120 * (1 - clamp(lid))} -130 -170)`}>
      <rect x={-140} y={-196} width={140} height={28} rx={8} fill="#e8b47c" />
    </g>
    <g transform={`rotate(${120 * (1 - clamp(lid))} 130 -170)`}>
      <rect x={0} y={-196} width={140} height={28} rx={8} fill="#e8b47c" />
    </g>
  </g>
);

export const Signpost: React.FC<XY & {a: string; b: string; k: number}> = ({a, b, k, ...p}) => (
  <g transform={tf(p)} opacity={p.o ?? 1}>
    <Shadow x={0} y={0} w={160} />
    <rect x={-10} y={-300} width={20} height={300} rx={8} fill="#8a5a2b" />
    <g transform={`rotate(${-6 + Math.sin(k * 6) * 2})`}>
      <path d="M -20 -290 L 170 -290 L 210 -250 L 170 -210 L -20 -210 Z" fill="#2787f5" />
      <text x={90} y={-236} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={36} fill="#fff">
        {a}
      </text>
    </g>
    <g transform={`rotate(${6 - Math.sin(k * 6) * 2})`}>
      <path d="M 20 -190 L -170 -190 L -210 -150 L -170 -110 L 20 -110 Z" fill="#2ecc71" />
      <text x={-90} y={-136} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={36} fill="#fff">
        {b}
      </text>
    </g>
  </g>
);

export const Confetti: React.FC<{t: number; t0: number; n?: number; w: number; h: number}> = ({t, t0, n = 46, w, h}) => {
  const d = t - t0;
  if (d < 0 || d > 3.2) return null;
  const colors = ['#ff6b6b', '#ffd166', '#4ecdc4', '#6c5ce7', '#2ecc71', '#ff8ac6'];
  return (
    <g>
      {Array.from({length: n}).map((_, i) => {
        const x0 = hash(i, 1) * w;
        const vy = 260 + hash(i, 2) * 260;
        const y = -40 + vy * d + Math.sin(d * 4 + i) * 10;
        const x = x0 + Math.sin(d * 3 + hash(i, 4) * 6) * 40;
        if (y > h + 40) return null;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={16}
            height={26}
            rx={4}
            fill={colors[i % colors.length]}
            transform={`rotate(${d * 300 * (hash(i, 5) - 0.5) + i * 20} ${x + 8} ${y + 13})`}
            opacity={Math.min(1, (3.2 - d) / 0.5)}
          />
        );
      })}
    </g>
  );
};
