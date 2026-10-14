/* Малюнки для гутірки «Будова літальних апаратів І».
   Усе — SVG у коді (працює без інтернету). Фото справжніх літаків (Вікісховище) — лише якщо ввімкнено,
   і рухомий 3D-літачок (three.js з cdnjs) для тангажу/крену/рискання. Якщо щось не завантажилось — лишається малюнок.
   Використання: LA_ART.get(ключ) → рядок <svg>; LA_ART.photo(ключ) → <figure> або ''; LA_ART.mount3D(el) */
(function () {
  'use strict';
  const C = { ink: '#cfd5dc', mut: '#a0a8b2', gd: '#ffc247', ac: '#2fd2c0', sky: '#6fb3ff', red: '#e2574c', line: '#26323f', glow: 'rgba(255,194,71,.35)' };
  const still = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
  let U = 0; const uid = () => 'm' + (++U);
  const f = n => Math.round(n * 10) / 10;
  /* крива через точки (Catmull-Rom → Безьє) */
  function cr(pts) {
    let d = '';
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])} `;
    }
    return d;
  }
  /* симетричний фюзеляж (вигляд згори) за профілем [[y, півширина], …] від носа до хвоста */
  function body(prof) {
    const R = prof.map(([y, w]) => [w, y]), L = prof.slice().reverse().map(([y, w]) => [-w, y]);
    return `M${f(R[0][0])},${f(R[0][1])} ${cr(R)}L${f(L[0][0])},${f(L[0][1])} ${cr(L)}Z`;
  }
  const mir = s => `<g transform="scale(-1,1)">${s}</g>`;
  function defs(id) {
    return `<defs>
