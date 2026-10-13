import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Appear, useAppear, useAt} from '../lib/scene';
import {Bubble, Card, Emoji, FlowArrow, Orb, Pill, usePulse} from '../lib/ui';
import {C, FONT, alpha} from '../theme';
import {Stage} from './intro';

/* ───────────── Текст на входе — текст на выходе ───────────── */
export const TextInOut: React.FC<any> = ({diagramAt, cannot}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const fD = at(diagramAt);
  const a1 = interpolate(frame, [fD + 10, fD + 35], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const a2 = interpolate(frame, [fD + 45, fD + 70], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dotX = interpolate((frame - fD) % 90, [0, 90], [0, 1]);
  return (
    <Stage>
      <Appear at={0} from="top">
        <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 56}}>
          Что умеет модель <span style={{color: C.cyan}}>сама по себе?</span>
        </div>
      </Appear>
      <div style={{position: 'relative', height: 300, marginTop: 40}}>
        <Appear at={diagramAt} from="left" style={{position: 'absolute', left: 80, top: 60}}>
          <Card pad={28} style={{width: 330, textAlign: 'center'}}>
            <Emoji e="📝" size={64} />
            <div style={{fontSize: 34, fontWeight: 700, marginTop: 10}}>текст</div>
            <div style={{fontSize: 22, color: C.faint, fontWeight: 600}}>на входе</div>
          </Card>
        </Appear>
        <FlowArrow d="M 440 175 L 690 175" progress={a1} color={C.cyan} w={1700} h={320} />
        <Appear at={diagramAt} delay={6} from="scale" style={{position: 'absolute', left: 720, top: 0}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <Orb e="🧠" size={230} color={C.violet} pulse={usePulse(40)} />
            <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 34, marginTop: 14, color: C.violet}}>Модель</div>
          </div>
        </Appear>
        <FlowArrow d="M 980 175 L 1230 175" progress={a2} color={C.cyan} w={1700} h={320} />
        <div style={{position: 'absolute', left: 1260, top: 60, opacity: a2, transform: `translateX(${(1 - a2) * 30}px)`}}>
          <Card pad={28} style={{width: 330, textAlign: 'center'}}>
            <Emoji e="💬" size={64} />
            <div style={{fontSize: 34, fontWeight: 700, marginTop: 10}}>текст</div>
            <div style={{fontSize: 22, color: C.faint, fontWeight: 600}}>на выходе</div>
          </Card>
        </div>
        {a2 > 0.99 ? (
          <div style={{position: 'absolute', left: 440 + dotX * 790, top: 168, width: 14, height: 14, borderRadius: 7, background: C.cyan, boxShadow: `0 0 18px ${C.cyan}`, opacity: dotX > 0.32 && dotX < 0.68 ? 0 : 1}} />
        ) : null}
      </div>
      <div style={{display: 'flex', gap: 22, marginTop: 60, justifyContent: 'center', flexWrap: 'wrap'}}>
        {cannot.map((c: any, i: number) => (
          <Appear key={i} at={c.at} delay={(i % 3) * 8} from="bottom">
            <Card pad={22} accent={C.red} style={{width: 312, textAlign: 'center'}}>
              <div style={{position: 'relative', display: 'inline-block'}}>
                <Emoji e={c.icon} size={56} />
                <svg width="76" height="76" style={{position: 'absolute', left: -10, top: -10}}>
                  <line x1="8" y1="68" x2="68" y2="8" stroke={C.red} strokeWidth="6" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{fontSize: 26, fontWeight: 700, marginTop: 12, lineHeight: 1.25}}>{c.text}</div>
            </Card>
          </Appear>
        ))}
      </div>
    </Stage>
  );
};

