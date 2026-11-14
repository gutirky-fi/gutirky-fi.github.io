"""ОДИН аркуш цупкого паперу на все: 4 справжні листівки + смужка кольорів у полях. А4 лежачи.

    python3 proba_tsupkyi.py    # gotovi/proba_tsupkyi_1_arkush.pdf (2 сторінки: лицьова і зворот аркуша)

Листівки підібрано, щоб перевірити все: велике чорне (чорний кіт-ялинка), фото на всю панель (кіт на пледі),
світлий кольоровий малюнок (крокодил), коричневий (кіт-ялинка). Звороти - кожен своїм кольором.
Угорі й унизу в полях - підпис «гурток «Орли волі»» у 8 кольорах (чорний і запасні) - видно, який лягає чітко.
Сторінка 2 - внутрішній бік («Веселих свят! СКОБ!»), друкувати на звороті того самого аркуша
(перевертати за КОРОТКОЮ стороною).
"""
import os
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
import lystivka as L
import proba_a4 as P
import proba_kolory as K

TUT = os.path.dirname(os.path.abspath(__file__))
NABIR = ['kit_yalynka_chornyi', 'kit_chornyi_hirlianda', 'krokodyl', 'kit_yalynka']
out = os.path.join(TUT, 'gotovi', 'proba_tsupkyi_1_arkush.pdf')
c = canvas.Canvas(out, pagesize=(P.PAGE_W, P.PAGE_H))
c.setTitle('Проба на цупкому папері: 1 аркуш')
for i, n in enumerate(NABIR):
    x, y = P.slot(i)
    P.kartka(c, n, x, y)
P.mitky(c)
krok = (P.gw - 2*mm) / 4
for j, (k, nazva) in enumerate(K.KOLORY):
    r, col = divmod(j, 4)
    x = P.gx + 5*mm + col*krok        # відступ від міток різу
    y = P.PAGE_H - 7.5*mm if r == 0 else 3.5*mm
    c.setFillColorRGB(*(v/255 for v in k))
    c.rect(x, y-0.5*mm, 4*mm, 4*mm, stroke=0, fill=1)
    c.setFont('LoraI', 8); c.drawString(x+5.5*mm, y, L.GURTOK)
    c.setFont('Lora', 6); c.drawString(x+33*mm, y+0.3*mm, nazva.split()[0])
c.showPage()
for i in range(4):                      # внутрішній бік
    x, y = P.slot(i)
    px, top = x+P.PW+P.PW/2, y+P.PH-7*mm
    c.setFillColorRGB(0.2, 0.2, 0.2); c.setFont('LoraI', 17); c.drawCentredString(px, top-10*mm, 'Веселих свят!')
    c.setFillColorRGB(0.45, 0.45, 0.45); c.setFont('Lora', 8.5); c.drawCentredString(px, top-16*mm, 'С К О Б !')
c.showPage()
c.save()
print('->', os.path.relpath(out, TUT))
