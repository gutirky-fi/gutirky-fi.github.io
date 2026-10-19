"""Збирає гутірку «Будова літальних апаратів І» в один файл (з грою «Потужний СКОБ!», малюнками й пультом).
   python3 _robota/gutirky/budova-la-1/zibraty.py proba          -> proba/budova-la-1/ + proba/yunakam/budova-la-1/ + proba/skob/   (перша проба)
   python3 _robota/gutirky/budova-la-1/zibraty.py sait [КОРІНЬ]  -> КОРІНЬ/gutirky/budova-la-1/ + КОРІНЬ/yunakam/budova-la-1/ + КОРІНЬ/skob/
   python3 _robota/gutirky/budova-la-1/zibraty.py vhody          -> proba/vhody/gutirky/… + proba/vhody/yunakam/… (для макета; «назад» — у макет)
   yunakam/… — сторінка для юнаків (лише «Вивчай сам» і «Перевір себе», без гутірки й плану); посилання на неї — у виховника → «Для юнаків» і QR на останньому слайді
                                                                   (КОРІНЬ: proba/sait — копія для показу; . — справжній сайт)"""
import pathlib, sys, base64, json
TUT = pathlib.Path(__file__).parent
ROB = TUT.parent.parent
SITE = ROB.parent
D = ROB / 'src'
IC_PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>'


def rep(s, a, b):
    assert s.count(a) == 1, (s.count(a), a[:80])
    return s.replace(a, b)


def page(skob_rel, yun_rel=None, home=None, tema=False):
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
    if tema:   # стиль «Креслення» (19.10.2026) — поки лише в макетах
        src = rep(src, '</style>', (TUT / 'tema-kresl.css').read_text(encoding='utf-8') + '\n</style>')
        mal = inl((TUT / 'maliunky.js').read_text(encoding='utf-8'))
        src = src.replace(mal, mal + '\n' + inl((TUT / 'tema-kresl.js').read_text(encoding='utf-8')), 1)
        src = rep(src, 'family=Source+Sans+3:wght@400;600;700&display=swap', 'family=Source+Sans+3:wght@400;600;700&family=Unbounded:wght@700;900&family=Fira+Sans+Condensed:wght@600&display=swap')
    src = src.replace('{{EMBLEM}}', emblem)
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
        write(root / 'gutirky' / 'budova-la-1' / 'index.html', page('../../skob/', '../../yunakam/budova-la-1/', ('../../#vyh', 'Виховники'), tema=True))
        write(root / 'yunakam' / 'budova-la-1' / 'index.html', page('../../skob/', None, ('../../#yun', 'Юнацтво'), tema=True))
        write(root / 'skob' / 'index.html', gr)
    elif mode == 'proba':
        write(SITE / 'proba' / 'budova-la-1' / 'index.html', page('../skob/', '../yunakam/budova-la-1/', tema=True))
        write(SITE / 'proba' / 'yunakam' / 'budova-la-1' / 'index.html', page('../../skob/', tema=True))
        write(SITE / 'proba' / 'skob' / 'index.html', gr)
    else:
        root = SITE / (sys.argv[2] if len(sys.argv) > 2 else 'proba/sait')
        # справжній сайт (корінь): з гутірки «назад» — у «Виховники», зі сторінки юнаків — у «Юнацтво»; стиль і картинки — як у макеті (з 19.10.2026)
        real = root.resolve() == SITE.resolve()
        write(root / 'gutirky' / 'budova-la-1' / 'index.html', page('../../skob/', '../../yunakam/budova-la-1/', ('../../#vyh', 'Виховники') if real else None, tema=True))
        write(root / 'yunakam' / 'budova-la-1' / 'index.html', page('../../skob/', None, ('../../#yun', 'Юнацтво') if real else None, tema=True))
        write(root / 'skob' / 'index.html', gr)
