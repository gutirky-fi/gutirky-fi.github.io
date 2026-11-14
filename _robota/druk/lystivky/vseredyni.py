"""Внутрішній бік листівок: друкується на ЗВОРОТІ того самого аркуша А3.

    python3 vseredyni.py            # gotovi/vseredyni_linii_A3.pdf, vseredyni_klitynky_A3.pdf, vseredyni_svyata_A3.pdf

«orly_voli» - БЕЗ ЛІНІЙ: праворуч знак гуртка (орел), «Веселих свят! СКОБ!», унизу «гурток «Орли волі»»; ліва чиста.
«svyata_chysto» - для листівок з орлом ЗЗОВНІ (lystivka.py --orel): праворуч лише «Веселих свят! СКОБ!»,
    без ліній; ліва чиста (назва й рік - ззовні під орлом, OREL_PIDPYS у lystivka.py). Вибір власника 14.11.
«svyata» - на правій внутрішній половинці напис «Веселих свят!» і «СКОБ!», під ним лінії; ліва - лінії.
Права внутрішня = зворот панелі з лілеєю (при перевертанні за довгою стороною аркуш дзеркалиться,
тож на звороті аркуша вона стоїть праворуч у кожній парі).

Розклад той самий, що в lystivka.py (8 листівок, проміжок 10 мм посередині), він симетричний,
тому при двосторонньому друці (перевертати за довгою стороною) усе збігається з лицьовим боком.
Лінії світло-сірі й з відступами 7 мм від країв панелі: якщо принтер зсуне на 1-2 мм, нічого не зріже.
Обидві внутрішні панелі (ліва й права, коли листівку розгорнути) - однакові.
"""
import os
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from lystivka import PAGE_W, PAGE_H, PW, PH, COLS, ROWS, gx, row_y

TUT = os.path.dirname(os.path.abspath(__file__))
VIDSTUP = 7*mm
SHR = os.path.join(TUT, '..', 'shryfty')
pdfmetrics.registerFont(TTFont('LoraI', os.path.join(SHR, 'Lora-Italic-Variable.ttf')))
pdfmetrics.registerFont(TTFont('Lora', os.path.join(SHR, 'Lora-Variable.ttf')))
NAPYS, PIDPYS = 'Веселих свят!', 'С К О Б !'
OREL = os.path.join(TUT, 'malyunky', 'orly_voli.png')       # знак гуртка (зі знімка нашивки, вичищено)
GURTOK = 'гурток «Орли волі»'
RIK = '2026'


def panel(c, x, y, vyd, napys=False, orel=False):
    x0, x1, y0, y1 = x+VIDSTUP, x+PW-VIDSTUP, y+VIDSTUP, y+PH-VIDSTUP
    if orel:                                            # орел угорі, привітання під ним, підпис гуртка внизу
        d = 16*mm
        c.drawImage(OREL, x+PW/2-d/2, y1-d, d, d, mask='auto')
        c.setFillColorRGB(0.2, 0.2, 0.2)
        c.setFont('LoraI', 17); c.drawCentredString(x+PW/2, y1-26*mm, NAPYS)
        c.setFillColorRGB(0.45, 0.45, 0.45)
        c.setFont('Lora', 8.5); c.drawCentredString(x+PW/2, y1-32*mm, PIDPYS)
        c.setFont('LoraI', 8); c.drawCentredString(x+PW/2, y0+1*mm, GURTOK)
        return                                          # без ліній: чистий папір під почерк (власник 14.11)
    if vyd == 'chysto':                                 # лише привітання вгорі і «гурток · рік» унизу, без ліній
        c.setFillColorRGB(0.2, 0.2, 0.2)
        c.setFont('LoraI', 17); c.drawCentredString(x+PW/2, y1-10*mm, NAPYS)
        c.setFillColorRGB(0.45, 0.45, 0.45)
        c.setFont('Lora', 8.5); c.drawCentredString(x+PW/2, y1-16*mm, PIDPYS)
        return                                          # назва гуртка й рік тепер ззовні під орлом (власник 14.11)
    if napys:
        c.setFillColorRGB(0.2, 0.2, 0.2)
        c.setFont('LoraI', 17); c.drawCentredString(x+PW/2, y1-10*mm, NAPYS)
        c.setFillColorRGB(0.45, 0.45, 0.45)
        c.setFont('Lora', 8.5); c.drawCentredString(x+PW/2, y1-17*mm, PIDPYS)
    if vyd == 'linii':
        c.setStrokeColorRGB(0.72, 0.72, 0.72); c.setLineWidth(0.4)
        yy = y1 - (30*mm if napys else 6*mm)            # верх лишаємо під звертання / напис
        while yy >= y0:
            c.line(x0, yy, x1, yy); yy -= 8*mm
    else:
        c.setStrokeColorRGB(0.82, 0.82, 0.82); c.setLineWidth(0.3)
        k = 5*mm
        nx, ny = int((x1-x0)//k), int((y1-y0)//k)
        ox, oy = x+(PW-nx*k)/2, y+(PH-ny*k)/2
        for i in range(nx+1):
            c.line(ox+i*k, oy, ox+i*k, oy+ny*k)
        for j in range(ny+1):
            c.line(ox, oy+j*k, ox+nx*k, oy+j*k)


for fail, vyd, nazva in [('linii', 'linii', 'лінії'), ('klitynky', 'klitynky', 'клітинки'),
                         ('svyata', 'linii', 'Веселих свят! СКОБ! + лінії'),
                         ('orly_voli', 'linii', 'орел гуртка + Веселих свят! СКОБ!'),
                         ('svyata_chysto', 'chysto', 'Веселих свят! СКОБ! + гурток · рік, без ліній')]:
    out = os.path.join(TUT, 'gotovi', 'vseredyni_%s_A3.pdf' % fail)
    c = canvas.Canvas(out, pagesize=(PAGE_W, PAGE_H))
    c.setTitle('Листівки - внутрішній бік (%s), А3' % nazva)
    for r in range(ROWS):
        for k in range(COLS):
            x, y = gx + k*2*PW, row_y(r)
            if fail not in ('orly_voli', 'svyata_chysto'):   # тут ліва половинка чиста
                panel(c, x, y, vyd)
            panel(c, x+PW, y, vyd, napys=(fail == 'svyata'), orel=(fail == 'orly_voli'))
    c.save()
    print('->', os.path.relpath(out, TUT))
