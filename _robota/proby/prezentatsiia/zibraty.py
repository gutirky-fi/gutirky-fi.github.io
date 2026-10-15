"""Презентація «Бібліотека гутірок: що вміє і куди росте» (18 слайдів) -> сторінка сайту proba/prezentatsiia/.
   Джерело — копія слайдів із презентації (dzherelo/: deck.json, slides/*.html, img/*.webp, blob-map.txt).
   Слайди малюються в Chromium (Playwright) у картинки 1920×1080 + один PDF; нотатки ведучого (<aside>) — у notes.
   python3 _robota/proby/prezentatsiia/zibraty.py [ТЕКА_ШРИФТІВ]
   ТЕКА_ШРИФТІВ — локальні Oswald/SourceSans3/Caveat (oswald/Oswald[wght].ttf …), якщо немає доступу до Google Fonts."""
import base64, json, os, pathlib, re, sys, html
from playwright.sync_api import sync_playwright
from PIL import Image

TUT = pathlib.Path(__file__).parent
SITE = TUT.parent.parent.parent
SRC = TUT / 'dzherelo'
OUT = SITE / 'proba' / 'prezentatsiia'
FONTS = sys.argv[1] if len(sys.argv) > 1 else ''

deck = json.loads((SRC / 'deck.json').read_text(encoding='utf-8'))
blobs = dict(l.split() for l in (SRC / 'blob-map.txt').read_text().splitlines() if l.strip())
ICONS = {  # x-icon з презентації -> звичайні SVG (контурні іконки)
    'Check': '<path d="M20 6 9 17l-5-5"/>',
    'Globe': '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    'Lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'Play': '<polygon points="6 3 20 12 6 21 6 3"/>'}
GF = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@400..700&family=Source+Sans+3:wght@400..700&family=Caveat:wght@500..700&display=swap">'
FCSS = """@font-face{font-family:Oswald;src:url(https://f.local/oswald/Oswald[wght].ttf);font-weight:200 700}
@font-face{font-family:'Source Sans 3';src:url(https://f.local/sourcesans3/SourceSans3[wght].ttf);font-weight:200 900}
@font-face{font-family:Caveat;src:url(https://f.local/caveat/Caveat[wght].ttf);font-weight:400 700}"""
BASE = "*{box-sizing:border-box}html,body{margin:0;background:#1b1d21}p,h1,h2,h3,h4,figure,table{margin:0}section{width:1920px;height:1080px;overflow:hidden;position:relative}"


def slide(sid):
    s = (SRC / 'slides' / (sid + '.html')).read_text(encoding='utf-8')
    note = ''
    m = re.search(r'<aside>(.*?)</aside>', s, re.S)
    if m:
        note = html.unescape(re.sub(r'<[^>]+>', '', m.group(1))).strip()
        s = s.replace(m.group(0), '')
    for bid, f in blobs.items():
        s = s.replace('/_blob/' + bid, 'data:image/webp;base64,' + base64.b64encode((SRC / 'img' / f).read_bytes()).decode())
    s = re.sub(r'<x-icon name="(\w+)" style="([^"]*)">\s*</x-icon>',
               lambda m: f'<svg style="{m.group(2)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{ICONS[m.group(1)]}</svg>', s)
    assert '/_blob/' not in s and 'x-icon' not in s, sid
    return s, note


def page(body):
    return f'<!doctype html><html lang="uk"><head><meta charset="utf-8">{"" if FONTS else GF}<style>{FCSS if FONTS else ""}{BASE}@page{{size:1920px 1080px;margin:0}}section{{break-after:page}}</style></head><body>{body}</body></html>'


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True); (OUT / 'slaidy').mkdir(exist_ok=True)
    slides = [slide(sid) for sid in deck['order']]
    with sync_playwright() as p:
        b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1920, 'height': 1080})
        if FONTS:
            ctx.route('https://f.local/**', lambda r: r.fulfill(status=200, content_type='font/ttf', body=open(FONTS + r.request.url.split('f.local')[1].replace('%5B', '[').replace('%5D', ']'), 'rb').read()))
        pg = ctx.new_page()
        for i, (s, _) in enumerate(slides, 1):
            pg.set_content(page(s)); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(250)
            png = OUT / 'slaidy' / f'{i:02d}.png'; pg.screenshot(path=str(png))
            Image.open(png).convert('RGB').save(OUT / 'slaidy' / f'{i:02d}.webp', 'WEBP', quality=84); png.unlink()
        pg.set_content(page(''.join(s for s, _ in slides))); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(400)
        pg.pdf(path=str(OUT / 'prezentatsiia-biblioteka-gutirok.pdf'), width='1920px', height='1080px', print_background=True)
        b.close()
    meta = {'title': deck['title'], 'n': len(slides), 'notes': [n for _, n in slides]}
    tpl = (TUT / 'index.html').read_text(encoding='utf-8')
    tpl = tpl.replace('/*{{DECK}}*/', 'const DECK = ' + json.dumps(meta, ensure_ascii=False) + ';')
    assert 'noindex' in tpl and '{{' not in tpl
    (OUT / 'index.html').write_text(tpl, encoding='utf-8')
    print('   proba/prezentatsiia/ —', len(slides), 'слайдів, PDF', round(os.path.getsize(OUT / 'prezentatsiia-biblioteka-gutirok.pdf') / 1e6, 1), 'МБ')
