import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Appear, useAppear, useAt} from '../lib/scene';
import {Bubble, Card, Check, Emoji, FlowArrow, Orb, Pill, Spinner, Typewriter, usePulse} from '../lib/ui';
import {C, FONT, alpha} from '../theme';
import {Stage} from './intro';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

/* ───────────── Один двигатель — разные машины ───────────── */
export const SameEngine: React.FC<any> = ({carsAt, aiAt, oneBrainAt, blameAt, cars, apps}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const one = useAppear(oneBrainAt);
  const blame = useAppear(blameAt);
  const Row: React.FC<{core: React.ReactNode; items: any[]; when: number; color: string; top: number}> = ({core, items, when, color, top}) => {
    const f0 = at(when);
    return (
      <div style={{position: 'absolute', left: 110, right: 110, top, height: 300}}>
        <div style={{position: 'absolute', left: 0, top: 30}}>{core}</div>
        {items.map((it, i) => {
          const fi = f0 + 10 + i * 18;
          const p = interpolate(frame, [fi, fi + 14], [0, 1], clamp);
          const x = 520 + i * 420;
          return (
            <React.Fragment key={i}>
              <svg width={1700} height={300} style={{position: 'absolute', left: 0, top: 0}}>
                <path d={`M 250 120 C 350 120, ${x - 120} ${60 + i * 60}, ${x - 10} 120`} fill="none" stroke={alpha(color, 0.6)} strokeWidth="3" strokeDasharray="8 10" strokeDashoffset={-frame * 1.5} opacity={p} />
              </svg>
              <div style={{position: 'absolute', left: x, top: 20, width: 380, opacity: p, transform: `translateY(${(1 - p) * 30}px)`}}>
                <Card accent={color} glow={0.35} pad={22} style={{display: 'flex', alignItems: 'center', gap: 18}}>
                  <Emoji e={it.icon} size={70} />
                  <div>
                    <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 28}}>{it.text}</div>
                    <div style={{fontSize: 22, color: C.dim, fontWeight: 600, marginTop: 4}}>{it.sub}</div>
                  </div>
                </Card>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };
  const carsP = useAppear(carsAt);
  const aiP = useAppear(aiAt);
  return (
    <AbsoluteFill>
      <div style={{opacity: carsP}}>
        <Row
          when={carsAt}
          color={C.amber}
          top={150}
          items={cars}
          core={
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: 250}}>
              <Orb e="⚙️" size={150} color={C.amber} pulse={usePulse(30)} />
              <div style={{fontFamily: FONT.display, fontSize: 26, marginTop: 10, color: C.amber}}>один двигатель</div>
            </div>
          }
        />
      </div>
      <div style={{opacity: aiP}}>
        <Row
          when={aiAt}
          color={C.green}
          top={470}
          items={apps}
          core={
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: 250}}>
              <Orb e="🧠" size={150} color={C.violet} pulse={usePulse(30, 15)} />
              <div style={{fontFamily: FONT.display, fontSize: 26, marginTop: 10, color: C.violet}}>одна модель</div>
            </div>
          }
        />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 790, display: 'flex', justifyContent: 'center', gap: 30}}>
        <div style={{opacity: one * (1 - blame), transform: `scale(${0.9 + 0.1 * one})`, position: 'absolute'}}>
          <Pill color={C.green} style={{fontSize: 34, padding: '14px 34px'}}>
            🧠 Мозг один — возможности разные
          </Pill>
        </div>
        <div style={{opacity: blame, transform: `scale(${0.9 + 0.1 * blame})`, position: 'absolute', display: 'flex', alignItems: 'center', gap: 24}}>
          <Bubble who="user" color={C.red} style={{fontSize: 28}}>
            «Этот ИИ плохой, он даже искать не умеет!»
          </Bubble>
          <div style={{fontSize: 40}}>→</div>
          <Pill color={C.coral} style={{fontSize: 30, padding: '14px 28px'}}>
            🔧 часто дело в харнессе
          </Pill>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── Хорошая упряжь важнее ───────────── */
