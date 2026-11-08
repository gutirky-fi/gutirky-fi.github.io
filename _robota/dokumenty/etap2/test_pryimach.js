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
    getDisplayValues() { return this.getValues().map(rr => rr.map(x => x instanceof Date ? x.toLocaleDateString('uk') : String(x))); },
    getFormulas: () => [...Array(nr)].map((_, i) => [...Array(ncc)].map((_, k) => { const [F, , j] = cell(r + i, c + k); return isF(F[j]) ? F[j] : ''; })),
    setValue: x => { const [F, V, j] = cell(r, c); if (isF(F[j])) throw Error('запис у формулу ' + name + ' ' + r + ':' + c); F[j] = x; V[j] = x; },
    setValues: a => a.forEach((rr, i) => rr.forEach((x, k) => range(r + i, c + k).setValue(x))),
    clearContent: () => { for (let i = 0; i < nr; i++) for (let k = 0; k < ncc; k++) { const [F, V, j] = cell(r + i, c + k); F[j] = ''; V[j] = ''; } },
  });
  return { getName: () => name, getMaxRows: () => f.length, getLastColumn: () => nc, getMaxColumns: () => nc, getRange: range, _f: f };
}
const sheets = Object.fromEntries(Object.entries(dump).map(([n, d]) => [n, Sheet(n, d)]));
const props = {}, cache = {};
const ctx = {
  SpreadsheetApp: { getActive: () => ({ getSheetByName: n => sheets[n] || null, getSheets: () => Object.values(sheets) }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => props[k] = v }) },
  CacheService: { getScriptCache: () => ({ get: k => cache[k] || null, put: (k, v) => cache[k] = v }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Utilities: { sleep() {}, DigestAlgorithm: {}, Charset: {}, computeDigest: (a, s) => [...crypto.createHash('sha256').update(s, 'utf8').digest()].map(b => b > 127 ? b - 256 : b) },
  ContentService: { MimeType: { JSON: 1 }, createTextOutput: t => ({ setMimeType: () => JSON.parse(t) }) },
  console, Date,
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'pryimach.gs'), 'utf8'), ctx);
const post = o => ctx.doPost({ postData: { contents: JSON.stringify(o) } });
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) bad++; };

props.KOD = ctx.vidbytok('lelekы-2026');
ok(!post({ kod: 'хибний', dija: 'perevirka' }).ok, 'хибний код відхилено');
ok(post({ kod: 'lelekы-2026', dija: 'perevirka' }).ok, 'правильний код приймається');
const im = post({ kod: 'lelekы-2026', dija: 'imena' }); ok(im.imena.length === 7 && im.imena[0] === 'Олесь', 'імена: ' + im.imena.join(', '));
let r = post({ kod: 'lelekы-2026', dija: 'zapys', arkush: 'Сходини', khto: 'Олесь', dani: { 'Дата': '2026-10-24', '№': 8, 'Тема': 'Орієнтування', 'Відповідальний': 'Олесь', 'Присутніх': 99 } });
ok(r.ok && r.ryadok === 11, 'сходини → перший вільний рядок 11');
const s = sheets['Сходини']._f[10];
ok(s[0] instanceof Date && s[2] === 'Орієнтування' && s[9] === 'Олесь' && s[10] instanceof Date, 'поля, «Хто записав», «Записано» на місці');
ok(String(s[7]).startsWith('='), 'формула «Присутніх» не зачеплена');
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
for (let i = 0; i < 20; i++) post({ kod: 'x', dija: 'perevirka' });
ok(!post({ kod: 'lelekы-2026', dija: 'perevirka' }).ok, 'після 20 хибних спроб — пауза');
console.log(bad ? `ПОМИЛОК: ${bad}` : 'Усе гаразд'); process.exit(bad ? 1 : 0);
