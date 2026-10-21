/* Мінімальний генератор QR-коду (режим Byte, рівні L/M, версії 1–10, до ~170 байт).
   Без зовнішніх бібліотек. Використання: qrSvg("https://…", 240) → рядок <svg>. */
(function (root) {
  'use strict';
  const ECL = {
    L: { bits: 1, ecc: [7, 10, 15, 20, 26, 18, 20, 24, 30, 18], blocks: [1, 1, 1, 1, 1, 2, 2, 2, 2, 4] },
    M: { bits: 0, ecc: [10, 16, 26, 18, 24, 16, 18, 22, 22, 26], blocks: [1, 1, 1, 2, 2, 4, 4, 4, 5, 5] },
    H: { bits: 2, ecc: [17, 28, 22, 16, 22, 28, 26, 26, 24, 28], blocks: [1, 1, 2, 4, 4, 4, 5, 6, 8, 8] }   /* найвища надійність: витримує знак посередині */
  };
  const RAW = [26, 44, 70, 100, 134, 172, 196, 242, 292, 346];
  const ALIGN = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
  const EXP = new Array(512), LOG = new Array(256);
  (function () { let x = 1; for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
  const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);
  function gen(n) { let g = [1]; for (let i = 0; i < n; i++) { const ng = new Array(g.length + 1).fill(0); for (let j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); } g = ng; } return g; }
  function rs(data, n) { const g = gen(n), r = new Array(n).fill(0); for (const b of data) { const f = b ^ r.shift(); r.push(0); for (let i = 0; i < n; i++) r[i] ^= mul(g[i + 1], f); } return r; }
  const bit = (v, i) => ((v >>> i) & 1) !== 0;

  function matrix(text, level) {
    const E = ECL[level], data = Array.from(new TextEncoder().encode(text));
    let ver = 1, dataCap = 0;
    for (; ver <= 10; ver++) {
      dataCap = RAW[ver - 1] - E.ecc[ver - 1] * E.blocks[ver - 1];
      if (4 + (ver < 10 ? 8 : 16) + data.length * 8 <= dataCap * 8) break;
    }
    if (ver > 10) throw new Error('QR: надто довгий текст');
    const bb = [], put = (v, n) => { for (let i = n - 1; i >= 0; i--) bb.push((v >>> i) & 1); };
    put(4, 4); put(data.length, ver < 10 ? 8 : 16); data.forEach(b => put(b, 8));
    const cap = dataCap * 8; put(0, Math.min(4, cap - bb.length)); while (bb.length % 8) bb.push(0);
    for (let p = 0xec; bb.length < cap; p ^= 0xec ^ 0x11) put(p, 8);
    const cw = []; for (let i = 0; i < bb.length; i += 8) { let v = 0; for (let j = 0; j < 8; j++) v = (v << 1) | bb[i + j]; cw.push(v); }
    const nb = E.blocks[ver - 1], el = E.ecc[ver - 1], shortLen = Math.floor(dataCap / nb), longCount = dataCap % nb;
    const blocks = []; let pos = 0;
    for (let i = 0; i < nb; i++) { const len = shortLen + (i >= nb - longCount ? 1 : 0); const d = cw.slice(pos, pos + len); pos += len; blocks.push({ d, e: rs(d, el) }); }
    const out = [];
    for (let i = 0; i < shortLen + (longCount ? 1 : 0); i++) blocks.forEach(b => { if (i < b.d.length) out.push(b.d[i]); });
    for (let i = 0; i < el; i++) blocks.forEach(b => out.push(b.e[i]));

    const size = ver * 4 + 17;
    const m = Array.from({ length: size }, () => new Array(size).fill(false));
    const fn = Array.from({ length: size }, () => new Array(size).fill(false));
    const setF = (x, y, v) => { if (x >= 0 && x < size && y >= 0 && y < size) { m[y][x] = v; fn[y][x] = true; } };
    const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)); setF(cx + dx, cy + dy, d !== 2 && d !== 4); } };
    for (let i = 0; i < size; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    const al = ALIGN[ver - 1], last = al.length - 1;
    for (let a = 0; a < al.length; a++) for (let b = 0; b < al.length; b++) {
      if ((a === 0 && b === 0) || (a === 0 && b === last) || (a === last && b === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setF(al[a] + dx, al[b] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    function drawFormat(mask) {
      const d0 = (E.bits << 3) | mask; let r = d0; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const bits = ((d0 << 10) | r) ^ 0x5412;
      for (let i = 0; i <= 5; i++) setF(8, i, bit(bits, i));
      setF(8, 7, bit(bits, 6)); setF(8, 8, bit(bits, 7)); setF(7, 8, bit(bits, 8));
      for (let i = 9; i < 15; i++) setF(14 - i, 8, bit(bits, i));
      for (let i = 0; i < 8; i++) setF(size - 1 - i, 8, bit(bits, i));
      for (let i = 8; i < 15; i++) setF(8, size - 15 + i, bit(bits, i));
      setF(8, size - 8, true);
    }
    drawFormat(0);
    if (ver >= 7) {
      let r = ver; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
      const bits = (ver << 12) | r;
      for (let i = 0; i < 18; i++) { const c = bit(bits, i), a = size - 11 + (i % 3), b = Math.floor(i / 3); setF(a, b, c); setF(b, a, c); }
    }
    let k = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
        const x = right - j, y = ((right + 1) & 2) === 0 ? size - 1 - vert : vert;
        if (!fn[y][x] && k < out.length * 8) { m[y][x] = bit(out[k >>> 3], 7 - (k & 7)); k++; }
      }
    }
    const MASK = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x, y) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
      (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0];
    function apply(mask) { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && MASK[mask](x, y)) m[y][x] = !m[y][x]; }
    function penalty() {
      let p = 0;
      for (let pass = 0; pass < 2; pass++) for (let a = 0; a < size; a++) {
        let run = 1, prev = null, hist = '';
        for (let b = 0; b < size; b++) {
          const v = pass ? m[b][a] : m[a][b];
          hist += v ? '1' : '0';
          if (v === prev) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else { run = 1; prev = v; }
        }
        const re = /1011101(?=0000)|(?<=0000)1011101/g; let mt; while ((mt = re.exec(hist))) p += 40;
      }
      for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) { const v = m[y][x]; if (v === m[y][x + 1] && v === m[y + 1][x] && v === m[y + 1][x + 1]) p += 3; }
      let dark = 0; for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (m[y][x]) dark++;
      p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
      return p;
    }
    let best = 0, bp = Infinity;
    for (let mk = 0; mk < 8; mk++) { apply(mk); drawFormat(mk); const p = penalty(); if (p < bp) { bp = p; best = mk; } apply(mk); }
    apply(best); drawFormat(best);
    return m;
  }

  /* logo — картинка (data:…) посередині коду, напр. пластова лілея; тоді рівень H (до 30 % коду може бути закрито) */
  function qrSvg(text, px, logo) {
    let m, lg = '';
    if (logo) { try { m = matrix(text, 'H'); } catch (e) { m = null; } }
    if (!m) { logo = ''; try { m = matrix(text, 'M'); } catch (e) { m = matrix(text, 'L'); } }
    const n = m.length; let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (m[y][x]) d += 'M' + (x + 4) + ' ' + (y + 4) + 'h1v1h-1z';
    const s = n + 8;
    if (logo) { const bw = Math.round(n * 0.28), bh = Math.round(bw * 1.15), bx = (s - bw) / 2, by = (s - bh) / 2;
      lg = '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" rx="' + (bw * 0.18) + '" fill="#fff"/><image href="' + logo + '" x="' + (bx + bw * 0.12) + '" y="' + (by + bh * 0.08) + '" width="' + (bw * 0.76) + '" height="' + (bh * 0.84) + '" preserveAspectRatio="xMidYMid meet"/>'; }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + ' ' + s + '" width="' + (px || 220) + '" height="' + (px || 220) + '" shape-rendering="crispEdges" role="img" aria-label="QR-код"><rect width="' + s + '" height="' + s + '" fill="#fff"/><path d="' + d + '" fill="#000"/>' + lg + '</svg>';
  }
  root.qrSvg = qrSvg; root.qrMatrix = matrix;
})(typeof window !== 'undefined' ? window : globalThis);
