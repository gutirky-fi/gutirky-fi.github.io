"""Макет «Один сайт — кілька входів» (для перегляду власником, 14.10.2026).
   python3 _robota/proby/vhody/zibraty.py   ->  proba/vhody/index.html  (усе в одному файлі)
   Гутірки й сторінки для юнаків відкриваються справжні — з копії сайту proba/sait/."""
import pathlib, base64
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
assert 'noindex' in src and '{{' not in src.replace('${{', '')
out = SITE / 'proba' / 'vhody' / 'index.html'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(src, encoding='utf-8')
print('  ', out.relative_to(SITE), len(src) // 1024, 'КБ')
