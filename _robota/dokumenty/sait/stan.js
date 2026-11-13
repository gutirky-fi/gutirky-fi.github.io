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

  /* № сходин (13.11): «наступний № сам» і «такий № уже є». Спільне для «Відвідуваності» і «Після сходин».
     Усі № з книги: [{d: '2026-11-08', n: '12'}] або null (немає зв'язку). Нова версія приймача має дію 'nomery' (її бачать і юнаки);
     у старій виховник усе одно прочитає аркуш «Сходини» через 'zvit' — а юнаки без оновлення приймача просто не побачать підказки. */
  const iso = s => { s = String(s || '').trim(); let m = s.match(/^(\d{4})-(\d\d)-(\d\d)/); if (m) return m[0];
    m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/); return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : ''; };
  async function nomery(zapyt, kod) {
    try { const v = await zapyt({kod, dija: 'nomery'}); if (v && v.ok && Array.isArray(v.nomery)) return v.nomery.map(x => ({d: iso(x.d), n: String(x.n).trim()})).filter(x => x.d && x.n); } catch (x) {}
    try {
      const v = await zapyt({kod, dija: 'zvit', arkush: 'Сходини'}), z = (v && v.zaholovky) || [], cd = z.indexOf('Дата'), cn = z.indexOf('№');
      if (v && v.ok && cd >= 0 && cn >= 0) return (v.ryadky || []).map(r => ({d: iso(r[cd]), n: String(r[cn] === null || r[cn] === undefined ? '' : r[cn]).trim()})).filter(x => x.d && x.n);
    } catch (x) {}
    return null;
  }
  const chyslo = n => /^\d{1,4}$/.test(n) ? +n : null;
  // наступний вільний № — після № найпізніших сходин (а якщо раптом зайнятий — далі); порожня книга → «1»
  function nastupnyi(spysok) {
    if (!spysok) return '';
    const zajniati = new Set(spysok.map(x => chyslo(x.n)).filter(x => x !== null));
    const z = spysok.filter(x => chyslo(x.n) !== null).sort((a, b) => a.d < b.d ? 1 : a.d > b.d ? -1 : chyslo(b.n) - chyslo(a.n))[0];
    let n = z ? chyslo(z.n) + 1 : 1; while (zajniati.has(n)) n++;
    return String(n);
  }
  // такий № уже є на ІНШУ дату? → {d, n} (рядок для попередження «№ 12 уже є — 08.11.2026»); та сама дата — це той самий запис
  function povtor(spysok, nr, d) {
    const n = chyslo(String(nr || '').trim()); if (!spysok || n === null) return null;
    return spysok.find(x => chyslo(x.n) === n && x.d !== d) || null;
  }
  const poperedzhennia = (spysok, nr, d) => { const p = povtor(spysok, nr, d); return p ? '№ ' + chyslo(String(nr).trim()) + ' уже є — ' + dd(p.d) + '. Наступний вільний — ' + nastupnyi(spysok) + '.' : ''; };

  return {dd, zapys, den, khto, vnesky, nomery, nastupnyi, povtor, poperedzhennia};
})();
