/* QR-код без зовнішніх сервісів (10.11.2026): байтовий режим, рівень M (довгі — L), версії 1–20.
   За описом стандарту ISO/IEC 18004 (як у відкритому генераторі Nayuki). Вбудовується в діалог «Посилання для гуртка»
   (posylannia.html → pryimach.gs, скрипт zibraty_pryimach.py). qrMatrytsia(tekst) → масив рядків true/false. */
var QR = (function () {
  var ECC = {M: [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26],
             L: [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28]};
  var BLK = {M: [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16],
             L: [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8]};
  var FMT = {L: 1, M: 0};
  function raw(v) { var r = (16 * v + 128) * v + 64; if (v >= 2) { var n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; } return r; }
  function dataCw(v, l) { return Math.floor(raw(v) / 8) - ECC[l][v] * BLK[l][v]; }
  function mul(x, y) { var z = 0; for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z; }
  function divisor(d) { var r = []; for (var i = 0; i < d; i++) r.push(0); r[d - 1] = 1; var root = 1;
    for (i = 0; i < d; i++) { for (var j = 0; j < d; j++) { r[j] = mul(r[j], root); if (j + 1 < d) r[j] ^= r[j + 1]; } root = mul(root, 2); } return r; }
  function remainder(data, dv) { var r = dv.map(function () { return 0; });
    data.forEach(function (b) { var f = b ^ r.shift(); r.push(0); dv.forEach(function (c, i) { r[i] ^= mul(c, f); }); }); return r; }
  function bytes(s) { var u = unescape(encodeURIComponent(s)), o = []; for (var i = 0; i < u.length; i++) o.push(u.charCodeAt(i)); return o; }
  function alignPos(v, size) { if (v === 1) return []; var n = Math.floor(v / 7) + 2, step = Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2, r = [6];
    for (var i = 0, p = size - 7; i < n - 1; i++, p -= step) r.splice(1, 0, p); return r; }

  function matrytsia(tekst) {
    var b = bytes(tekst), v, l = 'M';
    for (v = 1; v <= 20; v++) if (4 + (v < 10 ? 8 : 16) + b.length * 8 <= dataCw(v, 'M') * 8) break;
    if (v > 20) { l = 'L'; for (v = 1; v <= 20; v++) if (4 + (v < 10 ? 8 : 16) + b.length * 8 <= dataCw(v, 'L') * 8) break; }
    if (v > 20) throw new Error('Задовгий текст для QR');
    // біти даних
    var bits = [], put = function (x, n) { for (var i = n - 1; i >= 0; i--) bits.push((x >>> i) & 1); };
    put(4, 4); put(b.length, v < 10 ? 8 : 16); b.forEach(function (x) { put(x, 8); });
    var cap = dataCw(v, l) * 8; put(0, Math.min(4, cap - bits.length)); put(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var data = []; for (var i = 0; i < bits.length; i += 8) { var x = 0; for (var k = 0; k < 8; k++) x = (x << 1) | bits[i + k]; data.push(x); }
    // блоки й виправлення помилок
    var nb = BLK[l][v], el = ECC[l][v], rc = Math.floor(raw(v) / 8), ns = nb - rc % nb, sl = Math.floor(rc / nb), dv = divisor(el), bl = [];
    for (i = 0, k = 0; i < nb; i++) { var d = data.slice(k, k + sl - el + (i < ns ? 0 : 1)); k += d.length; var e = remainder(d, dv); if (i < ns) d.push(0); bl.push(d.concat(e)); }
    var cw = []; for (i = 0; i < bl[0].length; i++) for (var j = 0; j < nb; j++) if (i !== sl - el || j >= ns) cw.push(bl[j][i]);
    // поле
    var size = v * 4 + 17, m = [], fn = [];
    for (i = 0; i < size; i++) { m.push([]); fn.push([]); for (j = 0; j < size; j++) { m[i].push(false); fn[i].push(false); } }
    var set = function (x, y, dark) { m[y][x] = dark; fn[y][x] = true; };
    for (i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(function (c) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) { var dist = Math.max(Math.abs(dx), Math.abs(dy)), xx = c[0] + dx, yy = c[1] + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) set(xx, yy, dist !== 2 && dist !== 4); } });
    var ap = alignPos(v, size), na = ap.length;
    for (i = 0; i < na; i++) for (j = 0; j < na; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue;
      for (var dy2 = -2; dy2 <= 2; dy2++) for (var dx2 = -2; dx2 <= 2; dx2++) set(ap[i] + dx2, ap[j] + dy2, Math.max(Math.abs(dx2), Math.abs(dy2)) !== 1); }
    var format = function (mask) {
      var dd = (FMT[l] << 3) | mask, r = dd; for (var q = 0; q < 10; q++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      var f = ((dd << 10) | r) ^ 0x5412, bit = function (q) { return ((f >>> q) & 1) !== 0; };
      for (q = 0; q <= 5; q++) set(8, q, bit(q));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (q = 9; q < 15; q++) set(14 - q, 8, bit(q));
      for (q = 0; q < 8; q++) set(size - 1 - q, 8, bit(q));
      for (q = 8; q < 15; q++) set(8, size - 15 + q, bit(q));
      set(8, size - 8, true);
    };
    format(0);
    if (v >= 7) { var r = v; for (i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25); var vb = (v << 12) | r;
      for (i = 0; i < 18; i++) { var bt = ((vb >>> i) & 1) !== 0, a = size - 11 + i % 3, c2 = Math.floor(i / 3); set(a, c2, bt); set(c2, a, bt); } }
    // дані змійкою
    var n = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (j = 0; j < 2; j++) {
        var xx = right - j, up = ((right + 1) & 2) === 0, yy = up ? size - 1 - vert : vert;
        if (!fn[yy][xx] && n < cw.length * 8) { m[yy][xx] = ((cw[n >>> 3] >>> (7 - (n & 7))) & 1) !== 0; n++; } } }
    // маска з найменшим штрафом
    var MASK = [function (x, y) { return (x + y) % 2 === 0; }, function (x, y) { return y % 2 === 0; }, function (x) { return x % 3 === 0; },
      function (x, y) { return (x + y) % 3 === 0; }, function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
      function (x, y) { return x * y % 2 + x * y % 3 === 0; }, function (x, y) { return (x * y % 2 + x * y % 3) % 2 === 0; },
      function (x, y) { return ((x + y) % 2 + x * y % 3) % 2 === 0; }];
    var apply = function (k) { for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) if (!fn[y][x] && MASK[k](x, y)) m[y][x] = !m[y][x]; };
    var best = 0, min = Infinity;
    for (k = 0; k < 8; k++) { apply(k); format(k); var p = shtraf(m, size); if (p < min) { min = p; best = k; } apply(k); }
    apply(best); format(best);
    return m;
  }

  function shtraf(m, size) {
    var p = 0, dark = 0, x, y;
    var linii = function (get) {
      for (var a = 0; a < size; a++) { var run = 1, s = ''; for (var b = 0; b < size; b++) { var c = get(a, b); s += c ? '1' : '0';
        if (b > 0) { if (c === get(a, b - 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } }
        s = '0000' + s + '0000'; var re = /(?=(00001011101|10111010000))/g, t; while ((t = re.exec(s))) { p += 40; re.lastIndex++; } } };
    linii(function (a, b) { return m[a][b]; }); linii(function (a, b) { return m[b][a]; });
    for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) { var c = m[y][x]; if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3; }
    for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (m[y][x]) dark++;
    var tot = size * size; p += (Math.ceil(Math.abs(dark * 20 - tot * 10) / tot) - 1) * 10;
    return p;
  }

  // SVG: темні клітинки одним шляхом, тихе поле — 4 клітинки
  function svg(tekst, px) {
    var m = matrytsia(tekst), n = m.length, q = 4, d = '';
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (m[y][x]) d += 'M' + (x + q) + ' ' + (y + q) + 'h1v1h-1z';
    var w = n + 2 * q;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + w + '" width="' + px + '" height="' + px + '" shape-rendering="crispEdges">' +
      '<rect width="' + w + '" height="' + w + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }
  return {matrytsia: matrytsia, svg: svg};
})();
if (typeof module !== 'undefined') module.exports = QR;
