/**
 * ПРИЙМАЧ «Книги гуртка» (Етап 2, 08.11.2026).
 * Міст між сайтом і Google Таблицею виховника. Розгортає виховник у своїй Таблиці:
 * Розширення → Apps Script → вставити цей файл → Розгорнути як вебзастосунок (див. INSTRUKTSIIA.md).
 *
 * Що вміє (сайт надсилає POST з JSON, Content-Type: text/plain):
 *   Два коди: код гуртка (юнаки, ≥4 знаки) — записувати й виправляти своє незатверджене;
 *            код виховника (≥6) — ще «Що нового», затвердження, звіти.
 *   {kod, dija:"perevirka"}                         → {ok:true, rol:"d"|"v"}
 *   {kod, dija:"stan", arkush, dani:{Дата…}}        → чи є вже запис за цим ключем (дата), чи затверджено, що в ньому
 *   {kod, dija:"zatverdyty", arkush, ryadok, tak}   → (виховник) «Перевірено виховником» = так / зняти
 *   {kod, dija:"imena"}                             → {ok:true, imena:[...]}  (активні й кандидати)
 *   {kod, dija:"spysok", arkush:"Майно"}            → {ok:true, spysok:[...]}  (назви вже записаних речей — підказка в полі «Річ»)
 *   {kod, dija:"zapys", arkush:"Сходини", dani:{...}, khto:"Ярко"} → {ok:true, ryadok:N}
 *   {kod, dija:"vypravyty", kvytok, dani:{...}, khto} → той самий рядок переписано (квиток дає «zapys», діє добу)
 *   {kod, dija:"skasuvaty", kvytok, khto}           → рядок очищено, у «Зміни» лишається, що там було
 *   {kod, dija:"novi"}                              → останні 40 рядків «Змін» (що нового з сайту)
 *   {kod, dija:"zvit", arkush:"Фінанси", vid:"2026-09-01", do:"2027-08-31"} → {ok:true, zaholovky:[...], ryadky:[[...]]}
 *
 * Безпека: код гуртка НЕ записаний тут — лише його відбиток (SHA-256) у «Властивостях скрипта»,
 * виставляється з меню «Книга гуртка → Встановити код». Писати можна лише в аркуші зі списку PYSATY,
 * лише в стовпці без формул; рядок із «Перевірено = так» сайт не змінює. Після 5 хибних кодів приймач на годину закриває вхід (і пише це в «Зміни»).
 * Це захист «для гуртка», не банківський.
 */

var H = 3;   // рядок заголовків
var P = 4;   // перший рядок даних
var PYSATY = ['План праці', 'Сходини', 'Відвідуваність', 'Проби', 'Вмілості', 'Відзначки',
              'Замовлення', 'Протоколи', 'Завдання', 'Фінанси', 'Майно', 'Мандрівки'];
var CHYTATY = PYSATY.concat(['Учасники', 'Запас', 'Посади', 'Роки', 'Історія учасників']);
var OCHYSTYTY = ['План праці', 'Сходини', 'Відвідуваність', 'Протоколи', 'Мандрівки', 'Зміни'];  // «Новий рік» чистить цілком
// Фінанси — залишок переноситься; Завдання — лишаються незроблені. Решта аркушів не чиститься ніколи.
var PRYKHOVATY = ['Прізвище'];   // стовпці, яких сайт не отримує ніколи
var VID = 'Відвідуваність', SLOT0 = 6, SLOTY = 16;     // стовпці F..U — імена
var PER = 'Перевірено виховником', ZMINY = 'Зміни', DOBA = 24 * 3600 * 1000;
var SLUZHBOVI = ['Хто записав', 'Записано', PER];
// одна подія = один рядок: за цими стовпцями шукаємо наявний запис (дубля не буде)
var KLIUCH = {'Сходини': ['Дата'], 'Відвідуваність': ['Дата'], 'Протоколи': ['Дата', 'Вид'], 'Майно': ['Річ']};
var SPYSKY = ['Майно'];   // «spysok»: перший стовпець цих аркушів (назви речей) — підказка в полі; прізвищ там немає
var LYSHE_V = ['novi', 'zatverdyty', 'zvit'];   // лише з кодом виховника
var ZLI_MAX = 5, ZLI_CHAS = 3600;

// ---------- вебзастосунок ----------
function doGet() {
  return vidpovid({ok: true, pryimach: 'Книга гуртка', porada: 'Надсилайте POST із сайту.'});
}

