"""«Своя гра» (проба): табло ведучого й кнопка «Відповідаю!» на телефоні.
    python3 _robota/proby/svoya-hra/zibraty.py   -> proba/svoya-hra/index.html, proba/svoya-hra/hravets/index.html
Вбудовує _robota/src/qr.js і zvyazok.js (звʼязок PeerJS + запасні канали)."""
import os, sys
H = os.path.dirname(os.path.abspath(__file__)); ROB = os.path.dirname(os.path.dirname(H)); ROOT = os.path.dirname(ROB)
qr = open(os.path.join(ROB, 'src', 'qr.js'), encoding='utf8').read()
z = open(os.path.join(ROB, 'src', 'zvyazok.js'), encoding='utf8').read()
DIRS = ['proba/svoya-hra'] + (['svoya-hra'] if 'sait' in sys.argv else [])
import shutil
for d in DIRS:
    if os.path.isdir(os.path.join(H, 'zvuky')): shutil.copytree(os.path.join(H, 'zvuky'), os.path.join(ROOT, d, 'zvuky'), dirs_exist_ok=True)   # звуки SFX Kit (CC0)
    for src, out in [('ekran.html', d + '/index.html'), ('hravets.html', d + '/hravets/index.html'), ('vedyuchyi.html', d + '/vedyuchyi/index.html')]:
        s = open(os.path.join(H, src), encoding='utf8').read()
        import base64; s = s.replace('{{LILY}}', 'data:image/png;base64,' + base64.b64encode(open(os.path.join(ROB, 'druk', 'lileya.png'), 'rb').read()).decode())   # лілея для шпаргалки
        import base64; s = s.replace('{{LOGO}}', 'data:image/png;base64,' + base64.b64encode(open(os.path.join(ROB, 'src', 'img', 'logo.png'), 'rb').read()).decode())
        import base64; s = s.replace('{{EMBLEM}}', 'data:image/webp;base64,' + base64.b64encode(open(os.path.join(ROB, 'src', 'img', 'emblem.webp'), 'rb').read()).decode())
        s = s.replace('</head>', '<style>\n' + open(os.path.join(ROB, 'src', 'ihry-rodyna.css'), encoding='utf8').read() + '\n</style>\n</head>', 1)   # «родина ігор» (?dyz=fam)
        if src == 'hravets.html': s = s.replace('</head>', '<script>\n' + open(os.path.join(ROB, 'src', 'ihry-tel3.js'), encoding='utf8').read() + '\n</script>\n</head>', 1)   # телефон, стиль 3
        if src == 'ekran.html': s = s.replace('</head>', '<style>\n' + open(os.path.join(ROB, 'src', 'ihry-styl3.css'), encoding='utf8').read() + '\n</style>\n<script>\n' + open(os.path.join(ROB, 'src', 'ihry-styl3.js'), encoding='utf8').read() + '\n</script>\n</head>', 1)   # стиль 3 (?dyz=3)
        s = s.replace('<script>/*QR*/</script>', '<script>\n' + qr + '\n</script>').replace('<script>/*ZVYAZOK*/</script>', '<script>\n' + z + '\n</script>')
        assert '/*QR*/' not in s and '/*ZVYAZOK*/' not in s and 'noindex' in s
        p = os.path.join(ROOT, out); os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, 'w', encoding='utf8').write(s); print(out, len(s))