<linearGradient id="${id}b" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#93a1b0"/><stop offset=".4" stop-color="#f7f9fb"/><stop offset=".6" stop-color="#f7f9fb"/><stop offset="1" stop-color="#93a1b0"/></linearGradient>
<linearGradient id="${id}v" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f7f9fb"/><stop offset=".55" stop-color="#e4e9ee"/><stop offset="1" stop-color="#9eabb8"/></linearGradient>
<linearGradient id="${id}w" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fbfcfd"/><stop offset="1" stop-color="#bfc9d3"/></linearGradient>
<linearGradient id="${id}g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#9eeef7"/><stop offset=".45" stop-color="#2a7c9c"/><stop offset="1" stop-color="#0c2b40"/></linearGradient>
<radialGradient id="${id}m" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#6f7c89"/></radialGradient>
<radialGradient id="${id}t" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#4a525c"/><stop offset="1" stop-color="#15191e"/></radialGradient>
<filter id="${id}s" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="4" dy="9" stdDeviation="6" flood-color="#000" flood-opacity=".5"/></filter>
<marker id="${id}a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="${C.ink}"/></marker>
<marker id="${id}ag" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="${C.gd}"/></marker>
<marker id="${id}at" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="${C.ac}"/></marker>
</defs>`;
  }
  const S = (id, x = 1.2) => `stroke="${C.line}" stroke-width="${x}" stroke-linejoin="round"`;
  /* підпис з виносною лінією; '\n' — новий рядок */
  function LAB(x1, y1, x2, y2, t, anchor = 'start', col = C.ink, fs = 15) {
    const L = String(t).split('\n'), tx = x2 + (anchor === 'start' ? 6 : -6), y0 = y2 + fs * .35 - (L.length - 1) * fs * .55;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="1.3" opacity=".7"/><circle cx="${x1}" cy="${y1}" r="3.2" fill="${col}" stroke="#1b1d21" stroke-width="1"/>` +
      `<text x="${tx}" y="${f(y0)}" font-size="${fs}" fill="${col}" text-anchor="${anchor}" font-weight="600">${L.map((l, i) => `<tspan x="${tx}" dy="${i ? fs * 1.12 : 0}">${l}</tspan>`).join('')}</text>`;
  }
  const spin = (vals, cx = 0, cy = 0, dur = 4) => still ? '' :
    `<animateTransform attributeName="transform" type="rotate" values="${vals.map(v => `${v} ${cx} ${cy}`).join(';')}" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"/>`;

  /* ================= навчальний літак ================= */
  const WING = 'M12,-50 L114,-44 Q121,-43 121,-36 L121,-26 Q121,-19 114,-18 L12,-12 Z';
  const TAIL = 'M4,80 L40,87 Q46,88 46,93 L46,99 Q46,102 42,102 L4,104 Z';
  const FUS = body([[-112, 7.5], [-104, 10.5], [-90, 12], [-60, 12.6], [-30, 12.6], [-5, 11.6], [25, 9.2], [55, 6.8], [85, 4.6], [108, 3.2], [117, 0]]);
  /* вигляд згори, ніс угору; o.anim: 'yaw' — рискання з рулем напрямку */
  function planeTop(id, o = {}) {
    const ail = `<path d="M72,-23.6 L113,-26 L113,-18 L72,-15.6 Z" fill="${C.gd}" ${S(id, 1)}/>`;
    const flap = `<path d="M16,-20.3 L68,-23.4 L68,-15.4 L16,-12.3 Z" fill="${C.ac}" ${S(id, 1)}/>`;
    const elev = `<path d="M4,95.5 L46,94 L46,99 Q46,102 42,102 L4,104 Z" fill="${C.gd}" ${S(id, 1)}/>`;
    const rud = `<path d="M-2.3,103 L2.3,103 L0.6,120 L-0.6,120 Z" fill="${C.gd}" ${S(id, 1)}>${o.anim === 'yaw' ? spin([-24, 24, -24], 0, 103) : ''}</path>`;
    return `<g filter="url(#${id}s)">
      <ellipse cx="0" cy="-117" rx="50" ry="4.5" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.35)" stroke-width="1"/>
      <path d="${WING}" fill="url(#${id}w)" ${S(id)}/>${mir(`<path d="${WING}" fill="url(#${id}w)" ${S(id)}/>`)}
      ${ail}${mir(ail)}${flap}${mir(flap)}
      <line x1="60" y1="-49" x2="60" y2="-15" stroke="${C.line}" stroke-width=".6" opacity=".35"/><line x1="-60" y1="-49" x2="-60" y2="-15" stroke="${C.line}" stroke-width=".6" opacity=".35"/>
      <path d="${TAIL}" fill="url(#${id}w)" ${S(id)}/>${mir(`<path d="${TAIL}" fill="url(#${id}w)" ${S(id)}/>`)}${elev}${mir(elev)}
      <path d="${FUS}" fill="url(#${id}b)" ${S(id)}/>
      <path d="M-10.5,-100 L10.5,-100" stroke="${C.line}" stroke-width=".7" opacity=".5"/><path d="M-11.8,-86 L11.8,-86" stroke="${C.line}" stroke-width=".7" opacity=".4"/>
      <path d="M0,-75 C7,-75 9.4,-67 9.4,-57 L9.4,-41 C9.4,-35 6,-33 0,-33 C-6,-33 -9.4,-35 -9.4,-41 L-9.4,-57 C-9.4,-67 -7,-75 0,-75 Z" fill="url(#${id}g)" ${S(id, 1)}/>
      <path d="M-4.5,-70 C-2,-72 2,-72 4,-70 L3,-50 L-3,-50 Z" fill="#fff" opacity=".35"/>
      <path d="M-1.9,68 L1.9,68 L2.3,103 L-2.3,103 Z" fill="#dfe5eb" ${S(id, 1)}/>${rud}
      <path d="M-7.2,-112 C-7.2,-120 -3,-127 0,-128 C3,-127 7.2,-120 7.2,-112 Z" fill="url(#${id}m)" ${S(id, 1)}/>
      <circle cx="120" cy="-31" r="2.6" fill="#3ee08f"/><circle cx="-120" cy="-31" r="2.6" fill="#ff5d5d"/>
    </g>`;
  }
  /* вигляд збоку, ніс ліворуч; o.anim: 'pitch' — руль висоти рухається */
  function planeSide(id, o = {}) {
    const fus = 'M-112,-9 C-104,-13 -92,-14 -80,-14 L-74,-16 C-66,-29 -56,-32 -44,-32 C-30,-32 -18,-29 -8,-24 C14,-19 60,-14 116,-10 L118,-3 C80,-1 30,6 0,11 C-30,15 -70,14 -100,11 C-106,10 -112,9 -112,9 Z';
    return `<g filter="url(#${id}s)">
      <ellipse cx="-127" cy="0" rx="2.6" ry="38" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.35)" stroke-width="1"/>
      <path d="M-40,13 L-47,30" stroke="#8994a0" stroke-width="3.2" stroke-linecap="round"/><path d="M-96,10 L-97,27" stroke="#8994a0" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="-47" cy="33" r="7.5" fill="url(#${id}t)"/><circle cx="-47" cy="33" r="2.6" fill="#b9c2cc"/>
      <circle cx="-97" cy="31" r="5.6" fill="url(#${id}t)"/><circle cx="-97" cy="31" r="2" fill="#b9c2cc"/>
      <path d="M76,-13 L101,-49 Q104,-53 109,-53 L117,-53 Q119.5,-53 119.5,-50 L118,-10 Z" fill="url(#${id}w)" ${S(id)}/>
      <path d="M110,-53 L117,-53 Q119.5,-53 119.5,-50 L118,-10 L110,-12 Z" fill="${C.gd}" ${S(id, 1)}/>
      <path d="${fus}" fill="url(#${id}v)" ${S(id)}/>
      <path d="M-108,1 C-60,3 20,0 112,-6" fill="none" stroke="${C.gd}" stroke-width="2.6"/>
      <path d="M-70,-17 C-63,-27 -55,-29.5 -45,-29.5 C-33,-29.5 -22,-27 -14,-22.6 L-16,-15.5 L-68,-15.5 Z" fill="url(#${id}g)" ${S(id, 1)}/>
      <path d="M-44,-29 L-44,-15.5 M-28,-27.5 L-29,-15.5" stroke="${C.line}" stroke-width="1"/>
      <path d="M86,-6.6 L110,-7 L110,-3.4 L86,-3.8 Z" fill="url(#${id}w)" ${S(id, 1)}/>
      <path d="M110,-7 L122,-6.2 L122,-4.6 L110,-3.4 Z" fill="${C.gd}" ${S(id, 1)}>${o.anim === 'pitch' ? spin([-22, 22, -22], 110, -5.2) : ''}</path>
      <path d="M-64,12 C-60,7.5 -46,7 -32,8 C-24,9 -19,11 -17,13 C-32,14.6 -52,15 -64,12 Z" fill="url(#${id}w)" ${S(id, 1)}/>
      <path d="M-112,-8.6 C-119,-8.6 -125,-3 -126.5,0 C-125,3 -119,8.6 -112,8.6 Z" fill="url(#${id}m)" ${S(id, 1)}/>
    </g>`;
  }
  /* вигляд спереду (ліве крило літака — праворуч на малюнку) */
  function planeFront(id, o = {}) {
    const wing = `<path d="M12,7 L120,-3 Q123,-3 123,0 L123,2 Q123,4 120,4 L12,14 Z" fill="url(#${id}w)" ${S(id)}/>`;
    return `<g filter="url(#${id}s)">
      <path d="M0,-6.5 L46,-9 L46,-6 L0,-3.5 Z" fill="#c9d1da" ${S(id, 1)}/>${mir(`<path d="M0,-6.5 L46,-9 L46,-6 L0,-3.5 Z" fill="#c9d1da" ${S(id, 1)}/>`)}
      <path d="M-2.2,-15 L2.2,-15 L1.6,-54 L-1.6,-54 Z" fill="#dfe5eb" ${S(id, 1)}/>
      <path d="M14,12 L31,29 M-14,12 L-31,29" stroke="#8994a0" stroke-width="3" stroke-linecap="round"/><path d="M0,16 L0,26" stroke="#8994a0" stroke-width="2.6"/>
      <ellipse cx="33" cy="33" rx="4.2" ry="8" fill="url(#${id}t)"/><ellipse cx="-33" cy="33" rx="4.2" ry="8" fill="url(#${id}t)"/><ellipse cx="0" cy="30" rx="3.4" ry="6" fill="url(#${id}t)"/>
      ${wing}${mir(wing)}
      <ellipse cx="0" cy="0" rx="15" ry="17" fill="url(#${id}b)" ${S(id)}/>
      <path d="M-10,-6 C-9,-14 -5,-16.5 0,-16.5 C5,-16.5 9,-14 10,-6 Z" fill="url(#${id}g)" ${S(id, 1)}/>
      <circle cx="0" cy="0" r="40" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.3)" stroke-width="1"/>
      <circle cx="0" cy="0" r="6.5" fill="url(#${id}m)" ${S(id, 1)}/>
      <circle cx="-122" cy="0.5" r="2.6" fill="#3ee08f"/><circle cx="122" cy="0.5" r="2.6" fill="#ff5d5d"/>
    </g>`;
  }

  /* ================= профіль крила NACA 4415 ================= */
  function naca(m = .04, p = .4, t = .15, n = 70) {
    const up = [], lo = [];
    for (let i = 0; i <= n; i++) {
      const b = Math.PI * i / n, x = (1 - Math.cos(b)) / 2;
      const yt = 5 * t * (.2969 * Math.sqrt(x) - .126 * x - .3516 * x * x + .2843 * x ** 3 - .1036 * x ** 4);
      const yc = x < p ? m / (p * p) * (2 * p * x - x * x) : m / ((1 - p) ** 2) * ((1 - 2 * p) + 2 * p * x - x * x);
      const dy = x < p ? 2 * m / (p * p) * (p - x) : 2 * m / ((1 - p) ** 2) * (p - x), th = Math.atan(dy);
      up.push([x - yt * Math.sin(th), yc + yt * Math.cos(th)]); lo.push([x + yt * Math.sin(th), yc - yt * Math.cos(th)]);
    }
    return { up, lo };
  }
  const AF = naca();
  /* шлях профілю: хорда = L, передня кромка в (0,0), кут атаки a° (ніс угору) */
  function afPath(L, a) {
    const r = -a * Math.PI / 180, cs = Math.cos(r), sn = Math.sin(r);
    const T = ([x, y]) => [f(x * L * cs - (-y * L) * sn), f(x * L * sn + (-y * L) * cs)];
    const pts = AF.up.slice().reverse().concat(AF.lo.slice(1)).map(T);
    return 'M' + pts.map(p => p.join(',')).join(' L') + ' Z';
  }
  function afPoint(L, a, x, side) { // точка на поверхні профілю
    const arr = side === 'lo' ? AF.lo : AF.up; let best = arr[0]; for (const q of arr) if (Math.abs(q[0] - x) < Math.abs(best[0] - x)) best = q;
    const r = -a * Math.PI / 180; const X = best[0] * L, Y = -best[1] * L;
    return [f(X * Math.cos(r) - Y * Math.sin(r)), f(X * Math.sin(r) + Y * Math.cos(r))];
  }

  /* ================= малюнки ================= */
  const ART = {};
  ART.title = () => { const id = uid(); return `<svg viewBox="-135 -135 270 270" role="img" aria-label="Навчальний літак, вигляд згори">${defs(id)}<g transform="rotate(-28)">${planeTop(id)}</g></svg>`; };

  ART.parts = () => {
    const id = uid();
    return `<svg viewBox="-272 -142 544 390" role="img" aria-label="Частини літака: вигляд згори і збоку">${defs(id)}
      <text x="-268" y="-124" font-size="12" fill="${C.mut}" letter-spacing="1">ВИГЛЯД ЗГОРИ</text>
      ${planeTop(id)}
      ${LAB(30, -117, 138, -124, 'Гвинт')}${LAB(7, -97, 138, -94, 'Двигун\n(під капотом)')}${LAB(7, -55, 138, -66, 'Кабіна', 'start', C.ac)}
      ${LAB(42, -17, 138, -32, 'Закрилок', 'start', C.ac)}${LAB(8, 32, 138, 28, 'Фюзеляж')}${LAB(0, 112, 138, 98, 'Кіль і\nруль напрямку', 'start', C.gd)}
      ${LAB(-64, -36, -138, -70, 'Крило', 'end')}${LAB(-94, -22, -138, -24, 'Елерон', 'end', C.gd)}${LAB(-26, 88, -138, 68, 'Стабілізатор', 'end')}${LAB(-26, 99.5, -138, 100, 'Руль висоти', 'end', C.gd)}
      <line x1="-268" y1="146" x2="268" y2="146" stroke="#383d44"/>
      <text x="-268" y="166" font-size="12" fill="${C.mut}" letter-spacing="1">ВИГЛЯД ЗБОКУ</text>
      <g transform="translate(20,200) scale(.78)">${planeSide(id)}</g>
      ${LAB(-16.7, 225.7, -138, 222, 'Шасі', 'end')}<line x1="-55.7" y1="224.2" x2="-138" y2="222" stroke="${C.ink}" stroke-width="1.3" opacity=".7"/><circle cx="-55.7" cy="224.2" r="3.2" fill="${C.ink}" stroke="#1b1d21"/>
      ${LAB(110, 168, 138, 176, 'Кіль', 'start', C.gd)}</svg>`;
  };

  ART.airfoil = () => {
    const id = uid(), L = 330, a = 8, X0 = 78, Y0 = 150;
    const te = afPoint(L, a, 1, 'up'), top = afPoint(L, a, .35, 'up'), bot = afPoint(L, a, .45, 'lo');
    const ch = (x) => [f(x * L * Math.cos(-a * Math.PI / 180)), f(x * L * Math.sin(-a * Math.PI / 180))];
    const c1 = ch(.5);
    return `<svg viewBox="0 0 470 260" role="img" aria-label="Профіль крила">${defs(id)}
      <linearGradient id="${id}af" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e9eef3"/><stop offset="1" stop-color="#8d9aa8"/></linearGradient>
      ${[112, 150, 188].map(y => `<line x1="4" y1="${y}" x2="56" y2="${y}" stroke="${C.ink}" stroke-width="1.7" opacity=".65" marker-end="url(#${id}a)"/>`).join('')}
      <text x="4" y="98" font-size="14" fill="${C.ink}">зустрічний потік</text>
      <line x1="${X0}" y1="${Y0}" x2="${X0 + 250}" y2="${Y0}" stroke="${C.ink}" stroke-width="1.1" stroke-dasharray="4 5" opacity=".5"/>
      <g transform="translate(${X0},${Y0})"><path d="${afPath(L, a)}" fill="url(#${id}af)" stroke="#f3f6f9" stroke-width="1.6" filter="url(#${id}s)"/>
        <line x1="0" y1="0" x2="${te[0]}" y2="${te[1]}" stroke="${C.gd}" stroke-width="2" stroke-dasharray="8 5"/></g>
      <path d="M${X0 + 200},${Y0} A200,200 0 0 0 ${f(X0 + 200 * Math.cos(a * Math.PI / 180))},${f(Y0 - 200 * Math.sin(a * Math.PI / 180))}" fill="none" stroke="${C.gd}" stroke-width="3"/>
      <text x="${X0 + 210}" y="${Y0 - 6}" font-size="17" fill="${C.gd}" font-weight="700">α — кут атаки</text>
      <circle cx="${X0}" cy="${Y0}" r="5" fill="${C.ac}"/><circle cx="${X0 + te[0]}" cy="${Y0 + te[1]}" r="5" fill="${C.ac}"/>
      ${LAB(X0 - 3, Y0 + 3, 24, 226, 'передня кромка', 'start', C.ac, 14)}${LAB(X0 + c1[0] - 70, Y0 + c1[1] + 10, 168, 226, 'хорда', 'start', C.gd, 14)}
      ${LAB(X0 + bot[0], Y0 + bot[1], 262, 226, 'нижня поверхня', 'start', C.ink, 14)}
      ${LAB(X0 + te[0] + 2, Y0 + te[1] - 2, 455, 52, 'задня кромка', 'end', C.ac, 14)}${LAB(X0 + top[0], Y0 + top[1], X0 + top[0] - 10, 24, 'верхня поверхня — опукліша', 'start', C.ink, 14)}</svg>`;
  };

  ART.lift = () => {
    const id = uid(), L = 300, a = 6, X0 = 80, Y0 = 160;
    const te = afPoint(L, a, 1, 'up');
    const surf = x => { const p = afPoint(L, a, x, 'up'); return [X0 + p[0], Y0 + p[1]]; };
    /* лінії потоку над крилом: обтікають верхню поверхню, за крилом — донизу */
    const stream = h => {
      const d = h * .6 + 10, le = [X0, Y0], e = [X0 + te[0], Y0 + te[1]];
      const pts = [[6, le[1] - d + 10], [X0 - 46, le[1] - d + 6], [X0 - 14, le[1] - d - 2]];
      for (let x = .04; x <= .98; x += .1) { const s = surf(x); pts.push([s[0], s[1] - d * (1 - .25 * x)]); }
      pts.push([e[0] + 2, e[1] - d * .7], [e[0] + 34, e[1] - d * .45 + 10], [462, e[1] - d * .2 + 36]);
      return 'M' + pts[0].join(',') + ' ' + cr(pts);
    };
    return `<svg viewBox="0 0 470 280" role="img" aria-label="Підйомна сила">${defs(id)}
      <radialGradient id="${id}lo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${C.ac}" stop-opacity=".38"/><stop offset="1" stop-color="${C.ac}" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}hi" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff9f5a" stop-opacity=".35"/><stop offset="1" stop-color="#ff9f5a" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}af" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e9eef3"/><stop offset="1" stop-color="#8d9aa8"/></linearGradient>
      <ellipse cx="230" cy="112" rx="170" ry="52" fill="url(#${id}lo)"/><ellipse cx="220" cy="200" rx="170" ry="44" fill="url(#${id}hi)"/>
      ${[22, 52].map(h => `<path d="${stream(h)}" fill="none" stroke="${C.ac}" stroke-width="2" marker-end="url(#${id}at)"/>`).join('')}
      ${[0, 1].map(k => `<path d="M6,${200 + k * 26} C150,${200 + k * 26} 300,${194 + k * 24} 462,${214 + k * 22}" fill="none" stroke="${C.ink}" stroke-width="1.7" opacity=".5" marker-end="url(#${id}a)"/>`).join('')}
      <g transform="translate(${X0},${Y0})"><path d="${afPath(L, a)}" fill="url(#${id}af)" stroke="#f3f6f9" stroke-width="1.6" filter="url(#${id}s)"/></g>
      ${['−', '−', '−'].map((s, k) => `<text x="${180 + k * 60}" y="${100 - k * 4}" font-size="26" fill="${C.ac}" font-weight="700" text-anchor="middle">${s}</text>`).join('')}
      ${['+', '+', '+'].map((s, k) => `<text x="${170 + k * 60}" y="${196 - k * 3}" font-size="22" fill="#ffb27a" font-weight="700" text-anchor="middle">${s}</text>`).join('')}
      <line x1="240" y1="150" x2="240" y2="30" stroke="${C.gd}" stroke-width="7" marker-end="url(#${id}ag)"/>
      <text x="254" y="38" font-size="18" fill="${C.gd}" font-weight="700">підйомна сила</text>
      <text x="8" y="40" font-size="14" fill="${C.ac}" font-weight="600">зверху: швидше, тиск менший (−)</text>
      <text x="8" y="268" font-size="14" fill="#ffb27a" font-weight="600">знизу: тиск більший (+)</text>
      <text x="462" y="268" font-size="14" fill="${C.ac}" text-anchor="end" font-weight="600">повітря — донизу ↘</text></svg>`;
  };

  ART.strip = () => {
    const id = uid();
    return `<svg viewBox="0 0 440 230" role="img" aria-label="Дослід зі смужкою паперу">${defs(id)}
      <path d="M0,16 C14,20 22,34 26,48 L40,60 C38,64 33,65 30,66 C32,70 36,72 36,75 C34,77 31,78 31,79 C34,81 36,84 34,88 C31,95 31,104 27,114 C22,125 12,130 0,132 Z" fill="#2a3038" stroke="${C.ink}" stroke-width="2"/>
      <path d="M36,82 C120,86 230,140 330,198" fill="none" stroke="${C.ink}" stroke-width="3" stroke-dasharray="6 6" opacity=".4"/><text x="336" y="206" font-size="14" fill="${C.ink}" opacity=".75">до</text>
      <path d="M36,82 C120,78 230,82 350,96" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><text x="356" y="101" font-size="15" fill="#fff" font-weight="600">після</text>
      ${[0, 1, 2].map(k => `<path d="M46,${64 - k * 13} C110,${62 - k * 13} 170,${64 - k * 11} ${250 - k * 26},${70 - k * 10}" fill="none" stroke="${C.ac}" stroke-width="2.2" marker-end="url(#${id}at)"/>`).join('')}
      <text x="60" y="20" font-size="15" fill="${C.ac}" font-weight="600">дуємо над смужкою</text>
      <text x="60" y="170" font-size="13" fill="${C.mut}">смужка паперу 3 × 20 см</text></svg>`;
  };

  ART.paper = () => {
    const id = uid();
    return `<svg viewBox="-215 -132 430 270" role="img" aria-label="Паперовий літачок з рулями, вигляд згори">${defs(id)}
      <linearGradient id="${id}p" x1="0" x2="1"><stop offset="0" stop-color="#d9dfe5"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#d9dfe5"/></linearGradient>
      <g filter="url(#${id}s)"><polygon points="0,-122 112,100 14,80 0,100 -14,80 -112,100" fill="url(#${id}p)" stroke="#8d9aa8" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M0,-122 L14,80 M0,-122 L-14,80" stroke="#aab4be" stroke-width="1" fill="none"/>
      <polygon points="58,74 104,83.5 107,97.4 61,88" fill="${C.glow}" stroke="${C.gd}" stroke-width="2"/><polygon points="-58,74 -104,83.5 -107,97.4 -61,88" fill="${C.glow}" stroke="${C.gd}" stroke-width="2"/>
      <path d="M58,74 L61,88 M104,83.5 L107,97.4 M-58,74 L-61,88 M-104,83.5 L-107,97.4" stroke="${C.gd}" stroke-width="2.4" stroke-dasharray="3 3"/></g>
      <line x1="0" y1="-122" x2="0" y2="100" stroke="${C.ac}" stroke-width="2" stroke-dasharray="6 5"/>
      ${LAB(84, 86, 134, 40, 'надріз —\n«руль»', 'start', C.gd)}${LAB(-84, 86, -134, 40, 'надріз —\n«руль»', 'end', C.gd)}${LAB(0, 20, 134, -40, 'згин —\n«кіль»', 'start', C.ac)}
      <text x="0" y="130" font-size="13" fill="${C.mut}" text-anchor="middle">Вигляд згори. Рулі — на задньому краї крил.</text></svg>`;
  };

  /* тангаж / крен / рискання — три рухомі вигляди */
  ART.axes = () => {
    const id = uid();
    const arc = (r, k) => `<path d="M${105 - r},70 A${r},${r * 0.55} 0 1 1 ${105 + r * 0.2},${70 + r * 0.54}" fill="none" stroke="${C.gd}" stroke-width="2.5" stroke-dasharray="${k ? '0' : '0'}" marker-end="url(#${id}ag)" opacity=".85"/>`;
    const rows = [
      [`<g transform="translate(105,70) scale(.66)"><g>${planeSide(id, { anim: 'pitch' })}${spin([9, -9, 9])}</g></g>`, 92, 'Тангаж', 'ніс угору або вниз', 'руль висоти', 'збоку'],
      [`<g transform="translate(105,72) scale(.68)"><g>${planeFront(id)}${spin([-16, 16, -16])}</g></g>`, 96, 'Крен', 'нахил крил ліворуч / праворуч', 'елерони', 'спереду'],
      [`<g transform="translate(105,70) scale(.48)"><g>${planeTop(id, { anim: 'yaw' })}${spin([14, -14, 14])}</g></g>`, 88, 'Рискання', 'ніс ліворуч або праворуч', 'руль напрямку', 'згори']
    ];
    return `<svg viewBox="0 0 450 420" role="img" aria-label="Тангаж, крен і рискання">${defs(id)}
      ${rows.map(([g, r, n, d, c, v], k) => `<g transform="translate(0,${k * 140})">${k ? '<line x1="0" y1="0" x2="450" y2="0" stroke="#383d44"/>' : ''}${arc(r, k)}${g}
        <text x="6" y="20" font-size="12" fill="${C.mut}" letter-spacing="1">${v.toUpperCase()}</text>
        <text x="232" y="58" font-size="27" fill="#fff" font-weight="700">${n}</text><text x="232" y="84" font-size="15" fill="${C.ink}">${d}</text>
        <text x="232" y="108" font-size="15" fill="${C.gd}" font-weight="600">керує: ${c}</text></g>`).join('')}</svg>`;
  };

  /* види ЛА — вісім малюнків */
  ART.types = () => {
    const id = uid();
    const cell = (i, svg, t) => { const x = (i % 4) * 112, y = Math.floor(i / 4) * 128; return `<g transform="translate(${x},${y})"><rect x="3" y="3" width="106" height="120" rx="16" fill="rgba(255,255,255,.035)" stroke="#383d44"/>${svg}<text x="56" y="112" font-size="13" fill="${C.ink}" text-anchor="middle" font-weight="600">${t}</text></g>`; };
    const balloon = `<clipPath id="${id}cb"><path d="M56,10 C80,10 92,27 90,45 C88,61 73,71 63,79 L49,79 C39,71 24,61 22,45 C20,27 32,10 56,10 Z"/></clipPath>
      <g clip-path="url(#${id}cb)">${[0, 1, 2, 3, 4, 5, 6, 7].map(k => `<rect x="${18 + k * 10}" y="8" width="10" height="74" fill="${['#e2574c', '#ffc247'][k % 2]}"/>`).join('')}<ellipse cx="44" cy="30" rx="26" ry="22" fill="#fff" opacity=".22"/><rect x="18" y="56" width="80" height="30" fill="#000" opacity=".15"/></g>
      <path d="M49,79 L63,79 L61,85 L51,85 Z" fill="#8a5a33"/><path d="M51,85 L50,93 M61,85 L62,93" stroke="${C.ink}" stroke-width="1"/><rect x="48" y="92" width="16" height="10" rx="2" fill="#a46c3c" stroke="#5e3b1e"/>`;
    const airship = `<ellipse cx="52" cy="46" rx="42" ry="15" fill="url(#${id}v)" stroke="${C.line}" stroke-width="1"/><path d="M80,40 L98,29 L99,40 Z M80,52 L98,63 L99,52 Z" fill="${C.red}" stroke="${C.line}" stroke-width="1"/>
      <ellipse cx="40" cy="40" rx="24" ry="4" fill="#fff" opacity=".45"/><rect x="40" y="60" width="22" height="8" rx="4" fill="#dfe5eb" stroke="${C.line}"/><rect x="44" y="62" width="14" height="3" rx="1.5" fill="url(#${id}g)"/>`;
    const plane = `<g transform="translate(57,56) scale(.36)">${planeSide(id)}</g>`;
    const glider = `<path d="M6,44 L106,44 L104,49 L8,49 Z" fill="url(#${id}w)" stroke="${C.line}" stroke-width="1"/><path d="${body([[-36, 2], [-30, 4.5], [-18, 5], [0, 4], [30, 2], [46, 0]]).replace(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g, (m, x, y) => `${f(+x + 56)},${f(+y + 50)}`)}" fill="url(#${id}b)" stroke="${C.line}" stroke-width="1"/>
      <path d="M43,92 L69,92 L68,95 L44,95 Z" fill="${C.gd}" stroke="${C.line}" stroke-width=".8"/><ellipse cx="56" cy="28" rx="3.4" ry="7" fill="url(#${id}g)"/>`;
    const heli = `<path d="M10,30 L102,30" stroke="#dfe5eb" stroke-width="3" stroke-linecap="round"/><ellipse cx="56" cy="30" rx="47" ry="3" fill="rgba(255,255,255,.1)"/><path d="M56,30 L56,38" stroke="#8994a0" stroke-width="3"/>
      <path d="M74,50 L100,47 L100,52 L74,60 Z" fill="url(#${id}v)" stroke="${C.line}" stroke-width="1"/><circle cx="101" cy="46" r="8" fill="rgba(255,255,255,.1)" stroke="rgba(255,255,255,.35)"/>
      <path d="M28,58 C28,45 40,38 54,38 L66,38 C74,38 79,46 79,54 L79,62 C79,66 75,68 71,68 L36,68 C31,68 28,64 28,58 Z" fill="${C.red}" stroke="${C.line}" stroke-width="1"/>
      <path d="M30,56 C30,47 38,42 48,42 L50,42 L50,58 L30,58 Z" fill="url(#${id}g)"/><path d="M38,68 L36,76 M70,68 L72,76 M26,76 C30,79 80,79 86,76" stroke="#8994a0" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    const drone = `${[[26, 26], [86, 26], [26, 82], [86, 82]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="15" fill="rgba(111,179,255,.14)" stroke="rgba(255,255,255,.4)"/><path d="M${x - 13},${y + 2} L${x + 13},${y - 2}" stroke="#dfe5eb" stroke-width="2"/>`).join('')}
      <path d="M26,26 L86,82 M86,26 L26,82" stroke="#6b7684" stroke-width="5" stroke-linecap="round"/><rect x="43" y="41" width="26" height="26" rx="7" fill="url(#${id}v)" stroke="${C.line}"/><circle cx="56" cy="54" r="5" fill="url(#${id}t)"/><circle cx="47" cy="44" r="2" fill="#ff5d5d"/><circle cx="65" cy="44" r="2" fill="#3ee08f"/>`;
    const para = `<path d="M10,36 Q56,2 102,36 Q56,20 10,36 Z" fill="${C.gd}" stroke="#a37a12" stroke-width="1"/>${[22, 34, 46, 56, 66, 78, 90].map(x => `<path d="M${x},${30 - Math.abs(x - 56) * -0.0 - (14 - Math.abs(x - 56) * .28)} L${x},${36 - Math.max(0, 9 - Math.abs(x - 56) * .2)}" stroke="#a37a12" stroke-width=".8"/>`).join('')}
      <path d="M14,35 L52,80 M98,35 L60,80 M36,28 L54,80 M76,28 L58,80" stroke="${C.ink}" stroke-width=".7" opacity=".8"/><circle cx="56" cy="80" r="4" fill="#ffd9b0"/><path d="M50,84 L62,84 L60,94 L52,94 Z" fill="${C.red}"/>`;
    const rocket = `<path d="M56,10 C67,22 69,40 67,74 L45,74 C43,40 45,22 56,10 Z" fill="url(#${id}b)" stroke="${C.line}" stroke-width="1"/><path d="M56,10 C62,16 65,22 66,28 L46,28 C47,22 50,16 56,10 Z" fill="${C.red}"/>
      <circle cx="56" cy="44" r="6" fill="url(#${id}g)" stroke="${C.line}"/><path d="M45,58 L33,80 L45,76 Z M67,58 L79,80 L67,76 Z" fill="${C.red}" stroke="${C.line}" stroke-width="1"/><path d="M48,74 Q56,104 64,74 Z" fill="${C.gd}"/><path d="M52,74 Q56,92 60,74 Z" fill="#fff4cc"/>`;
    return `<svg viewBox="0 0 448 254" role="img" aria-label="Види літальних апаратів">${defs(id)}
      ${cell(0, balloon, 'Повітряна куля')}${cell(1, airship, 'Дирижабль')}${cell(2, plane, 'Літак')}${cell(3, glider, 'Планер')}
      ${cell(4, heli, 'Гелікоптер')}${cell(5, drone, 'Дрон')}${cell(6, para, 'Параплан')}${cell(7, rocket, 'Ракета')}</svg>`;
  };

  /* аеродинамічні схеми — силуети справжніх літаків (згори, ніс угору) */
  function scheme(k, id) {
    const W = `fill="url(#${id}w)" ${S(id)}`, B = `fill="url(#${id}b)" ${S(id)}`, G = `fill="${C.gd}" ${S(id)}`;
    const both = s => s + mir(s);
    if (k === 'normal') { // реактивний пасажирський літак
      return `<g filter="url(#${id}s)">${both(`<path d="M10,-22 L106,20 L108,27 L98,27 L10,8 Z" ${W}/><rect x="36" y="-18" width="9" height="26" rx="4" fill="#c9d1da" ${S(id, 1)}/>`)}
        ${both(`<path d="M4,86 L42,102 L43,108 L4,102 Z" ${G}/>`)}
        <path d="${body([[-120, 1.5], [-114, 6], [-104, 9.5], [-90, 10.5], [60, 10.5], [92, 7], [112, 3], [119, 0]])}" ${B}/>
        <path d="M-1.6,80 L1.6,80 L1.6,116 L-1.6,116 Z" fill="#dfe5eb" ${S(id, 1)}/><path d="M-6,-108 C-3,-111 3,-111 6,-108 L5,-104 L-5,-104 Z" fill="url(#${id}g)"/></g>`;
    }
    if (k === 'canard') { // «качка» на зразок Rutan VariEze
      return `<g filter="url(#${id}s)"><ellipse cx="0" cy="98" rx="26" ry="3.4" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.35)"/>
        ${both(`<path d="M8,18 L94,56 Q99,58 99,63 L99,70 L91,70 L8,58 Z" ${W}/><path d="M93,54 L100,57 L101,74 L94,71 Z" fill="#c9d1da" ${S(id, 1)}/>`)}
        ${both(`<path d="M7,-86 L46,-84 Q50,-84 50,-80 L50,-76 Q50,-73 46,-73 L7,-75 Z" ${G}/>`)}
        <path d="${body([[-112, 2.5], [-104, 6.5], [-84, 9], [-40, 9.6], [0, 9.2], [40, 8], [70, 6], [88, 3.5], [94, 0]])}" ${B}/>
        <path d="M0,-66 C6,-66 7,-58 7,-50 L7,-30 C7,-26 4,-24 0,-24 C-4,-24 -7,-26 -7,-30 L-7,-50 C-7,-58 -6,-66 0,-66 Z" fill="url(#${id}g)" ${S(id, 1)}/></g>`;
    }
    if (k === 'tailless') { // «безхвістка» на зразок Concorde
      return `<g filter="url(#${id}s)">${both(`<rect x="22" y="70" width="9" height="38" rx="3" fill="#aeb8c3" ${S(id, 1)}/><rect x="33" y="70" width="9" height="38" rx="3" fill="#aeb8c3" ${S(id, 1)}/>`)}
        ${both(`<path d="M5,-74 C16,-46 36,-6 56,34 C68,58 78,78 82,96 L5,101 Z" ${W}/><path d="M16,93 L80,89.5 L82,96 L16,100 Z" ${G}/>`)}
        <path d="${body([[-124, 1], [-114, 4], [-94, 6.6], [60, 6.6], [100, 4.4], [116, 1.4], [120, 0]])}" ${B}/>
        <path d="M-1.6,58 L1.6,58 L1.6,114 L-1.6,114 Z" fill="${C.gd}" ${S(id, 1)}/><path d="M-4,-106 C-2,-109 2,-109 4,-106 L3.6,-100 L-3.6,-100 Z" fill="url(#${id}g)"/></g>`;
    }
    if (k === 'flyingwing') { // «літаюче крило» на зразок B-2 Spirit
      return `<g filter="url(#${id}s)"><path d="M0,-62 L106,40 L97,51 L73,35 L50,53 L27,37 L0,51 L-27,37 L-50,53 L-73,35 L-97,51 L-106,40 Z" fill="url(#${id}v)" ${S(id)}/>
        ${both(`<path d="M97,51 L73,35 L76,31 L101,46 Z" ${G}/><path d="M50,53 L27,37 L30,33 L52,48 Z" ${G}/>`)}
        <path d="M0,-50 C9,-46 14,-30 14,-14 C14,4 8,14 0,16 C-8,14 -14,4 -14,-14 C-14,-30 -9,-46 0,-50 Z" fill="#e9eef3" opacity=".75"/>
        <path d="M-6,-36 L6,-36 L5,-30 L-5,-30 Z" fill="url(#${id}g)"/>${both(`<path d="M18,-12 L30,-6 L29,-3 L17,-9 Z" fill="#3a434d"/>`)}</g>`;
    }
    if (k === 'tandem') { // «тандем» на зразок «Небесної блохи»
      return `<g filter="url(#${id}s)"><ellipse cx="0" cy="-90" rx="36" ry="3.6" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.35)"/>
        <path d="${body([[-84, 4.5], [-76, 9.5], [-54, 11.5], [0, 10.5], [40, 7.5], [70, 3.5], [80, 0]])}" ${B}/>
        <path d="M-70,30 L70,30 Q77,30 77,37 L77,45 Q77,52 70,52 L-70,52 Q-77,52 -77,45 L-77,37 Q-77,30 -70,30 Z" ${W}/>
        <path d="M-92,-62 L92,-62 Q101,-62 101,-53 L101,-35 Q101,-27 92,-27 L-92,-27 Q-101,-27 -101,-35 L-101,-53 Q-101,-62 -92,-62 Z" ${W}/>
        <path d="M0,-24 C5,-24 7,-20 7,-14 L7,-4 L-7,-4 L-7,-14 C-7,-20 -5,-24 0,-24 Z" fill="url(#${id}g)" ${S(id, 1)}/>
        <path d="M-2,58 L2,58 L2.6,84 L-2.6,84 Z" fill="${C.gd}" ${S(id, 1)}/><path d="M-6,-84 C-6,-90 -3,-94 0,-95 C3,-94 6,-90 6,-84 Z" fill="url(#${id}m)"/></g>`;
    }
    return '';
  }
  const SCH = {
    normal: [[-70, 6, -128, -40, 'крило', 'end', C.ink], [-26, 95, -128, 96, 'оперення\nпозаду', 'end', C.gd]],
    canard: [[-30, -79, -128, -92, 'оперення\nпопереду', 'end', C.gd], [-62, 52, -128, 70, 'крило', 'end', C.ink]],
    tailless: [[-50, 96, -128, 64, 'рулі — на\nзадній кромці', 'end', C.gd], [0, 96, 128, 92, 'кіль', 'start', C.gd]],
    flyingwing: [[-62, 20, -128, -20, 'усе —\nу крилі', 'end', C.ink], [0, 46, 128, 86, 'без фюзеляжу\nі хвоста', 'start', C.ink]],
    tandem: [[-60, -44, -128, -72, 'переднє\nкрило', 'end', C.ink], [-60, 41, -128, 70, 'заднє\nкрило', 'end', C.ink]]
  };
  ART.schemes = () => {
    const id = uid(), L = [['normal', 'Нормальна'], ['canard', '«Качка»'], ['tailless', '«Безхвістка»'], ['flyingwing', '«Літаюче крило»'], ['tandem', '«Тандем»']];
    const pos = [[75, 72], [222, 72], [369, 72], [148, 226], [295, 226]];
    return `<svg viewBox="0 0 444 306" role="img" aria-label="П’ять аеродинамічних схем">${defs(id)}${L.map(([k, t], i) => `<g transform="translate(${pos[i][0]},${pos[i][1] - 8}) scale(.5)">${scheme(k, id)}</g><text x="${pos[i][0]}" y="${pos[i][1] + 68}" font-size="15" fill="#fff" text-anchor="middle" font-weight="700">${t}</text>`).join('')}</svg>`;
  };
  function schemeOne(k) {
    const id = uid();
    return `<svg viewBox="-240 -128 480 256" role="img" aria-label="Схема згори">${defs(id)}${scheme(k, id)}${(SCH[k] || []).map(a => LAB(...a)).join('')}</svg>`;
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

  /* ================= 3D-літачок (three.js) ================= */
  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  let threeP = null;
  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (threeP) return threeP;
    threeP = new Promise((res, rej) => { const s = document.createElement('script'); s.src = THREE_URL; s.async = true; s.onload = () => window.THREE ? res(window.THREE) : rej(new Error('three')); s.onerror = () => { threeP = null; rej(new Error('three')); }; document.head.appendChild(s); });
    return threeP;
  }
  function webgl() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (e) { return false; } }
  /* el — контейнер; повертає функцію зупинки. Поки 3D вантажиться (або якщо не вийде) — видно SVG-малюнок. */
  function mount3D(el) {
    let stop = false, cleanup = () => {};
    if (!webgl()) return () => {};
    loadThree().then(T => { if (stop || !el.isConnected) return; try { cleanup = build3D(T, el); } catch (e) { const w = el.querySelector('.la3d'); if (w) w.remove(); } }).catch(() => {});
    return () => { stop = true; cleanup(); };
  }
  function build3D(T, el) {
    const wrap = document.createElement('div'); wrap.className = 'la3d';
    wrap.innerHTML = `<canvas></canvas><div class="la3d-ui"><b></b><span></span><div class="la3d-btn"><button type="button" data-m="pitch">Тангаж</button><button type="button" data-m="roll">Крен</button><button type="button" data-m="yaw">Рискання</button><button type="button" data-m="all" class="on">По черзі</button></div></div>`;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.appendChild(wrap);
    const cv = wrap.querySelector('canvas');
    const R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    R.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(32, 1, .1, 100);
    cam.position.set(5.2, 3.4, 7.4); cam.lookAt(0.1, -0.6, 0);
    scene.add(new T.HemisphereLight(0xdfefff, 0x2a2f35, .75));
    const sun = new T.DirectionalLight(0xffffff, .8); sun.position.set(4, 8, 5); scene.add(sun);
    const rim = new T.DirectionalLight(0x9fd8ff, .35); rim.position.set(-6, 2, -4); scene.add(rim);
    const M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .45, metalness: .12 }, o));
    const white = M(0xdfe5ec, { roughness: .6 }), gold = M(0xffc247, { roughness: .4 }), teal = M(0x2fd2c0), dark = M(0x1d2228, { roughness: .8 }), glass = M(0x1d6f8f, { roughness: .08, metalness: .4, transparent: true, opacity: .85 }), metal = M(0xc8d0d8, { metalness: .7, roughness: .3 });
    const plane = new T.Group(); scene.add(plane);
    // фюзеляж: тіло обертання вздовж осі X (ніс +X)
    const prof = [[0, 2.35], [.2, 2.25], [.32, 2.05], [.34, 1.6], [.33, .6], [.27, -.6], [.2, -1.4], [.12, -2.15], [.02, -2.4]];
    const lathe = new T.LatheGeometry(prof.map(([r, x]) => new T.Vector2(Math.max(.001, r), x)), 32);
    const fus = new T.Mesh(lathe, white); fus.rotation.z = -Math.PI / 2; fus.scale.set(1, 1, 1.05); plane.add(fus);
    const can = new T.Mesh(new T.SphereGeometry(.3, 24, 16), glass); can.scale.set(1.9, .9, .85); can.position.set(.75, .27, 0); plane.add(can);
    const spinner = new T.Mesh(new T.ConeGeometry(.16, .34, 20), metal); spinner.rotation.z = -Math.PI / 2; spinner.position.x = 2.5; plane.add(spinner);
    const prop = new T.Group(); prop.position.x = 2.4; plane.add(prop);
    const blade = new T.Mesh(new T.BoxGeometry(.05, 1.5, .12), dark); prop.add(blade);
    const disc = new T.Mesh(new T.CircleGeometry(.78, 40), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .07, side: T.DoubleSide })); disc.rotation.y = Math.PI / 2; prop.add(disc);
    // поверхня-«дощечка» з відхиленою частиною на шарнірі
    const slab = (len, span, th, mat) => new T.Mesh(new T.BoxGeometry(len, th, span), mat);
    function hinged(len, span, th, mat, x, y, z) { // шарнір по передній кромці
      const g = new T.Group(); g.position.set(x, y, z); const m = slab(len, span, th, mat); m.position.x = -len / 2; g.add(m); return g;
    }
    // крило з елеронами й закрилками
    const wing = slab(1.05, 6.2, .09, white); wing.position.set(.55, -.22, 0); plane.add(wing);
    const ailL = hinged(.32, 1.5, .07, gold, .02, -.22, -2.25), ailR = hinged(.32, 1.5, .07, gold, .02, -.22, 2.25); plane.add(ailL, ailR);
    const flL = hinged(.3, 1.1, .07, teal, .02, -.22, -1.0), flR = hinged(.3, 1.1, .07, teal, .02, -.22, 1.0); plane.add(flL, flR);
    const tipL = new T.Mesh(new T.SphereGeometry(.05, 10, 8), M(0xff4d4d, { emissive: 0x991111 })); tipL.position.set(.5, -.22, -3.12);
    const tipR = new T.Mesh(new T.SphereGeometry(.05, 10, 8), M(0x3ee08f, { emissive: 0x117744 })); tipR.position.set(.5, -.22, 3.12); plane.add(tipL, tipR);
    // хвіст
    const stab = slab(.5, 2.1, .06, white); stab.position.set(-1.72, .02, 0); plane.add(stab);
    const elev = hinged(.3, 2.1, .05, gold, -1.97, .02, 0); plane.add(elev);
    const fin = new T.Mesh(new T.BoxGeometry(.62, .78, .06), white); fin.position.set(-1.78, .42, 0); fin.geometry.translate(0, 0, 0); plane.add(fin);
    const rud = new T.Group(); rud.position.set(-2.09, .42, 0); const rm = new T.Mesh(new T.BoxGeometry(.26, .78, .05), gold); rm.position.x = -.13; rud.add(rm); plane.add(rud);
    // шасі
    const wheel = (x, z, r) => { const w = new T.Mesh(new T.CylinderGeometry(r, r, .1, 20), dark); w.rotation.x = Math.PI / 2; w.position.set(x, -.75, z); plane.add(w);
      const s = new T.Mesh(new T.CylinderGeometry(.025, .025, .5, 8), metal); s.position.set(x, -.5, z * .8); s.rotation.x = z ? Math.sign(z) * -.35 : 0; plane.add(s); };
    wheel(.45, .55, .15); wheel(.45, -.55, .15); wheel(1.95, 0, .11);
    // вісь обертання (підсвічується)
    const axMat = new T.MeshBasicMaterial({ color: 0xffc247, transparent: true, opacity: .9 });
    const axis = new T.Mesh(new T.CylinderGeometry(.018, .018, 7.6, 8), axMat); scene.add(axis);
    const MODES = {
      pitch: { b: 'Тангаж', s: 'ніс угору чи вниз — навколо осі від крила до крила. Керує руль висоти.', ax: [Math.PI / 2, 0, 0] },
      roll: { b: 'Крен', s: 'нахил крил — навколо осі від носа до хвоста. Керують елерони.', ax: [0, 0, Math.PI / 2] },
      yaw: { b: 'Рискання', s: 'ніс ліворуч чи праворуч — навколо вертикальної осі. Керує руль напрямку.', ax: [0, 0, 0] }
    };
    let mode = 'all', cur = 'pitch', t0 = performance.now(), raf = 0, alive = true;
    const ui = wrap.querySelector('.la3d-ui');
    function setCur(m) { cur = m; const d = MODES[m]; ui.querySelector('b').textContent = d.b; ui.querySelector('span').textContent = d.s; axis.rotation.set(...d.ax); }
    setCur('pitch');
    wrap.querySelector('.la3d-btn').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return; e.stopPropagation();
      mode = b.dataset.m; wrap.querySelectorAll('.la3d-btn button').forEach(x => x.classList.toggle('on', x === b));
      t0 = performance.now(); if (mode !== 'all') setCur(mode);
    });
    function size() { const w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h) return; wrap.classList.toggle('small', h < 400); R.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h < 1 ? 42 : 32; cam.updateProjectionMatrix(); }
    const ro = new ResizeObserver(size); ro.observe(wrap); size();
    function frame(now) {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (!wrap.isConnected) { stopIt(); return; }
      const t = (now - t0) / 1000;
      if (mode === 'all') { const m = ['pitch', 'roll', 'yaw'][Math.floor(t / 5) % 3]; if (m !== cur) setCur(m); }
      const ph = still ? 0.6 : Math.sin(t * 1.25);
      plane.rotation.set(0, 0, 0); ailL.rotation.z = ailR.rotation.z = elev.rotation.z = rud.rotation.y = 0;
      if (cur === 'pitch') { plane.rotation.z = ph * .32; elev.rotation.z = -ph * .45; }
      else if (cur === 'roll') { plane.rotation.x = ph * .45; ailR.rotation.z = -ph * .5; ailL.rotation.z = ph * .5; }
      else { plane.rotation.y = ph * .38; rud.rotation.y = -ph * .5; }
      prop.rotation.x += .9;
      R.render(scene, cam);
    }
    function stopIt() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); try { R.dispose(); } catch (e) { /* ok */ } }
    frame(performance.now());                                   // перший кадр: якщо впаде — лишиться малюнок
    [...el.children].forEach(c => { if (c !== wrap) c.remove(); });
    return stopIt;
  }

  const CSS = `.la-ph{margin:0;position:relative;border-radius:16px;overflow:hidden;background:#22262b;border:1px solid #383d44}
.la-ph img{display:block;width:100%;height:100%;object-fit:cover}
.la-ph figcaption{position:absolute;left:0;right:0;bottom:0;padding:18px 12px 8px;font-size:12px;line-height:1.35;color:#e8ecf0;background:linear-gradient(transparent,rgba(0,0,0,.78))}
.la-ph figcaption a{color:#bff3ec}
.la3d{position:absolute;inset:0}
.la3d canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.la3d-ui{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;gap:6px;pointer-events:none}
.la3d-ui b{font:600 clamp(1.3rem,2.2vw,2.2rem)/1 Oswald,'Arial Narrow',sans-serif;color:#ffc247;letter-spacing:.03em}
.la3d-ui span{font-size:clamp(.85rem,1.15vw,1.15rem);color:#cfd5dc;max-width:46ch}
.la3d-btn{display:flex;flex-wrap:wrap;gap:6px;pointer-events:auto}
.la3d-btn button{min-height:38px;padding:0 14px;border-radius:99px;border:1px solid #3b4048;background:rgba(34,38,43,.85);color:#f2f4f6;font:600 14px 'Source Sans 3',system-ui,sans-serif;cursor:pointer}
.la3d-btn button.on{background:#ffc247;border-color:#ffc247;color:#16130a}
.la3d.small .la3d-ui span{display:none}.la3d.small .la3d-ui b{font-size:1.15rem}.la3d.small .la3d-btn button{min-height:32px;padding:0 10px;font-size:13px}`;
  try { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); } catch (e) { /* ok */ }

  window.LA_ART = {
    get: k => k && k.startsWith('scheme:') ? schemeOne(k.slice(7)) : (ART[k] ? ART[k]() : ''),
    photo, has: k => !!PH[k], mount3D, PH
  };
})();