function doPost(e) {
  var z;
  try { z = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (x) { return vidpovid({ok: false, pomylka: 'Незрозумілий запит.'}); }
  var cache = CacheService.getScriptCache();
  var zli = Number(cache.get('zli') || 0);
  if (zli >= ZLI_MAX) return vidpovid({ok: false, pomylka: 'Забагато неправильних кодів — вхід закрито на годину.'});
  var rol = rolKodu(z.kod);
  if (!rol) {
    cache.put('zli', String(zli + 1), ZLI_CHAS);
    if (zli + 1 === ZLI_MAX) try { zminy('блокування', '—', '', '', ZLI_MAX + ' неправильних кодів поспіль — вхід закрито на годину. Якщо це не юнаки помилялись — змініть код гуртка.'); } catch (x) {}
    Utilities.sleep(800);
    return vidpovid({ok: false, pomylka: 'Невірний код.'});
  }
  if (LYSHE_V.indexOf(z.dija) >= 0 && rol !== 'v') return vidpovid({ok: false, pomylka: 'Це може лише виховник — потрібен код виховника.'});
  try {
    if (z.dija === 'perevirka') return vidpovid({ok: true, rol: rol});
    if (z.dija === 'imena') return vidpovid({ok: true, rol: rol, imena: imena()});
    if (z.dija === 'spysok') return vidpovid(spysok(z.arkush));
    if (z.dija === 'stan') return vidpovid(stan(z.arkush, z.dani));
    if (z.dija === 'zatverdyty') return vidpovid(zatverdyty(z.arkush, z.ryadok, z.tak !== false));
    if (z.dija === 'zapys') return vidpovid(zapys(z.arkush, z.dani, z.khto));
    if (z.dija === 'vypravyty') return vidpovid(vypravyty(z.kvytok, z.dani, z.khto));
    if (z.dija === 'skasuvaty') return vidpovid(skasuvaty(z.kvytok, z.khto));
    if (z.dija === 'novi') { var nv = novi(); return vidpovid({ok: true, novi: nv.zapysy, chekaiut: nv.chekaiut}); }
    if (z.dija === 'zvit') return vidpovid(zvit(z.arkush, z.vid, z['do']));
    return vidpovid({ok: false, pomylka: 'Невідома дія.'});
  } catch (x) {
    return vidpovid({ok: false, pomylka: 'Помилка в таблиці: ' + x.message});
  }
}

function vidpovid(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- код гуртка ----------
function vidbytok(t) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'knyha-hurtka:' + String(t).trim(), Utilities.Charset.UTF_8);
  return b.map(function (x) { return ('0' + (x & 255).toString(16)).slice(-2); }).join('');
}

function rolKodu(kod) {          // 'v' — виховник, 'd' — діловоди (код гуртка), null — ні
  var pr = PropertiesService.getScriptProperties();
  if (!kod || String(kod).length > 100) return null;
  var h = vidbytok(kod), v = pr.getProperty('KOD_V'), d = pr.getProperty('KOD');
  if (v && h === v) return 'v';
  if (d && h === d) return 'd';
  return null;
}
function kodVirnyi(kod) { return !!rolKodu(kod); }

// ---------- читання ----------
function imena() {
  var sh = SpreadsheetApp.getActive().getSheetByName('Учасники');
  var z = zaholovky(sh), ci = z.indexOf("Ім'я"), cs = z.indexOf('Статус');
  var v = sh.getRange(P, 1, sh.getMaxRows() - P + 1, sh.getLastColumn()).getDisplayValues();
  var out = [];
  v.forEach(function (r) {     // лише ім'я — прізвище сайт не отримує ніколи
    if (r[ci] && (r[cs] === 'активний' || r[cs] === 'кандидат')) out.push(r[ci]);
  });
  return out;
}

function spysok(arkush) {
  if (SPYSKY.indexOf(arkush) < 0) return {ok: false, pomylka: 'Цей список не видається.'};
  var sh = SpreadsheetApp.getActive().getSheetByName(arkush), n = sh.getMaxRows() - P + 1;
  var v = sh.getRange(P, 1, n, 1).getDisplayValues(), out = [];
  v.forEach(function (r) { var x = String(r[0]).trim(); if (x && out.indexOf(x) < 0) out.push(x); });
  return {ok: true, spysok: out};
}

function zvit(arkush, vid, doo) {
  if (CHYTATY.indexOf(arkush) < 0) return {ok: false, pomylka: 'Цей аркуш не видається.'};
  var sh = SpreadsheetApp.getActive().getSheetByName(arkush);
  var nc = sh.getLastColumn(), n = sh.getMaxRows() - P + 1;
  var zag = sh.getRange(H, 1, 1, nc).getDisplayValues()[0];
  var sire = sh.getRange(P, 1, n, 1).getValues();
  var vse = sh.getRange(P, 1, n, nc).getDisplayValues();
  var a = vid ? data(vid) : null, b = doo ? data(doo) : null;
  var ryadky = [];
  for (var i = 0; i < n; i++) {
    if (vse[i][0] === '') continue;
    var d = sire[i][0];
    if ((a || b) && d instanceof Date) {
      if (a && d < a) continue;
      if (b && d > b) continue;
    }
    ryadky.push(vse[i]);
  }
  // прізвища не видаємо: прибираємо стовпці «Прізвище» з будь-якого звіту
  var bez = zag.map(function (h, k) { return PRYKHOVATY.indexOf(h) >= 0 ? -1 : k; }).filter(function (k) { return k >= 0; });
  return {ok: true, arkush: arkush, zaholovky: bez.map(function (k) { return zag[k]; }),
          ryadky: ryadky.map(function (r) { return bez.map(function (k) { return r[k]; }); })};
}

