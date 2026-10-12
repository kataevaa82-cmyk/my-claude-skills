import React from 'react';
import {clamp, mix} from './anim';

export type Emotion = {
  browRaise: number; // px up
  browTilt: number; // + inner ends up (worried), - inner down (angry)
  eyeOpen: number; // 1 normal
  squint: number; // 0..1 lower lid up (smiling eyes)
  gazeX: number;
  gazeY: number;
  smile: number; // -1..1
  headTilt: number; // deg
  blush: number; // 0..1
};

export type Vec = [number, number];
export type Pose = {L: Vec; R: Vec; palmUp?: number};

const SKIN = '#f7c9a9';
const SKIN_SHADE = '#e9a988';
const HAIR = '#3a221c';
const HAIR_HI = '#5b3326';
const HOODIE = '#6c5ce7';
const HOODIE_DARK = '#5546c9';
const LIP = '#c2475a';
const INK = '#2a1712';

const UPPER = 118;
const FORE = 112;

/** two-bone IK: returns elbow position (bending away from the body centre) */
const solveArm = (s: Vec, target: Vec, outward: number): {e: Vec; h: Vec} => {
  const dx = target[0] - s[0];
  const dy = target[1] - s[1];
  let d = Math.hypot(dx, dy);
  const maxD = UPPER + FORE - 2;
  let tx = target[0];
  let ty = target[1];
  if (d > maxD) {
    tx = s[0] + (dx / d) * maxD;
    ty = s[1] + (dy / d) * maxD;
    d = maxD;
  }
  d = Math.max(d, Math.abs(UPPER - FORE) + 4);
  const a = Math.acos(clamp((UPPER * UPPER + d * d - FORE * FORE) / (2 * UPPER * d), -1, 1));
  const base = Math.atan2(ty - s[1], tx - s[0]);
  const cand = [base + a, base - a].map((ang) => [s[0] + Math.cos(ang) * UPPER, s[1] + Math.sin(ang) * UPPER] as Vec);
  // prefer the elbow that sits further out (and lower)
  const score = (e: Vec) => (e[0] - 300) * outward + e[1] * 0.35;
  const e = score(cand[0]) > score(cand[1]) ? cand[0] : cand[1];
  return {e, h: [tx, ty]};
};

