"""Вітрина: усі макети бібліотеки на одній сторінці (щоб показати іншим) -> proba/index.html + proba/vitryna/*.webp.
   Знімки сторінок — img/*.webp (640×400); оновити їх: знімок кожної сторінки 1280×800, зменшити вдвічі.
   python3 _robota/proby/vitryna/zibraty.py"""
import pathlib, base64, shutil
TUT = pathlib.Path(__file__).parent
SITE = TUT.parent.parent.parent
src = (TUT / 'index.html').read_text(encoding='utf-8')
src = src.replace('{{LOGO}}', 'data:image/png;base64,' + base64.b64encode((SITE / '_robota' / 'src' / 'img' / 'logo.png').read_bytes()).decode())
assert 'noindex' in src and '{{' not in src
(SITE / 'proba').mkdir(exist_ok=True)
(SITE / 'proba' / 'index.html').write_text(src, encoding='utf-8')
out = SITE / 'proba' / 'vitryna'; out.mkdir(exist_ok=True)
for f in (TUT / 'img').glob('*.webp'):
    shutil.copy(f, out / f.name)
print('   proba/index.html + proba/vitryna/ (' + str(len(list(out.glob('*.webp')))) + ' знімків)')
