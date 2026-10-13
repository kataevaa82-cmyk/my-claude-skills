import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Appear, useAppear, useAt, useScene} from '../lib/scene';
import {Card, Emoji, Orb, Pill, Window, usePulse} from '../lib/ui';
import {C, FONT, alpha} from '../theme';
import {Stage} from './intro';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

/* ───────────── Четыре правила ───────────── */
export const SafetyRules: React.FC<any> = ({rules}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  let active = -1;
  rules.forEach((r: any, i: number) => {
    if (frame >= at(r.at)) active = i;
  });
  const cols = [C.amber, C.cyan, C.red, C.green];
  return (
    <Stage>
      <Appear at={0} from="top">
        <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
          <Orb e="🛡️" size={100} color={C.red} pulse={usePulse(40)} />
          <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 54}}>Четыре простых правила</div>
        </div>
      </Appear>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginTop: 40}}>
        {rules.map((r: any, i: number) => (
          <Appear key={i} at={r.at} from="bottom">
            <Card accent={cols[i]} glow={i === active ? 1 : 0.15} style={{height: 230, display: 'flex', gap: 26, alignItems: 'center'}}>
              <div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 110, color: alpha(cols[i], 0.3), width: 90, textAlign: 'center'}}>{i + 1}</div>
              <div>
                <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                  <Emoji e={r.icon} size={46} />
                  <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 34, color: cols[i]}}>{r.title}</div>
                </div>
                <div style={{fontSize: 28, fontWeight: 600, color: C.dim, marginTop: 14, lineHeight: 1.35}}>{r.text}</div>
              </div>
            </Card>
          </Appear>
        ))}
      </div>
    </Stage>
  );
};

