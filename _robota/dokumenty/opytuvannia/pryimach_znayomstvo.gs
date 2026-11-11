/**
 * Приймач опитувальника «Знайомство з гуртком» (сторінка https://gutirky-fi.github.io/dokumenty/znayomstvo/).
 * Сторінка надсилає відповіді сюди, приймач дописує рядок у Google Таблицю виховника.
 * Даних юнаків тут немає: вони лише в Таблиці на Google виховника. Адресу /exec у репозиторій не класти.
 *
 * Як поставити (комп'ютер, профіль Chrome «Пласт»):
 *  1) script.google.com → «Новий проєкт» → стерти все → вставити цей файл → Зберегти.
 *  2) Угорі вибрати nalashtuvaty → «Виконати» → дозволити доступ («Додатково» → перейти — це ваш власний скрипт).
 *     Внизу з'явиться посилання на Таблицю відповідей.
 *  3) «Ввести в дію» → «Нове введення» → коліщатко → «Вебзастосунок»;
 *     «Виконувати як» — Я; «Хто має доступ» — Усі → «Ввести в дію» → скопіювати URL (закінчується на /exec).
 */

function nalashtuvaty() {
  var pr = PropertiesService.getScriptProperties();
  var id = pr.getProperty('TABLYTSIA');
  var t = null;
  if (id) { try { t = SpreadsheetApp.openById(id); } catch (e) { t = null; } }
  if (!t) {
    t = SpreadsheetApp.create('Знайомство з гуртком — відповіді');
    pr.setProperty('TABLYTSIA', t.getId());
    var a = t.getSheets()[0];
    a.setName('Відповіді');
    a.getRange(1, 1, 1, 2).setValues([['Коли', 'Гурток']]).setFontWeight('bold');
    a.setFrozenRows(1);
  }
  Logger.log('ГОТОВО. Таблиця відповідей: ' + t.getUrl());
  Logger.log('Далі: «Ввести в дію» → «Нове введення» → Вебзастосунок → Доступ: Усі.');
}

function doGet() {
  return ContentService.createTextOutput('Приймач опитувальника працює.');
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var d = JSON.parse(e.postData.contents);
    if (d.dija !== 'znayomstvo' || !d.vidpovidi) return vidpovid({ok: false, pomylka: 'Невідомий запит.'});
    var id = PropertiesService.getScriptProperties().getProperty('TABLYTSIA');
    if (!id) return vidpovid({ok: false, pomylka: 'Виховник ще не налаштував опитування.'});
    var a = SpreadsheetApp.openById(id).getSheets()[0];

    var shapka = a.getRange(1, 1, 1, Math.max(a.getLastColumn(), 2)).getValues()[0].map(String);
    var keys = Object.keys(d.vidpovidi).slice(0, 60);
    keys.forEach(function (k) {   // нове питання на сторінці → новий стовпець, нічого не ламається
      if (shapka.indexOf(k) < 0) { shapka.push(k); a.getRange(1, shapka.length).setValue(k).setFontWeight('bold'); }
    });
    var ryadok = shapka.map(function (h, i) {
      if (i === 0) return new Date();
      if (i === 1) return chysto(d.hurtok);
      return chysto(d.vidpovidi[h]);
    });
    a.appendRow(ryadok);
    return vidpovid({ok: true});
  } catch (x) {
    return vidpovid({ok: false, pomylka: 'Не вдалося записати. Спробуй ще раз.'});
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function chysto(v) {   // текст, не формула; не довше 2000 знаків
  var s = v == null ? '' : String(v).slice(0, 2000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function vidpovid(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
