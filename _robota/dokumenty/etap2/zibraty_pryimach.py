"""Вставляє діалог «Посилання для гуртка» (posylannia.html + qr.js) у pryimach.gs між <<POSYLANNIA і >>POSYLANNIA.
Запуск: python3 _robota/dokumenty/etap2/zibraty_pryimach.py (після зміни posylannia.html чи qr.js)."""
import json, re, pathlib
TUT = pathlib.Path(__file__).resolve().parent
html = (TUT / 'posylannia.html').read_text(encoding='utf-8')
qr = (TUT / 'qr.js').read_text(encoding='utf-8')
assert '</script' not in qr and html.count('/*QR*/') == 1
html = html.replace('/*QR*/', qr)
from PIL import Image; import base64, io                     # лілея (печатка бібліотеки) — посередині QR, ≈7 КБ
im = Image.open(TUT.parent.parent / 'druk' / 'lileya.png'); im.thumbnail((96, 96)); b = io.BytesIO(); im.save(b, 'PNG', optimize=True)
html = html.replace('/*LILEYA*/', 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode())
lit = json.dumps(html, ensure_ascii=False).replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
gs = TUT / 'pryimach.gs'
s = gs.read_text(encoding='utf-8')
s, n = re.subn(r'(// <<POSYLANNIA[^\n]*\n)var POSYLANNIA_HTML = .*?;\n(// >>POSYLANNIA)', lambda m: m.group(1) + 'var POSYLANNIA_HTML = ' + lit + ';\n' + m.group(2), s, flags=re.S)
assert n == 1, 'немає міток <<POSYLANNIA / >>POSYLANNIA'
gs.write_text(s, encoding='utf-8')
print('pryimach.gs: діалог', len(html) // 1024, 'КБ')
