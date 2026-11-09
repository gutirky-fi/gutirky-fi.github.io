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
const drive = { files: {}, folders: 0 };
const ctx = {
  DriveApp: {
    createFolder: n => { const id = 'papka' + (++drive.folders); return { getId: () => id, isTrashed: () => false, createFile: b => { const fid = 'f'.repeat(10) + crypto.randomUUID().replace(/-/g, ''); drive.files[fid] = { name: b.name, len: b.bytes.length, trashed: false }; return { getUrl: () => 'https://drive.google.com/file/d/' + fid + '/view' }; } }; },
    getFolderById: id => { throw Error('немає'); },
    getFileById: id => ({ setTrashed: t => { if (drive.files[id]) drive.files[id].trashed = t; } }),
  },
  SpreadsheetApp: {
    getActive: () => ({ getSheetByName: n => sheets[n] || null, getSheets: () => Object.values(sheets), getName: () => 'Книга гуртка',
      copy: n => ({ getUrl: () => 'https://docs.google.com/archiv' }), getSpreadsheetTimeZone: () => 'Europe/Helsinki' }),
    getUi: () => ({ alert: () => 'YES', Button: { YES: 'YES' }, ButtonSet: {} }),
  },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => props[k] = v, getProperties: () => Object.assign({}, props), deleteProperty: k => { delete props[k]; } }) },
  CacheService: { getScriptCache: () => ({ get: k => cache[k] || null, put: (k, v) => cache[k] = v }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Utilities: { base64Decode: b => [...Buffer.from(b, 'base64')].map(x => x > 127 ? x - 256 : x), newBlob: (bytes, typ, name) => ({ bytes, typ, name }), sleep() {}, getUuid: () => crypto.randomUUID(), DigestAlgorithm: {}, Charset: {}, computeDigest: (a, s) => [...crypto.createHash('sha256').update(s, 'utf8').digest()].map(b => b > 127 ? b - 256 : b) },
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
// ---- Майно: одна річ — один рядок; список речей ----
const mnN = () => sheets['Майно']._f.slice(3).filter(r => r[0] !== '' && r[0] !== undefined).length, m0 = mnN();
let sp = post({ kod: J, dija: 'spysok', arkush: 'Майно' });
ok(sp.ok && sp.spysok.includes('Намет 4-місний') && sp.spysok.length === m0, 'spysok: назви речей (' + sp.spysok.join(', ') + ')');
ok(!post({ kod: J, dija: 'spysok', arkush: 'Учасники' }).ok, 'spysok: «Учасники» не видаються');
x = post({ kod: J, dija: 'stan', arkush: 'Майно', dani: { 'Річ': 'намет 4-місний ' } });
ok(x.ok && x.ye && x.dani['Стан'] === 'добрий', 'stan: «Намет» знайдено (без різниці великих літер і пробілів)');
x = post({ kod: J, dija: 'zapys', arkush: 'Майно', khto: 'Соломія', dani: { 'Річ': 'Намет 4-місний', 'Кількість': '2', 'Стан': 'потребує ремонту', 'Примітка': 'порвана сітка' } });
ok(x.ok && x.onovleno && mnN() === m0, 'майно: та сама річ — той самий рядок, дубля немає');
x = post({ kod: J, dija: 'zapys', arkush: 'Майно', khto: 'Соломія', dani: { 'Річ': 'Казанок', 'Кількість': '1', 'Стан': 'добрий' } });
ok(x.ok && !x.onovleno && mnN() === m0 + 1, 'майно: нова річ — новий рядок');
// ---- Етап 3.3: ключі решти форм (одна подія / одна точка / одна позиція — один рядок) ----
const cnt = (a) => sheets[a]._f.slice(3).filter(r => r[0] !== '' && r[0] !== undefined && r[0] !== null).length;
const zp = (a, d) => post({ kod: J, dija: 'zapys', arkush: a, khto: 'Мирося', dani: d });
let pb0 = cnt('Проби');
x = zp('Проби', { "Ім'я": 'Олесь', 'Проба': '1-ша проба', 'Точка': 'Б4', 'Дата виконання': '2026-11-01' });
ok(x.ok && !x.onovleno && cnt('Проби') === pb0 + 1, 'проби: нова точка — новий рядок (статус «виконано» сам)');
ok(sheets['Проби']._f[x.ryadok - 1][5] === 'виконано', 'проби: «Статус» = виконано');
x = zp('Проби', { "Ім'я": 'олесь ', 'Проба': '1-ша проба', 'Точка': ' б4', 'Дата виконання': '2026-11-02' });
ok(x.ok && x.onovleno && cnt('Проби') === pb0 + 1, 'проби: та сама точка (малою, з пробілом) — той самий рядок');
x = zp('Проби', { "Ім'я": 'Олесь', 'Проба': '1-ша проба', 'Точка': 'Б9', 'Дата виконання': '2026-11-01' });
ok(!x.ok && /немає в бланку/.test(x.pomylka), 'проби: точки, якої немає на бланку, не приймає');
x = zp('Проби', { "Ім'я": 'Олесь', 'Проба': '1-ша проба', 'Точка': 'Б5' });
ok(!x.ok && /дату/.test(x.pomylka), 'проби: без дати — ні');
x = zp('Проби', { "Ім'я": 'Олесь', 'Проба': '1-ша проба', 'Точка': 'Б5', 'Статус': 'здобуто', 'Дата виконання': '2026-11-01' });
ok(!x.ok, 'проби: «здобуто» — лише для посвідки');
x = post({ kod: J, dija: 'stan', arkush: 'Проби', dani: { "Ім'я": 'Олесь', 'Проба': '1-ша проба', 'Точка': 'Б4' } });
ok(x.ok && x.ye && x.dani['Статус'] === 'виконано', 'проби: stan знаходить точку');
pb0 = cnt('Проби');
x = post({ kod: J, dija: 'probyZapys', proba: '1-ша проба', imena: ['Олесь', 'Мирося', 'Дана'], tochky: ['А1', 'Г2', 'г3'], data: '2026-11-07', pidtv: 'Тарас', khto: 'Ярко' });
ok(x.ok && x.zapysano.length === 6 && x.vzhe.length === 3 && cnt('Проби') === pb0 + 6, 'probyZapys: 3 юнаки × 3 точки, А1 у всіх уже є → 6 нових рядків, 3 пропущено');
ok(x.zapysano.every(z => typeof z.kvytok === 'string'), 'probyZapys: квиток для кожного рядка');
const rD = sheets['Проби']._f[x.zapysano[0].ryadok - 1];
ok(rD[2] === 'Г2' && rD[6] instanceof Date && rD[7] === 'Тарас' && rD[10] === 'Ярко' && String(rD[3]).startsWith('='), 'probyZapys: точка, дата, хто підтвердив, хто записав; формула «Що за точка» ціла');
x = post({ kod: J, dija: 'probyZapys', proba: '1-ша проба', imena: ['Олесь'], tochky: ['Я1'], data: '2026-11-07', khto: 'Ярко' });
ok(!x.ok && /немає в бланку/.test(x.pomylka), 'probyZapys: чужа точка — нічого не записано');
x = post({ kod: J, dija: 'probyZapys', proba: '1-ша проба', imena: ['Чужий'], tochky: ['А2'], data: '2026-11-07', khto: 'Ярко' });
ok(!x.ok && /немає серед учасників/.test(x.pomylka), 'probyZapys: чуже ім\'я — ні');
x = post({ kod: J, dija: 'probyZapys', proba: '2-га проба', imena: ['Соломія', 'Ярко'], tochky: ['А1', 'А2'], data: '2026-11-08', khto: 'Ярко' });
const kvP = x.zapysano.map(z => z.kvytok), pb1 = cnt('Проби');
x = post({ kod: J, dija: 'skasuvatyMnoho', kvytky: kvP, khto: 'Ярко' });
ok(x.ok && x.skasovano === 4 && cnt('Проби') === pb1 - 4, 'skasuvatyMnoho: щойно надіслане скасовано (4 рядки)');
const pvP = post({ kod: J, dija: 'proby' });
ok(pvP.ok && pvP.indeks['1-ша проба'].length === 55 && pvP.indeks['2-га проба'].length === 38 && pvP.indeks['прихильник'].length === 11, 'proby: індекс з книги (11 / 55 / 38 точок)');
ok(pvP.ryadky.some(r => r.im === 'Остап' && r.pr === '1-ша проба' && r.t === 'посвідка' && r.st === 'здобуто') && !JSON.stringify(pvP).includes('Бондар'), 'proby: рядки з посвідками, без прізвищ');
x = zp('Проби', { "Ім'я": 'Мирося', 'Проба': 'прихильник', 'Точка': 'посвідка', 'Статус': 'виконано', 'Дата виконання': '2026-10-03' });
ok(!x.ok, 'посвідка — лише «здобуто»');
x = zp('Проби', { "Ім'я": 'Зоряна', 'Проба': 'прихильник', 'Точка': 'посвідка', 'Статус': 'здобуто', 'Дата виконання': '2026-11-08', 'Хто підтвердив': 'Тарас' });
ok(x.ok && !x.onovleno, 'проба здобута — рядок «посвідка»');
const rPos = x.ryadok, JPG0 = Buffer.concat([Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), Buffer.alloc(300, 7)]).toString('base64');
x = post({ kod: J, dija: 'kopiia', arkush: 'Проби', ryadok: rPos, fail: JPG0, typ: 'image/jpeg', khto: 'Ярко' });
ok(x.ok && Object.values(drive.files).some(f => f.name === 'Зоряна — прихильник — 2026-11-08.jpg'), 'копія бланка проби — на Диску: ім\'я — проба — дата');
x = post({ kod: J, dija: 'kopiia', arkush: 'Проби', ryadok: pvP.ryadky.find(r => r.st === 'виконано').ryadok, fail: JPG0, typ: 'image/jpeg' });
ok(!x.ok && /проба здобута/.test(x.pomylka), 'копія бланка — лише до рядка «посвідка»');
let vmil0 = cnt('Вмілості');
zp('Вмілості', { "Ім'я": 'Дана', 'Вмілість': 'Шиття', 'Статус': 'працює' });
x = zp('Вмілості', { "Ім'я": 'Дана', 'Вмілість': 'шиття', 'Статус': 'здобуто', 'Дата здобуття': '2026-11-01' });
zp('Вмілості', { "Ім'я": 'Дана', 'Вмілість': 'Писанкарство', 'Статус': 'працює' });
ok(x.onovleno && cnt('Вмілості') === vmil0 + 2, 'вмілості: одна вмілість — один рядок; друга вмілість тієї ж людини — окремий');
// ---- 3.5: вмілості й нашивки ----
x = zp('Вмілості', { "Ім'я": 'Зоряна', 'Вмілість': 'Вишивання', 'Виконано точок': '7', 'Усього точок': '6', 'Статус': 'працює' });
ok(!x.ok && /більше/.test(x.pomylka), 'вмілості: виконано більше, ніж усього — не приймається');
x = zp('Вмілості', { "Ім'я": 'Зоряна', 'Вмілість': 'Вишивання', 'Виконано точок': 'три', 'Статус': 'працює' });
ok(!x.ok && /цілі числа/.test(x.pomylka), 'вмілості: «три» замість числа — не приймається');
x = zp('Вмілості', { "Ім'я": 'Зоряна', 'Вмілість': 'Вишивання', 'Виконано точок': '6', 'Усього точок': '6', 'Статус': 'здобуто' });
ok(!x.ok && /дату здобуття/.test(x.pomylka), 'вмілості: здобуто без дати здобуття — не приймається');
x = zp('Вмілості', { "Ім'я": 'Зоряна', 'Вмілість': 'Вузлування', 'Статус': 'здобуто', 'Нашивку не замовляти (вже має)': 'так' });
ok(!x.ok && /Примітці/.test(x.pomylka), 'перевідна вмілість без дати — потрібна примітка, звідки');
x = zp('Вмілості', { "Ім'я": 'Зоряна', 'Вмілість': 'Вузлування', 'Статус': 'здобуто', 'Нашивку не замовляти (вже має)': 'так', 'Примітка': 'здобула в гуртку в Києві' });
ok(x.ok, 'перевідна вмілість без дати, з приміткою — приймається');
x = zp('Вмілості', { "Ім'я": 'Зоряна', 'Вмілість': 'Вишивання', 'Статус': 'працює', 'Вручено': '2026-11-02' });
ok(!x.ok && /лише за здобуту/.test(x.pomylka), 'вмілості: нашивку не вручають за нездобуту');
const zapas = () => sheets['Запас']._f.slice(3).map(r => r[0]).filter(Boolean);
const zp0 = zapas().length;
x = zp('Вмілості', { "Ім'я": 'Зоряна', 'Вмілість': 'Флористика', 'Виконано точок': '1', 'Усього точок': '5', 'Остання точка': '2026-11-03', 'Статус': 'працює' });
ok(x.ok && zapas().includes('Флористика') && zapas().length === zp0 + 1, 'нова вмілість — назва сама в «Запасі»');
zp('Вмілості', { "Ім'я": 'Остап', 'Вмілість': 'флористика', 'Статус': 'працює' });
ok(zapas().length === zp0 + 1, 'та сама назва іншими літерами — у «Запасі» не дублюється');
const rFl = x.ryadok;
const JPG = Buffer.concat([Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), Buffer.alloc(300, 7)]).toString('base64');
x = post({ kod: J, dija: 'kopiia', ryadok: rFl, fail: JPG, typ: 'image/jpeg', khto: 'Ярко' });
ok(!x.ok && /здобуто/.test(x.pomylka), 'копія посвідки — лише до здобутої вмілості');
zp('Вмілості', { "Ім'я": 'Зоряна', 'Вмілість': 'Флористика', 'Виконано точок': '5', 'Усього точок': '5', 'Статус': 'здобуто', 'Дата здобуття': '2026-11-05' });
x = post({ kod: J, dija: 'kopiia', ryadok: rFl, fail: 'JVBERi0xLjQK' + Buffer.alloc(300, 65).toString('base64'), typ: 'image/jpeg' });
ok(!x.ok, 'копія: PDF під виглядом JPEG — не приймається');
x = post({ kod: J, dija: 'kopiia', ryadok: rFl, fail: Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(300, 65)]).toString('base64'), typ: 'application/pdf', khto: 'Ярко' });
const zagV = sheets['Вмілості']._f[2], ck = zagV.indexOf('Копія посвідки');
ok(x.ok && /drive\.google\.com/.test(sheets['Вмілості']._f[rFl - 1][ck]), 'копія посвідки (PDF) — на Диску, посилання в книзі');
ok(Object.values(drive.files).some(f => f.name === 'Зоряна — Флористика — 2026-11-05.pdf'), 'назва файлу: ім\'я — вмілість — дата');
x = post({ kod: J, dija: 'stan', arkush: 'Вмілості', dani: { "Ім'я": 'Зоряна', 'Вмілість': 'Флористика' } });
ok(x.ok && x.dani['Копія посвідки'] === 'є' && !JSON.stringify(x).includes('drive.google'), 'stan: копія — лише «є», посилання сайт не бачить');
x = zp('Вмілості', { "Ім'я": 'Зоряна', 'Вмілість': 'Флористика', 'Виконано точок': '5', 'Усього точок': '5', 'Статус': 'здобуто', 'Дата здобуття': '2026-11-05', 'Примітка': 'ок' });
ok(/drive\.google\.com/.test(sheets['Вмілості']._f[rFl - 1][ck]), 'оновлення рядка копію не стирає');
x = post({ kod: J, dija: 'kopiia', ryadok: rFl, fail: JPG, typ: 'image/jpeg', khto: 'Ярко' });
ok(x.ok && x.kilkist === 2 && sheets['Вмілості']._f[rFl - 1][ck].split('\n').length === 2 && Object.values(drive.files).some(f => f.name === 'Зоряна — Флористика — 2026-11-05 (2).jpg'), 'друга копія (бланк вимог) — додається, перша лишається');
x = post({ kod: J, dija: 'vmilosti' }); if (!x.ok) console.log('vmilosti:', x);
const ker = x.ok && x.nashyvky.find(n => n.n === 'Кераміка'), vys = x.ok && x.nashyvky.find(n => n.n === 'Вишивання');
ok(x.ok && x.ryadky.length >= 12 && ker && ker.otr === 3 && vys && vys.dor === 2, 'огляд вмілостей: рядки, нашивки (Кераміка отримано 3, Вишивання в дорозі 2)');
ok(x.porohy.maizhe === 2 && x.porohy.chasN === 5 && x.porohy.chasDniv === 60, 'огляд: пороги з «Налаштувань»');
ok(!JSON.stringify(x).includes('Бондар') && !JSON.stringify(x).includes('drive.google'), 'огляд: без прізвищ і без посилань');
ok(x.ryadky.find(r => r.im === 'Зоряна' && r.vm === 'Флористика').kopiia === true, 'огляд: видно, що копія є');
let vd0 = cnt('Відзначки');
zp('Відзначки', { "Ім'я": 'Ярко', 'Відзнака': 'нашивка табору', 'Вид': 'табір', 'Статус': 'потрібна' });
x = zp('Відзначки', { "Ім'я": 'Ярко', 'Відзнака': 'нашивка табору', 'Вид': 'табір', 'Статус': 'вручено' });
ok(x.onovleno && cnt('Відзначки') === vd0 + 1, 'відзначки: та сама відзнака — той самий рядок');
let zv0 = cnt('Завдання');
zp('Завдання', { 'Завдання': 'Список виряду', 'Відповідальний': 'Дана', 'Статус': 'нове' });
x = zp('Завдання', { 'Завдання': 'список виряду ', 'Відповідальний': 'Дана', 'Статус': 'зроблено' });
ok(x.onovleno && cnt('Завдання') === zv0 + 1, 'завдання: те саме завдання — той самий рядок');
sp = post({ kod: J, dija: 'spysok', arkush: 'Завдання' });
ok(sp.ok && sp.spysok.some(s => s.trim().toLowerCase() === 'список виряду'), 'spysok: завдання видаються як підказка (' + JSON.stringify(sp) + ')');
let zm0 = cnt('Замовлення');
zp('Замовлення', { '№ замовлення': '2026-1', 'Відзнака': 'нашивка А', 'Кількість': '5', 'Статус': 'замовлено' });
zp('Замовлення', { '№ замовлення': '2026-1', 'Відзнака': 'нашивка Б', 'Кількість': '3', 'Статус': 'замовлено' });
x = zp('Замовлення', { '№ замовлення': '2026-1', 'Відзнака': 'нашивка А', 'Кількість': '5', 'Статус': 'отримано' });
ok(x.onovleno && cnt('Замовлення') === zm0 + 2, 'замовлення: один номер — кілька позицій; та сама позиція — той самий рядок');
let md0 = cnt('Мандрівки');
zp('Мандрівки', { 'Дата': '2026-10-10', 'Назва': 'Осінній похід', 'Вид': 'мандрівка' });
x = zp('Мандрівки', { 'Дата': '2026-10-10', 'Назва': 'осінній похід', 'Вид': 'мандрівка', 'Підсумок': 'пройшли 8 км' });
zp('Мандрівки', { 'Дата': '2026-10-10', 'Назва': 'Вечірній збір', 'Вид': 'акція' });
ok(x.onovleno && cnt('Мандрівки') === md0 + 2, 'мандрівки: дата + назва — ключ; інша подія того ж дня — окремий рядок');
x = post({ kod: J, dija: 'nazvy' });
ok(x.ok && x.nazvy.some(n => n.toLowerCase() === 'шиття') && x.nazvy.includes('нашивка А') && x.nazvy.includes('нашивка Б'), 'nazvy: назви з Вмілостей і Замовлень (' + x.nazvy.length + ')');
ok(x.ok && new Set(x.nazvy.map(n => n.toLowerCase())).size === x.nazvy.length && !x.nazvy.includes('Дана') && !x.nazvy.includes('Олесь'), 'nazvy: без повторів і без імен людей');
let pl0 = cnt('План праці');
zp('План праці', { 'Період': 'рік', 'Коли (місяць/квартал)': '2026/27', 'Ціль / тема': 'Весняний табір', 'Статус': 'нове' });
x = zp('План праці', { 'Період': 'рік', 'Коли (місяць/квартал)': '2026/27', 'Ціль / тема': 'весняний табір', 'Статус': 'в роботі' });
ok(x.onovleno && cnt('План праці') === pl0 + 1, 'план праці: та сама ціль того ж періоду — той самий рядок');
// ---- Каса: кілька рядків за раз (сайт шле по одному, кожен — свій квиток) ----
const fN = () => sheets['Фінанси']._f.slice(3).filter(r => r[0] instanceof Date).length, f0 = fN();
const kv = ['Олесь', 'Дана', 'Ярко'].map((im, i) => post({ kod: J, dija: 'zapys', arkush: 'Фінанси', khto: 'Дана', dani: { 'Дата': '2026-11-07', 'Рух': 'надходження', 'Категорія': 'внески', 'Опис': 'внесок за листопад', "Хто (ім'я)": im, 'Сума, €': '5', 'Квитанція №': 'К-' + (10 + i), 'Внесок': 'Осінь 2026' } }));
ok(kv.every(r => r.ok && r.kvytok) && fN() === f0 + 3, 'каса: 3 внески за одну дату — 3 рядки, у кожного свій квиток');
ok(post({ kod: J, dija: 'vypravyty', kvytok: kv[1].kvytok, khto: 'Дана', dani: { 'Дата': '2026-11-07', 'Рух': 'надходження', 'Категорія': 'внески', 'Опис': 'внесок за листопад', "Хто (ім'я)": 'Дана', 'Сума, €': '7', 'Квитанція №': 'К-11', 'Внесок': 'Осінь 2026' } }).ok
   && sheets['Фінанси']._f[kv[1].ryadok - 1][5] === 7 && sheets['Фінанси']._f[kv[0].ryadok - 1][5] === 5, 'каса: виправлено один рядок, сусідні не зачеплено');
