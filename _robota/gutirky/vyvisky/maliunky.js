/* Гутірка «Від знаку до вивіски» — власні малюнки (SVG). Без чужих логотипів і торгових марок: усі знаки вигадані.
   API — як у «Будові ЛА» (рушій той самий): LA_ART.get(ключ) → <svg>; sil:<ключ> — невдалі знаки для гри «Що тут не так?»;
   photo / has / mount3D / fit — заглушки (фото й 3D тут немає). */
(() => {
  'use strict';
  const C = { bg: '#1f242b', card: '#2a3038', wall: '#2b3440', ln: '#46505c', ink: '#f2f4f6', mut: '#a0a8b2', gd: '#ffc247', ac: '#2fd2c0', sky: '#6fb3ff', red: '#e2574c', grn: '#3aa565', pink: '#ff7aa8' };
  const svg = (body, vb = '0 0 800 600') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><defs>
    <filter id="glw" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="glw2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
    <pattern id="brick" width="60" height="30" patternUnits="userSpaceOnUse"><rect width="60" height="30" fill="#2b3440"/><path d="M0 29.5h60M30 0v15M0 15h60M15 15v15M45 15v15" stroke="#232b35" stroke-width="2"/></pattern>
  </defs>${body}</svg>`;
  const t = (x, y, s, txt, o = {}) => `<text x="${x}" y="${y}" font-family="${o.f || 'Oswald,Arial Narrow,sans-serif'}" font-size="${s}" font-weight="${o.w || 600}" fill="${o.c || C.ink}" text-anchor="${o.a || 'middle'}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.op ? ` opacity="${o.op}"` : ''}>${txt}</text>`;
  const card = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r || 22}" fill="${o.f || C.card}" stroke="${o.s || C.ln}" stroke-width="${o.sw || 2}"/>`;
  /* вигаданий знак гуртка: намет у колі */
  const badge = (cx, cy, r, col = C.gd, fill = 'none') => `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${col}" stroke-width="${r * .12}"/><path d="M${cx - r * .55} ${cy + r * .38}L${cx} ${cy - r * .5}L${cx + r * .55} ${cy + r * .38}Z" fill="${col}"/><path d="M${cx} ${cy + r * .38}L${cx} ${cy - r * .05}" stroke="${fill === 'none' ? C.bg : fill}" stroke-width="${r * .1}"/></g>`;
  /* проста скаутська лілея (контур), без деталей пластового знака */
  const lily = (cx, cy, s, col = C.gd, sw = 6) => `<g transform="translate(${cx} ${cy}) scale(${s})" fill="none" stroke="${col}" stroke-width="${sw / s}" stroke-linejoin="round" stroke-linecap="round">
    <path d="M0 -70C22 -40 22 -10 0 20C-22 -10 -22 -40 0 -70Z"/><path d="M-8 0C-40 -30 -70 -10 -55 20C-45 38 -20 30 -12 22"/><path d="M8 0C40 -30 70 -10 55 20C45 38 20 30 12 22"/><path d="M-30 30H30"/><path d="M0 20V55"/><path d="M-14 55C-8 45 8 45 14 55"/></g>`;

  const ART = {
    /* титул: вечірня стіна, світна вивіска гуртка */
    title: () => svg(`<rect width="800" height="600" rx="28" fill="url(#brick)"/><rect width="800" height="600" rx="28" fill="#0d1218" opacity=".45"/>
      <rect x="150" y="150" width="500" height="250" rx="26" fill="#161b22" stroke="#3a4450" stroke-width="6"/>
      <g filter="url(#glw)">${lily(225, 272, 0.95, C.gd, 6)}${t(452, 302, 78, 'ГУРТОК', { c: C.gd, ls: 3 })}</g>
      <g opacity=".35" filter="url(#glw2)">${lily(225, 272, 0.95, C.gd, 10)}${t(452, 302, 78, 'ГУРТОК', { c: C.gd, ls: 3 })}</g>
      <path d="M300 150V95M500 150V95" stroke="#59636f" stroke-width="6"/><circle cx="300" cy="92" r="8" fill="#59636f"/><circle cx="500" cy="92" r="8" fill="#59636f"/>
      <ellipse cx="400" cy="520" rx="260" ry="26" fill="#ffc247" opacity=".08"/>`),

    /* план: 5 кроків від знаку до вивіски */
    types: () => svg(`${[['знак', 0], ['правила', 1], ['виготовлення', 2], ['вивіски', 3], ['практика', 4]].map(([n, i]) => { const x = 110 + i * 145, y = 430 - i * 70; return `<g>${card(x - 62, y - 62, 124, 124, { r: 26, s: i === 4 ? C.gd : C.ln, sw: i === 4 ? 4 : 2 })}${t(x, y + 8, 56, i + 1, { c: i === 4 ? C.gd : C.ac })}${t(x, y + 100, 22, n, { c: C.mut, w: 500 })}</g>`; }).join('')}
      <path d="M172 420 Q 210 380 255 360M317 350 Q 355 310 400 290M462 280 Q 500 240 545 220M607 210 Q 640 175 680 150" fill="none" stroke="${C.ln}" stroke-width="4" stroke-dasharray="8 10"/>`),

    /* знак — символ — вивіска */
    znak: () => svg(`${card(30, 120, 230, 330)}${card(285, 120, 230, 330)}${card(540, 120, 230, 330)}
      ${badge(145, 260, 70)}${t(145, 370, 30, 'ВОВКИ', { c: C.gd, ls: 3 })}${t(145, 425, 24, 'логотип', { c: C.mut, w: 500 })}
      ${lily(400, 265, 1.25, C.ac, 7)}${t(400, 425, 24, 'символ', { c: C.mut, w: 500 })}
      <rect x="560" y="140" width="190" height="230" rx="10" fill="url(#brick)"/><rect x="575" y="205" width="160" height="80" rx="10" fill="#141a20" stroke="#59636f" stroke-width="4"/>
      <g filter="url(#glw)">${badge(612, 245, 24, C.gd)}${t(685, 258, 34, 'ВОВКИ', { c: C.gd })}</g>${t(655, 425, 24, 'вивіска', { c: C.mut, w: 500 })}`),

    /* навіщо знак: один знак — скрізь */
    navishcho: () => svg(`<path d="M120 520V110" stroke="#8b939d" stroke-width="10" stroke-linecap="round"/><path d="M125 120H330L300 185L330 250H125Z" fill="${C.sky}"/>${badge(215, 185, 40, '#fff')}
      <path d="M420 230l60-40h60l60 40-30 55-30-15v170H450V270l-30 15z" fill="${C.grn}"/>${badge(540, 300, 42, '#fff')}
      <path d="M520 560L640 360L760 560Z" fill="${C.gd}"/><path d="M640 360L640 560" stroke="#7a5a10" stroke-width="6"/>${badge(700, 500, 26, '#2a2010', C.gd)}
      ${t(400, 70, 34, 'ОДИН ЗНАК — СКРІЗЬ', { c: C.ink, ls: 2 })}`),

    /* 5 правил */
    pravyla: () => svg(`${[['простий', 0], ['впізнаваний', 1], ['видно здалеку', 2], ['один колір', 3], ['великий і малий', 4]].map(([n, i]) => { const col = i % 3 === 0 ? C.gd : i % 3 === 1 ? C.ac : C.sky; const x = i < 3 ? 140 + i * 260 : 270 + (i - 3) * 260, y = i < 3 ? 180 : 420; return `<g>${card(x - 110, y - 110, 220, 200, { r: 24 })}${t(x - 80, y - 72, 26, i + 1, { c: col, a: 'start' })}${t(x, y + 72, 24, n, { c: C.ink, w: 600 })}${[
        `<circle cx="${x}" cy="${y - 10}" r="42" fill="${col}"/>`,
        `<path d="M${x} ${y - 60}l14 32 34 3-26 22 8 34-30-18-30 18 8-34-26-22 34-3z" fill="${col}"/>`,
        `<circle cx="${x - 40}" cy="${y - 10}" r="14" fill="none" stroke="${col}" stroke-width="6"/><circle cx="${x - 40}" cy="${y - 10}" r="5" fill="${col}"/><path d="M${x - 12} ${y - 10}H${x + 50}" stroke="${col}" stroke-width="5" stroke-dasharray="6 8"/>${badge(x + 62, y - 10, 12, col)}`,
        `<rect x="${x - 50}" y="${y - 52}" width="100" height="84" rx="12" fill="#fff"/>${badge(x, y - 10, 30, '#111')}`,
        `${badge(x - 28, y - 10, 38, col)}${badge(x + 44, y + 6, 14, col)}`][i]}</g>`; }).join('')}`),

    /* три перевірки */
    test: () => svg(`${card(30, 110, 230, 360)}${card(285, 110, 230, 360)}${card(540, 110, 230, 360)}
      ${badge(145, 250, 20)}<path d="M120 330c0-40 10-70 25-70s25 30 25 70v60h-50z" fill="#e6c7a8"/><rect x="132" y="262" width="26" height="24" rx="8" fill="#f2dcc6"/>
      ${t(145, 430, 22, 'розміром з ніготь', { c: C.mut, w: 500 })}
      <circle cx="320" cy="300" r="14" fill="${C.ink}"/><path d="M320 314v50M320 330l-18 24M320 330l18 24M320 364l-14 36M320 364l14 36" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
      <path d="M345 330H450" stroke="${C.ac}" stroke-width="4" stroke-dasharray="6 8"/>${t(398, 310, 22, '5 кроків', { c: C.ac, w: 500 })}${badge(475, 330, 18)}${t(400, 430, 22, 'здалеку', { c: C.mut, w: 500 })}
      <rect x="590" y="190" width="130" height="160" rx="8" fill="#fff"/>${badge(655, 270, 40, '#111')}${t(655, 430, 22, 'чорно-біла копія', { c: C.mut, w: 500 })}
      ${t(400, 70, 30, 'ЧИ ВПІЗНАЄТЕ?', { ls: 2 })}`),

    /* 7 етапів */
    etapy: () => { const N = ['заміри', 'дизайн', 'матеріали', 'різання', 'збірка', 'світло', 'монтаж'], P = [[110, 140], [300, 140], [490, 140], [680, 140], [590, 330], [400, 330], [210, 330]];
      const ic = [
        (x, y) => `<path d="M${x - 30} ${y + 14}H${x + 30}" stroke="${C.ac}" stroke-width="6"/><path d="M${x - 30} ${y + 4}v20M${x - 15} ${y + 8}v12M${x} ${y + 4}v20M${x + 15} ${y + 8}v12M${x + 30} ${y + 4}v20" stroke="${C.ac}" stroke-width="4"/>`,
        (x, y) => `<path d="M${x - 26} ${y + 26}L${x + 18} ${y - 18}l10 10L${x - 16} ${y + 36}z" fill="${C.gd}"/><path d="M${x - 26} ${y + 26}l-6 16 16-6" fill="${C.gd}"/>`,
        (x, y) => `<rect x="${x - 30}" y="${y - 20}" width="44" height="44" rx="4" fill="${C.sky}" opacity=".55"/><rect x="${x - 14}" y="${y - 6}" width="44" height="44" rx="4" fill="#c9d1d9"/>`,
        (x, y) => `<circle cx="${x}" cy="${y + 6}" r="22" fill="none" stroke="${C.red}" stroke-width="5" stroke-dasharray="10 6"/><path d="M${x} ${y - 30}v26" stroke="${C.red}" stroke-width="6"/>`,
        (x, y) => `<path d="M${x - 24} ${y - 22}h48v14h-17v40h-14v-40h-17z" fill="${C.grn}"/>`,
        (x, y) => `<circle cx="${x}" cy="${y}" r="16" fill="${C.gd}" filter="url(#glw)"/><path d="M${x} ${y - 38}v10M${x} ${y + 28}v10M${x - 38} ${y}h10M${x + 28} ${y}h10" stroke="${C.gd}" stroke-width="5"/>`,
        (x, y) => `<rect x="${x - 34}" y="${y - 30}" width="68" height="62" fill="url(#brick)" stroke="${C.ln}"/><rect x="${x - 24}" y="${y - 12}" width="48" height="20" rx="4" fill="${C.gd}"/>`];
      return svg(`<path d="${P.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join('')}" fill="none" stroke="${C.ln}" stroke-width="5" stroke-dasharray="10 12"/>
        ${P.map(([x, y], i) => `<g>${card(x - 78, y - 70, 156, 140, { r: 22, f: '#262c34' })}${t(x - 56, y - 40, 20, String(i + 1).padStart(2, '0'), { c: C.mut, a: 'start' })}${ic[i](x, y - 4)}${t(x, y + 56, 22, N[i])}</g>`).join('')}
        ${t(400, 520, 26, 'від ідеї до світла', { f: 'Caveat,cursive', c: C.ac, w: 600 })}`); },

    /* растр і вектор */
    vektor: () => { let px = ''; for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) { const dx = i - 5.5, dy = j - 5.5; if (dx * dx + dy * dy < 30) px += `<rect x="${60 + i * 24}" y="${170 + j * 24}" width="24" height="24" fill="${C.gd}" opacity="${dx * dx + dy * dy > 20 ? .5 : 1}"/>`; }
      return svg(`${card(30, 120, 350, 380)}${card(420, 120, 350, 380)}${px}${t(205, 140 + 330, 26, 'растр — з пікселів', { c: C.mut, w: 500 })}
        <circle cx="595" cy="305" r="130" fill="${C.ac}"/><g fill="#fff" stroke="${C.ink}" stroke-width="3"><rect x="589" y="169" width="12" height="12"/><rect x="725" y="299" width="12" height="12"/><rect x="589" y="429" width="12" height="12"/><rect x="453" y="299" width="12" height="12"/></g>
        <path d="M595 175H680M595 175H510" stroke="${C.ink}" stroke-width="2"/><circle cx="680" cy="175" r="6" fill="${C.ink}"/><circle cx="510" cy="175" r="6" fill="${C.ink}"/>${t(595, 470, 26, 'вектор — з ліній', { c: C.mut, w: 500 })}
        ${t(400, 75, 30, 'ЗБІЛЬШУЄМО У 20 РАЗІВ', { ls: 2 })}`); },

    /* матеріали й різання */
    materialy: () => svg(`<g transform="translate(70 170) skewY(-8)"><rect width="230" height="160" rx="6" fill="${C.sky}" opacity=".35" stroke="${C.sky}" stroke-width="3"/>${t(115, 95, 26, 'акрил', { c: C.ink })}</g>
      <g transform="translate(70 360) skewY(-8)"><rect width="230" height="150" rx="6" fill="#aab4bf" stroke="#d9e0e7" stroke-width="3"/>${t(115, 90, 26, 'алюміній', { c: '#1f242b' })}</g>
      ${card(380, 110, 380, 400, { f: '#262c34' })}<rect x="410" y="140" width="320" height="18" rx="6" fill="#59636f"/><rect x="540" y="158" width="60" height="70" rx="8" fill="#6c7782"/><path d="M570 228v40" stroke="${C.ink}" stroke-width="6"/>
      <path d="M470 300h70v170h-30V340h-40zM600 300h70v30h-40v40h30v30h-30v70h-30z" fill="none" stroke="${C.gd}" stroke-width="4" stroke-dasharray="10 6"/><circle cx="570" cy="300" r="7" fill="${C.red}" filter="url(#glw)"/>
      ${t(570, 500, 22, 'верстат ріже за файлом', { c: C.mut, w: 500 })}`),

    /* три типи вивісок */
    typy: () => svg(`${card(20, 140, 245, 320)}${card(278, 140, 245, 320)}${card(536, 140, 245, 320)}
      <g transform="translate(142 300)"><text x="6" y="10" text-anchor="middle" font-family="Oswald" font-weight="600" font-size="78" fill="#5a4410">ЛІС</text><text x="0" y="4" text-anchor="middle" font-family="Oswald" font-weight="600" font-size="78" fill="${C.gd}">ЛІС</text></g>${t(142, 425, 22, 'обʼємні літери', { c: C.mut, w: 500 })}
      <rect x="310" y="245" width="180" height="100" rx="10" fill="#eaf6fb" stroke="#7d93a0" stroke-width="10" filter="url(#glw)"/>${t(400, 314, 56, 'ЛІС', { c: '#1d4254' })}${t(400, 425, 22, 'лайтбокс', { c: C.mut, w: 500 })}
      <g filter="url(#glw)"><path d="M590 320c20-60 40-60 40 0s20 60 40 0 20-60 40 0" fill="none" stroke="${C.pink}" stroke-width="7" stroke-linecap="round"/></g>${t(658, 425, 22, 'LED-неон', { c: C.mut, w: 500 })}`),

    /* будова обʼємної літери */
    litera: () => svg(`<g transform="translate(140 120)"><path d="M0 0h150v360h-50V60H50v300H0z" fill="#3a4450" stroke="${C.ln}" stroke-width="3" transform="translate(40 30)"/>
      <path d="M0 0h150v360h-50V60H50v300H0z" fill="none" stroke="${C.mut}" stroke-width="10" transform="translate(20 15)"/>
      ${[[70, 120], [70, 220], [70, 320], [190, 120], [190, 220], [190, 320], [130, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${C.gd}" filter="url(#glw)"/>`).join('')}
      <path d="M0 0h150v360h-50V60H50v300H0z" fill="${C.ac}" opacity=".35" stroke="${C.ac}" stroke-width="3"/></g>
      <path d="M310 150H470M330 260H470M340 470H470" stroke="${C.ln}" stroke-width="2" stroke-dasharray="5 6"/>
      ${t(480, 160, 30, 'лице', { a: 'start', c: C.ac })}${t(480, 192, 20, 'акрил: пропускає світло', { a: 'start', c: C.mut, w: 500, f: 'Source Sans 3,sans-serif' })}
      ${t(480, 270, 30, 'борт', { a: 'start', c: C.ink })}${t(480, 302, 20, 'дає глибину й міцність', { a: 'start', c: C.mut, w: 500, f: 'Source Sans 3,sans-serif' })}
      ${t(480, 480, 30, 'основа', { a: 'start', c: C.gd })}${t(480, 512, 20, 'світлодіоди, дроти, кріплення', { a: 'start', c: C.mut, w: 500, f: 'Source Sans 3,sans-serif' })}`),

    /* як світиться */
    svitlo: () => svg(`${card(40, 160, 340, 280, { f: '#20262d' })}${[0, 1, 2, 3].map(i => `<rect x="${80 + i * 70}" y="270" width="50" height="40" rx="8" fill="#39424d"/><circle cx="${105 + i * 70}" cy="290" r="9" fill="${C.gd}" filter="url(#glw)"/>`).join('')}
      <path d="M130 290h20M200 290h20M270 290h20" stroke="${C.ink}" stroke-width="3"/><path d="M360 290H470" stroke="${C.ink}" stroke-width="5"/>
      <rect x="470" y="240" width="140" height="100" rx="12" fill="#3a4450" stroke="${C.ln}" stroke-width="3"/>${t(540, 285, 22, 'блок', { c: C.ink })}${t(540, 312, 22, 'живлення', { c: C.ink })}
      <path d="M610 290H700" stroke="${C.ink}" stroke-width="5"/><rect x="700" y="268" width="40" height="44" rx="8" fill="#59636f"/><path d="M740 280h20M740 300h20" stroke="#c9d1d9" stroke-width="5"/>
      ${t(210, 210, 22, 'світлодіоди (LED)', { c: C.gd, w: 500 })}${t(415, 270, 18, 'низька', { c: C.ac, w: 500 })}${t(415, 320, 18, 'напруга', { c: C.ac, w: 500 })}${t(660, 270, 18, '230 В', { c: C.red, w: 500 })}
      <path d="M520 400l-20 40h28l-20 40" fill="none" stroke="${C.red}" stroke-width="6" stroke-linejoin="round"/>${t(560, 520, 24, 'підключає лише фахівець', { c: C.red, w: 600 })}`),

    /* практика: знак гуртка */
    praktyka: () => svg(`<rect x="110" y="70" width="440" height="470" rx="10" fill="#f4f1e8" transform="rotate(-3 330 300)"/>
      <g transform="rotate(-3 330 300)" fill="none" stroke="#33302a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="210" cy="190" r="60"/><path d="M175 215l35-60 35 60z"/>
        <path d="M330 150l40 80h-80z"/><path d="M300 245q40-30 80 0"/>
        <path d="M430 140c40 0 60 40 40 70s-60 30-70 0 0-70 30-70z"/><circle cx="440" cy="185" r="8" fill="#33302a"/>
        <circle cx="330" cy="400" r="80" stroke="#c8284a" stroke-width="7"/><path d="M280 435l50-90 50 90z" fill="#c8284a" stroke="#c8284a"/><path d="M330 435v-35" stroke="#f4f1e8" stroke-width="8"/></g>
      <path d="M560 170l50-50 30 30-50 50z" fill="${C.gd}"/><path d="M560 170l-14 44 44-14" fill="#e6c7a8"/><path d="M640 150l20-20" stroke="#c8284a" stroke-width="16" stroke-linecap="round"/>
      ${t(660, 400, 34, '3 ескізи', { c: C.ac, f: 'Caveat,cursive' })}${t(660, 440, 34, '→ 1 знак', { c: C.ac, f: 'Caveat,cursive' })}`),

    /* вивіска для табору */
    tabir: () => svg(`<rect width="800" height="600" rx="28" fill="#141b24"/><circle cx="660" cy="110" r="40" fill="#f3e6b0" opacity=".9"/>
      <path d="M90 470L280 190L470 470Z" fill="#3b6b4a"/><path d="M280 190L280 470" stroke="#22412c" stroke-width="8"/><path d="M230 470l50-90 50 90z" fill="#1d2f24"/>
      <path d="M520 470V300M700 470V300" stroke="#8a6a46" stroke-width="12"/><rect x="500" y="300" width="220" height="90" rx="8" fill="#a97f52" stroke="#6e4f30" stroke-width="5"/>
      ${t(610, 362, 50, 'ВОВКИ', { c: '#3a2614' })}
      <path d="M90 175Q300 240 520 175T760 200" fill="none" stroke="#59636f" stroke-width="2"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const x = 110 + i * 75, y = 182 + Math.sin(i) * 14 + (i > 5 ? 10 : 0); return `<circle cx="${x}" cy="${y}" r="7" fill="${[C.gd, C.ac, C.pink][i % 3]}" filter="url(#glw)"/>`; }).join('')}
      <rect y="470" width="800" height="130" rx="0" fill="#1c2620"/>`)
  };

  /* невдалі знаки для гри «Що тут не так?» — на білій картці, як надруковані */
  const BAD = {
    dribno: () => { let d = ''; for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2; d += `<circle cx="${400 + Math.cos(a) * 120}" cy="${300 + Math.sin(a) * 120}" r="4" fill="#2c3e50"/><path d="M${400 + Math.cos(a) * 60} ${300 + Math.sin(a) * 60}L${400 + Math.cos(a) * 110} ${300 + Math.sin(a) * 110}" stroke="#2c3e50" stroke-width="1.5"/>`; }
      return d + `<circle cx="400" cy="300" r="56" fill="none" stroke="#2c3e50" stroke-width="2"/><circle cx="400" cy="300" r="40" fill="none" stroke="#2c3e50" stroke-width="1"/>${[...Array(9)].map((_, i) => `<path d="M${370 + i * 7} 285l4 -8 4 8" fill="none" stroke="#2c3e50" stroke-width="1.2"/>`).join('')}<text x="400" y="320" font-size="9" text-anchor="middle" fill="#2c3e50" font-family="Source Sans 3,sans-serif">гурток «Вовки» · курінь · осередок · рік</text>`; },
    kolory: () => ['#e2574c', '#ee8a4a', '#ffc247', '#3aa565', '#2fd2c0', '#3f7fd9', '#a46be0'].map((c, i) => `<path d="M400 300L${400 + Math.cos(i / 7 * Math.PI * 2) * 150} ${300 + Math.sin(i / 7 * Math.PI * 2) * 150}A150 150 0 0 1 ${400 + Math.cos((i + 1) / 7 * Math.PI * 2) * 150} ${300 + Math.sin((i + 1) / 7 * Math.PI * 2) * 150}Z" fill="${c}"/>`).join('') + `<circle cx="400" cy="300" r="60" fill="#ff7aa8"/><path d="M370 320l30-55 30 55z" fill="#7cfc00"/>`,
    tekst: () => `<circle cx="250" cy="300" r="70" fill="#1d4e89"/><path d="M215 330l35-65 35 65z" fill="#fff"/>` + ['ГУРТОК «ВОВКИ» КУРЕНЯ ІМЕНІ', 'НАШОГО ВЕЛИКОГО ГЕРОЯ, ЩО У', 'НАШОМУ ОСЕРЕДКУ ВЖЕ ВІД 2019', 'РОКУ — НАЙКРАЩИЙ ГУРТОК УСІХ'].map((s, i) => `<text x="345" y="${262 + i * 28}" font-size="20" font-family="Source Sans 3,sans-serif" font-weight="700" fill="#1d4e89">${s}</text>`).join(''),
    shryft: () => `<path d="M170 330c20-90 60-90 50-10s-40 40-10-30 60-40 50 20-10 50 20 0 50-60 60-10-20 70 20 20 40-60 60-30-10 50 20 30 30-70 60-40 0 60 30 20 40-80 70-50-20 70 10 40 40-60 60-20-10 50 30 10" fill="none" stroke="#5b2a86" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M180 360c120 20 300 20 440-10" fill="none" stroke="#5b2a86" stroke-width="3"/>`,
    kontrast: () => `<circle cx="400" cy="300" r="140" fill="#fbf6d9"/><path d="M320 360l80-150 80 150z" fill="#fff7c2"/><text x="400" y="480" font-size="44" text-anchor="middle" fill="#fdf3c4" font-family="Oswald,sans-serif" font-weight="600">ВОВКИ</text>`
  };
  const silhouette = k => svg(`<rect x="130" y="110" width="540" height="400" rx="22" fill="#ffffff"/>${BAD[k] ? BAD[k]() : ''}`, '130 110 540 400');   // щільна рамка — знак крупніший

  const noop = () => () => {};
  window.LA_ART = {
    get: k => k && k.startsWith('sil:') ? silhouette(k.slice(4)) : (ART[k] ? ART[k]() : ''),
    photo: () => '', has: () => false, mount3D: noop(), fit: () => {}, PH: {}
  };
})();
