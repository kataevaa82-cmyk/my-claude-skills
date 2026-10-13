import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Appear, useAppear, useAt} from '../lib/scene';
import {Card, Check, Emoji, Orb, Pill} from '../lib/ui';
import {C, FONT, alpha} from '../theme';
import {HarnessRings, Stage} from './intro';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

/* ───────────── Чек-лист ───────────── */
export const Checklist: React.FC<any> = ({items}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  let active = -1;
  items.forEach((it: any, i: number) => {
    if (frame >= at(it.at)) active = i;
  });
  return (
    <Stage>
      <Appear at={0} from="top">
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          <Emoji e="✅" size={60} />
          <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 52}}>
            Чек-лист: как работать с <span style={{color: C.green}}>ИИ-агентом</span>
          </div>
        </div>
      </Appear>
      <div style={{display: 'flex', flexDirection: 'column', gap: 12, marginTop: 34}}>
        {items.map((it: any, i: number) => {
          const f0 = at(it.at);
          const vis = interpolate(frame, [f0 - 4, f0 + 10], [0, 1], clamp);
          const chk = interpolate(frame, [f0 + 10, f0 + 26], [0, 1], clamp);
          const isA = i === active;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                padding: '12px 24px',
                borderRadius: 18,
                background: isA ? alpha(C.green, 0.1) : 'rgba(255,255,255,0.035)',
                border: `1.5px solid ${isA ? alpha(C.green, 0.55) : 'rgba(255,255,255,0.07)'}`,
                opacity: 0.25 + 0.75 * vis,
                transform: `translateX(${(1 - vis) * 16}px)`,
              }}
            >
              <Check p={chk} size={44} />
              <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 26, color: C.green, width: 34}}>{i + 1}</div>
              <div style={{fontSize: 29, fontWeight: 600, color: vis > 0.5 ? C.text : C.faint}}>{it.text}</div>
            </div>
          );
        })}
      </div>
    </Stage>
  );
};

/* ───────────── Плохой и хороший запрос ───────────── */
export const PromptCompare: React.FC<any> = ({badAt, goodAt, tagsAt, bad, good}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const tags = useAppear(tagsAt);
  const cols = [C.amber, C.cyan, C.green, C.pink, C.violet];
  return (
    <Stage>
      <div style={{display: 'flex', gap: 40, alignItems: 'flex-start', marginTop: 40}}>
        <Appear at={badAt} from="left" style={{width: 520}}>
          <Card accent={C.red} glow={0.3} style={{height: 560}}>
            <Pill color={C.red} style={{fontSize: 26}}>
              ❌ Плохой запрос
            </Pill>
            <div style={{fontSize: 40, fontWeight: 700, marginTop: 40, padding: '24px 28px', borderRadius: 20, background: 'rgba(255,255,255,0.06)'}}>«{bad}»</div>
            <div style={{fontSize: 26, color: C.dim, marginTop: 30, lineHeight: 1.45, fontWeight: 600}}>
              О чём? Для кого? Сколько слайдов? Откуда данные? 🤷
            </div>
          </Card>
        </Appear>
        <Appear at={goodAt} from="right" style={{flex: 1}}>
          <Card accent={C.green} glow={0.5} style={{height: 560}}>
            <Pill color={C.green} style={{fontSize: 26}}>
              ✅ Хороший запрос
            </Pill>
            <div style={{marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12}}>
              {good.map((g: any, i: number) => {
                const f0 = at(goodAt) + 12 + i * 22;
                const p = interpolate(frame, [f0, f0 + 12], [0, 1], clamp);
                return (
                  <div key={i} style={{display: 'flex', alignItems: 'center', gap: 18, opacity: p, transform: `translateY(${(1 - p) * 14}px)`}}>
                    <div style={{fontSize: 31, fontWeight: 700, flex: 1, borderLeft: `5px solid ${cols[i]}`, paddingLeft: 18, lineHeight: 1.3}}>{g.text}</div>
                    <div style={{opacity: tags, transform: `scale(${0.8 + 0.2 * tags})`}}>
                      <Pill color={cols[i]} style={{fontSize: 21, padding: '6px 16px'}}>
                        {g.tag}
                      </Pill>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Appear>
      </div>
      <div style={{marginTop: 26, textAlign: 'center', opacity: tags, fontSize: 30, fontWeight: 700, color: C.dim}}>
        Харнессу сразу понятно: какие файлы читать, какие инструменты нужны, когда работа готова
      </div>
    </Stage>
  );
};

/* ───────────── Итоги ───────────── */
export const Summary: React.FC<any> = ({items}) => {
  const cols = [C.violet, C.coral, C.green, C.amber];
  return (
    <Stage>
      <Appear at={0} from="top">
        <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 56}}>Подведём итоги</div>
      </Appear>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginTop: 44}}>
        {items.map((it: any, i: number) => (
          <Appear key={i} at={it.at} from="bottom">
            <Card accent={cols[i]} glow={0.4} style={{height: 250, display: 'flex', alignItems: 'center', gap: 30}}>
              <Orb e={it.icon} size={130} color={cols[i]} />
              <div>
                <div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 42, color: cols[i]}}>{it.title}</div>
                <div style={{fontSize: 28, fontWeight: 600, color: C.text, marginTop: 10, lineHeight: 1.35}}>{it.text}</div>
              </div>
            </Card>
          </Appear>
        ))}
      </div>
    </Stage>
  );
};

