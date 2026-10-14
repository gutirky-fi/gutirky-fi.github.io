"""Збирає ПРОБНУ копію для показу власникові (не головний сайт):
   proba/budova-la-1/index.html — гутірка з грою «Потужний СКОБ!» (усе в одному файлі)
   proba/skob/index.html        — сторінка гравця (телефон)
Запуск: python3 _robota/gutirky/budova-la-1/proba.py"""
import pathlib, re
TUT = pathlib.Path(__file__).parent
ROB = TUT.parent.parent
SITE = ROB.parent
src = (TUT / 'index.html').read_text(encoding='utf-8')
inl = lambda p: '<script>\n' + p.read_text(encoding='utf-8') + '\n</script>'
for tag, path in [('<script src="../../src/qr.js"></script>', ROB / 'src' / 'qr.js'),
                  ('<script src="../../src/skob.js"></script>', ROB / 'src' / 'skob.js'),
                  ('<script src="dani.js"></script>', TUT / 'dani.js')]:
    assert src.count(tag) == 1, tag
    src = src.replace(tag, inl(path))
src = src.replace('<script>\n', "<script>window.SKOB_URL = new URL('../skob/', location.href).href;</script>\n<script>\n", 1)
assert 'noindex' in src
out = SITE / 'proba' / 'budova-la-1' / 'index.html'; out.parent.mkdir(parents=True, exist_ok=True); out.write_text(src, encoding='utf-8')
pl = SITE / 'proba' / 'skob' / 'index.html'; pl.parent.mkdir(parents=True, exist_ok=True)
pl.write_text((ROB / 'src' / 'skob-gravets.html').read_text(encoding='utf-8'), encoding='utf-8')
print('готово:', out.relative_to(SITE), pl.relative_to(SITE))
