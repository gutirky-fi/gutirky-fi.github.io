"""Збирає конструктор «Потужний СКОБ!» (будь-хто складає свою вікторину) в один файл.
   Рушій гри — _robota/src/skob.js (той самий, що в гутірках), QR — qr.js, приклад — pryklad.js.
   python3 _robota/proby/skob-hra/zibraty.py           -> proba/skob-hra/ (+ proba/skob/ — сторінка для телефонів)
   python3 _robota/proby/skob-hra/zibraty.py ШЛЯХ      -> КОРІНЬ/ШЛЯХ/index.html (сторінка для телефонів — gutirky-fi.github.io/skob)"""
import pathlib, sys, json
TUT = pathlib.Path(__file__).parent
ROB = TUT.parent.parent
SITE = ROB.parent
D = ROB / 'src'


def rep(s, a, b):
    assert s.count(a) == 1, (s.count(a), a[:80])
    return s.replace(a, b)


def page(skob_rel):
    src = (TUT / 'index.html').read_text(encoding='utf-8')
    inl = lambda t: '<script>\n' + t + '\n</script>'
    for tag, text in [('<script src="../../src/qr.js"></script>', (D / 'qr.js').read_text(encoding='utf-8')),
                      ('<script src="../../src/skob.js"></script>', (D / 'zvyazok.js').read_text(encoding='utf-8') + '\n' + (D / 'skob.js').read_text(encoding='utf-8')),   # запасні канали звʼязку + гра
                      ('<script src="pryklad.js"></script>', (TUT / 'pryklad.js').read_text(encoding='utf-8'))]:
        src = rep(src, tag, inl(text))
    # на сайті — коротка адреса гравця gutirky-fi.github.io/skob; локально (перевірка) — поруч
    pre = "window.SKOB_URL = " + "(location.hostname === 'gutirky-fi.github.io' ? (location.pathname.startsWith('/proba/') ? 'https://gutirky-fi.github.io/proba/skob/' : 'https://gutirky-fi.github.io/skob/') : " + "new URL(" + json.dumps(skob_rel) + ", location.href).href);"   # проба → пробна сторінка гравця (4.11.2026)
    import base64; pre += " window.SKOB_PLAST = 'data:image/png;base64," + base64.b64encode((D / 'img' / 'logo.png').read_bytes()).decode() + "'; window.SKOB_LILY = 'data:image/webp;base64," + base64.b64encode((D / 'img' / 'emblem.webp').read_bytes()).decode() + "';"   # емблема для шапки стилю 3 (?dyz=3)
    src = src.replace('<script>\n', '<script>' + pre + '</script>\n<script>\n', 1)
    src = src.replace('</head>', '<script>\n' + (D / 'repetytsiia.js').read_text(encoding='utf-8') + '\n</script>\n</head>', 1)   # «Репетиція» (екран ведучого)
    src = src.replace('</head>', '<script>\n' + (D / 'zvuk-ihor.js').read_text(encoding='utf-8') + '\n</script>\n</head>', 1)   # звуки (як у Змагу)
    src = src.replace('</head>', '<script>\n' + (D / 'jak-provesty.js').read_text(encoding='utf-8') + '\n</script>\n</head>', 1)   # «Як провести гру»
    import sys; sys.path.insert(0, str(D)); import pult_ihry; src = pult_ihry.inject(src)   # пульт ведучого (4.11.2026)
    assert 'noindex' in src and 'src="../../' not in src
    return src


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True); path.write_text(text, encoding='utf-8'); print('  ', path.relative_to(SITE))


if __name__ == '__main__':
    where = sys.argv[1] if len(sys.argv) > 1 else 'proba/skob-hra'
    gr = (D / 'skob-gravets.html').read_text(encoding='utf-8')
    REP = '<script>\n' + (D / 'repetytsiia.js').read_text(encoding='utf-8') + '\n</script>\n</head>'   # «Репетиція»: тестові гравці (4.11.2026)
    gr = gr.replace('</head>', REP, 1)
    if where == 'proba/skob-hra':
        write(SITE / 'proba' / 'skob' / 'index.html', gr)
    depth = len(pathlib.PurePosixPath(where).parts)
    html = page('../' * depth + ('proba/skob/' if where.startswith('proba/') else 'skob/'))
    if not where.startswith('proba/'):   # на сайті — завжди новий дизайн (стиль 3), 03.11.2026; і варіант Б «як у Змагу» (v=b), 04.11.2026
        html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<script>{ let q = location.search; if (!/[?&]dyz=/.test(q)) q += (q ? \'&\' : \'?\') + \'dyz=3\'; if (!/[?&]v=/.test(q)) q += \'&v=b\'; if (q !== location.search) history.replaceState(null, \'\', location.pathname + q + location.hash); }</script>', 1)
    write(SITE / where / 'index.html', html)
