"""Збирає гутірку «Кераміка І» (за вимогами вмілості) в один файл — з грою «Потужний СКОБ!», малюнками й пультом.
   Рушій — копія «Будови літальних апаратів І»; зміст — dani.js, малюнки — maliunky.js.
   python3 _robota/gutirky/keramika-1/zibraty.py vhody          -> proba/vhody/gutirky|yunakam/keramika-1/ (макет «кілька входів»)
   python3 _robota/gutirky/keramika-1/zibraty.py proba          -> proba/keramika-1/ + proba/yunakam/keramika-1/ (+ skob/)
   python3 _robota/gutirky/keramika-1/zibraty.py sait [КОРІНЬ]  -> КОРІНЬ/gutirky/keramika-1/ + КОРІНЬ/yunakam/keramika-1/ + КОРІНЬ/skob/"""
import pathlib, sys, base64, json
TUT = pathlib.Path(__file__).parent
ROB = TUT.parent.parent
SITE = ROB.parent
D = ROB / 'src'
IC_PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>'


def rep(s, a, b):
    assert s.count(a) == 1, (s.count(a), a[:80])
    return s.replace(a, b)


def page(skob_rel, yun_rel=None, home=None, kart=False):
    """yun_rel — адреса сторінки для юнаків відносно цієї; без нього — сама сторінка для юнаків."""
    src = (TUT / 'index.html').read_text(encoding='utf-8')
    emblem = 'data:image/webp;base64,' + base64.b64encode((D / 'img' / 'emblem.webp').read_bytes()).decode()
    host = (D / 'pult-host-file.js').read_text(encoding='utf-8')
    host = rep(host, "btn.innerHTML = '📱 Пульт<i class=\"pd-dot\"></i>';", "btn.innerHTML = " + json.dumps(IC_PHONE + '<span>Пульт</span><i class="pd-dot"></i>') + ";")
    host = rep(host, '<h2 id="pd-ttl">📱 Пульт на телефоні</h2>', '<h2 id="pd-ttl"><img src="' + emblem + '" alt="">Пульт на телефоні</h2>')
    host = rep(host, "'<span>📱 Телефон «<b></b>» просить доступ до пульта.", "'<span>Телефон «<b></b>» просить доступ до пульта.")
    inl = lambda t: '<script>\n' + t + '\n</script>'
    for tag, text in [('<script src="../../src/qr.js"></script>', (D / 'qr.js').read_text(encoding='utf-8')),
                      ('<script src="../../src/skob.js"></script>', (D / 'skob.js').read_text(encoding='utf-8')),
                      ('<script src="maliunky.js"></script>', (TUT / 'maliunky.js').read_text(encoding='utf-8')),
                      ('<script src="dani.js"></script>', (TUT / 'dani.js').read_text(encoding='utf-8')),
                      ('<script src="../../src/pult-host-file.js"></script>', host)]:
        src = rep(src, tag, inl(text))
    if kart:   # картинки з ChatGPT (19.10.2026) — поки лише в макетах; після «ставимо» — і на сайті
        k = (TUT / 'kartynky.js').read_text(encoding='utf-8')
        k = rep(k, '/*{{KART}}*/', ','.join(json.dumps(f.stem) + ":'data:image/webp;base64," + base64.b64encode(f.read_bytes()).decode() + "'" for f in sorted((TUT / 'kartynky').glob('*.webp'))))
        src = src.replace(inl((TUT / 'maliunky.js').read_text(encoding='utf-8')), inl((TUT / 'maliunky.js').read_text(encoding='utf-8')) + '\n' + inl(k), 1)
        # стиль «Гончарня» (19.10.2026) — разом з картинками, поки лише в макетах
        src = rep(src, '</style>', (TUT / 'tema-gonch.css').read_text(encoding='utf-8') + '\n</style>')
        src = src.replace(inl(k), inl(k) + '\n' + inl((TUT / 'tema-gonch.js').read_text(encoding='utf-8')), 1)
        src = rep(src, 'family=Source+Sans+3:wght@400;600;700&display=swap', 'family=Source+Sans+3:wght@400;600;700&family=Commissioner:wght,FLAR,VOLM@100..900,0..100,0..100&family=Unbounded:wght@800&display=swap')
    src = src.replace('{{EMBLEM}}', emblem).replace('{{KMAP}}', 'data:image/webp;base64,' + base64.b64encode((D / 'img' / 'keramika-map.webp').read_bytes()).decode())
    # на сайті — коротка адреса гравця gutirky-fi.github.io/skob; локально (перевірка) — поруч
    pre = "window.SKOB_URL = location.hostname === 'gutirky-fi.github.io' ? 'https://gutirky-fi.github.io/skob/' : new URL(" + json.dumps(skob_rel) + ", location.href).href;"
    pre += ('window.GUTIRKA_YUN_URL = ' + json.dumps(yun_rel) + ';') if yun_rel else 'window.GUTIRKA_YUN = true;'
    if home:   # куди ведуть «назад» і «Бібліотека» (у макеті — розділ сайту)
        pre += 'window.GUTIRKA_HOME = ' + json.dumps({'href': home[0], 'label': home[1]}, ensure_ascii=False) + ';'
    src = src.replace('<script>\n', '<script>' + pre + '</script>\n<script>\n', 1)
    assert 'noindex' in src and '{{' not in src.replace('${{', '')
    return src


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True); path.write_text(text, encoding='utf-8'); print('  ', path.relative_to(SITE))


if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'proba'
    gr = (D / 'skob-gravets.html').read_text(encoding='utf-8')
    write(SITE / 'skob' / 'index.html', gr)   # коротка адреса для телефонів: gutirky-fi.github.io/skob
    if mode == 'vhody':   # макет «кілька входів»: proba/vhody/ — з гутірки й сторінки юнаків назад у макет
        root = SITE / 'proba' / 'vhody'
        write(root / 'gutirky' / 'keramika-1' / 'index.html', page('../../skob/', '../../yunakam/keramika-1/', ('../../#vyh', 'Виховники'), kart=True))
        write(root / 'yunakam' / 'keramika-1' / 'index.html', page('../../skob/', None, ('../../#yun', 'Юнацтво'), kart=True))
        write(root / 'skob' / 'index.html', gr)
    elif mode == 'proba':
        write(SITE / 'proba' / 'keramika-1' / 'index.html', page('../skob/', '../yunakam/keramika-1/', kart=True))
        write(SITE / 'proba' / 'yunakam' / 'keramika-1' / 'index.html', page('../../skob/', kart=True))
        write(SITE / 'proba' / 'skob' / 'index.html', gr)
    else:
        root = SITE / (sys.argv[2] if len(sys.argv) > 2 else 'proba/sait')
        write(root / 'gutirky' / 'keramika-1' / 'index.html', page('../../skob/', '../../yunakam/keramika-1/'))
        write(root / 'yunakam' / 'keramika-1' / 'index.html', page('../../skob/'))
        write(root / 'skob' / 'index.html', gr)
