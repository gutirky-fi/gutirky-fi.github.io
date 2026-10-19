/* Малюнки для гутірки «Будова літальних апаратів І» — неоновий стиль (за прикладом власника, 14.10.2026):
   темно-синє тіло, блакитне світіння контуру, рулі — золоті, закрилки й кабіна — бірюзові, підписи — у «таблетках».
   Усе — SVG у коді (працює без інтернету). Фото справжніх літаків (Вікісховище) — лише якщо ввімкнено.
   Рухомий 3D-літачок (three.js з cdnjs) — для тангажу/крену/рискання; якщо не завантажиться — лишається малюнок.
   API: LA_ART.get(ключ) → <svg>; LA_ART.photo(ключ) → <figure>; LA_ART.mount3D(el) → stop(); LA_ART.fit(el) — підігнати «таблетки» під текст */
(function () {
  'use strict';
  const N = { line: '#5cc0ff', hi: '#a8e0ff', panel: 'rgba(92,192,255,.33)', gd: '#ffc247', gdHi: '#ffe08a', ac: '#2fd2c0', acHi: '#9ff5ea', ink: '#eef4fa', mut: '#8fa6bd', bg: '#0b1626', red: '#ff6b5e', green: '#3ee08f' };
  const still = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
  let U = 0; const uid = () => 'n' + (++U);
  const f = n => Math.round(n * 10) / 10;
  function cr(pts) {   // крива через точки (Catmull-Rom → Безьє)
    let d = '';
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])} `;
    }
    return d;
  }
  function body(prof, dx = 0, dy = 0) {   // симетричний фюзеляж згори: профіль [[y, півширина], …] від носа до хвоста
    const R = prof.map(([y, w]) => [w + dx, y + dy]), L = prof.slice().reverse().map(([y, w]) => [-w + dx, y + dy]);
    return `M${f(R[0][0])},${f(R[0][1])} ${cr(R)}L${f(L[0][0])},${f(L[0][1])} ${cr(L)}Z`;
  }
  const mir = s => `<g transform="scale(-1,1)">${s}</g>`;
  function defs(id) {
    return `<defs>
