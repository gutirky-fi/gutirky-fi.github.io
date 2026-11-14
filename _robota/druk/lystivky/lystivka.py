"""Листівки-книжечки на А3 для друку й різання ножем.

    python3 lystivka.py taksa                  # одна листівка з таблиці KARTKY
    python3 lystivka.py taksa --fon 254,247,237  # лицьова панель залита кольором
    python3 lystivka.py vsi                    # усі листівки з таблиці
    python3 lystivka.py litera_a --foto        # лицьова - фото на всю панель (див. foto_na_lytsovu.py)
    python3 lystivka.py kit_yalynka --orel     # на звороті лілея + емблема «Орли волі» + підпис (файл ..._orel.pdf)

Результат: gotovi/lystivky_<назва>_A3_bez_fonu.pdf (або _z_fonom.pdf).

Розклад (узято зі зразка vkhid/zrazok_krokodyl_A3.pdf):
  А3 книжкова (297x420 мм), 8 листівок: 2 стовпці x 4 ряди.
  Листівка розгорнута 140x95 мм: ліворуч зворот (папір + лілея), праворуч лицьова, згин посередині.
  Листівки стоять упритул: один різ ножем розділяє дві сусідні.
  Посередині аркуша проміжок 10 мм, щоб розрізати аркуш навпіл ножицями.
  Мітки різу лише на полях і обабіч проміжку, сірі пунктирні мітки - згин.
"""
import sys, os
import numpy as np
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

TUT = os.path.dirname(os.path.abspath(__file__))
LILEYA = os.path.join(TUT, '..', 'lileya.png')

# назва: (малюнок у malyunky/, колір лілеї RGB, розмір малюнка: ('w'|'h', мм), заголовок)
#   'w' 56 - малюнок (без порожніх країв) 56 мм завширшки; 'h' 64 - 64 мм заввишки.
#   Панель 70x95 мм; щоб були відступи, ширина до ~56 мм, висота до ~83 мм.
KARTKY = {
    'vedmedyk':           ('vedmedyk.png',           (33, 37, 41),   ('h', 82.1), 'Ведмедик'),
    'krokodyl':           ('krokodyl.png',           (90, 125, 84),  ('h', 64.0), 'Крокодил'),
    'taksa':              ('taksa.png',              (95, 67, 46),   ('w', 52.0), 'Такса'),
    'za_volyu_ukrainy':   ('za_volyu_ukrainy.png',   (24, 128, 102), ('w', 56.0), 'За волю України'),
    'syl_kras_ober_byst': ('syl_kras_ober_byst.png', (0, 0, 0),      ('w', 56.0), 'Сильно Красно Обережно Бистро'),
    'chotyry_symvoly':    ('chotyry_symvoly.png',    (0, 0, 0),      ('w', 56.0), 'Чотири символи'),
    'litera_a':           ('litera_a.png',           (49, 49, 49),   ('w', 56.0), 'Літера А з лампочками'),
    'kit_yalynka':        ('kit_yalynka.png',        (96, 80, 68),   ('w', 56.0), 'Кіт-ялинка'),
    'kit_chornyi_hirlianda': ('kit_chornyi_hirlianda_lytsova.jpg', (38, 18, 16), ('w', 70.0), 'Чорний кіт у гірлянді'),
    'kit_klubochok':      ('kit_klubochok.png',      (25, 25, 25),   ('w', 56.0), 'Кіт-клубочок у гірлянді'),
    'kit_khvist_yalynka': ('kit_khvist_yalynka.png', (25, 25, 25),   ('w', 56.0), 'Кіт із хвостом-ялинкою'),
    'kit_zirka':          ('kit_zirka.png',          (25, 25, 25),   ('h', 80.0), 'Кіт із зіркою'),
    'vedmid_lys':         ('vedmid_lys.png',         (100, 72, 52),  ('w', 56.0), 'Ведмідь і лис'),
    'kit_yalynka_chornyi': ('kit_yalynka_chornyi.png', (25, 25, 25), ('w', 56.0), 'Чорний кіт-ялинка'),
    'kit_kovpak':         ('kit_kovpak.png',         (25, 25, 25),   ('w', 56.0), 'Кіт у ковпаку з хвостом-ялинкою'),
    'kit_yalynka_smuhastyi': ('kit_yalynka_smuhastyi.png', (25, 25, 25), ('w', 56.0), 'Кіт-ялинка зі смугастим хвостом'),
    'kit_svitlyachok':    ('kit_svitlyachok_lytsova.jpg', (25, 25, 25), ('w', 70.0), 'Кіт-світлячок'),
    'kit_oleni_rizhky':   ('kit_oleni_rizhky_lytsova.jpg', (25, 25, 25), ('w', 70.0), 'Кіт з оленячими ріжками (крафт)'),
    'korgi':              ('korgi_lytsova.jpg',      (110, 80, 58),  ('w', 70.0), 'Коргі з гірляндою'),
}

