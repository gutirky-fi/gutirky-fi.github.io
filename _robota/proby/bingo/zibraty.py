"""«Пластове бінго» (проба): екран гри й сторінка гравця.
    python3 _robota/proby/bingo/zibraty.py [sait]  -> proba/bingo/… (і bingo/… на сайті — лише з sait)
Вбудовує _robota/src/qr.js і zvyazok.js (звʼязок PeerJS + запасні канали)."""
import os
DYZ3 = '<meta charset="utf-8">\n<script>/* на сайті нові ігри — завжди стиль 3 (?dyz=3), так само й посилання для телефонів */ if (!/[?&]dyz=/.test(location.search)) history.replaceState(null, \'\', location.pathname + (location.search ? location.search + \'&\' : \'?\') + \'dyz=3\' + location.hash);</script>'
H = os.path.dirname(os.path.abspath(__file__)); ROB = os.path.dirname(os.path.dirname(H)); ROOT = os.path.dirname(ROB)
qr = open(os.path.join(ROB, 'src', 'qr.js'), encoding='utf8').read()
z = open(os.path.join(ROB, 'src', 'zvyazok.js'), encoding='utf8').read()
import sys
for src, out in [('ekran.html', 'proba/bingo/index.html'), ('gravets.html', 'proba/bingo/gravets/index.html')] + ([('ekran.html', 'bingo/index.html'), ('gravets.html', 'bingo/gravets/index.html')] if 'sait' in sys.argv else []):   # проба; сайт — лише з аргументом sait (з 4.11.2026)
    s = open(os.path.join(H, src), encoding='utf8').read()
    import re
    if True:   # 03.11.2026: новий дизайн (стиль 3) — і в пробі, і на сайті (власник: «ставимо»)
        s = s.replace('</head>', '<style>\n' + open(os.path.join(ROB, 'src', 'ihry-rodyna.css'), encoding='utf8').read() + '\n' + open(os.path.join(ROB, 'src', 'ihry-styl2.css'), encoding='utf8').read() + '\n</style>\n</head>', 1)
        if src == 'gravets.html': s = s.replace('</head>', '<script>\n' + open(os.path.join(ROB, 'src', 'ihry-tel3.js'), encoding='utf8').read() + '\n</script>\n</head>', 1)   # телефон, стиль 3
        if src == 'ekran.html': s = s.replace('</head>', '<style>\n' + open(os.path.join(ROB, 'src', 'ihry-styl3.css'), encoding='utf8').read() + '\n</style>\n<script>\n' + open(os.path.join(ROB, 'src', 'ihry-styl3.js'), encoding='utf8').read() + '\n</script>\n</head>', 1)   # стиль 3 (?dyz=3)
        import base64; s = s.replace('{{LOGO}}', 'data:image/png;base64,' + base64.b64encode(open(os.path.join(ROB, 'src', 'img', 'logo.png'), 'rb').read()).decode())
    s = s.replace('</head>', '<script>\n' + open(os.path.join(ROB, 'src', 'repetytsiia.js'), encoding='utf8').read() + '\n</script>\n</head>', 1)   # «Репетиція»: тестові гравці (4.11.2026)
    if not out.startswith('proba/'): s = s.replace('<meta charset="utf-8">', DYZ3, 1)
    import base64; s = s.replace('{{EMBLEM3}}', 'data:image/webp;base64,' + base64.b64encode(open(os.path.join(ROB, 'src', 'img', 'emblem.webp'), 'rb').read()).decode())   # фонова лілея (стиль 3)
    s = s.replace('<script>/*QR*/</script>', '<script>\n' + qr + '\n</script>').replace('<script>/*ZVYAZOK*/</script>', '<script>\n' + z + '\n</script>')
    if src == 'ekran.html':   # пульт ведучого з телефона (4.11.2026)
        import sys; sys.path.insert(0, os.path.join(ROB, 'src')); import pult_ihry; s = pult_ihry.inject(s)
    assert '/*QR*/' not in s and '/*ZVYAZOK*/' not in s and 'noindex' in s
    p = os.path.join(ROOT, out); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf8').write(s); print(out, len(s))
