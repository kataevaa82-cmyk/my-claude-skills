import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Appear, useAppear, useAt} from '../lib/scene';
import {Bubble, Card, Check, DetailHeader, Emoji, FlowArrow, Orb, Pill, Typewriter, usePulse, Window} from '../lib/ui';
import {C, FONT, alpha} from '../theme';
import {Stage} from './intro';
import {PARTS} from './model';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

/* ───────────── 1. Инструкции ───────────── */
export const SystemPrompt: React.FC<any> = ({num, title, letterAt, textAt, text, personas, personasAt}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const open = interpolate(frame, [at(letterAt), at(letterAt) + 25], [0, 1], clamp);
  const pp = useAppear(personasAt);
  return (
    <Stage>
      <DetailHeader num={num} title={title} color={PARTS[0].c} />
      <div style={{display: 'flex', gap: 60, marginTop: 40, alignItems: 'flex-start'}}>
        <div style={{position: 'relative', width: 930, transform: `translateX(${pp * -10}px)`}}>
          <Appear at={letterAt} from="bottom">
            <div style={{position: 'relative'}}>
              <Card accent={C.coral} glow={0.4} style={{background: 'linear-gradient(170deg, #2A2320, #1A1614)', padding: '34px 40px', minHeight: 430}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20}}>
                  <Emoji e="✉️" size={40} />
                  <div style={{fontFamily: FONT.body, fontWeight: 800, fontSize: 24, letterSpacing: 3, color: C.coral}}>СКРЫТОЕ ПИСЬМО ДЛЯ МОДЕЛИ</div>
                  <Pill color={C.faint} style={{marginLeft: 'auto', fontSize: 18, padding: '6px 14px'}}>
                    👁 вы его не видите
                  </Pill>
                </div>
                <div style={{fontFamily: FONT.mono, fontSize: 29, lineHeight: 1.65, color: '#F3E6D6'}}>
                  {text.map((t: string, i: number) => {
                    const f0 = at(textAt) + i * 26;
                    return (
                      <div key={i} style={{opacity: interpolate(frame, [f0 - 2, f0 + 2], [0, 1], clamp)}}>
                        <span style={{color: alpha(C.coral, 0.7)}}>› </span>
                        <Typewriter text={t} at={textAt} cps={60} caret={false} style={{}} />
                      </div>
                    );
                  })}
                </div>
              </Card>
              <div style={{position: 'absolute', inset: 0, borderRadius: 28, background: '#1A1614', opacity: 1 - open, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Emoji e="✉️" size={160} />
              </div>
            </div>
          </Appear>
        </div>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 26, opacity: pp, transform: `translateX(${(1 - pp) * 40}px)`}}>
          <div style={{fontSize: 26, fontWeight: 700, color: C.dim}}>Разные инструкции — разный характер:</div>
          {personas.map((p: any, i: number) => (
            <Card key={i} accent={i ? C.violet : C.amber} glow={0.3} pad={26}>
              <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONT.display, fontWeight: 600, fontSize: 28, color: i ? C.violet : C.amber}}>
                <Emoji e={p.icon} size={36} />
                {p.text}
              </div>
              <div style={{marginTop: 12, fontSize: 23, color: C.dim, lineHeight: 1.45}}>
                {i === 0 ? '«Зонт брать. Дождь 80%.»' : '«Завтра в Казани около +12°. Вероятность дождя — 80%, поэтому зонт лучше взять. А ещё пригодится…»'}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Stage>
  );
};