ok(post({ kod: J, dija: 'skasuvaty', kvytok: kv[2].kvytok, khto: 'Дана' }).ok && fN() === f0 + 2, 'каса: скасовано один рядок');
// ---- Каса: що записано за день; виправити будь-який незатверджений рядок за номером і відбитком ----
const kz = (d) => ({ 'Дата': '2026-11-07', 'Рух': 'надходження', 'Категорія': 'внески', 'Опис': 'внесок', "Хто (ім'я)": 'Олесь', 'Сума, €': '10', 'Внесок': 'Осінь 2026', ...d });
ok(!post({ kod: J, dija: 'zapys', arkush: 'Фінанси', khto: 'Дана', dani: kz({ 'Сума, €': '-5' }) }).ok, 'каса: від\'ємну суму не прийнято');
ok(!post({ kod: J, dija: 'zapys', arkush: 'Фінанси', khto: 'Дана', dani: kz({ 'Сума, €': '0' }) }).ok, 'каса: нуль не прийнято');
ok(!post({ kod: J, dija: 'zapys', arkush: 'Фінанси', khto: 'Дана', dani: kz({ 'Сума, €': '10.555' }) }).ok, 'каса: більше двох знаків після коми — ні');
ok(!post({ kod: J, dija: 'zapys', arkush: 'Фінанси', khto: 'Дана', dani: kz({ 'Рух': 'щось' }) }).ok, 'каса: незнаний «Рух» не прийнято');
let dn = post({ kod: J, dija: 'den', arkush: 'Фінанси', dani: { 'Дата': '2026-11-07' } });
ok(dn.ok && dn.ryadky.length === 2 && dn.ryadky.every(r => r.versiya && r.ryadok) && dn.ryadky[1].dani['Сума, €'] === 7, 'den: за 07.11 — 2 рядки з номером і відбитком');
ok(!post({ kod: J, dija: 'den', arkush: 'Учасники', dani: { 'Дата': '2026-11-07' } }).ok, 'den: інші аркуші — ні');
const r0 = dn.ryadky[0];
x = post({ kod: J, dija: 'zapys', arkush: 'Фінанси', khto: 'Ярко', dani: kz({ 'Сума, €': '10', 'Як платили': 'MobilePay' }) });
ok(x.ok && fN() === f0 + 3 && sheets['Фінанси']._f[x.ryadok - 1][7] === 'MobilePay' && sheets['Фінанси']._f[x.ryadok - 1][8] === 'Осінь 2026', 'каса: другий платіж тієї самої людини — новий рядок; «Як платили» — свій стовпець');
x = post({ kod: J, dija: 'vypravyty', arkush: 'Фінанси', ryadok: r0.ryadok, versiya: r0.versiya, khto: 'Ярко', dani: Object.assign({}, r0.dani, { 'Сума, €': '15' }) });
ok(x.ok && sheets['Фінанси']._f[r0.ryadok - 1][5] === 15 && x.versiya && x.versiya !== r0.versiya, 'каса: інший діловод виправив старий рядок за номером');
x = post({ kod: J, dija: 'vypravyty', arkush: 'Фінанси', ryadok: r0.ryadok, versiya: r0.versiya, khto: 'Дана', dani: Object.assign({}, r0.dani, { 'Сума, €': '99' }) });
ok(!x.ok && x.zastarilo && sheets['Фінанси']._f[r0.ryadok - 1][5] === 15, 'каса: стара версія рядка — зміна не пройшла (чужу не затерти)');
ok(!post({ kod: J, dija: 'vypravyty', arkush: 'Сходини', ryadok: 11, versiya: 'x', dani: { 'Тема': 'x' } }).ok, 'за номером — лише каса');
sheets['Фінанси']._f[r0.ryadok - 1][14] = 'так';
dn = post({ kod: J, dija: 'den', arkush: 'Фінанси', dani: { 'Дата': '2026-11-07' } });
const r1 = dn.ryadky.find(r => r.ryadok === r0.ryadok);
ok(r1.zatverdzheno && !post({ kod: J, dija: 'skasuvaty', arkush: 'Фінанси', ryadok: r1.ryadok, versiya: r1.versiya, khto: 'Дана' }).ok, 'каса: затверджений рядок не скасувати');
sheets['Фінанси']._f[r0.ryadok - 1][14] = '';
dn = post({ kod: J, dija: 'den', arkush: 'Фінанси', dani: { 'Дата': '2026-11-07' } });
const r2 = dn.ryadky.find(r => r.ryadok === r0.ryadok);
ok(post({ kod: J, dija: 'skasuvaty', arkush: 'Фінанси', ryadok: r2.ryadok, versiya: r2.versiya, khto: 'Дана' }).ok && fN() === f0 + 2, 'каса: скасовано за номером');
// ---- Внески: скільки треба, хто скільки сплатив ----
let vn = post({ kod: J, dija: 'vnesky' });
ok(vn.ok && vn.vnesky.length === 1 && vn.vnesky[0].n === 'Осінь 2026' && vn.vnesky[0].suma === 20 && vn.vnesky[0].osobl['Остап'] === 10, 'vnesky: «Осінь 2026» 20 €, Остапу — 10 €');
ok(vn.splacheno['Мирося']['Осінь 2026'] === 10, 'vnesky: Мирося сплатила 10 з 20');
const vz = (d) => ({ 'Дата': '2026-11-08', 'Рух': 'надходження', 'Категорія': 'внески', 'Опис': 'внесок', "Хто (ім'я)": 'Мирося', 'Сума, €': '10', 'Як платили': 'MobilePay', 'Внесок': 'Осінь 2026', ...d });
ok(!post({ kod: J, dija: 'zapys', arkush: 'Фінанси', khto: 'Дана', dani: vz({ 'Внесок': '' }) }).ok, 'внесок без «За який внесок» — не прийнято (є внески в книзі)');
ok(!post({ kod: J, dija: 'zapys', arkush: 'Фінанси', khto: 'Дана', dani: vz({ 'Внесок': 'Вигаданий' }) }).ok, 'незнаний внесок — не прийнято');
ok(post({ kod: J, dija: 'zapys', arkush: 'Фінанси', khto: 'Дана', dani: vz({}) }).ok, 'Мирося доплатила 10 € через MobilePay');
vn = post({ kod: J, dija: 'vnesky' });
ok(vn.splacheno['Мирося']['Осінь 2026'] === 20, 'vnesky: Мирося — 20 з 20, сплачено повністю');
ok(post({ kod: J, dija: 'zapys', arkush: 'Фінанси', khto: 'Дана', dani: vz({ 'Рух': 'видаток', 'Категорія': 'інше', 'Опис': 'повернення переплати', 'Сума, €': '5' }) }).ok
   && post({ kod: J, dija: 'vnesky' }).splacheno['Мирося']['Осінь 2026'] === 15, 'повернення (видаток із внеском) зменшує сплачене');
