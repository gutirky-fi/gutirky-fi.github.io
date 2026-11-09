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
 *   {kod, dija:"vnesky"}                            → внески з аркуша «Внески» і хто скільки сплатив за кожен: {vnesky:[{n,suma,termin,osobl}], splacheno:{ім'я:{внесок:€}}, perevireno:{…лише рядки «Перевірено виховником» = так}}
 *   {kod, dija:"vytiah", imya:"Остап"}               → витяг однієї людини: внески (треба/сплачено/перевірено/бракує), її рядки каси, підсумок «винен гуртку / гурток винен»
 *   {kod, dija:"den", arkush:"Фінанси", dani:{Дата}} → усі рядки за цю дату: {ryadok, dani, khto, koly, zatverdzheno, versiya}
 *   vypravyty / skasuvaty з {arkush, ryadok, versiya} замість квитка — будь-який незатверджений рядок аркушів DEN;
 *   «versiya» — відбиток рядка: якщо хтось змінив його тим часом, зміна не пройде («оновіть список»).
 *   {kod, dija:"hroshi"}                            → де зараз гроші за книгою: {rakhunok, gotivka, nevkazano, razom, chekaiut, chekaiutSuma}
 *   {kod, dija:"kasa"}                              → (виховник) усі неперевірені рядки каси + гроші + останні звірки — для «Перевірки каси»
 *   {kod, dija:"zatverdyty", arkush, ryadok, znach:"так"|"ні"|""} → (виховник) «ні» — не знайшов у банку / немає грошей чи чека
 *   {kod, dija:"zvirka", shcho:"готівка"|"рахунок", ye:"20,50", prymitka} → (виховник) рядок у «Звірки»; «мало бути» рахує приймач сам
 *   {kod, dija:"nakhunok", suma, prymitka}          → (виховник) готівку здали на рахунок: два рядки «переміщення» в «Фінанси»
 *   {kod, dija:"povernuty", imya, suma, yak, zaokr, khto} → гурток повернув «свої гроші» (видаток «повернення»); zaokr — різницю лишити як «заокруглення»
 *   {kod, dija:"zalik", imya, vnesok, kudy:"vnesok"|"borh", suma?, khto} → залік без грошей: борг гуртка → у внесок, або переплата внеску → у борг
 *   {kod, dija:"vidmina", imya, vnesok, suma?, khto} → людина передумала: скасувати залік (гроші знову винен гурток, внесок знову треба платити)
 *   {kod, dija:"spysaty", imya, prychyna, pidstava, suma, prymitka} → (виховник) списати борг людини (рядок «списано»; причина обов'язкова, >10 € — підстава)
 *   {kod, dija:"foto", ryadok, foto:"<base64 JPEG>"}  → фото чека до рядка каси: файл у папку «Чеки гуртка» Диска виховника, посилання — у «Фото чека»
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
var SPYSKY = ['Майно'];
var DEN = ['Фінанси'];    // «den»: що вже записано за день — і виправити будь-який незатверджений рядок (каса)   // «spysok»: перший стовпець цих аркушів (назви речей) — підказка в полі; прізвищ там немає
var LYSHE_V = ['novi', 'zatverdyty', 'zvit', 'kasa', 'zvirka', 'nakhunok', 'spysaty'];   // лише з кодом виховника
var ZLI_MAX = 5, ZLI_CHAS = 3600;
var ZVIRKY = 'Звірки', PEREM = 'переміщення', FOTO = 'Фото чека', FOTO_MAX = 3 * 1024 * 1024;
var NA_RAKHUNKU = ['MobilePay', 'переказ', 'картка'];   // «Як платили» → гроші на рахунку; «готівка» → у коробці
// «свої гроші»: купив для гуртка за власні — з каси ще нічого не пішло, гурток винен цій людині
var SVOI = 'свої гроші', IM = "Хто (ім'я)", POVERN = 'повернення', POVB = 'повернення боргу', ZAOKR = 'заокруглення';
var ZA_UCH = 'за учасника (поверне)';   // гурток купив/заплатив за когось, а той поверне (сорочка, табір наперед) — позичка, не видаток
var NE_V_PIDSUMKU = [PEREM, POVERN, POVB, ZA_UCH];   // не дохід і не видаток: гроші лише переходять (видаток «свої гроші» вже порахований)
var SPYSANO = 'списано';
var SYSTEMNI = [PEREM, POVERN, ZAOKR, SPYSANO];   // ці категорії пише сам приймач, не форма
// ЗАЛІК — борг і внесок без грошей: рядок категорії «внески» з «Як платили: свої гроші».
//   надходження — борг гуртка людині йде в її внесок (людина доплачує менше);
//   видаток — переплата внеску йде в борг (гурток винен людині, або людина менше винна гуртку).
// У залишку каси не рахується (гроші не рухались); у підсумках року — як надходження внесків (видаток — мінусом).

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
    if (z.dija === 'zatverdyty') return vidpovid(zatverdyty(z.arkush, z.ryadok, z.hasOwnProperty('znach') ? z.znach : (z.tak !== false ? 'так' : '')));
    if (z.dija === 'hroshi') return vidpovid(hroshi());
    if (z.dija === 'kasa') return vidpovid(kasa());
    if (z.dija === 'zvirka') return vidpovid(zvirka(z.shcho, z.ye, z.prymitka));
    if (z.dija === 'nakhunok') return vidpovid(nakhunok(z.suma, z.prymitka));
    if (z.dija === 'povernuty') return vidpovid(povernuty(z.imya, z.suma, z.yak, z.zaokr, z.khto, rol));
    if (z.dija === 'vidmina') return vidpovid(vidmina(z.imya, z.vnesok, z.suma, z.khto, rol));
    if (z.dija === 'zalik') return vidpovid(zalik(z.imya, z.vnesok, z.kudy, z.suma, z.khto, rol));
    if (z.dija === 'spysaty') return vidpovid(spysaty(z.imya, z.prychyna, z.pidstava, z.suma, z.prymitka));
    if (z.dija === 'foto') return vidpovid(foto(z.ryadok, z.foto, z.khto));
    if (z.dija === 'zapys') return vidpovid(zapys(z.arkush, z.dani, z.khto));
    if (z.dija === 'vnesky') return vidpovid(vnesky());
    if (z.dija === 'vytiah') return vidpovid(vytiah(z.imya));
    if (z.dija === 'den') return vidpovid(den(z.arkush, z.dani));
    if (z.dija === 'vypravyty') return vidpovid(vypravyty(z.kvytok, z.dani, z.khto, z));
    if (z.dija === 'skasuvaty') return vidpovid(skasuvaty(z.kvytok, z.khto, z));
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
// гроші — без двозначностей: сума — додатне число (до центів), рух — лише надходження/видаток, дата — є
function perevirkaKasy(arkush, dani) {
  if (arkush !== 'Фінанси') return '';
  var s = String(dani['Сума, €'] === undefined ? '' : dani['Сума, €']).trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s) || Number(s) <= 0) return 'Сума — додатне число, до центів (напр. 10 або 12,50).';
  if (['надходження', 'видаток'].indexOf(String(dani['Рух'] || '')) < 0) return 'Рух — «надходження» або «видаток».';
  if (!data(dani['Дата'])) return 'Потрібна дата.';
  if (dani['Категорія'] === PEREM) return 'Переміщення (готівку здали на рахунок) записує виховник: «Вхід виховника → Перевірка каси».';
  if (SYSTEMNI.indexOf(dani['Категорія']) >= 0) return 'Повернення «своїх грошей» записує кнопка «Повернули» («Де зараз гроші»). Помилку в такому рядку — скасуйте його й поверніть ще раз.';
  var im = String(dani[IM] || '').trim();
  if (dani['Як платили'] === SVOI && dani['Категорія'] === 'внески') return 'Залік боргу й внеску робить кнопка «Зарахувати» (у «Де зараз гроші» або під рядком внеску). Помилку — скасуйте рядок і зробіть залік ще раз.';
  if (dani['Як платили'] === SVOI) {
    if (dani['Рух'] !== 'видаток') return '«Свої гроші» — лише для видатку (хтось купив для гуртка за власні).';
    if (!im) return 'Хто заплатив своїми — виберіть ім\'я: гурток буде винен саме йому.';
  }
  if (dani['Категорія'] === ZA_UCH) {
    if (dani['Рух'] !== 'видаток') return '«' + ZA_UCH + '» — це видаток (гурток заплатив за когось).';
    if (!im) return 'Кому купили (хто поверне) — виберіть ім\'я.';
    if (dani['Як платили'] === SVOI) return 'За учасника гурток платить зі своєї каси, не «свої гроші». Якщо платив хтось інший за свої — два рядки: його «свої гроші» і окремо борг учасника.';
  }
  if (dani['Категорія'] === POVB) {
    if (dani['Рух'] !== 'надходження') return '«Повернення боргу» — це надходження (людина віддає гуртку).';
    if (!im) return 'Хто повертає борг — виберіть ім\'я.';
    if (dani['Як платили'] === SVOI) return 'Повернення боргу — готівкою чи на рахунок, не «свої гроші».';
  }
  var vn = vnesky().vnesky.map(function (x) { return x.n; }), v = String(dani['Внесок'] || '').trim();
  if (v && vn.indexOf(v) < 0) return 'Внеску «' + v + '» немає в аркуші «Внески» — виберіть зі списку.';
  if (!v && vn.length && dani['Категорія'] === 'внески' && String(dani["Хто (ім'я)"] || '').trim()) return 'Виберіть, за який внесок цей платіж.';
  return '';
}

// ---------- внески: скільки треба і хто скільки сплатив ----------
var VNESKY = 'Внески';
function osoblyvi(t) {            // «Остап 10; Дана 0» → {Остап:10, Дана:0}
  var o = {};
  String(t || '').split(/[;\n]/).forEach(function (x) {
    var m = /^\s*(.+?)\s*[:—–-]?\s*(\d+(?:[.,]\d{1,2})?)\s*€?\s*$/.exec(x); if (m) o[m[1]] = Number(m[2].replace(',', '.'));
  });
  return o;
}
function vnesky() {
  var ss = SpreadsheetApp.getActive(), vs = ss.getSheetByName(VNESKY);
  if (!vs) return {ok: true, vnesky: [], splacheno: {}};
  var z = zaholovky(vs), out = [];
  ryadky(vs).forEach(function (r) {
    var n = String(r[z.indexOf('Внесок')]).trim(); if (!n) return;
    out.push({n: n, suma: Number(r[z.indexOf('Сума, €')]) || 0, termin: iso(r[z.indexOf('Термін')]) || '', osobl: osoblyvi(r[z.indexOf('Особливі суми')])});
  });
  var fs = ss.getSheetByName('Фінанси'), fz = zaholovky(fs), sp = {}, ne = {};
  var ci = fz.indexOf("Хто (ім'я)"), cv = fz.indexOf('Внесок'), cs = fz.indexOf('Сума, €'), cr = fz.indexOf('Рух'), cp = fz.indexOf(PER), pv = {};
  var dodaty = function (o, im, v, x) { o[im] = o[im] || {}; o[im][v] = Math.round(((o[im][v] || 0) + x) * 100) / 100; };
  if (cv >= 0) ryadky(fs).forEach(function (r) {
    var im = String(r[ci]).trim(), v = String(r[cv]).trim(); if (!im || !v) return;
    var x = Number(r[cs]) || 0; if (r[cr] === 'видаток') x = -x; else if (r[cr] !== 'надходження') return;
    var pz = cp >= 0 ? String(r[cp]).trim().toLowerCase() : '';
    if (pz === 'ні') { dodaty(ne, im, v, x); return; }   // ✗ виховник не знайшов цих грошей — не рахуємо сплаченим
    dodaty(sp, im, v, x);
    if (pz === 'так') dodaty(pv, im, v, x);   // ✓ — лише перевірене виховником
  });
  var imenaVn = out.map(function (x) { return x.n; }), syroty = {};   // платежі за внесок, якого вже немає в «Внесках» (перейменували / видалили)
  Object.keys(sp).forEach(function (im) { Object.keys(sp[im]).forEach(function (n) { if (imenaVn.indexOf(n) < 0 && sp[im][n]) { syroty[n] = syroty[n] || {}; syroty[n][im] = sp[im][n]; } }); });
  return {ok: true, vnesky: out, splacheno: sp, perevireno: pv, syroty: syroty, ne: ne};
}

// ---------- де зараз гроші (за книгою): готівкою, на рахунку ----------
function sposib(yak) { yak = String(yak || '').trim(); return yak === 'готівка' ? 'gotivka' : yak === SVOI ? 'svoi' : NA_RAKHUNKU.indexOf(yak) >= 0 ? 'rakhunok' : 'nevkazano'; }

// хто скільки: {ім'я: €} — додатне: гурток винен людині; від'ємне: людина винна гуртку.
// «свої гроші» видаток +, надходження − (заокруглення / борг з минулого року); «повернення» −; «повернення боргу» +.
// bezCheka — рядки «свої гроші» без фото чека (і не перевірені): поки вони є, не повертаємо.
function borhy() {
  var fs = SpreadsheetApp.getActive().getSheetByName('Фінанси'), z = zaholovky(fs), b = {}, bez = {};
  var ci = z.indexOf(IM), cs = z.indexOf('Сума, €'), cr = z.indexOf('Рух'), cy = z.indexOf('Як платили'), ck = z.indexOf('Категорія'), cf = z.indexOf(FOTO), cp = z.indexOf(PER), co = z.indexOf('Опис');
  if (ci < 0) return {b: {}, bez: {}};
  ryadky(fs).forEach(function (r, j) {
    var im = String(r[ci]).trim(); if (!im) return;
    var x = Number(r[cs]) || 0, ruh = r[cr], kat = r[ck], d = 0;
    if (r[cy] === SVOI) d = ruh === 'видаток' ? x : ruh === 'надходження' ? -x : 0;
    else if (kat === POVERN && ruh === 'видаток') d = -x;
    else if (kat === POVB && ruh === 'надходження') d = x;
    else if (kat === ZA_UCH && ruh === 'видаток') d = -x;          // людина винна гуртку
    if (!d) return;
    b[im] = Math.round(((b[im] || 0) + d) * 100) / 100;
    var p = cp >= 0 ? String(r[cp]).trim().toLowerCase() : '';
    if (r[cy] === SVOI && ruh === 'видаток' && kat !== PEREM && kat !== ZAOKR && kat !== 'внески' && kat !== SPYSANO && (p === 'ні' || (p !== 'так' && !(cf >= 0 && String(r[cf]).trim()))))
      (bez[im] = bez[im] || []).push({data: iso(r[0]), opys: String(r[co] || ''), suma: x, ne: p === 'ні'});
  });
  Object.keys(b).forEach(function (im) { if (!b[im]) delete b[im]; });
  return {b: b, bez: bez};
}
function hroshi() {
  var fs = SpreadsheetApp.getActive().getSheetByName('Фінанси'), z = zaholovky(fs);
  var cs = z.indexOf('Сума, €'), cr = z.indexOf('Рух'), cy = z.indexOf('Як платили'), cp = z.indexOf(PER), ck = z.indexOf('Квитанція №');
  var o = {gotivka: 0, rakhunok: 0, nevkazano: 0}, ch = 0, chS = 0, ni = 0, cheky = [], maxCh = 0;
  ryadky(fs).forEach(function (r) {
    var m = ck >= 0 && /^\s*Ч-?\s*(\d+)\s*$/i.exec(String(r[ck]));   // номери чеків: Ч-1, Ч-2… — щоб не повторювались
    if (m) { cheky.push('Ч-' + Number(m[1])); maxCh = Math.max(maxCh, Number(m[1])); }
    var x = Number(r[cs]) || 0; if (r[cr] === 'видаток') x = -x; else if (r[cr] !== 'надходження') return;
    var sp = sposib(r[cy]); if (sp !== 'svoi') o[sp] += x;   // «свої гроші» — не в касі
    var p = cp >= 0 ? String(r[cp]).trim().toLowerCase() : '';
    if (p !== 'так') { ch++; chS += Math.abs(x); if (p === 'ні') ni++; }
  });
  var k = function (x) { return Math.round(x * 100) / 100; }, bo = borhy(), vynen = 0, vynni = 0;
  Object.keys(bo.b).forEach(function (im) { if (bo.b[im] > 0) vynen += bo.b[im]; else vynni -= bo.b[im]; });
  return {ok: true, gotivka: k(o.gotivka), rakhunok: k(o.rakhunok), nevkazano: k(o.nevkazano), razom: k(o.gotivka + o.rakhunok + o.nevkazano),
          chekaiut: ch, chekaiutSuma: k(chS), ne: ni, cheky: cheky, nastupnyiChek: 'Ч-' + (maxCh + 1),
          minus: o.gotivka < -0.001 || o.rakhunok < -0.001, borhy: bo.b, bezCheka: bo.bez, vynen: k(vynen), vynni: k(vynni), vilni: k(o.gotivka + o.rakhunok + o.nevkazano - vynen)};
}

// ---------- витяг людини: усе, що в касі стосується ОДНІЄЇ людини ----------
// Лише рядки «Фінансів» із цим ім'ям і підсумки (прізвищ у касі немає). Нічого не пише.
// Доступ — і код гуртка (скарбник), і код виховника: це ті самі числа, що вже видно в касі
// («Хто сплатив внески», «Гурток винен»). Щоб бачив лише виховник — додайте 'vytiah' у LYSHE_V.
// hrupa рядка: vnesok · zalik · svoi · povernennia · povb · pozychka · zaokr · spysano · perenos · inshe
// vplyv — як рядок змінює борг: + гурток винен людині, − людина винна гуртку (разом = borhy()).
function vytiah(imya) {
  var im = chyste(imya || '').trim(); if (!im) return {ok: false, pomylka: 'Виберіть ім\'я.'};
  var okr = function (x) { return Math.round(x * 100) / 100; };
  var v = vnesky(), vn = [], brak = 0, pereplata = 0, PV = v.perevireno || {}, aktyvn = imena().indexOf(im) >= 0;
  v.vnesky.forEach(function (x) {
    var treba = x.osobl.hasOwnProperty(im) ? x.osobl[im] : x.suma, sp = (v.splacheno[im] || {})[x.n] || 0, pv = (PV[im] || {})[x.n] || 0, nz = (v.ne[im] || {})[x.n] || 0;
    if (!aktyvn) { if (!sp && !nz) return; treba = sp; }   // вибув(-ла) чи ще не в «Учасниках»: внески не рахуються, лише те, що вже заплатив(-ла)
    var b = okr(treba - sp);
    if (b > 0) brak += b; else if (b < 0) pereplata -= b;
    vn.push({n: x.n, termin: x.termin, treba: treba, splacheno: okr(sp), perevireno: okr(pv), nezn: okr(nz), brak: b});
  });
  var syroty = [];
  Object.keys(v.syroty || {}).forEach(function (n) { var s = (v.syroty[n] || {})[im] || 0; if (s) { syroty.push({n: n, suma: okr(s)}); brak -= s; } });
  if (brak < 0) { pereplata -= brak; brak = 0; }
  var fs = SpreadsheetApp.getActive().getSheetByName('Фінанси'), z = zaholovky(fs), c = function (h) { return z.indexOf(h); };
  var ci = c(IM), cs = c('Сума, €'), cr = c('Рух'), cy = c('Як платили'), ck = c('Категорія'), co = c('Опис'), cv = c('Внесок'), cf = c(FOTO), cp = c(PER), cq = c('Квитанція №'), ckh = c('Хто записав');
  var rows = [];
  if (ci >= 0) ryadky(fs).forEach(function (r) {
    if (String(r[ci]).trim() !== im) return;
    var x = Number(r[cs]) || 0, ruh = r[cr], kat = String(r[ck] || ''), yak = String(r[cy] || ''), d = 0, g;
    if (yak === SVOI) d = ruh === 'видаток' ? x : ruh === 'надходження' ? -x : 0;
    else if (kat === POVERN && ruh === 'видаток') d = -x;
    else if (kat === POVB && ruh === 'надходження') d = x;
    else if (kat === ZA_UCH && ruh === 'видаток') d = -x;
    if (kat === 'внески') g = yak === SVOI ? (String(r[co] || '').indexOf(VIDM) === 0 ? 'vidmina' : 'zalik') : 'vnesok';
    else if (kat === SPYSANO) g = 'spysano';
    else if (kat === POVERN) g = 'povernennia';
    else if (kat === POVB) g = 'povb';
    else if (kat === ZA_UCH) g = 'pozychka';
    else if (kat === ZAOKR) g = 'zaokr';
    else if (kat === PEREM && yak === SVOI) g = 'perenos';
    else if (yak === SVOI) g = 'svoi';
    else g = 'inshe';
    rows.push({data: iso(r[0]), ruh: String(ruh || ''), kat: kat, opys: String(r[co] || ''), suma: x, yak: yak, vnesok: cv >= 0 ? String(r[cv] || '') : '',
               kvyt: cq >= 0 ? String(r[cq] || '') : '', foto: cf >= 0 && !!String(r[cf]).trim(), perevireno: cp >= 0 ? String(r[cp]).trim().toLowerCase() : '', khto: ckh >= 0 ? chyste(r[ckh] || '') : '', hrupa: g, vplyv: okr(d)});
  });
  var bh = borhy(), borh = okr(bh.b[im] || 0);
  var vynen = okr(brak + (borh < 0 ? -borh : 0)), hv = okr((borh > 0 ? borh : 0) + pereplata);
  return {ok: true, imya: im, aktyvn: aktyvn, vnesky: vn, syroty: syroty, ryadky: rows.slice(-200),
          pidsumok: {brakVnesky: okr(brak), pereplata: okr(pereplata), borh: borh, vynenHurtku: vynen, hurtokVynen: hv, razom: okr(vynen - hv), bezCheka: bh.bez[im] || []}};
}

function zapys(arkush, dani, khto) {
  if (PYSATY.indexOf(arkush) < 0) return {ok: false, pomylka: 'У цей аркуш сайт не пише.'};
  if (!dani || typeof dani !== 'object') return {ok: false, pomylka: 'Порожній запис.'};
  var pk = perevirkaKasy(arkush, dani); if (pk) return {ok: false, pomylka: pk};
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
      else if (h === FOTO) continue;                     // лише через «foto»
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

// відбиток рядка (щоб не затерти чужу зміну, зроблену тим часом)
function versiya(sh, r, nc) {
  var v = sh.getRange(r, 1, 1, nc).getValues()[0].map(function (x) { return x instanceof Date ? 'd' + x.getTime() : String(x === null || x === undefined ? '' : x); });
  return vidbytok(JSON.stringify(v)).slice(0, 20);
}

// усі рядки за дату (каса: хто що вже записав сьогодні)
function den(arkush, dani) {
  if (DEN.indexOf(arkush) < 0) return {ok: false, pomylka: 'Цей аркуш так не видається.'};
  var d = data(dani && dani['Дата']); if (!d) return {ok: false, pomylka: 'Потрібна дата.'};
  var sh = SpreadsheetApp.getActive().getSheetByName(arkush), nc = sh.getLastColumn();
  var zag = sh.getRange(H, 1, 1, nc).getDisplayValues()[0], n = sh.getMaxRows() - P + 1;
  var v = sh.getRange(P, 1, n, 1).getValues(), out = [];
  for (var i = 0; i < n; i++) {
    var x = v[i][0]; if (!(x instanceof Date) || x.getTime() !== d.getTime()) continue;
    var m = vmist(sh, zag, arkush, P + i);
    out.push({ryadok: P + i, dani: m.dani, khto: m.khto, koly: m.koly, zatverdzheno: m.zatverdzheno, ne: m.ne, versiya: versiya(sh, P + i, nc)});
  }
  return {ok: true, ryadky: out};
}

// виправити/скасувати рядок за номером (лише аркуші DEN, лише незатверджений, лише якщо не змінився тим часом)
function zaRyadkom(o) {
  var arkush = o && o.arkush, r = Number(o && o.ryadok);
  if (DEN.indexOf(arkush) < 0) return {pomylka: 'Цей запис уже не можна змінити з сайту. Попросіть виховника.'};
  var sh = SpreadsheetApp.getActive().getSheetByName(arkush), nc = sh.getLastColumn();
  if (!(r >= P && r <= sh.getMaxRows() && r % 1 === 0)) return {pomylka: 'Невідомий рядок.'};
  var zag = sh.getRange(H, 1, 1, nc).getDisplayValues()[0], kl = sh.getRange(r, 1).getValues()[0][0];
  if (kl === '' || kl === null) return {pomylka: 'Цього запису вже немає (його скасували). Оновіть список.'};
  if (perevireno(sh, zag, r)) return {pomylka: 'Цей запис уже перевірив виховник — змінити його може лише він.'};
  if (String(o.versiya || '') !== versiya(sh, r, nc)) return {pomylka: 'Цей рядок щойно змінив хтось інший. Оновіть список і подивіться ще раз.', zastarilo: true};
  return {sh: sh, zag: zag, r: r, info: {a: arkush, r: r, t: Date.now()}, kv: null};
}

function vypravyty(kv, dani, khto, o) {
  if (!dani || typeof dani !== 'object' || Object.keys(dani).length > 40) return {ok: false, pomylka: 'Порожній запис.'};
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    var z = kv ? zaKvytkom(kv) : zaRyadkom(o); if (z.pomylka) return {ok: false, pomylka: z.pomylka, zastarilo: !!z.zastarilo};
    if (z.info.a === VID) return {ok: false, pomylka: 'Відвідуваність виправляють так: надішліть ці сходини ще раз — запис оновиться.'};
    var pk = perevirkaKasy(z.info.a, dani); if (pk) return {ok: false, pomylka: pk};
    var sh = z.sh, nc = z.zag.length, f = sh.getRange(z.r, 1, 1, nc).getFormulas()[0];
    var ryad = sh.getRange(z.r, 1, 1, nc).getValues()[0];
    if (!dani.hasOwnProperty(z.zag[0]) || chyste(dani[z.zag[0]]) === '') return {ok: false, pomylka: 'Перше поле («' + z.zag[0] + '») не може бути порожнім.'};
    var inshyi = ryadokZaKliuchem(sh, z.zag, z.info.a, dani);
    if (inshyi && inshyi !== z.r) return {ok: false, pomylka: 'Такий запис уже є (' + z.info.a + ') — відкрийте його й виправте там.'};
    for (var c = 0; c < nc; c++) {
      var h = z.zag[c];
      if (!h || f[c] || h === PER) continue;
      if (h === FOTO) continue;     // фото — лише дією «foto»; виправлення його не стирає й не підмінює
      ryad[c] = h === 'Записано' ? new Date() : h === 'Хто записав' ? chyste(khto || '') : dani.hasOwnProperty(h) ? perevesty(dani[h]) : '';
      sh.getRange(z.r, c + 1).setValue(ryad[c]);
    }
    var cpe = z.zag.indexOf(PER);
    if (cpe >= 0 && String(sh.getRange(z.r, cpe + 1).getValues()[0][0]).trim().toLowerCase() === 'ні') sh.getRange(z.r, cpe + 1).setValue('');   // виправили — знову чекає перевірки
    if (kv) PropertiesService.getScriptProperties().setProperty('q:' + kv, JSON.stringify({a: z.info.a, r: z.r, k: kliuchTekst(ryad[0]), t: z.info.t}));
    zminy('виправлення', z.info.a, z.r, khto, opys(z.info.a, z.zag, ryad));
    return {ok: true, arkush: z.info.a, ryadok: z.r, versiya: versiya(sh, z.r, nc)};
  } finally { lock.releaseLock(); }
}

function skasuvaty(kv, khto, o) {
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    var z = kv ? zaKvytkom(kv) : zaRyadkom(o); if (z.pomylka) return {ok: false, pomylka: z.pomylka, zastarilo: !!z.zastarilo};
    var sh = z.sh, nc = z.zag.length, f = sh.getRange(z.r, 1, 1, nc).getFormulas()[0];
    var bulo = opys(z.info.a, z.zag, sh.getRange(z.r, 1, 1, nc).getValues()[0]);
    for (var c = 0; c < nc; c++) if (!f[c]) sh.getRange(z.r, c + 1).setValue('');
    if (kv) PropertiesService.getScriptProperties().deleteProperty('q:' + kv);
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
  var cp = zag.indexOf(PER), pz = cp >= 0 ? String(v[cp]).trim().toLowerCase() : '';
  var out = {pola: [], dani: {}, prys: {}, khto: '', koly: '', zatverdzheno: pz === 'так', ne: pz === 'ні'};
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

function zatverdyty(arkush, ryadok, znach) {
  if (znach === true) znach = 'так'; if (znach === false || znach === null || znach === undefined) znach = '';
  if (['так', 'ні', ''].indexOf(znach) < 0) return {ok: false, pomylka: 'Позначка — «так», «ні» або порожньо.'};
  if (PYSATY.indexOf(arkush) < 0) return {ok: false, pomylka: 'Невідомий аркуш.'};
  var r = Number(ryadok);
  var sh = SpreadsheetApp.getActive().getSheetByName(arkush);
  if (!(r >= P && r <= sh.getMaxRows() && r % 1 === 0)) return {ok: false, pomylka: 'Невідомий рядок.'};
  var zag = sh.getRange(H, 1, 1, sh.getLastColumn()).getDisplayValues()[0], c = zag.indexOf(PER);
  if (c < 0) return {ok: false, pomylka: 'В аркуші немає стовпця «' + PER + '».'};
  var kl = sh.getRange(r, 1, 1, 1).getValues()[0][0];
  if (kl === '' || kl === null) return {ok: false, pomylka: 'Цей рядок порожній (запис скасовано).'};
  sh.getRange(r, c + 1).setValue(znach);
  zminy(znach === 'так' ? 'затвердження' : znach === 'ні' ? 'немає' : 'зняття затвердження', arkush, r, 'виховник', opys(arkush, zag, sh.getRange(r, 1, 1, zag.length).getValues()[0]));
  return {ok: true, ryadok: r, zatverdzheno: znach === 'так', ne: znach === 'ні', znach: znach};
}

// ---------- «Перевірка каси» (виховник) ----------
// усі рядки каси, які ще не «так» (і «ні» теж), — щоб звірити з банком, коробкою й чеками
function kasa() {
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName('Фінанси'), nc = sh.getLastColumn();
  var zag = zaholovky(sh), n = sh.getMaxRows() - P + 1, v = sh.getRange(P, 1, n, 1).getValues(), out = [];
  for (var i = 0; i < n; i++) {
    if (v[i][0] === '' || v[i][0] === null) continue;
    var m = vmist(sh, zag, 'Фінанси', P + i); if (m.zatverdzheno) continue;
    out.push({ryadok: P + i, dani: m.dani, khto: m.khto, koly: m.koly, ne: m.ne, sposib: sposib(m.dani['Як платили']), versiya: versiya(sh, P + i, nc)});
  }
  out.sort(function (a, b) { return String(a.dani['Дата']).localeCompare(String(b.dani['Дата'])) || a.ryadok - b.ryadok; });
  var zv = ss.getSheetByName(ZVIRKY), ost = [];
  if (zv) {
    var zz = zaholovky(zv);
    ryadky(zv).slice(-6).reverse().forEach(function (r) { var o = {}; zz.forEach(function (h, k) { if (h) o[h] = r[k] instanceof Date ? dd(r[k]) : r[k]; }); ost.push(o); });
  }
  return {ok: true, ryadky: out, hroshi: hroshi(), zvirky: ost, syroty: vnesky().syroty};
}

function chysloGroshei(x) {
  var s = String(x === undefined || x === null ? '' : x).trim().replace(/\s|€/g, '').replace(',', '.');
  return /^-?\d+(\.\d{1,2})?$/.test(s) ? Number(s) : null;
}

// звірка: «мало бути» — з книги (не з сайту), «є насправді» — що порахував виховник
function zvirka(shcho, ye, prymitka) {
  if (['готівка', 'рахунок'].indexOf(shcho) < 0) return {ok: false, pomylka: 'Що звіряли — «готівка» або «рахунок».'};
  var y = chysloGroshei(ye); if (y === null || y < 0) return {ok: false, pomylka: 'Скільки є насправді — число, до центів (напр. 20 або 12,50).'};
  var ss = SpreadsheetApp.getActive(), zv = ss.getSheetByName(ZVIRKY); if (!zv) return {ok: false, pomylka: 'У книзі немає аркуша «' + ZVIRKY + '» — візьміть свіжу книгу.'};
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    var g = hroshi(), malo = shcho === 'готівка' ? g.gotivka : g.rakhunok, rizn = Math.round((y - malo) * 100) / 100;
    var r = vilnyiRyadok(zv);
    zapysatyRyadok(zv, r, {'Дата': new Date(), 'Що звіряли': shcho, 'Мало бути, €': malo, 'Є насправді, €': y, 'Хто звіряв': 'виховник', 'Примітка': chyste(prymitka || ''), 'Записано': new Date()});
    zminy('звірка', ZVIRKY, r, 'виховник', shcho + ': мало бути ' + malo + ' €, є ' + y + ' €' + (rizn ? ', різниця ' + rizn + ' €' : ' — збігається'));
    return {ok: true, ryadok: r, malo: malo, ye: y, riznytsia: rizn, chekaiut: g.chekaiut};
  } finally { lock.releaseLock(); }
}

// готівку здали на рахунок: видаток готівкою + надходження на рахунок (разом у касі не змінюється)
function nakhunok(suma, prymitka) {
  var s = chysloGroshei(suma); if (s === null || s <= 0) return {ok: false, pomylka: 'Сума — додатне число, до центів.'};
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    var g = hroshi(); if (s > g.gotivka + 0.001) return {ok: false, pomylka: 'За книгою готівкою лише ' + g.gotivka + ' € — більше на рахунок не здати. Спершу перевірте касу.'};
    var sh = SpreadsheetApp.getActive().getSheetByName('Фінанси'), d = new Date(), out = [];
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    [['видаток', 'готівка', 'готівку здано на рахунок'], ['надходження', 'переказ', 'готівку внесено на рахунок']].forEach(function (x) {
      var r = vilnyiRyadok(sh), o = {'Дата': d, 'Рух': x[0], 'Категорія': PEREM, 'Опис': x[2], 'Сума, €': s, 'Як платили': x[1], 'Примітка': chyste(prymitka || ''), 'Хто записав': 'виховник', 'Записано': new Date()};
      o[PER] = 'так';
      zapysatyRyadok(sh, r, o); out.push(r);
      zminy('запис', 'Фінанси', r, 'виховник', dd(d) + ' · ' + x[0] + ' · ' + PEREM + ' · ' + s + ' € (' + x[1] + ')');
    });
    return {ok: true, ryadky: out, hroshi: hroshi()};
  } finally { lock.releaseLock(); }
}