# листівки, де лицьова - ФОТО на всю панель (готує foto_na_lytsovu.py); вмикається прапорцем --foto
FOTO = {'litera_a': 'litera_a_lytsova.jpg', 'kit_chornyi_hirlianda': 'kit_chornyi_hirlianda_lytsova.jpg',
        'kit_svitlyachok': 'kit_svitlyachok_lytsova.jpg', 'kit_oleni_rizhky': 'kit_oleni_rizhky_lytsova.jpg',
        'korgi': 'korgi_lytsova.jpg'}

PAGE_W, PAGE_H = 297*mm, 420*mm
PW, PH = 70*mm, 95*mm              # одна панель (зворот або лицьова)
COLS, ROWS = 2, 4
CGAP = 10*mm                       # проміжок посередині аркуша
gw, gh = COLS*2*PW, ROWS*PH + CGAP
gx, gy = (PAGE_W-gw)/2, (PAGE_H-gh)/2
BL_V, BL_R = 1.5*mm, 1.0*mm       # заліз фону за лінію різу (лише коли --fon)
LILY_H = 31*mm
# Зворот з --orel (вибір власника 14.11, варіант 4): лілея, під нею емблема гуртка, під емблемою
# «гурток «Орли волі»», а в різдвяних - ще «Різдво 2026». Рік міняти тут.
GURTOK = 'гурток «Орли волі»'
RIK_RIZDVA = 'Різдво 2026'
RIZDVO = {'kit_yalynka', 'kit_chornyi_hirlianda', 'kit_klubochok', 'kit_khvist_yalynka', 'kit_zirka',
          'kit_yalynka_chornyi', 'kit_kovpak', 'kit_yalynka_smuhastyi', 'kit_svitlyachok', 'kit_oleni_rizhky',
          'korgi'}                 # інші (дні народження, ведмідь і лис, патріотичні) - без «Різдво»


def pidpysy(nazva):
    return [(GURTOK, 8)] + ([(RIK_RIZDVA, 7)] if nazva in RIZDVO else [])


def zvorot_orel(c, x, y, kolir, lpath, lw, lh, opath, ryadky):
    """Лілея вгорі, емблема 12 мм, під нею рядки підпису (того самого кольору)."""
    c.drawImage(lpath, x+PW/2-lw/2, y+PH/2-lh/2+10*mm, lw, lh, mask='auto')
    oy = y + 16*mm
    c.drawImage(opath, x+PW/2-6*mm, oy, 12*mm, 12*mm, mask='auto')
    c.setFillColorRGB(*(v/255 for v in kolir))
    for j, (t, sz) in enumerate(ryadky):
        c.setFont('LoraI', sz); c.drawCentredString(x+PW/2, oy-4.5*mm-j*4*mm, t)


def row_y(r):                      # низ ряду r (0 - верхній)
    return gy + gh - (r+1)*PH - (CGAP if r >= 2 else 0)


def lileya(kolir):
    im = Image.open(LILEYA).convert('RGBA')
    a = np.asarray(im).copy()
    a[..., :3] = kolir
    out = os.path.join(TUT, 'malyunky', '_lileya_%d_%d_%d.png' % kolir)
    Image.fromarray(a, 'RGBA').save(out)
    return out, im.size