ok(JSON.stringify(ctx.osoblyvi('Остап 10; Дана: 0\nЯрко — 12,50 €')) === JSON.stringify({ 'Остап': 10, 'Дана': 0, 'Ярко': 12.5 }), 'особливі суми розпізнано');
// ---- Каса: звірка (перевірене окремо, де гроші, «ні», звірка, на рахунок) ----
const FN = () => sheets['Фінанси']._f.slice(3).map((r, i) => ({ r, n: i + 4 })).filter(x => x.r[0] !== '' && x.r[0] !== undefined);
const rakh = sp => FN().filter(x => sp(x.r[7])).reduce((a, x) => a + (x.r[1] === 'надходження' ? +x.r[5] : x.r[1] === 'видаток' ? -x.r[5] : 0), 0);
vn = post({ kod: J, dija: 'vnesky' });
ok(vn.perevireno && !(vn.perevireno['Мирося'] && vn.perevireno['Мирося']['Осінь 2026'] >= 20) && vn.splacheno['Мирося']['Осінь 2026'] === 15, 'vnesky: перевірене окремо — Мирося записано 15, перевірено менше (' + JSON.stringify(vn.perevireno['Мирося'] || {}) + ')');
let hr = post({ kod: J, dija: 'hroshi' });
ok(hr.ok && Math.abs(hr.gotivka - rakh(y => y === 'готівка')) < 0.01 && Math.abs(hr.rakhunok - rakh(y => ['MobilePay', 'переказ', 'картка'].includes(y))) < 0.01, `hroshi: готівкою ${hr.gotivka}, на рахунку ${hr.rakhunok}, не вказано ${hr.nevkazano}`);
ok(Math.abs(hr.razom - rakh(y => y !== 'свої гроші')) < 0.01 && hr.chekaiut > 0, 'hroshi: разом = залишок каси; чекають перевірки: ' + hr.chekaiut);
ok(!post({ kod: '2468', dija: 'kasa' }).ok && !post({ kod: '2468', dija: 'zvirka', shcho: 'готівка', ye: '1' }).ok && !post({ kod: '2468', dija: 'nakhunok', suma: '1' }).ok, 'kasa / zvirka / nakhunok з кодом юнаків — ні');
ok(post({ kod: '2468', dija: 'hroshi' }).ok, 'hroshi — і юнакам (лише суми)');
let ks = post({ kod: K, dija: 'kasa' });
ok(ks.ok && ks.ryadky.length === hr.chekaiut && ks.ryadky.every(x => x.versiya && x.sposib) && ks.hroshi.razom === hr.razom && ks.zvirky.length === 1, 'kasa: неперевірені рядки (' + ks.ryadky.length + '), гроші, звірки');
const mPay = ks.ryadky.find(x => x.dani['Як платили'] === 'MobilePay' && x.dani["Хто (ім'я)"] === 'Мирося');
x = post({ kod: K, dija: 'zatverdyty', arkush: 'Фінанси', ryadok: mPay.ryadok, znach: 'так' });
vn = post({ kod: J, dija: 'vnesky' });
ok(x.ok && x.zatverdzheno && sheets['Фінанси']._f[mPay.ryadok - 1][14] === 'так' && (vn.perevireno['Мирося'] || {})['Осінь 2026'] >= 10, '«✓ є в банку» → перевірено, рахується в ✓');
const inshyi = post({ kod: K, dija: 'kasa' }).ryadky.find(x => x.ryadok !== mPay.ryadok && x.dani['Рух'] === 'надходження');
x = post({ kod: K, dija: 'zatverdyty', arkush: 'Фінанси', ryadok: inshyi.ryadok, znach: 'ні' });
ok(x.ok && x.ne && sheets['Фінанси']._f[inshyi.ryadok - 1][14] === 'ні' && zm().some(z => z[1] === 'немає'), '«✗ немає» → «ні», у «Змінах» — «немає»');
ok(post({ kod: K, dija: 'hroshi' }).ne === 1 && post({ kod: K, dija: 'kasa' }).ryadky.some(x => x.ryadok === inshyi.ryadok && x.ne), '«ні» лишається в «Перевірці каси»');
ok(!post({ kod: K, dija: 'zatverdyty', arkush: 'Фінанси', ryadok: inshyi.ryadok, znach: 'може' }).ok, 'незнана позначка — ні');
const dI = post({ kod: J, dija: 'den', arkush: 'Фінанси', dani: { 'Дата': inshyi.dani['Дата'] } }).ryadky.find(x => x.ryadok === inshyi.ryadok);
ok(dI && dI.ne && !dI.zatverdzheno, 'den: діловод бачить «не знайдено»');
x = post({ kod: J, dija: 'vypravyty', arkush: 'Фінанси', ryadok: dI.ryadok, versiya: dI.versiya, khto: 'Дана', dani: Object.assign({}, dI.dani, { 'Примітка': 'сума була інша' }) });
ok(x.ok && sheets['Фінанси']._f[inshyi.ryadok - 1][14] === '', 'діловод виправив «ні» → знову чекає перевірки');
ok(post({ kod: K, dija: 'zatverdyty', arkush: 'Сходини', ryadok: 11, tak: true }).ok, 'старе «tak» теж працює');
hr = post({ kod: K, dija: 'hroshi' });
x = post({ kod: K, dija: 'zvirka', shcho: 'готівка', ye: String(hr.gotivka - 2).replace('.', ','), prymitka: 'бракує 2 €' });
const zvR = sheets['Звірки']._f[x.ryadok - 1];
ok(x.ok && x.malo === hr.gotivka && x.riznytsia === -2 && zvR[1] === 'готівка' && zvR[2] === hr.gotivka && String(zvR[4]).startsWith('='), 'звірка готівки: мало ' + hr.gotivka + ', є на 2 менше → різниця −2, формула «Різниця» ціла');
ok(!post({ kod: K, dija: 'zvirka', shcho: 'готівка', ye: 'багато' }).ok && !post({ kod: K, dija: 'zvirka', shcho: 'коробка', ye: '1' }).ok, 'звірка: незрозуміле число чи «що» — ні');
ok(post({ kod: K, dija: 'zvirka', shcho: 'рахунок', ye: String(hr.rakhunok) }).riznytsia === 0, 'звірка рахунку: збігається');
ok(!post({ kod: K, dija: 'nakhunok', suma: String(hr.gotivka + 100) }).ok, 'на рахунок більше, ніж є готівкою, — ні');
const fx = FN().length;
x = post({ kod: K, dija: 'nakhunok', suma: '5', prymitka: 'банкомат' });
const pr2 = x.ryadky ? x.ryadky.map(n => sheets['Фінанси']._f[n - 1]) : [];
ok(x.ok && FN().length === fx + 2 && pr2.every(r => r[2] === 'переміщення' && r[5] === 5 && r[14] === 'так') && Math.abs(x.hroshi.gotivka - (hr.gotivka - 5)) < 0.01 && Math.abs(x.hroshi.rakhunok - (hr.rakhunok + 5)) < 0.01 && x.hroshi.razom === hr.razom, 'на рахунок 5 €: два рядки «переміщення», готівки −5, рахунку +5, разом те саме');
ok(!post({ kod: J, dija: 'zapys', arkush: 'Фінанси', khto: 'Дана', dani: vz({ 'Категорія': 'переміщення', 'Внесок': '', "Хто (ім'я)": '' }) }).ok, '«переміщення» з форми каси — не прийнято (лише виховник)');
// ---- фото чека ----
const jpg = Buffer.concat([Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), Buffer.alloc(300, 7)]).toString('base64');
const vyd = FN().find(x => x.r[1] === 'видаток' && x.r[14] !== 'так');
const CF = sheets['Фінанси']._f[2].indexOf('Фото чека');
ok(CF === 11 && sheets['Фінанси']._f[2][14] === 'Перевірено виховником', 'книга: «Фото чека» — стовпець L, «Перевірено» — останній');
const fz0 = Object.keys(drive.files).length;   // копії посвідок уже є
let ft = post({ kod: J, dija: 'foto', ryadok: vyd.n, foto: jpg, khto: 'Дана' });
const f1url = sheets['Фінанси']._f[vyd.n - 1][CF];
ok(ft.ok && /drive\.google\.com/.test(f1url) && Object.keys(drive.files).length === fz0 + 1 && /рядок/.test(Object.values(drive.files)[fz0].name), 'фото чека: файл у Диску, посилання в книзі (' + Object.values(drive.files)[fz0].name + ')');
ok(zm().some(z => z[1] === 'фото чека'), '«Зміни»: фото чека');
ok(!post({ kod: J, dija: 'foto', ryadok: vyd.n, foto: Buffer.from('просто текст, не фото — довше ста байтів '.repeat(5)).toString('base64') }).ok, 'не JPEG — відмова');
ok(!post({ kod: J, dija: 'foto', ryadok: vyd.n, foto: 'A'.repeat(5 * 1024 * 1024) }).ok, 'завелике — відмова');
ft = post({ kod: J, dija: 'foto', ryadok: vyd.n, foto: jpg, khto: 'Дана' });
ok(ft.ok && Object.values(drive.files).filter(f => f.trashed).length === 1 && sheets['Фінанси']._f[vyd.n - 1][CF] !== f1url, 'заміна фото (неперевірений рядок): старе — у кошик');
let dv = post({ kod: J, dija: 'den', arkush: 'Фінанси', dani: { 'Дата': (d => d.toISOString().slice(0, 10))(new Date(vyd.r[0].getTime() - vyd.r[0].getTimezoneOffset() * 60000)) } }).ryadky.find(x => x.ryadok === vyd.n);
x = post({ kod: J, dija: 'vypravyty', arkush: 'Фінанси', ryadok: vyd.n, versiya: dv.versiya, khto: 'Дана', dani: Object.assign({}, dv.dani, { 'Фото чека': 'https://zlo.example/x', 'Примітка': 'уточнено' }) });
ok(x.ok && sheets['Фінанси']._f[vyd.n - 1][CF] === ft.url, 'виправлення рядка фото не стирає й чужого посилання не підставляє');
ok(!post({ kod: J, dija: 'zapys', arkush: 'Фінанси', khto: 'Дана', dani: { 'Дата': '2026-11-09', 'Рух': 'видаток', 'Категорія': 'інше', 'Опис': 'x', 'Сума, €': '1', 'Як платили': 'картка', 'Фото чека': 'https://zlo.example' } }).ryadok || sheets['Фінанси']._f[FN().slice(-1)[0].n - 1][CF] === '', 'новий запис: посилання на фото з форми не приймається');
sheets['Фінанси']._f[vyd.n - 1][14] = 'так';
ok(!post({ kod: J, dija: 'foto', ryadok: vyd.n, foto: jpg }).ok, 'перевірений рядок із фото — замінити з сайту не можна');
hr = post({ kod: J, dija: 'hroshi' });
ok(hr.cheky.includes('Ч-1') && hr.cheky.includes('Ч-3') && hr.nastupnyiChek === 'Ч-4', 'номери чеків: ' + hr.cheky.join(', ') + ' → наступний ' + hr.nastupnyiChek);