// гурток повертає «свої гроші»: один рядок видатку «повернення» (з коробки чи з рахунку).
// Повернули не стільки, скільки винні: zaokr — різницю лишаємо як «заокруглення» (рядок «свої гроші»), борг = 0;
// інакше різниця лишається боргом (гурток доплатить або людина поверне — «повернення боргу»).
var SPOSOBY_POVERN = ['готівка', 'переказ', 'MobilePay'];
function povernuty(imya, suma, yak, zaokr, khto, rol) {
  var im = chyste(imya || '').trim(), s = chysloGroshei(suma);
  if (!im) return {ok: false, pomylka: 'Кому повернули — ім\'я.'};
  if (s === null || s <= 0) return {ok: false, pomylka: 'Скільки віддали — додатне число, до центів (напр. 15 або 14,50).'};
  if (SPOSOBY_POVERN.indexOf(yak) < 0) return {ok: false, pomylka: 'Як повернули — готівка, переказ або MobilePay.'};
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    var g = hroshi(), b = g.borhy[im] || 0;
    if (!(b > 0)) return {ok: false, pomylka: 'За книгою гурток нічого не винен: ' + im + '. Оновіть сторінку.'};
    var bez = g.bezCheka[im] || [];
    if (bez.length) return {ok: false, bezCheka: bez, pomylka: 'Без чека не повертаємо: спершу фото чека (' + bez.map(function (x) { return dd(data(x.data) || x.data) + ' «' + x.opys + '» ' + String(x.suma).replace('.', ',') + ' €'; }).join('; ') + ').'};
    if (yak === 'готівка' && s > g.gotivka + 0.001) return {ok: false, pomylka: 'За книгою готівкою лише ' + String(g.gotivka).replace('.', ',') + ' € — стільки з коробки не віддати. Перевірте касу або поверніть переказом.'};
    var sh = SpreadsheetApp.getActive().getSheetByName('Фінанси'), d = new Date(), out = [];
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var rizn = Math.round((s - b) * 100) / 100, kh = chyste(khto || '') || (rol === 'v' ? 'виховник' : '');
    var ryad = function (o, shcho) {
      var r = vilnyiRyadok(sh); o['Дата'] = d; o[IM] = im; o['Хто записав'] = kh; o['Записано'] = new Date();
      if (rol === 'v') o[PER] = 'так';      // виховник сам віддав — уже перевірено
      zapysatyRyadok(sh, r, o); out.push(r);
      zminy('запис', 'Фінанси', r, kh, dd(d) + ' · ' + shcho);
    };
    ryad({'Рух': 'видаток', 'Категорія': POVERN, 'Опис': 'повернення: ' + im + ' (купував(-ла) за свої)', 'Сума, €': s, 'Як платили': yak},
         'повернення · ' + im + ' · ' + s + ' € (' + yak + ')');
    if (rizn && zaokr) {
      ryad({'Рух': rizn > 0 ? 'видаток' : 'надходження', 'Категорія': ZAOKR, 'Опис': 'заокруглення: віддали ' + String(s).replace('.', ',') + ' € замість ' + String(b).replace('.', ',') + ' €', 'Сума, €': Math.abs(rizn), 'Як платили': SVOI},
           'заокруглення · ' + im + ' · ' + Math.abs(rizn) + ' €');
    }
    var g2 = hroshi();
    return {ok: true, ryadky: out, bulo: b, zalyshok: g2.borhy[im] || 0, hroshi: g2};
  } finally { lock.releaseLock(); }
}

