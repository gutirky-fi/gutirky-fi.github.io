// Оновлює список гутірок (library.js) з усіх папок gutirky/*/meta.json.
// Запуск: node tools/build-library.mjs   (Netlify з GitHub робить це сам — див. netlify.toml)
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'gutirky');
const items = [];
for (const slug of readdirSync(dir).sort()) {
  const p = join(dir, slug);
  if (slug.startsWith('_') || slug.startsWith('.') || !statSync(p).isDirectory()) continue;
  if (!existsSync(join(p, 'index.html'))) { console.warn('пропущено (нема index.html):', slug); continue; }
  let meta = {};
  try { meta = JSON.parse(readFileSync(join(p, 'meta.json'), 'utf8').replace(/^﻿/, '')); }
  catch (e) { console.warn('нема або зламаний meta.json у', slug, '— беру назву папки'); }
  items.push({ ...meta, slug, title: meta.title || slug });
}
items.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || String(a.title).localeCompare(String(b.title), 'uk'));
const out = '/* Створено автоматично. Не редагуйте вручну — запустіть update-library.html або tools/build-library.mjs */\n'
  + 'window.LIBRARY = ' + JSON.stringify(items, null, 1) + ';\n';
writeFileSync(join(root, 'library.js'), out);
console.log('Гутірок у бібліотеці:', items.length, items.map(i => i.slug).join(', '));
