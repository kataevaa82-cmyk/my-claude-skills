import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Appear, useAppear, useAt, useScene} from '../lib/scene';
import {Bubble, Card, Check, Emoji, FlowArrow, Orb, Pill, Spinner, Typewriter, usePulse} from '../lib/ui';
import {C, FONT, alpha, chapterColor} from '../theme';

export const Stage: React.FC<{children?: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <AbsoluteFill style={{padding: '120px 110px 190px', ...style}}>{children}</AbsoluteFill>
);

const GRAY = '#A3A9BE';

/* ───────────── Крючок: чат против агента ───────────── */
export const HookChat: React.FC<any> = ({request, leftTitle, leftReply, rightTitle, rightSteps, rows, reveal}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const rStart = at(reveal.right);
  const stepEvery = 26;
  const brain = useAppear(reveal.brain);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 110, display: 'flex', justifyContent: 'center'}}>
        <Appear at={reveal.request} from="top" style={{maxWidth: 1360}}>
          <div style={{display: 'flex', alignItems: 'flex-start', gap: 18}}>
            <Orb e="🙋" size={78} color={C.coral} />
            <Bubble who="user" style={{fontSize: 30}}>
              <Typewriter text={request} at={reveal.request} cps={55} caret={false} />
            </Bubble>
          </div>
        </Appear>
      </div>

      {/* левая панель */}
      <Appear at={reveal.left} from="left" style={{position: 'absolute', left: 110, top: 360, width: 790}}>
        <Card accent={GRAY} style={{height: 450}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONT.display, fontSize: 30, fontWeight: 600, color: GRAY}}>
            <Emoji e="💬" size={34} /> {leftTitle}
          </div>
          <div style={{marginTop: 26}}>
            <Bubble who="ai" style={{fontSize: 27}}>
              <Typewriter text={leftReply} at={reveal.left} cps={42} />
            </Bubble>
          </div>
          <div style={{position: 'absolute', bottom: 26, left: 32, fontSize: 24, color: C.faint, fontWeight: 600}}>Работу всё равно делать вам 🤷</div>
        </Card>
      </Appear>

      {/* правая панель */}
      <Appear at={reveal.right} from="right" style={{position: 'absolute', right: 110, top: 360, width: 790}}>
        <Card accent={C.coral} glow={0.6} style={{height: 450}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONT.display, fontSize: 30, fontWeight: 600, color: C.coral}}>
            <Emoji e="🤖" size={34} /> {rightTitle}
          </div>
          <div style={{marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10}}>
            {rightSteps.map((s: string, i: number) => {
              const f0 = rStart + 10 + i * stepEvery;
              const done = frame > f0 + stepEvery - 4;
              const vis = interpolate(frame, [f0, f0 + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              const p = interpolate(frame, [f0 + stepEvery - 6, f0 + stepEvery + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return (
                <div key={i} style={{display: 'flex', alignItems: 'center', gap: 14, opacity: vis, fontSize: 25, fontWeight: 600}}>
                  <div style={{width: 34, display: 'flex', justifyContent: 'center'}}>{done ? <Check p={p} size={32} /> : <Spinner size={28} />}</div>
                  <span style={{color: done ? C.text : C.dim}}>{s}</span>
                </div>
              );
            })}
          </div>
          {(() => {
            const f0 = rStart + 10 + rightSteps.length * stepEvery;
            const p = interpolate(frame, [f0, f0 + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return (
              <div style={{marginTop: 16, opacity: p, transform: `translateY(${(1 - p) * 14}px)`}}>
                {rows.map((r: string[], i: number) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 130px 110px',
                      padding: '8px 16px',
                      fontSize: 22,
                      fontWeight: 600,
                      background: i % 2 ? 'transparent' : 'rgba(255,255,255,0.05)',
                      borderRadius: 10,
                    }}
                  >
                    <span>{r[0]}</span>
                    <span style={{color: C.amber}}>{r[1]}</span>
                    <span style={{color: C.dim}}>{r[2]}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </Card>
      </Appear>

      {/* одна и та же модель */}
      <div style={{position: 'absolute', left: 960 - 70, top: 300, opacity: brain, transform: `scale(${0.7 + 0.3 * brain})`}}>
        <Orb e="🧠" size={140} color={C.violet} pulse={usePulse(50)} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 820,
          textAlign: 'center',
          opacity: brain,
          fontFamily: FONT.display,
          fontWeight: 600,
          fontSize: 34,
          color: C.violet,
        }}
      >
        внутри — одна и та же модель
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── Титул ───────────── */
export const HarnessRings: React.FC<{size?: number; color?: string; speed?: number; core?: string}> = ({size = 260, color = C.coral, speed = 1, core = '🧠'}) => {
  const frame = useCurrentFrame();
  const pulse = 0.5 + 0.5 * Math.sin(frame / 25);
  return (
    <div style={{width: size, height: size, position: 'relative'}}>
      {[0.98, 0.78, 0.58].map((k, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 100 100"
          style={{position: 'absolute', inset: 0, transform: `rotate(${(i % 2 ? -1 : 1) * frame * (0.6 + i * 0.35) * speed}deg)`}}
        >
          <circle
            cx="50"
            cy="50"
            r={48 * k}
            fill="none"
            stroke={i === 1 ? C.amber : i === 2 ? C.violet : color}
            strokeWidth={i === 0 ? 1.2 : 1.6}
            strokeDasharray={i === 0 ? '2 3' : i === 1 ? '18 6 4 6' : '30 10'}
            opacity={0.85}
          />
          <circle cx={50 + 48 * k} cy="50" r={i === 0 ? 1.6 : 2.2} fill={i === 1 ? C.amber : color} />
        </svg>
      ))}
      <div style={{position: 'absolute', inset: size * 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Orb e={core} size={size * 0.4} color={C.violet} pulse={pulse} />
      </div>
    </div>
  );
};

export const TitleCard: React.FC<any> = ({kicker, title, subtitle}) => {
  const frame = useCurrentFrame();
  const p = useAppear(0, 4);
  const p2 = useAppear(0, 16);
  const p3 = useAppear(1, 0);
  const shine = (frame * 1.2) % 300;
  const [w1, w2] = title.split(' Harness');
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 120}}>
      <div style={{opacity: p, transform: `scale(${0.8 + 0.2 * p})`, marginBottom: 30}}>
        <HarnessRings size={250} />
      </div>
      <div style={{opacity: p2}}>
        <Pill color={C.amber}>{kicker.toUpperCase()}</Pill>
      </div>
      <div
        style={{
          marginTop: 26,
          fontFamily: FONT.display,
          fontWeight: 700,
          fontSize: 116,
          letterSpacing: -2,
          lineHeight: 1.05,
          textAlign: 'center',
          opacity: p2,
          transform: `translateY(${(1 - p2) * 30}px)`,
        }}
      >
        <span style={{color: C.text}}>{w1} </span>
        <span
          style={{
            backgroundImage: `linear-gradient(100deg, ${C.coral} 0%, ${C.amber} ${shine / 3}%, ${C.coral} ${30 + shine / 3}%, ${C.violet} 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Harness{w2 ?? ''}
        </span>
      </div>
      <div
        style={{
          marginTop: 26,
          fontFamily: FONT.body,
          fontSize: 36,
          fontWeight: 500,
          color: C.dim,
          maxWidth: 1200,
          textAlign: 'center',
          opacity: p3,
          transform: `translateY(${(1 - p3) * 20}px)`,
        }}
      >
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── План ───────────── */
export const Agenda: React.FC<any> = ({items}) => {
  const at = useAt();
  const frame = useCurrentFrame();
  let active = -1;
  items.forEach((it: any, i: number) => {
    if (frame >= at(it.at)) active = i;
  });
  return (
    <Stage>
      <Appear at={0} from="top">
        <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 64, color: C.text}}>
          План <span style={{color: C.coral}}>ролика</span>
        </div>
      </Appear>
      <div style={{marginTop: 50, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '26px 40px'}}>
        {items.map((it: any, i: number) => (
          <Appear key={i} at={it.at} from="bottom">
            <Card accent={chapterColor(i + 1)} glow={i === active ? 1 : 0} pad={26} style={{display: 'flex', alignItems: 'center', gap: 26}}>
              <div
                style={{
                  fontFamily: FONT.display,
                  fontWeight: 700,
                  fontSize: 40,
                  color: chapterColor(i + 1),
                  width: 70,
                  opacity: 0.9,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <Emoji e={it.icon} size={50} />
              <div style={{fontSize: 33, fontWeight: 700}}>{it.text}</div>
            </Card>
          </Appear>
        ))}
      </div>
    </Stage>
  );
};

/* ───────────── Карточка главы ───────────── */
export const Chapter: React.FC<any> = ({num, title, icon}) => {
  const frame = useCurrentFrame();
  const scene = useScene();
  const color = chapterColor(scene.chapter);
  const p = useAppear(0, 0, {damping: 18, mass: 0.8});
  const p2 = useAppear(0, 8);
  const line = interpolate(frame, [6, 40], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  const sweep = interpolate(frame, [10, 70], [-30, 130], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 110}}>
      <div
        style={{
          position: 'absolute',
          fontFamily: FONT.display,
          fontWeight: 800,
          fontSize: 560,
          letterSpacing: -20,
          color: 'transparent',
          WebkitTextStroke: `3px ${alpha(color, 0.22)}`,
          opacity: p,
          transform: `translateY(${-40 + (1 - p) * 60}px) scale(${0.9 + 0.1 * p})`,
        }}
      >
        {String(num).padStart(2, '0')}
      </div>
      <div style={{opacity: p, transform: `scale(${0.6 + 0.4 * p})`}}>
        <Orb e={icon} size={170} color={color} pulse={0.5 + 0.5 * Math.sin(frame / 12)} />
      </div>
      <div style={{marginTop: 36, fontFamily: FONT.body, fontWeight: 800, fontSize: 28, letterSpacing: 8, color, opacity: p2, textTransform: 'uppercase'}}>
        Часть {num}
      </div>
      <div
        style={{
          marginTop: 10,
          fontFamily: FONT.display,
          fontWeight: 700,
          fontSize: 84,
          letterSpacing: -1,
          color: C.text,
          opacity: p2,
          transform: `translateY(${(1 - p2) * 26}px)`,
          textAlign: 'center',
          maxWidth: 1600,
          backgroundImage: `linear-gradient(100deg, ${C.text} ${sweep - 20}%, ${color} ${sweep}%, ${C.text} ${sweep + 20}%)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {title}
      </div>
      <div style={{marginTop: 34, height: 4, width: 520 * line, borderRadius: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)`}} />
    </AbsoluteFill>
  );
};

/* ───────────── Словарная статья ───────────── */
export const Dictionary: React.FC<any> = ({word, ipa, say, meanings}) => {
  const p = useAppear(0);
  return (
    <Stage style={{alignItems: 'center', justifyContent: 'center'}}>
      <Card style={{width: 1400, padding: '56px 70px'}} accent={C.amber} glow={0.3}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 34, opacity: p}}>
          <div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 130, letterSpacing: -3, color: C.text}}>{word}</div>
          <div style={{fontFamily: FONT.mono, fontSize: 36, color: C.dim}}>{ipa}</div>
          <Pill color={C.amber} style={{fontSize: 26}}>
            🔊 по-русски: «{say.replace('́', '')}»
          </Pill>
        </div>
        <div style={{fontSize: 24, color: C.faint, fontWeight: 700, letterSpacing: 3, marginTop: 8, opacity: p}}>АНГЛ. · СУЩЕСТВИТЕЛЬНОЕ И ГЛАГОЛ</div>
        <div style={{height: 2, background: 'rgba(255,255,255,0.1)', margin: '34px 0'}} />
        <div style={{display: 'flex', flexDirection: 'column', gap: 30}}>
          {meanings.map((m: any, i: number) => (
            <Appear key={i} at={m.at} from="left">
              <div style={{display: 'flex', gap: 28, alignItems: 'center'}}>
                <Orb e={i === 0 ? '🐴' : '🌬️'} size={92} color={i === 0 ? C.amber : C.cyan} />
                <div style={{fontSize: 40, fontWeight: 600, lineHeight: 1.35}}>
                  <span style={{fontFamily: FONT.display, color: i === 0 ? C.amber : C.cyan, marginRight: 16}}>{m.n}.</span>
                  {m.text}
                </div>
              </div>
            </Appear>
          ))}
        </div>
      </Card>
    </Stage>
  );
};

/* ───────────── Лошадь: без упряжи и с упряжью ───────────── */
export const Horse: React.FC<any> = ({harnessAt, moveAt, labelsAt}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const fH = at(harnessAt);
  const fM = at(moveAt);
  const fL = at(labelsAt);
  const harnessP = interpolate(frame, [fH, fH + 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const moving = frame > fM;
  // до упряжи — бродит туда-сюда
  const wanderX = 760 + 260 * Math.sin(frame / 55) + 80 * Math.sin(frame / 23);
  const facingRight = Math.cos(frame / 55) * 260 / 55 + Math.cos(frame / 23) * 80 / 23 > 0;
  const harnessedX = 620;
  const hx = interpolate(harnessP, [0, 1], [wanderX, harnessedX]);
  const bob = Math.abs(Math.sin(frame / (moving ? 5 : 9))) * (moving ? 14 : 8);
  const road = moving ? (frame - fM) * 9 : 0;
  const cartIn = harnessP;
  const labels = interpolate(frame, [fL, fL + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const groundY = 700;
  return (
    <AbsoluteFill>
      {/* поле */}
      <div style={{position: 'absolute', left: 0, right: 0, top: groundY, height: 4, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)'}} />
      {Array.from({length: 18}).map((_, i) => {
        const x = ((i * 137 + road) % 2100) - 90;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: groundY - 44 + (i % 3) * 6, opacity: 0.55}}>
            <Emoji e={i % 4 === 0 ? '🌾' : i % 4 === 2 ? '🌿' : '🌱'} size={40} />
          </div>
        );
      })}
      {Array.from({length: 12}).map((_, i) => {
        const x = ((i * 190 + road * 1.0) % 2280) - 180;
        return <div key={'r' + i} style={{position: 'absolute', left: x, top: groundY + 40, width: 90, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.12)', opacity: moving ? 1 : 0}} />;
      })}
      {/* блуждающая траектория */}
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: 1 - harnessP}}>
        <path d="M300 640 C 500 520, 650 720, 820 600 S 1150 540, 1300 650 S 1550 720, 1650 600" fill="none" stroke={alpha(C.amber, 0.35)} strokeWidth="4" strokeDasharray="10 14" />
      </svg>

      {/* телега */}
      <div style={{position: 'absolute', left: harnessedX + 330, top: groundY - 190, opacity: cartIn, transform: `translateX(${(1 - cartIn) * 300}px) translateY(${moving ? Math.sin(frame / 4) * 2 : 0}px)`}}>
        <svg width={420} height={200} viewBox="0 0 420 200">
          <rect x="40" y="70" width="330" height="80" rx="14" fill="#6B4A2E" stroke="#C99A6B" strokeWidth="4" />
          <rect x="40" y="70" width="330" height="18" rx="8" fill="#8A6040" />
          {[110, 300].map((cx) => (
            <g key={cx} transform={`rotate(${moving ? (frame - fM) * 8 : 0} ${cx} 160)`}>
              <circle cx={cx} cy="160" r="36" fill="#2A1C12" stroke="#C99A6B" strokeWidth="6" />
              {[0, 45, 90, 135].map((a) => (
                <line key={a} x1={cx} y1="160" x2={cx + 32 * Math.cos((a * Math.PI) / 180)} y2={160 + 32 * Math.sin((a * Math.PI) / 180)} stroke="#C99A6B" strokeWidth="4" />
              ))}
            </g>
          ))}
        </svg>
        <div style={{position: 'absolute', left: 80, top: -10}}>
          <Emoji e="📦" size={70} />
        </div>
        <div style={{position: 'absolute', left: 170, top: -2}}>
          <Emoji e="📦" size={60} />
        </div>
        <div style={{position: 'absolute', left: 250, top: -58}}>
          <Emoji e="🧑‍🌾" size={86} />
        </div>
      </div>
      {/* упряжь: оглобли и вожжи */}
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <path
          d={`M ${harnessedX + 150} ${groundY - 120} L ${harnessedX + 380} ${groundY - 115}`}
          stroke={C.amber}
          strokeWidth="9"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${harnessP} 1`}
          style={{filter: `drop-shadow(0 0 8px ${alpha(C.amber, 0.7)})`}}
        />
        <path
          d={`M ${harnessedX + 90} ${groundY - 175} Q ${harnessedX + 330} ${groundY - 280} ${harnessedX + 600} ${groundY - 200}`}
          stroke={C.coral}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${harnessP} 1`}
        />
      </svg>
      {/* лошадь */}
      <div
        style={{
          position: 'absolute',
          left: hx - 20,
          top: groundY - 210 - bob,
          transform: `scaleX(${harnessP > 0.5 ? 1 : facingRight ? -1 : 1})`,
        }}
      >
        <Emoji e="🐎" size={220} />
      </div>
      {harnessP > 0.3 ? (
        <div style={{position: 'absolute', left: hx + 70, top: groundY - 150 - bob, width: 110, height: 16, borderRadius: 8, background: C.amber, opacity: harnessP, boxShadow: `0 0 18px ${alpha(C.amber, 0.7)}`}} />
      ) : null}

      {/* подписи */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center'}}>
        <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 52, color: harnessP > 0.5 ? C.amber : C.text}}>
          {harnessP > 0.5 ? 'С упряжью — полезная работа' : 'Много силы, но нет направления'}
        </div>
      </div>
      <div style={{position: 'absolute', left: 300, top: 790, opacity: labels, display: 'flex', gap: 40}}>
        <Pill color={C.coral} style={{fontSize: 32, padding: '14px 28px'}}>
          💪 Сила — у лошади
        </Pill>
        <Pill color={C.amber} style={{fontSize: 32, padding: '14px 28px'}}>
          🧭 Направление, контроль и польза — от упряжи
        </Pill>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── Формула ───────────── */
export const Equation: React.FC<any> = ({modelAt, harnessAt, formulaAt, rolesAt, models}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const fF = at(formulaAt);
  const op = interpolate(frame, [fF, fF + 15], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const roles = useAppear(rolesAt);
  const Block: React.FC<{e: string; title: string; color: string; children?: React.ReactNode; role: string; when: number}> = ({e, title, color, children, role, when}) => (
    <Appear at={when} from="bottom" style={{width: 470}}>
      <Card accent={color} glow={0.5} style={{height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
        <Orb e={e} size={120} color={color} />
        <div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 46, marginTop: 20, color}}>{title}</div>
        <div style={{marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center'}}>{children}</div>
      </Card>
      <div style={{marginTop: 22, textAlign: 'center', fontSize: 30, fontWeight: 700, color: C.dim, opacity: roles}}>{role}</div>
    </Appear>
  );
  const Op: React.FC<{s: string}> = ({s}) => (
    <div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 96, color: C.text, opacity: op, transform: `scale(${0.6 + 0.4 * op})`, width: 110, textAlign: 'center', marginTop: 120}}>
      {s}
    </div>
  );
  return (
    <Stage style={{flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 170}}>
      <Block e="🤖" title="Агент" color={C.green} role="делает настоящую работу" when={formulaAt}>
        <Pill color={C.green} style={{fontSize: 22}}>ищет</Pill>
        <Pill color={C.green} style={{fontSize: 22}}>пишет файлы</Pill>
        <Pill color={C.green} style={{fontSize: 22}}>проверяет</Pill>
      </Block>
      <Op s="=" />
      <Block e="🧠" title="Модель" color={C.violet} role="мозг: рассуждает и пишет" when={modelAt}>
        {models.map((m: string) => (
          <Pill key={m} color={C.violet} style={{fontSize: 22}}>
            {m}
          </Pill>
        ))}
      </Block>
      <Op s="+" />
      <Block e="🔧" title="Harness" color={C.coral} role="руки, глаза, блокнот и правила" when={harnessAt}>
        {['инструменты', 'шаги', 'память', 'разрешения'].map((m) => (
          <Pill key={m} color={C.coral} style={{fontSize: 22}}>
            {m}
          </Pill>
        ))}
      </Block>
    </Stage>
  );
};
