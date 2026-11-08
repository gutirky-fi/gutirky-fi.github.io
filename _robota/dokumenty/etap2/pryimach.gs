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
var CHYTATY = PYSATY.concat(['Учасники', 'Запас', 'Посади']);
var ZBERIHATY = ['Учасники', 'Посади', 'Майно', 'Запас', 'Документи', 'Архів', 'Налаштування',
                 'Головна', 'Інструкція', 'Джерела'];   // «Новий рік» їх не чистить
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
  var n = sh.getMaxRows() - P + 1;
  var v = sh.getRange(P, 1, n, 4).getDisplayValues();
  var out = [];
  v.forEach(function (r) {
    if (r[1] && (r[3] === 'активний' || r[3] === 'кандидат')) out.push(r[1]);
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
  return {ok: true, arkush: arkush, zaholovky: zag, ryadky: ryadky};
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
  var r = ui.alert('Новий рік', 'Буде зроблено копію всієї книги (архів), а в цій книзі очищено записи журналів. ' +
    'Учасники, посади, майно, запас, документи й налаштування лишаються. Продовжити?', ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;
  var nazva = ss.getName() + ' — архів ' + Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  var kopia = ss.copy(nazva);
  ss.getSheets().forEach(function (sh) {
    if (ZBERIHATY.indexOf(sh.getName()) >= 0 || sh.getMaxRows() < P) return;
    var nc = sh.getLastColumn(), n = sh.getMaxRows() - P + 1;
    var f = sh.getRange(P, 1, 1, nc).getFormulas()[0];
    f.forEach(function (x, k) { if (!x) sh.getRange(P, k + 1, n, 1).clearContent(); });
  });
  var a = ss.getSheetByName('Архів');
  if (a) {
    var rr = vilnyiRyadok(a);
    a.getRange(rr, 1, 1, 4).setValues([[new Date().getFullYear(), 'Книга гуртка (архів)', 'копія перед новим роком', kopia.getUrl()]]);
  }
  ui.alert('Готово. Архівна копія: ' + nazva + '\nЇї посилання записано на аркуші «Архів».');
}
