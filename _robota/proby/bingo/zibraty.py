"""«Пластове бінго» (проба): екран гри й сторінка гравця.
    python3 _robota/proby/bingo/zibraty.py     -> proba/bingo/index.html, proba/bingo/gravets/index.html
Вбудовує _robota/src/qr.js і zvyazok.js (звʼязок PeerJS + запасні канали)."""
import os
H = os.path.dirname(os.path.abspath(__file__)); ROB = os.path.dirname(os.path.dirname(H)); ROOT = os.path.dirname(ROB)
qr = open(os.path.join(ROB, 'src', 'qr.js'), encoding='utf8').read()
z = open(os.path.join(ROB, 'src', 'zvyazok.js'), encoding='utf8').read()
for src, out in [('ekran.html', 'proba/bingo/index.html'), ('gravets.html', 'proba/bingo/gravets/index.html')]:
    s = open(os.path.join(H, src), encoding='utf8').read()
    s = s.replace('<script>/*QR*/</script>', '<script>\n' + qr + '\n</script>').replace('<script>/*ZVYAZOK*/</script>', '<script>\n' + z + '\n</script>')
    assert '/*QR*/' not in s and '/*ZVYAZOK*/' not in s and 'noindex' in s
    p = os.path.join(ROOT, out); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf8').write(s); print(out, len(s))
