#!/usr/bin/env python3
"""Створює src/skills_data.js (дані каталогу вмілостей) з finland.txt і nashyvky_rivniv.json.

finland.txt — перелік з https://plast-finland.com/vmilosti (каталог Пласту у Фінляндії, який бере дані з plast.global):
    назва|спеціалізація+спеціалізація|рівень=адреса,рівень=адреса|шлях нашивки після https://plast.global/wp-content/uploads/
    «(друга версія)» у назві — така сама вмілість ще раз на порталі; її рівні додаються до першої картки.
nashyvky_rivniv.json — нашивки окремих рівнів (адреса рівня -> шлях картинки), зібрані зі сторінок plast.global.

Запуск:  python3 _robota/vmilosti/zibraty_katalog.py   (потім python3 _robota/build.py)
"""
import json, re, os, collections
HERE = os.path.dirname(os.path.abspath(__file__))
SPECS = ['Альпінізм та скелелазіння', 'Велосипедна', 'Військова', 'Етнографічна', 'Загальні вмілості', 'Кінна', 'Летунська',
         'Мандрівництво', 'Мистецька', 'Морська', 'Рольового руху', 'Сноубординг та лещетарство', 'Спортивна']
rows = [l.split('|') for l in open(os.path.join(HERE, 'finland.txt'), encoding='utf8').read().strip().split('\n') if l and not l.startswith('#')]
merged = collections.OrderedDict()
for n, sp, lv, img in rows:
    name = re.sub(r'\s*\(друга версія\)$', '', n)
    levels = [x.split('=', 1) for x in lv.split(',')]
    if name.lower() in merged:
        for lab, slug in levels:
            merged[name.lower()]['lv'].append([lab + (' (інша версія)' if lab == 'Опис' else ''), slug])
        continue
    merged[name.lower()] = {'n': name, 'sp': [SPECS.index(s.strip()) for s in sp.split('+')], 'img': img, 'lv': levels}
out = [[m['n'], m['sp'], m['img'], m['lv']] for m in merged.values()]
lvl_all = json.load(open(os.path.join(HERE, 'nashyvky_rivniv.json'), encoding='utf8'))
used = {slug for o in out for _, slug in o[3]}
lvl = {k: v for k, v in sorted(lvl_all.items()) if k in used}
data = ('/* Каталог вмілостей Пласту у Фінляндії (plast-finland.com/vmilosti), який бере дані з бібліотеки вмілостей Пласту (plast.global).\n'
        '   Цей файл створює _robota/vmilosti/zibraty_katalog.py — руками не правити.\n'
        '   SKILL_LIST: [назва, [№ спеціалізацій], нашивка, [[рівень, адреса], …]]; нашивки — шлях після https://plast.global/wp-content/uploads/ */\n'
        'const SKILL_SPECS = ' + json.dumps(SPECS, ensure_ascii=False) + ';\n'
        'const SKILL_LIST = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
        'const SKILL_LEVEL_IMG = ' + json.dumps(lvl, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(HERE, '..', 'src', 'skills_data.js'), 'w', encoding='utf8').write(data)
print('вмілостей:', len(out), '| рівнів:', sum(len(o[3]) for o in out), '| нашивок рівнів:', len(lvl))