/* ───────────── Домашнее задание ───────────── */
export const Homework: React.FC<any> = ({tasks}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const cols = [C.cyan, C.green, C.amber];
  return (
    <Stage>
      <Appear at={0} from="top">
        <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
          <Emoji e="📅" size={64} />
          <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 54}}>Домашнее задание на неделю</div>
        </div>
      </Appear>
      <div style={{display: 'flex', gap: 30, marginTop: 60}}>
        {tasks.map((t: any, i: number) => {
          const f0 = at(t.at);
          const chk = interpolate(frame, [f0 + 40, f0 + 56], [0, 1], clamp);
          return (
            <Appear key={i} at={t.at} from="bottom" style={{flex: 1}}>
              <Card accent={cols[i]} glow={0.4} style={{height: 470, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
                <div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 30, color: cols[i]}}>Шаг {i + 1}</div>
                <div style={{marginTop: 24}}>
                  <Orb e={t.icon} size={150} color={cols[i]} />
                </div>
                <div style={{fontSize: 30, fontWeight: 700, marginTop: 30, lineHeight: 1.35}}>{t.text}</div>
                <div style={{position: 'absolute', right: 24, top: 24}}>
                  <Check p={chk} color={cols[i]} size={46} />
                </div>
              </Card>
            </Appear>
          );
        })}
      </div>
    </Stage>
  );
};

/* ───────────── Финал ───────────── */
export const Outro: React.FC<any> = () => {
  const frame = useCurrentFrame();
  const p = useAppear(0);
  const p2 = useAppear(1);
  const p3 = useAppear(2, 30);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 160}}>
      <div style={{opacity: p, transform: `scale(${0.8 + 0.2 * p})`}}>
        <HarnessRings size={280} core="🐎" />
      </div>
      <div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 110, marginTop: 30, opacity: p, letterSpacing: -2}}>
        Спасибо<span style={{color: C.coral}}>!</span>
      </div>
      <div style={{fontSize: 38, fontWeight: 600, color: C.dim, marginTop: 16, opacity: p2, maxWidth: 1300, textAlign: 'center', lineHeight: 1.4}}>
        За каждым умным помощником — не только сильная модель, но и <span style={{color: C.amber}}>хорошая упряжь</span>
      </div>
      <div style={{position: 'absolute', bottom: 190, opacity: p3, fontSize: 22, color: C.faint, fontWeight: 600, textAlign: 'center', lineHeight: 1.7}}>
        Скриншоты: Claude Code · Музыка сгенерирована кодом · Анимация: Remotion
      </div>
    </AbsoluteFill>
  );
};
