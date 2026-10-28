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
    pre = "window.SKOB_URL = location.hostname === 'gutirky-fi.github.io' ? 'https://gutirky-fi.github.io/skob/' : new URL(" + json.dumps(skob_rel) + ", location.href).href;"
    src = src.replace('<script>\n', '<script>' + pre + '</script>\n<script>\n', 1)
    assert 'noindex' in src and 'src="../../' not in src
    return src


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True); path.write_text(text, encoding='utf-8'); print('  ', path.relative_to(SITE))


if __name__ == '__main__':
    where = sys.argv[1] if len(sys.argv) > 1 else 'proba/skob-hra'
    gr = (D / 'skob-gravets.html').read_text(encoding='utf-8')
    if where == 'proba/skob-hra':
        write(SITE / 'proba' / 'skob' / 'index.html', gr)
    depth = len(pathlib.PurePosixPath(where).parts)
    write(SITE / where / 'index.html', page('../' * depth + ('proba/skob/' if where.startswith('proba/') else 'skob/')))
