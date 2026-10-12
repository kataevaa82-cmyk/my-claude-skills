import React from 'react';
import {NUNITO} from '../fonts';
import {hash} from '../lib/rng';
import {OUTRO_AT, TOTAL_SECONDS, at} from '../story';
import {clamp, fade, mix, mixColor, pop, smooth} from './anim';
import {
  AppBuddy, Bolt, Books, Box, Bubble, Calendar, Checklist, Cloud, Coin, Confetti, Heart, Piggy, RainCloud, Shop, Sparkle, Stamp, Sun, VkGuard,
} from './props';

export const STAGE_W = 1080;
export const STAGE_H = 760;

type SceneDef = {
  id: string;
  a: number;
  b: number;
  bg: [string, string];
  accent: string;
  draw: (t: number, lt: number) => React.ReactNode;
};

const GOOGLE = ['#4285f4', '#ea4335', '#fbbc05', '#34a853'];

export const SCENES: SceneDef[] = [
  {
    id: 'intro', a: 0, b: at(4), bg: ['#ffd9cc', '#fff1e6'], accent: '#ff7a59',
    draw: (t) => (
      <>
        <Bubble x={320} y={230} s={1.25 * pop(t, 0.05)} r={-6} text="Девочки!" w={420} size={64} color="#fff" />
        <Bubble x={740} y={470} s={1.35 * pop(t, at(2) - 0.1) * (1 + Math.sin(t * 6) * 0.03)} r={6} text="?" w={230} size={170} color="#6c5ce7" textColor="#fff" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Sparkle key={i} x={140 + i * 200} y={i % 2 ? 90 : 640 - (i % 3) * 30} s={0.6 + 0.4 * Math.abs(Math.sin(t * 3 + i))} o={fade(t, 0.2 + i * 0.12)} color={i % 2 ? '#ffd166' : '#ff8ac6'} />
        ))}
      </>
    ),
  },
  {
    id: 'dream', a: at(4), b: at(12), bg: ['#e6d9ff', '#ffe3f1'], accent: '#a66cff',
    draw: (t, lt) => (
      <>
        <circle cx={520} cy={725} r={18 * pop(lt, 0)} fill="#fff" />
        <circle cx={548} cy={672} r={30 * pop(lt, 0.1)} fill="#fff" />
        <Cloud x={545} y={400} s={1.45 * pop(lt, 0.2, 0.55)} />
        <AppBuddy x={545} y={545} s={0.86 * pop(lt, 0.45)} mood={t > at(10) ? 'excited' : 'happy'} t={t} />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const k = (lt * 0.45 + hash(i, 7)) % 1;
          return <Heart key={i} x={330 + hash(i, 8) * 460} y={560 - k * 480} s={0.5 + hash(i, 9) * 0.4} o={Math.sin(k * Math.PI) * fade(lt, 0.6)} />;
        })}
        {t > at(10)
          ? [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const d = t - at(10);
              const a = (i / 8) * Math.PI * 2;
              return <Sparkle key={i} x={545 + Math.cos(a) * (120 + d * 260)} y={400 + Math.sin(a) * (90 + d * 200)} s={0.7} o={clamp(1 - d / 0.9)} />;
            })
          : null}
      </>
    ),
  },
  {
    id: 'study', a: at(12), b: at(25), bg: ['#d6efff', '#fff4d6'], accent: '#3a86ff',
    draw: (t, lt) => (
      <>
        {['</>', '{ }', 'if()', '=>', 'npm', '[ ]', '()'].map((s, i) => {
          const k = (lt * 0.12 + hash(i, 11)) % 1;
          return (
            <text key={i} x={80 + hash(i, 12) * 900} y={720 - k * 700} fontFamily={NUNITO} fontWeight={900} fontSize={40 + hash(i, 13) * 30} fill="#3a86ff" opacity={0.25 * Math.sin(k * Math.PI)}>
              {s}
            </text>
          );
        })}
        <Books x={215} y={700} s={1.3 * pop(lt, 0.1)} />
        <AppBuddy x={545} y={705} s={1.1 * pop(lt, 0.25)} mood="study" cap t={t} />
        <Calendar x={860} y={290} s={1.15 * pop(t, at(22) - 0.1)} r={6} year="2021" />
      </>
    ),
  },
  {
    id: 'closed', a: at(25), b: at(47), bg: ['#c8d2e6', '#eef1f7'], accent: '#5c6b8a',
    draw: (t, lt) => {
      const shut = smooth((t - at(33)) / 0.9);
      const boxIn = fade(t, at(42), 0.4);
      return (
        <>
          <Calendar x={870} y={225} r={6} year={lt < 0.25 ? '2021' : '2022'} flip={lt < 0.25 ? 1 - lt / 0.25 : (lt - 0.25) / 0.25} s={1.1 - boxIn * 0.2} />
          <RainCloud x={430} y={95} s={1.0 * pop(t, at(29))} t={t} o={fade(t, at(29))} />
          <Shop
            x={mix(440, 290, boxIn)}
            y={705}
            s={mix(1.2, 0.92, boxIn)}
            name="Google Play"
            wall="#ffffff"
            stripes={GOOGLE}
            sign="#34a853"
            shutter={shut}
            closedSign={pop(t, at(33) + 0.7)}
            t={t}
            o={pop(lt, 0)}
          />
          {t > at(37) ? (
            <>
              <Coin x={mix(560, 1180, smooth((t - at(37)) / 1.6))} y={680 - Math.abs(Math.sin((t - at(37)) * 8)) * 60 * (1 - smooth((t - at(37)) / 1.6))} spin={(t - at(37)) * 9} />
              <Bubble x={800} y={470} s={1.25 * pop(t, at(37) + 0.25) * (1 - boxIn)} text="0 ₽" w={240} size={80} color="#ff4d6d" textColor="#fff" r={-5} />
            </>
          ) : null}
          {boxIn > 0 ? (
            <g opacity={boxIn}>
              <AppBuddy x={790} y={mix(450, 640, smooth((t - at(42)) / 0.7))} s={0.78} mood="sleep" t={t} />
              <Box x={790} y={705} s={1.2 * pop(t, at(42))} lid={smooth((t - at(44)) / 0.6)} label="ОТЛОЖЕНО" />
            </g>
          ) : null}
        </>
      );
    },
  },
  {
    id: 'yandex', a: at(47), b: at(66), bg: ['#ffe7a1', '#fff6dc'], accent: '#ff9f1c',
    draw: (t, lt) => {
      const walk = smooth((t - at(59)) / 1.4);
      return (
        <>
          <Sun x={880} y={mix(560, 190, smooth(lt / 1.4))} s={0.95} t={t} />
          <Shop x={540} y={705} s={1.2 * pop(t, at(53) - 0.15)} name="Яндекс" wall="#fff3e0" stripes={['#ff3333', '#ffcc00']} sign="#ff3333" t={t} glow={fade(t, at(53))} />
          <AppBuddy x={mix(170, 330, walk)} y={710} s={0.8 * pop(lt, 0.1)} mood={t < at(50) ? 'sleep' : t < at(59) ? 'hopeful' : 'happy'} t={t} />
          {t > at(55) - 0.1 && t < at(59) + 0.3 ? (
            <>
              <Bubble x={760} y={150} s={1.25 * pop(t, at(55) - 0.1)} text="?" w={150} size={110} color="#fff" textColor="#ff9f1c" r={8} o={1 - fade(t, at(59))} />
              <Bubble x={290} y={230} s={1.25 * pop(t, at(56))} text="?" w={110} size={80} color="#fff" textColor="#ff9f1c" r={-8} o={1 - fade(t, at(59))} />
            </>
          ) : null}
        </>
      );
    },
  },
  {
    id: 'success', a: at(66), b: at(83), bg: ['#c9f6db', '#f2fff6'], accent: '#22b35e',
    draw: (t, lt) => (
      <>
        <Checklist
          x={560}
          y={110}
          s={1.12 * pop(lt, 0)}
          items={[
            {label: 'Разобралась', on: pop(t, at(69), 0.35)},
            {label: 'Всё сделала', on: pop(t, at(72), 0.35)},
            {label: 'Модерация', on: pop(t, at(75), 0.35)},
            {label: 'Работает!', on: pop(t, at(81), 0.35)},
          ]}
        />
        <Stamp x={720} y={630} r={-12} s={t > at(77) ? mix(2.3, 1.05, smooth((t - at(77)) / 0.22)) : 0} o={fade(t, at(77), 0.15)} text="ОДОБРЕНО" />
        <AppBuddy x={180} y={710} s={0.8 * pop(lt, 0.2)} mood={t > at(80) ? 'excited' : 'happy'} wave={t > at(66) && t < at(80)} t={t} />
        <Confetti t={t} t0={at(81)} w={STAGE_W} h={STAGE_H} />
      </>
    ),
  },
  {
    id: 'money', a: at(83), b: at(92), bg: ['#fff0b3', '#ffe2c4'], accent: '#e8a316',
    draw: (t, lt) => (
      <>
        <Piggy x={580} y={715} s={1.35 * pop(lt, 0)} t={t} />
        {Array.from({length: 14}).map((_, i) => {
          const t0 = at(87) + i * 0.22;
          const d = t - t0;
          if (d < 0 || d > 0.9) return null;
          return <Coin key={i} x={580 + (hash(i, 31) - 0.5) * 40} y={-60 + d * 560} s={1.0} spin={d * 10 + i} o={d > 0.75 ? (0.9 - d) / 0.15 : 1} />;
        })}
        <Bubble x={820} y={170} s={1.2 * pop(t, at(88))} r={6} text={`+${(Math.min(99, Math.floor(Math.max(0, t - at(88)) * 14)) * 100).toLocaleString('ru-RU')} ₽`} w={330} size={64} color="#2ecc71" textColor="#fff" />
        <AppBuddy x={170} y={710} s={0.8 * pop(lt, 0.2)} mood="excited" t={t} />
      </>
    ),
  },
  {
    id: 'crash', a: at(92), b: at(98), bg: ['#ff8f8f', '#ffd6cc'], accent: '#ff3b3b',
    draw: (t, lt) => {
      const crack = smooth((t - at(93) - 0.1) / 0.35);
      return (
        <>
          <Bolt x={820} y={230} s={1.2} o={Math.floor(t * 10) % 3 === 0 ? 0.25 : 1} />
          <Bolt x={240} y={170} s={0.8} r={-14} o={Math.floor(t * 10 + 1) % 3 === 0 ? 0.2 : 0.9} />
          <Piggy x={580} y={715} s={1.35} crack={crack} t={t} />
          {crack > 0
            ? Array.from({length: 9}).map((_, i) => {
                const d = t - at(93) - 0.2;
                if (d < 0) return null;
                const vx = (hash(i, 41) - 0.5) * 900;
                const vy = -500 - hash(i, 42) * 300;
                return <Coin key={i} x={580 + vx * d} y={560 + vy * d + 900 * d * d} s={0.9} spin={d * 12 + i} />;
              })
            : null}
          <AppBuddy x={170} y={710} s={0.8} mood="dizzy" t={t} r={Math.sin(t * 8) * 6} />
          <Bubble x={740} y={160} s={1.2 * pop(t, at(97) - 0.1)} r={-8} text="$#%@!" w={380} size={76} color="#2b2350" textColor="#ff4d6d" spiky o={lt > 0 ? 1 : 0} />
        </>
      );
    },
  },
  {
    id: 'rustore', a: at(98), b: at(105), bg: ['#cfe4ff', '#eef6ff'], accent: '#0077ff',
    draw: (t, lt) => (
      <>
        <Shop x={580} y={705} s={1.25 * pop(t, at(101) - 0.15)} name="RuStore" wall="#eef5ff" stripes={['#0077ff', '#ffffff']} sign="#0077ff" t={t} glow={fade(t, at(101))} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Sparkle key={i} x={300 + i * 120} y={180 + (i % 2) * 60} s={0.5 + 0.4 * Math.abs(Math.sin(t * 4 + i))} o={fade(t, at(101) + i * 0.08)} color="#4dabff" />
        ))}
        <AppBuddy x={165} y={710} s={0.8 * pop(lt, 0.1)} mood="hopeful" t={t} />
      </>
    ),
  },
  {
    id: 'vk', a: at(105), b: at(130), bg: ['#d4e3ff', '#efe7ff'], accent: '#2787f5',
    draw: (t, lt) => {
      const walk = smooth((t - at(122)) / 2.2);
      const shrug = clamp(fade(t, at(115), 0.3) - fade(t, at(120), 0.3)) + fade(t, at(126), 0.3);
      return (
        <>
          <Shop x={810} y={705} s={0.98} name="RuStore" wall="#eef5ff" stripes={['#0077ff', '#ffffff']} sign="#0077ff" t={t} />
          <VkGuard x={mix(-160, 360, smooth(lt / 0.9))} y={710} s={1.15} t={t} shrug={clamp(shrug)} />
          {[0, 1, 2].map((i) => {
            const k = (lt * 0.5 + i / 3) % 1;
            return (
              <text key={i} x={330 + (i - 1) * 100} y={300 - k * 200} fontFamily={NUNITO} fontWeight={900} fontSize={70} fill="#2787f5" opacity={Math.sin(k * Math.PI) * fade(lt, 0.8)} textAnchor="middle">
                ?
              </text>
            );
          })}
          <Bubble x={540} y={100} s={1.1 * pop(t, at(115))} text="Без VK можно?" w={560} size={56} color="#fff" textColor="#2787f5" o={1 - fade(t, at(130) - 0.3)} />
          {t > at(122) - 0.2 ? <AppBuddy x={mix(-120, 660, walk)} y={712} s={0.72} mood={t > at(126) ? 'happy' : 'hopeful'} t={t} /> : null}
        </>
      );
    },
  },
  {
    id: 'outro', a: at(130), b: TOTAL_SECONDS + 1, bg: ['#ffd6e8', '#fff1f7'], accent: '#ff4f9a',
    draw: (t, lt) => (
      <>
        {Array.from({length: 10}).map((_, i) => {
          const k = (lt * 0.35 + hash(i, 51)) % 1;
          return i % 2 ? (
            <Heart key={i} x={80 + hash(i, 52) * 920} y={740 - k * 760} s={0.5 + hash(i, 53) * 0.5} o={Math.sin(k * Math.PI)} />
          ) : (
            <Bubble key={i} x={80 + hash(i, 52) * 920} y={740 - k * 760} s={0.32 + hash(i, 53) * 0.2} text="…" w={200} size={70} color="#fff" textColor="#ff4f9a" o={Math.sin(k * Math.PI)} />
          );
        })}
        <AppBuddy x={150} y={712} s={0.72 * pop(lt, 0.2)} mood="happy" wave t={t} />
        <VkGuard x={915} y={712} s={0.72 * pop(lt, 0.35)} t={t} />
        <Bubble x={540} y={290} s={1.2 * pop(lt, 0.05) * (1 + Math.sin(t * 5) * 0.02)} text="Что думаете?" w={620} size={78} color="#ff4f9a" textColor="#fff" />
        <g opacity={fade(t, OUTRO_AT)} transform={`translate(540 ${452 + Math.abs(Math.sin(t * 5)) * 16})`}>
          <text textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={58} fill="#2b2350">
            Пишите в комментах
          </text>
          <path d="M -16 40 L 16 40 L 16 82 L 40 82 L 0 126 L -40 82 L -16 82 Z" fill="#ff4f9a" />
        </g>
      </>
    ),
  },
];