// ---- свої гроші: борги, повернення, заокруглення ----
const zFin = d => post({ kod: J, dija: 'zapys', arkush: 'Фінанси', khto: 'Соломія', dani: Object.assign({ 'Дата': '2026-11-09', 'Рух': 'видаток', 'Категорія': 'матеріали для сходин', 'Опис': 'клей', 'Сума, €': '3' }, d) });
let hb = post({ kod: J, dija: 'hroshi' });
ok(hb.borhy['Соломія'] === 6.4 && hb.bezCheka['Соломія'].length === 1 && hb.vynen === 6.4, 'свої гроші з прикладу: гурток винен Соломії 6,40, чека ще немає');
ok(Math.abs(hb.vilni - (hb.razom - 6.4)) < 0.01, 'вільні гроші = разом − борги: ' + hb.vilni);
let pv = post({ kod: J, dija: 'povernuty', imya: 'Соломія', suma: '7', yak: 'готівка', zaokr: true, khto: 'Дана' });
ok(!pv.ok && /чека/.test(pv.pomylka) && pv.bezCheka.length === 1, 'без фото чека не повертаємо: ' + pv.pomylka);
ok(!zFin({ 'Як платили': 'свої гроші' }).ok, 'свої гроші без імені — не прийнято');
ok(!zFin({ 'Рух': 'надходження', 'Як платили': 'свої гроші', "Хто (ім'я)": 'Остап' }).ok, 'свої гроші як надходження — не прийнято');
ok(!zFin({ 'Категорія': 'повернення', "Хто (ім'я)": 'Остап', 'Як платили': 'готівка' }).ok, '«повернення» з форми — не прийнято (лише кнопка)');
ok(!zFin({ 'Рух': 'надходження', 'Категорія': 'повернення боргу', 'Як платили': 'готівка' }).ok, 'повернення боргу без імені — не прийнято');
const solR = FN().find(x => x.r[7] === 'свої гроші' && x.r[4] === 'Соломія').n;
ok(post({ kod: J, dija: 'foto', ryadok: solR, foto: jpg, khto: 'Соломія' }).ok, 'фото чека до «своїх грошей» Соломії');
const gt0 = post({ kod: J, dija: 'hroshi' }), nF0 = FN().length;
pv = post({ kod: J, dija: 'povernuty', imya: 'Соломія', suma: '7', yak: 'готівка', zaokr: true, khto: 'Дана' });
let gP = pv.hroshi;
ok(pv.ok && pv.ryadky.length === 2 && FN().length === nF0 + 2 && pv.zalyshok === 0 && !gP.borhy['Соломія'], 'повернули 7 € замість 6,40 + заокруглення: борг 0, два рядки');
ok(Math.abs(gP.gotivka - (gt0.gotivka - 7)) < 0.01 && Math.abs(gP.razom - (gt0.razom - 7)) < 0.01, 'з коробки пішло 7 €; разом у касі −7');
const zr = FN().find(x => x.r[2] === 'заокруглення'); ok(zr && zr.r[1] === 'видаток' && zr.r[5] === 0.6 && zr.r[7] === 'свої гроші' && zr.r[4] === 'Соломія', 'рядок «заокруглення» 0,60 € (видаток)');
ok(sheets['Фінанси']._f[pv.ryadky[0] - 1][14] !== 'так', 'повернення скарбника чекає перевірки виховника');
let q2 = zFin({ 'Як платили': 'свої гроші', "Хто (ім'я)": 'Остап', 'Сума, €': '14,50' });
ok(q2.ok, 'Остап купив за свої 14,50');
post({ kod: J, dija: 'foto', ryadok: q2.ryadok, foto: jpg, khto: 'Остап' });
pv = post({ kod: J, dija: 'povernuty', imya: 'Остап', suma: '14', yak: 'переказ', zaokr: false, khto: 'Дана' });
ok(pv.ok && pv.ryadky.length === 1 && pv.zalyshok === 0.5, 'повернули 14 замість 14,50, без заокруглення: гурток ще винен 0,50');
ok(!post({ kod: J, dija: 'povernuty', imya: 'Остап', suma: '1', yak: 'чек', khto: 'Дана' }).ok, 'спосіб повернення — лише готівка / переказ / MobilePay');
pv = post({ kod: K, dija: 'povernuty', imya: 'Остап', suma: '1', yak: 'MobilePay', zaokr: false });
ok(pv.ok && pv.zalyshok === -0.5 && sheets['Фінанси']._f[pv.ryadky[0] - 1][14] === 'так', 'виховник повернув 1 € (переплата): Остап винен гуртку 0,50; рядок виховника — перевірено');
ok(!post({ kod: J, dija: 'povernuty', imya: 'Остап', suma: '1', yak: 'готівка' }).ok, 'кому гурток не винен — повернути не можна');
ok(zFin({ 'Рух': 'надходження', 'Категорія': 'повернення боргу', "Хто (ім'я)": 'Остап', 'Сума, €': '0,50', 'Як платили': 'готівка', 'Опис': 'повернення боргу' }).ok, 'Остап повернув гуртку 0,50 (форма)');
hb = post({ kod: J, dija: 'hroshi' });
ok(!hb.borhy['Остап'] && hb.vynen === 0, 'Остап розрахувався — боргів немає');
ok(!post({ kod: J, dija: 'povernuty', imya: 'Соломія', suma: '1000', yak: 'готівка' }).ok, 'більше готівки, ніж у коробці, — не віддати');

