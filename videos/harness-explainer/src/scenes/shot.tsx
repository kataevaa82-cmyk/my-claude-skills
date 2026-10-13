import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {useAt, useScene} from '../lib/scene';
import {Pill, Window} from '../lib/ui';
import {C, FONT, alpha} from '../theme';
import shots from '../shots.json';

// геометрия PNG из pipeline/ansi_to_png.py (масштаб 1.5)
const PAD_X = 39;
const PAD_Y = 33;
const ROW = 42;
const COL = 19.8;

const BODY_W = 1560;
const BODY_H = 690;
const WIN_LEFT = (1920 - BODY_W) / 2;
const WIN_TOP = 170;

type Focus = {at: number; rows?: number[]; zoom?: number; img?: number; y?: number; colCenter?: number};
type Mark = {at: number; rows: number[]; cols: number[]; color?: string; img?: number; from_?: number};

const colorOf = (c?: string) => (c === 'ok' ? C.green : c === 'warn' ? C.amber : c === 'bad' ? C.red : C.coral);

const camera = (f: Focus, size: {w: number; h: number}, isBrowser: boolean) => {
  const s0 = BODY_W / size.w;
  const s = s0 * (f.zoom ?? 1);
  const imgH = size.h * s;
  const imgW = size.w * s;
  let cy: number;
  if (isBrowser || !f.rows) cy = (f.y ?? 0.35) * size.h;
  else cy = (PAD_Y + ROW * f.rows[0] + PAD_Y + ROW * (f.rows[1] + 1)) / 2;
  let ty = BODY_H / 2 - cy * s;
  if (imgH > BODY_H) ty = Math.min(0, Math.max(BODY_H - imgH, ty));
  else ty = (BODY_H - imgH) / 2;
  let tx = 0;
  if (f.colCenter !== undefined) tx = BODY_W / 2 - (PAD_X + COL * f.colCenter) * s;
  else if (isBrowser) tx = (BODY_W - imgW) / 2;
  tx = Math.min(0, Math.max(BODY_W - imgW, tx));
  return {s, tx, ty};
};

export const Shot: React.FC<any> = ({label, images, focus, marks = []}) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const scene = useScene();
  const focuses: Focus[] = focus;
  const ms: Mark[] = marks;

  // активный кадр камеры
  let ci = 0;
  focuses.forEach((f, i) => {
    if (frame >= at(f.at) - 6) ci = i;
  });
  const cur = focuses[ci];
  const prev = focuses[Math.max(0, ci - 1)];
  const curImg = cur.img ?? 0;
  const prevImg = prev.img ?? 0;
  const imgSize = (i: number) => (shots as any)[images[i].src];
  const isBrowser = (i: number) => images[i].kind === 'browser';
  const c1 = camera(cur, imgSize(curImg), isBrowser(curImg));
  const c0 = prevImg === curImg ? camera(prev, imgSize(prevImg), isBrowser(prevImg)) : c1;
  const t = interpolate(frame, [at(cur.at) - 6, at(cur.at) + 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const cam = ci === 0 ? c1 : {s: c0.s + (c1.s - c0.s) * t, tx: c0.tx + (c1.tx - c0.tx) * t, ty: c0.ty + (c1.ty - c0.ty) * t};
  // медленный «дрейф» камеры для живости
  const drift = Math.sin(frame / 70) * 4;

  const imgStart = at(images[curImg].at);
  const fadeIn = curImg === 0 ? 1 : interpolate(frame, [at(cur.at) - 8, at(cur.at) + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const browser = isBrowser(curImg);

  const enter = interpolate(frame, [0, 22], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});

  const renderImage = (i: number, opacity: number, c: {s: number; tx: number; ty: number}) => {
    const size = imgSize(i);
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: size.w,
          height: size.h,
          transformOrigin: '0 0',
          transform: `translate(${c.tx}px, ${c.ty + drift}px) scale(${c.s})`,
          opacity,
        }}
      >
        <Img src={staticFile(images[i].src)} style={{width: size.w, height: size.h, display: 'block'}} />
        {ms
          .filter((m) => (m.img ?? 0) === i)
          .map((m, k) => {
            const f0 = at(m.at + (m.from_ ?? 0));
            const f1 = at(Math.floor(m.at) + 1);
            const p = interpolate(frame, [f0 + 6, f0 + 18, f1 - 6, f1 + 4], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            const col = colorOf(m.color);
            const x0 = PAD_X + COL * m.cols[0] - 10;
            const x1 = PAD_X + COL * (m.cols[1] + 1) + 10;
            const y0 = PAD_Y + ROW * m.rows[0] - 6;
            const y1 = PAD_Y + ROW * (m.rows[1] + 1) + 4;
            const pulse = 0.5 + 0.5 * Math.sin(frame / 9);
            return (
              <div
                key={k}
                style={{
                  position: 'absolute',
                  left: x0,
                  top: y0,
                  width: x1 - x0,
                  height: y1 - y0,
                  borderRadius: 12,
                  border: `4px solid ${col}`,
                  background: alpha(col, 0.1),
                  boxShadow: `0 0 ${20 + 16 * pulse}px ${alpha(col, 0.55)}`,
                  opacity: p,
                  transform: `scale(${1.04 - 0.04 * p})`,
                }}
              />
            );
          })}
      </div>
    );
  };

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: WIN_LEFT, top: 104, opacity: enter}}>
        <Pill color={C.coral} style={{fontSize: 23}}>
          📸 {label}
        </Pill>
      </div>
      <div style={{position: 'absolute', left: WIN_LEFT, top: WIN_TOP, opacity: enter, transform: `translateY(${(1 - enter) * 40}px) scale(${0.96 + 0.04 * enter})`}}>
        <Window
          title={browser ? '' : 'Claude Code — ~/пекарня'}
          style={{width: BODY_W, height: BODY_H + 52}}
          bodyStyle={{background: browser ? '#FDF4E3' : C.terminal}}
          bar={
            browser ? (
              <div style={{marginLeft: 30, flex: 1, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', padding: '0 16px', fontFamily: FONT.body, fontSize: 19, color: 'rgba(255,255,255,0.65)'}}>
                🔒 file:///home/user/пекарня/index.html
              </div>
            ) : undefined
          }
        >
          {prevImg !== curImg && fadeIn < 1 ? renderImage(prevImg, 1 - fadeIn, camera(prev, imgSize(prevImg), isBrowser(prevImg))) : null}
          {renderImage(curImg, fadeIn, cam)}
          {/* мягкая виньетка по краям окна */}
          <div style={{position: 'absolute', inset: 0, boxShadow: browser ? 'none' : 'inset 0 0 60px rgba(0,0,0,0.55)', pointerEvents: 'none'}} />
        </Window>
      </div>
    </AbsoluteFill>
  );
};
