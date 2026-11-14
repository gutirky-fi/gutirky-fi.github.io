"""«Новий виховник» (проба, 14.11.2026): гра-знайомство — «Вгадай, хто?» і «Хто з нас…».
    python3 _robota/proby/novyi-vykhovnyk/zibraty.py        -> proba/novyi-vykhovnyk/index.html, proba/novyi-vykhovnyk/hra/index.html
    python3 _robota/proby/novyi-vykhovnyk/zibraty.py sait   -> ще й novyi-vykhovnyk/ (на сайт — лише після «ставимо»)
Механіка — як у «Швидкому опитуванні» (звʼязок PeerJS, пульт /pult/, «Репетиція», стиль 3)."""
import os, sys, base64
sys.dont_write_bytecode = True
DYZ3 = '<meta charset="utf-8">\n<script>/* на сайті нові ігри — завжди стиль 3 (?dyz=3) */ if (!/[?&]dyz=/.test(location.search)) history.replaceState(null, \'\', location.pathname + (location.search ? location.search + \'&\' : \'?\') + \'dyz=3\' + location.hash);</script>'
H = os.path.dirname(os.path.abspath(__file__)); ROB = os.path.dirname(os.path.dirname(H)); ROOT = os.path.dirname(ROB)
rd = lambda *p: open(os.path.join(ROB, *p), encoding='utf8').read()
b64 = lambda p, t: 'data:' + t + ';base64,' + base64.b64encode(open(os.path.join(ROB, 'src', 'img', p), 'rb').read()).decode()
DIRS = ['proba/novyi-vykhovnyk'] + (['novyi-vykhovnyk'] if 'sait' in sys.argv else [])
for d in DIRS:
    for src, out in [('ekran.html', d + '/index.html'), ('hra.html', d + '/hra/index.html')]:
        s = open(os.path.join(H, src), encoding='utf8').read()
        s = s.replace('</head>', '<style>\n' + rd('src', 'ihry-rodyna.css') + '\n' + rd('src', 'ihry-styl2.css') + '\n</style>\n</head>', 1)
        if src == 'hra.html': s = s.replace('</head>', '<script>\n' + rd('src', 'ihry-tel3.js') + '\n</script>\n</head>', 1)
        if src == 'ekran.html': s = s.replace('</head>', '<style>\n' + rd('src', 'ihry-styl3.css') + '\n</style>\n<script>\n' + rd('src', 'ihry-styl3.js') + '\n</script>\n</head>', 1)
        s = s.replace('{{LOGO}}', b64('logo.png', 'image/png')).replace('{{EMBLEM3}}', b64('emblem.webp', 'image/webp'))
        s = s.replace('</head>', '<script>\n' + rd('src', 'repetytsiia.js') + '\n</script>\n</head>', 1)
        if not d.startswith('proba/'): s = s.replace('<meta charset="utf-8">', DYZ3, 1)
        s = s.replace('<script>/*QR*/</script>', '<script>\n' + rd('src', 'qr.js') + '\n</script>').replace('<script>/*ZVYAZOK*/</script>', '<script>\n' + rd('src', 'zvyazok.js') + '\n</script>')
        if src == 'ekran.html':
            sys.path.insert(0, os.path.join(ROB, 'src')); import pult_ihry; s = pult_ihry.inject(s)
        assert '/*QR*/' not in s and '/*ZVYAZOK*/' not in s and 'noindex' in s
        p = os.path.join(ROOT, out); os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, 'w', encoding='utf8').write(s); print(out, len(s))