// ---- залік: борг ↔ внесок, без грошей ----
const VN0 = ctx.stanVnesku('Зоряна', 'Осінь 2026');
ok(VN0 && VN0.brak > 4, 'Зоряні бракує за «Осінь 2026»: ' + (VN0 && VN0.brak));
const qz = zFin({ 'Як платили': 'свої гроші', "Хто (ім'я)": 'Зоряна', 'Сума, €': '4' }); ok(qz.ok, 'Зоряна купила за свої 4 €');
ok(!post({ kod: J, dija: 'zalik', imya: 'Зоряна', vnesok: 'Осінь 2026', kudy: 'vnesok' }).ok, 'без фото чека — не зараховуємо');
post({ kod: J, dija: 'foto', ryadok: qz.ryadok, foto: jpg, khto: 'Зоряна' });
ok(!zFin({ 'Рух': 'надходження', 'Категорія': 'внески', 'Внесок': 'Осінь 2026', 'Як платили': 'свої гроші', "Хто (ім'я)": 'Зоряна' }).ok, 'залік з форми — не прийнято (лише кнопка)');
const gz0 = post({ kod: J, dija: 'hroshi' });
let zl = post({ kod: J, dija: 'zalik', imya: 'Зоряна', vnesok: 'Осінь 2026', kudy: 'vnesok', khto: 'Дана' });
ok(zl.ok && zl.suma === 4 && zl.borh === 0 && zl.brak === VN0.brak - 4, 'залік: борг гуртка 4 € → у внесок Зоряни; бракує тепер ' + zl.brak);
const gz1 = post({ kod: J, dija: 'hroshi' });
ok(gz1.razom === gz0.razom && !gz1.borhy['Зоряна'], 'залік гроші в касі не змінив, борг Зоряни — 0');
ok(!post({ kod: J, dija: 'zalik', imya: 'Зоряна', vnesok: 'Осінь 2026', kudy: 'vnesok' }).ok, 'повторний залік — нічого зараховувати');
// переплата: Олесь заплатив за осінь більше, ніж треба
const so = ctx.stanVnesku('Олесь', 'Осінь 2026');
ok(post({ kod: J, dija: 'zapys', arkush: 'Фінанси', khto: 'Дана', dani: { 'Дата': '2026-11-09', 'Рух': 'надходження', 'Категорія': 'внески', 'Опис': 'внесок', "Хто (ім'я)": 'Олесь', 'Внесок': 'Осінь 2026', 'Сума, €': String(so.brak + 3), 'Як платили': 'переказ' } }).ok, 'Олесь переплатив внесок на 3 €');
ok(!post({ kod: J, dija: 'zalik', imya: 'Олесь', vnesok: 'Осінь 2026', kudy: 'borh', suma: '5' }).ok, 'зарахувати більше за переплату — не можна');
zl = post({ kod: J, dija: 'zalik', imya: 'Олесь', vnesok: 'Осінь 2026', kudy: 'borh', khto: 'Дана' });
ok(zl.ok && zl.suma === 3 && zl.borh === 3 && zl.brak === 0, 'переплата 3 € → гурток винен Олесю 3 €, внесок рівно сплачено');
pv = post({ kod: J, dija: 'povernuty', imya: 'Олесь', suma: '3', yak: 'переказ', khto: 'Дана' });
ok(pv.ok && pv.zalyshok === 0, 'переплату повернули (без чека можна — це не покупка)');
// людина винна гуртку → платить внесок більше, зайве — у борг
const qd = zFin({ 'Як платили': 'свої гроші', "Хто (ім'я)": 'Дана', 'Сума, €': '5' }); post({ kod: J, dija: 'foto', ryadok: qd.ryadok, foto: jpg, khto: 'Дана' });
ok(post({ kod: K, dija: 'povernuty', imya: 'Дана', suma: '7', yak: 'переказ', zaokr: false }).ok && post({ kod: J, dija: 'hroshi' }).borhy['Дана'] === -2, 'Дані віддали 7 замість 5: Дана винна гуртку 2 €');
const sd = ctx.stanVnesku('Дана', 'Осінь 2026');
ok(post({ kod: J, dija: 'zapys', arkush: 'Фінанси', khto: 'Дана', dani: { 'Дата': '2026-11-09', 'Рух': 'надходження', 'Категорія': 'внески', 'Опис': 'внесок + борг', "Хто (ім'я)": 'Дана', 'Внесок': 'Осінь 2026', 'Сума, €': String(sd.brak + 2), 'Як платили': 'готівка' } }).ok, 'Дана платить внесок на 2 € більше');
zl = post({ kod: J, dija: 'zalik', imya: 'Дана', vnesok: 'Осінь 2026', kudy: 'borh', khto: 'Дана' });
ok(zl.ok && zl.suma === 2 && zl.borh === 0 && zl.brak === 0, 'зайві 2 € пішли в борг Дани → розраховано, внесок сплачено');
ok(!post({ kod: J, dija: 'spysaty', imya: 'Дана' }).ok, 'списати борг може лише виховник');
ok(zFin({ 'Як платили': 'свої гроші', "Хто (ім'я)": 'Дана', 'Сума, €': '0,30' }).ok, 'Дана купила за свої 0,30');
ok(!post({ kod: K, dija: 'spysaty', imya: 'Дана', suma: '0,30' }).ok, 'списати без причини — не можна');
ok(!post({ kod: K, dija: 'spysaty', imya: 'Дана', prychyna: 'дрібниця', suma: '0,50' }).ok, 'борг змінився (бачив інше) — не списуємо');
ok(!post({ kod: K, dija: 'spysaty', imya: 'Дана', prychyna: 'інше', suma: '0,30' }).ok, '«інше» без пояснення — не можна');
ok(post({ kod: K, dija: 'spysaty', imya: 'Дана', prychyna: 'подарунок гуртку', suma: '0,30' }).ok && !post({ kod: J, dija: 'hroshi' }).borhy['Дана'], 'виховник списав 0,30 € (подарунок гуртку) — боргу немає');
ok(String(FN().slice(-1)[0].r[10]).startsWith('причина: подарунок гуртку'), 'у «Примітці» — причина списання');
const q15 = zFin({ 'Як платили': 'свої гроші', "Хто (ім'я)": 'Дана', 'Сума, €': '15' });
ok(!post({ kod: K, dija: 'spysaty', imya: 'Дана', prychyna: 'дрібниця', suma: '15' }).ok, '«дрібниця» — лише до 1 €');
ok(!post({ kod: K, dija: 'spysaty', imya: 'Дана', prychyna: 'подарунок гуртку', suma: '15' }).ok, 'більше 10 € без підстави — не можна');
ok(post({ kod: K, dija: 'spysaty', imya: 'Дана', prychyna: 'подарунок гуртку', pidstava: 'протокол гурткової ради №3', suma: '15' }).ok, 'з підставою (протокол) — списано');
const rr0 = ctx.pidsumokRoku(ctx.SpreadsheetApp.getActive(), 'x').rik, FNn = FN().map(x => x.r);
const nadhOcik = FNn.filter(r => !['переміщення', 'повернення', 'повернення боргу'].includes(r[2])).reduce((a, r) => a + (r[1] === 'надходження' ? r[5] : r[2] === 'внески' ? -r[5] : 0), 0);
ok(Math.abs(rr0[8] - nadhOcik) < 0.01, 'підсумок року: внески назад (залік) — мінус надходжень, не видаток: ' + rr0[8]);
ok(zFin({ 'Як платили': 'свої гроші', "Хто (ім'я)": 'Дана', 'Сума, €': '5' }).ok, 'Дана купила за свої 5 € (лишаємо на новий рік)');

