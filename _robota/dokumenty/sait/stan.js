/* «Ця дата вже записана?» — СПІЛЬНЕ для «Відвідуваності» (vidviduvanist.html) і «Вхід виховника → Після сходин» (vykhovnyk.html). 13.11.2026.
   Сторінка дає свою функцію zapyt (справжня книга або проба) і код. Приймач уже вміє:
   {dija:'stan', arkush, dani:{Дата}} → {ye, ryadok, zatverdzheno, khto, koly, dani, prys};  {dija:'den', arkush:'Фінанси', dani:{Дата}} → {ryadky:[…]}.
   Правило проєкту: міняєте, як форма дізнається «вже записано», — міняйте ТУТ. */
window.Stan = (function () {
  'use strict';
  const dd = d => String(d || '').slice(0, 10).split('-').reverse().join('.');   // 2026-11-08 → 08.11.2026

  // один аркуш, ключ — дата: null, якщо немає зв'язку
  async function zapys(zapyt, kod, arkush, d) {
    try { const v = await zapyt({kod, dija: 'stan', arkush, dani: {'Дата': d}}); return v && v.ok ? v : null; } catch (x) { return null; }
  }

  // усе за дату сходин одним разом: відвідуваність, сходини, каса цього дня
  async function den(zapyt, kod, d) {
    const fin = zapyt({kod, dija: 'den', arkush: 'Фінанси', dani: {'Дата': d}}).then(v => v && v.ok ? v.ryadky || [] : null, () => null);
    const [vid, skh, f] = await Promise.all([zapys(zapyt, kod, 'Відвідуваність', d), zapys(zapyt, kod, 'Сходини', d), fin]);
    return {vid, skh, fin: f};
  }

  // «Ярко, 08.11.2026 19:30» — хто й коли записав
  const khto = v => !v ? '' : [v.khto, v.koly].filter(Boolean).join(', ');

  // з рядків каси цього дня — лише внески (те, що «Після сходин» могло б записати вдруге)
  function vnesky(ryadky) {
    const out = [], inshi = [];
    (ryadky || []).forEach(r => {
      const x = r.dani || {};
      if (x['Рух'] === 'надходження' && x['Категорія'] === 'внески' && x["Хто (ім'я)"]) {
        out.push({im: x["Хто (ім'я)"], suma: Number(String(x['Сума, €']).replace(',', '.')) || 0, yak: x['Як платили'] || '', vn: x['Внесок'] || '',
                  khto: r.khto || '', koly: r.koly || '', zatv: !!r.zatverdzheno, ne: !!r.ne, ryadok: r.ryadok});
      } else inshi.push(r);
    });
    return {vnesky: out, inshi};
  }

  /* № сходин (13.11): усі № з книги. Спільне для «Відвідуваності», «Після сходин» і звітів.
     Усі сходини книги: [{d: '2026-11-08', n: '12'}] (n може бути порожнім — дата все одно рахується) або null (немає зв'язку). Нова версія приймача має дію 'nomery' (її бачать і юнаки);
     у старій виховник усе одно прочитає аркуш «Сходини» через 'zvit' — а юнаки без оновлення приймача просто не побачать підказки. */
  const iso = s => { s = String(s || '').trim(); let m = s.match(/^(\d{4})-(\d\d)-(\d\d)/); if (m) return m[0];
    m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/); return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : ''; };
  async function nomery(zapyt, kod) {
    try { const v = await zapyt({kod, dija: 'nomery'}); if (v && v.ok && Array.isArray(v.nomery)) return v.nomery.map(x => ({d: iso(x.d), n: String(x.n === null || x.n === undefined ? '' : x.n).trim()})).filter(x => x.d); } catch (x) {}
    try {
      const v = await zapyt({kod, dija: 'zvit', arkush: 'Сходини'}), z = (v && v.zaholovky) || [], cd = z.indexOf('Дата'), cn = z.indexOf('№');
      if (v && v.ok && cd >= 0 && cn >= 0) return (v.ryadky || []).map(r => ({d: iso(r[cd]), n: String(r[cn] === null || r[cn] === undefined ? '' : r[cn]).trim()})).filter(x => x.d);
    } catch (x) {}
    return null;
  }
  const chyslo = n => /^\d{1,4}$/.test(n) ? +n : null;
  /* № сходин РАХУЄТЬСЯ САМ ЗА ДАТАМИ (рішення власника 13.11, 23:21 і 23:43), а не «останній + 1»:
     № = порядкове місце сходин серед усіх дат у книзі (найраніша — перша), підряд за весь час виховника, щороку НЕ скидається
     («скільки сходин за рік» — окремо, у звіті). Внесли пропущені сходини потім — номери після них зсуваються самі.
     Початок лічби — № найраніших сходин книги (зазвичай 1; якщо є старі записи попереднього виховника — «перші сходини в книзі — № …»).
     У Google-таблиці число лежить так, як було записано, тому сайт і звіти ЗАВЖДИ рахують за датами (nomer / zaDatamy), а не читають його як є. */
  const daty = spysok => [...new Set((spysok || []).map(x => x.d).filter(Boolean))].sort();
  // початок лічби: № найранішого запису, де він є числом (мінус кількість ранішніх дат без №); порожня книга → 1
  function pochatok(spysok) {
    const dl = daty(spysok);
    for (let i = 0; i < dl.length; i++) {
      const k = spysok.filter(x => x.d === dl[i]).map(x => chyslo(x.n)).filter(x => x !== null);
      if (k.length) return Math.max(1, Math.min(...k) - i);
    }
    return 1;
  }
  // № сходин цієї дати; null — немає зв'язку з книгою (тоді № не пишемо)
  function nomer(spysok, d) { return !spysok || !d ? null : pochatok(spysok) + daty(spysok).filter(x => x < d).length; }
  // ці сходини — найраніші в книзі (або книга порожня): лише тут можна «змінити» початок лічби
  const pershi = (spysok, d) => !!spysok && !!d && !daty(spysok).some(x => x < d);
  // усі дати книги → № (для звітів): {'2026-11-01': 1, '2026-11-08': 2, …}
  function zaDatamy(spysok) { const o = {}, p = pochatok(spysok); daty(spysok).forEach((d, i) => { o[d] = p + i; }); return o; }
  // 14 → «14-ті сходини» (1-ші, 2-гі, 3-ті … 7-мі, 8-мі … 11-ті … 21-ші, 40-ві)
  function slovom(n) {
    const k = n % 100, o = n % 10;
    const z = k >= 11 && k <= 19 ? 'ті' : k === 40 ? 'ві' : o === 1 ? 'ші' : o === 2 ? 'гі' : (o === 7 || o === 8) ? 'мі' : 'ті';
    return n + '-' + z + ' сходини';
  }

  return {dd, zapys, den, khto, vnesky, nomery, nomer, pershi, zaDatamy, slovom};
})();
