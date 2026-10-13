// Копирует нужные начертания из @fontsource в public/fonts и пишет src/fonts.json
import fs from 'node:fs';
import path from 'node:path';
const want = {unbounded: [500, 600, 700], manrope: [400, 500, 600, 700, 800], 'jetbrains-mono': [400, 700]};
const family = {unbounded: 'Unbounded', manrope: 'Manrope', 'jetbrains-mono': 'JetBrains Mono'};
const subsets = ['cyrillic', 'latin', 'latin-ext'];
const out = [];
for (const [pkg, weights] of Object.entries(want)) {
  for (const w of weights) {
    const css = fs.readFileSync(`node_modules/@fontsource/${pkg}/${w}.css`, 'utf8');
    for (const block of css.split('@font-face').slice(1)) {
      const m = block.match(/files\/([^)'"]+?-(\w[\w-]*?)-\d+-normal\.woff2)/);
      const sub = block.match(/\/\* ([\w-]+) \*\//);
      const ur = block.match(/unicode-range:\s*([^;]+);/);
      if (!m) continue;
      const file = m[1];
      const subset = subsets.find((s) => file.includes(`-${s}-${w}-`));
      if (!subset) continue;
      fs.copyFileSync(`node_modules/@fontsource/${pkg}/files/${file}`, `public/fonts/${file}`);
      out.push({family: family[pkg], weight: w, file: `fonts/${file}`, unicodeRange: ur ? ur[1].trim() : undefined});
    }
  }
}
fs.writeFileSync('src/fonts.json', JSON.stringify(out, null, 1));
console.log(out.length, 'faces');
