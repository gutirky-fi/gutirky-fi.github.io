// Перевірка приймача без Google: імітація Таблиці з прикладу.
// Підготовка (робить перевірка): JSON-знімок KNYHA-HURTKA-pryklad.xlsx → node test_pryimach.js knyha.json
const fs = require('fs'), crypto = require('crypto'), vm = require('vm'), path = require('path');
const dump = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const un = v => (v && typeof v === 'object' && v.d) ? new Date(v.d + 'T00:00:00') : (v === null ? '' : v);

function Sheet(name, d) {
  const f = d.f.map(r => r.map(un)), v = d.v.map(r => r.map(un));
  const nc = Math.max(...f.map(r => r.length));
  const cell = (r, c) => { while (f.length < r) { f.push([]); v.push([]); } return [f[r - 1], v[r - 1], c - 1]; };
  const isF = x => typeof x === 'string' && x.startsWith('=');
  const range = (r, c, nr = 1, ncc = 1) => ({
    getValues: () => [...Array(nr)].map((_, i) => [...Array(ncc)].map((_, k) => { const [F, V, j] = cell(r + i, c + k); return isF(F[j]) ? (V[j] ?? '') : (F[j] ?? ''); })),
    getDisplayValue() { return this.getDisplayValues()[0][0]; },
    getDisplayValues() { return this.getValues().map(rr => rr.map(x => x instanceof Date ? x.toLocaleDateString('uk') : String(x))); },
    getFormulas: () => [...Array(nr)].map((_, i) => [...Array(ncc)].map((_, k) => { const [F, , j] = cell(r + i, c + k); return isF(F[j]) ? F[j] : ''; })),
    setValue: x => { const [F, V, j] = cell(r, c); if (isF(F[j])) throw Error('запис у формулу ' + name + ' ' + r + ':' + c); F[j] = x; V[j] = x; },
    setValues: a => a.forEach((rr, i) => rr.forEach((x, k) => range(r + i, c + k).setValue(x))),
    clearContent: () => { for (let i = 0; i < nr; i++) for (let k = 0; k < ncc; k++) { const [F, V, j] = cell(r + i, c + k); F[j] = ''; V[j] = ''; } },
  });
  return { getProtections: () => [], getName: () => name, getMaxRows: () => f.length, getLastColumn: () => nc, getMaxColumns: () => nc, getRange: range, _f: f };
}
const sheets = Object.fromEntries(Object.entries(dump).map(([n, d]) => [n, Sheet(n, d)]));
const props = {}, cache = {};
const ctx = {
  SpreadsheetApp: {
    getActive: () => ({ getSheetByName: n => sheets[n] || null, getSheets: () => Object.values(sheets), getName: () => 'Книга гуртка',
      copy: n => ({ getUrl: () => 'https://docs.google.com/archiv' }), getSpreadsheetTimeZone: () => 'Europe/Helsinki' }),
    getUi: () => ({ alert: () => 'YES', Button: { YES: 'YES' }, ButtonSet: {} }),
  },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => props[k] = v, getProperties: () => Object.assign({}, props), deleteProperty: k => { delete props[k]; } }) },
  CacheService: { getScriptCache: () => ({ get: k => cache[k] || null, put: (k, v) => cache[k] = v }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Utilities: { sleep() {}, getUuid: () => crypto.randomUUID(), DigestAlgorithm: {}, Charset: {}, computeDigest: (a, s) => [...crypto.createHash('sha256').update(s, 'utf8').digest()].map(b => b > 127 ? b - 256 : b) },
  ContentService: { MimeType: { JSON: 1 }, createTextOutput: t => ({ setMimeType: () => JSON.parse(t) }) },
  console, Date,
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'pryimach.gs'), 'utf8'), ctx);
const post = o => ctx.doPost({ postData: { contents: JSON.stringify(o) } });
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) bad++; };

