"""Документи гуртка — сторінки сайту (Етап 3).
   python3 _robota/dokumenty/sait/zibraty.py        -> проба  proba/dokumenty/vidviduvanist/  (зі смужкою «Проба»)
   python3 _robota/dokumenty/sait/zibraty.py sait   -> сайт   dokumenty/vidviduvanist/        (лише після «так» власника)
   Проба з вигаданими іменами без мережі: додати до адреси ?demo (код 1234).
   Адресу приймача сторінка бере з посилання виховника (#p=…), не з репозиторію."""
import pathlib, base64, sys
TUT = pathlib.Path(__file__).parent
ROB = TUT.parent.parent
SITE = ROB.parent
IMG = ROB / 'src' / 'img'


def uri(p, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(p.read_bytes()).decode()


SAIT = len(sys.argv) > 1 and sys.argv[1] == 'sait'
for nazva in ('vidviduvanist',):
    s = (TUT / (nazva + '.html')).read_text(encoding='utf-8')
    s = s.replace('{{LOGO}}', uri(IMG / 'logo.png', 'image/png')).replace('{{EMBLEM}}', uri(IMG / 'emblem.webp', 'image/webp')).replace('{{EMBLEM_D}}', uri(IMG / 'emblem-qr.webp', 'image/webp'))
    s = s.replace('<!--RIBBON-->', '' if SAIT else '<div class="ribbon">Проба для перегляду. На сайті цієї сторінки ще немає.</div>')
    assert 'noindex' in s and '{{' not in s
    out = SITE / ('dokumenty' if SAIT else 'proba/dokumenty') / nazva / 'index.html'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(s, encoding='utf-8')
    print('  ', out.relative_to(SITE), len(s) // 1024, 'КБ')