/* ───────────── Промпт-инъекция ───────────── */
export const Injection: React.FC<any> = ({pageAt, xrayAt, nameAt, defenseAt, ruleAt, hidden}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const fX = at(xrayAt);
  const lens = interpolate(frame, [fX, fX + 70], [0, 1], clamp);
  const lensX = 150 + lens * 700;
  const reveal = interpolate(frame, [fX + 30, fX + 55], [0, 1], clamp);
  const name = useAppear(nameAt);
  const def = useAppear(defenseAt);
  const rule = useAppear(ruleAt);
  const shift = rule;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 110, top: 150, opacity: 1 - shift * 0.97, transform: `scale(${1 - shift * 0.1})`, transformOrigin: 'left top'}}>
        <Appear at={pageAt} from="bottom">
          <Window title="" style={{width: 1000, height: 620}} dark={false} bar={<div style={{marginLeft: 30, flex: 1, height: 32, borderRadius: 9, background: 'rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', padding: '0 14px', fontFamily: FONT.body, fontSize: 18, color: 'rgba(0,0,0,0.55)'}}>🔒 otzyvy-kazan.example/oteli</div>}>
            <div style={{padding: '28px 34px', color: '#2A2620', fontFamily: FONT.body}}>
              <div style={{fontFamily: FONT.display, fontSize: 34, fontWeight: 700}}>Отзывы об отелях Казани</div>
              {[
                ['Отель «Волжский»', '★★★★★', 'Чисто, тихо, до Кремля пешком 10 минут.'],
                ['Апарт «Кремлёвский»', '★★★★☆', 'Вид из окна шикарный, завтрак так себе.'],
              ].map((r, i) => (
                <div key={i} style={{marginTop: 20, padding: 18, borderRadius: 14, background: '#F1EBE1'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 24}}>
                    <span>{r[0]}</span>
                    <span style={{color: '#D98A2B'}}>{r[1]}</span>
                  </div>
                  <div style={{fontSize: 22, marginTop: 6, opacity: 0.8}}>{r[2]}</div>
                </div>
              ))}
              {/* спрятанный текст */}
              <div style={{position: 'relative', marginTop: 26, fontSize: 21, fontWeight: 700}}>
                <span style={{color: reveal > 0 ? C.red : '#F7F3EC', opacity: 0.25 + 0.75 * reveal, background: reveal ? alpha(C.red, 0.12 * reveal) : 'transparent', padding: '4px 8px', borderRadius: 8}}>{hidden}</span>
              </div>
            </div>
          </Window>
        </Appear>
        {/* «рентген» */}
        {lens > 0 && lens < 1 ? (
          <div style={{position: 'absolute', left: lensX, top: 360, width: 200, height: 200, borderRadius: '50%', border: `5px solid ${C.cyan}`, boxShadow: `0 0 40px ${alpha(C.cyan, 0.6)}, inset 0 0 40px ${alpha(C.cyan, 0.3)}`}} />
        ) : null}
      </div>
      <div style={{position: 'absolute', left: 1180, top: 190, width: 640, opacity: name * (1 - shift), transform: `translateX(${(1 - name) * 30}px)`}}>
        <Pill color={C.red} style={{fontSize: 30, padding: '12px 26px'}}>
          🪤 Промпт-инъекция
        </Pill>
        <div style={{fontSize: 29, fontWeight: 600, color: C.dim, marginTop: 20, lineHeight: 1.4}}>Человек этот текст не замечает, а модель читает всё подряд.</div>
      </div>
      <div style={{position: 'absolute', left: 1180, top: 450, width: 640, opacity: def * (1 - shift), transform: `translateY(${(1 - def) * 30}px)`}}>
        <Card accent={C.green} glow={0.4} pad={24} style={{display: 'flex', gap: 20, alignItems: 'center'}}>
          <Emoji e="🛡️" size={64} />
          <div>
            <div style={{fontSize: 28, fontWeight: 700}}>Распознать и проигнорировать</div>
            <div style={{fontSize: 23, color: C.amber, fontWeight: 700, marginTop: 6}}>но 100% защиты пока нет</div>
          </div>
        </Card>
      </div>
      {/* правило «двух дверей» */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 260, display: 'flex', justifyContent: 'center', opacity: rule, transform: `scale(${0.9 + 0.1 * rule})`}}>
        <Card accent={C.red} glow={0.6} style={{width: 1300, padding: '40px 50px', background: 'linear-gradient(160deg, #20212F 0%, #14151E 100%)'}}>
          <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 40, textAlign: 'center'}}>Не открывайте одному агенту обе двери сразу</div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginTop: 40}}>
            <div style={{textAlign: 'center'}}>
              <Orb e="🌐" size={130} color={C.amber} style={{margin: '0 auto'}} />
              <div style={{fontSize: 27, fontWeight: 700, marginTop: 14}}>чужие сайты и письма</div>
            </div>
            <div style={{position: 'relative', width: 260, textAlign: 'center'}}>
              <Orb e="🤖" size={120} color={C.cyan} style={{margin: '0 auto'}} />
              <svg width="260" height="120" style={{position: 'absolute', left: 0, top: 0}}>
                <line x1="30" y1="20" x2="230" y2="100" stroke={C.red} strokeWidth="10" strokeLinecap="round" />
                <line x1="230" y1="20" x2="30" y2="100" stroke={C.red} strokeWidth="10" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{textAlign: 'center'}}>
              <Orb e="📤" size={130} color={C.red} style={{margin: '0 auto'}} />
              <div style={{fontSize: 27, fontWeight: 700, marginTop: 14}}>отправка ваших данных</div>
            </div>
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── Мифы ───────────── */
export const Myths: React.FC<any> = ({myths}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  return (
    <Stage>
      <Appear at={0} from="top">
        <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 54}}>
          Три <span style={{color: C.pink}}>заблуждения</span>
        </div>
      </Appear>
      <div style={{display: 'flex', gap: 30, marginTop: 44}}>
        {myths.map((m: any, i: number) => {
          const f0 = at(m.at);
          const f1 = at(m.at + 0.35);
          const show = interpolate(frame, [f0, f0 + 16], [0, 1], clamp);
          const flip = interpolate(frame, [f1, f1 + 20], [0, 1], clamp);
          return (
            <div key={i} style={{flex: 1, opacity: show, transform: `translateY(${(1 - show) * 40}px)`, perspective: 1200}}>
              <div style={{position: 'relative', height: 520, transformStyle: 'preserve-3d', transform: `rotateY(${flip * 180}deg)`}}>
                <Card accent={C.red} glow={0.3} style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
                  <div style={{fontFamily: FONT.display, fontWeight: 800, fontSize: 30, color: C.red, border: `4px solid ${C.red}`, padding: '6px 22px', borderRadius: 12, transform: 'rotate(-6deg)'}}>МИФ №{i + 1}</div>
                  <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 36, marginTop: 40, lineHeight: 1.3}}>«{m.myth}»</div>
                </Card>
                <Card accent={C.green} glow={0.6} style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
                  <div style={{fontFamily: FONT.display, fontWeight: 800, fontSize: 26, color: C.green, border: `4px solid ${C.green}`, padding: '6px 22px', borderRadius: 12}}>НА САМОМ ДЕЛЕ</div>
                  <div style={{fontSize: 34, fontWeight: 700, marginTop: 36, lineHeight: 1.35}}>{m.fact}</div>
                </Card>
              </div>
            </div>
          );
        })}
      </div>
    </Stage>
  );
};