def zibraty(nazva, fon=None, foto=False, orel=False):
    fail, kolir, (os_, rozmir), zaholovok = KARTKY[nazva]
    art_path = os.path.join(TUT, 'malyunky', fail)
    art = Image.open(art_path).convert('RGBA')
    aw, ah = art.size
    al = np.asarray(art.getchannel('A'))
    ys, xs = np.where(al > 30)
    bx0, bx1, by0, by1 = xs.min(), xs.max()+1, ys.min(), ys.max()+1
    s = rozmir*mm / ((bx1-bx0) if os_ == 'w' else (by1-by0))
    cx, cy = (bx0+bx1)/2, (by0+by1)/2
    print('%s: малюнок %.1f x %.1f мм, %.0f точок на дюйм' % (nazva, (bx1-bx0)*s/mm, (by1-by0)*s/mm, 25.4*mm/s))

    if foto and nazva not in FOTO:
        sys.exit('для %s немає фото-лицьової (див. FOTO)' % nazva)
    foto_path = os.path.join(TUT, 'malyunky', FOTO[nazva]) if foto else None
    lpath, (lw0, lh0) = lileya(kolir)
    if orel:                                   # знак гуртка тим самим кольором, що й лілея
        oa = np.asarray(Image.open(os.path.join(TUT, 'malyunky', 'orly_voli.png')).convert('RGBA')).copy()
        oa[..., :3] = kolir
        opath = os.path.join(TUT, 'malyunky', '_orel_%d_%d_%d.png' % kolir)
        Image.fromarray(oa, 'RGBA').save(opath)
        pdfmetrics.registerFont(TTFont('LoraI', os.path.join(TUT, '..', 'shryfty', 'Lora-Italic-Variable.ttf')))
    lh, lw = LILY_H, LILY_H*lw0/lh0

    out = os.path.join(TUT, 'gotovi', 'lystivky_%s_A3_%s%s.pdf' % (nazva, 'z_fonom' if fon else ('foto_lytsova' if foto else 'bez_fonu'), '_orel' if orel else ''))
    c = canvas.Canvas(out, pagesize=(PAGE_W, PAGE_H))
    c.setTitle('Листівка «%s» - А3, 8 шт, розріз по центру' % zaholovok)
    for r in range(ROWS):
        for k in range(COLS):
            x, y = gx + k*2*PW, row_y(r)
            if orel:                   # лілея трохи вище, орел 12 мм унизу
                zvorot_orel(c, x, y, kolir, lpath, lw, lh, opath, pidpysy(nazva))
            else:
                c.drawImage(lpath, x+PW/2-lw/2, y+PH/2-lh/2, lw, lh, mask='auto')
            if fon:
                c.setFillColorRGB(*(v/255 for v in fon))
                c.rect(x+PW, y-BL_V, PW+(BL_R if k == COLS-1 else 0), PH+2*BL_V, stroke=0, fill=1)
            if foto:                       # фото на всю панель + запас під різ; праворуч запас лише в останнього стовпця
                last = (k == COLS-1)
                c.saveState()
                clip = c.beginPath()
                clip.rect(x+PW, y-BL_V, PW+(BL_R if last else 0), PH+2*BL_V)
                c.clipPath(clip, stroke=0, fill=0)
                c.drawImage(foto_path, x+PW, y-BL_V, PW+BL_R, PH+2*BL_V)
                c.restoreState()
                continue
            px = x+PW+PW/2 - cx*s
            py = y+PH/2 - (ah-cy)*s
            c.drawImage(art_path, px, py, aw*s, ah*s, mask='auto')

    top, bot = gy+gh, gy
    up_edge, low_edge = row_y(1), row_y(2)+PH
    OFF_V, LEN_V, OFF_H, LEN_H, OFF_G, LEN_G = 3*mm, 8*mm, 1.5*mm, 3*mm, 1.5*mm, 3*mm
    c.setStrokeColorRGB(0, 0, 0); c.setLineWidth(0.7); c.setDash()
    for i in range(COLS+1):        # вертикальні різи
        xx = gx + i*2*PW
        c.line(xx, top+OFF_V, xx, top+OFF_V+LEN_V); c.line(xx, bot-OFF_V, xx, bot-OFF_V-LEN_V)
        c.line(xx, up_edge-OFF_G, xx, up_edge-OFF_G-LEN_G); c.line(xx, low_edge+OFF_G, xx, low_edge+OFF_G+LEN_G)
    for yy in [top, row_y(0), up_edge, low_edge, row_y(2), bot]:   # горизонтальні різи
        c.line(gx-OFF_H, yy, gx-OFF_H-LEN_H, yy); c.line(gx+gw+OFF_H, yy, gx+gw+OFF_H+LEN_H, yy)
    c.setStrokeColorRGB(0.5, 0.5, 0.5); c.setDash(1.2, 1.2)        # згин
    for k in range(COLS):
        fx = gx + k*2*PW + PW
        c.line(fx, top+OFF_V, fx, top+OFF_V+LEN_V); c.line(fx, bot-OFF_V, fx, bot-OFF_V-LEN_V)
        c.line(fx, up_edge-OFF_G, fx, up_edge-OFF_G-LEN_G); c.line(fx, low_edge+OFF_G, fx, low_edge+OFF_G+LEN_G)
    c.setStrokeColorRGB(0.35, 0.35, 0.35); c.setLineWidth(0.6); c.setDash(4, 3)   # навпіл ножицями
    mid = (up_edge+low_edge)/2
    c.line(6*mm, mid, PAGE_W-6*mm, mid)
    c.save()
    print('  ->', os.path.relpath(out, TUT))


if __name__ == '__main__':
    args = sys.argv[1:]
    fon, foto, orel = None, False, False
    if '--orel' in args:
        orel = True; args.remove('--orel')
    if '--foto' in args:
        foto = True; args.remove('--foto')
    if '--fon' in args:
        i = args.index('--fon'); fon = tuple(int(v) for v in args[i+1].split(',')); del args[i:i+2]
    if not args or args[0] not in list(KARTKY) + ['vsi']:
        print(__doc__); print('Листівки:', ', '.join(KARTKY)); sys.exit(1)
    for n in ((FOTO if foto else KARTKY) if args[0] == 'vsi' else [args[0]]):
        zibraty(n, fon, foto, orel)
