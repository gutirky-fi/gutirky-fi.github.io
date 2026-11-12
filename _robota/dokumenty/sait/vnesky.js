/* Внески: СПІЛЬНА логіка Каси (forma.html) і «Вхід виховника → Після сходин» (vykhovnyk.html). 12.11.2026.
   Лише чисті функції — без сторінки й без мережі. Дані (VN) — відповідь приймача на {dija:'vnesky'}:
   {vnesky:[{n, suma, termin, osobl:{ім'я: сума}}], splacheno:{ім'я:{внесок: сума}}}.
   Правило проєкту: змінюєте логіку внеску — міняйте ТУТ, а не в одній зі сторінок (тоді Каса й «Після сходин» не розійдуться). */
window.Vn = (function () {
  'use strict';
  const okr = x => Math.round(x * 100) / 100;
  const maye = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
  const treba = (x, im) => maye(x.osobl, im) ? x.osobl[im] : x.suma;   // скільки ця людина має заплатити за внесок x (особлива сума — виняток)

  /* Стан людини за внеском: скільки треба, скільки вже записано, скільки бракує.
     dodatkovo — платежі, які вже вписані на сторінці, але ще не надіслані; minus — платіж, який зараз виправляємо (щоб не рахувати двічі). */
  function stan(VN, im, n, dodatkovo, minus) {
    const x = VN && im && n ? VN.vnesky.find(y => y.n === n) : null; if (!x) return null;
    const t = treba(x, im), bulo = okr(((VN.splacheno[im] || {})[n] || 0) + (dodatkovo || 0) - (minus || 0));
    return {x, im, v: n, treba: t, bulo, brak: okr(t - bulo), osobl: t !== x.suma};
  }

  /* Підказка під платежем: {t: текст, k: '' | 'ok' | 'warn'}. tut — сума цього платежу; groshi — як писати суму («20,00 €» чи «20 €»).
     korotko — коротко (під іменем людини, на вузькому екрані): без повторення імені й внеску, «сплачено» — лише якщо вже щось є. */
  function pidkazka(st, tut, groshi, korotko) {
    const pislia = okr(st.brak - tut), os = st.osobl ? ' (особлива сума)' : '';
    let t = korotko ? (st.bulo > 0 || st.osobl ? `Сплачено ${groshi(st.bulo)} з ${groshi(st.treba)}${os}. ` : '')
                    : `«${st.v}»: ${st.im} — сплачено ${groshi(st.bulo)} з ${groshi(st.treba)}${os}. `, k = '';
    if (st.brak <= 0) { k = 'warn'; t += '✓ Уже сплачено повністю. Це точно ще один внесок?'; }
    else if (!tut) t += 'Бракує ' + groshi(st.brak) + '.';
    else if (pislia === 0) { k = 'ok'; t += 'Після цього платежу — ✓ сплачено повністю.'; }
    else if (pislia > 0) t += 'Після цього платежу бракуватиме ' + groshi(pislia) + '.';
    else { k = 'warn'; t += 'Це на ' + groshi(-pislia) + ' більше, ніж бракує (' + groshi(st.brak) + ').'; }
    return {t, k};
  }

  /* Який внесок ставити за замовчуванням для сходин цього дня (data — «РРРР-ММ-ДД»):
     той, строк якого найближчий до сходин, але не пізніший за них (поточний). Усі строки пізніші за сходини — найближчий майбутній.
     Строків у книзі немає — останній у списку. */
  function typovyi(VN, data) {
    const vs = VN && VN.vnesky || []; if (!vs.length) return '';
    const z = vs.filter(x => x.termin).sort((a, b) => a.termin < b.termin ? -1 : a.termin > b.termin ? 1 : 0);
    if (data && z.length) { const do_ = z.filter(x => x.termin <= data); return (do_.length ? do_[do_.length - 1] : z[0]).n; }
    return vs[vs.length - 1].n;
  }

  /* Хто ще не сплатив внесок n (з урахуванням платежів, вписаних на сторінці: platezhi = {ім'я: сума}):
     [{im, brak}] у порядку списку імен. */
  function neSplatyly(VN, imena, n, platezhi) {
    const out = [];
    imena.forEach(im => {
      const st = stan(VN, im, n, (platezhi || {})[im] || 0);
      if (st && st.brak > 0) out.push({im, brak: st.brak});
    });
    return out;
  }

  return {okr, treba, stan, pidkazka, typovyi, neSplatyly};
})();
