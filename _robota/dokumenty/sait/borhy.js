/* Борги «свої гроші»: заліки («у внесок», «переплата → у борг гуртка») і «Повернули» — СПІЛЬНЕ для «Каси» (forma.html) і «Вхід виховника → Перевірка каси» (vykhovnyk.html). 14.11.2026.
   Тут — логіка (кому й куди можна зарахувати), виклик приймача і слова. Кнопки й форми кожна сторінка малює у своєму стилі.
   Потрібен Vn (vnesky.js). VN — відповідь приймача на {dija:'vnesky'}: {vnesky:[…], splacheno:{ім'я:{внесок: сума}}}.
   Правило проєкту: міняєте, що можна зарахувати чи як про це написано, — міняйте ТУТ, а не в одній зі сторінок. */
window.Borhy = (function () {
  'use strict';
  const okr = x => Math.round(x * 100) / 100;
  const maeVn = VN => !!VN && Array.isArray(VN.vnesky) && VN.vnesky.length > 0;
  // скільки людині бракує за внеском x
  const brak = (VN, im, x) => okr(Vn.treba(x, im) - (((VN.splacheno || {})[im] || {})[x.n] || 0));

  /* Гурток винен людині (купувала за свої) → «На прохання — у внесок»: у найдавніший внесок, якого їй ще не вистачає. null — немає куди. */
  function zalNa(VN, im) {
    if (!maeVn(VN)) return null;
    return Vn.poriadok(VN).find(x => brak(VN, im, x) > 0) || null;
  }

  /* Переплачені внески: [{im, x, p}] — хто, за який внесок і на скільки більше, ніж треба. */
  function pereplaty(VN) {
    const l = []; if (!maeVn(VN)) return l;
    const vs = Vn.poriadok(VN);
    Object.keys(VN.splacheno || {}).forEach(im => vs.forEach(x => { const p = -brak(VN, im, x); if (p > 0) l.push({im, x, p}); }));
    return l;
  }
  const PEREPLATA_POYASNENNIA = 'Переплату зараховують у борг: гурток буде винен — потім «Повернули» або «У внесок» (наступний). Якщо людина сама винна гуртку — борг зменшиться.';
  const ZALIK_POYASNENNIA = 'Залік — без грошей: борг гуртка зараховується у внесок, у книзі лишається рядок «залік».';

  /* Залік через приймач. kudy: 'vnesok' (борг гуртка → у внесок) | 'borh' (переплата → у борг гуртка). zapyt — функція сторінки.
     khto — лише якщо сторінка знає, хто записує (виховник: приймач підставить «виховник» сам). → відповідь приймача {ok, suma, borh, brak} або {ok:false, pomylka}. */
  async function zalik(zapyt, kod, o) {
    const z = {kod, dija: 'zalik', imya: o.im, vnesok: o.n, kudy: o.kudy};
    if (o.khto) z.khto = o.khto;
    try { return await zapyt(z); } catch (x) { return {ok: false, pomylka: 'Немає зв\'язку.'}; }
  }
  /* Речення про результат заліку. groshi — як сторінка пише суму. */
  function pidsumokZaliku(kudy, v, im, n, groshi) {
    return kudy === 'vnesok'
      ? `Зараховано ${groshi(v.suma)} боргу гуртка у «${n}» (${im}) — без грошей.${v.brak > 0 ? ' Доплатити ще ' + groshi(v.brak) + '.' : ' Внесок сплачено ✓.'}`
      : `Переплату ${groshi(v.suma)} («${n}», ${im}) зараховано: ` + (v.borh > 0 ? `гурток винен ${groshi(v.borh)}.` : v.borh < 0 ? `${im} ще винен(-на) гуртку ${groshi(-v.borh)}.` : '✓ розраховано.');
  }

  /* «Повернули»: людина віддала s, гурток був винен b. Якщо різниця є — пояснення й два варіанти (слова однакові на обох сторінках).
     → null (різниці немає) | {bil, mal, tekst, zaokr, borh}; mal — різниця до 1 €: за замовчуванням «заокруглення». */
  function riznytsia(b, s, im, groshi) {
    const r = okr(s - b); if (!s || !r) return null;
    const bil = r > 0, a = groshi(Math.abs(r));
    return {bil, mal: Math.abs(r) <= 1,
      tekst: `Віддали на ${a} ${bil ? 'більше' : 'менше'}, ніж винні (${groshi(b)}).`,
      zaokr: 'лишити як заокруглення' + (bil ? ' (гурток доплатив)' : ''),
      borh: `${bil ? im + ' поверне ' + a : 'гурток доплатить ' + a} — борг лишається`};
  }
  /* Речення про результат «Повернули»; zl — що лишилось (okr(v.zalyshok)): >0 гурток ще винен, <0 людина винна гуртку. */
  function pidsumokPovernennia(im, s, zl, groshi) {
    return `Записано: ${im} — повернули ${groshi(s)}. ` + (zl > 0 ? `Гурток ще винен ${groshi(zl)}.` : zl < 0 ? `${im} винен(-на) гуртку ${groshi(-zl)} — коли віддасть, запишіть «повернення боргу».` : '✓ Розраховано.');
  }

  return {okr, brak, zalNa, pereplaty, zalik, pidsumokZaliku, riznytsia, pidsumokPovernennia, PEREPLATA_POYASNENNIA, ZALIK_POYASNENNIA};
})();
