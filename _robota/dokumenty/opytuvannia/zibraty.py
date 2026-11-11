"""Опитувальник «Знайомство з гуртком» — окремо від сайту й книги гуртка (рішення власника 11.11.2026).
   python3 _robota/dokumenty/opytuvannia/zibraty.py
   -> opytuvannia/znayomstvo.gs : ОДИН файл для script.google.com: сторінка (у стилі сайту) + запис у Таблицю в окремій папці.
   -> /tmp/znayomstvo-proba.html : та сама сторінка для перегляду (DEMO, нічого не надсилає).
   Джерело сторінки — sait/znayomstvo.html (на сайт не збирається)."""
import pathlib, base64, json
TUT = pathlib.Path(__file__).parent
DOK = TUT.parent
ROB = DOK.parent
IMG = ROB / 'src' / 'img'
uri = lambda p, m: 'data:' + m + ';base64,' + base64.b64encode(p.read_bytes()).decode()

s = (DOK / 'sait' / 'znayomstvo.html').read_text(encoding='utf-8')
s = s.replace('{{LOGO}}', uri(IMG / 'logo.png', 'image/png')).replace('{{EMBLEM}}', uri(IMG / 'emblem.webp', 'image/webp'))
s = s.replace('/*SPILNE*/', (DOK / 'sait' / 'spilne.css').read_text(encoding='utf-8')).replace('<!--RIBBON-->', '')
assert '{{' not in s

proba = s.replace('/*DEMO*/false/*/DEMO*/', 'true')
pathlib.Path('/tmp/znayomstvo-proba.html').write_text(proba, encoding='utf-8')

gas = s.replace('/*GAS*/false/*/GAS*/', 'true')
kod = (TUT / 'znayomstvo_kod.gs').read_text(encoding='utf-8')
out = kod.replace('/*STORINKA*/""', json.dumps(gas, ensure_ascii=False))
(TUT / 'znayomstvo.gs').write_text(out, encoding='utf-8')
print('znayomstvo.gs', len(out.encode()) // 1024, 'КБ')
