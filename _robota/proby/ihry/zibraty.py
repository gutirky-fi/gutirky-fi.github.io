"""Проба «родини ігор»: сторінка з усіма іграми.  python3 _robota/proby/ihry/zibraty.py -> proba/ihry/index.html (вбудовує src/ihry-rodyna.css)."""
import os
H = os.path.dirname(os.path.abspath(__file__)); ROB = os.path.dirname(os.path.dirname(H)); ROOT = os.path.dirname(ROB)
s = open(os.path.join(H, 'index.html'), encoding='utf8').read()
s = s.replace('</head>', '<style>\n' + open(os.path.join(ROB, 'src', 'ihry-rodyna.css'), encoding='utf8').read() + '\n</style>\n</head>', 1)
assert 'noindex' in s
p = os.path.join(ROOT, 'proba', 'ihry', 'index.html'); os.makedirs(os.path.dirname(p), exist_ok=True)
open(p, 'w', encoding='utf8').write(s); print('proba/ihry/index.html', len(s))