// ---- гурток заплатив за учасника (поверне) ----
ok(!zFin({ 'Категорія': 'за учасника (поверне)', 'Як платили': 'картка', 'Сума, €': '25' }).ok, 'за учасника без імені — не прийнято');
const hz0 = post({ kod: J, dija: 'hroshi' });
ok(zFin({ 'Категорія': 'за учасника (поверне)', "Хто (ім'я)": 'Ярко', 'Опис': 'сорочка', 'Як платили': 'картка', 'Сума, €': '25' }).ok, 'гурток купив Яркові сорочку 25 € (поверне)');
let hz = post({ kod: J, dija: 'hroshi' });
ok(hz.borhy['Ярко'] === -25 && Math.abs(hz.rakhunok - (hz0.rakhunok - 25)) < 0.01, 'Ярко винен гуртку 25 €, з рахунку пішло 25 €');
ok(zFin({ 'Рух': 'надходження', 'Категорія': 'повернення боргу', "Хто (ім'я)": 'Ярко', 'Сума, €': '25', 'Як платили': 'переказ' }).ok && !post({ kod: J, dija: 'hroshi' }).borhy['Ярко'], 'Ярко віддав 25 € — розраховано');
// ---- платіж за внесок, якого вже немає («сирота») ----
const VS = sheets["Внески"]._f, vrZ = VS.findIndex((r, i) => i >= 3 && (r[0] === '' || r[0] === undefined));
VS[vrZ][0] = 'Зима 2027'; VS[vrZ][1] = 15;
ok(post({ kod: J, dija: 'zapys', arkush: 'Фінанси', khto: 'Дана', dani: { 'Дата': '2026-11-09', 'Рух': 'надходження', 'Категорія': 'внески', 'Опис': 'внесок', "Хто (ім'я)": 'Ярко', 'Внесок': 'Зима 2027', 'Сума, €': '15', 'Як платили': 'переказ' } }).ok, 'Ярко заплатив за «Зима 2027»');
VS[vrZ][0] = 'Зима'; 
const sy = post({ kod: J, dija: 'vnesky' }).syroty;
ok(sy && sy['Зима 2027'] && sy['Зима 2027']['Ярко'] === 15, 'внесок перейменували — платіж видно як «без внеску»: ' + JSON.stringify(sy));
ok(post({ kod: K, dija: 'kasa' }).syroty['Зима 2027'], '«Перевірка каси» теж бачить платіж без внеску');
VS[vrZ][0] = ''; VS[vrZ][1] = '';
const ss0 = ctx.stanVnesku('Соломія', 'Осінь 2026');
ok(post({ kod: J, dija: 'zapys', arkush: 'Фінанси', khto: 'Дана', dani: { 'Дата': '2026-11-09', 'Рух': 'надходження', 'Категорія': 'внески', 'Опис': 'внесок', "Хто (ім'я)": 'Соломія', 'Внесок': 'Осінь 2026', 'Сума, €': String(ss0.brak + 4), 'Як платили': 'переказ' } }).ok, 'Соломія переплатила 4 € (не зараховано — до Нового року)');
const vnRik = post({ kod: K, dija: 'vnesky' });
const hrRik = post({ kod: K, dija: 'hroshi' });
const borgy = ctx.borhyRoku();
// ---- Новий рік ----
const fin0 = sheets['Фінанси']._f.slice(3).filter(r => r[0] !== '' && r[0] !== undefined);
const vydR = fin0.filter(r => r[1] === 'видаток' && !['переміщення', 'повернення', 'повернення боргу', 'внески', 'за учасника (поверне)'].includes(r[2])).reduce((a, r) => a + r[5], 0), bulyPov = fin0.some(r => r[2] === 'повернення');
const zal = fin0.filter(r => r[7] !== 'свої гроші').reduce((a, r) => a + (r[1] === 'надходження' ? +r[5] : r[1] === 'видаток' ? -r[5] : 0), 0);
const proby0 = sheets['Проби']._f.slice(3).filter(r => r[0]).length, vm0 = sheets['Вмілості']._f.slice(3).filter(r => r[0]).length;
const zam0 = sheets['Замовлення']._f.slice(3).filter(r => r[0]).length;
// ---- витяг людини (vytiah): лише її рядки, числа збігаються з hroshi / vnesky ----
{
  const hr = post({ kod: J, dija: 'hroshi' }), uz = sheets['Учасники'], zU = uz._f[2], cP = zU.indexOf('Прізвище');
  const pr = uz._f.slice(3).map(r => r[cP]).filter(x => x), imFin = [...new Set(FN().map(x => x.r[4]).filter(x => x))];
  let vse = true, chysto = true, lysheSvoi = true, vn = true, pidsum = true;
  const usi = [...new Set(ctx.imena().concat(imFin))];
  usi.forEach(im => {
    const v = post({ kod: J, dija: 'vytiah', imya: im });
    if (!v.ok) { vse = false; return; }
    const s = JSON.stringify(v); if (pr.some(p => s.includes(p))) chysto = false;
    if (v.ryadky.length !== FN().filter(x => String(x.r[4]).trim() === im).length) lysheSvoi = false;
    const sum = Math.round(v.ryadky.reduce((a, r) => a + r.vplyv, 0) * 100) / 100;
    if (Math.abs(sum - (hr.borhy[im] || 0)) > 0.001 || v.pidsumok.borh !== (hr.borhy[im] || 0)) { vse = false; console.log('   ', im, sum, hr.borhy[im]); }
    v.vnesky.forEach(x => { const st = ctx.stanVnesku(im, x.n); if (!st || Math.abs(st.brak - x.brak) > 0.001) vn = false; if (x.perevireno > x.splacheno + 0.001) console.log("    (перевірене > сплачене)", im, x.n, x.perevireno, x.splacheno); });
    const p = v.pidsumok;
    if (Math.abs(p.razom - (p.vynenHurtku - p.hurtokVynen)) > 0.001 || p.brakVnesky < 0 || p.pereplata < 0) pidsum = false;
  });
  ok(usi.length >= 5 && vse, 'витяг: ' + usi.length + ' людей — сума «vplyv» рядків = борг із «hroshi»');
  ok(lysheSvoi, 'витяг: лише рядки цієї людини');
  ok(chysto, 'витяг: жодного прізвища');
  ok(vn, "витяг: «бракує» кожного внеску = stanVnesku");
  ok(pidsum, 'витяг: разом = винен гуртку − гурток винен');
  const roku = ctx.borhyRoku();
  const okr = x => Math.round(x * 100) / 100;
  const zbig = ctx.imena().every(im => { const v = post({ kod: J, dija: 'vytiah', imya: im }), m = new RegExp('(^|; )' + im + ' ([\\d,]+)').exec(roku), r = m ? +m[2].replace(',', '.') : 0;
    return Math.abs(okr(v.pidsumok.brakVnesky - v.pidsumok.pereplata) - r) < 0.001 || (r === 0 && v.pidsumok.brakVnesky - v.pidsumok.pereplata <= 0.001); });
  ok(zbig, 'витяг: бракує − переплата = борг року (як переносить «Новий рік»)');
  ok(!post({ kod: J, dija: 'vytiah', imya: '' }).ok, 'витяг без імені — ні');
  const nh = post({ kod: J, dija: 'vytiah', imya: 'Ніхто' }); ok(nh.ok && !nh.ryadky.length && nh.pidsumok.borh === 0, 'витяг для імені без записів — порожній');
  const dl = post({ kod: J, dija: 'vytiah', imya: 'Дана' });
  ok(dl.ryadky.some(r => r.hrupa === 'svoi') && dl.ryadky.some(r => r.hrupa === 'povernennia') && dl.ryadky.some(r => r.hrupa === 'vnesok'), 'витяг Дани: є «свої гроші», «повернення», внески');
  ok(!post({ kod: 'x', dija: 'vytiah', imya: 'Дана' }).ok, 'витяг без коду — ні');
  // передумала: залік → назад
  const zb0 = ctx.stanVnesku('Зоряна', 'Осінь 2026').brak, zh0 = post({ kod: J, dija: 'hroshi' }), zr = ctx.zarakhovano('Зоряна', 'Осінь 2026');
  ok(zr === 4, 'зараховано Зоряні у «Осінь 2026»: ' + zr);
  ok(!post({ kod: J, dija: 'vidmina', imya: 'Зоряна', vnesok: 'Осінь 2026', suma: '5' }).ok, 'відмінити більше, ніж зараховано, — ні');
  const vm = post({ kod: J, dija: 'vidmina', imya: 'Зоряна', vnesok: 'Осінь 2026', khto: 'Дана' });
  const zh1 = post({ kod: J, dija: 'hroshi' });
  ok(vm.ok && vm.suma === 4 && vm.borh === 4 && Math.abs(vm.brak - (zb0 + 4)) < 0.001 && zh1.razom === zh0.razom, 'передумала: гурток знову винен 4 €, внесок знову бракує +4, у касі гроші ті самі');
  ok(!post({ kod: J, dija: 'vidmina', imya: 'Зоряна', vnesok: 'Осінь 2026' }).ok, 'друга відміна — нічого скасовувати');
  const vz = post({ kod: J, dija: 'vytiah', imya: 'Зоряна' });
  ok(vz.ryadky.some(r => r.hrupa === 'vidmina') && vz.ryadky.some(r => r.hrupa === 'zalik') && vz.pidsumok.borh === 4, 'витяг: видно і залік, і відміну');
  ok(post({ kod: J, dija: 'zalik', imya: 'Зоряна', vnesok: 'Осінь 2026', kudy: 'vnesok', khto: 'Дана' }).ok && ctx.zarakhovano('Зоряна', 'Осінь 2026') === 4, 'знову передумала — можна знову зарахувати');
  // платіж «ні» (виховник не знайшов у банку) — не сплачено
  const fr = FN().find(x => x.r[2] === 'внески' && x.r[7] !== 'свої гроші' && x.r[4] && x.r[8] && x.r[14] !== 'ні' && x.r[14] !== 'так');
  if (fr) {
    const im = fr.r[4], n = fr.r[8], b0 = post({ kod: J, dija: 'vytiah', imya: im }).vnesky.find(x => x.n === n).brak;
    post({ kod: K, dija: 'zatverdyty', arkush: 'Фінанси', ryadok: fr.n, znach: 'ні' });
    const v1 = post({ kod: J, dija: 'vytiah', imya: im }).vnesky.find(x => x.n === n);
    ok(Math.abs(v1.brak - (b0 + fr.r[5])) < 0.001 && v1.nezn === fr.r[5], 'платіж «ні» (не знайдено в банку) — знову бракує: ' + im + ' «' + n + '» ' + b0 + ' → ' + v1.brak);
    post({ kod: K, dija: 'zatverdyty', arkush: 'Фінанси', ryadok: fr.n, znach: '' });
  } else ok(false, 'немає рядка внеску для перевірки «ні»');
  const vyb = post({ kod: J, dija: 'vytiah', imya: 'Ніхто' }); ok(vyb.aktyvn === false && !vyb.vnesky.length, 'не серед учасників — внески не рахуються');
}

