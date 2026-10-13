// Склейка нескольких MP4 (одинаковые кодеки, нарезка stream copy) в один MP4 без перекодирования.
// Работает и в браузере, и в Node. На вход — массив Uint8Array, на выход — массив кусков для Blob.
// Сэмплы копируются как есть: таблицы stbl собираются заново, смещения пересчитываются.
(function (root) {
  const u32 = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
  const s32 = (b, o) => (b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3];
  const typ = (b, o) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
  const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'edts', 'dinf']);

  function parseBoxes(b, start, end) {
    const out = [];
    let o = start;
    while (o + 8 <= end) {
      let size = u32(b, o);
      const type = typ(b, o + 4);
      let hdr = 8;
      if (size === 1) {
        size = u32(b, o + 8) * 4294967296 + u32(b, o + 12);
        hdr = 16;
      } else if (size === 0) size = end - o;
      const box = {type, start: o, hdr, end: o + size};
      if (CONTAINERS.has(type)) box.children = parseBoxes(b, o + hdr, o + size);
      else box.data = b.subarray(o + hdr, o + size);
      out.push(box);
      o += size;
    }
    return out;
  }
  const find = (boxes, type) => boxes.find((x) => x.type === type);
  const path = (boxes, ...types) => {
    let cur = {children: boxes};
    for (const t of types) {
      cur = cur.children && find(cur.children, t);
      if (!cur) return null;
    }
    return cur;
  };

  function readTrack(b, trak) {
    const mdia = find(trak.children, 'mdia');
    const hdlr = find(mdia.children, 'hdlr').data;
    const handler = typ(hdlr, 8);
    const mdhd = find(mdia.children, 'mdhd').data;
    const timescale = mdhd[0] === 1 ? u32(mdhd, 20) : u32(mdhd, 12);
    const stbl = path(mdia.children, 'minf', 'stbl');
    const get = (t) => find(stbl.children, t);
    // stts
    const deltas = [];
    {
      const d = get('stts').data;
      const n = u32(d, 4);
      for (let i = 0; i < n; i++) {
        const c = u32(d, 8 + i * 8), v = u32(d, 12 + i * 8);
        for (let k = 0; k < c; k++) deltas.push(v);
      }
    }
    // ctts
    let ctts = null, cttsVersion = 0;
    if (get('ctts')) {
      const d = get('ctts').data;
      cttsVersion = d[0];
      const n = u32(d, 4);
      ctts = [];
      for (let i = 0; i < n; i++) {
        const c = u32(d, 8 + i * 8);
        const v = cttsVersion === 1 ? s32(d, 12 + i * 8) : u32(d, 12 + i * 8);
        for (let k = 0; k < c; k++) ctts.push(v);
      }
    }
    // stss
    let stss = null;
    if (get('stss')) {
      const d = get('stss').data;
      const n = u32(d, 4);
      stss = [];
      for (let i = 0; i < n; i++) stss.push(u32(d, 8 + i * 4));
    }
    // stsz
    const sizes = [];
    {
      const d = get('stsz').data;
      const fixed = u32(d, 4), n = u32(d, 8);
      for (let i = 0; i < n; i++) sizes.push(fixed || u32(d, 12 + i * 4));
    }
    // stco / co64
    const offsets = [];
    if (get('stco')) {
      const d = get('stco').data;
      const n = u32(d, 4);
      for (let i = 0; i < n; i++) offsets.push(u32(d, 8 + i * 4));
    } else {
      const d = get('co64').data;
      const n = u32(d, 4);
      for (let i = 0; i < n; i++) offsets.push(u32(d, 8 + i * 8) * 4294967296 + u32(d, 12 + i * 8));
    }
    // stsc → чанки
    const stscE = [];
    {
      const d = get('stsc').data;
      const n = u32(d, 4);
      for (let i = 0; i < n; i++) stscE.push([u32(d, 8 + i * 12), u32(d, 12 + i * 12), u32(d, 16 + i * 12)]);
    }
    const chunks = [];
    let s = 0;
    for (let c = 0; c < offsets.length; c++) {
      let spc = 0;
      for (const e of stscE) if (e[0] <= c + 1) spc = e[1];
      let bytes = 0;
      for (let k = 0; k < spc; k++) bytes += sizes[s + k];
      chunks.push({src: offsets[c], first: s, n: spc, bytes});
      s += spc;
    }
    return {trak, handler, timescale, deltas, ctts, cttsVersion, stss, sizes, chunks};
  }

  function parseFile(b) {
    const top = parseBoxes(b, 0, b.length);
    const moov = find(top, 'moov');
    const ftyp = find(top, 'ftyp');
    const mvhd = find(moov.children, 'mvhd').data;
    const movieTs = mvhd[0] === 1 ? u32(mvhd, 20) : u32(mvhd, 12);
    const tracks = moov.children.filter((x) => x.type === 'trak').map((t) => readTrack(b, t));
    return {b, top, ftyp, moov, movieTs, tracks};
  }

  // ── сериализация ──
  const be32 = (v) => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
  function fullBox(type, version, words) {
    const body = [version, 0, 0, 0];
    for (const w of words) body.push(...be32(w));
    return {type, data: new Uint8Array(body)};
  }
  function rle(arr) {
    const out = [];
    for (const v of arr) {
      const last = out[out.length - 1];
      if (last && last[1] === v) last[0]++;
      else out.push([1, v]);
    }
    return out;
  }
  function serialize(box) {
    if (box.children) {
      const kids = box.children.map(serialize);
      const len = 8 + kids.reduce((a, k) => a + k.length, 0);
      const out = new Uint8Array(len);
      out.set(be32(len), 0);
      for (let i = 0; i < 4; i++) out[4 + i] = box.type.charCodeAt(i);
      let o = 8;
      for (const k of kids) { out.set(k, o); o += k.length; }
      return out;
    }
    const len = 8 + box.data.length;
    const out = new Uint8Array(len);
    out.set(be32(len), 0);
    for (let i = 0; i < 4; i++) out[4 + i] = box.type.charCodeAt(i);
    out.set(box.data, 8);
    return out;
  }
  const clone = (box) => (box.children ? {type: box.type, children: box.children.map(clone)} : {type: box.type, data: box.data});
  function setDuration(data, version, offV0, offV1, value) {
    const d = new Uint8Array(data);
    if (version === 1) {
      const hi = Math.floor(value / 4294967296), lo = value >>> 0;
      d.set(be32(hi), offV1); d.set(be32(lo), offV1 + 4);
    } else d.set(be32(value >>> 0), offV0);
    return d;
  }

  function concatMp4(buffers) {
    const files = buffers.map(parseFile);
    const f0 = files[0];
    const nT = f0.tracks.length;
    // объединённые таблицы по дорожкам (сопоставление по порядку и типу)
    const merged = [];
    for (let t = 0; t < nT; t++) {
      const h = f0.tracks[t].handler;
      const m = {deltas: [], ctts: f0.tracks[t].ctts ? [] : null, stss: f0.tracks[t].stss ? [] : null, sizes: [], chunkSpc: []};
      let base = 0;
      files.forEach((f) => {
        const tr = f.tracks[t];
        if (tr.handler !== h) throw new Error('tracks differ between parts');
        m.deltas.push(...tr.deltas);
        if (m.ctts) m.ctts.push(...(tr.ctts || tr.deltas.map(() => 0)));
        if (m.stss) m.stss.push(...(tr.stss || []).map((x) => x + base));
        m.sizes.push(...tr.sizes);
        base += tr.sizes.length;
      });
      merged.push(m);
    }
    // раскладка mdat: части по порядку, внутри — чанки всех дорожек по исходному смещению
    const layout = [];
    files.forEach((f, fi) => {
      const list = [];
      f.tracks.forEach((tr, t) => tr.chunks.forEach((c) => list.push({t, c, fi})));
      list.sort((a, b) => a.c.src - b.c.src);
      layout.push(...list);
    });
    for (const L of layout) merged[L.t].chunkSpc.push(L.c.n);

    // Списки правок первой части: пустая правка (задержка) + начало медиа. Общий старт —
    // самый поздний из треков; для каждой дорожки пересчитываем media_time так, чтобы
    // все начинались в 0 и сохранили взаимную синхронность (обрезка AAC-приминга и сдвига B-кадров).
    const edits = f0.tracks.map((tr) => {
      const edts = find(tr.trak.children, 'edts');
      let empty = 0, mt = 0;
      if (edts) {
        const d = find(edts.children, 'elst').data;
        const v = d[0], n = u32(d, 4), es = v === 1 ? 20 : 12;
        let seenMedia = false;
        for (let i = 0; i < n; i++) {
          const o = 8 + i * es;
          const dur = v === 1 ? u32(d, o) * 4294967296 + u32(d, o + 4) : u32(d, o);
          const mediaTime = v === 1 ? s32(d, o + 8) * 4294967296 + u32(d, o + 12) : s32(d, o + 4);
          if (mediaTime < 0 && !seenMedia) empty += dur;
          else if (!seenMedia) { mt = mediaTime; seenMedia = true; }
        }
      }
      return {empty, mt};
    });
    const t0 = Math.max(...edits.map((e) => e.empty));
    const startMedia = edits.map((e, t) => {
      let v = e.mt + Math.round(((t0 - e.empty) * f0.tracks[t].timescale) / f0.movieTs);
      // пустые правки записаны в мс; для AAC приминг кратен кадру в 1024 отсчёта — округляем к нему
      if (f0.tracks[t].handler === 'soun') {
        const snap = Math.round(v / 1024) * 1024;
        if (Math.abs(snap - v) <= 48) v = snap;
      }
      return v;
    });

    const buildMoov = (chunkOffsets) => {
      const moov = clone(f0.moov);
      let maxMovieDur = 0;
      const trakBoxes = moov.children.filter((x) => x.type === 'trak');
      trakBoxes.forEach((trak, t) => {
        const m = merged[t];
        const ts = f0.tracks[t].timescale;
        const mediaDur = m.deltas.reduce((a, v) => a + v, 0);
        // конец показа с учётом сдвига композиции (B-кадры)
        let dts = 0, presEnd = 0;
        m.deltas.forEach((dlt, i) => {
          const cts = m.ctts ? (f0.tracks[t].cttsVersion === 1 ? m.ctts[i] | 0 : m.ctts[i]) : 0;
          presEnd = Math.max(presEnd, dts + cts + dlt);
          dts += dlt;
        });
        const movieDur = Math.round(((presEnd - startMedia[t]) * f0.movieTs) / ts);
        maxMovieDur = Math.max(maxMovieDur, movieDur);
        const mdia = find(trak.children, 'mdia');
        const mdhd = find(mdia.children, 'mdhd');
        mdhd.data = setDuration(mdhd.data, mdhd.data[0], 16, 24, mediaDur);
        const tkhd = find(trak.children, 'tkhd');
        tkhd.data = setDuration(tkhd.data, tkhd.data[0], 20, 28, movieDur);
        // одна правка: без задержки, медиа с общего старта
        const edtsBox = {type: 'edts', children: [fullBox('elst', 0, [1, movieDur, startMedia[t] >>> 0, 0x00010000])]};
        const ei = trak.children.findIndex((x) => x.type === 'edts');
        if (ei >= 0) trak.children[ei] = edtsBox;
        else trak.children.splice(1, 0, edtsBox);
        const stbl = path(mdia.children, 'minf', 'stbl');
        const keep = stbl.children.filter((x) => x.type === 'stsd');
        const stts = rle(m.deltas);
        keep.push(fullBox('stts', 0, [stts.length, ...stts.flat()]));
        if (m.ctts) {
          const c = rle(m.ctts);
          keep.push(fullBox('ctts', f0.tracks[t].cttsVersion, [c.length, ...c.flat().map((x) => x >>> 0)]));
        }
        if (m.stss) keep.push(fullBox('stss', 0, [m.stss.length, ...m.stss]));
        const stsc = [];
        m.chunkSpc.forEach((n, i) => {
          const last = stsc[stsc.length - 1];
          if (!last || last[1] !== n) stsc.push([i + 1, n, 1]);
        });
        keep.push(fullBox('stsc', 0, [stsc.length, ...stsc.flat()]));
        keep.push(fullBox('stsz', 0, [0, m.sizes.length, ...m.sizes]));
        keep.push(fullBox('stco', 0, [chunkOffsets[t].length, ...chunkOffsets[t]]));
        stbl.children = keep;
      });
      const mvhd = find(moov.children, 'mvhd');
      mvhd.data = setDuration(mvhd.data, mvhd.data[0], 16, 24, maxMovieDur);
      // udta/meta не нужны
      moov.children = moov.children.filter((x) => x.type !== 'udta');
      return serialize(moov);
    };

    const ftyp = serialize(clone(f0.ftyp));
    const zeros = merged.map((m) => m.chunkSpc.map(() => 0));
    const moovSize = buildMoov(zeros).length;
    const dataBytes = layout.reduce((a, L) => a + L.c.bytes, 0);
    const mdatHdr = new Uint8Array(8);
    mdatHdr.set(be32(8 + dataBytes), 0);
    mdatHdr.set([109, 100, 97, 116], 4);
    let off = ftyp.length + moovSize + 8;
    const offsets = merged.map(() => []);
    const pieces = [];
    // соседние чанки одной части лежат в исходнике подряд — отдаём их одним куском
    let run = null;
    const flush = () => { if (run) pieces.push(files[run.fi].b.subarray(run.a, run.z)); };
    for (const L of layout) {
      offsets[L.t].push(off);
      off += L.c.bytes;
      if (run && run.fi === L.fi && run.z === L.c.src) run.z += L.c.bytes;
      else { flush(); run = {fi: L.fi, a: L.c.src, z: L.c.src + L.c.bytes}; }
    }
    flush();
    const moov = buildMoov(offsets);
    if (moov.length !== moovSize) throw new Error('moov size changed');
    return [ftyp, moov, mdatHdr, ...pieces];
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = {concatMp4};
  else root.concatMp4 = concatMp4;
})(typeof self !== 'undefined' ? self : this);
