/**
 * ОПИТУВАЛЬНИК «ЗНАЙОМСТВО З ГУРТКОМ» — окремий, не пов'язаний із сайтом і книгою гуртка.
 * Один файл: сторінка для юнаків (у стилі Пласту) + запис відповідей у Google Таблицю в окремій папці.
 * Відповіді юнаків зберігаються ЛИШЕ в Google виховника.
 *
 * ЯК ПОСТАВИТИ (комп'ютер, профіль Chrome «Пласт»):
 *  1) script.google.com → «Новий проєкт» → стерти все → вставити цей файл → Зберегти.
 *  2) Угорі вибрати nalashtuvaty → «Виконати» → дозволити доступ
 *     («Додатково» → перейти — це ваш власний скрипт). Внизу з'явиться посилання на папку й Таблицю.
 *  3) «Ввести в дію» → «Нове введення» → коліщатко → «Вебзастосунок»;
 *     «Виконувати як» — Я; «Хто має доступ» — Усі → «Ввести в дію» → скопіювати URL (закінчується на /exec).
 *     Це і є посилання для юнаків; з нього QR.
 *
 * Зібрано з _robota/dokumenty/sait/znayomstvo.html скриптом opytuvannia/zibraty.py — сторінку правити там, не тут.
 */

var NAZVA_HURTKA = 'Орли волі';

var STORINKA = /*STORINKA*/"";

function nalashtuvaty() {
  var t = tablytsia_();
  var papka = DriveApp.getFileById(t.getId()).getParents().next();
  Logger.log('ГОТОВО.');
  Logger.log('Папка: ' + papka.getUrl());
  Logger.log('Таблиця відповідей: ' + t.getUrl());
  Logger.log('Далі: «Ввести в дію» → «Нове введення» → Вебзастосунок → Хто має доступ: Усі.');
}

function tablytsia_() {
  var pr = PropertiesService.getScriptProperties();
  var id = pr.getProperty('TABLYTSIA');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) {} }
  var papka = DriveApp.createFolder('Знайомство з гуртком «' + NAZVA_HURTKA + '»');
  var t = SpreadsheetApp.create('Знайомство з гуртком «' + NAZVA_HURTKA + '» — відповіді');
  DriveApp.getFileById(t.getId()).moveTo(papka);
  var a = t.getSheets()[0];
  a.setName('Відповіді');
  a.getRange(1, 1, 1, 2).setValues([['Коли', 'Гурток']]).setFontWeight('bold');
  a.setFrozenRows(1);
  pr.setProperty('TABLYTSIA', t.getId());
  return t;
}

function doGet() {
  var html = STORINKA.replace("/*HURTOK*/''/*/HURTOK*/", JSON.stringify(NAZVA_HURTKA));
  return HtmlService.createHtmlOutput(html)
    .setTitle('Знайомство з гуртком «' + NAZVA_HURTKA + '»')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Викликає сторінка (google.script.run.zapysaty)
function zapysaty(tekst) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var d = JSON.parse(tekst);
    if (d.dija !== 'znayomstvo' || !d.vidpovidi) return {ok: false, pomylka: 'Невідомий запит.'};
    var a = tablytsia_().getSheets()[0];
    var shapka = a.getRange(1, 1, 1, Math.max(a.getLastColumn(), 2)).getValues()[0].map(String);
    Object.keys(d.vidpovidi).slice(0, 60).forEach(function (k) {   // нове питання → новий стовпець
      if (shapka.indexOf(k) < 0) { shapka.push(k); a.getRange(1, shapka.length).setValue(k).setFontWeight('bold'); }
    });
    a.appendRow(shapka.map(function (h, i) {
      if (i === 0) return new Date();
      if (i === 1) return chysto_(NAZVA_HURTKA);
      return chysto_(d.vidpovidi[h]);
    }));
    return {ok: true};
  } catch (x) {
    return {ok: false, pomylka: 'Не вдалося записати. Спробуй ще раз.'};
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function chysto_(v) {   // текст, не формула; не довше 2000 знаків
  var s = v == null ? '' : String(v).slice(0, 2000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
