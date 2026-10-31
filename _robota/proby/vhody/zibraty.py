"""Сайт «Один сайт — кілька входів» (макет з 14.10.2026; на справжньому сайті — з 19.10.2026).
   python3 _robota/proby/vhody/zibraty.py sait  ->  СПРАВЖНІЙ САЙТ: index.html (входи) + biblioteka/index.html (бібліотека з «Керамікою України»)
   python3 _robota/proby/vhody/zibraty.py       ->  макет proba/vhody/index.html  (усе в одному файлі)
   Поруч збирає копії справжніх сторінок, з яких «назад» веде в макет:
     proba/vhody/gutirky/budova-la-1/, proba/vhody/yunakam/budova-la-1/, proba/vhody/skob/  (zibraty.py гутірки, режим vhody)
     proba/vhody/biblioteka/  — «Кераміка» (build.py з HOME_URL=../#vyh: замість бібліотеки — назад у макет)"""
import pathlib, base64, os, subprocess, sys, json
TUT = pathlib.Path(__file__).parent
ROB = TUT.parent.parent
SITE = ROB.parent
D = ROB / 'src'


def uri(p, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(p.read_bytes()).decode()


def rep(s, a, b):
    assert s.count(a) == 1, (s.count(a), a[:60])
    return s.replace(a, b)


src = (TUT / 'index.html').read_text(encoding='utf-8')
src = rep(src, '<script src="../../src/skills_data.js"></script>', '<script>\n' + (D / 'skills_data.js').read_text(encoding='utf-8') + '\n</script>')
src = src.replace('{{LOGO}}', uri(D / 'img' / 'logo.png', 'image/png')).replace('{{EMBLEM}}', uri(D / 'img' / 'emblem.webp', 'image/webp'))
# малюнки гутірок для «Нових гутірок» у виховників
for k, f in [('{{LA_ART}}', 'budova-la-1.webp'), ('{{K1_ART}}', 'keramika-1.webp'), ('{{KERAMIKA_MAP}}', 'keramika-map.webp')]:
    assert k in src, k
    src = src.replace(k, uri(D / 'img' / f, 'image/webp'))
assert 'noindex' in src and '{{' not in src.replace('${{', '')
if len(sys.argv) > 1 and sys.argv[1] == 'sait':
    # справжній сайт: без смужки «макет»; нові гутірки й матеріали до них — поки сховані (додамо після перевірки)
    # тимчасова смужка «Чернетка» (з 22.10.2026, за рішенням власника; щоб прибрати — замінити на '')
    src = rep(src, '<div class="ribbon">Макет для перегляду. Справжній сайт не змінено. <a href="/proba/">← Усі макети</a></div>', '<div class="ribbon">Чернетка. Сайт поки не відкритий для всіх і може бути перероблений.</div>')
    i = src.index('<div id="cmpk"'); j = src.index('</script>', i) + len('</script>'); src = src[:i] + src[j:]   # перемикач порівняння смужок — лише в макеті
    import re; src = re.sub(r'/\*PG\*/.*?/\*/PG\*/\n|\s*<!--PG-->.*?<!--/PG-->', '', src, flags=re.S)   # «Від Пласту» — поки лише в макеті (31.10.2026, чекає згоди власника)
    src = rep(src, '<title>Пластова бібліотека — макет</title>', '<title>Пластова бібліотека</title>')
    src = rep(src, ' <b>У макеті код — 1912.</b>', '')
    src = src.replace("'proba-vhody:", "'gutirky:")
    hide = {'mat': [], 'gut': []}   # 19.10.2026: «Будова ЛА І» і «Кераміка І» — на сайті (власник погодив після перевірки)
    pre = '<script>window.SAIT_HIDE = ' + json.dumps(hide, ensure_ascii=False) + "; window.SAIT_OLD = 'biblioteka/';</script>\n"
    i = src.index('<script'); src = src[:i] + pre + src[i:]
    assert 'proba-vhody' not in src and 'ribbon">Макет' not in src
    (SITE / 'index.html').write_text(src, encoding='utf-8')
    print('   index.html', len(src) // 1024, 'КБ')
    env = dict(os.environ); [env.pop(k, None) for k in ('OUT', 'PREVIEW', 'HOME_URL', 'HOME_LABEL')]
    subprocess.run([sys.executable, str(ROB / 'build.py')], check=True, env=env)   # -> biblioteka/index.html
    for g in ('budova-la-1', 'keramika-1'):   # нові гутірки: gutirky/…, yunakam/…, skob/
        subprocess.run([sys.executable, str(ROB / 'gutirky' / g / 'zibraty.py'), 'sait', '.'], check=True)
    sys.exit(0)
out = SITE / 'proba' / 'vhody' / 'index.html'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(src, encoding='utf-8')
print('  ', out.relative_to(SITE), len(src) // 1024, 'КБ')
subprocess.run([sys.executable, str(ROB / 'gutirky' / 'budova-la-1' / 'zibraty.py'), 'vhody'], check=True)
subprocess.run([sys.executable, str(ROB / 'gutirky' / 'keramika-1' / 'zibraty.py'), 'vhody'], check=True)
env = dict(os.environ, OUT=str(SITE / 'proba' / 'vhody' / 'biblioteka' / 'index.html'), HOME_URL='../#vyh', HOME_LABEL='Виховники')
env.pop('PREVIEW', None)
(SITE / 'proba' / 'vhody' / 'biblioteka').mkdir(parents=True, exist_ok=True)
subprocess.run([sys.executable, str(ROB / 'build.py')], check=True, env=env)