props.KOD_V = ctx.vidbytok('lelekы-2026');   // виховник (у тестах — основний)
props.KOD = ctx.vidbytok('2468');           // юнаки
ok(!post({ kod: 'хибний', dija: 'perevirka' }).ok, 'хибний код відхилено');
ok(post({ kod: 'lelekы-2026', dija: 'perevirka' }).ok, 'правильний код приймається');
const im = post({ kod: 'lelekы-2026', dija: 'imena' }); ok(im.imena.length === 7 && im.imena[0] === 'Олесь', 'імена: ' + im.imena.join(', '));
let r = post({ kod: 'lelekы-2026', dija: 'zapys', arkush: 'Сходини', khto: 'Олесь', dani: { 'Дата': '2026-10-24', '№': 8, 'Тема': 'Орієнтування', 'Відповідальний': 'Олесь', 'Присутніх': 99 } });
ok(r.ok && r.ryadok === 11, 'сходини → перший вільний рядок 11');
const s = sheets['Сходини']._f[10];
ok(s[0] instanceof Date && s[2] === 'Орієнтування' && s[10] === 'Олесь' && s[11] instanceof Date, 'поля, «Хто записав», «Записано» на місці');
ok(String(s[8]).startsWith('='), 'формула «Присутніх» не зачеплена');
r = post({ kod: 'lelekы-2026', dija: 'zapys', arkush: 'Відвідуваність', khto: 'Ярко', dani: { 'Дата': '2026-10-24', '№ сходин': 8, 'Тема': 'Орієнтування', 'присутність': { 'Олесь': '+', 'Мирося': '−', 'Чужий': '+' } } });
ok(r.ok && r.ryadok === 11, 'відвідуваність → рядок 11');
r = post({ kod: 'lelekы-2026', dija: 'zapys', arkush: 'Відвідуваність', khto: 'Ярко', dani: { 'Дата': '2026-10-24', 'присутність': { 'Дана': 'в', 'Зоряна': '+' } } });
const v = sheets['Відвідуваність']._f[10];
ok(r.ryadok === 11 && v[5] === '+' && v[6] === '−' && v[7] === 'в' && v[11] === '+', 'та сама дата — той самий рядок, позначки дописано');
ok(!sheets['Відвідуваність']._f[2].includes('Чужий'), 'чуже ім\'я не потрапило в заголовок');
r = post({ kod: 'lelekы-2026', dija: 'zapys', arkush: 'Фінанси', dani: { 'Дата': '2026-11-01', 'Рух': 'надходження', 'Опис': '=IMPORTXML("x")', 'Сума, €': '12,50' } });
const fn = sheets['Фінанси']._f[r.ryadok - 1];
ok(fn[3] === "'=IMPORTXML(\"x\")" && fn[5] === 12.5, 'формула-підкидка знешкоджена, «12,50» → 12.5');
ok(!post({ kod: 'lelekы-2026', dija: 'zapys', arkush: 'Учасники', dani: { "Ім'я": 'Х' } }).ok, 'в «Учасники» сайт не пише');
ok(!post({ kod: 'lelekы-2026', dija: 'zapys', arkush: 'Налаштування', dani: { a: 1 } }).ok, 'в «Налаштування» сайт не пише');
const z = post({ kod: 'lelekы-2026', dija: 'zvit', arkush: 'Фінанси', vid: '2026-09-15', do: '2026-10-31' });
ok(z.ok && z.ryadky.length === 3, 'звіт за датами: ' + z.ryadky.length + ' рядки');
const zu = post({ kod: 'lelekы-2026', dija: 'zvit', arkush: 'Учасники' });
ok(zu.ok && !zu.zaholovky.includes('Прізвище') && !JSON.stringify(zu).includes('Бондар'), 'звіт «Учасники» — без прізвищ');
ok(!JSON.stringify(im).includes('Бондар'), 'список імен для форм — без прізвищ');
// ---- виправити / скасувати / перевірено / зміни ----
const K = 'lelekы-2026', zm = () => sheets['Зміни']._f.slice(3).filter(x => x[0] instanceof Date);
let q = post({ kod: K, dija: 'zapys', arkush: 'Майно', khto: 'Соломія', dani: { 'Річ': 'Казанок', 'Кількість': 2, 'Перевірено виховником': 'так' } });
const rm = q.ryadok, mn = () => sheets['Майно']._f[rm - 1];
ok(q.ok && typeof q.kvytok === 'string' && q.kvytok.length > 10, 'запис дає квиток для виправлення');
ok(mn()[10] !== 'так', '«Перевірено» сайт сам не ставить');
ok(zm().some(x => x[1] === 'запис' && x[2] === 'Майно' && x[3] === rm && String(x[5]).includes('Казанок')), '«Зміни»: запис видно (' + zm().length + ')');
let w = post({ kod: K, dija: 'vypravyty', kvytok: q.kvytok, khto: 'Соломія', dani: { 'Річ': 'Казанок великий', 'Кількість': 1 } });
ok(w.ok && w.ryadok === rm && mn()[0] === 'Казанок великий' && mn()[1] === 1, 'виправлення — у той самий рядок');
ok(!post({ kod: K, dija: 'vypravyty', kvytok: 'вигаданий-квиток-123', dani: { 'Річ': 'x' } }).ok, 'чужий/вигаданий квиток — відмова');
sheets['Майно']._f[rm - 1][10] = 'так';
w = post({ kod: K, dija: 'vypravyty', kvytok: q.kvytok, dani: { 'Річ': 'Зіпсовано' } });
ok(!w.ok && mn()[0] === 'Казанок великий', 'перевірений виховником рядок сайт не змінює');
ok(!post({ kod: K, dija: 'skasuvaty', kvytok: q.kvytok }).ok, 'перевірений рядок сайт не скасує');
sheets['Майно']._f[rm - 1][10] = '';
w = post({ kod: K, dija: 'skasuvaty', kvytok: q.kvytok, khto: 'Соломія' });
ok(w.ok && mn()[0] === '' && zm().some(x => x[1] === 'скасування' && String(x[5]).includes('Казанок великий')), 'скасування: рядок порожній, у «Змінах» — що було');
ok(!post({ kod: K, dija: 'vypravyty', kvytok: q.kvytok, dani: { 'Річ': 'x' } }).ok, 'після скасування квиток більше не діє');
const vr = sheets['Відвідуваність']._f.findIndex(x => x[0] instanceof Date && x[0].getTime() === new Date('2026-10-24T00:00:00').getTime());
sheets['Відвідуваність']._f[vr][sheets['Відвідуваність']._f[2].indexOf('Перевірено виховником')] = 'так';
w = post({ kod: K, dija: 'zapys', arkush: 'Відвідуваність', khto: 'Ярко', dani: { 'Дата': '2026-10-24', 'присутність': { 'Дана': '+' } } });
ok(!w.ok && sheets['Відвідуваність']._f[vr][7] === 'в', 'перевірені сходини: відвідуваність заднім числом не змінити');
const nv = post({ kod: K, dija: 'novi' });
ok(nv.ok && nv.novi.length >= 3 && nv.novi[0].dija === 'скасування' && nv.novi[0].porozhnio && /^\d\d\.\d\d\.\d{4} \d\d:\d\d$/.test(nv.novi[0].koly), 'Що нового: ' + nv.novi.length + ' записів, чекають ' + nv.chekaiut + '; найновіше — ' + nv.novi[0].dija + ' · ' + nv.novi[0].arkush);
const sx = nv.novi.find(x => x.arkush === 'Сходини');
ok(sx && sx.pola.some(p => p[0] === 'Тема' && p[1] === 'Орієнтування') && sx.zatverdzheno === false, 'Що нового: повний вміст запису й стан «чекає»');
const vx = nv.novi.find(x => x.arkush === 'Відвідуваність');
ok(vx && vx.prys['Олесь'] === '+' && vx.zatverdzheno === true, 'Що нового: відвідуваність — хто був, затверджено');
// ---- одна дата — один запис; два коди; затвердження ----
const J = '2468';
let x = post({ kod: J, dija: 'imena' }); ok(x.ok && x.rol === 'd' && post({ kod: K, dija: 'perevirka' }).rol === 'v', 'два коди: юнаки «d», виховник «v»');
ok(!post({ kod: J, dija: 'novi' }).ok && !post({ kod: J, dija: 'zvit', arkush: 'Фінанси' }).ok && !post({ kod: J, dija: 'zatverdyty', arkush: 'Сходини', ryadok: 11 }).ok, 'кодом юнаків не прочитати звітів і «Що нового», не затвердити');
const skhN = () => sheets['Сходини']._f.slice(3).filter(r => r[0] instanceof Date).length, n0 = skhN();
x = post({ kod: J, dija: 'zapys', arkush: 'Сходини', khto: 'Дана', dani: { 'Дата': '2026-10-24', 'Тема': 'Орієнтування й компас', 'Місце': '' } });
ok(x.ok && x.ryadok === 11 && skhN() === n0 && sheets['Сходини']._f[10][2] === 'Орієнтування й компас', 'та сама дата — той самий рядок, дубля немає');
x = post({ kod: J, dija: 'stan', arkush: 'Сходини', dani: { 'Дата': '2026-10-24' } });
ok(x.ok && x.ye && !x.zatverdzheno && x.khto === 'Дана' && x.dani['Тема'] === 'Орієнтування й компас' && x.dani['Дата'] === '2026-10-24', 'stan: запис є, хто записав, що в ньому');
ok(post({ kod: J, dija: 'stan', arkush: 'Сходини', dani: { 'Дата': '2027-01-01' } }).ye === false, 'stan: нової дати ще немає');
x = post({ kod: K, dija: 'zatverdyty', arkush: 'Сходини', ryadok: 11 });
ok(x.ok && sheets['Сходини']._f[10][12] === 'так', 'виховник затвердив — «так» у книзі');
x = post({ kod: J, dija: 'zapys', arkush: 'Сходини', khto: 'Дана', dani: { 'Дата': '2026-10-24', 'Тема': 'Зіпсовано' } });
ok(!x.ok && x.zatverdzheno && sheets['Сходини']._f[10][2] === 'Орієнтування й компас', 'затверджене не змінити й не продублювати');
ok(post({ kod: J, dija: 'stan', arkush: 'Сходини', dani: { 'Дата': '2026-10-24' } }).zatverdzheno === true, 'stan: юнак бачить «затверджено»');
x = post({ kod: K, dija: 'zatverdyty', arkush: 'Сходини', ryadok: 11, tak: false });
ok(x.ok && sheets['Сходини']._f[10][12] === '' && post({ kod: J, dija: 'zapys', arkush: 'Сходини', khto: 'Дана', dani: { 'Дата': '2026-10-24', 'Тема': 'Орієнтування' } }).ok, 'зняв затвердження — знову можна виправити');
const pn = () => sheets['Протоколи']._f.slice(3).filter(r => r[0] instanceof Date).length, p0 = pn();
post({ kod: J, dija: 'zapys', arkush: 'Протоколи', khto: 'Мирося', dani: { 'Дата': '2026-11-07', 'Вид': 'сходини', 'Питання': 'а' } });
post({ kod: J, dija: 'zapys', arkush: 'Протоколи', khto: 'Мирося', dani: { 'Дата': '2026-11-07', 'Вид': 'гурткова рада', 'Питання': 'б' } });
post({ kod: J, dija: 'zapys', arkush: 'Протоколи', khto: 'Мирося', dani: { 'Дата': '2026-11-07', 'Вид': 'сходини', 'Питання': 'в' } });
ok(pn() === p0 + 2, 'протоколи: та сама дата, різний вид — 2 записи; той самий вид — без дубля');
// ---- Новий рік ----
const fin0 = sheets['Фінанси']._f.slice(3).filter(r => r[0] !== '' && r[0] !== undefined);
const zal = fin0.reduce((a, r) => a + (r[1] === 'надходження' ? +r[5] : r[1] === 'видаток' ? -r[5] : 0), 0);
const proby0 = sheets['Проби']._f.slice(3).filter(r => r[0]).length, vm0 = sheets['Вмілості']._f.slice(3).filter(r => r[0]).length;
const zam0 = sheets['Замовлення']._f.slice(3).filter(r => r[0]).length;
ctx.novyiRik();
const ryad = n => sheets[n]._f.slice(3).filter(r => r[0] !== '' && r[0] !== undefined);
ok(ryad('Сходини').length === 0 && ryad('Відвідуваність').length === 0 && ryad('Протоколи').length === 0, 'сходини, відвідуваність, протоколи очищено');
ok(sheets['Відвідуваність']._f[2][5] === 'Олесь', 'імена над відвідуваністю лишились');
ok(ryad('Проби').length === proby0 && ryad('Вмілості').length === vm0 && ryad('Замовлення').length === zam0, 'проби, вмілості, замовлення — не чіпано');
const zv = ryad('Завдання'); ok(zv.length === 3 && zv.every(r => r[4] !== 'зроблено'), 'завдання: лишились 3 незроблені, стягнуті догори');
const f1 = ryad('Фінанси'); ok(f1.length === 1 && Math.abs(f1[0][5] - zal) < 0.01 && f1[0][3] === 'Залишок з 2026/27', 'каса: один рядок «Залишок з 2026/27» = ' + zal);
const rk = ryad('Роки'); ok(rk.length === 1 && rk[0][0] === '2026/27' && rk[0][2] === 8 && Math.abs(rk[0][10] - zal) < 0.01 && rk[0][11].includes('archiv'), 'Роки: ' + rk[0].slice(0, 11).map(x => typeof x === 'number' ? Math.round(x * 100) / 100 : x).join(' | '));
const iu = ryad('Історія учасників');
const zi = post({ kod: 'lelekы-2026', dija: 'zvit', arkush: 'Історія учасників' });
ok(zi.ok && zi.ryadky.length === 7 && !JSON.stringify(zi).includes('Бондар'), 'звіт «Історія учасників» — без прізвищ'); const ol = iu.find(r => r[1] === 'Олесь');
ok(iu.length === 7 && ol[2] === 'Бондар' && ol[5] === 8 && ol[9].includes('Приклад-вмілість А'), 'Історія: 7 учасників; Олесь — ' + ol.slice(1, 11).map(x => typeof x === 'number' ? Math.round(x * 100) / 100 : x).join(' | '));
ok(sheets['Налаштування']._f[4][21] === '2027/28', 'навчальний рік → 2027/28');
ok(ryad('Архів').some(r => String(r[3]).includes('archiv')), 'посилання на архів записано');
for (let i = 0; i < 5; i++) post({ kod: 'x', dija: 'perevirka' });
ok(!post({ kod: 'lelekы-2026', dija: 'perevirka' }).ok, 'після 5 хибних спроб — вхід закрито');
ok(sheets['Зміни']._f.slice(3).some(r => r[1] === 'блокування'), 'блокування записано в «Зміни»');
console.log(bad ? `ПОМИЛОК: ${bad}` : 'Усе гаразд'); process.exit(bad ? 1 : 0);