/* ───────────── 2. Инструменты ───────────── */
export const Tools: React.FC<any> = ({num, title, chipsAt, flowAt, resultAt, chips, call, result}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const f0 = at(chipsAt);
  const f1 = at(chipsAt + 0.9);
  const fF = at(flowAt);
  const fR = at(resultAt);
  const flow = useAppear(flowAt);
  const a1 = interpolate(frame, [fF + 25, fF + 55], [0, 1], clamp);
  const a2 = interpolate(frame, [fR, fR + 30], [0, 1], clamp);
  const res = useAppear(resultAt, 20);
  return (
    <Stage>
      <DetailHeader num={num} title={title} color={PARTS[1].c} />
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 18, marginTop: 34}}>
        {chips.map((c: any, i: number) => {
          const fi = f0 + ((f1 - f0) / chips.length) * i;
          const p = interpolate(frame, [fi, fi + 12], [0, 1], clamp);
          const glow = interpolate(frame, [fi, fi + 8, fi + 40], [0, 1, 0.15], clamp);
          return (
            <div key={i} style={{opacity: p, transform: `translateY(${(1 - p) * 30}px)`}}>
              <Card accent={C.amber} glow={glow} pad={20} style={{textAlign: 'center', height: 170}}>
                <Emoji e={c.icon} size={52} />
                <div style={{fontSize: 24, fontWeight: 700, marginTop: 12, lineHeight: 1.2}}>{c.text}</div>
              </Card>
            </div>
          );
        })}
      </div>
      {/* заявка модели → харнесс → результат */}
      <div style={{position: 'relative', height: 330, marginTop: 40, opacity: flow}}>
        <div style={{position: 'absolute', left: 0, top: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', width: 200}}>
          <Orb e="🧠" size={130} color={C.violet} />
          <div style={{fontFamily: FONT.display, fontSize: 26, marginTop: 10, color: C.violet}}>Модель</div>
        </div>
        <div style={{position: 'absolute', left: 240, top: 20, opacity: interpolate(frame, [fF + 5, fF + 20], [0, 1], clamp)}}>
          <div style={{fontSize: 22, fontWeight: 700, color: C.faint, marginBottom: 8, letterSpacing: 2}}>ЗАЯВКА</div>
          <div style={{fontFamily: FONT.mono, fontSize: 30, padding: '16px 22px', borderRadius: 16, background: '#1B1B22', border: `1.5px solid ${alpha(C.amber, 0.5)}`, color: C.amber}}>
            <Typewriter text={call} at={flowAt} cps={30} />
          </div>
        </div>
        <FlowArrow d="M 800 140 L 960 140" progress={a1} color={C.amber} w={1700} h={330} />
        <div style={{position: 'absolute', left: 990, top: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', width: 200, opacity: a1}}>
          <Orb e="⚙️" size={130} color={C.coral} pulse={usePulse(24)} />
          <div style={{fontFamily: FONT.display, fontSize: 26, marginTop: 10, color: C.coral}}>Харнесс</div>
        </div>
        <FlowArrow d="M 1210 140 L 1330 140" progress={a2} color={C.green} w={1700} h={330} />
        <div style={{position: 'absolute', left: 1350, top: 10, opacity: res, transform: `translateY(${(1 - res) * 20}px)`}}>
          <Card accent={C.green} glow={0.5} pad={22} style={{width: 350}}>
            <div style={{fontSize: 21, fontWeight: 800, color: C.green, letterSpacing: 2, marginBottom: 8}}>РЕЗУЛЬТАТ ПОИСКА</div>
            {result.map((r: string, i: number) => (
              <div key={i} style={{fontSize: 21, fontWeight: 600, padding: '5px 0', borderTop: i ? '1px solid rgba(255,255,255,0.08)' : 'none'}}>
                {r}
              </div>
            ))}
          </Card>
        </div>
        <FlowArrow d="M 1500 250 Q 900 380 120 240" progress={interpolate(frame, [fR + 40, fR + 80], [0, 1], clamp)} color={alpha(C.green, 0.8)} dashed w={1700} h={330} />
      </div>
    </Stage>
  );
};

/* ───────────── 3. Цикл агента ───────────── */
export const AgentLoop: React.FC<any> = ({num, title, stepAt, spinAt, fixAt, compareAt}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const cx = 470;
  const cy = 560;
  const R = 205;
  const nodes = [
    {e: '🧠', t: 'Подумать', a: -90, c: C.violet},
    {e: '🛠️', t: 'Сделать', a: 30, c: C.amber},
    {e: '👀', t: 'Проверить', a: 150, c: C.cyan},
  ];
  const fS = at(spinAt);
  const spinning = frame > fS;
  const ang = spinning ? -90 + ((frame - fS) * 2.6) % 360 : -90;
  const ring = interpolate(frame, [at(stepAt[0]), at(stepAt[2]) + 20], [0, 1], clamp);
  const fix = useAppear(fixAt);
  const cmp = useAppear(compareAt);
  return (
    <Stage>
      <DetailHeader num={num} title={title} color={PARTS[2].c} />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="26" />
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke={C.cyan}
          strokeWidth="6"
          pathLength={1}
          strokeDasharray={`${ring} 1`}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{filter: `drop-shadow(0 0 10px ${alpha(C.cyan, 0.7)})`}}
        />
        {spinning ? (
          <circle cx={cx + R * Math.cos((ang * Math.PI) / 180)} cy={cy + R * Math.sin((ang * Math.PI) / 180)} r="16" fill="#fff" style={{filter: `drop-shadow(0 0 16px ${C.cyan})`}} />
        ) : null}
      </svg>
      {nodes.map((n, i) => {
        const p = useAppear(stepAt[i]);
        const x = cx + R * Math.cos((n.a * Math.PI) / 180);
        const y = cy + R * Math.sin((n.a * Math.PI) / 180);
        const d = spinning ? Math.abs(((ang - n.a + 540) % 360) - 180) : 180;
        const lit = spinning ? interpolate(d, [0, 40], [1, 0], clamp) : interpolate(frame, [at(stepAt[i]), at(stepAt[i]) + 10], [0, 1], clamp);
        return (
          <div key={i} style={{position: 'absolute', left: x - 130, top: y - 80, width: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: p, transform: `scale(${(0.7 + 0.3 * p) * (1 + 0.08 * lit)})`}}>
            <Orb e={n.e} size={140} color={n.c} pulse={lit} />
            <div style={{marginTop: 8, fontFamily: FONT.display, fontWeight: 600, fontSize: 28, color: n.c, background: 'rgba(8,9,15,0.75)', padding: '4px 14px', borderRadius: 12, whiteSpace: 'nowrap'}}>
              {i + 1}. {n.t}
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: cx - 120, top: cy - 30, width: 240, textAlign: 'center', opacity: ring}}>
        <Emoji e="🔁" size={50} />
        <div style={{fontSize: 22, fontWeight: 700, color: C.dim, marginTop: 4}}>пока задача не решена</div>
      </div>
      {/* исправление ошибок */}
      <div style={{position: 'absolute', left: 900, top: 300, width: 900, opacity: fix, transform: `translateX(${(1 - fix) * 40}px)`}}>
        <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 34, marginBottom: 18}}>Сам исправляет ошибки</div>
        {[
          ['❌', 'Нашёл не тот сайт', '🔎', 'ищет другой'],
          ['❌', 'Программа выдала ошибку', '🛠️', 'читает и исправляет'],
        ].map((r, i) => (
          <Card key={i} pad={20} style={{marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, fontSize: 27, fontWeight: 600}}>
            <Emoji e={r[0]} size={30} />
            <span style={{color: C.dim}}>{r[1]}</span>
            <span style={{color: C.cyan, fontWeight: 800}}>→</span>
            <Emoji e={r[2]} size={30} />
            <span>{r[3]}</span>
          </Card>
        ))}
      </div>
      {/* сравнение */}
      <div style={{position: 'absolute', left: 900, top: 630, width: 900, opacity: cmp, transform: `translateY(${(1 - cmp) * 30}px)`}}>
        <Card pad={24} style={{display: 'grid', gridTemplateColumns: '220px 1fr', rowGap: 18, alignItems: 'center'}}>
          <div style={{fontSize: 27, fontWeight: 700, color: C.dim}}>💬 Чат</div>
          <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
            <div style={{width: 22, height: 22, borderRadius: 11, background: C.faint}} />
            <span style={{fontSize: 23, color: C.faint, marginLeft: 10}}>1 вопрос → 1 ответ</span>
          </div>
          <div style={{fontSize: 27, fontWeight: 700, color: C.cyan}}>🤖 Агент</div>
          <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
            {Array.from({length: 22}).map((_, i) => (
              <div key={i} style={{width: 20, height: 20, borderRadius: 10, background: C.cyan, opacity: interpolate(frame, [at(compareAt) + i * 3, at(compareAt) + i * 3 + 6], [0, 1], clamp), boxShadow: `0 0 10px ${alpha(C.cyan, 0.6)}`}} />
            ))}
          </div>
        </Card>
      </div>
    </Stage>
  );
};

/* ───────────── 4. Контекст: рабочий стол ───────────── */
export const Desk: React.FC<any> = ({num, title, papersAt, overflowAt, tidyAt, papers}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const fP = at(papersAt);
  const fO = at(overflowAt);
  const fT = at(tidyAt);
  const tidy = interpolate(frame, [fT, fT + 40], [0, 1], clamp);
  const DX = 260;
  const DY = 330;
  const DW = 1400;
  const DH = 470;
  const icons = ['❓', '📜', '📄', '🔎', '💬', '📄', '🔎', '💬'];
  return (
    <Stage>
      <DetailHeader num={num} title={title} color={PARTS[3].c} />
      <div style={{position: 'absolute', left: DX, top: DY, width: DW, height: DH, borderRadius: 30, background: 'linear-gradient(180deg, rgba(162,140,255,0.12), rgba(162,140,255,0.04))', border: `2px solid ${alpha(C.violet, 0.4)}`, boxShadow: `0 0 60px ${alpha(C.violet, 0.15)}`}}>
        <div style={{position: 'absolute', left: 28, top: 18, fontSize: 22, fontWeight: 800, letterSpacing: 3, color: C.violet}}>РАБОЧИЙ СТОЛ МОДЕЛИ · КОНТЕКСТ</div>
      </div>
      {papers.map((p: string, i: number) => {
        const first = i < 5;
        const f0 = first ? fP + i * 14 : fO + (i - 5) * 10;
        const drop = interpolate(frame, [f0, f0 + 16], [0, 1], clamp);
        let x = DX + 60 + (i % 5) * 262;
        let y = DY + 90 + Math.floor(i / 5) * 60;
        let rot = ((i * 37) % 9) - 4;
        if (!first) {
          x = DX + 120 + (i - 5) * 330;
          y = DY + 130;
        }
        // перегруз: часть бумаг падает со стола
        const fall = !first ? 0 : interpolate(frame, [fO + 40 + i * 6, fO + 75 + i * 6], [0, 1], clamp);
        const falls = i === 2 || i === 4;
        if (falls) {
          y += fall * 420;
          rot += fall * 40;
        }
        // уборка: всё лишнее схлопывается
        const keep = i === 0 || i === 1;
        const opacity = drop * (keep ? 1 : 1 - tidy) * (falls ? 1 - fall * 0.6 : 1);
        if (keep) {
          x = interpolate(tidy, [0, 1], [x, DX + 120 + i * 300]);
          y = interpolate(tidy, [0, 1], [y, DY + 160]);
          rot = interpolate(tidy, [0, 1], [rot, 0]);
        }
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y - (1 - drop) * 120, transform: `rotate(${rot}deg)`, opacity}}>
            <div style={{width: 236, height: 150, borderRadius: 14, background: '#F2EEE6', color: '#2A2620', padding: 16, boxShadow: '0 14px 30px rgba(0,0,0,0.45)'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 21, fontWeight: 800}}>
                <Emoji e={icons[i]} size={24} />
                {p}
              </div>
              {[0, 1, 2].map((k) => (
                <div key={k} style={{height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.12)', marginTop: 12, width: `${90 - k * 18}%`}} />
              ))}
            </div>
          </div>
        );
      })}
      {/* предупреждение о перегрузе */}
      <div style={{position: 'absolute', left: DX + DW - 430, top: DY + DH + 14, opacity: interpolate(frame, [fO + 45, fO + 60], [0, 1], clamp) * (1 - tidy)}}>
        <Pill color={C.red} style={{fontSize: 26}}>
          ⚠️ стол переполнен — важное теряется
        </Pill>
      </div>
      {/* выжимка */}
      <div style={{position: 'absolute', left: DX + 760, top: DY + 120, opacity: tidy, transform: `scale(${0.8 + 0.2 * tidy})`}}>
        <Card accent={C.green} glow={0.8} pad={26} style={{width: 470}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT.display, fontWeight: 600, fontSize: 30, color: C.green}}>
            <Emoji e="📝" size={36} /> Краткая выжимка
          </div>
          <div style={{fontSize: 23, color: C.dim, marginTop: 10, lineHeight: 1.4}}>файлы, поиск и старые сообщения — в двух абзацах</div>
        </Card>
        <div style={{marginTop: 18, display: 'flex', alignItems: 'center', gap: 10, fontSize: 26, fontWeight: 700, color: C.text}}>
          <Emoji e="🧹" size={34} /> секретарь навёл порядок
        </div>
      </div>
    </Stage>
  );
};