// ---------- запис ----------
function zapys(arkush, dani, khto) {
  if (PYSATY.indexOf(arkush) < 0) return {ok: false, pomylka: 'У цей аркуш сайт не пише.'};
  if (!dani || typeof dani !== 'object') return {ok: false, pomylka: 'Порожній запис.'};
  if (Object.keys(dani).length > 40) return {ok: false, pomylka: 'Забагато полів.'};
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sh = SpreadsheetApp.getActive().getSheetByName(arkush);
    var nc = sh.getLastColumn();
    var zag = sh.getRange(H, 1, 1, nc).getDisplayValues()[0];
    var r = ryadokZaKliuchem(sh, zag, arkush, dani);
    if (r && perevireno(sh, zag, r)) return {ok: false, zatverdzheno: true, pomylka: 'Цей запис уже затвердив виховник — змінити його може лише він.'};
    if (arkush === VID) zag = imenaVZaholovok(sh, zag, dani['присутність'] || {});
    var novyi = !r;
    if (!r) r = vilnyiRyadok(sh);
    var formuly = sh.getRange(r, 1, 1, nc).getFormulas()[0];
    var ryad = sh.getRange(r, 1, 1, nc).getValues()[0];
    var zapysano = 0;
    for (var c = 0; c < nc; c++) {
      var h = zag[c];
      if (!h || formuly[c] || h === PER) continue;     // «Перевірено» ставить лише виховник
      var v;
      if (h === 'Записано') v = new Date();
      else if (h === 'Хто записав') v = chyste(khto || dani[h] || '');
      else if (arkush === VID && c >= SLOT0 - 1 && c < SLOT0 - 1 + SLOTY) {
        var m = (dani['присутність'] || {})[h];
        if (m === undefined) continue;
        v = ['+', '−', 'в', ''].indexOf(m) >= 0 ? m : '';
      }
      else if (dani.hasOwnProperty(h)) v = perevesty(dani[h]);
      else continue;
      ryad[c] = v; zapysano++;
    }
    if (!zapysano) return {ok: false, pomylka: 'Жодне поле не збіглося з заголовками аркуша.'};
    // пишемо лише стовпці без формул, щоб не стерти «авто»
    for (var k = 0; k < nc; k++) {
      if (!formuly[k]) sh.getRange(r, k + 1).setValue(ryad[k]);
    }
    zminy(novyi ? 'запис' : 'оновлення', arkush, r, khto, opys(arkush, zag, ryad));
    return {ok: true, arkush: arkush, ryadok: r, onovleno: !novyi, kvytok: datyKvytok(arkush, r, ryad[0])};
  } finally {
    lock.releaseLock();
  }
}

// ---------- виправити / скасувати свій щойно надісланий запис ----------
// Квиток знає лише той, хто надіслав (повертається в відповіді на «zapys»); діє добу і лише для неперевіреного рядка.
function datyKvytok(arkush, r, kliuch) {
  var pr = PropertiesService.getScriptProperties(), zaraz = Date.now();
  var vsi = pr.getProperties ? pr.getProperties() : {};
  Object.keys(vsi).forEach(function (k) {               // старі квитки прибираємо
    if (k.indexOf('q:') === 0) { try { if (zaraz - JSON.parse(vsi[k]).t > DOBA) pr.deleteProperty(k); } catch (x) { pr.deleteProperty(k); } }
  });
  var kv = Utilities.getUuid();
  pr.setProperty('q:' + kv, JSON.stringify({a: arkush, r: r, k: kliuchTekst(kliuch), t: zaraz}));
  return kv;
}

function kliuchTekst(v) { return v instanceof Date ? 'd' + v.getTime() : String(v === null || v === undefined ? '' : v); }