<linearGradient id="${id}b" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#091729"/><stop offset=".5" stop-color="#18436f"/><stop offset="1" stop-color="#091729"/></linearGradient>
<linearGradient id="${id}v" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#1b4a7a"/><stop offset=".6" stop-color="#10294b"/><stop offset="1" stop-color="#08162a"/></linearGradient>
<linearGradient id="${id}w" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#17406c"/><stop offset="1" stop-color="#0a1c35"/></linearGradient>
<linearGradient id="${id}g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#9ff7ec"/><stop offset=".5" stop-color="#1aa597"/><stop offset="1" stop-color="#0a3a40"/></linearGradient>
<linearGradient id="${id}gd" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffe28e"/><stop offset="1" stop-color="#e09a12"/></linearGradient>
<linearGradient id="${id}ac" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#8ff3e6"/><stop offset="1" stop-color="#139688"/></linearGradient>
<radialGradient id="${id}m" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#d9f2ff"/><stop offset="1" stop-color="#2b6aa3"/></radialGradient>
<radialGradient id="${id}t" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#22405f"/><stop offset="1" stop-color="#08121f"/></radialGradient>
<filter id="${id}n" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b2"/><feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="b1"/><feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="${id}s" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<marker id="${id}a" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="#dbe9f7"/></marker>
<marker id="${id}ag" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L10,5L0,10z" fill="${N.gd}"/></marker>
<marker id="${id}at" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="${N.ac}"/></marker>
</defs>`;
  }
  const ST = (w = 1.6, c = N.line) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round"`;
  const GOLD = id => `fill="url(#${id}gd)" stroke="${N.gdHi}" stroke-width="1.1" stroke-linejoin="round"`;
  const TEAL = id => `fill="url(#${id}ac)" stroke="${N.acHi}" stroke-width="1.1" stroke-linejoin="round"`;

  /* ---------- «таблетки»-підписи ---------- */
  const CW = ch => /[A-ZА-ЯІЇЄҐ0-9α]/.test(ch) ? .63 : ch === ' ' ? .25 : /[.,:;'’!«»()—–\-]/.test(ch) ? .36 : /[шщжмюфы]/.test(ch) ? .74 : .53;
  const tw = (s, fs) => [...s].reduce((a, c) => a + CW(c), 0) * fs;
  const COL = { ink: ['#6fb8ff', '#ffffff'], gd: [N.gd, N.gd], ac: [N.ac, N.ac] };
  function pill(x, y, t, an = 'start', col = 'ink', fs = 15, big) {
    const L = String(t).split('\n'), pad = fs * (big ? .8 : .72), lh = fs * 1.16;
    const w = Math.max(...L.map(l => tw(l, fs))) + pad * 2, h = L.length * lh + fs * (big ? .9 : .66);
    const rx = an === 'end' ? x - w : an === 'middle' ? x - w / 2 : x, ry = y - h / 2, cx = rx + w / 2;
    const [bd, tc] = COL[col] || COL.ink;
    return `<g class="la-pill" data-an="${an}" data-x="${f(x)}" data-pad="${f(pad)}"><rect x="${f(rx)}" y="${f(ry)}" width="${f(w)}" height="${f(h)}" rx="${f(Math.min(h / 2, fs * 1.05))}" fill="${N.bg}" fill-opacity=".92" stroke="${bd}" stroke-width="${big ? 2 : 1.6}"/>` +
      `<text font-size="${fs}" fill="${tc}" font-weight="700" text-anchor="middle">${L.map((l, i) => `<tspan x="${f(cx)}" y="${f(y + (i - (L.length - 1) / 2) * lh + fs * .35)}">${l}</tspan>`).join('')}</text></g>`;
  }
  function LAB(x1, y1, x2, y2, t, an = 'start', col = 'ink', fs = 15) {   // виноска: точка → злам → «таблетка»
    const bd = (COL[col] || COL.ink)[0], k = an === 'end' ? x2 + 16 : x2 - 16;
    const d = an === 'middle' ? `M${x1},${y1} L${x2},${y2}` : `M${x1},${y1} L${k},${y2} L${x2},${y2}`;
    return `<path d="${d}" fill="none" stroke="${bd}" stroke-width="1.5" stroke-linejoin="round" opacity=".9"/><circle cx="${x1}" cy="${y1}" r="3.6" fill="#ffffff" stroke="${bd}" stroke-width="2"/>` + pill(x2, y2, t, an, col, fs);
  }
  /* підігнати ширину «таблеток» під справжню ширину тексту (коли шрифт уже завантажився) */
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
  const spin = (vals, cx = 0, cy = 0, dur = 4) => still ? '' :
    `<animateTransform attributeName="transform" type="rotate" values="${vals.map(v => `${v} ${cx} ${cy}`).join(';')}" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"/>`;

  /* ================= навчальний літак ================= */
  const WING = 'M12,-50 L114,-44 Q121,-43 121,-36 L121,-26 Q121,-19 114,-18 L12,-12 Z';
  const TAIL = 'M4,80 L40,87 Q46,88 46,93 L46,99 Q46,102 42,102 L4,104 Z';
  const FPROF = [[-112, 7.5], [-104, 10.5], [-90, 12], [-60, 12.6], [-30, 12.6], [-5, 11.6], [25, 9.2], [55, 6.8], [85, 4.6], [108, 3.2], [117, 0]];
  const FUS = body(FPROF);
  function planeTop(id, o = {}) {
    const hl = o.hl ? ' class="la-hl"' : '';
    const ail = `<path${hl} d="M72,-23.6 L113,-26 L113,-18 L72,-15.6 Z" ${GOLD(id)}/>`;
    const flap = `<path d="M16,-20.3 L68,-23.4 L68,-15.4 L16,-12.3 Z" ${TEAL(id)}/>`;
    const elev = `<path${hl} d="M4,95.5 L46,94 L46,99 Q46,102 42,102 L4,104 Z" ${GOLD(id)}/>`;
    const wingP = `<path d="${WING}" fill="url(#${id}w)" ${ST()}/><path d="M40,-48.4 L40,-13.6 M80,-46.1 L80,-16 M12,-38 L114,-33.5" fill="none" stroke="${N.panel}" stroke-width=".9"/>`;
    const rud = `<path${hl} d="M-2.3,103 L2.3,103 L0.6,120 L-0.6,120 Z" ${GOLD(id)}>${o.anim === 'yaw' ? spin([-24, 24, -24], 0, 103) : ''}</path>`;
    return `<g filter="url(#${id}n)">
      <ellipse cx="0" cy="-117" rx="50" ry="4.5" fill="rgba(92,192,255,.08)" stroke="rgba(168,224,255,.65)" stroke-width="1"/>
      ${wingP}${mir(wingP)}${ail}${mir(ail)}${flap}${mir(flap)}
      <path d="${TAIL}" fill="url(#${id}w)" ${ST()}/>${mir(`<path d="${TAIL}" fill="url(#${id}w)" ${ST()}/>`)}${elev}${mir(elev)}
      <clipPath id="${id}cf"><path d="${FUS}"/></clipPath>
      <path d="${FUS}" fill="url(#${id}b)" ${ST()}/>
      <g clip-path="url(#${id}cf)" stroke="${N.panel}" stroke-width=".9" fill="none"><path d="M-20,-100 L20,-100 M-20,-86 L20,-86 M-20,-22 L20,-22 M-20,30 L20,30 M-20,70 L20,70 M0,-30 L0,110"/></g>
      <path d="M0,-75 C7,-75 9.4,-67 9.4,-57 L9.4,-41 C9.4,-35 6,-33 0,-33 C-6,-33 -9.4,-35 -9.4,-41 L-9.4,-57 C-9.4,-67 -7,-75 0,-75 Z" fill="url(#${id}g)" ${ST(1.2, N.acHi)}/>
      <path d="M-4.5,-70 C-2,-72 2,-72 4,-70 L3,-52 L-3,-52 Z" fill="#fff" opacity=".35"/>
      <path d="M-1.9,68 L1.9,68 L2.3,103 L-2.3,103 Z" fill="#1b4a7a" ${ST(1.2)}/>${rud}
      <path d="M-7.2,-112 C-7.2,-120 -3,-127 0,-128 C3,-127 7.2,-120 7.2,-112 Z" fill="url(#${id}m)" ${ST(1.1, N.hi)}/>
      <circle cx="120" cy="-31" r="2.8" fill="${N.green}"/><circle cx="-120" cy="-31" r="2.8" fill="${N.red}"/>
    </g>`;
  }
  function planeSide(id, o = {}) {
    const fus = 'M-112,-9 C-104,-13 -92,-14 -80,-14 L-74,-16 C-66,-29 -56,-32 -44,-32 C-30,-32 -18,-29 -8,-24 C14,-19 60,-14 116,-10 L118,-3 C80,-1 30,6 0,11 C-30,15 -70,14 -100,11 C-106,10 -112,9 -112,9 Z';
    return `<g filter="url(#${id}n)">
      <ellipse cx="-127" cy="0" rx="2.6" ry="38" fill="rgba(92,192,255,.08)" stroke="rgba(168,224,255,.65)" stroke-width="1"/>
      <path d="M-40,13 L-47,30 M-96,10 L-97,27" stroke="${N.hi}" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="-47" cy="33" r="7.5" fill="url(#${id}t)" ${ST(1.4)}/><circle cx="-47" cy="33" r="2.4" fill="${N.hi}"/>
      <circle cx="-97" cy="31" r="5.6" fill="url(#${id}t)" ${ST(1.4)}/><circle cx="-97" cy="31" r="1.9" fill="${N.hi}"/>
      <path d="M76,-13 L101,-49 Q104,-53 109,-53 L117,-53 Q119.5,-53 119.5,-50 L118,-10 Z" fill="url(#${id}w)" ${ST()}/>
      <path d="M110,-53 L117,-53 Q119.5,-53 119.5,-50 L118,-10 L110,-12 Z" ${GOLD(id)}/>
      <clipPath id="${id}cs"><path d="${fus}"/></clipPath>
      <path d="${fus}" fill="url(#${id}v)" ${ST()}/>
      <g clip-path="url(#${id}cs)" stroke="${N.panel}" stroke-width=".9" fill="none"><path d="M-92,-20 L-92,20 M-80,-20 L-80,20 M10,-30 L10,20 M60,-30 L60,20"/></g>
      <path d="M-108,1 C-60,3 20,0 112,-6" fill="none" stroke="${N.gd}" stroke-width="2.2"/>
      <path d="M-70,-17 C-63,-27 -55,-29.5 -45,-29.5 C-33,-29.5 -22,-27 -14,-22.6 L-16,-15.5 L-68,-15.5 Z" fill="url(#${id}g)" ${ST(1.1, N.acHi)}/>
      <path d="M-44,-29 L-44,-15.5 M-28,-27.5 L-29,-15.5" stroke="#0a3a40" stroke-width="1.2"/>
      <path d="M86,-6.6 L110,-7 L110,-3.4 L86,-3.8 Z" fill="url(#${id}w)" ${ST(1.2)}/>
      <path d="M110,-7 L122,-6.2 L122,-4.6 L110,-3.4 Z" ${GOLD(id)}>${o.anim === 'pitch' ? spin([-22, 22, -22], 110, -5.2) : ''}</path>
      <path d="M-64,12 C-60,7.5 -46,7 -32,8 C-24,9 -19,11 -17,13 C-32,14.6 -52,15 -64,12 Z" fill="url(#${id}w)" ${ST(1.2)}/>
      <path d="M-112,-8.6 C-119,-8.6 -125,-3 -126.5,0 C-125,3 -119,8.6 -112,8.6 Z" fill="url(#${id}m)" ${ST(1.1, N.hi)}/>
    </g>`;
  }
  function planeFront(id) {
    const wing = `<path d="M12,7 L120,-3 Q123,-3 123,0 L123,2 Q123,4 120,4 L12,14 Z" fill="url(#${id}w)" ${ST()}/>`;
    const tail = `<path d="M0,-6.5 L46,-9 L46,-6 L0,-3.5 Z" fill="#12325c" ${ST(1.1)}/>`;
    return `<g filter="url(#${id}n)">
      ${tail}${mir(tail)}<path d="M-2.2,-15 L2.2,-15 L1.6,-54 L-1.6,-54 Z" fill="#12325c" ${ST(1.2)}/>
      <path d="M14,12 L31,29 M-14,12 L-31,29 M0,16 L0,26" stroke="${N.hi}" stroke-width="2.4" stroke-linecap="round"/>
      <ellipse cx="33" cy="33" rx="4.2" ry="8" fill="url(#${id}t)" ${ST(1.3)}/><ellipse cx="-33" cy="33" rx="4.2" ry="8" fill="url(#${id}t)" ${ST(1.3)}/><ellipse cx="0" cy="30" rx="3.4" ry="6" fill="url(#${id}t)" ${ST(1.3)}/>
      ${wing}${mir(wing)}
      <ellipse cx="0" cy="0" rx="15" ry="17" fill="url(#${id}b)" ${ST()}/>
      <path d="M-10,-6 C-9,-14 -5,-16.5 0,-16.5 C5,-16.5 9,-14 10,-6 Z" fill="url(#${id}g)" ${ST(1.1, N.acHi)}/>
      <circle cx="0" cy="0" r="40" fill="rgba(92,192,255,.06)" stroke="rgba(168,224,255,.6)" stroke-width="1"/>
      <circle cx="0" cy="0" r="6.5" fill="url(#${id}m)" ${ST(1.1, N.hi)}/>
      <circle cx="-122" cy="0.5" r="2.8" fill="${N.green}"/><circle cx="122" cy="0.5" r="2.8" fill="${N.red}"/>
    </g>`;
  }

  /* ================= профіль крила NACA 4415 ================= */
  function naca(m = .04, p = .4, t = .15, n = 70) {
    const up = [], lo = [], cam = [];
    for (let i = 0; i <= n; i++) {
      const b = Math.PI * i / n, x = (1 - Math.cos(b)) / 2;
      const yt = 5 * t * (.2969 * Math.sqrt(x) - .126 * x - .3516 * x * x + .2843 * x ** 3 - .1036 * x ** 4);
      const yc = x < p ? m / (p * p) * (2 * p * x - x * x) : m / ((1 - p) ** 2) * ((1 - 2 * p) + 2 * p * x - x * x);
      const dy = x < p ? 2 * m / (p * p) * (p - x) : 2 * m / ((1 - p) ** 2) * (p - x), th = Math.atan(dy);
      up.push([x - yt * Math.sin(th), yc + yt * Math.cos(th)]); lo.push([x + yt * Math.sin(th), yc - yt * Math.cos(th)]); cam.push([x, yc]);
    }
    return { up, lo, cam };
  }
  const AF = naca();
  const rot = (L, a) => { const r = -a * Math.PI / 180, cs = Math.cos(r), sn = Math.sin(r); return ([x, y]) => [f(x * L * cs - (-y * L) * sn), f(x * L * sn + (-y * L) * cs)]; };
  const afPath = (L, a) => 'M' + AF.up.slice().reverse().concat(AF.lo.slice(1)).map(rot(L, a)).map(p => p.join(',')).join(' L') + ' Z';
  function afPoint(L, a, x, side) {
    const arr = side === 'lo' ? AF.lo : AF.up; let best = arr[0]; for (const q of arr) if (Math.abs(q[0] - x) < Math.abs(best[0] - x)) best = q;
    return rot(L, a)(best);
  }
  function afInside(id, L, a) {   // внутрішня «сітка» профілю: ребра й середня лінія
    const R = rot(L, a), ribs = [.18, .36, .55, .74].map(x => { const u = afPoint(L, a, x, 'up'), d = afPoint(L, a, x, 'lo'); return `M${u[0]},${u[1]} L${d[0]},${d[1]}`; }).join(' ');
    return `<path d="${ribs} M${AF.cam.map(R).map(p => p.join(',')).join(' L')}" fill="none" stroke="${N.panel}" stroke-width="1"/>`;
  }

  /* ================= малюнки ================= */
  const ART = {};
  ART.title = () => { const id = uid(); return `<svg viewBox="-140 -140 280 280" role="img" aria-label="Навчальний літак, вигляд згори">${defs(id)}<g transform="rotate(-28)">${planeTop(id)}</g></svg>`; };

  ART.parts = () => {
    const id = uid();
    return `<svg viewBox="-286 -146 572 398" role="img" aria-label="Частини літака: вигляд згори і збоку">${defs(id)}
      <text x="-282" y="-128" font-size="12" fill="${N.mut}" letter-spacing="2" font-weight="700">ВИГЛЯД ЗГОРИ</text>
      ${planeTop(id)}
      ${LAB(28, -117, 140, -128, 'Гвинт')}${LAB(7, -98, 140, -84, 'Двигун\n(під капотом)')}${LAB(6, -56, 140, -40, 'Кабіна', 'start', 'ac')}
      ${LAB(42, -17, 140, 2, 'Закрилок', 'start', 'ac')}${LAB(8, 32, 140, 44, 'Фюзеляж')}${LAB(0.5, 112, 140, 98, 'Кіль і\nруль напрямку', 'start', 'gd')}
      ${LAB(-60, -34, -140, -60, 'Крило', 'end')}${LAB(-94, -22, -140, -14, 'Елерон', 'end', 'gd')}${LAB(-26, 87, -140, 60, 'Стабілізатор', 'end')}${LAB(-26, 99.5, -140, 104, 'Руль висоти', 'end', 'gd')}
      <line x1="-282" y1="146" x2="282" y2="146" stroke="#1f3b5c" stroke-width="1.2"/>
      <text x="-282" y="168" font-size="12" fill="${N.mut}" letter-spacing="2" font-weight="700">ВИГЛЯД ЗБОКУ</text>
      <g transform="translate(20,204) scale(.78)">${planeSide(id)}</g>
      <path d="M-55.7,228.2 L-124,214 M-16.7,229.7 L-124,214 L-140,214" fill="none" stroke="#6fb8ff" stroke-width="1.5" stroke-linejoin="round"/><circle cx="-55.7" cy="228.2" r="3.6" fill="#fff" stroke="#6fb8ff" stroke-width="2"/><circle cx="-16.7" cy="229.7" r="3.6" fill="#fff" stroke="#6fb8ff" stroke-width="2"/>${pill(-140, 214, 'Шасі', 'end')}
      ${LAB(112, 168, 140, 180, 'Кіль', 'start', 'gd')}</svg>`;
  };

  /* що чим керує: рулі світяться */
  ART.controls = () => {
    const id = uid();
    return `<svg viewBox="-300 -142 600 290" role="img" aria-label="Рулі літака і що вони роблять">${defs(id)}
      <g class="la-hl-wrap">${planeTop(id, { hl: true })}</g>
      ${LAB(92, -22, 140, -30, 'Елерони\n→ крен', 'start', 'gd')}${LAB(26, 99, 140, 60, 'Руль висоти\n→ тангаж', 'start', 'gd')}${LAB(0.5, 113, 140, 112, 'Руль напрямку\n→ рискання', 'start', 'gd')}
      ${LAB(-92, -22, -140, -64, 'Елерони\n→ крен', 'end', 'gd')}${LAB(-42, -17, -140, 6, 'Закрилки → більше\nпідйомної сили', 'end', 'ac')}${LAB(-26, 87, -140, 84, 'Стабілізатор\nі кіль → стійкість', 'end')}</svg>`;
  };

  ART.airfoil = () => {
    const id = uid(), L = 330, a = 8, X0 = 84, Y0 = 156;
    const te = afPoint(L, a, 1, 'up'), top = afPoint(L, a, .33, 'up'), bot = afPoint(L, a, .5, 'lo'), c1 = rot(L, a)([.33, 0]);
    const ar = 210, ex = f(X0 + ar * Math.cos(a * Math.PI / 180)), ey = f(Y0 - ar * Math.sin(a * Math.PI / 180));
    return `<svg viewBox="0 0 480 270" role="img" aria-label="Профіль крила">${defs(id)}
      ${[118, 156, 194].map(y => `<line x1="8" y1="${y}" x2="58" y2="${y}" stroke="#dbe9f7" stroke-width="2" opacity=".6" marker-end="url(#${id}a)"/><line class="la-flow" x1="0" y1="${y}" x2="58" y2="${y}" stroke="#ffffff" stroke-width="3"/>`).join('')}
      ${pill(8, 92, 'зустрічний потік', 'start', 'ink', 13)}
      <line x1="${X0}" y1="${Y0}" x2="${X0 + 270}" y2="${Y0}" stroke="#dbe9f7" stroke-width="1.3" stroke-dasharray="4 6" opacity=".45"/>
      <g transform="translate(${X0},${Y0})" filter="url(#${id}n)"><path d="${afPath(L, a)}" fill="url(#${id}w)" ${ST(2.2)}/>${afInside(id, L, a)}
        <line x1="0" y1="0" x2="${te[0]}" y2="${te[1]}" stroke="${N.gd}" stroke-width="2.6" stroke-dasharray="10 7"/></g>
      <path d="M${X0 + ar},${Y0} A${ar},${ar} 0 0 0 ${ex},${ey}" fill="none" stroke="${N.gd}" stroke-width="4" filter="url(#${id}s)"/>
      <circle cx="${X0}" cy="${Y0}" r="5.5" fill="${N.acHi}" stroke="${N.ac}" stroke-width="2"/><circle cx="${X0 + te[0]}" cy="${Y0 + te[1]}" r="5.5" fill="${N.acHi}" stroke="${N.ac}" stroke-width="2"/>
      ${pill(X0 + ar + 14, Y0 - 16, 'α — кут атаки', 'start', 'gd', 15)}
      ${LAB(X0 - 2, Y0 + 3, 18, 236, 'передня кромка', 'start', 'ac', 14)}${LAB(X0 + c1[0], Y0 + c1[1], 168, 236, 'хорда', 'start', 'gd', 14)}
      ${LAB(X0 + bot[0], Y0 + bot[1], 258, 236, 'нижня поверхня', 'start', 'ink', 14)}
      ${LAB(X0 + te[0] + 2, Y0 + te[1] - 2, 472, 52, 'задня кромка', 'end', 'ac', 14)}${LAB(X0 + top[0], Y0 + top[1], X0 + top[0] - 30, 26, 'верхня поверхня — опукліша', 'start', 'ink', 14)}</svg>`;
  };

  ART.lift = () => {
    const id = uid(), L = 300, a = 6, X0 = 84, Y0 = 168;
    const te = afPoint(L, a, 1, 'up');
    const surf = x => { const p = afPoint(L, a, x, 'up'); return [X0 + p[0], Y0 + p[1]]; };
    const stream = h => {
      const d = h * .6 + 12, e = [X0 + te[0], Y0 + te[1]];
      const pts = [[8, Y0 - d + 10], [X0 - 46, Y0 - d + 6], [X0 - 14, Y0 - d - 2]];
      for (let x = .04; x <= .98; x += .1) { const s = surf(x); pts.push([s[0], s[1] - d * (1 - .25 * x)]); }
      pts.push([e[0] + 2, e[1] - d * .7], [e[0] + 34, e[1] - d * .45 + 10], [464, e[1] - d * .2 + 36]);
      return 'M' + pts[0].join(',') + ' ' + cr(pts);
    };
    const s1 = surf(.3);
    return `<svg viewBox="0 0 480 290" role="img" aria-label="Підйомна сила">${defs(id)}
      <g filter="url(#${id}n)">${[22, 50].map(h => `<path d="${stream(h)}" fill="none" stroke="${N.ac}" stroke-width="3" marker-end="url(#${id}at)"/>`).join('')}
        ${[0, 1].map(k => `<path d="M8,${210 + k * 26} C150,${210 + k * 26} 300,${205 + k * 24} 464,${224 + k * 22}" fill="none" stroke="#cfdcea" stroke-width="2.4" opacity=".75" marker-end="url(#${id}a)"/>`).join('')}
        <g transform="translate(${X0},${Y0})"><path d="${afPath(L, a)}" fill="url(#${id}w)" ${ST(2.2)}/>${afInside(id, L, a)}</g></g>
      ${[22, 50].map(h => `<path class="la-flow" d="${stream(h)}" fill="none" stroke="#eafffb" stroke-width="3.4"/>`).join('')}
      ${[0, 1].map(k => `<path class="la-flow slow" d="M8,${210 + k * 26} C150,${210 + k * 26} 300,${205 + k * 24} 464,${224 + k * 22}" fill="none" stroke="#ffffff" stroke-width="3"/>`).join('')}
      <g filter="url(#${id}n)"><path class="la-pulse" d="M234,150 L234,64 L218,64 L242,22 L266,64 L250,64 L250,150 Z" fill="url(#${id}gd)" stroke="${N.gdHi}" stroke-width="1.5"/></g>
      ${pill(276, 40, 'підйомна сила', 'start', 'gd', 16)}
      ${LAB(120, s1[1] - 46, 120, 54, 'швидше — тиск менший', 'middle', 'ac', 14)}
      ${LAB(140, 236, 140, 272, 'повільніше — тиск більший', 'start', 'ink', 14)}
      ${LAB(X0 + te[0] + 20, Y0 + te[1] + 8, 470, 194, 'повітря — донизу', 'end', 'ac', 14)}</svg>`;
  };

  ART.strip = () => {
    const id = uid(), DO = 'M36,92 C120,96 230,150 330,208', PISLIA = 'M36,92 C120,88 230,92 350,106';
    const T = still ? '' : `dur="4.5s" repeatCount="indefinite" keyTimes="0;.18;.42;.8;1" calcMode="spline" keySplines=".4 0 .6 1;.4 0 .6 1;.4 0 .6 1;.4 0 .6 1"`;
    return `<svg viewBox="0 0 450 240" role="img" aria-label="Дослід зі смужкою паперу">${defs(id)}
      <g filter="url(#${id}n)"><path d="M0,26 C14,30 22,44 26,58 L40,70 C38,74 33,75 30,76 C32,80 36,82 36,85 C34,87 31,88 31,89 C34,91 36,94 34,98 C31,105 31,114 27,124 C22,135 12,140 0,142 Z" fill="url(#${id}v)" ${ST(1.8)}/>
        <path d="${DO}" fill="none" stroke="#cfdcea" stroke-width="3" stroke-dasharray="7 7" opacity=".4"/>
        <path d="${still ? PISLIA : DO}" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round">${still ? '' : `<animate attributeName="d" values="${DO};${DO};${PISLIA};${PISLIA};${DO}" ${T}/>`}</path>
        <g>${still ? '' : `<animate attributeName="opacity" values="0;0;1;1;0" ${T}/>`}${[0, 1, 2].map(k => `<path d="M48,${74 - k * 13} C110,${72 - k * 13} 170,${74 - k * 11} ${250 - k * 26},${80 - k * 10}" fill="none" stroke="${N.ac}" stroke-width="2.6" marker-end="url(#${id}at)"/><path class="la-flow" d="M48,${74 - k * 13} C110,${72 - k * 13} 170,${74 - k * 11} ${250 - k * 26},${80 - k * 10}" fill="none" stroke="#eafffb" stroke-width="3.2"/>`).join('')}</g></g>
      ${pill(62, 22, 'дуємо над смужкою', 'start', 'ac', 14)}${pill(362, 106, 'після', 'start', 'ink', 14)}${pill(338, 214, 'до', 'start', 'ink', 13)}
      <text x="62" y="186" font-size="13" fill="${N.mut}" font-weight="600">смужка паперу ≈ 3 × 20 см</text></svg>`;
  };

  ART.paper = () => {
    const id = uid();
    return `<svg viewBox="-230 -136 460 280" role="img" aria-label="Паперовий літачок з рулями, вигляд згори">${defs(id)}
      <g filter="url(#${id}n)"><polygon points="0,-122 112,100 14,80 0,100 -14,80 -112,100" fill="url(#${id}w)" stroke="#e9f3ff" stroke-width="2" stroke-linejoin="round"/>
        <path d="M0,-122 L14,80 M0,-122 L-14,80" stroke="${N.panel}" stroke-width="1.2" fill="none"/><line x1="0" y1="-122" x2="0" y2="100" stroke="${N.ac}" stroke-width="2.2" stroke-dasharray="7 6"/>
        <polygon points="58,74 104,83.5 107,97.4 61,88" ${GOLD(id)}/><polygon points="-58,74 -104,83.5 -107,97.4 -61,88" ${GOLD(id)}/></g>
      ${LAB(84, 86, 128, 36, 'надріз —\n«руль»', 'start', 'gd')}${LAB(-84, 86, -128, 36, 'надріз —\n«руль»', 'end', 'gd')}${LAB(0, 20, 128, -44, 'згин —\n«кіль»', 'start', 'ac')}
      <text x="0" y="134" font-size="13" fill="${N.mut}" text-anchor="middle" font-weight="600">Вигляд згори. Рулі — на задньому краї крил.</text></svg>`;
  };

  /* тангаж / крен / рискання — три рухомі вигляди (запасний варіант до 3D) */
  ART.axes = () => {
    const id = uid();
    const arc = r => `<path d="M${110 - r},72 A${r},${r * 0.55} 0 1 1 ${110 + r * 0.2},${72 + r * 0.54}" fill="none" stroke="${N.gd}" stroke-width="4" marker-end="url(#${id}ag)" filter="url(#${id}s)"/>`;
    const rows = [
      [`<g transform="translate(110,72) scale(.66)"><g>${planeSide(id, { anim: 'pitch' })}${spin([9, -9, 9])}</g></g>`, 94, 'Тангаж', 'ніс угору або вниз', 'руль висоти'],
      [`<g transform="translate(110,74) scale(.68)"><g>${planeFront(id)}${spin([-16, 16, -16])}</g></g>`, 98, 'Крен', 'нахил крил ліворуч / праворуч', 'елерони'],
      [`<g transform="translate(110,72) scale(.48)"><g>${planeTop(id, { anim: 'yaw' })}${spin([14, -14, 14])}</g></g>`, 90, 'Рискання', 'ніс ліворуч або праворуч', 'руль напрямку']
    ];
    return `<svg viewBox="0 0 470 432" role="img" aria-label="Тангаж, крен і рискання">${defs(id)}
      ${rows.map(([g, r, n, d, c], k) => `<g transform="translate(0,${k * 144})">${k ? '<line x1="20" y1="0" x2="450" y2="0" stroke="#1f3b5c" stroke-width="1.2"/>' : ''}${arc(r)}${g}
        ${pill(236, 38, n, 'start', 'ink', 24, true)}${pill(236, 78, d, 'start', 'ink', 13)}${pill(236, 110, 'керує: ' + c, 'start', 'gd', 14)}</g>`).join('')}</svg>`;
  };

  /* види ЛА — вісім неонових значків */
  ART.types = () => {
    const id = uid();
    const cell = (i, svg, t) => { const x = (i % 4) * 114, y = Math.floor(i / 4) * 132; return `<g transform="translate(${x},${y})"><rect x="3" y="3" width="108" height="124" rx="16" fill="rgba(92,192,255,.04)" stroke="#1f3b5c" stroke-width="1.2"/><g filter="url(#${id}n)">${svg}</g><text x="57" y="114" font-size="13" fill="${N.ink}" text-anchor="middle" font-weight="700">${t}</text></g>`; };
    const balloon = `<clipPath id="${id}cb"><path d="M57,10 C81,10 93,27 91,45 C89,61 74,71 64,79 L50,79 C40,71 25,61 23,45 C21,27 33,10 57,10 Z"/></clipPath>
      <path d="M57,10 C81,10 93,27 91,45 C89,61 74,71 64,79 L50,79 C40,71 25,61 23,45 C21,27 33,10 57,10 Z" fill="url(#${id}w)" ${ST()}/>
      <g clip-path="url(#${id}cb)" fill="none"><path d="M57,8 L57,82 M40,10 C30,30 36,60 50,80 M74,10 C84,30 78,60 64,80" stroke="${N.panel}" stroke-width="1.2"/><rect x="18" y="38" width="80" height="9" fill="url(#${id}gd)"/></g>
      <path d="M50,79 L64,79 L62,85 L52,85 Z" fill="#12325c" ${ST(1.2)}/><path d="M52,85 L51,93 M62,85 L63,93" stroke="${N.hi}" stroke-width="1.2"/><rect x="49" y="92" width="16" height="9" rx="2" fill="url(#${id}gd)" stroke="${N.gdHi}"/>`;
    const airship = `<ellipse cx="53" cy="46" rx="42" ry="15" fill="url(#${id}v)" ${ST()}/><path d="M81,40 L99,29 L100,40 Z M81,52 L99,63 L100,52 Z" ${GOLD(id)}/>
      <path d="M22,46 L84,46 M40,32 L40,60 M60,31 L60,61" stroke="${N.panel}" stroke-width="1"/><rect x="41" y="60" width="22" height="8" rx="4" fill="url(#${id}g)" ${ST(1.1, N.acHi)}/>`;
    const plane = `<g transform="translate(59,56) scale(.36)">${planeSide(id)}</g>`;
    const glider = `<path d="M6,44 L108,44 L106,49 L8,49 Z" fill="url(#${id}w)" ${ST(1.3)}/><path d="${body([[-36, 2], [-30, 4.5], [-18, 5], [0, 4], [30, 2], [46, 0]], 57, 50)}" fill="url(#${id}b)" ${ST(1.3)}/>
      <path d="M44,92 L70,92 L69,95 L45,95 Z" ${GOLD(id)}/><ellipse cx="57" cy="28" rx="3.4" ry="7" fill="url(#${id}g)"/>`;
    const heli = `<path d="M10,30 L104,30" stroke="${N.hi}" stroke-width="3" stroke-linecap="round"/><ellipse cx="57" cy="30" rx="48" ry="3" fill="rgba(92,192,255,.12)"/><path d="M57,30 L57,38" stroke="${N.hi}" stroke-width="3"/>
      <path d="M75,50 L101,47 L101,52 L75,60 Z" fill="url(#${id}w)" ${ST(1.3)}/><circle cx="102" cy="46" r="8" fill="rgba(92,192,255,.1)" stroke="rgba(168,224,255,.6)"/>
      <path d="M29,58 C29,45 41,38 55,38 L67,38 C75,38 80,46 80,54 L80,62 C80,66 76,68 72,68 L37,68 C32,68 29,64 29,58 Z" fill="url(#${id}v)" ${ST()}/>
      <path d="M31,56 C31,47 39,42 49,42 L51,42 L51,58 L31,58 Z" fill="url(#${id}g)"/><path d="M39,68 L37,76 M71,68 L73,76 M27,76 C31,79 81,79 87,76" stroke="${N.hi}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    const drone = `${[[27, 26], [87, 26], [27, 82], [87, 82]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="15" fill="rgba(92,192,255,.1)" stroke="rgba(168,224,255,.6)"/><path d="M${x - 13},${y + 2} L${x + 13},${y - 2}" stroke="${N.hi}" stroke-width="2"/>`).join('')}
      <path d="M27,26 L87,82 M87,26 L27,82" stroke="${N.line}" stroke-width="4.5" stroke-linecap="round"/><rect x="44" y="41" width="26" height="26" rx="7" fill="url(#${id}v)" ${ST()}/><circle cx="57" cy="54" r="5" fill="url(#${id}g)"/><circle cx="48" cy="44" r="2.2" fill="${N.red}"/><circle cx="66" cy="44" r="2.2" fill="${N.green}"/>`;
    const para = `<path d="M11,36 Q57,2 103,36 Q57,20 11,36 Z" ${GOLD(id)}/><path d="M23,27 L24,33 M35,21 L36,29 M47,18 L47,27 M57,17 L57,27 M67,18 L67,27 M79,21 L78,29 M91,27 L90,33" stroke="#b07a10" stroke-width="1"/>
      <path d="M15,35 L53,80 M99,35 L61,80 M37,28 L55,80 M77,28 L59,80" stroke="${N.hi}" stroke-width=".8" opacity=".85"/><circle cx="57" cy="80" r="4" fill="${N.acHi}"/><path d="M51,84 L63,84 L61,94 L53,94 Z" fill="url(#${id}v)" ${ST(1.1)}/>`;
    const rocket = `<path d="M57,10 C68,22 70,40 68,74 L46,74 C44,40 46,22 57,10 Z" fill="url(#${id}b)" ${ST()}/><path d="M57,10 C63,16 66,22 67,28 L47,28 C48,22 51,16 57,10 Z" ${GOLD(id)}/>
      <circle cx="57" cy="44" r="6" fill="url(#${id}g)" ${ST(1.1, N.acHi)}/><path d="M46,58 L34,80 L46,76 Z M68,58 L80,80 L68,76 Z" ${GOLD(id)}/><path d="M49,74 Q57,104 65,74 Z" fill="${N.gd}"/><path d="M53,74 Q57,92 61,74 Z" fill="#fff4cc"/>`;
    return `<svg viewBox="0 0 456 264" role="img" aria-label="Види літальних апаратів">${defs(id)}
      ${cell(0, balloon, 'Повітряна куля')}${cell(1, airship, 'Дирижабль')}${cell(2, plane, 'Літак')}${cell(3, glider, 'Планер')}
      ${cell(4, heli, 'Гелікоптер')}${cell(5, drone, 'Дрон')}${cell(6, para, 'Параплан')}${cell(7, rocket, 'Ракета')}</svg>`;
  };

  /* аеродинамічні схеми — силуети справжніх літаків (згори, ніс угору) */
  function scheme(k, id) {
    const W = `fill="url(#${id}w)" ${ST()}`, B = `fill="url(#${id}b)" ${ST()}`, G = 'class="la-hl" ' + GOLD(id), E = `fill="#12325c" ${ST(1.2)}`;
    const both = s => s + mir(s);
    const glass = d => `<path d="${d}" fill="url(#${id}g)"/>`;
    if (k === 'normal') return `<g filter="url(#${id}n)">${both(`<path d="M10,-22 L106,20 L108,27 L98,27 L10,8 Z" ${W}/><path d="M30,-12 L100,18" stroke="${N.panel}" stroke-width="1"/><rect x="36" y="-18" width="9" height="26" rx="4" ${E}/>`)}
        ${both(`<path d="M4,86 L42,102 L43,108 L4,102 Z" ${G}/>`)}<path d="${body([[-120, 1.5], [-114, 6], [-104, 9.5], [-90, 10.5], [60, 10.5], [92, 7], [112, 3], [119, 0]])}" ${B}/>
        <path d="M-1.6,80 L1.6,80 L1.6,116 L-1.6,116 Z" ${G}/>${glass('M-6,-108 C-3,-111 3,-111 6,-108 L5,-104 L-5,-104 Z')}</g>`;
    if (k === 'canard') return `<g filter="url(#${id}n)"><ellipse cx="0" cy="98" rx="26" ry="3.4" fill="rgba(92,192,255,.1)" stroke="rgba(168,224,255,.6)"/>
        ${both(`<path d="M8,18 L94,56 Q99,58 99,63 L99,70 L91,70 L8,58 Z" ${W}/><path d="M93,54 L100,57 L101,74 L94,71 Z" ${E}/>`)}
        ${both(`<path d="M7,-86 L46,-84 Q50,-84 50,-80 L50,-76 Q50,-73 46,-73 L7,-75 Z" ${G}/>`)}
        <path d="${body([[-112, 2.5], [-104, 6.5], [-84, 9], [-40, 9.6], [0, 9.2], [40, 8], [70, 6], [88, 3.5], [94, 0]])}" ${B}/>
        <path d="M0,-66 C6,-66 7,-58 7,-50 L7,-30 C7,-26 4,-24 0,-24 C-4,-24 -7,-26 -7,-30 L-7,-50 C-7,-58 -6,-66 0,-66 Z" fill="url(#${id}g)" ${ST(1.1, N.acHi)}/></g>`;
    if (k === 'tailless') return `<g filter="url(#${id}n)">${both(`<rect x="22" y="70" width="9" height="38" rx="3" ${E}/><rect x="33" y="70" width="9" height="38" rx="3" ${E}/>`)}
        ${both(`<path d="M5,-74 C16,-46 36,-6 56,34 C68,58 78,78 82,96 L5,101 Z" ${W}/><path d="M10,-20 L40,60 M5,40 L70,70" stroke="${N.panel}" stroke-width="1"/><path d="M16,93 L80,89.5 L82,96 L16,100 Z" ${G}/>`)}
        <path d="${body([[-124, 1], [-114, 4], [-94, 6.6], [60, 6.6], [100, 4.4], [116, 1.4], [120, 0]])}" ${B}/>
        <path d="M-1.6,58 L1.6,58 L1.6,114 L-1.6,114 Z" ${G}/>${glass('M-4,-106 C-2,-109 2,-109 4,-106 L3.6,-100 L-3.6,-100 Z')}</g>`;
    if (k === 'flyingwing') return `<g filter="url(#${id}n)"><path d="M0,-62 L106,40 L97,51 L73,35 L50,53 L27,37 L0,51 L-27,37 L-50,53 L-73,35 L-97,51 L-106,40 Z" fill="url(#${id}v)" ${ST()}/>
        ${both(`<path d="M97,51 L73,35 L76,31 L101,46 Z" ${G}/><path d="M50,53 L27,37 L30,33 L52,48 Z" ${G}/><path d="M20,-42 L70,20" stroke="${N.panel}" stroke-width="1"/>`)}
        <path d="M0,-50 C9,-46 14,-30 14,-14 C14,4 8,14 0,16 C-8,14 -14,4 -14,-14 C-14,-30 -9,-46 0,-50 Z" fill="#1b4a7a" ${ST(1.2)}/>
        ${glass('M-6,-36 L6,-36 L5,-30 L-5,-30 Z')}${both(`<path d="M18,-12 L30,-6 L29,-3 L17,-9 Z" fill="#06101c" stroke="${N.line}" stroke-width=".8"/>`)}</g>`;
    if (k === 'tandem') return `<g filter="url(#${id}n)"><ellipse cx="0" cy="-90" rx="36" ry="3.6" fill="rgba(92,192,255,.1)" stroke="rgba(168,224,255,.6)"/>
        <path d="${body([[-84, 4.5], [-76, 9.5], [-54, 11.5], [0, 10.5], [40, 7.5], [70, 3.5], [80, 0]])}" ${B}/>
        <path d="M-70,30 L70,30 Q77,30 77,37 L77,45 Q77,52 70,52 L-70,52 Q-77,52 -77,45 L-77,37 Q-77,30 -70,30 Z" ${W}/>
        <path d="M-92,-62 L92,-62 Q101,-62 101,-53 L101,-35 Q101,-27 92,-27 L-92,-27 Q-101,-27 -101,-35 L-101,-53 Q-101,-62 -92,-62 Z" ${W}/>
        <path d="M-60,-62 L-60,-27 M60,-62 L60,-27 M-40,30 L-40,52 M40,30 L40,52" stroke="${N.panel}" stroke-width="1"/>
        <path d="M0,-24 C5,-24 7,-20 7,-14 L7,-4 L-7,-4 L-7,-14 C-7,-20 -5,-24 0,-24 Z" fill="url(#${id}g)" ${ST(1.1, N.acHi)}/>
        <path d="M-2,58 L2,58 L2.6,84 L-2.6,84 Z" ${G}/><path d="M-6,-84 C-6,-90 -3,-94 0,-95 C3,-94 6,-90 6,-84 Z" fill="url(#${id}m)"/></g>`;
    return '';
  }
  const SCH = {
    normal: [[-70, 6, -130, -40, 'крило'], [-26, 95, -130, 96, 'оперення\nпозаду', 'end', 'gd']],
    canard: [[-30, -79, -130, -92, 'оперення\nпопереду', 'end', 'gd'], [-62, 52, -130, 70, 'крило']],
    tailless: [[-50, 96, -130, 64, 'рулі — на\nзадній кромці', 'end', 'gd'], [0, 100, 130, 92, 'кіль', 'start', 'gd']],
    flyingwing: [[-62, 20, -130, -20, 'усе —\nу крилі'], [0, 46, 130, 86, 'без фюзеляжу\nі хвоста', 'start']],
    tandem: [[-60, -44, -130, -72, 'переднє\nкрило'], [-60, 41, -130, 70, 'заднє\nкрило']]
  };
  ART.schemes = () => {
    const id = uid(), L = [['normal', 'Нормальна'], ['canard', '«Качка»'], ['tailless', '«Безхвістка»'], ['flyingwing', '«Літаюче крило»'], ['tandem', '«Тандем»']];
    const pos = [[78, 70], [228, 70], [378, 70], [153, 230], [303, 230]];
    return `<svg viewBox="0 0 456 318" role="img" aria-label="П’ять аеродинамічних схем">${defs(id)}${L.map(([k, t], i) => `<g transform="translate(${pos[i][0]},${pos[i][1] - 8}) scale(.5)">${scheme(k, id)}</g>${pill(pos[i][0], pos[i][1] + 72, t, 'middle', 'ink', 14)}`).join('')}</svg>`;
  };
  function silhouette(k) {   // для гри «Вгадай схему» — без підписів
    const id = uid();
    return `<svg viewBox="-128 -132 256 262" role="img" aria-label="Силует літака">${defs(id)}${k === 'normal' ? planeTop(id) : scheme(k, id)}</svg>`;
  }
  function schemeOne(k) {
    const id = uid();
    return `<svg viewBox="-262 -130 524 262" role="img" aria-label="Схема згори">${defs(id)}${scheme(k, id)}${(SCH[k] || []).map(([a, b, c, d, t, an, col]) => LAB(a, b, c, d, t, an || 'end', col || 'ink')).join('')}</svg>`;
  }

  /* ================= фото з Вікісховища (суспільне надбання / вільні ліцензії) ================= */
  const PH = {
    normal: { f: 'Antonov An-225 with Buran at Le Bourget 1989 Manteufel.jpg', t: 'Ан-225 «Мрія» з «Бураном», Ле Бурже, 1989', a: 'Ralf Manteufel, GFDL 1.2' },
    canard: { f: 'Rutan.variEze.g-veze.arp.jpg', t: 'Rutan VariEze: оперення попереду', a: 'Adrian Pingstone, суспільне надбання' },
    canard2: { f: 'First flight2.jpg', t: 'Перший політ братів Райт, 17.12.1903 — теж «качка»', a: 'Бібліотека Конгресу США, суспільне надбання' },
    tailless: { f: 'Concorde g-boab heathrow.jpg', t: 'Concorde G-BOAB, Лондон', a: 'Adrian Pingstone, суспільне надбання' },
    flyingwing: { f: 'B-2 Spirit original.jpg', t: 'B-2 Spirit над Тихим океаном', a: 'ВПС США, суспільне надбання' }
  };
  const photoUrl = (name, w) => 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(name.replace(/ /g, '_')) + '?width=' + w;
  const pageUrl = name => 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(name.replace(/ /g, '_'));
  function photo(k, cls = '') {
    const p = PH[k]; if (!p) return '';
    return `<figure class="la-ph ${cls}"><img src="${photoUrl(p.f, 960)}" alt="${p.t}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('figure').remove()"><figcaption>${p.t}. Фото: <a href="${pageUrl(p.f)}" target="_blank" rel="noopener">${p.a}</a>, Вікісховище</figcaption></figure>`;
  }

  /* ================= неоновий 3D-літачок (three.js) ================= */
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
    loadThree().then(T => { if (stop || !el.isConnected) return; try { cleanup = build3D(T, el, opt); } catch (e) { const w = el.querySelector('.la3d'); if (w) w.remove(); } }).catch(() => {});
    return () => { stop = true; cleanup(); };
  }
  function build3D(T, el, opt = {}) {
    const hero = !!opt.hero;
    const wrap = document.createElement('div'); wrap.className = 'la3d' + (hero ? ' hero' : '');
    wrap.innerHTML = `<canvas></canvas><div class="la3d-ui"><b></b><span></span><div class="la3d-btn"><button type="button" data-m="pitch">Тангаж</button><button type="button" data-m="roll">Крен</button><button type="button" data-m="yaw">Рискання</button><button type="button" data-m="all" class="on">По черзі</button></div></div>`;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.appendChild(wrap);
    const cv = wrap.querySelector('canvas');
    const R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    R.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(32, 1, .1, 100);
    scene.fog = new T.Fog(0x16191e, 9, 17);
    cam.position.set(5.8, 3.7, 8.2); cam.lookAt(0.1, -0.55, 0);
    scene.add(new T.HemisphereLight(0x6fb8ff, 0x061120, .9));
    const key = new T.DirectionalLight(0xbfe4ff, .9); key.position.set(4, 8, 5); scene.add(key);
    const rim = new T.DirectionalLight(0x2fd2c0, .55); rim.position.set(-6, 2, -4); scene.add(rim);
    // матеріали: темно-синє тіло, світні контури
    const M = (c, e, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, emissive: e, roughness: .35, metalness: .45 }, o));
    const navy = M(0x10294b, 0x07162b), gold = M(0xffc247, 0x8a5c00, { roughness: .3 }), teal = M(0x2fd2c0, 0x0a6a60), dark = M(0x0a1626, 0x02060c, { roughness: .8 });
    const glass = M(0x2fd2c0, 0x0b4f55, { transparent: true, opacity: .8, roughness: .08, metalness: .7 });
    const LN = c => new T.LineBasicMaterial({ color: c, transparent: true, opacity: .95 });
    const lBlue = LN(0x6cc8ff), lGold = LN(0xffe08a), lTeal = LN(0x9ff5ea);
    const edges = (mesh, mat, ang = 25) => { mesh.add(new T.LineSegments(new T.EdgesGeometry(mesh.geometry, ang), mat)); return mesh; };
    const hull = (mesh, color, sx, sy, sz) => { const o = new T.Mesh(mesh.geometry, new T.MeshBasicMaterial({ color, side: T.BackSide })); o.scale.set(sx, sy, sz); mesh.add(o); return mesh; };
    const plane = new T.Group(); scene.add(plane);
    // фюзеляж
    const prof = [[0, 2.35], [.2, 2.25], [.32, 2.05], [.34, 1.6], [.33, .6], [.27, -.6], [.2, -1.4], [.12, -2.15], [.02, -2.4]].reverse();   // від хвоста до носа — щоб грані дивились назовні
    const fus = new T.Mesh(new T.LatheGeometry(prof.map(([r, x]) => new T.Vector2(Math.max(.001, r), x)), 40), navy);
    fus.rotation.z = -Math.PI / 2; hull(fus, 0x5cc0ff, 1.07, 1.006, 1.07); edges(fus, LN(0x2f6db0), 30); plane.add(fus);
    const can = new T.Mesh(new T.SphereGeometry(.3, 28, 18), glass); can.scale.set(1.9, .9, .85); can.position.set(.75, .27, 0); hull(can, 0x9ff5ea, 1.05, 1.08, 1.08); plane.add(can);
    const stripe = new T.Mesh(new T.CylinderGeometry(.012, .012, 3.6, 6), new T.MeshBasicMaterial({ color: 0xffc247 })); stripe.rotation.z = Math.PI / 2; stripe.position.set(-.1, .02, .325); plane.add(stripe);
    const stripe2 = stripe.clone(); stripe2.position.z = -.325; plane.add(stripe2);
    const spinner = new T.Mesh(new T.ConeGeometry(.16, .34, 24), M(0xa8e0ff, 0x1b4a7a, { metalness: .8 })); spinner.rotation.z = -Math.PI / 2; spinner.position.x = 2.5; plane.add(spinner);
    const prop = new T.Group(); prop.position.x = 2.4; plane.add(prop);
    prop.add(edges(new T.Mesh(new T.BoxGeometry(.05, 1.5, .12), dark), lBlue));
    const disc = new T.Mesh(new T.RingGeometry(.72, .78, 48), new T.MeshBasicMaterial({ color: 0x6cc8ff, transparent: true, opacity: .35, side: T.DoubleSide })); disc.rotation.y = Math.PI / 2; prop.add(disc);
    const disc2 = new T.Mesh(new T.CircleGeometry(.75, 48), new T.MeshBasicMaterial({ color: 0x5cc0ff, transparent: true, opacity: .06, side: T.DoubleSide })); disc2.rotation.y = Math.PI / 2; prop.add(disc2);
    // крило й хвіст — видавлені обриси (горизонтальні): форма в площині (x — уздовж польоту, y — розмах)
    function flat(pts, th, mat, line) {
      const s = new T.Shape(); s.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => p.length > 2 ? s.quadraticCurveTo(p[0], p[1], p[2], p[3]) : s.lineTo(p[0], p[1]));
      const g = new T.ExtrudeGeometry(s, { depth: th, bevelEnabled: true, bevelThickness: th * .3, bevelSize: th * .3, bevelSegments: 2, curveSegments: 8 });
      g.translate(0, 0, -th / 2); g.rotateX(-Math.PI / 2);
      return edges(new T.Mesh(g, mat), line, 30);
    }
    const W2 = 3.1, wing = flat([[1.1, -W2 + .15], [1.1, W2 - .15], [1.1, W2, .95, W2 + .02], [.2, W2 + .02], [.05, W2, .05, W2 - .15], [.05, -W2 + .15], [.05, -W2, .2, -W2 - .02], [.95, -W2 - .02], [1.1, -W2, 1.1, -W2 + .15]], .08, navy, lBlue);
    wing.position.y = -.22; plane.add(wing);
    const hinged = (len, span, th, mat, line, x, y, z) => { const g = new T.Group(); g.position.set(x, y, z); const m = edges(new T.Mesh(new T.BoxGeometry(len, th, span), mat), line); m.position.x = -len / 2; g.add(m); return g; };
    const ailL = hinged(.32, 1.5, .06, gold, lGold, .06, -.22, -2.25), ailR = hinged(.32, 1.5, .06, gold, lGold, .06, -.22, 2.25); plane.add(ailL, ailR);
    const flL = hinged(.3, 1.1, .06, teal, lTeal, .06, -.22, -1.0), flR = hinged(.3, 1.1, .06, teal, lTeal, .06, -.22, 1.0); plane.add(flL, flR);
    const tipL = new T.Mesh(new T.SphereGeometry(.06, 12, 8), new T.MeshBasicMaterial({ color: 0xff5d5d })); tipL.position.set(.6, -.2, -3.14);
    const tipR = new T.Mesh(new T.SphereGeometry(.06, 12, 8), new T.MeshBasicMaterial({ color: 0x3ee08f })); tipR.position.set(.6, -.2, 3.14); plane.add(tipL, tipR);
    const stab = flat([[-1.45, -.95], [-1.45, .95], [-1.45, 1.05, -1.55, 1.05], [-1.97, 1.05], [-1.97, -1.05], [-1.55, -1.05], [-1.45, -1.05, -1.45, -.95]], .05, navy, lBlue);
    stab.position.y = .02; plane.add(stab);
    const elev = hinged(.3, 2.1, .045, gold, lGold, -1.97, .02, 0); plane.add(elev);
    const finS = new T.Shape(); finS.moveTo(-1.45, .02); finS.lineTo(-1.85, .8); finS.quadraticCurveTo(-1.9, .86, -1.98, .86); finS.lineTo(-2.09, .86); finS.lineTo(-2.09, .02); finS.lineTo(-1.45, .02);
    const finG = new T.ExtrudeGeometry(finS, { depth: .05, bevelEnabled: false }); finG.translate(0, 0, -.025);
    const fin = edges(new T.Mesh(finG, navy), lBlue, 20); plane.add(fin);
    const rud = new T.Group(); rud.position.set(-2.09, .44, 0); const rm = edges(new T.Mesh(new T.BoxGeometry(.24, .82, .045), gold), lGold); rm.position.x = -.12; rud.add(rm); plane.add(rud);
    // шасі
    const wheel = (x, z, r) => {
      const w = edges(new T.Mesh(new T.CylinderGeometry(r, r, .1, 24), dark), lBlue, 40); w.rotation.x = Math.PI / 2; w.position.set(x, -.75, z); plane.add(w);
      const s = new T.Mesh(new T.CylinderGeometry(.022, .022, .5, 8), new T.MeshBasicMaterial({ color: 0x6cc8ff })); s.position.set(x, -.5, z * .8); s.rotation.x = z ? Math.sign(z) * -.35 : 0; plane.add(s);
    };
    wheel(.45, .55, .15); wheel(.45, -.55, .15); wheel(1.95, 0, .11);
    // «креслярська» підлога-сітка
    const grid = new T.GridHelper(16, 32, 0x2f6db0, 0x1a3c62); grid.position.y = -1.05; grid.material.transparent = true; grid.material.opacity = .5; scene.add(grid);
    // вісь обертання
    const axis = new T.Mesh(new T.CylinderGeometry(.02, .02, 7.8, 8), new T.MeshBasicMaterial({ color: 0xffc247 })); if (!hero) scene.add(axis);
    if (hero) { cam.position.set(5.4, 2.6, 6.4); cam.lookAt(0, -0.3, 0); }
    const MODES = {
      pitch: { b: 'Тангаж', s: 'ніс угору чи вниз — навколо осі від крила до крила. Керує руль висоти.', ax: [Math.PI / 2, 0, 0] },
      roll: { b: 'Крен', s: 'нахил крил — навколо осі від носа до хвоста. Керують елерони.', ax: [0, 0, Math.PI / 2] },
      yaw: { b: 'Рискання', s: 'ніс ліворуч чи праворуч — навколо вертикальної осі. Керує руль напрямку.', ax: [0, 0, 0] }
    };
    let mode = 'all', cur = 'pitch', t0 = performance.now(), raf = 0, alive = true;
    const ui = wrap.querySelector('.la3d-ui');
    function setCur(m) { cur = m; const d = MODES[m]; ui.querySelector('b').textContent = d.b; ui.querySelector('span').textContent = d.s; axis.rotation.set(...d.ax); }
    setCur('pitch');
    function setMode(m) {
      if (!MODES[m] && m !== 'all') return;
      mode = m; wrap.querySelectorAll('.la3d-btn button').forEach(x => x.classList.toggle('on', x.dataset.m === m));
      t0 = performance.now(); if (mode !== 'all') setCur(mode);
    }
    wrap.querySelector('.la3d-btn').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return; e.stopPropagation(); setMode(b.dataset.m);
    });
    /* гутірка розкриває пункти по черзі (тангаж → крен → рискання) — літачок показує той самий рух */
    el.addEventListener('la3d:mode', e => setMode(e.detail));
    if (el.dataset.la3dMode) setMode(el.dataset.la3dMode);
    function size() { const w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h) return; wrap.classList.toggle('small', h < 400); R.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h < 1 ? 42 : 32; cam.updateProjectionMatrix(); }
    const ro = new ResizeObserver(size); ro.observe(wrap); size();
    function frame(now) {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (!wrap.isConnected) { stopIt(); return; }
      const t = (now - t0) / 1000;
      if (hero) {   // титульний слайд: літак повільно пролітає по колу, трохи кренячись
        const a = still ? 0.6 : t * .32;
        plane.rotation.set(0, 0, 0); plane.rotation.y = a; plane.rotation.x = still ? 0 : Math.sin(t * .9) * .12; plane.rotation.z = still ? 0 : Math.sin(t * .7) * .06;
        ailL.rotation.z = -(ailR.rotation.z = still ? 0 : Math.sin(t * .9) * .25); elev.rotation.z = rud.rotation.y = 0;
        plane.position.y = still ? 0 : Math.sin(t * .8) * .08; prop.rotation.x += .9; R.render(scene, cam); return;
      }
      if (mode === 'all') { const m = ['pitch', 'roll', 'yaw'][Math.floor(Math.max(0, t) / 5) % 3];   /* t буває трохи < 0: кадр почався до натискання */ if (m !== cur) setCur(m); }
      const ph = still ? 0.6 : Math.sin(t * 1.25);
      plane.rotation.set(0, 0, 0); ailL.rotation.z = ailR.rotation.z = elev.rotation.z = rud.rotation.y = 0;
      if (cur === 'pitch') { plane.rotation.z = ph * .32; elev.rotation.z = -ph * .45; }
      else if (cur === 'roll') { plane.rotation.x = ph * .45; ailR.rotation.z = -ph * .5; ailL.rotation.z = ph * .5; }
      else { plane.rotation.y = ph * .38; rud.rotation.y = -ph * .5; }
      plane.position.y = still ? 0 : Math.sin(t * .8) * .05;
      prop.rotation.x += .9;
      R.render(scene, cam);
    }
    function stopIt() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); try { R.dispose(); } catch (e) { /* ok */ } }
    frame(performance.now());                                   // перший кадр: якщо впаде — лишиться малюнок
    [...el.children].forEach(c => { if (c !== wrap) c.remove(); });
    return stopIt;
  }

  const CSS = `.la-ph{margin:0;position:relative;border-radius:16px;overflow:hidden;background:#0b1626;border:1px solid #1f3b5c}
.la-ph img{display:block;width:100%;height:100%;object-fit:cover}
.la-ph figcaption{position:absolute;left:0;right:0;bottom:0;padding:18px 12px 8px;font-size:12px;line-height:1.35;color:#e8ecf0;background:linear-gradient(transparent,rgba(0,0,0,.78))}
.la-ph figcaption a{color:#bff3ec}
.la3d{position:absolute;inset:0}
.la3d canvas{position:absolute;inset:0;width:100%;height:100%;display:block;filter:drop-shadow(0 0 1.5px rgba(108,200,255,.85)) drop-shadow(0 0 9px rgba(80,170,255,.45))}
.la3d-ui{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;gap:6px;pointer-events:none}
.la3d-ui b{align-self:flex-start;padding:4px 14px;border-radius:99px;border:2px solid #6fb8ff;background:rgba(11,22,38,.9);font:600 clamp(1.2rem,2vw,2rem)/1.15 Oswald,'Arial Narrow',sans-serif;color:#fff;letter-spacing:.03em}
.la3d-ui span{font-size:clamp(.85rem,1.15vw,1.15rem);color:#cfd5dc;max-width:46ch}
.la3d-btn{display:flex;flex-wrap:wrap;gap:6px;pointer-events:auto}
.la3d-btn button{min-height:38px;padding:0 14px;border-radius:99px;border:1px solid #2f5f8f;background:rgba(11,22,38,.88);color:#eef4fa;font:600 14px 'Source Sans 3',system-ui,sans-serif;cursor:pointer}
.la3d-btn button.on{background:#ffc247;border-color:#ffc247;color:#16130a}
.la-flow{stroke-dasharray:3 26;stroke-linecap:round;animation:laflow 1s linear infinite}
.la-flow.slow{animation-duration:1.7s;opacity:.6}
@keyframes laflow{to{stroke-dashoffset:-29}}
.la-hl{animation:lahl 2.4s ease-in-out infinite}
@keyframes lahl{50%{opacity:.5}}
.la-pulse{animation:lapulse 2.2s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
@keyframes lapulse{50%{transform:scaleY(1.06)}}
@media (prefers-reduced-motion:reduce){.la-flow,.la-hl,.la-pulse{animation:none}}
.la3d.hero .la3d-ui{display:none}
.la3d.small .la3d-ui span{display:none}.la3d.small .la3d-ui b{font-size:1.1rem}.la3d.small .la3d-btn button{min-height:32px;padding:0 10px;font-size:13px}`;
  try { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); } catch (e) { /* ok */ }
  try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fit(document)); } catch (e) { /* ok */ }

  window.LA_ART = {
    get: k => k && k.startsWith('scheme:') ? schemeOne(k.slice(7)) : k && k.startsWith('sil:') ? silhouette(k.slice(4)) : (ART[k] ? ART[k]() : ''),
    photo, has: k => !!PH[k], mount3D, fit, PH
  };
})();
