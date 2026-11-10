"""Вставляє діалог «Посилання для гуртка» (posylannia.html + qr.js) у pryimach.gs між <<POSYLANNIA і >>POSYLANNIA.
Запуск: python3 _robota/dokumenty/etap2/zibraty_pryimach.py (після зміни posylannia.html чи qr.js)."""
import json, re, pathlib
TUT = pathlib.Path(__file__).resolve().parent
html = (TUT / 'posylannia.html').read_text(encoding='utf-8')
qr = (TUT / 'qr.js').read_text(encoding='utf-8')
assert '</script' not in qr and html.count('/*QR*/') == 1
html = html.replace('/*QR*/', qr)
lit = json.dumps(html, ensure_ascii=False).replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
gs = TUT / 'pryimach.gs'
s = gs.read_text(encoding='utf-8')
s, n = re.subn(r'(// <<POSYLANNIA[^\n]*\n)var POSYLANNIA_HTML = .*?;\n(// >>POSYLANNIA)', lambda m: m.group(1) + 'var POSYLANNIA_HTML = ' + lit + ';\n' + m.group(2), s, flags=re.S)
assert n == 1, 'немає міток <<POSYLANNIA / >>POSYLANNIA'
gs.write_text(s, encoding='utf-8')
print('pryimach.gs: діалог', len(html) // 1024, 'КБ')