// перевіряє квиток і рядок; повертає {sh, zag, r, info} або {pomylka}
function zaKvytkom(kv) {
  var pr = PropertiesService.getScriptProperties();
  var t = kv && /^[\w-]{8,60}$/.test(String(kv)) ? pr.getProperty('q:' + kv) : null;
  var info = null; try { info = t && JSON.parse(t); } catch (x) {}
  if (!info || Date.now() - info.t > DOBA) return {pomylka: 'Цей запис уже не можна змінити з сайту (минула доба або його скасовано). Попросіть виховника.'};
  var sh = SpreadsheetApp.getActive().getSheetByName(info.a);
  var zag = sh.getRange(H, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
  var kl = sh.getRange(info.r, 1).getValues()[0][0];
  if (kliuchTekst(kl) !== info.k) return {pomylka: 'Цього запису вже немає на тому місці в книзі. Попросіть виховника.'};
  if (perevireno(sh, zag, info.r)) return {pomylka: 'Цей запис уже перевірив виховник — змінити його може лише він.'};
  return {sh: sh, zag: zag, r: info.r, info: info, kv: kv};
}

function vypravyty(kv, dani, khto) {
  if (!dani || typeof dani !== 'object' || Object.keys(dani).length > 40) return {ok: false, pomylka: 'Порожній запис.'};
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    var z = zaKvytkom(kv); if (z.pomylka) return {ok: false, pomylka: z.pomylka};
    if (z.info.a === VID) return {ok: false, pomylka: 'Відвідуваність виправляють так: надішліть ці сходини ще раз — запис оновиться.'};
    var sh = z.sh, nc = z.zag.length, f = sh.getRange(z.r, 1, 1, nc).getFormulas()[0];
    var ryad = sh.getRange(z.r, 1, 1, nc).getValues()[0];
    if (!dani.hasOwnProperty(z.zag[0]) || chyste(dani[z.zag[0]]) === '') return {ok: false, pomylka: 'Перше поле («' + z.zag[0] + '») не може бути порожнім.'};
    var inshyi = ryadokZaKliuchem(sh, z.zag, z.info.a, dani);
    if (inshyi && inshyi !== z.r) return {ok: false, pomylka: 'Такий запис уже є (' + z.info.a + ') — відкрийте його й виправте там.'};
    for (var c = 0; c < nc; c++) {
      var h = z.zag[c];
      if (!h || f[c] || h === PER) continue;
      ryad[c] = h === 'Записано' ? new Date() : h === 'Хто записав' ? chyste(khto || '') : dani.hasOwnProperty(h) ? perevesty(dani[h]) : '';
      sh.getRange(z.r, c + 1).setValue(ryad[c]);
    }
    PropertiesService.getScriptProperties().setProperty('q:' + kv, JSON.stringify({a: z.info.a, r: z.r, k: kliuchTekst(ryad[0]), t: z.info.t}));
    zminy('виправлення', z.info.a, z.r, khto, opys(z.info.a, z.zag, ryad));
    return {ok: true, arkush: z.info.a, ryadok: z.r};
  } finally { lock.releaseLock(); }
}

function skasuvaty(kv, khto) {
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    var z = zaKvytkom(kv); if (z.pomylka) return {ok: false, pomylka: z.pomylka};
    var sh = z.sh, nc = z.zag.length, f = sh.getRange(z.r, 1, 1, nc).getFormulas()[0];
    var bulo = opys(z.info.a, z.zag, sh.getRange(z.r, 1, 1, nc).getValues()[0]);
    for (var c = 0; c < nc; c++) if (!f[c]) sh.getRange(z.r, c + 1).setValue('');
    PropertiesService.getScriptProperties().deleteProperty('q:' + kv);
    zminy('скасування', z.info.a, z.r, khto, 'було: ' + bulo);
    return {ok: true, arkush: z.info.a, ryadok: z.r};
  } finally { lock.releaseLock(); }
}

function perevireno(sh, zag, r) {
  var c = zag.indexOf(PER);
  return c >= 0 && String(sh.getRange(r, c + 1).getValues()[0][0]).trim().toLowerCase() === 'так';
}

// ---------- журнал «Зміни» ----------
function zminy(dija, arkush, r, khto, shcho) {
  var sh = SpreadsheetApp.getActive().getSheetByName(ZMINY); if (!sh) return;
  sh.getRange(vilnyiRyadok(sh), 1, 1, 6).setValues([[new Date(), dija, arkush, r, chyste(khto || ''), chyste(shcho).slice(0, 300)]]);
}

function dd(v) { return v instanceof Date ? ('0' + v.getDate()).slice(-2) + '.' + ('0' + (v.getMonth() + 1)).slice(-2) + '.' + v.getFullYear() : String(v === null || v === undefined ? '' : v); }

function opys(arkush, zag, ryad) {        // коротко, що в рядку (для «Змін»)
  if (arkush === VID) {
    var p = 0, n = 0;
    for (var c = SLOT0 - 1; c < SLOT0 - 1 + SLOTY; c++) { if (ryad[c] === '+') p++; if (ryad[c] !== '' && ryad[c] !== null && ryad[c] !== undefined) n++; }
    return dd(ryad[0]) + ' · присутні ' + p + ' з ' + n;
  }
  var out = [];
  for (var k = 0; k < zag.length && out.length < 4; k++) {
    if (!zag[k] || SLUZHBOVI.indexOf(zag[k]) >= 0) continue;
    var v = ryad[k]; if (v === '' || v === null || v === undefined || (typeof v === 'string' && v.charAt(0) === '=')) continue;
    out.push(dd(v));
  }
  return out.join(' · ');
}

