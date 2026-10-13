// Рендер контрольных кадров: node pipeline/stills.mjs <outDir> [sceneId...]
// Для каждой сцены — кадр ближе к концу (всё уже появилось) и кадр в середине.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2] || 'out/stills';
const only = process.argv.slice(3);
fs.mkdirSync(out, {recursive: true});
const tl = JSON.parse(fs.readFileSync('src/timeline.json', 'utf8'));
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'});
const composition = await selectComposition({serveUrl, id: 'HarnessExplainer', puppeteerInstance: browser});
for (const s of tl.scenes) {
  if (only.length && !only.includes(s.id)) continue;
  const frames = {end: s.start + s.duration - 18, mid: s.start + Math.round(s.duration * 0.5)};
  for (const [tag, frame] of Object.entries(frames)) {
    if (only.length === 0 && tag === 'mid') continue;
    await renderStill({composition, serveUrl, frame, output: `${out}/${s.id}_${tag}.jpg`, imageFormat: 'jpeg', jpegQuality: 85, puppeteerInstance: browser});
    console.log(s.id, tag, frame);
  }
}
await browser.close({silent: true});