// ---------- залік: борг ↔ внесок (без грошей) ----------
function stanVnesku(im, n) {
  var v = vnesky(), x = null;
  v.vnesky.forEach(function (y) { if (y.n === n) x = y; });
  if (!x) return null;
  var treba = x.osobl.hasOwnProperty(im) ? x.osobl[im] : x.suma, bulo = (v.splacheno[im] || {})[n] || 0;
  return {treba: treba, bulo: bulo, brak: Math.round((treba - bulo) * 100) / 100};
}
function zalik(imya, vnesok, kudy, suma, khto, rol) {
  var im = chyste(imya || '').trim(), n = String(vnesok || '').trim();
  if (!im || !n) return {ok: false, pomylka: 'Потрібні ім\'я і внесок.'};
  if (['vnesok', 'borh'].indexOf(kudy) < 0) return {ok: false, pomylka: 'Незрозуміло, куди зараховувати.'};
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    var st = stanVnesku(im, n); if (!st) return {ok: false, pomylka: 'Внеску «' + n + '» немає в аркуші «Внески».'};
    var b = borhy().b[im] || 0, maks, okr = function (x) { return Math.round(x * 100) / 100; };
    if (kudy === 'vnesok') {
      if (!(b > 0)) return {ok: false, pomylka: 'Гурток нічого не винен: ' + im + ' — зараховувати нічого.'};
      if ((borhy().bez[im] || []).length) return {ok: false, pomylka: 'Без чека не зараховуємо (як і не повертаємо): спершу фото чека — ' + im + '.'};
      if (!(st.brak > 0)) return {ok: false, pomylka: '«' + n + '»: ' + im + ' уже сплатив(-ла) повністю.'};
      maks = Math.min(b, st.brak);
    } else {
      maks = okr(-st.brak);
      if (!(maks > 0)) return {ok: false, pomylka: '«' + n + '»: переплати немає.'};
    }
    var s = suma === undefined || suma === null || suma === '' ? maks : chysloGroshei(suma);
    if (s === null || s <= 0) return {ok: false, pomylka: 'Сума — додатне число, до центів.'};
    if (s > maks + 0.001) return {ok: false, pomylka: 'Можна зарахувати щонайбільше ' + String(okr(maks)).replace('.', ',') + ' €.'};
    s = okr(s);
    var sh = SpreadsheetApp.getActive().getSheetByName('Фінанси'), d = new Date(), r = vilnyiRyadok(sh), kh = chyste(khto || '') || (rol === 'v' ? 'виховник' : '');
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var o = {'Дата': d, 'Рух': kudy === 'vnesok' ? 'надходження' : 'видаток', 'Категорія': 'внески', 'Внесок': n, 'Як платили': SVOI, 'Сума, €': s, 'Хто записав': kh, 'Записано': new Date(),
             'Опис': kudy === 'vnesok' ? 'залік: борг гуртка → у внесок' : 'залік: переплата внеску → ' + (b < 0 ? 'у борг перед гуртком' : 'гурток винен')};
    o[IM] = im;
    zapysatyRyadok(sh, r, o);
    zminy('залік', 'Фінанси', r, kh, dd(d) + ' · ' + im + ' · «' + n + '» ' + (kudy === 'vnesok' ? '+' : '−') + s + ' € (без грошей)');
    var st2 = stanVnesku(im, n);
    return {ok: true, ryadok: r, suma: s, borh: borhy().b[im] || 0, brak: st2.brak};
  } finally { lock.releaseLock(); }
}
// ВІДМІНА ЗАЛІКУ: людина спершу попросила «у внесок», а потім передумала — хоче гроші назад.
// Рядок «видаток · внески · свої гроші» з описом «відміна заліку…»: внесок знову не сплачено, гурток знову винен.
// Скасувати можна не більше, ніж зараховано (мінус те, що вже скасовано).
var VIDM = 'відміна заліку';
function zarakhovano(im, n) {    // скільки з боргу гуртка зараховано у цей внесок (за вирахуванням відмін)
  var fs = SpreadsheetApp.getActive().getSheetByName('Фінанси'), z = zaholovky(fs), x = 0;
  var ci = z.indexOf(IM), cv = z.indexOf('Внесок'), cs = z.indexOf('Сума, €'), cr = z.indexOf('Рух'), cy = z.indexOf('Як платили'), ck = z.indexOf('Категорія'), co = z.indexOf('Опис');
  ryadky(fs).forEach(function (r) {
    if (String(r[ci]).trim() !== im || String(r[cv]).trim() !== n || r[cy] !== SVOI || r[ck] !== 'внески') return;
    if (r[cr] === 'надходження') x += Number(r[cs]) || 0;
    else if (r[cr] === 'видаток' && String(r[co]).indexOf(VIDM) === 0) x -= Number(r[cs]) || 0;
  });
  return Math.round(x * 100) / 100;
}
function vidmina(imya, vnesok, suma, khto, rol) {
  var im = chyste(imya || '').trim(), n = String(vnesok || '').trim();
  if (!im || !n) return {ok: false, pomylka: 'Потрібні ім\'я і внесок.'};
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    var maks = zarakhovano(im, n);
    if (!(maks > 0)) return {ok: false, pomylka: im + ': у «' + n + '» нічого не зараховано — скасовувати нічого.'};
    var s = suma === undefined || suma === null || suma === '' ? maks : chysloGroshei(suma);
    if (s === null || s <= 0) return {ok: false, pomylka: 'Сума — додатне число, до центів.'};
    if (s > maks + 0.001) return {ok: false, pomylka: 'Скасувати можна щонайбільше ' + String(maks).replace('.', ',') + ' €.'};
    s = Math.round(s * 100) / 100;
    var sh = SpreadsheetApp.getActive().getSheetByName('Фінанси'), d = new Date(), r = vilnyiRyadok(sh), kh = chyste(khto || '') || (rol === 'v' ? 'виховник' : '');
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var o = {'Дата': d, 'Рух': 'видаток', 'Категорія': 'внески', 'Внесок': n, 'Як платили': SVOI, 'Сума, €': s, 'Хто записав': kh, 'Записано': new Date(),
             'Опис': VIDM + ': передумав(-ла) — гурток поверне гроші'};
    o[IM] = im;
    zapysatyRyadok(sh, r, o);
    zminy('відміна заліку', 'Фінанси', r, kh, dd(d) + ' · ' + im + ' · «' + n + '» −' + s + ' € (передумав(-ла), без грошей)');
    return {ok: true, ryadok: r, suma: s, borh: borhy().b[im] || 0, brak: stanVnesku(im, n).brak};
  } finally { lock.releaseLock(); }
}