// «Що нового»: останні змінені записи (кожен рядок один раз), найновіші вгорі, з повним вмістом і станом
function novi() {
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(ZMINY); if (!sh) return {zapysy: [], chekaiut: 0};
  var n = sh.getMaxRows() - P + 1; if (n < 1) return {zapysy: [], chekaiut: 0};
  var log = sh.getRange(P, 1, n, 6).getValues().map(function (x, i) { x.i = i; return x; }).filter(function (x) { return x[0] instanceof Date; });
  log.sort(function (a, b) { return (b[0] - a[0]) || (b.i - a.i); });   // той самий час — новіший нижче
  var bachyly = {}, out = [], chekaiut = 0, arkushi = {};
  for (var i = 0; i < log.length && out.length < 30; i++) {
    var x = log[i], a = String(x[2]), r = Number(x[3]) || 0, k = a + '#' + r;
    if (bachyly[k]) continue; bachyly[k] = true;
    var d = x[0], z = {koly: dd(d) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2),
                       dija: String(x[1]), arkush: a, ryadok: r, khto: String(x[4]), shcho: String(x[5])};
    var ark = PYSATY.indexOf(a) >= 0 && r ? (arkushi[a] = arkushi[a] || {sh: ss.getSheetByName(a)}) : null;
    if (ark && ark.sh) {
      if (!ark.zag) ark.zag = ark.sh.getRange(H, 1, 1, ark.sh.getLastColumn()).getDisplayValues()[0];
      var kl = ark.sh.getRange(r, 1, 1, 1).getValues()[0][0];
      if (kl === '' || kl === null) z.porozhnio = true;
      else { var m = vmist(ark.sh, ark.zag, a, r); z.pola = m.pola; z.prys = m.prys; z.zatverdzheno = m.zatverdzheno; if (!m.zatverdzheno) chekaiut++; }
    }
    out.push(z);
  }
  return {zapysy: out, chekaiut: chekaiut};
}

function vilnyiRyadok(sh) {
  var n = sh.getMaxRows() - P + 1;
  var v = sh.getRange(P, 1, n, 1).getValues();
  for (var i = 0; i < n; i++) if (v[i][0] === '' || v[i][0] === null) return P + i;
  // місця нема — додаємо рядок і копіюємо формули з останнього
  var ost = sh.getMaxRows();
  sh.insertRowAfter(ost);
  sh.getRange(ost, 1, 1, sh.getLastColumn()).copyTo(sh.getRange(ost + 1, 1, 1, sh.getLastColumn()));
  var f = sh.getRange(ost + 1, 1, 1, sh.getLastColumn()).getFormulas()[0];
  f.forEach(function (x, k) { if (!x) sh.getRange(ost + 1, k + 1).clearContent(); });
  return ost + 1;
}

// рядок із тим самим ключем (дата; для протоколу — дата й вид; для майна — річ) або null
function ryadokZaKliuchem(sh, zag, arkush, dani) {
  var kl = KLIUCH[arkush]; if (!kl || !dani) return null;
  var tsil = [];
  for (var j = 0; j < kl.length; j++) {
    var c = zag.indexOf(kl[j]); if (c < 0) return null;
    var x = kl[j] === 'Дата' ? data(dani[kl[j]]) : String(dani[kl[j]] === undefined ? '' : dani[kl[j]]).trim().toLowerCase();
    if (!x) return null;
    tsil.push([c, x]);
  }
  var n = sh.getMaxRows() - P + 1;
  var v = sh.getRange(P, 1, n, zag.length).getValues();
  for (var i = 0; i < n; i++) {
    var tak = tsil.every(function (t) {
      var y = v[i][t[0]];
      return t[1] instanceof Date ? (y instanceof Date && y.getTime() === t[1].getTime()) : String(y).trim().toLowerCase() === t[1];
    });
    if (tak) return P + i;
  }
  return null;
}

function iso(v) { return v instanceof Date ? v.getFullYear() + '-' + ('0' + (v.getMonth() + 1)).slice(-2) + '-' + ('0' + v.getDate()).slice(-2) : v; }

// що вже записано в рядку: {pola:[[заголовок, значення]], dani:{…для форми}, prys:{ім'я: позначка}}
function vmist(sh, zag, arkush, r) {
  var v = sh.getRange(r, 1, 1, zag.length).getValues()[0], d = sh.getRange(r, 1, 1, zag.length).getDisplayValues()[0];
  var out = {pola: [], dani: {}, prys: {}, khto: '', koly: '', zatverdzheno: perevireno(sh, zag, r)};
  for (var c = 0; c < zag.length; c++) {
    var h = zag[c]; if (!h || PRYKHOVATY.indexOf(h) >= 0 || h === PER) continue;
    if (h === 'Хто записав') { out.khto = d[c]; continue; }
    if (h === 'Записано') { out.koly = d[c]; continue; }
    if (arkush === VID && c >= SLOT0 - 1 && c < SLOT0 - 1 + SLOTY) { if (v[c] !== '' && v[c] !== null) out.prys[h] = String(v[c]); continue; }
    if (d[c] === '') continue;
    out.pola.push([h, v[c] instanceof Date ? dd(v[c]) : d[c]]);
    out.dani[h] = iso(v[c]);
  }
  return out;
}