/* ───────────── Мини-тест ───────────── */
export const Quiz: React.FC<any> = ({questions}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const scene = useScene();
  let qi = -1;
  questions.forEach((q: any, i: number) => {
    if (frame >= at(q.qAt) - 6) qi = i;
  });
  return (
    <Stage style={{alignItems: 'center'}}>
      <Appear at={0} from="top">
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          <Emoji e="🤔" size={70} />
          <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 54}}>Мини-тест</div>
          <div style={{display: 'flex', gap: 12, marginLeft: 30}}>
            {questions.map((_: any, i: number) => (
              <div key={i} style={{width: 18, height: 18, borderRadius: 9, background: i <= qi ? C.pink : 'rgba(255,255,255,0.15)', boxShadow: i === qi ? `0 0 14px ${C.pink}` : 'none'}} />
            ))}
          </div>
        </div>
      </Appear>
      {qi < 0 ? (
        <Appear at={0} delay={10} style={{marginTop: 120}}>
          <div style={{fontSize: 40, fontWeight: 700, color: C.dim, textAlign: 'center'}}>Попробуйте ответить сами 👇</div>
        </Appear>
      ) : null}
      {questions.map((q: any, i: number) => {
        if (i !== qi) return null;
        const fQ = at(q.qAt);
        const ans = scene.lines[q.aAt];
        const fPause = ans.start - Math.round(ans.pause * 30);
        const fA = ans.start;
        const show = interpolate(frame, [fQ - 6, fQ + 12], [0, 1], clamp);
        const reveal = interpolate(frame, [fA - 4, fA + 10], [0, 1], clamp);
        const tPause = interpolate(frame, [fPause, fA], [0, 1], clamp);
        const thinking = frame >= fPause && frame < fA;
        return (
          <div key={i} style={{width: 1400, marginTop: 50, opacity: show, transform: `translateY(${(1 - show) * 30}px)`}}>
            <Card accent={C.pink} glow={0.3} style={{padding: '40px 50px'}}>
              <div style={{fontSize: 24, fontWeight: 800, color: C.pink, letterSpacing: 3}}>ВОПРОС {i + 1}</div>
              <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 40, lineHeight: 1.3, marginTop: 14}}>{q.q}</div>
              <div style={{display: 'flex', gap: 30, marginTop: 40}}>
                {q.options.map((o: string, k: number) => {
                  const right = k === q.answer;
                  const col = right ? C.green : C.red;
                  return (
                    <div
                      key={k}
                      style={{
                        flex: 1,
                        padding: '24px 30px',
                        borderRadius: 20,
                        fontSize: 32,
                        fontWeight: 700,
                        border: `3px solid ${reveal ? alpha(col, 0.3 + 0.7 * reveal) : 'rgba(255,255,255,0.15)'}`,
                        background: reveal && right ? alpha(C.green, 0.15 * reveal) : 'rgba(255,255,255,0.04)',
                        opacity: reveal && !right ? 1 - 0.5 * reveal : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        boxShadow: reveal && right ? `0 0 40px ${alpha(C.green, 0.35 * reveal)}` : 'none',
                      }}
                    >
                      <span style={{fontFamily: FONT.display, color: C.faint}}>{String.fromCharCode(65 + k)}</span>
                      {o}
                      {reveal > 0.5 ? <span style={{marginLeft: 'auto'}}>{right ? '✅' : '❌'}</span> : null}
                    </div>
                  );
                })}
              </div>
            </Card>
            {thinking ? (
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 34}}>
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke={C.pink} strokeWidth="8" pathLength={1} strokeDasharray={`${1 - tPause} 1`} transform="rotate(-90 40 40)" strokeLinecap="round" />
                </svg>
                <div style={{fontSize: 32, fontWeight: 700, color: C.dim}}>Подумайте…</div>
              </div>
            ) : null}
          </div>
        );
      })}
    </Stage>
  );
};
