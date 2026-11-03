"""«Пластове бінго» (проба): екран гри й сторінка гравця.
    python3 _robota/proby/bingo/zibraty.py     -> proba/bingo/index.html, proba/bingo/gravets/index.html
Вбудовує _robota/src/qr.js і zvyazok.js (звʼязок PeerJS + запасні канали)."""
import os
H = os.path.dirname(os.path.abspath(__file__)); ROB = os.path.dirname(os.path.dirname(H)); ROOT = os.path.dirname(ROB)
qr = open(os.path.join(ROB, 'src', 'qr.js'), encoding='utf8').read()
z = open(os.path.join(ROB, 'src', 'zvyazok.js'), encoding='utf8').read()
for src, out in [('ekran.html', 'proba/bingo/index.html'), ('gravets.html', 'proba/bingo/gravets/index.html'), ('ekran.html', 'bingo/index.html'), ('gravets.html', 'bingo/gravets/index.html')]:   # проба й сайт
    s = open(os.path.join(H, src), encoding='utf8').read()
    import re
    if out.startswith('proba/'):   # «родина ігор» (?dyz=fam) — лише в пробі
        s = s.replace('</head>', '<style>\n' + open(os.path.join(ROB, 'src', 'ihry-rodyna.css'), encoding='utf8').read() + '\n' + open(os.path.join(ROB, 'src', 'ihry-styl2.css'), encoding='utf8').read() + '\n</style>\n</head>', 1)
        if src == 'gravets.html': s = s.replace('</head>', '<script>\n' + open(os.path.join(ROB, 'src', 'ihry-tel3.js'), encoding='utf8').read() + '\n</script>\n</head>', 1)   # телефон, стиль 3
        if src == 'ekran.html': s = s.replace('</head>', '<style>\n' + open(os.path.join(ROB, 'src', 'ihry-styl3.css'), encoding='utf8').read() + '\n</style>\n<script>\n' + open(os.path.join(ROB, 'src', 'ihry-styl3.js'), encoding='utf8').read() + '\n</script>\n</head>', 1)   # стиль 3 (?dyz=3)
        import base64; s = s.replace('{{LOGO}}', 'data:image/png;base64,' + base64.b64encode(open(os.path.join(ROB, 'src', 'img', 'logo.png'), 'rb').read()).decode())
    else:
        s = re.sub(r'/\*FAM\*/.*?/\*/FAM\*/', '', s, flags=re.S)
    import base64; s = s.replace('{{EMBLEM3}}', 'data:image/webp;base64,' + base64.b64encode(open(os.path.join(ROB, 'src', 'img', 'emblem.webp'), 'rb').read()).decode())   # фонова лілея (стиль 3)
    s = s.replace('<script>/*QR*/</script>', '<script>\n' + qr + '\n</script>').replace('<script>/*ZVYAZOK*/</script>', '<script>\n' + z + '\n</script>')
    assert '/*QR*/' not in s and '/*ZVYAZOK*/' not in s and 'noindex' in s
    p = os.path.join(ROOT, out); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf8').write(s); print(out, len(s))