function stan(arkush, dani) {
  if (PYSATY.indexOf(arkush) < 0) return {ok: false, pomylka: 'Невідомий аркуш.'};
  var sh = SpreadsheetApp.getActive().getSheetByName(arkush);
  var zag = sh.getRange(H, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
  var r = ryadokZaKliuchem(sh, zag, arkush, dani);
  if (!r) return {ok: true, ye: false};
  var m = vmist(sh, zag, arkush, r);
  return {ok: true, ye: true, ryadok: r, zatverdzheno: m.zatverdzheno, khto: m.khto, koly: m.koly, dani: m.dani, prys: m.prys};
}

function zatverdyty(arkush, ryadok, tak) {
  if (PYSATY.indexOf(arkush) < 0) return {ok: false, pomylka: 'Невідомий аркуш.'};
  var r = Number(ryadok);
  var sh = SpreadsheetApp.getActive().getSheetByName(arkush);
  if (!(r >= P && r <= sh.getMaxRows() && r % 1 === 0)) return {ok: false, pomylka: 'Невідомий рядок.'};
  var zag = sh.getRange(H, 1, 1, sh.getLastColumn()).getDisplayValues()[0], c = zag.indexOf(PER);
  if (c < 0) return {ok: false, pomylka: 'В аркуші немає стовпця «' + PER + '».'};
  var kl = sh.getRange(r, 1, 1, 1).getValues()[0][0];
  if (kl === '' || kl === null) return {ok: false, pomylka: 'Цей рядок порожній (запис скасовано).'};
  sh.getRange(r, c + 1).setValue(tak ? 'так' : '');
  zminy(tak ? 'затвердження' : 'зняття затвердження', arkush, r, 'виховник', opys(arkush, zag, sh.getRange(r, 1, 1, zag.length).getValues()[0]));
  return {ok: true, ryadok: r, zatverdzheno: tak};
}

function imenaVZaholovok(sh, zag, prys) {
  var vidomi = imena();
  Object.keys(prys).forEach(function (im) {
    if (zag.indexOf(im) >= 0 || vidomi.indexOf(im) < 0) return;  // чужих імен не додаємо
    for (var c = SLOT0 - 1; c < SLOT0 - 1 + SLOTY; c++) {
      if (!zag[c]) { sh.getRange(H, c + 1).setValue(im); zag[c] = im; return; }
    }
  });
  return zag;
}

function data(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

function perevesty(v) {
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  var s = chyste(v);
  var d = data(s); if (d) return d;
  if (/^-?\d+([.,]\d+)?$/.test(s)) return Number(s.replace(',', '.'));
  return s;
}

function chyste(v) {               // текст без формул і без зайвої довжини
  var s = String(v === null || v === undefined ? '' : v).trim().slice(0, 500);
  if (/^[=@]/.test(s) || (/^[+\-]/.test(s) && s.length > 1 && isNaN(Number(s)))) s = "'" + s;
  return s;
}

// ---------- меню виховника ----------
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Книга гуртка')
    .addItem('Встановити код гуртка (для юнаків)', 'vstanovytyKod')
    .addItem('Встановити код виховника (лише ваш)', 'vstanovytyKodV')
    .addItem('Налаштувати (захист формул)', 'nalashtuvaty')
    .addItem('Перевірити приймач', 'perevirytyPryimach')
    .addSeparator()
    .addItem('Новий рік (копія в архів і чиста книга)', 'novyiRik')
    .addToUi();
}

function vstanovytyKod() { novyiKod('KOD', 'KOD_V', 4, 'Код гуртка (для юнаків)', 'Новий код гуртка — його знатимуть діловоди. Щонайменше 4 знаки (можна 4 цифри). Старий код перестане діяти.'); }
function vstanovytyKodV() { novyiKod('KOD_V', 'KOD', 6, 'Код виховника', 'Ваш особистий код: «Що нового», затвердження, звіти. Щонайменше 6 знаків; не такий, як код гуртка. Нікому не давайте.'); }

function novyiKod(kliuch, inshyi, min, nazva, poiasn) {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt(nazva, poiasn, ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var k = r.getResponseText().trim(), pr = PropertiesService.getScriptProperties();
  if (k.length < min) { ui.alert('Закороткий код — потрібно щонайменше ' + min + ' знаків.'); return; }
  if (pr.getProperty(inshyi) === vidbytok(k)) { ui.alert('Код гуртка й код виховника мають бути різними.'); return; }
  pr.setProperty(kliuch, vidbytok(k));
  ui.alert(nazva + ' збережено. У таблиці його не видно — лише відбиток у налаштуваннях приймача.');
}

function nalashtuvaty() {
  var ss = SpreadsheetApp.getActive(), n = 0;
  ss.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function (p) {
    if (p.getDescription().indexOf('авто:') === 0) p.remove();
  });
  ss.getSheets().forEach(function (sh) {
    if (sh.getName() === 'Головна') {
      sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).protect().setDescription('авто: Головна').setWarningOnly(true); n++;
      return;
    }
    if (sh.getMaxRows() < P || sh.getLastColumn() < 1) return;
    var f = sh.getRange(P, 1, 1, sh.getLastColumn()).getFormulas()[0];
    f.forEach(function (x, k) {
      if (!x) return;
      sh.getRange(P, k + 1, sh.getMaxRows() - P + 1, 1).protect()
        .setDescription('авто: ' + sh.getName() + ' ' + (k + 1)).setWarningOnly(true);
      n++;
    });
  });
  SpreadsheetApp.getUi().alert('Готово: ' + n + ' «авто»-діапазонів тепер попереджають перед зміною.');
}

