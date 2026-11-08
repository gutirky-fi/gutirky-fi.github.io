/**
 * ПРИЙМАЧ «Книги гуртка» (Етап 2, 08.11.2026).
 * Міст між сайтом і Google Таблицею виховника. Розгортає виховник у своїй Таблиці:
 * Розширення → Apps Script → вставити цей файл → Розгорнути як вебзастосунок (див. INSTRUKTSIIA.md).
 *
 * Що вміє (сайт надсилає POST з JSON, Content-Type: text/plain):
 *   {kod, dija:"perevirka"}                         → {ok:true}
 *   {kod, dija:"imena"}                             → {ok:true, imena:[...]}  (активні й кандидати)
 *   {kod, dija:"zapys", arkush:"Сходини", dani:{...}, khto:"Ярко"} → {ok:true, ryadok:N}
 *   {kod, dija:"zvit", arkush:"Фінанси", vid:"2026-09-01", do:"2027-08-31"} → {ok:true, zaholovky:[...], ryadky:[[...]]}
 *
 * Безпека: код гуртка НЕ записаний тут — лише його відбиток (SHA-256) у «Властивостях скрипта»,
 * виставляється з меню «Книга гуртка → Встановити код». Писати можна лише в аркуші зі списку PYSATY,
 * лише в стовпці без формул. Після 20 хибних кодів за 10 хвилин приймач тимчасово мовчить.
 * Це захист «для гуртка», не банківський.
 */

var H = 3;   // рядок заголовків
var P = 4;   // перший рядок даних
var PYSATY = ['План праці', 'Сходини', 'Відвідуваність', 'Проби', 'Вмілості', 'Відзначки',
              'Замовлення', 'Протоколи', 'Завдання', 'Фінанси', 'Майно', 'Мандрівки'];
var CHYTATY = PYSATY.concat(['Учасники', 'Запас', 'Посади', 'Роки', 'Історія учасників']);
var OCHYSTYTY = ['План праці', 'Сходини', 'Відвідуваність', 'Протоколи', 'Мандрівки'];  // «Новий рік» чистить цілком
// Фінанси — залишок переноситься; Завдання — лишаються незроблені. Решта аркушів не чиститься ніколи.
var PRYKHOVATY = ['Прізвище'];   // стовпці, яких сайт не отримує ніколи
var VID = 'Відвідуваність', SLOT0 = 6, SLOTY = 16;     // стовпці F..U — імена

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
  if (zli >= 20) return vidpovid({ok: false, pomylka: 'Забагато спроб. Спробуйте за 10 хвилин.'});
  if (!kodVirnyi(z.kod)) {
    cache.put('zli', String(zli + 1), 600);
    Utilities.sleep(800);
    return vidpovid({ok: false, pomylka: 'Невірний код гуртка.'});
  }
  try {
    if (z.dija === 'perevirka') return vidpovid({ok: true});
    if (z.dija === 'imena') return vidpovid({ok: true, imena: imena()});
    if (z.dija === 'zapys') return vidpovid(zapys(z.arkush, z.dani, z.khto));
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

function kodVirnyi(kod) {
  var v = PropertiesService.getScriptProperties().getProperty('KOD');
  if (!v || !kod || String(kod).length > 100) return false;
  return vidbytok(kod) === v;
}

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
    var r;
    if (arkush === VID) {
      r = ryadokZaDatoyu(sh, dani['Дата']);
      zag = imenaVZaholovok(sh, zag, dani['присутність'] || {});
    }
    if (!r) r = vilnyiRyadok(sh);
    var formuly = sh.getRange(r, 1, 1, nc).getFormulas()[0];
    var ryad = sh.getRange(r, 1, 1, nc).getValues()[0];
    var zapysano = 0;
    for (var c = 0; c < nc; c++) {
      var h = zag[c];
      if (!h || formuly[c]) continue;
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
    return {ok: true, arkush: arkush, ryadok: r};
  } finally {
    lock.releaseLock();
  }
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

function ryadokZaDatoyu(sh, d) {   // одні сходини = один рядок: та сама дата → оновлюємо
  var t = data(d); if (!t) return null;
  var n = sh.getMaxRows() - P + 1;
  var v = sh.getRange(P, 1, n, 1).getValues();
  for (var i = 0; i < n; i++) {
    if (v[i][0] instanceof Date && v[i][0].getTime() === t.getTime()) return P + i;
  }
  return null;
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
    .addItem('Встановити код гуртка', 'vstanovytyKod')
    .addItem('Налаштувати (захист формул)', 'nalashtuvaty')
    .addItem('Перевірити приймач', 'perevirytyPryimach')
    .addSeparator()
    .addItem('Новий рік (копія в архів і чиста книга)', 'novyiRik')
    .addToUi();
}

function vstanovytyKod() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt('Код гуртка', 'Новий код (щонайменше 6 знаків; його знатимуть діловоди). Старий код перестане діяти.', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var k = r.getResponseText().trim();
  if (k.length < 6) { ui.alert('Закороткий код — потрібно щонайменше 6 знаків.'); return; }
  PropertiesService.getScriptProperties().setProperty('KOD', vidbytok(k));
  ui.alert('Код збережено. У таблиці його не видно — лише в налаштуваннях приймача.');
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
  var maKod = !!PropertiesService.getScriptProperties().getProperty('KOD');
  var brak = PYSATY.concat(['Учасники']).filter(function (a) { return !SpreadsheetApp.getActive().getSheetByName(a); });
  ui.alert('Код гуртка: ' + (maKod ? 'встановлено' : 'НЕ встановлено') +
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
