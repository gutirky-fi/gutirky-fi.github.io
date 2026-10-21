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

  /* logo — картинка (data:…) посередині коду, напр. пластова лілея. Тоді рівень H (до 30 % коду може бути закрито),
     модулі — круглі крапки, «очі» в кутах — заокруглені, а під знаком модулі прибрано (без білої плашки).
     eye — колір «очей» (необов'язково). */
  function qrSvg(text, px, logo, eye) {
    let m = null;
    if (logo) { try { m = matrix(text, 'H'); } catch (e) { m = null; } }
    if (!m) { logo = ''; try { m = matrix(text, 'M'); } catch (e) { m = matrix(text, 'L'); } }
    const n = m.length, s = n + 8, Q = 4, ink = '#15171a';
    if (!logo) {
      let d = '';
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (m[y][x]) d += 'M' + (x + Q) + ' ' + (y + Q) + 'h1v1h-1z';
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + ' ' + s + '" width="' + (px || 220) + '" height="' + (px || 220) + '" shape-rendering="crispEdges" role="img" aria-label="QR-код"><rect width="' + s + '" height="' + s + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
    }
    const inEye = (x, y) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
    const c = n / 2, R = n * 0.15;   /* місце під лілею */
    let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (!m[y][x] || inEye(x, y)) continue;
      const dx = x + 0.5 - c, dy = (y + 0.5 - c) / 1.12;
      if (Math.hypot(dx, dy) < R + 0.6) continue;
      const cx = x + Q + 0.5, cy = y + Q + 0.5, r = 0.46;
      d += 'M' + (cx - r) + ' ' + cy + 'a' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0';
    }
    const ec = eye || ink;
    const eyeAt = (x, y) => '<rect x="' + (x + 0.5) + '" y="' + (y + 0.5) + '" width="6" height="6" rx="1.9" fill="none" stroke="' + ec + '" stroke-width="1"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" rx="0.9" fill="' + ec + '"/>';
    const lw = R * 2 * 0.78, lh = lw * 1.2;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + ' ' + s + '" width="' + (px || 220) + '" height="' + (px || 220) + '" role="img" aria-label="QR-код"><rect width="' + s + '" height="' + s + '" rx="3" fill="#fff"/>'
      + '<path d="' + d + '" fill="' + ink + '"/>' + eyeAt(Q, Q) + eyeAt(Q + n - 7, Q) + eyeAt(Q, Q + n - 7)
      + '<image href="' + logo + '" x="' + (Q + c - lw / 2) + '" y="' + (Q + c - lh / 2) + '" width="' + lw + '" height="' + lh + '" preserveAspectRatio="xMidYMid meet"/></svg>';
  }
  /* Гарний QR (як у банків): круглі «крапки», округлі «очі» в кутах, посередині — вільне коло з лілеєю.
     opt: {logo, dark, eye, eyeIn} — кольори; рівень H, тож середина може бути порожньою. */
  function qrPretty(text, px, opt) {
    opt = opt || {}; let m; try { m = matrix(text, 'H'); } catch (e) { return qrSvg(text, px); }
    const n = m.length, q = 3, s = n + 2 * q, c = s / 2, dark = opt.dark || '#16181c', eye = opt.eye || dark, eyeIn = opt.eyeIn || eye;
    const R = opt.logo ? n * 0.17 : 0;   // радіус порожнього кола під лілею (у модулях)
    const inEye = (x, y) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
    let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (!m[y][x] || inEye(x, y)) continue;
      const cx = x + q + 0.5, cy = y + q + 0.5;
      if (R && Math.hypot(cx - c, cy - c) < R + 0.5) continue;
      const dr = opt.dot == null ? 0.43 : opt.dot;   // радіус крапки (0.5 — квадрат із заокругленням)
      if (dr >= 0.5) { const k = opt.dotR == null ? 0.25 : opt.dotR; d += 'M' + (x + q + k) + ' ' + (y + q) + 'h' + (1 - 2 * k) + 'a' + k + ' ' + k + ' 0 0 1 ' + k + ' ' + k + 'v' + (1 - 2 * k) + 'a' + k + ' ' + k + ' 0 0 1-' + k + ' ' + k + 'h-' + (1 - 2 * k) + 'a' + k + ' ' + k + ' 0 0 1-' + k + '-' + k + 'v-' + (1 - 2 * k) + 'a' + k + ' ' + k + ' 0 0 1 ' + k + '-' + k + 'z'; }
      else d += 'M' + (cx - dr).toFixed(2) + ' ' + cy + 'a' + dr + ' ' + dr + ' 0 1 0 ' + (2 * dr) + ' 0a' + dr + ' ' + dr + ' 0 1 0-' + (2 * dr) + ' 0';
    }
    const rr = (x, y, w, r) => 'M' + (x + r) + ' ' + y + 'h' + (w - 2 * r) + 'a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + r + 'v' + (w - 2 * r) + 'a' + r + ' ' + r + ' 0 0 1-' + r + ' ' + r + 'h-' + (w - 2 * r) + 'a' + r + ' ' + r + ' 0 0 1-' + r + '-' + r + 'v-' + (w - 2 * r) + 'a' + r + ' ' + r + ' 0 0 1 ' + r + '-' + r + 'z';
    let eyes = '', inner = '';
    [[0, 0], [n - 7, 0], [0, n - 7]].forEach(([ex, ey]) => {
      const X = ex + q, Y = ey + q;
      const er = opt.eyeR == null ? 2.2 : opt.eyeR; eyes += rr(X, Y, 7, er) + rr(X + 1, Y + 1, 5, Math.max(0.01, er * 0.64));   // кільце (evenodd)
      inner += rr(X + 2, Y + 2, 3, Math.max(0.01, er * 0.41));
    });
    let lg = '';
    if (R) { const h = R * 1.62, w = h * 0.82; lg = '<image href="' + opt.logo + '" x="' + (c - w / 2).toFixed(2) + '" y="' + (c - h / 2).toFixed(2) + '" width="' + w.toFixed(2) + '" height="' + h.toFixed(2) + '" preserveAspectRatio="xMidYMid meet"/>'; }
    const gid = 'qg' + Math.random().toString(36).slice(2, 7), bg = opt.bg || '#fff';
    const fillD = opt.grad ? 'url(#' + gid + ')' : dark;
    const defs = opt.grad ? '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + opt.grad[0] + '"/><stop offset="1" stop-color="' + opt.grad[1] + '"/></linearGradient></defs>' : '';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + ' ' + s + '" width="' + (px || 220) + '" height="' + (px || 220) + '" role="img" aria-label="QR-код">' + defs + (bg === 'none' ? '' : '<rect width="' + s + '" height="' + s + '" rx="' + (s * (opt.rx == null ? 0.06 : opt.rx)) + '" fill="' + bg + '"/>') + '<path d="' + d + '" fill="' + fillD + '"/><path d="' + eyes + '" fill="' + eye + '" fill-rule="evenodd"/><path d="' + inner + '" fill="' + eyeIn + '"/>' + lg + '</svg>';
  }
  root.qrSvg = qrSvg; root.qrPretty = qrPretty; root.qrMatrix = matrix;
})(typeof window !== 'undefined' ? window : globalThis);
