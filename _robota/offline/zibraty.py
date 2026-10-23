"""Офлайн-файл «Кераміка України» — один .html, що працює без інтернету (флешка, інший ноутбук, телефон).

    python3 _robota/offline/zibraty.py         -> gutirky/keramika/druk/keramika-ukrainy-oflain.html

Що робить: збирає бібліотеку (build.py) з лише «Керамікою України» (window.GUTIRKA_OFFLINE),
вбудовує шрифти (підмножина: латиниця, кирилиця, знаки) замість Google Fonts, задає адресу пульта й гри на сайті.
Без інтернету працює вся гутірка (обидві версії, карта, фото, вікторина); пульт і гра з телефонів — лише з інтернетом.
"""
import base64, io, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROB = os.path.dirname(HERE); ROOT = os.path.dirname(ROB)
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'gutirky', 'keramika', 'druk', 'keramika-ukrainy-oflain.html')
tmp = OUT + '.tmp.html'
env = dict(os.environ, OUT=tmp, PULT_URL='https://gutirky-fi.github.io/pult/')
subprocess.run([sys.executable, os.path.join(ROB, 'build.py')], env=env, check=True, stdout=subprocess.DEVNULL)
h = open(tmp, encoding='utf8').read(); os.remove(tmp)

# шрифти: підмножина (латиниця, кирилиця, типографські знаки) у woff, вбудовано
from fontTools import subset
from fontTools.ttLib import TTFont
FONTS = [('Source Sans 3', os.path.join(ROB, 'druk', 'shryfty', 'SourceSans3.ttf'), '200 900'),
         ('Oswald', os.path.join(ROB, 'druk', 'shryfty', 'Oswald.ttf'), '200 700'),
         ('Caveat', os.path.join(HERE, 'shryfty', 'Caveat.ttf'), '400 700'),
         ('Playfair Display', os.path.join(HERE, 'shryfty', 'PlayfairDisplay.ttf'), '400 900')]
UNI = [*range(0x20, 0x7F), *range(0xA0, 0x180), *range(0x400, 0x530), *range(0x2010, 0x2070), 0x20B4, 0x20AC, 0x2116, 0x2122, *range(0x2190, 0x2200)]
faces = []
for fam, path, wt in FONTS:
    f = TTFont(path)
    o = subset.Options(); o.flavor = 'woff'; o.layout_features = ['*']; o.name_IDs = ['*']; o.notdef_outline = True
    s = subset.Subsetter(o); s.populate(unicodes=UNI); s.subset(f)
    b = io.BytesIO(); f.flavor = 'woff'; f.save(b)
    faces.append(f"@font-face{{font-family:'{fam}';src:url(data:font/woff;base64,{base64.b64encode(b.getvalue()).decode()}) format('woff');font-weight:{wt};font-display:swap}}")
link = re.search(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>', h)
assert link, 'немає посилання на Google Fonts'
h = h.replace(link.group(0), '<style>' + ''.join(faces) + '</style>', 1)
h = re.sub(r'<link rel="preconnect"[^>]*>\s*', '', h)

pre = ("<script>window.GUTIRKA_OFFLINE=true;window.SKOB_URL='https://gutirky-fi.github.io/skob/';window.SKOB_SHORT='gutirky-fi.github.io/skob';</script>\n")
i = h.index('<script'); h = h[:i] + pre + h[i:]
h = re.sub(r'<title>[^<]*</title>', '<title>Кераміка України — офлайн</title>', h, count=1)
open(OUT, 'w', encoding='utf8').write(h)
print(OUT, round(len(h.encode()) / 1e6, 2), 'МБ')