/* ───────────── 5. Память ───────────── */
export const Memory: React.FC<any> = ({num, title, notesAt, injectAt, fileAt, notes}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const nb = useAppear(notesAt);
  const inj = interpolate(frame, [at(injectAt), at(injectAt) + 35], [0, 1], clamp);
  const file = useAppear(fileAt);
  const bubbles = [0, 1, 2].map((i) => ((frame + i * 40) % 120) / 120);
  return (
    <Stage>
      <DetailHeader num={num} title={title} color={PARTS[4].c} />
      {/* золотая рыбка */}
      <Appear at={0} delay={10} from="left" style={{position: 'absolute', left: 120, top: 320}}>
        <div style={{width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, rgba(93,214,242,0.35), rgba(93,214,242,0.08) 70%)', border: `3px solid ${alpha(C.cyan, 0.5)}`, position: 'relative'}}>
          <div style={{position: 'absolute', left: 100 + 30 * Math.sin(frame / 30), top: 130, transform: `scaleX(${Math.cos(frame / 30) > 0 ? -1 : 1})`}}>
            <Emoji e="🐠" size={150} />
          </div>
          {bubbles.map((b, i) => (
            <div key={i} style={{position: 'absolute', left: 220 + i * 30, top: 150 - b * 140, width: 18 + i * 4, height: 18 + i * 4, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)', opacity: 1 - b}} />
          ))}
        </div>
        <div style={{textAlign: 'center', marginTop: 16, fontSize: 27, fontWeight: 700, color: C.dim, width: 380}}>каждый чат — чистый лист</div>
      </Appear>
      {/* блокнот харнесса */}
      <div style={{position: 'absolute', left: 620, top: 300, opacity: nb, transform: `translateY(${(1 - nb) * 30}px) rotate(-2deg)`}}>
        <div style={{width: 520, borderRadius: 18, background: '#FFF6DE', color: '#3A2E1E', padding: '26px 30px 30px 60px', boxShadow: '0 30px 70px rgba(0,0,0,0.5)', position: 'relative', backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 47px, rgba(60,46,30,0.12) 47px 49px)'}}>
          <div style={{position: 'absolute', left: 36, top: 0, bottom: 0, width: 3, background: 'rgba(255,107,122,0.5)'}} />
          <div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 28, marginBottom: 12}}>📒 Заметки харнесса</div>
          {notes.map((n: string, i: number) => (
            <div key={i} style={{fontSize: 29, fontWeight: 600, lineHeight: '49px'}}>
              <Typewriter text={'• ' + n} at={notesAt + 0.15 + i * 0.25} cps={40} caret={false} />
            </div>
          ))}
        </div>
      </div>
      {/* новая сессия */}
      <div style={{position: 'absolute', left: 1240, top: 300, opacity: inj}}>
        <Window title="Новый разговор" style={{width: 560, height: 360}}>
          <div style={{padding: 24}}>
            <div style={{opacity: interpolate(inj, [0.5, 1], [0, 1], clamp), transform: `translateY(${(1 - inj) * -60}px)`}}>
              <Pill color={C.green} style={{fontSize: 21}}>
                📎 заметка подложена незаметно
              </Pill>
            </div>
            <div style={{marginTop: 20}}>
              <Bubble who="ai" style={{fontSize: 25}}>Здравствуйте, Анна! Коротко, как вы любите: …</Bubble>
            </div>
          </div>
        </Window>
      </div>
      <FlowArrow d="M 1150 470 Q 1200 420 1250 470" progress={inj} color={C.green} />
      {/* файл CLAUDE.md */}
      <div style={{position: 'absolute', left: 1240, top: 700, opacity: file, transform: `translateY(${(1 - file) * 20}px)`}}>
        <Card accent={C.green} glow={0.6} pad={20} style={{display: 'flex', alignItems: 'center', gap: 18, width: 560}}>
          <Emoji e="📄" size={48} />
          <div>
            <div style={{fontFamily: FONT.mono, fontSize: 30, fontWeight: 700, color: C.green}}>CLAUDE.md</div>
            <div style={{fontSize: 22, color: C.dim}}>обычный текстовый файл — можно поправить руками</div>
          </div>
        </Card>
      </div>
    </Stage>
  );
};

/* ───────────── 6. Права и безопасность ───────────── */
export const Permissions: React.FC<any> = ({num, title, levelsAt, sandboxAt, brakesAt, levels}) => {
  const frame = useCurrentFrame();
  const sb = useAppear(sandboxAt);
  const br = useAppear(brakesAt);
  const col = (c: string) => (c === 'ok' ? C.green : c === 'warn' ? C.amber : C.red);
  const boom = Math.abs(Math.sin(frame / 8));
  return (
    <Stage>
      <DetailHeader num={num} title={title} color={PARTS[5].c} />
      <div style={{display: 'flex', flexDirection: 'column', gap: 18, marginTop: 40, width: 1000}}>
        {levels.map((l: any, i: number) => (
          <Appear key={i} at={levelsAt} delay={i * 14} from="left">
            <Card accent={col(l.color)} glow={0.35} pad={22} style={{display: 'flex', alignItems: 'center', gap: 22}}>
              <div style={{width: 14, alignSelf: 'stretch', borderRadius: 7, background: col(l.color), boxShadow: `0 0 16px ${col(l.color)}`}} />
              <Emoji e={l.icon} size={46} />
              <div style={{fontSize: 32, fontWeight: 700, flex: 1}}>{l.text}</div>
              <Pill color={col(l.color)} style={{fontSize: 24}}>
                {l.rule}
              </Pill>
            </Card>
          </Appear>
        ))}
      </div>
      {/* песочница */}
      <div style={{position: 'absolute', left: 1180, top: 320, width: 640, opacity: sb, transform: `scale(${0.9 + 0.1 * sb})`}}>
        <div style={{border: `3px dashed ${alpha(C.amber, 0.7)}`, borderRadius: 26, padding: 26, background: alpha(C.amber, 0.06)}}>
          <div style={{fontSize: 24, fontWeight: 800, color: C.amber, letterSpacing: 3}}>🧪 ПЕСОЧНИЦА</div>
          <div style={{display: 'flex', alignItems: 'center', gap: 20, marginTop: 14}}>
            <Emoji e="🤖" size={84} />
            <Emoji e="💥" size={60 + boom * 14} />
            <div style={{fontSize: 24, color: C.dim, fontWeight: 600}}>экспериментирует,<br />ломает — не страшно</div>
          </div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 18, fontSize: 26, fontWeight: 700}}>
          <Emoji e="💻" size={52} /> ваш настоящий компьютер <span style={{color: C.green}}>— в безопасности ✅</span>
        </div>
      </div>
      {/* тормоза */}
      <div style={{position: 'absolute', left: 110, top: 700, right: 110, opacity: br, transform: `translateY(${(1 - br) * 30}px)`}}>
        <Card accent={C.red} glow={0.5} pad={24} style={{display: 'flex', alignItems: 'center', gap: 26}}>
          <Emoji e="🏎️" size={70} />
          <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 34, lineHeight: 1.3}}>
            Тормоза нужны не чтобы ехать медленно, а чтобы ехать <span style={{color: C.red}}>быстро и безопасно</span>
          </div>
        </Card>
      </div>
    </Stage>
  );
};

