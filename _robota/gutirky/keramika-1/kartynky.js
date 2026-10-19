/* «Кераміка І» — картинки з ChatGPT (19.10.2026, власник; 2-й набір — з прозорим фоном) замість SVG-малюнків.
   ПОКИ ЩО ЛИШЕ В МАКЕТАХ (zibraty.py proba|vhody, kart=True).
   Картинки — kartynky/*.webp (1672×941, прозорий фон, без написів). Підписи, лінії й стрілки малюємо зверху (координати — пікселі картинки).
   Підміняє LA_ART.get для цих ключів (і pair:…, g:… — гра «Вгадай вид»); решта — як була. */
(function () {
  'use strict';
  const W = 1672, H = 941;
  const K = { bg: '#1d1511', line: '#ffb27a', ink: '#ffffff', gd: '#ffc247', ac: '#2fd2c0', mut: '#c9b29c', mutB: '#6b5a4c', dark: '#2a1d15' };
  const IMG = { /*{{KART}}*/ };
  const CW = ch => /[A-ZА-ЯІЇЄҐ0-9]/.test(ch) ? .64 : ch === ' ' ? .27 : /[.,:;'’!?«»()—–\-·°≈]/.test(ch) ? .38 : /[шщжмюф]/.test(ch) ? .76 : .55;
  const tw = (s, fs) => [...s].reduce((a, c) => a + CW(c), 0) * fs;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  /* «таблетка», як у малюнках гутірки: x,y — центр; col — ink|gd|ac|mut; fs — розмір (у пікселях картинки) */
  function pill(x, y, t, col = 'ink', fs = 36, an = 'middle') {
    const L = String(t).split('\n'), pad = fs * .72, lh = fs * 1.16;
    const w = Math.max(...L.map(l => tw(l, fs))) + pad * 2, h = L.length * lh + fs * .66;
    const rx = an === 'end' ? x - w : an === 'start' ? x : x - w / 2, cx = rx + w / 2;
    const bd = { ink: K.line, gd: K.gd, ac: K.ac, mut: K.mutB }[col], tc = { ink: K.ink, gd: K.gd, ac: K.ac, mut: K.mut }[col];
    return `<rect x="${rx.toFixed(1)}" y="${(y - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(h / 2, fs * 1.05).toFixed(1)}" fill="${K.bg}" fill-opacity=".93" stroke="${bd}" stroke-width="${(fs * .09).toFixed(1)}"/>` +
      `<text font-size="${fs}" fill="${tc}" font-weight="700" text-anchor="middle">${L.map((l, i) => `<tspan x="${cx.toFixed(1)}" y="${(y + (i - (L.length - 1) / 2) * lh + fs * .35).toFixed(1)}">${esc(l)}</tspan>`).join('')}</text>`;
  }
  const txt = (x, y, t, col = 'mut', fs = 28, an = 'middle') => `<text x="${x}" y="${y}" font-size="${fs}" font-weight="700" fill="${K[col] || col}" text-anchor="${an}">${esc(t)}</text>`;
  const line = (x1, y1, x2, y2, c = K.line, w = 4, dash) => `<path d="M${x1},${y1} L${x2},${y2}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  const dot = (x, y, r = 11, c = K.gd) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
  /* виноска: точка на предметі → лінія → «таблетка» */
  const call = (px, py, x, y, t, col = 'ink', an = 'middle') => line(px, py, x, y, col === 'gd' ? K.gd : col === 'ac' ? K.ac : K.line, 3.5) + `<circle cx="${px}" cy="${py}" r="8" fill="#fff" stroke="${col === 'gd' ? K.gd : K.line}" stroke-width="4"/>` + pill(x, y, t, col, 34, an);
  const arrow = (id, x1, y1, x2, y2, c = K.gd, w = 9) => line(x1, y1, x2, y2, c, w) + (() => { const a = Math.atan2(y2 - y1, x2 - x1), s = w * 3.2; return `<path d="M${x2 + Math.cos(a) * s * .6},${y2 + Math.sin(a) * s * .6} L${x2 + Math.cos(a + 2.4) * s},${y2 + Math.sin(a + 2.4) * s} L${x2 + Math.cos(a - 2.4) * s},${y2 + Math.sin(a - 2.4) * s}Z" fill="${c}"/>`; })();
  const row = (xs, y, ts, cols = [], fs = 36) => xs.map((x, i) => ts[i] ? pill(x, y, ts[i], cols[i] || 'ink', fs) : '').join('');
  const axis = (x1, x2, y, xs) => line(x1, y, x2, y, K.line, 5) + xs.map(x => dot(x, y)).join('');

  const TYPE = { terakota: 'Теракота', shamot: 'Шамот', majolika: 'Майоліка', fajans: 'Фаянс', kamyana: 'Кам’яна маса', porcelyana: 'Порцеляна' };
  const TAGS = { terakota: 'пориста · без глазурі', shamot: 'зерниста · витримує жар', majolika: 'кольоровий черепок · розпис', fajans: 'білий черепок · прозора глазур', kamyana: 'щільна · не пропускає воду', porcelyana: 'каолін, біла · просвічує' };
  const PAIR = { 'terakota,shamot': 'tsh', 'majolika,fajans': 'mf', 'kamyana,porcelyana': 'kp' };
  /* предмети для гри «Вгадай вид» — шматок картинки з парою [картинка, x, y, w, h] */
  const CROP = { terakota: ['tsh', 190, 25, 500, 540], shamot: ['tsh', 920, 230, 680, 330], majolika: ['mf', 70, 85, 750, 510], fajans: ['mf', 865, 80, 745, 515],
    kamyana: ['kp', 120, 70, 640, 515], porcelyana: ['kp', 915, 170, 670, 430] };

  /* кожен малюнок: [назва, y0, y1 (видима смуга картинки), шар з підписами] */
  const A = {
    vessels: ['Полиця з керамікою', 280, 740, () => ''],
    process: ['Глина, форма, сушіння, випал, кераміка', 260, 820, () =>
      row([180, 486, 802, 1144, 1494], 745, ['Глина', 'Форма', 'Сушіння', 'Випал\n900–1300 °C', 'Кераміка'], ['ink', 'ink', 'ink', 'gd', 'ac'])],
    deep: ['Від глиняних фігурок до гончарного круга', 230, 900, () =>
      axis(40, 1600, 760, [275, 791, 1355]) + arrow(0, 1560, 760, 1630, 760, K.gd, 5) +
      row([275, 791, 1355], 845, ['≈ 26 000 років тому\nглиняні фігурки', '≈ 20 000 років тому\nперший посуд', 'понад 5000 років тому\nгончарний круг'], ['ink', 'ink', 'gd'], 34)],
    timeline: ['Кераміка в Україні: шість епох', 290, 960, () => {
      const X = [172, 443, 696, 957, 1218, 1503], T = [['V–III тис. до н. е.', 'Трипілля'], ['з VI ст. до н. е.', 'Античні міста'], ['IX–XIII ст.', 'Київська Русь'], ['XVI–XVIII ст.', 'Козацька доба'], ['XIX–XX ст.', 'Осередки'], ['сьогодні', 'Майстри й музеї']];
      return X.map((x, i) => line(x, 690, x, i % 2 ? 840 : 740, K.line, 3, '6 8')).join('') + axis(30, 1640, 690, X) +
        X.map((x, i) => pill(x, i % 2 ? 885 : 775, T[i][0] + '\n' + T[i][1], i === 0 ? 'gd' : 'ink', 30)).join('');
    }],
    hand: ['Вільне, стрічкове ліплення і пласти', 300, 820, () => arrow(0, 225, 420, 280, 475, K.gd, 7) +
      row([350, 783, 1297], 775, ['Вільне', 'Стрічкове', 'Пласти'], ['gd', 'gd', 'ink'])],
    wheel: ['Центрування, відкривання, витягування стінок', 200, 900, () => arrow(0, 545, 640, 620, 640) + arrow(0, 1100, 640, 1175, 640) +
      row([296, 854, 1394], 845, ['Центрування', 'Відкривання', 'Витягування стінок'], ['ink', 'ink', 'gd'])],
    template: ['Шаблон формує виріб на гіпсовій формі', 40, 960, () =>
      call(838, 160, 520, 120, 'Шаблон', 'gd') + call(330, 470, 210, 330, 'Глина') + call(640, 560, 330, 910, 'Гіпсова форма') + call(1260, 790, 1340, 915, 'Круг обертається')],
    gyps: ['Глину вдавлюють у гіпсову форму, гіпс вбирає воду, виріб виймають', 180, 860, () =>
      `<g>${[190, 303, 416].map(x => arrow(0, x, 300, x, 395, K.gd, 8)).join('')}</g>` + arrow(0, 640, 535, 760, 535, K.ac, 7) + arrow(0, 1055, 535, 935, 535, K.ac, 7) +
      row([303, 847, 1380], 740, ['1. Вдавлюємо глину', '2. Гіпс вбирає воду', '3. Розкриваємо форму —\nвиріб відстає'], ['gd', 'ac', 'ink'], 34)],
    mold: ['Шлікерне лиття в гіпсову форму: три кроки', 110, 980, () => arrow(0, 600, 390, 690, 390, K.ac, 7) + arrow(0, 1065, 390, 975, 390, K.ac, 7) +
      row([300, 837, 1371], 925, ['1. Заливаємо шлікер', '2. Гіпс вбирає воду —\nросте стінка', '3. Зайве виливаємо'], ['ink', 'ac', 'ink'], 32)],
    press: ['Прес стискає порошкоподібну масу в сталевій формі: плитка', 70, 880, () =>
      pill(483, 120, 'Прес', 'gd') + [300, 483, 666].map(x => arrow(0, x, 175, x, 300, K.gd, 9)).join('') + arrow(0, 905, 520, 975, 520) +
      pill(483, 770, 'Порошок у сталевій формі') + pill(1287, 830, 'Плитка', 'gd')],
    techs: ['П’ять технік формотворення', 170, 820, () =>
      row([160, 475, 829, 1159, 1494], 765, ['а · Ліплення', 'б · Точення', 'в · Шаблон', 'г · Гіпс', 'ґ · Пресування'], ['ink', 'ink', 'ink', 'ac', 'ink'], 32)],
    temp: ['Температура випалу різних видів кераміки', 95, 960, () => {
      const B = [[195, 765, 165, 'Теракота', '#fff'], [195, 766, 300, 'Майоліка', K.dark], [558, 1167, 432, 'Фаянс', K.dark], [996, 1359, 560, 'Кам’яна маса', K.dark], [1212, 1579, 682, 'Порцеляна', K.dark]];
      let g = B.map(([a, b, y, n, c]) => txt((a + b) / 2, y + 14, n, c, 40)).join('');
      [135, 366, 599, 832, 1066, 1299, 1533].forEach((x, i) => { g += txt(x, 900, (800 + i * 100) + ' °C', 'mut', 30); });
      return g + txt(1610, 948, 'Шамот — про масу: у ній подрібнена випалена глина', 'mut', 26, 'end');
    }],
    piala3: ['Три піали і крапля води', 290, 900, () =>
      row([295, 837, 1381], 775, ['1-й випал: бісквіт', '2-й випал без глазурі', 'Розпис і глазур'], ['ink', 'ink', 'ac'], 34) +
      row([295, 837, 1381], 850, ['вбирає', 'перевірте!', 'скочується'], ['mut', 'gd', 'mut'], 28)],
    museum: ['Вітрина музею і чотири запитання', 190, 770, () =>
      [[200, 282, 'Звідки?'], [200, 641, 'Як зроблено?'], [1473, 282, 'Який вид?'], [1473, 641, 'Для чого?']].map(([x, y, t]) => txt(x, y + 13, t, 'gd', 38)).join('')],
    three: ['Тарілка, миска, глечик або горнятко', 280, 890, () => txt(1530, 420, 'або', 'mut', 34) +
      row([294, 790, 1375], 740, ['1. Тарілка', '2. Миска', '3. Глечик або горнятко'], ['gd', 'gd', 'gd'], 34) +
      row([294, 790, 1375], 820, ['з пласта', 'вільне чи стрічкове', 'стрічками, ручка — шлікером'], ['mut', 'mut', 'mut'], 26)]
  };
  const pairLayer = (a, b) => [[a, 428], [b, 1250]].map(([t, x]) => pill(x, 905, TYPE[t], 'gd', 42) + txt(x, 985, TAGS[t], 'mut', 30)).join('');

  const svg = (vb, label, body) => `<svg viewBox="${vb}" role="img" aria-label="${esc(label)}" class="kart">${body}</svg>`;
  const img = k => `<image href="${IMG[k]}" width="${W}" height="${H}"/>`;
  function art(k) { const [n, y0, y1, lay] = A[k]; return svg(`0 ${y0} ${W} ${y1 - y0}`, n, img(k) + lay()); }
  function pairArt(a, b) { const k = PAIR[a + ',' + b]; return svg(`0 20 ${W} 1000`, TYPE[a] + ' і ' + TYPE[b], img(k) + pairLayer(a, b)); }
  function guess(t) { const [k, x, y, w, h] = CROP[t]; return svg(`${x} ${y} ${w} ${h}`, 'Що це за кераміка?', img(k)); }

  const get0 = window.LA_ART.get;
  window.LA_ART.get = k => {
    if (!k) return get0(k);
    if (A[k] && IMG[k]) return art(k);
    if (k.startsWith('pair:') && IMG[PAIR[k.slice(5)]]) return pairArt(...k.slice(5).split(','));
    if (k.startsWith('g:') && CROP[k.slice(2)] && IMG[CROP[k.slice(2)][0]]) return guess(k.slice(2));
    return get0(k);
  };
})();
