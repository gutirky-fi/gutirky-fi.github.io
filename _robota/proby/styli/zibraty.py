"""Показ «Стилі гутірок» (19.10.2026): ті самі гутірки — кожна у своєму стилі.
   python3 _robota/proby/styli/zibraty.py  ->  proba/styli/index.html + proba/styli/img/
   art/*.svg — малюнки з самих гутірок (LA_ART.get + fit, витягнуто з живих сторінок)."""
import pathlib, base64, re, shutil
TUT = pathlib.Path(__file__).parent
SITE = TUT.parent.parent.parent
D = SITE / '_robota' / 'src'
src = (TUT / 'index.html').read_text(encoding='utf-8')
src = src.replace('{{EMBLEM}}', 'data:image/webp;base64,' + base64.b64encode((D / 'img' / 'emblem.webp').read_bytes()).decode())
src = re.sub(r'\{\{ART:([a-z0-9-]+)\}\}', lambda m: (TUT / 'art' / (m.group(1) + '.svg')).read_text(encoding='utf-8').replace('<svg ', '<svg aria-hidden="true" ', 1), src)
assert 'noindex' in src and '{{' not in src
out = SITE / 'proba' / 'styli'
(out / 'img').mkdir(parents=True, exist_ok=True)
(out / 'index.html').write_text(src, encoding='utf-8')
for f in (TUT / 'img').glob('*.webp'):
    shutil.copy(f, out / 'img' / f.name)
print('  ', (out / 'index.html').relative_to(SITE), len(src) // 1024, 'КБ')