export const Bars: React.FC<any> = ({barsAt, quoteAt, fieldAt, bars, note}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const f0 = at(barsAt);
  const q = useAppear(quoteAt);
  const fld = useAppear(fieldAt);
  return (
    <Stage>
      <div style={{display: 'flex', gap: 80, alignItems: 'flex-end', height: 560}}>
        <div style={{position: 'relative', width: 760, height: 520, borderLeft: '2px solid rgba(255,255,255,0.18)', borderBottom: '2px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'flex-end', gap: 90, padding: '0 70px'}}>
          <div style={{position: 'absolute', left: 20, top: -10, fontSize: 22, fontWeight: 700, color: C.faint, letterSpacing: 2}}>РЕЗУЛЬТАТ НА СЛОЖНЫХ ЗАДАЧАХ</div>
          {bars.map((b: any, i: number) => {
            const p = interpolate(frame, [f0 + 10 + i * 25, f0 + 50 + i * 25], [0, 1], {...clamp});
            const col = i ? C.green : '#7D8296';
            return (
              <div key={i} style={{width: 230, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <div style={{fontFamily: FONT.display, fontSize: 30, color: col, opacity: p, marginBottom: 10}}>{i ? '▲' : ''}</div>
                <div style={{width: 200, height: 420 * b.value * p, borderRadius: '18px 18px 4px 4px', background: `linear-gradient(180deg, ${col}, ${alpha(col, 0.35)})`, boxShadow: i ? `0 0 40px ${alpha(col, 0.4)}` : 'none'}} />
                <div style={{position: 'absolute', bottom: -96, width: 260, textAlign: 'center', fontSize: 23, fontWeight: 700, color: i ? C.text : C.dim, whiteSpace: 'pre-line', marginLeft: 0}}>{b.label}</div>
              </div>
            );
          })}
          <div style={{position: 'absolute', right: 0, bottom: -150, fontSize: 19, color: C.faint, fontStyle: 'italic'}}>{note}</div>
        </div>
        <div style={{flex: 1, paddingBottom: 60}}>
          <div style={{opacity: q, transform: `translateY(${(1 - q) * 30}px)`}}>
            <Emoji e="🐎" size={90} />
            <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 46, lineHeight: 1.3, marginTop: 20}}>
              «Хорошая упряжь иногда важнее, чем <span style={{color: C.green}}>более сильная лошадь</span>»
            </div>
          </div>
          <div style={{marginTop: 40, opacity: fld, transform: `translateY(${(1 - fld) * 20}px)`}}>
            <Pill color={C.amber} style={{fontSize: 28, padding: '14px 26px'}}>
              ⚙️ Harness engineering — инженерия харнессов
            </Pill>
          </div>
        </div>
      </div>
    </Stage>
  );
};

/* ───────────── Пример 1: поездка ───────────── */
export const TripCompare: React.FC<any> = ({title, request, requestAt, leftAt, rightAt, leftReply, steps, rows, tableAt, sameAt, note}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const tbl = useAppear(tableAt, 10);
  const same = useAppear(sameAt);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 110, top: 110}}>
        <Pill color={C.green} style={{fontSize: 24}}>
          🧪 {title}
        </Pill>
      </div>
      <Appear at={requestAt} from="top" style={{position: 'absolute', left: 110, right: 110, top: 180}}>
        <div style={{display: 'flex', gap: 16, alignItems: 'center'}}>
          <Emoji e="🙋" size={56} />
          <Bubble who="user" color={C.green} style={{fontSize: 27, padding: '16px 24px'}}>
            {request}
          </Bubble>
        </div>
      </Appear>
      <Appear at={leftAt} from="left" style={{position: 'absolute', left: 110, top: 300, width: 560}}>
        <Card accent="#9AA0B5" style={{height: 560}}>
          <div style={{fontFamily: FONT.display, fontSize: 27, fontWeight: 600, color: '#B5BACB'}}>💬 Модель без инструментов</div>
          <div style={{marginTop: 24}}>
            <Bubble who="ai" style={{fontSize: 25}}>
              <Typewriter text={leftReply} at={leftAt} cps={40} />
            </Bubble>
          </div>
          <div style={{position: 'absolute', bottom: 28, left: 32, right: 32, fontSize: 23, color: C.faint, fontWeight: 700}}>Полезно, но работу делать вам</div>
        </Card>
      </Appear>
      <Appear at={rightAt} from="right" style={{position: 'absolute', left: 710, right: 110, top: 300}}>
        <Card accent={C.green} glow={0.5} style={{height: 560}}>
          <div style={{fontFamily: FONT.display, fontSize: 27, fontWeight: 600, color: C.green}}>🤖 Та же модель + харнесс</div>
          <div style={{marginTop: 14, display: 'flex', flexDirection: 'column', gap: 2}}>
            {steps.map((s: any, i: number) => {
              const f0 = at(s.at) + (i > 0 && steps[i - 1].at === s.at ? 30 : 0);
              const vis = interpolate(frame, [f0, f0 + 10], [0, 1], clamp);
              const done = interpolate(frame, [f0 + 30, f0 + 42], [0, 1], clamp);
              const col = s.warn ? C.amber : C.green;
              return (
                <div key={i} style={{display: 'flex', alignItems: 'center', gap: 14, opacity: vis, transform: `translateX(${(1 - vis) * 20}px)`, fontSize: 24, fontWeight: 600, padding: '6px 14px', borderRadius: 14, background: s.warn ? alpha(C.amber, 0.12) : 'transparent'}}>
                  <div style={{width: 34}}>{done > 0 ? <Check p={done} color={col} size={32} /> : <Spinner size={28} color={col} />}</div>
                  <Emoji e={s.icon} size={28} />
                  <span style={{color: s.warn ? C.amber : C.text}}>{s.text}</span>
                </div>
              );
            })}
          </div>
          <div style={{marginTop: 14, opacity: tbl, transform: `translateY(${(1 - tbl) * 20}px)`}}>
            <div style={{display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 0.8fr', padding: '6px 16px', fontSize: 19, fontWeight: 800, color: C.faint, letterSpacing: 1}}>
              <span>ОТЕЛЬ</span>
              <span>ЦЕНА/НОЧЬ</span>
              <span>ДО ЦЕНТРА</span>
              <span>ОЦЕНКА</span>
            </div>
            {rows.map((r: string[], i: number) => (
              <div key={i} style={{display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 0.8fr', padding: '7px 16px', fontSize: 22, fontWeight: 600, background: i % 2 ? 'transparent' : 'rgba(255,255,255,0.05)', borderRadius: 10}}>
                <span>{r[0]}</span>
                <span style={{color: C.amber}}>{r[1]}</span>
                <span style={{color: C.dim}}>{r[2]}</span>
                <span style={{color: C.green}}>{r[3]}</span>
              </div>
            ))}
          </div>
        </Card>
      </Appear>
      <div style={{position: 'absolute', right: 120, top: 866, fontSize: 18, color: C.faint, fontStyle: 'italic', opacity: tbl}}>{note}</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 270, display: 'flex', justifyContent: 'center', opacity: same, pointerEvents: 'none'}}>
        <div style={{transform: `translateX(-245px) scale(${0.8 + 0.2 * same})`}}>
          <Orb e="🧠" size={90} color={C.violet} pulse={usePulse(30)} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── Пример 2: чеки ───────────── */
export const Receipts: React.FC<any> = ({title, folderAt, requestAt, scanAt, blurAt, tableAt, timeAt, request, cats, total, unreadable, file}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const fS = at(scanAt);
  const fB = at(blurAt);
  const req = useAppear(requestAt);
  const tbl = useAppear(tableAt);
  const tm = useAppear(timeAt);
  const scan = interpolate(frame, [fS, fS + 150], [0, 1], clamp);
  const catColors = [C.green, C.cyan, C.amber, C.pink, C.violet];
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 110, top: 110}}>
        <Pill color={C.green} style={{fontSize: 24}}>
          🧪 {title}
        </Pill>
      </div>
      {/* папка с чеками */}
      <Appear at={folderAt} from="left" style={{position: 'absolute', left: 110, top: 190, width: 820}}>
        <Card pad={24} style={{height: 600}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 26, fontWeight: 700, color: C.dim}}>
            <Emoji e="📂" size={36} /> Чеки_октябрь · 30 фото
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginTop: 20}}>
            {Array.from({length: 30}).map((_, i) => {
              const done = scan * 30 > i;
              const blurred = i === 11 || i === 23;
              const cat = (i * 7) % 5;
              const showBlur = frame > fB && blurred;
              const amount = 120 + ((i * 397) % 2400);
              return (
                <div
                  key={i}
                  style={{
                    height: 76,
                    borderRadius: 8,
                    background: '#F4F0E8',
                    color: '#2A2620',
                    padding: '7px 9px',
                    transform: `rotate(${((i * 13) % 7) - 3}deg)`,
                    boxShadow: done ? `0 0 0 3px ${blurred ? C.red : catColors[cat]}` : '0 6px 14px rgba(0,0,0,0.4)',
                    position: 'relative',
                    filter: blurred && done ? 'blur(1.5px)' : undefined,
                  }}
                >
                  <div style={{fontSize: 12, fontWeight: 800, opacity: 0.6}}>ЧЕК №{1040 + i}</div>
                  <div style={{height: 5, background: 'rgba(0,0,0,0.12)', borderRadius: 3, marginTop: 6, width: '80%'}} />
                  <div style={{height: 5, background: 'rgba(0,0,0,0.12)', borderRadius: 3, marginTop: 5, width: '60%'}} />
                  <div style={{fontSize: 15, fontWeight: 800, marginTop: 6}}>{amount} ₽</div>
                  {showBlur ? (
                    <div style={{position: 'absolute', right: -10, top: -12, fontSize: 26}}>
                      <Emoji e="❓" size={26} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {scan > 0 && scan < 1 ? (
            <div style={{position: 'absolute', left: 24, right: 24, top: 80 + scan * 480, height: 4, background: C.green, boxShadow: `0 0 24px ${C.green}`, borderRadius: 2}} />
          ) : null}
          <div style={{position: 'absolute', left: 24, bottom: 20, opacity: interpolate(frame, [fB, fB + 15], [0, 1], clamp)}}>
            <Pill color={C.red} style={{fontSize: 22}}>
              ❓ {unreadable} — честно, без выдумок
            </Pill>
          </div>
        </Card>
      </Appear>
      {/* запрос */}
      <div style={{position: 'absolute', left: 990, top: 190, width: 820, opacity: req, transform: `translateY(${(1 - req) * 20}px)`}}>
        <Bubble who="user" color={C.green} style={{fontSize: 26}}>
          {request}
        </Bubble>
      </div>
      {/* итоговая таблица */}
      <div style={{position: 'absolute', left: 990, top: 360, width: 820, opacity: tbl, transform: `translateY(${(1 - tbl) * 30}px)`}}>
        <Card accent={C.green} glow={0.5} pad={24}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT.mono, fontSize: 24, color: C.green, fontWeight: 700}}>
            <Emoji e="📊" size={32} /> {file}
          </div>
          <div style={{marginTop: 14}}>
            {cats.map((c: string[], i: number) => (
              <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', fontSize: 26, fontWeight: 600, borderRadius: 10, background: i % 2 ? 'transparent' : 'rgba(255,255,255,0.05)'}}>
                <span>{c[0]}</span>
                <span style={{display: 'flex', alignItems: 'center', gap: 14}}>
                  <span style={{display: 'inline-block', height: 10, width: (parseInt(c[1].replace(/\D/g, '')) / 18450) * 200 * tbl, borderRadius: 5, background: catColors[i]}} />
                  <span style={{color: C.amber, minWidth: 130, textAlign: 'right'}}>{c[1]}</span>
                </span>
              </div>
            ))}
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '12px 14px 0', fontSize: 28, fontWeight: 800, borderTop: '1px solid rgba(255,255,255,0.15)', marginTop: 8}}>
              <span>Итого</span>
              <span style={{color: C.green}}>{total}</span>
            </div>
          </div>
        </Card>
      </div>
      <div style={{position: 'absolute', left: 990, top: 790, opacity: tm, transform: `scale(${0.9 + 0.1 * tm})`, transformOrigin: 'left center'}}>
        <Pill color={C.amber} style={{fontSize: 28, padding: '12px 26px'}}>
          ⏱️ вечер работы → 5 минут проверки
        </Pill>
      </div>
    </AbsoluteFill>
  );
};