// виховник списує борг (людина не бере грошей, дрібниця, вибула): рядок «списано», «свої гроші», борг → 0.
// Обов'язково: причина; більше SPYS_MEZHA € — ще й підстава (протокол гурткової ради / хто погодив);
// suma — скільки бачив виховник: якщо борг тим часом змінився, не списуємо.
var SPYS_MEZHA = 10, SPYS_PRYCHYNY = ['подарунок гуртку', 'дрібниця', 'вибув(-ла)', 'рішення гурткової ради', 'інше'];
function spysaty(imya, prychyna, pidstava, suma, prymitka) {
  var im = chyste(imya || '').trim(); if (!im) return {ok: false, pomylka: 'Чий борг — ім\'я.'};
  prychyna = String(prychyna || ''); pidstava = chyste(pidstava || '').trim(); prymitka = chyste(prymitka || '').trim();
  if (SPYS_PRYCHYNY.indexOf(prychyna) < 0) return {ok: false, pomylka: 'Виберіть причину списання.'};
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    var b = borhy().b[im] || 0; if (!b) return {ok: false, pomylka: 'У ' + im + ' боргів немає.'};
    var s = chysloGroshei(suma); if (s === null || Math.abs(s - Math.abs(b)) > 0.001) return {ok: false, pomylka: 'Борг ' + im + ' тим часом змінився (тепер ' + String(Math.abs(b)).replace('.', ',') + ' €). Оновіть і подивіться ще раз.'};
    if (prychyna === 'подарунок гуртку' && b < 0) return {ok: false, pomylka: '«Подарунок гуртку» — коли гурток винен людині, а вона не бере грошей.'};
    if (prychyna === 'дрібниця' && Math.abs(b) > 1) return {ok: false, pomylka: '«Дрібниця» — до 1 €. Тут більше — виберіть іншу причину.'};
    if (prychyna === 'інше' && !prymitka) return {ok: false, pomylka: 'Причина «інше» — напишіть пояснення.'};
    if (Math.abs(b) > SPYS_MEZHA && !pidstava) return {ok: false, pomylka: 'Більше ' + SPYS_MEZHA + ' € — потрібна підстава: № протоколу гурткової ради або хто погодив.'};
    var sh = SpreadsheetApp.getActive().getSheetByName('Фінанси'), d = new Date(), r = vilnyiRyadok(sh);
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var pr = 'причина: ' + prychyna + (pidstava ? '; підстава: ' + pidstava : '') + (prymitka ? '; ' + prymitka : '');
    var o = {'Дата': d, 'Рух': b > 0 ? 'надходження' : 'видаток', 'Категорія': SPYSANO, 'Як платили': SVOI, 'Сума, €': Math.abs(b), 'Хто записав': 'виховник', 'Записано': new Date(),
             'Опис': b > 0 ? 'списано: гурток був винен ' + im : 'списано: ' + im + ' був(-ла) винен(-на) гуртку', 'Примітка': pr};
    o[IM] = im; o[PER] = 'так';
    zapysatyRyadok(sh, r, o);
    zminy('списано', 'Фінанси', r, 'виховник', dd(d) + ' · ' + im + ' · ' + Math.abs(b) + ' € · ' + pr);
    return {ok: true, ryadok: r, bulo: b, hroshi: hroshi()};
  } finally { lock.releaseLock(); }
}

