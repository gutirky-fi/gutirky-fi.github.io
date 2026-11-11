/**
 * Опитувальник «Знайомство з гуртком» — створює Google Форму й Таблицю відповідей.
 * Як запустити: script.google.com (профіль Chrome «Пласт») → «Новий проєкт» →
 * стерти все, вставити цей файл → Зберегти → угорі вибрати stvoryty → «Виконати» →
 * дозволити доступ → внизу в «Журналі виконання» з'являться посилання.
 * Даних юнаків тут немає: відповіді зберігаються лише в Google виховника.
 */
var NAZVA_HURTKA = 'Орли волі';

function stvoryty() {
  var f = FormApp.create('Гурток «' + NAZVA_HURTKA + '» — знайомство з виховником');
  f.setDescription(
    'Привіт! Я ваш новий виховник і хочу знати, який у нас гурток і чого хочеш саме ти. ' +
    'Це займе 5–10 хвилин. Пиши як є — правильних і неправильних відповідей немає. ' +
    'Прізвище не потрібне.');
  f.setCollectEmail(false);
  f.setAllowResponseEdits(false);
  f.setShowLinkToRespondAgain(false);
  f.setProgressBar(true);
  f.setConfirmationMessage('Дякую! Твої відповіді дійшли до виховника. СКОБ!');

  // ---------- Про мене ----------
  f.addSectionHeaderItem().setTitle('Про мене');
  f.addTextItem().setTitle('Твоє ім\'я').setHelpText('Лише ім\'я, без прізвища').setRequired(true);

  var vik = [];
  for (var i = 10; i <= 18; i++) vik.push(String(i));
  vik.push('більше 18');
  f.addListItem().setTitle('Скільки тобі років').setChoiceValues(vik).setRequired(true);

  f.addMultipleChoiceItem().setTitle('Відколи ти в цьому гуртку')
    .setChoiceValues(['Цього року прийшов', '1–2 роки', '3 роки й більше', 'Від самого початку гуртка'])
    .setRequired(true);

  f.addCheckboxItem().setTitle('Яка в тебе посада в гуртку')
    .setChoiceValues(['Гуртковий', 'Заступник гурткового', 'Писар', 'Скарбник', 'Господар', 'Хронікар', 'Немає посади'])
    .showOtherOption(true).setRequired(true);

  f.addParagraphTextItem().setTitle('Що ти робиш на своїй посаді')
    .setHelpText('Якщо посади немає — пропусти');

  f.addParagraphTextItem().setTitle('Яка в тебе проба і над чим зараз працюєш')
    .setHelpText('Якщо не знаєш точно — напиши, як пам\'ятаєш');

  f.addParagraphTextItem().setTitle('Які вмілості й відзначки ти вже маєш');

  // ---------- Мій гурток ----------
  f.addPageBreakItem().setTitle('Мій гурток')
    .setHelpText('Розкажи, як ти бачиш гурток. Чого не знаєш — пропускай.');

  f.addParagraphTextItem().setTitle('Що тобі найбільше подобається в гуртку').setRequired(true);
  f.addParagraphTextItem().setTitle('Що б ти змінив або покращив');
  f.addParagraphTextItem().setTitle('Як зараз зазвичай проходять наші сходини')
    .setHelpText('Що робимо, хто веде, скільки триває');
  f.addParagraphTextItem().setTitle('Гасло, клич, пісня, традиції гуртка')
    .setHelpText('Усе, що робить наш гурток особливим');
  f.addParagraphTextItem().setTitle('Що гурток робив останнім часом')
    .setHelpText('Табори, мандрівки, акції, вмілості, свята');

  // ---------- Що далі ----------
  f.addPageBreakItem().setTitle('Що далі');

  f.addCheckboxItem().setTitle('Чим ти хочеш займатися цього року')
    .setChoiceValues(['Мандрівки й походи', 'Табори', 'Ігри', 'Вмілості', 'Гутірки (цікаві теми)',
                      'Добрі справи й акції', 'Спорт', 'Творчість і ремесла'])
    .showOtherOption(true).setRequired(true);

  f.addParagraphTextItem().setTitle('Які теми тобі цікаві')
    .setHelpText('Про що хотів би дізнатися на сходинах');

  f.addMultipleChoiceItem().setTitle('Хочеш узяти посаду або якусь справу в гуртку')
    .setChoiceValues(['Так', 'Можливо', 'Поки ні']).setRequired(true);

  f.addParagraphTextItem().setTitle('Що ти вмієш і міг би навчити інших');

  f.addCheckboxItem().setTitle('Які дні тобі зручні для сходин')
    .setChoiceValues(['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя']);

  f.addParagraphTextItem().setTitle('Що хочеш сказати новому виховникові')
    .setHelpText('Необов\'язково');

  // ---------- Таблиця відповідей ----------
  var t = SpreadsheetApp.create('Гурток «' + NAZVA_HURTKA + '» — відповіді знайомства');
  f.setDestination(FormApp.DestinationType.SPREADSHEET, t.getId());

  var dlya = f.getPublishedUrl();
  var korotke = dlya;
  try { korotke = f.shortenFormUrl(dlya); } catch (e) {}

  Logger.log('ГОТОВО.');
  Logger.log('1) Посилання ДЛЯ ЮНАКІВ (з нього QR): ' + korotke);
  Logger.log('2) Редагувати форму: ' + f.getEditUrl());
  Logger.log('3) Таблиця з відповідями: ' + t.getUrl());
}
