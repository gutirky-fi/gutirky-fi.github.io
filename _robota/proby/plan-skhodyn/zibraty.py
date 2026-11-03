"""«План сходин» — інструмент виховника (програма сходин і великий таймер).
    python3 _robota/proby/plan-skhodyn/zibraty.py        -> proba/plan-skhodyn/index.html
    python3 _robota/proby/plan-skhodyn/zibraty.py sait   -> і plan-skhodyn/index.html (на сайті)"""
import base64, os, sys
H = os.path.dirname(os.path.abspath(__file__)); ROB = os.path.dirname(os.path.dirname(H)); ROOT = os.path.dirname(ROB)
uri = lambda p, m: 'data:' + m + ';base64,' + base64.b64encode(open(p, 'rb').read()).decode()
for d in ['proba/plan-skhodyn'] + (['plan-skhodyn'] if 'sait' in sys.argv else []):
    s = open(os.path.join(H, 'index.html'), encoding='utf8').read()
    s = s.replace('{{LOGO}}', uri(os.path.join(ROB, 'src', 'img', 'logo.png'), 'image/png')).replace('{{EMBLEM3}}', uri(os.path.join(ROB, 'src', 'img', 'emblem.webp'), 'image/webp'))
    assert 'noindex' in s and '{{' not in s
    p = os.path.join(ROOT, d, 'index.html'); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf8').write(s); print(d + '/index.html', len(s))