// ---------- фото чека ----------
// Будь-хто з кодом може додати фото до рядка каси; замінити — лише поки рядок не перевірено.
// Файл лягає в папку «Чеки гуртка» на Диску виховника (доступ — лише йому); у книгу — посилання.
function papkaChekiv() {
  var pr = PropertiesService.getScriptProperties(), id = pr.getProperty('FOTO_PAPKA');
  if (id) { try { var f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (x) {} }
  var nova = DriveApp.createFolder('Чеки гуртка');
  pr.setProperty('FOTO_PAPKA', nova.getId());
  return nova;
}
function foto(ryadok, b64, khto) {
  var sh = SpreadsheetApp.getActive().getSheetByName('Фінанси'), nc = sh.getLastColumn(), zag = zaholovky(sh), cf = zag.indexOf(FOTO);
  if (cf < 0) return {ok: false, pomylka: 'У книзі немає стовпця «' + FOTO + '» — візьміть свіжу книгу.'};
  var r = Number(ryadok);
  if (!(r >= P && r <= sh.getMaxRows() && r % 1 === 0)) return {ok: false, pomylka: 'Невідомий рядок.'};
  b64 = String(b64 || '').replace(/^data:image\/jpeg;base64,/, '');
  if (!b64 || b64.length > FOTO_MAX * 4 / 3 + 4 || !/^[A-Za-z0-9+\/=]+$/.test(b64)) return {ok: false, pomylka: 'Фото не вдалося прочитати (або воно завелике).'};
  var bytes = Utilities.base64Decode(b64);
  if (!(bytes.length > 100 && (bytes[0] & 255) === 0xFF && (bytes[1] & 255) === 0xD8)) return {ok: false, pomylka: 'Це не схоже на фото (потрібен JPEG).'};
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    var v = sh.getRange(r, 1, 1, nc).getValues()[0];
    if (v[0] === '' || v[0] === null) return {ok: false, pomylka: 'Цього запису вже немає (його скасували). Оновіть список.'};
    var bulo = String(v[cf] || '');
    if (bulo && perevireno(sh, zag, r)) return {ok: false, pomylka: 'Рядок уже перевірив виховник, фото в нього є — замінити може лише виховник у книзі.'};
    var kv = String(v[zag.indexOf('Квитанція №')] || '').trim() || 'без номера';
    var nazva = kv + ' · ' + dd(v[0]) + ' · ' + String(v[zag.indexOf('Сума, €')]).replace('.', ',') + ' € · рядок ' + r + '.jpg';
    var fl = papkaChekiv().createFile(Utilities.newBlob(bytes, 'image/jpeg', nazva));
    if (bulo) { var m = /[-\w]{25,}/.exec(bulo); if (m) try { DriveApp.getFileById(m[0]).setTrashed(true); } catch (x) {} }   // старе фото — у кошик Диска
    sh.getRange(r, cf + 1).setValue(fl.getUrl());
    zminy('фото чека', 'Фінанси', r, khto, (bulo ? 'замінено: ' : '') + nazva);
    return {ok: true, ryadok: r, url: fl.getUrl(), versiya: versiya(sh, r, nc)};
  } finally { lock.releaseLock(); }
}