export const sceneIndexAt = (t: number) => {
  let i = 0;
  SCENES.forEach((s, j) => {
    if (s.a <= t) i = j;
  });
  return i;
};

/** background colours blended across scene changes */
export const bgAt = (t: number): [string, string, string] => {
  const i = sceneIndexAt(t);
  const cur = SCENES[i];
  const prev = SCENES[Math.max(0, i - 1)];
  const k = smooth((t - cur.a) / 0.6);
  return [mixColor(prev.bg[0], cur.bg[0], k), mixColor(prev.bg[1], cur.bg[1], k), cur.accent];
};

export const Stage: React.FC<{t: number}> = ({t}) => {
  const i = sceneIndexAt(t);
  const layers: React.ReactNode[] = [];
  [i - 1, i].forEach((j) => {
    if (j < 0) return;
    const s = SCENES[j];
    const out = j < i ? fade(t, s.b, 0.35) : 0;
    if (out >= 1) return;
    const lt = t - s.a;
    const zoom = 1 + lt * 0.006; // slow push-in
    layers.push(
      <g key={s.id} opacity={1 - out} transform={`translate(${STAGE_W / 2} ${STAGE_H / 2}) scale(${zoom * (1 - out * 0.08)}) translate(${-STAGE_W / 2} ${-STAGE_H / 2})`}>
        {s.draw(t, lt)}
      </g>,
    );
  });
  return (
    <svg viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} width={STAGE_W} height={STAGE_H} style={{overflow: 'visible'}}>
      {layers}
    </svg>
  );
};