const Arm: React.FC<{s: Vec; target: Vec; outward: number; palmUp: number}> = ({s, target, outward, palmUp}) => {
  const {e, h} = solveArm(s, target, outward);
  const ang = Math.atan2(h[1] - e[1], h[0] - e[0]);
  const cuff: Vec = [h[0] - Math.cos(ang) * 26, h[1] - Math.sin(ang) * 26];
  return (
    <g>
      <path d={`M ${s[0]} ${s[1]} L ${e[0]} ${e[1]} L ${cuff[0]} ${cuff[1]}`} stroke={HOODIE} strokeWidth={54} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={`M ${s[0]} ${s[1]} L ${e[0]} ${e[1]}`} stroke={HOODIE_DARK} strokeOpacity={0.25} strokeWidth={20} strokeLinecap="round" fill="none" transform="translate(6,6)" />
      <circle cx={cuff[0]} cy={cuff[1]} r={25} fill={HOODIE_DARK} />
      <g transform={`translate(${h[0]} ${h[1]}) rotate(${(ang * 180) / Math.PI - 90})`}>
        <ellipse cx={0} cy={4} rx={24} ry={mix(27, 19, palmUp)} fill={SKIN} />
        <ellipse cx={outward * -17} cy={-6} rx={9} ry={15} fill={SKIN} transform={`rotate(${outward * 30})`} />
        <path d="M -12 14 Q 0 20 12 14" stroke={SKIN_SHADE} strokeWidth={3} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
};

export const Heroine: React.FC<{
  emo: Emotion;
  pose: Pose;
  mouth: number; // 0..1 speech openness
  blink: number; // 0..1
  bob: number; // px
  nod: number; // deg
}> = ({emo, pose, mouth, blink, bob, nod}) => {
  const eyeOpen = Math.max(0.06, emo.eyeOpen * (1 - blink));
  const tilt = emo.headTilt + nod;
  const palmUp = pose.palmUp ?? 0;

  // mouth geometry
  const mw = 30 + emo.smile * 6 + mouth * 4;
  const my = 348;
  const openH = mouth * 34 + Math.max(0, emo.eyeOpen - 1.1) * 30;
  const corner = -emo.smile * 9;

  const eye = (cx: number, side: 1 | -1) => {
    const ix = cx + emo.gazeX;
    const iy = 264 + emo.gazeY;
    const squintY = 264 + 30 - emo.squint * 26;
    return (
      <g>
        <g transform={`translate(${cx} 264) scale(1 ${eyeOpen}) translate(${-cx} -264)`}>
          <clipPath id={`eyeclip${side}`}>
            <ellipse cx={cx} cy={264} rx={27} ry={31} />
          </clipPath>
          <ellipse cx={cx} cy={264} rx={27} ry={31} fill="#fff" />
          <g clipPath={`url(#eyeclip${side})`}>
            <circle cx={ix} cy={iy + 4} r={20} fill="url(#iris)" />
            <circle cx={ix} cy={iy + 4} r={10} fill="#1b0f0b" />
            <circle cx={ix + 7} cy={iy - 5} r={6.5} fill="#fff" />
            <circle cx={ix - 6} cy={iy + 11} r={3} fill="#fff" opacity={0.85} />
            {/* smiling lower lid */}
            <ellipse cx={cx} cy={squintY + 26} rx={34} ry={26} fill={SKIN} />
          </g>
          <path
            d={`M ${cx - 30} ${262} Q ${cx} ${226} ${cx + 30} ${262} L ${cx + 34 * side} ${252}`}
            stroke={INK}
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        {eyeOpen < 0.2 ? (
          <path d={`M ${cx - 27} 262 Q ${cx} 276 ${cx + 27} 262`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
        ) : null}
      </g>
    );
  };

  const brow = (cx: number, side: 1 | -1) => {
    // side: -1 = screen-left brow, +1 = screen-right; inner end is towards the centre
    const y = 214 - emo.browRaise;
    const innerX = cx - side * 26;
    const outerX = cx + side * 28;
    const innerY = y - emo.browTilt;
    const outerY = y + 2;
    return (
      <path
        d={`M ${innerX} ${innerY} Q ${cx} ${y - 12 - emo.browTilt * 0.3} ${outerX} ${outerY}`}
        stroke={HAIR}
        strokeWidth={9}
        fill="none"
        strokeLinecap="round"
      />
    );
  };

  return (
    <svg viewBox="0 0 600 800" width="100%" height="100%" style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id="iris" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#8a5a3c" />
          <stop offset="100%" stopColor="#3a2216" />
        </radialGradient>
        <linearGradient id="hairG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={HAIR_HI} />
          <stop offset="100%" stopColor={HAIR} />
        </linearGradient>
        <linearGradient id="hoodieG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7d6ff0" />
          <stop offset="100%" stopColor={HOODIE_DARK} />
        </linearGradient>
        <linearGradient id="faceG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbd6bc" />
          <stop offset="100%" stopColor={SKIN} />
        </linearGradient>
        <linearGradient id="laptopG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef1f8" />
          <stop offset="100%" stopColor="#c9cfdd" />
        </linearGradient>
      </defs>

      <g transform={`translate(0 ${bob})`}>
        {/* hair behind */}
        <g transform={`rotate(${tilt * 0.6} 300 420)`}>
          <path d="M 300 72 C 438 72 488 178 474 306 C 466 402 494 470 470 540 L 130 540 C 106 470 134 402 126 306 C 112 178 162 72 300 72 Z" fill="url(#hairG)" />
        </g>
        {/* body */}
        <path d="M 92 800 C 92 610 118 528 200 490 C 240 472 270 466 300 466 C 330 466 360 472 400 490 C 482 528 508 610 508 800 Z" fill="url(#hoodieG)" />
        <ellipse cx={300} cy={478} rx={98} ry={30} fill={HOODIE_DARK} />
        <rect x={262} y={360} width={76} height={110} rx={30} fill={SKIN_SHADE} />
        <path d="M 270 500 L 266 588" stroke="#f2f0ff" strokeWidth={6} strokeLinecap="round" />
        <path d="M 330 500 L 334 588" stroke="#f2f0ff" strokeWidth={6} strokeLinecap="round" />
        <circle cx={266} cy={592} r={7} fill="#f2f0ff" />
        <circle cx={334} cy={592} r={7} fill="#f2f0ff" />

        {/* head */}
        <g transform={`rotate(${tilt} 300 400)`}>
          <ellipse cx={170} cy={268} rx={22} ry={32} fill={SKIN_SHADE} />
          <ellipse cx={430} cy={268} rx={22} ry={32} fill={SKIN_SHADE} />
          <circle cx={170} cy={304} r={6} fill="#ffd166" />
          <circle cx={430} cy={304} r={6} fill="#ffd166" />
          <path d="M 300 108 C 382 108 434 162 434 248 C 434 326 380 398 300 401 C 220 398 166 326 166 248 C 166 162 218 108 300 108 Z" fill="url(#faceG)" />
          <ellipse cx={226} cy={322} rx={28} ry={15} fill="#ff7b8a" opacity={0.22 + emo.blush * 0.35} />
          <ellipse cx={374} cy={322} rx={28} ry={15} fill="#ff7b8a" opacity={0.22 + emo.blush * 0.35} />
          {eye(250, -1)}
          {eye(350, 1)}
          {brow(250, -1)}
          {brow(350, 1)}
          <path d="M 297 290 C 292 308 300 316 309 309" stroke={SKIN_SHADE} strokeWidth={5} fill="none" strokeLinecap="round" />
          {/* mouth */}
          {openH < 3 ? (
            <path
              d={`M ${300 - mw} ${my + corner} Q 300 ${my + emo.smile * 18} ${300 + mw} ${my + corner}`}
              stroke={LIP}
              strokeWidth={7}
              fill="none"
              strokeLinecap="round"
            />
          ) : (
            <g>
              <clipPath id="mouthClip">
                <path d={`M ${300 - mw} ${my + corner} Q 300 ${my - 6 + emo.smile * 6} ${300 + mw} ${my + corner} Q 300 ${my + openH * 1.5 + emo.smile * 10} ${300 - mw} ${my + corner} Z`} />
              </clipPath>
              <path
                d={`M ${300 - mw} ${my + corner} Q 300 ${my - 6 + emo.smile * 6} ${300 + mw} ${my + corner} Q 300 ${my + openH * 1.5 + emo.smile * 10} ${300 - mw} ${my + corner} Z`}
                fill="#7a2233"
                stroke={LIP}
                strokeWidth={5}
                strokeLinejoin="round"
              />
              <g clipPath="url(#mouthClip)">
                <rect x={300 - mw} y={my - 14} width={mw * 2} height={14 + Math.min(8, openH * 0.3)} fill="#fff" />
                <ellipse cx={300} cy={my + openH * 0.75 + 8} rx={mw * 0.62} ry={12} fill="#ef6f86" />
              </g>
            </g>
          )}
          {/* hair front */}
          <path d="M 168 236 C 158 140 226 92 306 96 C 386 100 440 152 432 244 C 412 196 382 166 336 156 C 306 196 244 210 168 236 Z" fill="url(#hairG)" />
          <path d="M 170 220 C 156 300 162 360 186 410 C 198 348 192 288 204 232 Z" fill={HAIR} />
          <path d="M 430 220 C 444 300 438 360 414 410 C 402 348 408 288 396 232 Z" fill={HAIR} />
          <path d="M 236 128 C 268 112 318 110 350 122" stroke="#7a4632" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.6} />
        </g>

        {/* arms (in front of body) */}
        <Arm s={[178, 528]} target={pose.L} outward={-1} palmUp={palmUp} />
        <Arm s={[422, 528]} target={pose.R} outward={1} palmUp={palmUp} />

        {/* laptop */}
        <g>
          <rect x={138} y={652} width={324} height={210} rx={18} fill="url(#laptopG)" />
          <rect x={138} y={652} width={324} height={10} rx={5} fill="#ffffff" opacity={0.7} />
          <path d="M 300 735 C 290 720 268 726 272 744 C 276 758 300 770 300 770 C 300 770 324 758 328 744 C 332 726 310 720 300 735 Z" fill="#ff6b8b" />
          <rect x={360} y={690} width={64} height={30} rx={10} fill="#ffd166" />
          <text x={392} y={712} textAnchor="middle" fontSize={18} fontWeight={900} fill="#5a3b00" fontFamily="NunitoReel">{'</>'}</text>
        </g>
      </g>
    </svg>
  );
};
