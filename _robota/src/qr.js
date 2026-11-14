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
  /* Стиль сайту (21.10.2026, власник обрав варіант 8): темне тло, світлі круглі крапки, зелені «очі», пластова лілея.
     qrSvg(текст, px) — так скрізь (пульт, СКОБ, «Вивчай сам»); qrSvg(текст, px, {eye:…}) — інші кольори; qrSvg(текст, px, false) — простий чорно-білий. */
  const LILY = 'data:image/webp;base64,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';
  const STYLE = { logo: LILY, bg: '#1b1d21', dark: '#e8f3ec', eye: '#62cf93', eyeIn: '#e8f3ec', rx: 0.1 };
  function qrSvg(text, px, opt) {
    if (opt === false) return qrPlain(text, px);
    if (typeof opt === 'string') return qrPlain(text, px, opt);   // старий виклик: qrSvg(текст, px, лого)
    return qrPretty(text, px, Object.assign({}, STYLE, opt || {}));
  }
  function qrPlain(text, px, logo, eye) {
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
    opt = opt || {}; let m; try { m = matrix(text, 'H'); } catch (e) { return qrPlain(text, px); }
    const n = m.length, q = 3, s = n + 2 * q, c = s / 2, dark = opt.dark || '#16181c', eye = opt.eye || dark, eyeIn = opt.eyeIn || eye;
    const R = opt.logo || opt.mark ? n * 0.17 : 0;   // радіус порожнього кола під лілею (у модулях)
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
    if (R && opt.mark) lg = opt.mark(c, R);   /* свій знак прямо в SVG (бере шрифти сторінки) */
    else if (R) { const h = R * (opt.logoH || 1.62), w = h * (opt.logoA || 0.82); lg = '<image href="' + opt.logo + '" x="' + (c - w / 2).toFixed(2) + '" y="' + (c - h / 2).toFixed(2) + '" width="' + w.toFixed(2) + '" height="' + h.toFixed(2) + '" preserveAspectRatio="xMidYMid meet"/>'; }
    const gid = 'qg' + Math.random().toString(36).slice(2, 7), bg = opt.bg || '#fff';
    const fillD = opt.grad ? 'url(#' + gid + ')' : dark;
    const defs = opt.grad ? '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + opt.grad[0] + '"/><stop offset="1" stop-color="' + opt.grad[1] + '"/></linearGradient></defs>' : '';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + ' ' + s + '" width="' + (px || 220) + '" height="' + (px || 220) + '" role="img" aria-label="QR-код">' + defs + (bg === 'none' ? '' : '<rect width="' + s + '" height="' + s + '" rx="' + (s * (opt.rx == null ? 0.06 : opt.rx)) + '" fill="' + bg + '"/>') + '<path d="' + d + '" fill="' + fillD + '"/><path d="' + eyes + '" fill="' + eye + '" fill-rule="evenodd"/><path d="' + inner + '" fill="' + eyeIn + '"/>' + lg + '</svg>';
  }
  root.qrSvg = qrSvg; root.qrPlain = qrPlain; root.qrPretty = qrPretty; root.qrMatrix = matrix;
})(typeof window !== 'undefined' ? window : globalThis);