// записує {заголовок: значення} у рядок r (лише стовпці без формул)
function zapysatyRyadok(sh, r, obj) {
  var nc = sh.getLastColumn(), z = zaholovky(sh), f = sh.getRange(r, 1, 1, nc).getFormulas()[0];
  for (var c = 0; c < nc; c++) if (z[c] && !f[c] && obj.hasOwnProperty(z[c])) sh.getRange(r, c + 1).setValue(obj[z[c]]);
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
  var rikK = klitynkaRoku(ss);
  var rik = String(rikK ? rikK.getDisplayValue() : '').trim() || String(new Date().getFullYear());
  var r = ui.alert('Новий рік (' + rik + ' закінчується)',
    'Що станеться:\n' +
    '1) повна копія книги піде в архів;\n' +
    '2) підсумок року допишеться в «Роки» і «Історію учасників» (ці аркуші не очищаються ніколи);\n' +
    '3) очистяться план праці, сходини, відвідуваність, протоколи, мандрівки; у касі лишиться залишок (окремо готівкою й на рахунку) і борги «свої гроші» (по людях); у внесках — один рядок «Борг з …» (хто недоплатив); із завдань — лише незроблені.\n' +
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
  var borgy = borhyRoku();                              // хто недоплатив — до очищення каси
  var pere = pereplatyRoku();                           // хто переплатив — гурток винен (не пропадає)
  OCHYSTYTY.forEach(function (n) { zalyshyty(ss.getSheetByName(n), function () { return false; }); });
  var vs = ss.getSheetByName(VNESKY);
  if (vs) {
    zalyshyty(vs, function () { return false; });
    if (borgy) zapysatyObj(vs, P, {'Внесок': 'Борг з ' + rik, 'Сума, €': 0, 'Особливі суми': borgy, 'Примітка': 'перенесено «Новим роком»: хто недоплатив внески минулого року'});
  }
  var zav = ss.getSheetByName('Завдання');
  var zst = kolonka(zav, 'Статус');
  zalyshyty(zav, function (row) { return row[zst] !== 'зроблено'; });
  var fin = ss.getSheetByName('Фінанси');
  var gr = hroshi();                                    // де гроші й хто кому винен — до очищення каси
  Object.keys(pere).forEach(function (im) { gr.borhy[im] = Math.round(((gr.borhy[im] || 0) + pere[im]) * 100) / 100; if (!gr.borhy[im]) delete gr.borhy[im]; });
  zalyshyty(fin, function () { return false; });
  Object.keys(gr.borhy).sort().reverse().forEach(function (im) {   // борги — по людях (нижче за залишки)
    var b = gr.borhy[im], z = {};
    z['Дата'] = new Date(); z['Рух'] = b > 0 ? 'видаток' : 'надходження'; z['Категорія'] = PEREM; z['Як платили'] = SVOI; z[IM] = im;
    z['Опис'] = 'Борг з ' + rik + (b > 0 ? ': гурток винен' : ': винен(-на) гуртку'); z['Сума, €'] = Math.abs(b); z['Хто записав'] = 'Новий рік'; z[PER] = 'так';
    zapysatyObj(fin, P, z);
  });
  [['nevkazano', '', ' (не вказано, як платили)'], ['rakhunok', 'переказ', ' — на рахунку'], ['gotivka', 'готівка', ' — готівкою']].forEach(function (x) {
    var zal = gr[x[0]]; if (!zal) return;               // зверху буде готівка, далі рахунок
    var z = {}; z['Дата'] = new Date(); z['Рух'] = zal > 0 ? 'надходження' : 'видаток'; z['Категорія'] = PEREM;   // залишок — не дохід нового року
    z['Опис'] = 'Залишок з ' + rik + x[2]; z['Сума, €'] = Math.abs(zal); z['Як платили'] = x[1]; z['Хто записав'] = 'Новий рік'; z[PER] = 'так';
    zapysatyObj(fin, P, z);
  });
  var arkh = ss.getSheetByName('Архів');
  if (arkh) arkh.getRange(vilnyiRyadok(arkh), 1, 1, 4).setValues([[rik, 'Книга гуртка (архів)', 'повна книга року', url]]);
  var m = /^(\d{4})\/(\d{2})$/.exec(rik);
  if (m && rikK) rikK.setValue((+m[1] + 1) + '/' + ('0' + ((+m[2] + 1) % 100)).slice(-2));
  ui.alert('Готово.\nАрхівна копія: ' + nazva + '\nПідсумок — на аркушах «Роки» й «Історія учасників».' + (m ? '\nНавчальний рік у «Налаштуваннях» змінено на наступний.' : ''));
}

// хто скільки недоплатив за всі внески року → «Мирося 10; Ярко 20» (для рядка «Борг з …»)
function borhyRoku() {
  var v = vnesky(), out = [];
  if (!v.vnesky.length) return '';
  imena().forEach(function (im) {
    var b = 0;
    v.vnesky.forEach(function (x) { var treba = x.osobl.hasOwnProperty(im) ? x.osobl[im] : x.suma; b += treba - ((v.splacheno[im] || {})[x.n] || 0); });
    Object.keys(v.syroty || {}).forEach(function (n) { b -= v.syroty[n][im] || 0; });   // платежі за зниклий внесок — теж сплачено
    b = Math.round(b * 100) / 100; if (b > 0) out.push(im + ' ' + String(b).replace('.', ','));
  });
  return out.join('; ');
}

// хто переплатив внески за рік (усі внески разом): {ім'я: €}
function pereplatyRoku() {
  var v = vnesky(), out = {};
  Object.keys(v.splacheno).forEach(function (im) {
    var b = 0;
    v.vnesky.forEach(function (x) { b += ((v.splacheno[im] || {})[x.n] || 0) - (x.osobl.hasOwnProperty(im) ? x.osobl[im] : x.suma); });
    Object.keys(v.syroty || {}).forEach(function (n) { b += v.syroty[n][im] || 0; });   // заплатили за внесок, якого вже немає, — не пропадає
    b = Math.round(b * 100) / 100; if (b > 0) out[im] = b;
  });
  return out;
}

// клітинка «Навчальний рік» у «Налаштуваннях» — шукаємо за назвою (стовпець залежить від кількості списків)
function klitynkaRoku(ss) {
  var sh = ss.getSheetByName('Налаштування'); if (!sh) return null;
  var v = sh.getRange(H, 1, 6, sh.getLastColumn()).getDisplayValues();
  for (var i = 0; i < v.length; i++) for (var c = 0; c < v[i].length - 1; c++) if (String(v[i][c]).trim() === 'Навчальний рік') return sh.getRange(H + i, c + 2);
  return null;
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
    if (NE_V_PIDSUMKU.indexOf(r[i(fn, 'Категорія')]) >= 0) return;   // гроші лише перейшли (на рахунок, повернули борг) — не дохід і не видаток
    if (r[i(fn, 'Рух')] === 'надходження') nadh += s;
    else if (r[i(fn, 'Рух')] === 'видаток') { if (r[i(fn, 'Категорія')] === 'внески') nadh -= s; else vyd += s; }   // внесок назад (залік, повернення) — менше внесків, не видаток
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
