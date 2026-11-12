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

  /* ---- 12.11, «Кнопки внесків»: стан людини на всі місяці (старі борги, наперед), розкласти переплату ---- */
  // внески в порядку строків (без строку — як у списку)
  function poriadok(VN) {
    const vs = (VN && VN.vnesky || []).map((x, i) => ({x, i}));
    vs.sort((a, b) => a.x.termin && b.x.termin ? (a.x.termin < b.x.termin ? -1 : a.x.termin > b.x.termin ? 1 : a.i - b.i) : a.i - b.i);
    return vs.map(y => y.x);
  }
  /* Назва внеску для речення: «Листопад 2026» → «листопад» / «до листопада» (рік — лише якщо інший, ніж у ref).
     Не місяць — «за «назва»». rod: 'za' («за жовтень») | 'do' («до грудня») | '' («листопад»). */
  const MIS = {'січень': 'січня', 'лютий': 'лютого', 'березень': 'березня', 'квітень': 'квітня', 'травень': 'травня', 'червень': 'червня', 'липень': 'липня', 'серпень': 'серпня', 'вересень': 'вересня', 'жовтень': 'жовтня', 'листопад': 'листопада', 'грудень': 'грудня'};
  function nazva(n, rod, ref) {
    const m = /^(\S+)\s+(\d{4})$/.exec(String(n || '')), r = /(\d{4})$/.exec(String(ref || ''));
    const mis = m && m[1].toLowerCase();
    if (!m || !MIS[mis]) return (rod === 'za' ? 'за ' : rod === 'do' ? 'по ' : '') + '«' + n + '»';
    const rik = r && r[1] === m[2] ? '' : ' ' + m[2];
    return rod === 'za' ? 'за ' + mis + rik : rod === 'do' ? 'до ' + MIS[mis] + rik : mis + rik;
  }
  /* Усе про людину станом на внесок n. dod — платежі, вписані на сторінці: {внесок: сума}.
     {st — стан за n; borhy — [{v, brak}] за попередні внески; do_ — до якого внеску сплачено наперед (null — ні)}.
     Старий борг рахуємо лише з того місяця, коли людина вже щось платила (новенький не «винен» за місяці до приходу). */
  function vse(VN, im, n, dod) {
    dod = dod || {};
    const st = stan(VN, im, n, dod[n] || 0); if (!st) return null;
    const vs = poriadok(VN), i = vs.findIndex(x => x.n === n), borhy = [];
    let pochav = false;
    vs.slice(0, i).forEach(x => {
      const s = stan(VN, im, x.n, dod[x.n] || 0);
      if (s.bulo > 0) pochav = true;
      if (pochav && s.brak > 0) borhy.push({v: x.n, brak: s.brak});
    });
    let do_ = null;
    if (st.brak <= 0) for (const x of vs.slice(i + 1)) { if (stan(VN, im, x.n, dod[x.n] || 0).brak <= 0) do_ = x.n; else break; }
    return {st, borhy, do_};
  }
  /* Переплату за внесок n розкласти на наступні: [{v, suma}] (перший — n). dod — як у vse, БЕЗ цього платежу.
     Останній може бути неповним; внесків не вистачило — решта лишається на останньому. */
  function rozklasty(VN, im, n, suma, dod, zBorhamy) {   // zBorhamy — спершу закрити старі борги (жовтень), потім n і далі
    dod = dod || {};
    const vs = poriadok(VN), i = vs.findIndex(x => x.n === n), out = [];
    const bv = zBorhamy ? ((vse(VN, im, n, dod) || {borhy: []}).borhy.map(b => vs.find(x => x.n === b.v))) : [];
    let zal = okr(suma);
    bv.concat(vs.slice(Math.max(i, 0))).forEach(x => {
      if (zal <= 0) return;
      const b = stan(VN, im, x.n, dod[x.n] || 0).brak; if (b <= 0 && x.n !== n) return;
      const s = Math.min(zal, Math.max(b, 0)); if (s <= 0) return;
      out.push({v: x.n, suma: okr(s)}); zal = okr(zal - s);
    });
    const pn = out.findIndex(y => y.v === n); if (pn > 0) out.unshift(out.splice(pn, 1)[0]);   // перший — сам цей платіж (за n), борги й наступні — нові рядки
    if (zal > 0) { if (out.length) out[out.length - 1].suma = okr(out[out.length - 1].suma + zal); else out.push({v: n, suma: zal}); }
    return out;
  }

  return {okr, treba, stan, pidkazka, typovyi, neSplatyly, poriadok, nazva, vse, rozklasty};
})();