ctx.novyiRik();
const ryad = n => sheets[n]._f.slice(3).filter(r => r[0] !== '' && r[0] !== undefined);
ok(ryad('Сходини').length === 0 && ryad('Відвідуваність').length === 0 && ryad('Протоколи').length === 0, 'сходини, відвідуваність, протоколи очищено');
ok(sheets['Відвідуваність']._f[2][5] === 'Олесь', 'імена над відвідуваністю лишились');
ok(ryad('Проби').length === proby0 && ryad('Вмілості').length === vm0 && ryad('Замовлення').length === zam0, 'проби, вмілості, замовлення — не чіпано');
const zv = ryad('Завдання'); ok(zv.length === 3 && zv.every(r => r[4] !== 'зроблено'), 'завдання: лишились 3 незроблені, стягнуті догори');
const vr1 = ryad('Внески'); ok(vr1.length === 1 && String(vr1[0][0]).startsWith('Борг з') && vr1[0][3] === borgy && /Мирося 5/.test(borgy) && /Остап 10/.test(borgy) && !/Олесь/.test(borgy.replace(/Олесь 10/, '')), 'Новий рік: внески очищено, борги перенесено: ' + borgy);
const f1a = ryad('Фінанси'), zn = r => (r[1] === 'видаток' ? -1 : 1) * r[5], f1 = f1a.filter(r => r[7] !== 'свої гроші');
const bJar = f1a.find(r => r[7] === 'свої гроші' && r[4] === 'Ярко');
ok(!/Ярко/.test(borgy) || !bJar, 'Новий рік: платіж за зниклий внесок не пропав — Ярко: ' + (bJar ? 'борг гуртка ' + bJar[5] : 'зараховано в недоплату'));
const bRik = f1a.find(r => r[7] === 'свої гроші' && r[4] === 'Дана'), bSol = f1a.find(r => r[7] === 'свої гроші' && r[4] === 'Соломія');
ok(bSol && bSol[5] === 4 && bSol[1] === 'видаток', 'Новий рік: переплату внеску Соломії 4 € перенесено як борг гуртка');
ok(bRik && bRik[4] === 'Дана' && bRik[5] === 5 && bRik[1] === 'видаток' && bRik[2] === 'переміщення' && post({ kod: K, dija: 'hroshi' }).borhy['Дана'] === 5, 'Новий рік: борг «свої гроші» Дані 5 € перенесено');
const rkR = ryad('Роки').slice(-1)[0];
ok(rkR && Math.abs(rkR[9] - vydR) < 0.01 && bulyPov, 'Роки: видатки без повернень і переміщень = ' + rkR[9] + ' (очікували ' + vydR + ')');
ok(f1.length >= 1 && f1.length <= 3 && Math.abs(f1.reduce((a, r) => a + zn(r), 0) - zal) < 0.01 && f1.every(r => String(r[3]).startsWith('Залишок з 2026/27') && r[2] === 'переміщення' && r[14] === 'так'), 'каса: залишок з 2026/27 = ' + zal + ' (' + f1.map(r => r[3] + ' ' + zn(r)).join('; ') + ')');
const g1 = f1.find(r => r[7] === 'готівка'), r1x = f1.find(r => r[7] === 'переказ');
ok(Math.abs((g1 ? zn(g1) : 0) - hrRik.gotivka) < 0.01 && Math.abs((r1x ? zn(r1x) : 0) - hrRik.rakhunok) < 0.01, 'Новий рік: готівка й рахунок перенесено окремо');
ok(ryad('Звірки').length >= 3, '«Звірки» Новий рік не чистить');
const rk = ryad('Роки'); ok(rk.length === 1 && rk[0][0] === '2026/27' && rk[0][2] === 8 && Math.abs(rk[0][10] - (zal - hrRik.vynen + hrRik.vynni)) < 0.01 && rk[0][11].includes('archiv'), 'Роки: ' + rk[0].slice(0, 11).map(x => typeof x === 'number' ? Math.round(x * 100) / 100 : x).join(' | '));
const iu = ryad('Історія учасників');
const zi = post({ kod: 'lelekы-2026', dija: 'zvit', arkush: 'Історія учасників' });
ok(zi.ok && zi.ryadky.length === 7 && !JSON.stringify(zi).includes('Бондар'), 'звіт «Історія учасників» — без прізвищ'); const ol = iu.find(r => r[1] === 'Олесь');
ok(iu.length === 7 && ol[2] === 'Бондар' && ol[5] === 8 && ol[9].includes('Кераміка') && ol[10].includes('Кераміка'), 'Історія: 7 учасників; Олесь — ' + ol.slice(1, 11).map(x => typeof x === 'number' ? Math.round(x * 100) / 100 : x).join(' | '));
ok(sheets['Налаштування']._f[4].includes('2027/28'), 'навчальний рік → 2027/28');
ok(ryad('Архів').some(r => String(r[3]).includes('archiv')), 'посилання на архів записано');
for (let i = 0; i < 5; i++) post({ kod: 'x', dija: 'perevirka' });
ok(!post({ kod: 'lelekы-2026', dija: 'perevirka' }).ok, 'після 5 хибних спроб — вхід закрито');
ok(sheets['Зміни']._f.slice(3).some(r => r[1] === 'блокування'), 'блокування записано в «Зміни»');
console.log(bad ? `ПОМИЛОК: ${bad}` : 'Усе гаразд'); process.exit(bad ? 1 : 0);
