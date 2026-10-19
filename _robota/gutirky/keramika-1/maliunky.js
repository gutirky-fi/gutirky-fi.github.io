/* Малюнки для гутірки «Кераміка І» — теплий «пічний» стиль у дусі сайту (Д1):
   темне тло, глина теракотова, світіння контурів як від печі, глазурі — бірюзова й зелена, підписи — у «таблетках».
   Усе — SVG у коді (працює без інтернету); карта осередків — картинка з «Кераміки України» ({{KMAP}}).
   Титулка: 3D-ваза на гончарному крузі (three.js з cdnjs); якщо не завантажиться — лишається малюнок.
   API (той самий, що в «Будові ЛА»): LA_ART.get(ключ) → <svg>; LA_ART.mount3D(el, {hero}) → stop(); LA_ART.fit(el) */
(function () {
  'use strict';
  const K = { line: '#ffb27a', hi: '#ffd9bd', gd: '#ffc247', gdHi: '#ffe08a', ac: '#2fd2c0', acHi: '#9ff5ea', ink: '#fff4e8', mut: '#c9b29c', bg: '#1d1511', clay: '#d2693c', green: '#3ee08f' };
  const still = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
  let U = 0; const uid = () => 'k' + (++U);
  const f = n => Math.round(n * 10) / 10;
  function cr(pts) {   // плавна крива через точки (Catmull-Rom → Безьє)
    let d = '';
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])} `;
    }
    return d;
  }
  const hg = (id, a, b, c, d) => `<linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${a}"/><stop offset=".36" stop-color="${b}"/><stop offset=".62" stop-color="${c}"/><stop offset="1" stop-color="${d}"/></linearGradient>`;
  function defs(id) {
    return `<defs>
${hg(id + 'cl', '#5e2410', '#ec9566', '#c8643a', '#4e1d0c')}
${hg(id + 'raw', '#3d2d22', '#ab8c71', '#866850', '#33261d')}
${hg(id + 'dry', '#6a5644', '#e6d2b8', '#c7ae90', '#5a4838')}
${hg(id + 'bis', '#8a5a40', '#f6d7bd', '#e2b694', '#7a4c34')}
${hg(id + 'cr', '#8a8276', '#fffaf1', '#ebe2d3', '#7b7368')}
${hg(id + 'gr', '#33302c', '#aaa59c', '#827c73', '#2c2a27')}
${hg(id + 'tl', '#0a4a42', '#7aeee0', '#2fbfae', '#08403a')}
${hg(id + 'gn', '#12301f', '#86d9a4', '#3b8a63', '#0f2a1b')}
${hg(id + 'pl', '#8b939c', '#f6f8fa', '#dde2e7', '#7f8790')}
${hg(id + 'bf', '#7a5126', '#f2c48e', '#d9a066', '#6a4420')}
<linearGradient id="${id}gd" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffe28e"/><stop offset="1" stop-color="#e09a12"/></linearGradient>
<linearGradient id="${id}sl" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e6d3b9"/><stop offset="1" stop-color="#b79c7c"/></linearGradient>
<linearGradient id="${id}th" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#7a2a10"/><stop offset=".35" stop-color="#e2541f"/><stop offset=".7" stop-color="#ffb347"/><stop offset="1" stop-color="#fff6d8"/></linearGradient>
<radialGradient id="${id}fi" cx=".5" cy=".85" r=".8"><stop offset="0" stop-color="#fff3b0"/><stop offset=".45" stop-color="#ffb347"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}wd" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#454b54"/><stop offset="1" stop-color="#16191e"/></radialGradient>
<radialGradient id="${id}mo" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#4a2414"/><stop offset="1" stop-color="#140904"/></radialGradient>
<radialGradient id="${id}sp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb27a" stop-opacity=".28"/><stop offset="1" stop-color="#ffb27a" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}lt" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6e0" stop-opacity=".95"/><stop offset=".5" stop-color="#ffd9a0" stop-opacity=".35"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient>
<filter id="${id}n" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b2"/><feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="b1"/><feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<marker id="${id}a" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="${K.gd}"/></marker>
<marker id="${id}at" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="${K.ac}"/></marker>
</defs>`;
  }
  const svg = (w, h, label, id, body) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${defs(id)}${body}</svg>`;

  /* ---------- «таблетки»-підписи (як у «Будові ЛА») ---------- */
  const CW = ch => /[A-ZА-ЯІЇЄҐ0-9]/.test(ch) ? .63 : ch === ' ' ? .25 : /[.,:;'’!«»()—–\-·°]/.test(ch) ? .36 : /[шщжмюф]/.test(ch) ? .74 : .53;
  const tw = (s, fs) => [...s].reduce((a, c) => a + CW(c), 0) * fs;
  const COL = { ink: [K.line, '#ffffff'], gd: [K.gd, K.gd], ac: [K.ac, K.ac], mut: ['#6b5a4c', K.mut] };
  const FS = 1.25;   // підписи трохи більші, ніж у «Будові ЛА»: на проєкторі їх читають з кінця кімнати
  function pill(x, y, t, an = 'middle', col = 'ink', fs = 15, big) {
    fs = f(fs * FS);
    const L = String(t).split('\n'), pad = fs * (big ? .8 : .72), lh = fs * 1.16;
    const w = Math.max(...L.map(l => tw(l, fs))) + pad * 2, h = L.length * lh + fs * (big ? .9 : .66);
    const rx = an === 'end' ? x - w : an === 'middle' ? x - w / 2 : x, ry = y - h / 2, cx = rx + w / 2;
    const [bd, tc] = COL[col] || COL.ink;
    return `<g class="la-pill" data-an="${an}" data-x="${f(x)}" data-pad="${f(pad)}"><rect x="${f(rx)}" y="${f(ry)}" width="${f(w)}" height="${f(h)}" rx="${f(Math.min(h / 2, fs * 1.05))}" fill="${K.bg}" fill-opacity=".93" stroke="${bd}" stroke-width="${big ? 2 : 1.6}"/>` +
      `<text font-size="${fs}" fill="${tc}" font-weight="700" text-anchor="middle">${L.map((l, i) => `<tspan x="${f(cx)}" y="${f(y + (i - (L.length - 1) / 2) * lh + fs * .35)}">${l}</tspan>`).join('')}</text></g>`;
  }
  function LAB(x1, y1, x2, y2, t, an = 'start', col = 'ink', fs = 15) {   // виноска: точка → злам → «таблетка»
    const bd = (COL[col] || COL.ink)[0], k = an === 'end' ? x2 + 16 : x2 - 16;
    const d = an === 'middle' ? `M${x1},${y1} L${x2},${y2}` : `M${x1},${y1} L${k},${y2} L${x2},${y2}`;
    return `<path d="${d}" fill="none" stroke="${bd}" stroke-width="1.5" stroke-linejoin="round" opacity=".9"/><circle cx="${x1}" cy="${y1}" r="3.6" fill="#ffffff" stroke="${bd}" stroke-width="2"/>` + pill(x2, y2, t, an, col, fs);
  }
  function fit(root) {
    try {
      (root || document).querySelectorAll('g.la-pill').forEach(g => {
        const r = g.querySelector('rect'), ts = [...g.querySelectorAll('tspan')]; if (!r || !ts.length) return;
        let w = 0; ts.forEach(t => { w = Math.max(w, t.getComputedTextLength()); }); if (!w) return;
        const pad = +g.dataset.pad, x = +g.dataset.x, an = g.dataset.an, W = w + pad * 2;
        const rx = an === 'end' ? x - W : an === 'middle' ? x - W / 2 : x;
        r.setAttribute('x', f(rx)); r.setAttribute('width', f(W)); ts.forEach(t => t.setAttribute('x', f(rx + W / 2)));
      });
    } catch (e) { /* лишаємо оцінку */ }
  }
  const arrow = (id, x1, y1, x2, y2, c = 'a') => `<path d="M${x1},${y1} L${x2},${y2}" stroke="${c === 'at' ? K.ac : K.gd}" stroke-width="3" fill="none" marker-end="url(#${id}${c})"/>`;
  const spot = (id, cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id}sp)"/>`;
  const shadow = (cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${f(rx * .16)}" fill="#000" opacity=".35"/>`;

  /* ---------- посудина за профілем: [[висота, радіус], …] від дна до вінця ---------- */
  const PR = {
    pot: [[0, 30], [10, 46], [32, 60], [56, 62], [78, 52], [90, 40], [96, 38], [102, 42]],
    jug: [[0, 26], [10, 42], [34, 54], [54, 50], [70, 34], [82, 22], [98, 19], [108, 24]],
    bowl: [[0, 22], [8, 40], [20, 56], [34, 66]],
    piala: [[0, 20], [6, 32], [20, 48], [36, 56]],
    vase: [[0, 24], [18, 44], [42, 42], [66, 24], [86, 17], [104, 22], [114, 30]],
    cup: [[0, 25], [28, 30], [50, 33], [56, 34]],
    cyl: [[0, 34], [60, 33], [84, 34]],
    amph: [[0, 3], [14, 18], [40, 42], [70, 44], [96, 30], [116, 14], [132, 12], [140, 16]],
    vazon: [[0, 28], [56, 42], [58, 48], [72, 48]]
  };
  const rAt = (prof, h) => { for (let i = 1; i < prof.length; i++) if (h <= prof[i][0]) { const [h0, r0] = prof[i - 1], [h1, r1] = prof[i]; return r0 + (r1 - r0) * (h - h0) / (h1 - h0 || 1); } return prof[prof.length - 1][1]; };
  function vessel(cx, by, key, s, fill, o = {}) {
    const prof = PR[key].map(([h, r]) => [h * s, r * s]);
    const L = prof.map(([h, r]) => [cx - r, by - h]), R = prof.map(([h, r]) => [cx + r, by - h]).reverse();
    const top = prof[prof.length - 1], rT = top[1], yT = by - top[0], ryT = Math.max(3, rT * .2), r0 = prof[0][1];
    const st = o.stroke || K.line, sw = o.sw || 2;
    let g = `<path d="M${f(L[0][0])},${f(L[0][1])} ${cr(L)}L${f(R[0][0])},${f(R[0][1])} ${cr(R)}Q${f(cx)},${f(by + r0 * .3)} ${f(L[0][0])},${f(L[0][1])}Z" fill="${fill}" stroke="${st}" stroke-width="${sw}" stroke-linejoin="round"/>`;
    (o.bands || []).forEach(([h, c, w]) => { const r = rAt(prof, h * s), y = by - h * s; g += `<path d="M${f(cx - r)},${f(y)} A${f(r)},${f(r * .2)} 0 0 0 ${f(cx + r)},${f(y)}" fill="none" stroke="${c}" stroke-width="${w || 3}" stroke-linecap="round"/>`; });
    if (o.deco) g += o.deco(prof, cx, by);
    const hl = prof.filter(([h]) => h > top[0] * .12 && h < top[0] * .85).map(([h, r]) => [cx - r * .55, by - h]);
    if (hl.length > 1) g += `<path d="M${f(hl[0][0])},${f(hl[0][1])} ${cr(hl)}" fill="none" stroke="#ffffff" stroke-opacity="${o.gloss ? .55 : .2}" stroke-width="${o.gloss ? 4 : 3}" stroke-linecap="round"/>`;
    if (o.rim !== false) g += `<ellipse cx="${f(cx)}" cy="${f(yT)}" rx="${f(rT)}" ry="${f(ryT)}" fill="${o.mouth || 'url(#' + o.id + 'mo)'}" stroke="${st}" stroke-width="${sw}"/>`;
    return g;
  }
  function handle(cx, by, s, key, side = 1, fill = K.clay, h1 = .82, h2 = .42, out = 34) {   // вушко глека / чашки
    const prof = PR[key], H = prof[prof.length - 1][0];
    const ya = by - H * h1 * s, yb = by - H * h2 * s, xa = cx + side * rAt(prof, H * h1) * s, xb = cx + side * rAt(prof, H * h2) * s;
    return `<path d="M${f(xa)},${f(ya)} C${f(xa + side * out * s)},${f(ya - 6 * s)} ${f(xb + side * out * s)},${f(yb - 4 * s)} ${f(xb)},${f(yb)}" fill="none" stroke="${fill}" stroke-width="${f(8 * s)}" stroke-linecap="round"/>` +
      `<path d="M${f(xa)},${f(ya)} C${f(xa + side * out * s)},${f(ya - 6 * s)} ${f(xb + side * out * s)},${f(yb - 4 * s)} ${f(xb)},${f(yb)}" fill="none" stroke="${K.line}" stroke-width="1.4" stroke-opacity=".7"/>`;
  }
  /* візерунки */
  const spiral = (cx, cy, r, c = '#fff3dc', w = 2.4) => { let d = `M${f(cx)},${f(cy)}`; for (let a = 0; a < Math.PI * 5; a += .3) { const rr = r * a / (Math.PI * 5); d += ` L${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr * .8)}`; } return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`; };
  const flower = (cx, cy, r, c1 = '#2f7fd9', c2 = '#ffc247', c3 = '#3b8a63') =>
    `<g>${[0, 72, 144, 216, 288].map(a => `<ellipse cx="${f(cx + Math.cos(a * Math.PI / 180) * r * .55)}" cy="${f(cy + Math.sin(a * Math.PI / 180) * r * .55)}" rx="${f(r * .42)}" ry="${f(r * .24)}" transform="rotate(${a} ${f(cx + Math.cos(a * Math.PI / 180) * r * .55)} ${f(cy + Math.sin(a * Math.PI / 180) * r * .55)})" fill="${c1}"/>`).join('')}<circle cx="${cx}" cy="${cy}" r="${f(r * .26)}" fill="${c2}"/><path d="M${f(cx - r * 1.4)},${f(cy + r * .9)} q${f(r * .5)},${f(-r * .6)} ${f(r)},0" fill="none" stroke="${c3}" stroke-width="${f(r * .18)}" stroke-linecap="round"/><path d="M${f(cx + r * .5)},${f(cy + r * .9)} q${f(r * .5)},${f(-r * .6)} ${f(r)},0" fill="none" stroke="${c3}" stroke-width="${f(r * .18)}" stroke-linecap="round"/></g>`;
  const dots = (pts, r, c) => pts.map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${c}"/>`).join('');
  const zig = (x, y, w, h, n, c, sw = 2.4) => { let d = `M${x},${y}`; for (let i = 1; i <= n; i++) d += ` L${f(x + w * i / n)},${f(y + (i % 2 ? h : 0))}`; return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linejoin="round"/>`; };
  function lump(cx, by, w, h, fill) { return `<path d="M${cx - w},${by} C${cx - w},${by - h * .9} ${cx - w * .4},${by - h} ${cx},${by - h} C${cx + w * .5},${by - h} ${cx + w},${by - h * .8} ${cx + w},${by} Q${cx},${by + h * .18} ${cx - w},${by}Z" fill="${fill}" stroke="${K.line}" stroke-width="2"/>`; }
  function kahlya(x, y, w, fill, relief = '#ffe08a', id) {   // кахля спереду
    return `<rect x="${x}" y="${y}" width="${w}" height="${w}" rx="${w * .06}" fill="${fill}" stroke="${K.line}" stroke-width="2"/><rect x="${x + w * .1}" y="${y + w * .1}" width="${w * .8}" height="${w * .8}" rx="${w * .04}" fill="none" stroke="${relief}" stroke-width="2" stroke-opacity=".8"/>` +
      flower(x + w / 2, y + w * .46, w * .17, relief, '#ffffff', relief);
  }
  function wheelHead(cx, cy, rx, id, spinning = true) {
    return `<ellipse cx="${cx}" cy="${cy + rx * .07}" rx="${rx}" ry="${f(rx * .22)}" fill="#0f1114"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${f(rx * .22)}" fill="url(#${id}wd)" stroke="${K.gd}" stroke-width="2"/>` +
      (spinning ? `<ellipse cx="${cx}" cy="${cy}" rx="${f(rx * .8)}" ry="${f(rx * .17)}" fill="none" stroke="${K.gdHi}" stroke-width="2.4" class="la-flow" opacity=".75"/>` : '');
  }
  function plateSide(cx, cy, rx, fill, id, top) {   // тарілка трохи збоку
    return `<ellipse cx="${cx}" cy="${cy + rx * .1}" rx="${rx}" ry="${f(rx * .3)}" fill="${fill}" stroke="${K.line}" stroke-width="2"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${f(rx * .3)}" fill="${fill}" stroke="${K.line}" stroke-width="2"/><ellipse cx="${cx}" cy="${cy + 2}" rx="${f(rx * .62)}" ry="${f(rx * .18)}" fill="none" stroke="#000" stroke-opacity=".15" stroke-width="3"/>${top || ''}`;
  }
  function brick(x, y, w, h, d, id) {   // шамотна цегла в ізометрії
    const g = [[.2, .3], [.5, .6], [.7, .25], [.35, .75], [.85, .7], [.15, .65], [.6, .4], [.9, .35], [.42, .18]];
    return `<path d="M${x},${y + d} L${x + d},${y} L${x + w + d},${y} L${x + w},${y + d}Z" fill="#f0c48f" stroke="${K.line}" stroke-width="2"/>` +
      `<path d="M${x + w},${y + d} L${x + w + d},${y} L${x + w + d},${y + h} L${x + w},${y + h + d}Z" fill="#a8743f" stroke="${K.line}" stroke-width="2"/>` +
      `<rect x="${x}" y="${y + d}" width="${w}" height="${h}" fill="url(#${id}bf)" stroke="${K.line}" stroke-width="2"/>` +
      g.map(([a, b], i) => `<circle cx="${f(x + w * a)}" cy="${f(y + d + h * b)}" r="${i % 3 ? 2.6 : 3.6}" fill="${i % 2 ? '#7a4b22' : '#fff0d6'}" opacity=".85"/>`).join('');
  }
  /* предмети за видами кераміки (для «пар» і гри) */
  function obj(type, cx, by, s, id) {
    switch (type) {
      case 'terakota': return vessel(cx, by, 'vazon', s, `url(#${id}cl)`, { id, bands: [[57, '#7e3418', 4]] }) +
        `<g transform="translate(${cx},${f(by - 72 * s)}) scale(${s})"><path d="M0,0 C-6,-30 -30,-40 -46,-36 C-34,-22 -16,-12 0,0Z" fill="#3b8a63" stroke="#86d9a4" stroke-width="1.6"/><path d="M0,0 C6,-34 28,-48 44,-46 C34,-28 16,-14 0,0Z" fill="#3b8a63" stroke="#86d9a4" stroke-width="1.6"/><path d="M0,0 C-2,-26 2,-44 6,-60" fill="none" stroke="#86d9a4" stroke-width="3"/><ellipse cx="7" cy="-64" rx="9" ry="15" fill="#3b8a63" stroke="#86d9a4" stroke-width="1.6"/></g>`;
      case 'shamot': return brick(cx - 70 * s, by - 74 * s, 120 * s, 54 * s, 26 * s, id);
      case 'majolika': return plateSide(cx, by - 30 * s, 92 * s, '#f4ecdf', id, `<ellipse cx="${cx}" cy="${f(by - 30 * s + 92 * s * .1 + 2)}" rx="${f(92 * s)}" ry="${f(92 * s * .3)}" fill="none" stroke="#c8643a" stroke-width="3" stroke-dasharray="2 9" opacity=".7"/>` +
        `<g transform="translate(${cx},${f(by - 30 * s)}) scale(1,.32)">${flower(0, 0, 34 * s, '#2f7fd9', '#ffc247', '#3b8a63')}${[0, 60, 120, 180, 240, 300].map(a => `<circle cx="${f(Math.cos(a * Math.PI / 180) * 70 * s)}" cy="${f(Math.sin(a * Math.PI / 180) * 70 * s)}" r="${f(7 * s)}" fill="${a % 120 ? '#ffc247' : '#e2541f'}"/>`).join('')}</g>`);
      case 'fajans': return plateSide(cx, by - 30 * s, 92 * s, `url(#${id}cr)`, id, `<ellipse cx="${cx}" cy="${f(by - 30 * s)}" rx="${f(86 * s)}" ry="${f(86 * s * .3)}" fill="none" stroke="#2f7fd9" stroke-width="2.4"/><path d="M${f(cx - 60 * s)},${f(by - 38 * s)} q${f(26 * s)},${f(-10 * s)} ${f(54 * s)},${f(-8 * s)}" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity=".85"/>`);
      case 'kamyana': return vessel(cx, by, 'jug', s, `url(#${id}gr)`, { id, deco: (p, x, b) => dots([[x - 26 * s, b - 40 * s], [x + 18 * s, b - 52 * s], [x - 6 * s, b - 30 * s], [x + 30 * s, b - 34 * s], [x - 14 * s, b - 62 * s], [x + 6 * s, b - 46 * s]], f(5 * s), '#7a4b22') }) + handle(cx, by, s, 'jug', 1, '#827c73');
      case 'porcelyana': return `<ellipse cx="${cx}" cy="${f(by - 46 * s)}" rx="${f(86 * s)}" ry="${f(70 * s)}" fill="url(#${id}lt)"/>` +
        `<ellipse cx="${cx}" cy="${f(by - 3 * s)}" rx="${f(78 * s)}" ry="${f(16 * s)}" fill="url(#${id}cr)" stroke="${K.line}" stroke-width="2"/>` +
        vessel(cx, by - 8 * s, 'cup', s * 1.05, `url(#${id}cr)`, { id, gloss: true, mouth: '#efe6d6', bands: [[50, '#d4a31c', 2]] }) + handle(cx, by - 8 * s, s * 1.05, 'cup', 1, '#f2ebdf', .8, .35, 28);
    }
    return '';
  }
  /* черепок у розрізі */
  function sherd(type, x, y, w, id) {
    const h = 54, body = { terakota: `url(#${id}cl)`, shamot: '#d9a066', majolika: '#c8643a', fajans: '#efe5d2', kamyana: '#8a847b', porcelyana: '#fbf8f2' }[type];
    const edge = `M${x},${y} L${x + w - 18},${y} L${x + w - 6},${y + 12} L${x + w - 14},${y + 26} L${x + w},${y + 40} L${x + w - 10},${y + h} L${x},${y + h}Z`;
    let g = `<path d="${edge}" fill="${body}" stroke="${K.line}" stroke-width="2"/>`;
    const pores = (n, c, r) => { let s = ''; for (let i = 0; i < n; i++) { const px = x + 10 + ((i * 37) % (w - 34)), py = y + 10 + ((i * 23) % (h - 18)); s += `<ellipse cx="${px}" cy="${py}" rx="${r}" ry="${f(r * .7)}" fill="${c}"/>`; } return s; };
    if (type === 'terakota') g += pores(16, '#4e1d0c', 2.6);
    if (type === 'shamot') { g += pores(14, '#7a4b22', 3.4); for (let i = 0; i < 12; i++) g += `<rect x="${x + 14 + (i * 29) % (w - 40)}" y="${y + 8 + (i * 17) % (h - 18)}" width="5" height="4" fill="#fff0d6" transform="rotate(${i * 33} ${x + 16 + (i * 29) % (w - 40)} ${y + 10 + (i * 17) % (h - 18)})"/>`; }
    if (type === 'majolika') { g += pores(7, '#7e3418', 2.2) + `<path d="M${x},${y - 9} L${x + w - 18},${y - 9} L${x + w - 18},${y} L${x},${y}Z" fill="#fbf6ec" stroke="${K.line}" stroke-width="1.5"/>` + `<rect x="${x + 16}" y="${y - 13}" width="34" height="5" rx="2" fill="#2f7fd9"/><rect x="${x + 64}" y="${y - 13}" width="26" height="5" rx="2" fill="#ffc247"/><rect x="${x + 104}" y="${y - 13}" width="30" height="5" rx="2" fill="#3b8a63"/>`; }
    if (type === 'fajans') g += pores(10, '#b9ab94', 2.2) + `<path d="M${x},${y - 5} L${x + w - 18},${y - 5} L${x + w - 18},${y} L${x},${y}Z" fill="#9fdcff" fill-opacity=".55" stroke="#cfefff" stroke-width="1"/>`;
    if (type === 'kamyana') g += `<path d="M${x},${y - 4} L${x + w - 18},${y - 4} L${x + w - 18},${y} L${x},${y}Z" fill="#7a4b22" opacity=".85"/>`;
    if (type === 'porcelyana') g += `<path d="${edge}" fill="url(#${id}lt)" opacity=".6"/><path d="M${x},${y - 4} L${x + w - 18},${y - 4} L${x + w - 18},${y} L${x},${y}Z" fill="#dff3ff" fill-opacity=".7"/>`;
    return g;
  }
  const POROUS = { terakota: 1, shamot: 1 };
  function drop(cx, top, absorbed) {   // крапля води: вбирається або скочується
    if (absorbed) return `<ellipse cx="${cx}" cy="${top + 10}" rx="26" ry="7" fill="#1a0b05" opacity=".55"/><path d="M${cx},${top - 30} C${cx - 9},${top - 16} ${cx - 10},${top - 6} ${cx},${top - 4} C${cx + 10},${top - 6} ${cx + 9},${top - 16} ${cx},${top - 30}Z" fill="#7fd7ff" opacity=".55" class="la-hl"/>`;
    return `<path d="M${cx - 15},${top} C${cx - 15},${top - 22} ${cx + 15},${top - 22} ${cx + 15},${top}Z" fill="#7fd7ff" fill-opacity=".85" stroke="#d6f3ff" stroke-width="1.5"/><ellipse cx="${cx - 5}" cy="${top - 10}" rx="4" ry="3" fill="#ffffff"/>`;
  }
  const TYPE = { terakota: 'Теракота', shamot: 'Шамот', majolika: 'Майоліка', fajans: 'Фаянс', kamyana: 'Кам’яна маса', porcelyana: 'Порцеляна' };
  const TAGS = { terakota: ['пориста', 'без глазурі'], shamot: ['зерниста', 'витримує жар'], majolika: ['кольоровий черепок', 'біла глазур і розпис'], fajans: ['білий черепок', 'прозора глазур'], kamyana: ['щільна', 'не пропускає воду'], porcelyana: ['каолін, біла', 'просвічує'] };

  /* ================= малюнки ================= */
  const ART = {
    /* титулка (якщо 3D не завантажився) */
    title() {
      const id = uid();
      return svg(640, 520, 'Ваза на гончарному крузі', id, spot(id, 320, 300, 300, 230) + wheelHead(320, 430, 210, id) +
        `<g filter="url(#${id}n)">${vessel(320, 432, 'vase', 2.6, `url(#${id}cl)`, { id, bands: [[44, K.ac, 5], [52, K.ac, 5], [92, K.gd, 3]], deco: (p, x, b) => spiral(x - 40, b - 160, 28) + spiral(x + 34, b - 150, 26) })}</g>`);
    },
    /* план: полиця з виробами */
    vessels() {
      const id = uid(), by = 330;
      return svg(820, 400, 'Полиця з керамікою', id, spot(id, 410, 250, 400, 180) + `<path d="M40,${by + 6} L780,${by + 6}" stroke="${K.line}" stroke-width="3" stroke-opacity=".6"/>` +
        vessel(110, by, 'jug', 1.5, `url(#${id}cl)`, { id, bands: [[74, '#3b8a63', 6], [82, '#3b8a63', 3]] }) + handle(110, by, 1.5, 'jug', 1, K.clay) +
        vessel(270, by, 'bowl', 1.5, `url(#${id}cr)`, { id, gloss: true, mouth: '#d8ccb8', bands: [[24, '#2f7fd9', 4], [30, K.ac, 3]] }) +
        vessel(420, by, 'pot', 1.45, `url(#${id}cl)`, { id, deco: (p, x, b) => spiral(x - 30, b - 70, 20) + spiral(x + 28, b - 64, 18) }) +
        kahlya(510, by - 120, 120, `url(#${id}gn)`, '#c9f2d8', id) +
        vessel(720, by, 'piala', 1.35, `url(#${id}tl)`, { id, gloss: true, mouth: '#0c3a35' }));
    },
    /* шлях виробу */
    process() {
      const id = uid(), by = 230, X = [80, 240, 400, 570, 740];
      const kiln = `<path d="M${X[3] - 74},${by + 14} L${X[3] - 74},${by - 96} Q${X[3]},${by - 168} ${X[3] + 74},${by - 96} L${X[3] + 74},${by + 14}Z" fill="#2a1a12" stroke="${K.line}" stroke-width="2"/>` +
        `<path d="M${X[3] - 56},${by + 14} Q${X[3] - 40},${by - 30} ${X[3] - 24},${by + 14} Q${X[3] - 8},${by - 50} ${X[3] + 8},${by + 14} Q${X[3] + 24},${by - 34} ${X[3] + 40},${by + 14} Q${X[3] + 50},${by - 20} ${X[3] + 58},${by + 14}Z" fill="url(#${id}fi)" class="la-hl"/>`;
      return svg(820, 360, 'Глина, формування, сушіння, випал, готовий виріб', id, spot(id, 410, 200, 420, 170) +
        lump(X[0], by, 46, 50, `url(#${id}raw)`) +
        vessel(X[1], by, 'pot', 1.05, `url(#${id}raw)`, { id }) +
        vessel(X[2], by, 'pot', 1.05, `url(#${id}dry)`, { id }) + `<path d="M${X[2] - 20},${by - 120} q10,-12 0,-24 t0,-24 M${X[2] + 12},${by - 116} q10,-12 0,-24 t0,-24" fill="none" stroke="${K.hi}" stroke-width="2.4" class="la-flow slow"/>` +
        kiln + vessel(X[3], by - 18, 'pot', .8, `url(#${id}dry)`, { id }) +
        `<g filter="url(#${id}n)">${vessel(X[4], by, 'pot', 1.05, `url(#${id}cl)`, { id, bands: [[80, '#3b8a63', 7], [88, '#3b8a63', 4]] })}</g>` +
        X.slice(0, 4).map((x, i) => arrow(id, x + (i === 2 ? 66 : 58), by - 50, X[i + 1] - (i === 2 ? 84 : 62), by - 50)).join('') +
        pill(X[0], 300, 'Глина') + pill(X[1], 300, 'Форма') + pill(X[2], 300, 'Сушіння') + pill(X[3], 304, 'Випал\n900–1400 °C', 'middle', 'gd') + pill(X[4], 300, 'Кераміка', 'middle', 'ac'));
    },
    /* найдавніше ремесло */
    deep() {
      const id = uid(), ay = 270;
      const fig = (x, b) => `<g fill="url(#${id}raw)" stroke="${K.line}" stroke-width="2"><path d="M${x - 44},${b - 52} L${x - 74},${b - 82} L${x - 64},${b - 40}Z"/><ellipse cx="${x - 6}" cy="${b - 42}" rx="44" ry="28"/><circle cx="${x + 36}" cy="${b - 74}" r="17"/><path d="M${x + 51},${b - 78} l17,6 -17,6z"/><rect x="${x - 20}" y="${b - 18}" width="10" height="18" rx="3"/><rect x="${x + 6}" y="${b - 18}" width="10" height="18" rx="3"/></g><circle cx="${x + 40}" cy="${b - 78}" r="2.6" fill="#2a1d15"/>${dots([[x - 24, b - 46], [x - 8, b - 52], [x + 8, b - 46], [x - 16, b - 34], [x + 2, b - 36]], 2.4, '#2a1d15')}`;
      return svg(820, 380, 'Від глиняних фігурок до гончарного круга', id, spot(id, 410, 190, 420, 170) +
        `<path d="M40,${ay} L780,${ay}" stroke="${K.line}" stroke-width="3" marker-end="url(#${id}a)"/><path d="M40,${ay} L780,${ay}" stroke="${K.gdHi}" stroke-width="3" class="la-flow" opacity=".6"/>` +
        fig(140, ay - 26) + vessel(400, ay - 26, 'pot', .95, `url(#${id}raw)`, { id, deco: (p, x, b) => zig(x - 40, b - 60, 80, 10, 8, K.hi) + zig(x - 44, b - 40, 88, 10, 8, K.hi) }) +
        wheelHead(650, ay - 34, 72, id) + vessel(650, ay - 36, 'cyl', .95, `url(#${id}cl)`, { id, bands: [[20, '#ffb27a', 1.5], [40, '#ffb27a', 1.5], [60, '#ffb27a', 1.5]] }) +
        [140, 400, 650].map(x => `<circle cx="${x}" cy="${ay}" r="6" fill="${K.gd}"/>`).join('') +
        pill(140, 322, '≈ 26 000 років тому\nглиняні фігурки') + pill(400, 322, '≈ 20 000 років тому\nперший посуд') + pill(650, 322, 'понад 5000 років тому\nгончарний круг', 'middle', 'gd') + pill(770, ay - 30, 'сьогодні', 'end', 'mut', 13));
    },
    /* Україна: шість епох */
    timeline() {
      const id = uid(), ay = 200, X = [110, 250, 390, 530, 670, 810];
      const ic = [
        vessel(X[0], ay - 26, 'pot', .9, `url(#${id}cl)`, { id, deco: (p, x, b) => spiral(x - 22, b - 50, 15, '#1d0d06', 3) + spiral(x + 20, b - 46, 13, '#1d0d06', 3) }),
        vessel(X[1], ay - 26, 'amph', .82, `url(#${id}cl)`, { id, bands: [[64, '#1d0d06', 12]], rim: true }) + `<path d="M${X[1] - 10},${ay - 26 - 112} C${X[1] - 34},${ay - 140} ${X[1] - 40},${ay - 110} ${X[1] - 30},${ay - 96} M${X[1] + 10},${ay - 138} C${X[1] + 34},${ay - 140} ${X[1] + 40},${ay - 110} ${X[1] + 30},${ay - 96}" fill="none" stroke="${K.clay}" stroke-width="5"/>`,
        kahlya(X[2] - 48, ay - 124, 96, `url(#${id}gn)`, '#c9f2d8', id),
        kahlya(X[3] - 48, ay - 124, 96, `url(#${id}cr)`, '#2f7fd9', id),
        vessel(X[4], ay - 26, 'jug', .92, `url(#${id}gn)`, { id, gloss: true, mouth: '#0f2a1b', deco: (p, x, b) => flower(x - 2, b - 52, 11, '#ffc247', '#fff3dc', '#fff3dc') }) + handle(X[4], ay - 26, .92, 'jug', 1, '#3b8a63'),
        `<ellipse cx="${X[5]}" cy="${ay - 72}" rx="52" ry="52" fill="url(#${id}cr)" stroke="${K.line}" stroke-width="2"/><circle cx="${X[5]}" cy="${ay - 72}" r="40" fill="none" stroke="#3b8a63" stroke-width="3"/>${flower(X[5], ay - 76, 16, '#3b8a63', '#ffc247', '#8a5a3b')}`
      ];
      const L = [['V–III тис. до н. е.', 'Трипілля'], ['з VI ст. до н. е.', 'Античні міста'], ['IX–XIII ст.', 'Київська Русь'], ['XVI–XVIII ст.', 'Козацька доба'], ['XIX–XX ст.', 'Осередки'], ['сьогодні', 'Майстри й музеї']];
      return svg(920, 380, 'Кераміка в Україні: шість епох', id, spot(id, 460, 170, 470, 180) +
        `<path d="M40,${ay} L880,${ay}" stroke="${K.line}" stroke-width="3"/><path d="M40,${ay} L880,${ay}" stroke="${K.gdHi}" stroke-width="3" class="la-flow" opacity=".6"/>` +
        X.map((x, i) => `<path d="M${x},${ay} L${x},${ay + (i % 2 ? 92 : 30)}" stroke="${K.line}" stroke-width="1.5" stroke-dasharray="3 4"/>`).join('') +
        ic.join('') + X.map(x => `<circle cx="${x}" cy="${ay}" r="6" fill="${K.gd}"/>`).join('') +
        X.map((x, i) => pill(x, ay + (i % 2 ? 122 : 60), L[i][0] + '\n' + L[i][1], 'middle', i === 0 ? 'gd' : 'ink', 15)).join(''));
    },
    /* карта осередків */
    map() {
      const id = uid();
      return svg(760, 512, 'Карта України з осередками гончарства', id, `<image href="{{KMAP}}" x="0" y="0" width="760" height="512" opacity=".92"/>` +
        LAB(488, 170, 600, 96, 'Опішня', 'start', 'gd', 17) + LAB(112, 262, 70, 350, 'Косів', 'start', 'ink', 17) +
        LAB(262, 252, 250, 330, 'Бубнівка', 'start', 'ink', 17) + LAB(352, 152, 220, 62, 'Васильків', 'end', 'ink', 17));
    },
    /* ліплення руками */
    hand() {
      const id = uid(), by = 260, X = [140, 420, 700];
      const coils = [0, 1, 2, 3, 4, 5].map(i => { const y = by - 14 - i * 22, r = 46 + Math.sin(i * .7) * 10; return `<ellipse cx="${X[1]}" cy="${y}" rx="${f(r)}" ry="${f(r * .2 + 9)}" fill="url(#${id}raw)" stroke="${K.line}" stroke-width="1.8"/>`; }).reverse().join('');
      const slab = `<path d="M${X[2] - 120},${by - 10} L${X[2] - 60},${by - 50} L${X[2] + 10},${by - 50} L${X[2] - 50},${by - 10}Z" fill="url(#${id}raw)" stroke="${K.line}" stroke-width="2"/>` +
        `<g transform="rotate(-34 ${X[2] - 52} ${by - 66})"><rect x="${X[2] - 112}" y="${by - 76}" width="120" height="20" rx="10" fill="url(#${id}gd)" stroke="${K.gdHi}" stroke-width="1.4"/></g>` +
        `<path d="M${X[2] + 30},${by - 6} L${X[2] + 30},${by - 76} L${X[2] + 66},${by - 100} L${X[2] + 126},${by - 100} L${X[2] + 126},${by - 30} L${X[2] + 90},${by - 6}Z" fill="url(#${id}raw)" stroke="${K.line}" stroke-width="2"/><path d="M${X[2] + 30},${by - 76} L${X[2] + 90},${by - 76} L${X[2] + 126},${by - 100} M${X[2] + 90},${by - 76} L${X[2] + 90},${by - 6}" fill="none" stroke="${K.hi}" stroke-width="2" stroke-dasharray="5 4"/>`;
      return svg(840, 360, 'Вільне ліплення, стрічкове ліплення, пласти', id, spot(id, 420, 200, 430, 170) +
        `<circle cx="${X[0] - 92}" cy="${by - 110}" r="24" fill="url(#${id}raw)" stroke="${K.line}" stroke-width="2"/>` + arrow(id, X[0] - 62, by - 106, X[0] - 30, by - 92) +
        vessel(X[0], by, 'bowl', 1.35, `url(#${id}raw)`, { id, deco: (p, x, b) => dots([[x - 40, b - 26], [x - 18, b - 18], [x + 8, b - 20], [x + 32, b - 28], [x - 28, b - 38], [x + 20, b - 40]], 4.5, '#2a1d15') }) +
        coils + `<path d="M${X[1] - 60},${by - 160} C${X[1] - 20},${by - 186} ${X[1] + 40},${by - 186} ${X[1] + 80},${by - 160}" fill="none" stroke="#866850" stroke-width="14" stroke-linecap="round"/>` + arrow(id, X[1] + 92, by - 168, X[1] + 66, by - 146) +
        slab + pill(X[0], 316, 'Вільне', 'middle', 'gd') + pill(X[1], 316, 'Стрічкове', 'middle', 'gd') + pill(X[2], 316, 'Пласти'));
    },
    /* гончарний круг */
    wheel() {
      const id = uid(), by = 270, X = [140, 420, 700];
      const dome = `<path d="M${X[0] - 54},${by} C${X[0] - 54},${by - 60} ${X[0] + 54},${by - 60} ${X[0] + 54},${by}Z" fill="url(#${id}raw)" stroke="${K.line}" stroke-width="2"/>`;
      const donut = `<path d="M${X[1] - 60},${by} C${X[1] - 62},${by - 56} ${X[1] + 62},${by - 56} ${X[1] + 60},${by}Z" fill="url(#${id}raw)" stroke="${K.line}" stroke-width="2"/><ellipse cx="${X[1]}" cy="${by - 38}" rx="22" ry="7" fill="url(#${id}mo)" stroke="${K.line}" stroke-width="1.6"/>`;
      return svg(840, 360, 'Центрування, відкривання, витягування стінок', id, spot(id, 420, 210, 430, 170) +
        X.map(x => wheelHead(x, by, 100, id)).join('') + dome + donut +
        vessel(X[2], by - 2, 'cyl', 1.5, `url(#${id}raw)`, { id, bands: [[24, K.hi, 1.4], [44, K.hi, 1.4], [64, K.hi, 1.4], [84, K.hi, 1.4], [104, K.hi, 1.4]] }) +
        dots([[X[2] + 72, by - 150], [X[2] + 84, by - 128], [X[2] - 76, by - 140]], 4, K.ac) +
        arrow(id, X[0] + 112, by - 50, X[1] - 112, by - 50) + arrow(id, X[1] + 112, by - 50, X[2] - 112, by - 50) +
        pill(X[0], 324, 'Центрування') + pill(X[1], 324, 'Відкривання') + pill(X[2], 324, 'Витягування стінок', 'middle', 'gd'));
    },
    /* шаблон */
    template() {
      const id = uid(), cx = 420, wy = 316;
      return svg(840, 400, 'Шаблон формує тарілку на гіпсовій формі', id, spot(id, 420, 230, 400, 160) + wheelHead(cx, wy, 250, id) +
        `<path d="M${cx - 190},${wy - 6} C${cx - 170},${wy - 92} ${cx + 170},${wy - 92} ${cx + 190},${wy - 6}Z" fill="url(#${id}pl)" stroke="${K.line}" stroke-width="2"/>` +
        `<path d="M${cx - 200},${wy - 4} C${cx - 182},${wy - 106} ${cx + 182},${wy - 106} ${cx + 200},${wy - 4} L${cx + 190},${wy - 6} C${cx + 170},${wy - 92} ${cx - 170},${wy - 92} ${cx - 190},${wy - 6}Z" fill="url(#${id}cl)" stroke="${K.line}" stroke-width="2"/>` +
        `<g class="la-press"><path d="M${cx - 6},${wy - 180} L${cx + 6},${wy - 180} L${cx + 6},${wy - 128} L${cx + 190},${wy - 128} L${cx + 202},${wy - 6} C${cx + 184},${wy - 104} ${cx},${wy - 96} ${cx - 6},${wy - 90}Z" fill="url(#${id}gd)" stroke="${K.gdHi}" stroke-width="1.6" opacity=".95"/></g>` +
        LAB(cx + 130, wy - 140, cx + 240, wy - 190, 'Шаблон', 'start', 'gd', 16) + LAB(cx - 150, wy - 64, cx - 230, wy - 150, 'Глина', 'end', 'ink', 16) +
        LAB(cx - 60, wy - 40, cx - 230, wy - 40, 'Гіпсова форма', 'end', 'ink', 16) + LAB(cx + 60, wy + 30, cx + 150, wy + 64, 'Круг обертається', 'start', 'ink', 16));
    },
    /* лиття в гіпсову форму */
    mold() {
      const id = uid(), X = [150, 440, 730], top = 100, H = 190, W = 170;
      const cav = (x, t) => `M${x - 26},${t} L${x - 26},${t + 14} C${x - 56},${t + 40} ${x - 62},${t + 130} ${x - 40},${t + 160} L${x + 40},${t + 160} C${x + 62},${t + 130} ${x + 56},${t + 40} ${x + 26},${t + 14} L${x + 26},${t}Z`;
      const block = x => `<rect x="${x - W / 2}" y="${top}" width="${W}" height="${H}" rx="6" fill="url(#${id}pl)" stroke="${K.line}" stroke-width="2"/><path d="M${x},${top} L${x},${top + H}" stroke="#8b939c" stroke-width="1.5" stroke-dasharray="5 5"/>`;
      const p1 = block(X[0]) + `<path d="${cav(X[0], top)}" fill="url(#${id}sl)" stroke="#8b939c" stroke-width="1.5"/>` + `<path d="M${X[0]},${top - 60} L${X[0]},${top + 6}" stroke="#d8c3a6" stroke-width="10" stroke-linecap="round"/><path d="M${X[0]},${top - 60} L${X[0]},${top + 6}" stroke="#fff3dc" stroke-width="3" class="la-flow"/>`;
      const p2 = block(X[1]) + `<path d="${cav(X[1], top)}" fill="url(#${id}sl)" stroke="#8b939c" stroke-width="1.5"/><path d="${cav(X[1], top)}" fill="none" stroke="#9a7a5c" stroke-width="16" class="la-wall" clip-path="url(#${id}c2)"/><clipPath id="${id}c2"><path d="${cav(X[1], top)}"/></clipPath>` +
        [[-70, 60], [-74, 120], [70, 60], [74, 120]].map(([dx, dy]) => arrow(id, X[1] + dx * .45, top + dy, X[1] + dx, top + dy, 'at')).join('');
      const p3 = `<g transform="rotate(180 ${X[2]} ${top + H / 2})">${block(X[2])}<path d="${cav(X[2], top)}" fill="#1a0d07" stroke="#8b939c" stroke-width="1.5"/><path d="${cav(X[2], top)}" fill="none" stroke="#9a7a5c" stroke-width="16" clip-path="url(#${id}c3)"/><clipPath id="${id}c3"><path d="${cav(X[2], top)}"/></clipPath></g>` +
        `<path d="M${X[2]},${top + H - 4} L${X[2]},${top + H + 60}" stroke="#d8c3a6" stroke-width="10" stroke-linecap="round"/><path d="M${X[2]},${top + H - 4} L${X[2]},${top + H + 60}" stroke="#fff3dc" stroke-width="3" class="la-flow"/>`;
      return svg(880, 420, 'Шлікерне лиття в гіпсову форму: три кроки', id, spot(id, 440, 210, 440, 190) + p1 + p2 + p3 +
        pill(X[0], 345, '1. Заливаємо шлікер') + pill(X[1], 345, '2. Гіпс вбирає воду —\nросте стінка', 'middle', 'ac') + pill(X[2], 380, '3. Зайве виливаємо'));
    },
    /* пресування з порошкоподібної маси */
    press() {
      const id = uid(), cx = 220, by = 300;
      let powder = ''; for (let k = 0; k < 70; k++) powder += `<circle cx="${f(cx - 96 + (k * 37) % 192)}" cy="${f(by - 62 + (k * 13) % 36)}" r="${k % 3 ? 2.2 : 3}" fill="${k % 4 ? '#e6d3b9' : '#c9b08f'}"/>`;
      const tile = (x, y, w, c) => `<path d="M${x},${y} L${x + w * .5},${y - w * .26} L${x + w * 1.5},${y - w * .26} L${x + w},${y}Z" fill="${c}" stroke="${K.line}" stroke-width="2"/><path d="M${x},${y} L${x + w},${y} L${x + w},${y + 12} L${x},${y + 12}Z" fill="#6e2c14" stroke="${K.line}" stroke-width="2"/><path d="M${x + w},${y} L${x + w * 1.5},${y - w * .26} L${x + w * 1.5},${y - w * .26 + 12} L${x + w},${y + 12}Z" fill="#4e1d0c" stroke="${K.line}" stroke-width="2"/>`;
      return svg(780, 400, 'Прес стискає порошкоподібну масу в сталевій формі: плитка', id, spot(id, 390, 220, 390, 170) +
        `<rect x="${cx - 122}" y="${by - 74}" width="244" height="84" rx="4" fill="url(#${id}gr)" stroke="${K.line}" stroke-width="2"/><rect x="${cx - 100}" y="${by - 66}" width="200" height="44" fill="#2a1d15"/>` + powder +
        `<g class="la-press"><rect x="${cx - 10}" y="${by - 250}" width="20" height="120" fill="url(#${id}gr)" stroke="${K.hi}" stroke-width="1.4"/><rect x="${cx - 98}" y="${by - 132}" width="196" height="40" rx="3" fill="url(#${id}gr)" stroke="${K.hi}" stroke-width="1.6"/></g>` +
        `<path d="M${cx + 150},${by - 190} L${cx + 150},${by - 112}" stroke="${K.gd}" stroke-width="4" marker-end="url(#${id}a)"/><path d="M${cx - 150},${by - 190} L${cx - 150},${by - 112}" stroke="${K.gd}" stroke-width="4" marker-end="url(#${id}a)"/>` +
        arrow(id, cx + 140, by - 40, 450, by - 40) + tile(470, by - 20, 130, `url(#${id}cl)`) + tile(478, by - 60, 130, '#e9875a') + tile(486, by - 100, 130, `url(#${id}tl)`) +
        pill(cx, by + 46, 'Порошок у сталевій формі') + pill(cx, by - 270, 'Прес', 'middle', 'gd') + pill(590, by + 46, 'Плитка', 'middle', 'gd'));
    },
    /* ліплення в гіпсових формах: відтискування */
    gyps() {
      const id = uid(), cx = 230, top = 170, W = 300, H = 120;
      const relief = `M${cx - 110},${top + 30} L${cx - 110},${top + 70} Q${cx - 80},${top + 92} ${cx - 50},${top + 70} Q${cx - 25},${top + 50} ${cx},${top + 74} Q${cx + 25},${top + 50} ${cx + 50},${top + 70} Q${cx + 80},${top + 92} ${cx + 110},${top + 70} L${cx + 110},${top + 30}Z`;
      return svg(840, 400, 'Глину вдавлюють у гіпсову форму, гіпс вбирає воду, виріб відстає', id, spot(id, 420, 220, 420, 170) +
        `<rect x="${cx - W / 2}" y="${top}" width="${W}" height="${H}" rx="6" fill="url(#${id}pl)" stroke="${K.line}" stroke-width="2"/><path d="${relief}" fill="#1a0d07" stroke="#8b939c" stroke-width="1.6"/>` +
        `<clipPath id="${id}cg"><path d="${relief}"/></clipPath><rect x="${cx - 112}" y="${top + 26}" width="224" height="72" fill="url(#${id}cl)" clip-path="url(#${id}cg)" class="la-hl"/>` +
        `<g class="la-press">${[-60, 0, 60].map(dx => `<path d="M${cx + dx},${top - 70} L${cx + dx},${top + 14}" stroke="${K.gd}" stroke-width="4" marker-end="url(#${id}a)"/>`).join('')}</g>` +
        [[-150, 60], [150, 60], [-90, 112], [90, 112]].map(([dx, dy]) => arrow(id, cx + dx * .62, top + dy, cx + dx, top + dy, 'at')).join('') +
        arrow(id, cx + 170, top + 60, 520, top + 60) + kahlya(560, top - 40, 180, `url(#${id}cl)`, '#ffe08a', id) +
        `<path d="M650,${top + 180} L650,${top + 150}" stroke="${K.ac}" stroke-width="3" marker-end="url(#${id}at)"/>` +
        pill(cx, top - 96, 'Вдавлюємо глину пальцями', 'middle', 'gd') + pill(cx, top + H + 40, 'Гіпс вбирає воду', 'middle', 'ac') + pill(650, top + 200, 'Виріб відстає від форми'));
    },
    /* п'ять технік разом */
    techs() {
      const id = uid(), by = 236, X = [90, 270, 450, 630, 810];
      const mini = [
        [0, 1, 2, 3, 4].map(i => `<ellipse cx="${X[0]}" cy="${by - 10 - i * 18}" rx="${40 - Math.abs(i - 2) * 5}" ry="12" fill="url(#${id}raw)" stroke="${K.line}" stroke-width="1.6"/>`).reverse().join(''),
        wheelHead(X[1], by, 70, id) + vessel(X[1], by - 2, 'cyl', 1.05, `url(#${id}raw)`, { id, bands: [[24, K.hi, 1.2], [44, K.hi, 1.2], [64, K.hi, 1.2]] }),
        wheelHead(X[2], by, 74, id, false) + `<path d="M${X[2] - 62},${by - 4} C${X[2] - 54},${by - 52} ${X[2] + 54},${by - 52} ${X[2] + 62},${by - 4}Z" fill="url(#${id}pl)" stroke="${K.line}" stroke-width="1.6"/><path d="M${X[2] - 68},${by - 2} C${X[2] - 60},${by - 62} ${X[2] + 60},${by - 62} ${X[2] + 68},${by - 2} L${X[2] + 62},${by - 4} C${X[2] + 54},${by - 52} ${X[2] - 54},${by - 52} ${X[2] - 62},${by - 4}Z" fill="url(#${id}cl)" stroke="${K.line}" stroke-width="1.6"/><path d="M${X[2] - 3},${by - 120} L${X[2] + 3},${by - 120} L${X[2] + 3},${by - 86} L${X[2] + 66},${by - 86} L${X[2] + 70},${by - 2} C${X[2] + 60},${by - 62} ${X[2]},${by - 60} ${X[2] - 3},${by - 58}Z" fill="url(#${id}gd)" stroke="${K.gdHi}" stroke-width="1.2"/>`,
        `<rect x="${X[3] - 56}" y="${by - 120}" width="112" height="120" rx="5" fill="url(#${id}pl)" stroke="${K.line}" stroke-width="1.6"/><path d="M${X[3] - 16},${by - 120} L${X[3] - 16},${by - 110} C${X[3] - 36},${by - 90} ${X[3] - 40},${by - 34} ${X[3] - 26},${by - 16} L${X[3] + 26},${by - 16} C${X[3] + 40},${by - 34} ${X[3] + 36},${by - 90} ${X[3] + 16},${by - 110} L${X[3] + 16},${by - 120}Z" fill="url(#${id}sl)" stroke="#8b939c" stroke-width="1.4"/><path d="M${X[3]},${by - 170} L${X[3]},${by - 116}" stroke="#d8c3a6" stroke-width="8" stroke-linecap="round"/><path d="M${X[3]},${by - 170} L${X[3]},${by - 116}" stroke="#fff3dc" stroke-width="2.4" class="la-flow"/>`,
        `<rect x="${X[4] - 58}" y="${by - 60}" width="116" height="60" rx="3" fill="url(#${id}gr)" stroke="${K.line}" stroke-width="1.6"/><rect x="${X[4] - 46}" y="${by - 54}" width="92" height="30" fill="#2a1d15"/>` + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(k => `<circle cx="${X[4] - 40 + (k * 23) % 82}" cy="${by - 48 + (k * 7) % 20}" r="2.4" fill="#e6d3b9"/>`).join('') +
        `<g class="la-press"><rect x="${X[4] - 6}" y="${by - 160}" width="12" height="70" fill="url(#${id}gr)" stroke="${K.hi}" stroke-width="1.2"/><rect x="${X[4] - 44}" y="${by - 96}" width="88" height="22" rx="2" fill="url(#${id}gr)" stroke="${K.hi}" stroke-width="1.4"/></g>`
      ];
      const L = ['а · Ліплення', 'б · Точення', 'в · Шаблон', 'г · Гіпс', 'ґ · Пресування'];
      return svg(900, 320, 'П’ять технік формотворення', id, spot(id, 450, 170, 460, 150) + mini.join('') + X.map((x, i) => pill(x, 286, L[i], 'middle', i === 3 ? 'ac' : 'ink')).join(''));
    },
    /* температура випалу */
    temp() {
      const id = uid(), x0 = 150, x1 = 820, T0 = 800, T1 = 1450, px = T => f(x0 + (T - T0) / (T1 - T0) * (x1 - x0));
      const rows = [['Теракота', 900, 1050, `url(#${id}cl)`], ['Майоліка', 900, 1050, '#e9875a'], ['Фаянс', 1000, 1200, `url(#${id}cr)`], ['Кам’яна маса', 1200, 1300, `url(#${id}gr)`], ['Порцеляна', 1300, 1400, '#f7f5f0']];
      let g = spot(id, 480, 200, 470, 190);
      rows.forEach(([n, a, b, c], i) => { const y = 54 + i * 52; g += `<rect x="${px(a)}" y="${y - 13}" width="${f(px(b) - px(a))}" height="26" rx="13" fill="${c}" stroke="${K.line}" stroke-width="1.6"/>` + pill(px(a) - 12, y, n, 'end', i === 4 ? 'gd' : 'ink', 15); });
      g += `<rect x="${x0}" y="318" width="${x1 - x0}" height="16" rx="8" fill="url(#${id}th)" stroke="${K.line}" stroke-width="1.4" class="la-hl"/>`;
      for (let T = 800; T <= 1400; T += 100) g += `<path d="M${px(T)},336 L${px(T)},346" stroke="${K.mut}" stroke-width="2"/><text x="${px(T)}" y="368" font-size="17" fill="${K.mut}" text-anchor="middle" font-weight="700">${T} °C</text>`;
      g += pill(x1, 394, 'Шамот — про масу: у ній подрібнена випалена глина', 'end', 'mut', 14);
      return svg(860, 410, 'Температура випалу різних видів кераміки', id, g);
    },
    /* дослід із трьома піалами */
    piala3() {
      const id = uid(), by = 270, X = [140, 420, 700];
      return svg(840, 380, 'Три піали і крапля води', id, spot(id, 420, 210, 430, 170) + `<path d="M30,${by + 6} L810,${by + 6}" stroke="${K.line}" stroke-width="3" stroke-opacity=".5"/>` +
        vessel(X[0], by, 'piala', 2, `url(#${id}bis)`, { id }) + drop(X[0] + 20, by - 60, true) +
        vessel(X[1], by, 'piala', 2, `url(#${id}dry)`, { id }) + drop(X[1] + 20, by - 60, true).replace('class="la-hl"', '') + `<text x="${X[1] + 60}" y="${by - 74}" font-size="40" font-weight="700" fill="${K.gd}">?</text>` +
        vessel(X[2], by, 'piala', 2, `url(#${id}cr)`, { id, gloss: true, mouth: '#d8ccb8', bands: [[14, '#2f7fd9', 5], [24, K.ac, 4], [34, '#2f7fd9', 3]], deco: (p, x, b) => dots([[x - 60, b - 46], [x - 20, b - 52], [x + 20, b - 52], [x + 60, b - 46]], 5, '#ffc247') }) + drop(X[2] + 24, by - 76, false) +
        pill(X[0], 322, '1-й випал: бісквіт') + pill(X[1], 322, '2-й випал без глазурі') + pill(X[2], 322, 'Розпис і глазур', 'middle', 'ac') +
        pill(X[0], 356, 'вбирає', 'middle', 'mut', 13) + pill(X[1], 356, 'перевірте!', 'middle', 'gd', 13) + pill(X[2], 356, 'скочується', 'middle', 'mut', 13));
    },
    /* музей */
    museum() {
      const id = uid(), x = 210, y = 60, w = 420, h = 280, sy = y + 220;
      return svg(840, 400, 'Вітрина музею і чотири запитання', id, spot(id, 420, 210, 400, 180) +
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#ffffff" fill-opacity=".04" stroke="${K.hi}" stroke-width="2.4"/><path d="M${x + 40},${y + 20} L${x + 120},${y + 100} M${x + 70},${y + 20} L${x + 150},${y + 100}" stroke="#ffffff" stroke-opacity=".18" stroke-width="5"/>` +
        `<path d="M${x},${sy} L${x + w},${sy}" stroke="${K.line}" stroke-width="3"/>` +
        vessel(x + 90, sy, 'jug', 1.15, `url(#${id}gn)`, { id, gloss: true, mouth: '#0f2a1b', deco: (p, cx, b) => flower(cx - 2, b - 64, 12, '#ffc247', '#fff3dc', '#fff3dc') }) + handle(x + 90, sy, 1.15, 'jug', 1, '#3b8a63') +
        vessel(x + 220, sy, 'pot', 1.1, `url(#${id}cl)`, { id, deco: (p, cx, b) => spiral(cx - 26, b - 60, 18, '#1d0d06', 3) + spiral(cx + 24, b - 56, 16, '#1d0d06', 3) }) +
        `<ellipse cx="${x + 345}" cy="${sy - 70}" rx="58" ry="58" fill="url(#${id}cr)" stroke="${K.line}" stroke-width="2"/><circle cx="${x + 345}" cy="${sy - 70}" r="44" fill="none" stroke="#3b8a63" stroke-width="3"/>${flower(x + 345, sy - 74, 17, '#3b8a63', '#ffc247', '#8a5a3b')}` +
        `<g transform="translate(${x + 130} ${sy - 40})"><circle r="34" fill="#9fdcff" fill-opacity=".14" stroke="${K.gd}" stroke-width="5"/><path d="M24,24 L60,60" stroke="${K.gd}" stroke-width="10" stroke-linecap="round"/></g>` +
        pill(x - 16, y + 50, 'Звідки?', 'end', 'gd', 17) + pill(x - 16, y + 200, 'Як зроблено?', 'end', 'gd', 17) + pill(x + w + 16, y + 50, 'Який вид?', 'start', 'gd', 17) + pill(x + w + 16, y + 200, 'Для чого?', 'start', 'gd', 17));
    },
    /* три речі за вимогою: тарілка, миска, глечик або горнятко */
    three() {
      const id = uid(), by = 262, X = [140, 420, 700];
      return svg(840, 380, 'Тарілка, миска, глечик або горнятко', id, spot(id, 420, 210, 430, 170) + `<path d="M30,${by + 6} L810,${by + 6}" stroke="${K.line}" stroke-width="3" stroke-opacity=".5"/>` +
        plateSide(X[0], by - 22, 104, `url(#${id}cl)`, id, `<ellipse cx="${X[0]}" cy="${by - 22}" rx="72" ry="20" fill="none" stroke="#3b8a63" stroke-width="5"/>`) +
        vessel(X[1], by, 'bowl', 1.6, `url(#${id}cl)`, { id, bands: [[24, '#3b8a63', 6]], deco: (p, x, b) => dots([[x - 48, b - 30], [x - 18, b - 22], [x + 14, b - 22], [x + 44, b - 30]], 4.5, '#ffe08a') }) +
        vessel(X[2] - 46, by, 'jug', 1.3, `url(#${id}cl)`, { id, bands: [[78, '#3b8a63', 6]] }) + handle(X[2] - 46, by, 1.3, 'jug', 1, K.clay) +
        `<text x="${X[2] + 40}" y="${by - 66}" font-size="22" font-weight="700" fill="${K.mut}" text-anchor="middle">або</text>` +
        vessel(X[2] + 94, by, 'cup', 1.25, `url(#${id}cl)`, { id, bands: [[44, '#3b8a63', 5]] }) + handle(X[2] + 94, by, 1.25, 'cup', 1, K.clay, .8, .35, 28) +
        pill(X[0], 318, '1. Тарілка', 'middle', 'gd') + pill(X[1], 318, '2. Миска', 'middle', 'gd') + pill(X[2] + 20, 318, '3. Глечик або горнятко', 'middle', 'gd') +
        pill(X[0], 352, 'з пласта', 'middle', 'mut', 13) + pill(X[1], 352, 'вільне чи стрічкове', 'middle', 'mut', 13) + pill(X[2] + 20, 352, 'стрічками, ручка — шлікером', 'middle', 'mut', 13));
    }
  };
  /* пара видів: предмет, назва, черепок у розрізі, крапля, ознаки */
  function pair(a, b) {
    const id = uid();
    const col = (t, cx) => {
      const glazed = !POROUS[t];
      return spot(id, cx, 110, 180, 120) + obj(t, cx, 190, { shamot: 1.45, majolika: 1.3, fajans: 1.3, porcelyana: 1.3, terakota: 1.25, kamyana: 1.3 }[t], id) + pill(cx, 228, TYPE[t], 'middle', 'gd', 18, true) +
        sherd(t, cx - 120, 282, 240, id) + drop(cx + 78, 282 - (t === 'majolika' ? 9 : t === 'fajans' ? 5 : t === 'kamyana' || t === 'porcelyana' ? 4 : 0), !glazed) +
        pill(cx, 372, TAGS[t][0], 'middle', 'ink', 14) + pill(cx, 406, TAGS[t][1], 'middle', 'ink', 14);
    };
    return svg(760, 428, `${TYPE[a]} і ${TYPE[b]}`, id, col(a, 190) + col(b, 570) + `<path d="M380,40 L380,400" stroke="#4a3a30" stroke-width="2" stroke-dasharray="4 8"/>`);
  }
  /* предмет для гри «Вгадай вид» — без підписів */
  function guess(t) { const id = uid(); return svg(520, 340, 'Що це за кераміка?', id, spot(id, 260, 180, 260, 170) + obj(t, 260, { shamot: 290, majolika: 250, fajans: 250, porcelyana: 316, terakota: 322, kamyana: 318 }[t], { shamot: 2.3, majolika: 2.3, fajans: 2.3, porcelyana: 2.1, terakota: 2.15, kamyana: 2.4 }[t], id)); }

  /* ================= 3D: ваза на гончарному крузі (титулка) ================= */
  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  let threeP = null;
  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (threeP) return threeP;
    threeP = new Promise((res, rej) => { const s = document.createElement('script'); s.src = THREE_URL; s.async = true; s.onload = () => window.THREE ? res(window.THREE) : rej(new Error('three')); s.onerror = () => { threeP = null; rej(new Error('three')); }; document.head.appendChild(s); });
    return threeP;
  }
  function webgl() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (e) { return false; } }
  function mount3D(el, opt = {}) {
    let stop = false, cleanup = () => {};
    if (!webgl()) return () => {};
    loadThree().then(T => { if (stop || !el.isConnected) return; try { cleanup = build3D(T, el, opt); } catch (e) { try { console.warn('3D:', e); } catch (e2) {} const w = el.querySelector('.la3d'); if (w) w.remove(); } }).catch(() => {});
    return () => { stop = true; cleanup(); };
  }
  function build3D(T, el) {
    const wrap = document.createElement('div'); wrap.className = 'la3d hero';
    wrap.innerHTML = '<canvas></canvas>';
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.appendChild(wrap);
    const cv = wrap.querySelector('canvas');
    const R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    R.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(30, 1, .1, 100);
    scene.fog = new T.Fog(0x1b1d21, 9, 18);
    cam.position.set(0, 3.2, 7.6); cam.lookAt(0, 1.15, 0);
    scene.add(new T.HemisphereLight(0xfff1e2, 0x140c08, .6));
    const key = new T.DirectionalLight(0xffffff, .85); key.position.set(4, 7, 5); scene.add(key);
    const rim = new T.DirectionalLight(0x2fd2c0, .55); rim.position.set(-5, 3, -4); scene.add(rim);
    const warm = new T.PointLight(0xff8a3d, .5, 12); warm.position.set(2.5, .6, 2.5); scene.add(warm);
    const spinG = new T.Group(); scene.add(spinG);
    // круг
    const head = new T.Mesh(new T.CylinderGeometry(1.85, 1.95, .18, 72), new T.MeshStandardMaterial({ color: 0x2a2f36, roughness: .6, metalness: .4 }));
    head.position.y = -.09; spinG.add(head);
    const rimR = new T.Mesh(new T.TorusGeometry(1.9, .03, 8, 96), new T.MeshBasicMaterial({ color: 0xffc247 })); rimR.rotation.x = Math.PI / 2; rimR.position.y = 0; spinG.add(rimR);
    const marks = new T.Group(); for (let i = 0; i < 6; i++) { const m = new T.Mesh(new T.BoxGeometry(.5, .012, .03), new T.MeshBasicMaterial({ color: 0xffe08a })); const a = i * Math.PI / 3; m.position.set(Math.cos(a) * 1.55, .005, Math.sin(a) * 1.55); m.rotation.y = -a; marks.add(m); } spinG.add(marks);
    // ваза (токарний профіль, як на гончарному крузі)
    const P = [[.001, 0], [.44, 0], [.52, .08], [.84, .55], [.97, .95], [.92, 1.3], [.64, 1.72], [.41, 2.0], [.37, 2.25], [.47, 2.45], [.52, 2.53], [.46, 2.55], [.33, 2.32], [.31, 2.0]];
    const vase = new T.Mesh(new T.LatheGeometry(P.map(([r, y]) => new T.Vector2(r, y)), 72),
      new T.MeshStandardMaterial({ color: 0xb4542c, emissive: 0x1c0803, roughness: .78, metalness: .02, side: T.DoubleSide }));
    spinG.add(vase);
    const rAtY = y => { for (let i = 1; i < P.length; i++) if (P[i][1] >= y) { const [r0, y0] = P[i - 1], [r1, y1] = P[i]; return r0 + (r1 - r0) * (y - y0) / (y1 - y0); } return P[P.length - 1][0]; };
    const GP = [.98, 1.08, 1.18, 1.28, 1.38, 1.48].map(y => [rAtY(y) + .012, y]);
    const glaze = new T.Mesh(new T.LatheGeometry(GP.map(([r, y]) => new T.Vector2(r, y)), 72),
      new T.MeshStandardMaterial({ color: 0x1f8f80, emissive: 0x04241f, roughness: .32, metalness: .1, side: T.DoubleSide }));
    spinG.add(glaze);
    [.98, 1.48, 2.42].forEach(y => { const ring = new T.Mesh(new T.TorusGeometry(rAtY(y) + .02, .016, 8, 96), new T.MeshBasicMaterial({ color: 0xffc247 })); ring.rotation.x = Math.PI / 2; ring.position.y = y; spinG.add(ring); });
    const lines = new T.Group();   // «кільця» від пальців гончаря
    [.25, .45, .8, 1.15, 1.6, 1.95, 2.2].forEach(y => {
      let r = 0; for (let i = 1; i < P.length; i++) if (P[i][1] >= y) { const [r0, y0] = P[i - 1], [r1, y1] = P[i]; r = r0 + (r1 - r0) * (y - y0) / (y1 - y0); break; }
      const pts = []; for (let k = 0; k <= 72; k++) { const a = k / 72 * Math.PI * 2; pts.push(new T.Vector3(Math.cos(a) * (r + .012), y, Math.sin(a) * (r + .012))); }
      lines.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0xffb27a, transparent: true, opacity: .35 })));
    });
    spinG.add(lines);
    const grid = new T.GridHelper(16, 32, 0x8a4a22, 0x3a2416); grid.position.y = -.2; grid.material.transparent = true; grid.material.opacity = .45; scene.add(grid);
    function size() { const w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h) return; R.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h < 1 ? 40 : 30; cam.updateProjectionMatrix(); }
    const ro = new ResizeObserver(size); ro.observe(wrap); size();
    let raf = 0, alive = true; const t0 = performance.now();
    function frame(now) {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (!wrap.isConnected) { stopIt(); return; }
      const t = (now - t0) / 1000;
      spinG.rotation.y = still ? .6 : t * .9;
      warm.intensity = still ? .5 : .45 + Math.sin(t * 2.3) * .12;
      R.render(scene, cam);
    }
    function stopIt() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); try { R.dispose(); } catch (e) { /* ok */ } }
    frame(performance.now());
    [...el.children].forEach(c => { if (c !== wrap) c.remove(); });
    return stopIt;
  }

  const CSS = `.la3d{position:absolute;inset:0}
.la3d canvas{position:absolute;inset:0;width:100%;height:100%;display:block;filter:drop-shadow(0 0 1.5px rgba(255,178,122,.8)) drop-shadow(0 0 12px rgba(255,140,80,.35))}
.la-flow{stroke-dasharray:3 26;stroke-linecap:round;animation:laflow 1s linear infinite}
.la-flow.slow{animation-duration:1.7s;opacity:.6}
@keyframes laflow{to{stroke-dashoffset:-29}}
.la-hl{animation:lahl 2.4s ease-in-out infinite}
@keyframes lahl{50%{opacity:.55}}
.la-press{animation:lapress 2.6s ease-in-out infinite}
@keyframes lapress{0%,100%{transform:translateY(-18px)}45%,60%{transform:translateY(0)}}
.la-wall{animation:lawall 3.2s ease-in-out infinite}
@keyframes lawall{0%{stroke-width:2}70%,100%{stroke-width:18}}
@media (prefers-reduced-motion:reduce){.la-flow,.la-hl,.la-press,.la-wall{animation:none}}`;
  try { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); } catch (e) { /* ok */ }
  try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fit(document)); } catch (e) { /* ok */ }

  window.LA_ART = {
    get: k => !k ? '' : k.startsWith('pair:') ? pair(...k.slice(5).split(',')) : k.startsWith('g:') ? guess(k.slice(2)) : (ART[k] ? ART[k]() : ''),
    photo: () => '', has: () => false, mount3D, fit, PH: {}
  };
})();
