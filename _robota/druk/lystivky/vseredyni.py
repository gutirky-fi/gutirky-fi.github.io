"""Внутрішній бік листівок: друкується на ЗВОРОТІ того самого аркуша А3.

    python3 vseredyni.py            # gotovi/vseredyni_linii_A3.pdf і gotovi/vseredyni_klitynky_A3.pdf

Розклад той самий, що в lystivka.py (8 листівок, проміжок 10 мм посередині), він симетричний,
тому при двосторонньому друці (перевертати за довгою стороною) усе збігається з лицьовим боком.
Лінії світло-сірі й з відступами 7 мм від країв панелі: якщо принтер зсуне на 1-2 мм, нічого не зріже.
Обидві внутрішні панелі (ліва й права, коли листівку розгорнути) - однакові.
"""
import os
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from lystivka import PAGE_W, PAGE_H, PW, PH, COLS, ROWS, gx, row_y

TUT = os.path.dirname(os.path.abspath(__file__))
VIDSTUP = 7*mm


def panel(c, x, y, vyd):
    x0, x1, y0, y1 = x+VIDSTUP, x+PW-VIDSTUP, y+VIDSTUP, y+PH-VIDSTUP
    if vyd == 'linii':
        c.setStrokeColorRGB(0.72, 0.72, 0.72); c.setLineWidth(0.4)
        yy = y1 - 6*mm                                  # верх лишаємо під звертання
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


for vyd, nazva in [('linii', 'лінії'), ('klitynky', 'клітинки')]:
    out = os.path.join(TUT, 'gotovi', 'vseredyni_%s_A3.pdf' % vyd)
    c = canvas.Canvas(out, pagesize=(PAGE_W, PAGE_H))
    c.setTitle('Листівки - внутрішній бік (%s), А3' % nazva)
    for r in range(ROWS):
        for k in range(COLS):
            x, y = gx + k*2*PW, row_y(r)
            panel(c, x, y, vyd); panel(c, x+PW, y, vyd)
    c.save()
    print('->', os.path.relpath(out, TUT))
