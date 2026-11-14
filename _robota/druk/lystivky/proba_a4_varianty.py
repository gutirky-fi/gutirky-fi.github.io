"""Пробний друк: КОЖНА листівка на окремому аркуші А4 у чотирьох варіантах звороту.

    python3 proba_a4_varianty.py     # gotovi/proba_A4_kozhna_4_varianty.pdf (19 аркушів)

1 лише лілея · 2 лілея + емблема · 3 + рік · 4 + «гурток «Орли волі»» і рік.
Рік: у різдвяних «Різдво 2026», в інших - просто «2026».
"""
import os
from PIL import Image
import numpy as np
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
import lystivka as L
import proba_a4 as P

TUT = os.path.dirname(os.path.abspath(__file__))
PW, PH = L.PW, L.PH
VAR = ['1 · лише лілея', '2 · лілея + емблема', '3 · лілея + емблема + рік', '4 · лілея + емблема + назва + рік']

out = os.path.join(TUT, 'gotovi', 'proba_A4_kozhna_4_varianty.pdf')
c = canvas.Canvas(out, pagesize=(P.PAGE_W, P.PAGE_H))
c.setTitle('Проба: кожна листівка в 4 варіантах звороту')
for n, nazva in enumerate(P.VSI):
    kolir = L.KARTKY[nazva][1]
    lpath, (lw0, lh0) = L.lileya(kolir); lh, lw = L.LILY_H, L.LILY_H*lw0/lh0
    oa = np.asarray(Image.open(os.path.join(TUT, 'malyunky', 'orly_voli.png')).convert('RGBA')).copy(); oa[..., :3] = kolir
    opath = os.path.join(TUT, 'malyunky', '_orel_%d_%d_%d.png' % kolir); Image.fromarray(oa, 'RGBA').save(opath)
    rik = L.RIK_RIZDVA if nazva in L.RIZDVO else L.RIK_RIZDVA.split()[-1]
    for i in range(4):
        x, y = P.slot(i)
        P.kartka(c, nazva, x, y, 'nichoho')           # лицьова без звороту
        if i == 0:
            c.drawImage(lpath, x+PW/2-lw/2, y+PH/2-lh/2, lw, lh, mask='auto')
        else:
            ryadky = [[], [(rik, 7.5)], [(L.GURTOK, 8), (rik, 7)]][i-1]
            L.zvorot_orel(c, x, y, kolir, lpath, lw, lh, opath, ryadky)
        c.setFillColorRGB(.55, .55, .55); c.setFont('Lora', 6.5)
        c.drawString(x+1*mm, y+PH+2.5*mm if i < 2 else y-4.5*mm, VAR[i])
    c.setFont('Lora', 6.5); c.drawRightString(P.PAGE_W-6*mm, P.PAGE_H-5*mm, '%d. %s' % (n+1, L.KARTKY[nazva][3]))
    P.mitky(c)
    c.showPage()
c.save()
print('->', os.path.relpath(out, TUT), '(%d аркушів)' % len(P.VSI))