/* ───────────── Мудрец в комнате без окон ───────────── */
export const Sage: React.FC<any> = ({noteAt, fakeAt, harnessAt}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const fN = at(noteAt);
  const fH = at(harnessAt);
  const cycle = Math.max(0, frame - fN) % 120;
  const noteIn = interpolate(cycle, [0, 40], [0, 1], {extrapolateRight: 'clamp'});
  const noteOut = interpolate(cycle, [60, 100], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const showNote = frame > fN;
  const noteX = noteOut > 0 ? 720 - noteOut * 300 : 420 + noteIn * 300;
  const fake = useAppear(fakeAt);
  const harn = useAppear(harnessAt);
  const run = interpolate(frame, [fH + 20, fH + 70], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const back = interpolate(frame, [fH + 80, fH + 130], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      {/* комната */}
      <div style={{position: 'absolute', left: 740, top: 230, width: 620, height: 520, borderRadius: 30, background: 'linear-gradient(180deg,#1B1D2B,#12131C)', border: '3px solid rgba(255,255,255,0.15)', boxShadow: '0 40px 100px rgba(0,0,0,0.6), inset 0 0 80px rgba(0,0,0,0.6)'}}>
        <div style={{position: 'absolute', left: 30, top: 24, fontSize: 22, fontWeight: 700, color: C.faint, letterSpacing: 3}}>КОМНАТА БЕЗ ОКОН</div>
        <div style={{position: 'absolute', left: 230, top: 150}}>
          <Emoji e="🧙" size={200} />
        </div>
        <div style={{position: 'absolute', left: 300, top: 110, opacity: 0.6}}>
          <Emoji e="✨" size={50} />
        </div>
      </div>
      {/* дверь */}
      <div style={{position: 'absolute', left: 700, top: 420, width: 70, height: 330, borderRadius: 10, background: 'linear-gradient(90deg,#5A3E26,#7B5634)', border: '3px solid #A87B52'}}>
        <div style={{position: 'absolute', right: 12, top: 160, width: 14, height: 14, borderRadius: 7, background: C.amber}} />
      </div>
      {/* человек снаружи */}
      <div style={{position: 'absolute', left: 260, top: 520}}>
        <Emoji e="🙋" size={160} />
      </div>
      {/* записка под дверью */}
      {showNote ? (
        <div style={{position: 'absolute', left: noteX, top: 720, transform: `rotate(${noteOut > 0 ? -6 : 6}deg)`}}>
          <div style={{width: 110, height: 70, background: noteOut > 0 ? '#E9F6EF' : '#FFF4D6', borderRadius: 8, boxShadow: '0 8px 20px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: '#333'}}>
            {noteOut > 0 ? '!' : '?'}
          </div>
        </div>
      ) : null}
      {/* «сейчас я поищу» */}
      <div style={{position: 'absolute', left: 1390, top: 110, opacity: fake, transform: `scale(${0.8 + 0.2 * fake})`}}>
        <Bubble who="ai" style={{fontSize: 29, maxWidth: 470}}>
          «Сейчас я поищу в интернете…» <span style={{color: C.red, fontWeight: 800}}>— только слова</span>
        </Bubble>
      </div>
      {/* харнесс выполняет */}
      <div style={{position: 'absolute', left: 1430, top: 470, opacity: harn, transform: `scale(${0.8 + 0.2 * harn})`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Orb e="⚙️" size={140} color={C.coral} pulse={usePulse(30)} />
        <Pill color={C.coral} style={{marginTop: 14}}>
          харнесс выполняет
        </Pill>
      </div>
      <div style={{position: 'absolute', left: 1700, top: 300, opacity: harn}}>
        <Emoji e="🌐" size={110} />
      </div>
      {harn > 0.1 ? (
        <>
          <FlowArrow d="M 1540 500 Q 1660 420 1740 420" progress={run} color={C.coral} />
          <FlowArrow d="M 1720 440 Q 1640 600 1460 630" progress={back} color={C.green} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/* ───────────── Семь деталей ───────────── */
export const PARTS = [
  {e: '📜', t: 'Инструкции', d: 'кто ты и как себя вести', c: C.coral},
  {e: '🛠️', t: 'Инструменты', d: 'поиск, файлы, программы', c: C.amber},
  {e: '🔁', t: 'Цикл агента', d: 'подумать → сделать → проверить', c: C.cyan},
  {e: '🗂️', t: 'Контекст', d: 'рабочий стол модели', c: C.violet},
  {e: '📒', t: 'Память', d: 'заметки между разговорами', c: C.green},
  {e: '🛡️', t: 'Права и безопасность', d: 'что можно без спроса', c: C.red},
  {e: '🧩', t: 'Навыки и подключения', d: 'расширения под ваши задачи', c: C.pink},
];

export const PartsGrid: React.FC<any> = ({revealLine, mode, carAt}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const f0 = at(revealLine);
  const f1 = at(revealLine + 0.92);
  const step = (f1 - f0) / 7;
  const car = carAt !== undefined ? useAppear(carAt) : 0;
  const hl = mode === 'recap' ? Math.floor((frame - f0) / Math.max(1, step)) : -1;
  return (
    <Stage>
      <Appear at={0} from="top">
        <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 56}}>
          {mode === 'recap' ? 'Итак, семь деталей харнесса' : 'Из чего состоит харнесс'}
        </div>
      </Appear>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 44, justifyContent: 'center', opacity: 1 - car * 0.88, transform: `scale(${1 - car * 0.06})`}}>
        {PARTS.map((p, i) => {
          const fi = mode === 'recap' ? 0 : f0 + i * step;
          const ap = interpolate(frame, [fi, fi + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const glow = mode === 'recap' ? (hl === i ? 1 : 0) : interpolate(frame, [fi, fi + 10, fi + step + 10], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <div key={i} style={{width: i < 4 ? 395 : 520, opacity: mode === 'recap' ? 1 : ap, transform: `translateY(${(1 - (mode === 'recap' ? 1 : ap)) * 40}px)`}}>
              <Card accent={p.c} glow={glow} pad={26} style={{height: 250, display: 'flex', flexDirection: 'column', gap: 12}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <Orb e={p.e} size={86} color={p.c} pulse={glow} />
                  <div style={{fontFamily: FONT.display, fontSize: 54, fontWeight: 700, color: alpha(p.c, 0.35)}}>{i + 1}</div>
                </div>
                <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 32, color: C.text}}>{p.t}</div>
                <div style={{fontSize: 25, fontWeight: 600, color: C.dim}}>{p.d}</div>
              </Card>
            </div>
          );
        })}
      </div>
      {carAt !== undefined ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', justifyContent: 'center', opacity: car, transform: `scale(${0.85 + 0.15 * car})`}}>
          <Card accent={C.coral} glow={0.8} style={{display: 'flex', alignItems: 'center', gap: 50, padding: '40px 60px', background: 'linear-gradient(160deg, #22202C 0%, #15151E 100%)'}}>
            <div style={{textAlign: 'center'}}>
              <Orb e="🧠" size={150} color={C.violet} />
              <div style={{fontFamily: FONT.display, fontSize: 30, marginTop: 14, color: C.violet}}>Модель = двигатель</div>
            </div>
            <div style={{fontFamily: FONT.display, fontSize: 80, color: C.text}}>+</div>
            <div style={{textAlign: 'center'}}>
              <Emoji e="🚗" size={150} />
              <div style={{fontFamily: FONT.display, fontSize: 30, marginTop: 14, color: C.coral}}>Харнесс = весь автомобиль</div>
            </div>
          </Card>
        </div>
      ) : null}
    </Stage>
  );
};
