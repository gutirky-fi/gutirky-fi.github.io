"""«Швидке опитування» (проба): екран ведучого й сторінка голосування на телефоні.
    python3 _robota/proby/opytuvannia/zibraty.py   -> proba/opytuvannia/index.html, proba/opytuvannia/golos/index.html
Вбудовує _robota/src/qr.js і zvyazok.js (звʼязок PeerJS + запасні канали)."""
import os, sys
H = os.path.dirname(os.path.abspath(__file__)); ROB = os.path.dirname(os.path.dirname(H)); ROOT = os.path.dirname(ROB)
qr = open(os.path.join(ROB, 'src', 'qr.js'), encoding='utf8').read()
z = open(os.path.join(ROB, 'src', 'zvyazok.js'), encoding='utf8').read()
DIRS = ['proba/opytuvannia'] + (['opytuvannia'] if 'sait' in sys.argv else [])
for d in DIRS:
    for src, out in [('ekran.html', d + '/index.html'), ('golos.html', d + '/golos/index.html')]:
        s = open(os.path.join(H, src), encoding='utf8').read()
        import re
        if d.startswith('proba/'):   # «родина ігор» (?dyz=fam) — лише в пробі
            s = s.replace('</head>', '<style>\n' + open(os.path.join(ROB, 'src', 'ihry-rodyna.css'), encoding='utf8').read() + '\n' + open(os.path.join(ROB, 'src', 'ihry-styl2.css'), encoding='utf8').read() + '\n</style>\n</head>', 1)
            if src == 'ekran.html': s = s.replace('</head>', '<style>\n' + open(os.path.join(ROB, 'src', 'ihry-styl3.css'), encoding='utf8').read() + '\n</style>\n<script>\n' + open(os.path.join(ROB, 'src', 'ihry-styl3.js'), encoding='utf8').read() + '\n</script>\n</head>', 1)   # стиль 3 (?dyz=3)
            import base64; s = s.replace('{{LOGO}}', 'data:image/png;base64,' + base64.b64encode(open(os.path.join(ROB, 'src', 'img', 'logo.png'), 'rb').read()).decode())
        else:
            s = re.sub(r'/\*FAM\*/.*?/\*/FAM\*/', '', s, flags=re.S)
        s = s.replace('<script>/*QR*/</script>', '<script>\n' + qr + '\n</script>').replace('<script>/*ZVYAZOK*/</script>', '<script>\n' + z + '\n</script>')
        assert '/*QR*/' not in s and '/*ZVYAZOK*/' not in s and 'noindex' in s
        p = os.path.join(ROOT, out); os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, 'w', encoding='utf8').write(s); print(out, len(s))