/* ───────────── 7. Навыки и подключения ───────────── */
export const SkillsIntro: React.FC<any> = ({num, title, folderAt, hubAt, usbAt}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const hub = useAppear(hubAt);
  const usb = useAppear(usbAt);
  const services = [
    {e: '📧', t: 'Почта'},
    {e: '📅', t: 'Календарь'},
    {e: '☁️', t: 'Диск'},
    {e: '📊', t: 'Таблицы'},
  ];
  return (
    <Stage>
      <DetailHeader num={num} title={title} color={PARTS[6].c} />
      <Appear at={folderAt} from="left" style={{position: 'absolute', left: 110, top: 330, width: 760}}>
        <Card accent={C.pink} glow={0.4}>
          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <Emoji e="📁" size={64} />
            <div>
              <div style={{fontSize: 22, fontWeight: 800, color: C.pink, letterSpacing: 3}}>НАВЫК (СКИЛЛ)</div>
              <div style={{fontFamily: FONT.mono, fontSize: 30, fontWeight: 700}}>отчёт-для-руководителя/</div>
            </div>
          </div>
          <div style={{marginTop: 18, fontFamily: FONT.mono, fontSize: 26, lineHeight: 1.8, color: C.dim, paddingLeft: 30}}>
            <div>
              ├─ <span style={{color: C.text, fontWeight: 700}}>SKILL.md</span> <span style={{color: C.faint}}>← как делать</span>
            </div>
            <div>├─ пример-отчёта.docx</div>
            <div>└─ шаблон.md</div>
          </div>
        </Card>
      </Appear>
      <div style={{position: 'absolute', left: 1000, top: 300, width: 800, height: 420, opacity: hub}}>
        <div style={{position: 'absolute', left: 300, top: 130}}>
          <Orb e="🤖" size={150} color={C.pink} pulse={usePulse(40)} />
        </div>
        {services.map((s, i) => {
          const a = (-150 + i * 100) * (Math.PI / 180);
          const x = 375 + 300 * Math.cos(a);
          const y = 205 + 180 * Math.sin(a);
          const dash = (frame * 2 + i * 20) % 40;
          return (
            <React.Fragment key={i}>
              <svg width={800} height={420} style={{position: 'absolute', left: 0, top: 0}}>
                <line x1={375} y1={205} x2={x} y2={y} stroke={alpha(C.pink, 0.6)} strokeWidth="3" strokeDasharray="8 12" strokeDashoffset={-dash} />
              </svg>
              <div style={{position: 'absolute', left: x - 60, top: y - 55, width: 120, textAlign: 'center'}}>
                <Orb e={s.e} size={84} color={C.cyan} style={{margin: '0 auto'}} />
                <div style={{fontSize: 22, fontWeight: 700, marginTop: 6}}>{s.t}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 1040, top: 740, opacity: usb, transform: `translateY(${(1 - usb) * 20}px)`, display: 'flex', alignItems: 'center', gap: 22}}>
        <svg width="150" height="60" viewBox="0 0 150 60">
          <rect x="40" y="8" width="104" height="44" rx="22" fill="#2A2C38" stroke={C.pink} strokeWidth="3" />
          <rect x="62" y="22" width="60" height="16" rx="8" fill={C.pink} opacity="0.8" />
          <rect x="0" y="18" width="44" height="24" rx="6" fill="#3A3D4C" />
        </svg>
        <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 32}}>
          MCP — как <span style={{color: C.pink}}>USB-C</span> для ИИ
        </div>
      </div>
    </Stage>
  );
};