function perevirytyPryimach() {
  var ui = SpreadsheetApp.getUi();
  var pr = PropertiesService.getScriptProperties(), maKod = !!pr.getProperty('KOD'), maKodV = !!pr.getProperty('KOD_V');
  var brak = PYSATY.concat(['Учасники']).filter(function (a) { return !SpreadsheetApp.getActive().getSheetByName(a); });
  ui.alert('Код гуртка (юнаки): ' + (maKod ? 'встановлено' : 'НЕ встановлено') + '\nКод виховника: ' + (maKodV ? 'встановлено' : 'НЕ встановлено') +
           '\nАркуші: ' + (brak.length ? 'бракує ' + brak.join(', ') : 'усі на місці') +
           '\nУчасників для форм: ' + imena().length);
}

function novyiRik() {
  var ui = SpreadsheetApp.getUi(), ss = SpreadsheetApp.getActive();
  var rik = String(ss.getSheetByName('Налаштування').getRange(5, 22).getDisplayValue() || '').trim() || String(new Date().getFullYear());
  var r = ui.alert('Новий рік (' + rik + ' закінчується)',
    'Що станеться:\n' +
    '1) повна копія книги піде в архів;\n' +
    '2) підсумок року допишеться в «Роки» і «Історію учасників» (ці аркуші не очищаються ніколи);\n' +
    '3) очистяться план праці, сходини, відвідуваність, протоколи, мандрівки; у касі лишиться один рядок — залишок; із завдань — лише незроблені.\n' +
    'Учасники, посади, проби, вмілості, відзначки, замовлення, запас, майно й документи лишаються.\n\nПродовжити?', ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;
  var pidsumok = pidsumokRoku(ss, rik);               // рахуємо ДО очищення
  var nazva = ss.getName() + ' — архів ' + rik.replace('/', '-');
  var kopia = ss.copy(nazva), url = kopia.getUrl();
  var roky = ss.getSheetByName('Роки');
  var rr = vilnyiRyadok(roky);
  roky.getRange(rr, 1, 1, 13).setValues([pidsumok.rik.concat([url, new Date()])]);
  var ist = ss.getSheetByName('Історія учасників');
  pidsumok.uchasnyky.forEach(function (u) {
    var ri = vilnyiRyadok(ist);
    ist.getRange(ri, 1, 1, 12).setValues([u.concat([new Date()])]);
  });
  OCHYSTYTY.forEach(function (n) { zalyshyty(ss.getSheetByName(n), function () { return false; }); });
  var zav = ss.getSheetByName('Завдання');
  var zst = kolonka(zav, 'Статус');
  zalyshyty(zav, function (row) { return row[zst] !== 'зроблено'; });
  var fin = ss.getSheetByName('Фінанси');
  zalyshyty(fin, function () { return false; });
  var zal = pidsumok.rik[10];
  if (zal !== 0) {
    var z = {}; z['Дата'] = new Date(); z['Рух'] = zal > 0 ? 'надходження' : 'видаток'; z['Категорія'] = 'інше';
    z['Опис'] = 'Залишок з ' + rik; z['Сума, €'] = Math.abs(zal); z['Хто записав'] = 'Новий рік';
    zapysatyObj(fin, P, z);
  }
  var arkh = ss.getSheetByName('Архів');
  if (arkh) arkh.getRange(vilnyiRyadok(arkh), 1, 1, 4).setValues([[rik, 'Книга гуртка (архів)', 'повна книга року', url]]);
  var m = /^(\d{4})\/(\d{2})$/.exec(rik);
  if (m) ss.getSheetByName('Налаштування').getRange(5, 22).setValue((+m[1] + 1) + '/' + ('0' + ((+m[2] + 1) % 100)).slice(-2));
  ui.alert('Готово.\nАрхівна копія: ' + nazva + '\nПідсумок — на аркушах «Роки» й «Історія учасників».' + (m ? '\nНавчальний рік у «Налаштуваннях» змінено на наступний.' : ''));
}

// підсумок року з даних журналів (рахує сам, не покладається на формули)
function pidsumokRoku(ss, rik) {
  var dani = function (n) { var sh = ss.getSheetByName(n); return {sh: sh, z: zaholovky(sh), v: ryadky(sh)}; };
  var vid = dani(VID), skh = dani('Сходини'), pro = dani('Проби'), vm = dani('Вмілості'), vz = dani('Відзначки'),
      md = dani('Мандрівки'), fn = dani('Фінанси'), uch = dani('Учасники');
  var pochatok = null;   // початок року — найраніша дата сходин / відвідуваності
  vid.v.concat(skh.v).forEach(function (r) { if (r[0] instanceof Date && (!pochatok || r[0] < pochatok)) pochatok = r[0]; });
  var uRotsi = function (d) { return d instanceof Date && (!pochatok || d >= pochatok); };
  var i = function (x, h) { return x.z.indexOf(h); };
  var prys = 0, vids = 0, osoba = {};
  vid.v.forEach(function (r) {
    for (var c = SLOT0 - 1; c < SLOT0 - 1 + SLOTY; c++) {
      var im = vid.z[c]; if (!im) continue;
      osoba[im] = osoba[im] || {p: 0, n: 0};
      if (r[c] === '+') { prys++; osoba[im].p++; osoba[im].n++; }
      else if (r[c] === '−' || r[c] === 'в') { vids++; osoba[im].n++; }
    }
  });
  var pr = pro.v.filter(function (r) { return r[i(pro, 'Статус')] === 'виконано' && uRotsi(r[i(pro, 'Дата виконання')]); });
  var vmz = vm.v.filter(function (r) { return r[i(vm, 'Статус')] === 'здобуто' && uRotsi(r[i(vm, 'Дата здобуття')]); });
  var vruch = vm.v.filter(function (r) { return r[i(vm, 'Відзнака')] === 'вручено' && uRotsi(r[i(vm, 'Вручено')]); })
      .map(function (r) { return [r[0], r[i(vm, 'Вмілість')]]; })
      .concat(vz.v.filter(function (r) { return r[i(vz, 'Статус')] === 'вручено' && uRotsi(r[i(vz, 'Дата вручення')]); })
      .map(function (r) { return [r[0], r[i(vz, 'Відзнака')]]; }));
  var nadh = 0, vyd = 0;
  fn.v.forEach(function (r) {
    var s = Number(r[i(fn, 'Сума, €')]) || 0;
    if (r[i(fn, 'Рух')] === 'надходження') nadh += s; else if (r[i(fn, 'Рух')] === 'видаток') vyd += s;
  });
  var kr = function (x) { return Math.round(x * 100) / 100; };
  var cI = i(uch, "Ім'я"), cP = i(uch, 'Прізвище'), cPo = i(uch, 'Посада'), cS = i(uch, 'Статус'), cPr = i(uch, 'Проба зараз');
  var aktyvni = uch.v.filter(function (r) { return r[cI] && r[cS] === 'активний'; });
  var rikRow = [rik, aktyvni.length, vid.v.length, (prys + vids) ? prys / (prys + vids) : '', pr.length, vmz.length,
                vruch.length, md.v.length, kr(nadh), kr(vyd), kr(nadh - vyd)];
  var uchasnyky = uch.v.filter(function (r) { return r[cI] && r[cS] !== 'вибув'; }).map(function (r) {
    var im = r[cI], o = osoba[im] || {p: 0, n: 0};
    return [rik, im, cP >= 0 ? r[cP] : '', r[cPo], r[cS], o.p, o.n ? o.p / o.n : '', r[cPr],
            pr.filter(function (x) { return x[0] === im; }).length,
            vmz.filter(function (x) { return x[0] === im; }).map(function (x) { return x[i(vm, 'Вмілість')]; }).join(', '),
            vruch.filter(function (x) { return x[0] === im; }).map(function (x) { return x[1]; }).join(', ')];
  });
  return {rik: rikRow, uchasnyky: uchasnyky};
}

function zaholovky(sh) { return sh.getRange(H, 1, 1, sh.getLastColumn()).getDisplayValues()[0]; }
function ryadky(sh) {       // лише заповнені рядки (за ключем у першому стовпці)
  return sh.getRange(P, 1, sh.getMaxRows() - P + 1, sh.getLastColumn()).getValues()
    .filter(function (r) { return r[0] !== '' && r[0] !== null; });
}
function kolonka(sh, h) { return zaholovky(sh).indexOf(h); }

// лишає в аркуші тільки рядки, для яких lyshyty(row) = true, і стягує їх догори; формули не чіпає
function zalyshyty(sh, lyshyty) {
  var nc = sh.getLastColumn(), n = sh.getMaxRows() - P + 1;
  var f = sh.getRange(P, 1, 1, nc).getFormulas()[0];
  var vsi = sh.getRange(P, 1, n, nc).getValues();
  var lyshaiemo = vsi.filter(function (r) { return r[0] !== '' && r[0] !== null && lyshyty(r); });
  f.forEach(function (x, k) {
    if (x) return;
    sh.getRange(P, k + 1, n, 1).clearContent();
    if (lyshaiemo.length) sh.getRange(P, k + 1, lyshaiemo.length, 1).setValues(lyshaiemo.map(function (r) { return [r[k]]; }));
  });
}

// вставляє об'єкт {заголовок: значення} у рядок r, лише в стовпці без формул; рядки нижче зсуває вниз
function zapysatyObj(sh, r, obj) {
  var nc = sh.getLastColumn(), z = zaholovky(sh);
  var f = sh.getRange(P, 1, 1, nc).getFormulas()[0];
  var n = sh.getMaxRows() - P + 1;
  var vsi = sh.getRange(P, 1, n, nc).getValues().filter(function (x) { return x[0] !== '' && x[0] !== null; });
  var novyi = z.map(function (h) { return obj.hasOwnProperty(h) ? obj[h] : ''; });
  vsi.unshift(novyi);
  f.forEach(function (x, k) {
    if (x) return;
    sh.getRange(P, k + 1, n, 1).clearContent();
    sh.getRange(P, k + 1, vsi.length, 1).setValues(vsi.map(function (row) { return [row[k]]; }));
  });
}
