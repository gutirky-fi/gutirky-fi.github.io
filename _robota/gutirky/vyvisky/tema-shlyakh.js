/* Стиль «Шлях знаку» (3.11.2026, варіант А для вільної теми): одна нитка через усю гутірку —
   знак вигаданого гуртка «Вовки» проходить 5 зупинок: Ідея → Ескіз → Майстерня → Світло → Табір.
   Внизу кожного слайда — смужка шляху (де ми зараз); слайд частини — великий малюнок знаку на цій зупинці. */
(function () {
  'use strict';
  const STOPS = [['Ідея', 'Що ми хочемо сказати знаком'], ['Ескіз', 'Малюємо й перевіряємо правилами'], ['Майстерня', 'Файл, матеріали, різання, збірка'], ['Світло', 'Як знак починає світитися'], ['Табір', 'Наш знак — на нашому таборі']];
  const G = '#ffc247', T = '#2fd2c0', INK = '#e9edf2', MUT = '#8b96a3';
  const sv = b => `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><defs>
    <filter id="sh-gl" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <pattern id="sh-br" width="80" height="40" patternUnits="userSpaceOnUse"><rect width="80" height="40" fill="#241d1b"/><path d="M0 0H80M0 20H80M40 0V20M0 20V40M80 20V40" stroke="#16110f" stroke-width="3"/></pattern></defs>${b}</svg>`;
  /* знак гуртка «Вовки»: коло й гострий трикутник-гора */
  const mark = (x, y, r, c, w = 8, extra = '') => `<g ${extra}><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width="${w}"/><path d="M${x - r * .55} ${y + r * .38}L${x} ${y - r * .5}L${x + r * .55} ${y + r * .38}Z" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"/></g>`;
  const tx = (x, y, s, t, c = INK, a = 'middle', w = 700) => `<text x="${x}" y="${y}" font-size="${s}" fill="${c}" text-anchor="${a}" font-family="Oswald,sans-serif" font-weight="${w}">${t}</text>`;
  const hand = (x, y, s, t, c = MUT) => `<text x="${x}" y="${y}" font-size="${s}" fill="${c}" text-anchor="middle" font-family="Caveat,cursive">${t}</text>`;
  const ART = {
    1: () => sv(`<path d="M400 120c-80 0-130 55-130 120 0 50 30 75 50 100 15 20 20 40 20 60h120c0-20 5-40 20-60 20-25 50-50 50-100 0-65-50-120-130-120z" fill="none" stroke="${G}" stroke-width="8"/>
      <path d="M350 430h100M360 460h80" stroke="${G}" stroke-width="8" stroke-linecap="round"/>${mark(400, 245, 55, G, 6, 'opacity=".9" stroke-dasharray="14 10"')}
      ${hand(150, 170, 40, 'назва?')}${hand(650, 160, 40, 'тварина?')}${hand(140, 420, 40, 'наше місце?')}${hand(660, 430, 40, 'що нас обʼєднує?')}`),
    2: () => sv(`<g transform="rotate(-3 400 300)"><rect x="150" y="90" width="500" height="420" rx="10" fill="#f5f1e6"/>
      ${mark(255, 200, 50, '#5a5a5a', 4)}<g stroke="#5a5a5a" stroke-width="4" fill="none"><path d="M390 240l40-80 40 80zM405 215l25-35"/><path d="M520 200c20-40 70-40 80 0s-50 60-80 0"/></g>
      <path d="M548 228l10-20 10 20" stroke="#5a5a5a" stroke-width="3" fill="none"/>
      ${mark(400, 390, 75, '#1d1d1d', 10)}<ellipse cx="400" cy="390" rx="120" ry="108" fill="none" stroke="#d64541" stroke-width="5" stroke-dasharray="10 0"/>
      <text x="560" y="480" font-size="40" fill="#d64541" text-anchor="start" font-family="Caveat,cursive">цей!</text></g>
      <path d="M640 140l70-70 22 22-70 70-30 8z" fill="${G}"/><path d="M710 70l22 22" stroke="#d64541" stroke-width="10"/>`),
    3: () => sv(`<path d="M180 470l80-260h420l-80 260z" fill="#9fd6ff" opacity=".22" stroke="#9fd6ff" stroke-width="3"/>
      ${mark(430, 345, 85, T, 5, 'stroke-dasharray="12 9" transform="skewX(-17) translate(105 0)"')}
      <rect x="250" y="70" width="440" height="22" rx="8" fill="#59636f"/><rect x="410" y="92" width="50" height="70" rx="8" fill="#8b96a3"/><path d="M435 162v80" stroke="#ff4d4d" stroke-width="4"/>
      <circle cx="435" cy="250" r="9" fill="#ff4d4d" filter="url(#sh-gl)"/>${tx(400, 550, 30, 'верстат ріже за векторним файлом', MUT, 'middle', 500)}`),
    4: () => sv(`<rect width="800" height="600" fill="url(#sh-br)" rx="24"/><rect width="800" height="600" fill="#0d1218" opacity=".35" rx="24"/>
      <g filter="url(#sh-gl)">${mark(400, 250, 110, G, 12)}${tx(400, 470, 92, 'ВОВКИ', G)}</g>`),
    5: () => sv(`<rect width="800" height="600" rx="24" fill="#0f1a26"/><circle cx="660" cy="110" r="40" fill="#f5e6b0"/>
      <path d="M0 470h800v130H0z" fill="#16241b"/><path d="M60 470l140-210 140 210z" fill="#2e6b45"/><path d="M200 260v210" stroke="#1d4a30" stroke-width="5"/>
      <path d="M100 200q150 60 300 10t300 20" fill="none" stroke="#59636f" stroke-width="2"/>${[130, 190, 250, 310, 370, 430, 490, 550, 610, 670].map((x, i) => `<circle cx="${x}" cy="${215 + Math.sin(i) * 12}" r="7" fill="${[G, T, '#ff7a9a'][i % 3]}" filter="url(#sh-gl)"/>`).join('')}
      <path d="M520 470V330" stroke="#6b4a2b" stroke-width="12"/><rect x="420" y="250" width="200" height="110" rx="12" fill="#1b1410" stroke="#6b4a2b" stroke-width="6"/>
      <g filter="url(#sh-gl)">${mark(470, 305, 32, G, 6)}${tx(560, 320, 38, 'ВОВКИ', G)}</g>`)
  };
  const stopOf = (SL, idx) => { for (let k = idx; k >= 0; k--) { const x = SL[k]; if (x.t === 'sec') return x.n; if (x.t === 'kintro' || x.t === 'end') return 6; } return 0; };
  function strip(cur) {
    return `<div class="sh-row">${STOPS.map(([n], i) => `<span class="sh-st${i + 1 < cur ? ' done' : ''}${i + 1 === cur ? ' on' : ''}"><i>${i + 1 === cur ? '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="M13 25L20 12L27 25Z" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"/></svg>' : i + 1 < cur ? '✓' : i + 1}</i><b>${n}</b></span>`).join('<span class="sh-ln"></span>')}</div>`;
  }
  function on() {
    const p = document.getElementById('pres');
    if (p && !p.querySelector('.sh-bar')) { p.classList.add('t-sh'); p.insertAdjacentHTML('beforeend', '<div class="sh-bar" aria-hidden="true"></div>'); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', on); else on();
  window.GUT_TEMA = {
    title(s, D) {
      return { a: ART[4](), h: `<div class="ttl"><span class="vy">Гутірка для юнацтва · 12–17 років</span><h2>Від знаку<br>до вивіски</h2><p>шлях одного знаку — від ідеї до світла</p>
        <div class="sh-mini">${STOPS.map(([n]) => `<span>${n}</span>`).join('<i></i>')}</div><div class="meta"><span>${D.chas}</span><span>гра з телефонів</span></div></div>` };
    },
    sec(s) {
      const [n, sub] = STOPS[s.n - 1] || ['', ''];
      return { wide: false, a: ART[s.n] ? ART[s.n]() : '', h: `<div class="sh-sec"><span class="vy">Зупинка ${s.n} з 5</span><h2>${n}</h2><p class="sh-sub">${sub}</p><blockquote>${s.h}</blockquote></div>` };
    },
    after(s, idx, SL) {
      on();
      const b = document.querySelector('#pres .sh-bar'); if (!b) return;
      const cur = stopOf(SL, idx);
      b.hidden = s.t === 'title' || s.t === 'q' || s.t === 'kintro' || s.t === 'end';
      b.innerHTML = strip(cur);
    }
  };
})();
