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

  return {dd, zapys, den, khto, vnesky};
})();
