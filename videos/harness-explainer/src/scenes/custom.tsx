import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Appear, useAppear, useAt} from '../lib/scene';
import {Bubble, Card, Emoji, Orb, Pill, Typewriter, usePulse, Window} from '../lib/ui';
import {C, FONT, alpha} from '../theme';
import {Stage} from './intro';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

/* ───────────── Навык = папка ───────────── */
export const SkillFolder: React.FC<any> = ({treeAt, mdAt, exampleAt, chatAt, ideasAt, lazyAt, ideas}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const md = useAppear(mdAt);
  const ex = useAppear(exampleAt);
  const chat = useAppear(chatAt);
  const ide = useAppear(ideasAt);
  const lazy = useAppear(lazyAt);
  const md_lines = [
    {t: '---', c: C.faint},
    {t: 'name: недельный-отчёт', c: C.pink},
    {t: 'description: Используй, когда просят', c: C.pink},
    {t: '  недельный отчёт для руководителя', c: C.pink},
    {t: '---', c: C.faint},
    {t: '1. Итоги недели, проблемы, планы', c: C.text},
    {t: '2. Тон деловой, без воды', c: C.text},
    {t: '3. В конце — три главных вывода', c: C.text},
    {t: '4. Образец: пример-отчёта.docx', c: C.amber},
  ];
  return (
    <Stage>
      <div style={{display: 'flex', gap: 40, opacity: 1 - lazy}}>
        <div style={{width: 560}}>
          <Appear at={treeAt} from="left">
            <Card accent={C.pink} glow={0.3}>
              <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                <Emoji e="📁" size={56} />
                <div style={{fontFamily: FONT.mono, fontSize: 28, fontWeight: 700}}>недельный-отчёт/</div>
              </div>
              <div style={{fontFamily: FONT.mono, fontSize: 25, lineHeight: 1.9, marginTop: 14, paddingLeft: 24, color: C.dim}}>
                <div style={{color: md > 0.5 ? C.pink : C.dim, fontWeight: md > 0.5 ? 700 : 400}}>├─ 📄 SKILL.md</div>
                <div style={{color: ex > 0.5 ? C.amber : C.dim, fontWeight: ex > 0.5 ? 700 : 400}}>├─ 📎 пример-отчёта.docx</div>
                <div>└─ 📄 шаблон.md</div>
              </div>
            </Card>
          </Appear>
          <div style={{marginTop: 30, opacity: chat, transform: `translateY(${(1 - chat) * 20}px)`}}>
            <Bubble who="user" color={C.pink} style={{fontSize: 27}}>
              Сделай недельный отчёт
            </Bubble>
            <div style={{marginTop: 14, opacity: interpolate(frame, [at(chatAt) + 30, at(chatAt) + 45], [0, 1], clamp)}}>
              <Bubble who="ai" style={{fontSize: 25}}>
                🧩 Использую навык «недельный-отчёт»…
              </Bubble>
            </div>
          </div>
        </div>
        <div style={{flex: 1, opacity: md, transform: `translateX(${(1 - md) * 40}px)`}}>
          <Window title="SKILL.md" style={{height: 560}}>
            <div style={{padding: '24px 30px', fontFamily: FONT.mono, fontSize: 27, lineHeight: 1.6}}>
              {md_lines.map((l, i) => {
                const f0 = at(mdAt) + 6 + i * 7;
                const hl = i === 8 ? ex : 0;
                return (
                  <div key={i} style={{color: l.c, opacity: interpolate(frame, [f0, f0 + 6], [0, 1], clamp), background: hl ? alpha(C.amber, 0.15 * hl) : 'transparent', borderRadius: 8, padding: '0 8px'}}>
                    {l.t}
                  </div>
                );
              })}
            </div>
          </Window>
          <div style={{display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 22, opacity: ide}}>
            {ideas.map((x: string, i: number) => (
              <div key={i} style={{opacity: interpolate(frame, [at(ideasAt) + i * 10, at(ideasAt) + i * 10 + 10], [0, 1], clamp)}}>
                <Pill color={[C.pink, C.amber, C.cyan, C.green][i % 4]} style={{fontSize: 25}}>
                  {x}
                </Pill>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* «ленивая» загрузка: на столе только описания */}
      <div style={{position: 'absolute', left: 110, right: 110, top: 170, opacity: lazy, transform: `translateY(${(1 - lazy) * 30}px)`}}>
        <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 46}}>Агент не держит все навыки в голове</div>
        <div style={{display: 'flex', gap: 22, marginTop: 40}}>
          {['недельный-отчёт', 'рецепты', 'ответы-клиентам', 'договоры', 'шутки'].map((n, i) => {
            const open = i === 0 ? interpolate(frame, [at(lazyAt) + 70, at(lazyAt) + 100], [0, 1], clamp) : 0;
            return (
              <Card key={i} accent={i === 0 ? C.pink : undefined} glow={open} pad={20} style={{width: 300, height: 140 + open * 250, overflow: 'hidden'}}>
                <div style={{fontFamily: FONT.mono, fontSize: 23, fontWeight: 700, color: i === 0 ? C.pink : C.text}}>🧩 {n}</div>
                <div style={{fontSize: 19, color: C.faint, marginTop: 8}}>короткое описание</div>
                {open > 0 ? (
                  <div style={{marginTop: 16, fontFamily: FONT.mono, fontSize: 19, color: C.dim, lineHeight: 1.6, opacity: open}}>
                    1. Итоги недели…
                    <br />
                    2. Тон деловой…
                    <br />
                    3. Три вывода…
                    <br />
                    <span style={{color: C.pink}}>полный текст открыт</span>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
        <div style={{marginTop: 30, display: 'flex', gap: 20}}>
          <Pill color={C.faint}>📇 сначала — только описания</Pill>
          <Pill color={C.pink}>📖 полный текст — когда нужен</Pill>
        </div>
      </div>
    </Stage>
  );
};

/* ───────────── MCP-хаб ───────────── */
export const Hub: React.FC<any> = ({hubAt, requestAt, flowAt, settingsAt, ruleAt, nodes, request}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const hub = useAppear(hubAt);
  const req = useAppear(requestAt);
  const fF = at(flowAt);
  const set = useAppear(settingsAt);
  const rule = useAppear(ruleAt);
  const cx = 700;
  const cy = 560;
  const R = 300;
  const res = interpolate(frame, [fF + 70, fF + 90], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 110, top: 110, opacity: hub}}>
        <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 50}}>
          Подключения через <span style={{color: C.cyan}}>MCP</span>
        </div>
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        {nodes.map((n: any, i: number) => {
          const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
          const x = cx + R * Math.cos(a);
          const y = cy + R * 0.62 * Math.sin(a);
          const p = interpolate(frame, [at(hubAt) + 8 + i * 6, at(hubAt) + 22 + i * 6], [0, 1], clamp);
          const active = (i === 1 || i === 0) && frame > fF;
          return (
            <line key={i} x1={cx} y1={cy} x2={cx + (x - cx) * p} y2={cy + (y - cy) * p} stroke={active ? C.cyan : 'rgba(255,255,255,0.18)'} strokeWidth={active ? 4 : 2.5} strokeDasharray="6 10" strokeDashoffset={-frame * (active ? 3 : 1)} />
          );
        })}
      </svg>
      {nodes.map((n: any, i: number) => {
        const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + R * Math.cos(a);
        const y = cy + R * 0.62 * Math.sin(a);
        const p = interpolate(frame, [at(hubAt) + 14 + i * 6, at(hubAt) + 28 + i * 6], [0, 1], clamp);
        const active = (i === 1 || i === 0) && frame > fF;
        // импульс по проводу
        const k = ((frame - fF - i * 12) % 60) / 60;
        return (
          <React.Fragment key={i}>
            {active ? (
              <div style={{position: 'absolute', left: cx + (x - cx) * k - 8, top: cy + (y - cy) * k - 8, width: 16, height: 16, borderRadius: 8, background: C.cyan, boxShadow: `0 0 16px ${C.cyan}`}} />
            ) : null}
            <div style={{position: 'absolute', left: x - 70, top: y - 60, width: 140, textAlign: 'center', opacity: p, transform: `scale(${0.7 + 0.3 * p})`}}>
              <Orb e={n.icon} size={92} color={active ? C.cyan : C.violet} pulse={active ? 1 : 0} style={{margin: '0 auto'}} />
              <div style={{fontSize: 23, fontWeight: 700, marginTop: 6}}>{n.text}</div>
            </div>
          </React.Fragment>
        );
      })}
      <div style={{position: 'absolute', left: cx - 85, top: cy - 85, opacity: hub, transform: `scale(${0.7 + 0.3 * hub})`}}>
        <Orb e="🤖" size={170} color={C.cyan} pulse={usePulse(30)} />
      </div>
      <div style={{position: 'absolute', left: cx - 40, top: cy + 92, opacity: hub}}>
        <Pill color={C.cyan} style={{fontSize: 20, padding: '4px 14px'}}>MCP</Pill>
      </div>
      {/* запрос и результат */}
      <div style={{position: 'absolute', left: 1180, top: 210, width: 640, opacity: req, transform: `translateY(${(1 - req) * 20}px)`}}>
        <Bubble who="user" color={C.cyan} style={{fontSize: 25}}>
          {request}
        </Bubble>
      </div>
      <div style={{position: 'absolute', left: 1180, top: 470, width: 640, opacity: res, transform: `translateY(${(1 - res) * 20}px)`}}>
        <Card accent={C.green} glow={0.5} pad={22}>
          <div style={{fontFamily: FONT.display, fontSize: 26, color: C.green, fontWeight: 600}}>📋 Сводка к встречам на завтра</div>
          {['10:00 · Планёрка — 2 письма от Ивана', '13:30 · Клиент «Альфа» — счёт и вопросы', '16:00 · Созвон с дизайнером — макеты'].map((t, i) => (
            <div key={i} style={{fontSize: 22, fontWeight: 600, marginTop: 10, color: C.text}}>
              • {t}
            </div>
          ))}
        </Card>
      </div>
      {/* настройки */}
      <div style={{position: 'absolute', left: 1180, top: 720, opacity: set * (1 - rule * 0), display: 'flex', alignItems: 'center', gap: 18}}>
        <Card pad={16} style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <span style={{fontSize: 24, fontWeight: 700}}>📅 Календарь</span>
          <div style={{width: 74, height: 40, borderRadius: 20, background: set > 0.5 ? C.green : 'rgba(255,255,255,0.2)', position: 'relative'}}>
            <div style={{position: 'absolute', top: 4, left: 4 + 34 * interpolate(frame, [at(settingsAt) + 10, at(settingsAt) + 20], [0, 1], clamp), width: 32, height: 32, borderRadius: 16, background: '#fff'}} />
          </div>
        </Card>
        <div style={{opacity: rule}}>
          <Pill color={C.amber} style={{fontSize: 24}}>
            🔒 только то, что нужно
          </Pill>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── Постоянные инструкции ───────────── */
export const CustomInstructions: React.FC<any> = ({cardAt, textAt, linkAt, rules}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const link = useAppear(linkAt);
  return (
    <Stage style={{alignItems: 'center'}}>
      <Appear at={cardAt} from="bottom" style={{width: 1200}}>
        <Window title="Настройки · Постоянные инструкции" style={{height: 500}}>
          <div style={{padding: 34}}>
            <div style={{fontSize: 24, fontWeight: 700, color: C.dim}}>⚙️ Что помощник должен знать во всех разговорах:</div>
            <div style={{marginTop: 18, borderRadius: 16, border: `2px solid ${alpha(C.amber, 0.5)}`, background: 'rgba(255,255,255,0.04)', padding: '22px 26px', fontSize: 31, lineHeight: 1.6, fontWeight: 600, minHeight: 260}}>
              {rules.map((r: string, i: number) => {
                const f0 = at(textAt) + i * 36;
                return (
                  <div key={i} style={{opacity: interpolate(frame, [f0 - 1, f0], [0, 1], clamp)}}>
                    <Typewriter text={r} at={textAt + i * 0.0} cps={i * 0 + 34} caret={false} style={{}} />
                  </div>
                );
              })}
            </div>
          </div>
        </Window>
      </Appear>
      <div style={{marginTop: 30, opacity: link, transform: `translateY(${(1 - link) * 20}px)`}}>
        <Pill color={C.coral} style={{fontSize: 28, padding: '12px 28px'}}>
          📜 Деталь 1 · Инструкции — теперь их пишете вы
        </Pill>
      </div>
    </Stage>
  );
};
