"""Тест кольорів звороту на цупкому папері: 8 зворотів (лілея + емблема + підпис) різними кольорами, А4 лежачи.

    python3 proba_kolory.py     # gotovi/proba_A4_kolory_zvorotu.pdf

Навіщо: чистий чорний принтер друкує ЧОРНИМ картриджем - на цупкому папері він лягає погано.
Темні КОЛЬОРОВІ відтінки (синій, зелений, бордовий, «кольоровий чорний») принтер змішує з кольорових чорнил.
Розмір панелей справжній (70x95 мм), підпис кольору - під панеллю.
"""
import os
import numpy as np
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
import lystivka as L
import proba_a4 as P

TUT = os.path.dirname(os.path.abspath(__file__))
KOLORY = [((0, 0, 0), '1 чорний'), ((33, 37, 41), '2 графіт'), ((40, 26, 52), '3 «кольоровий чорний»'),
          ((25, 45, 95), '4 темно-синій'), ((22, 90, 62), '5 темно-зелений'), ((125, 28, 38), '6 бордовий'),
          ((95, 67, 46), '7 коричневий'), ((96, 80, 68), '8 сіро-коричневий')]
W, H = 297*mm, 210*mm
PW, PH = L.PW, L.PH
gx, gy = (W-4*PW)/2, (H-2*PH)/2
out = os.path.join(TUT, 'gotovi', 'proba_A4_kolory_zvorotu.pdf')
c = canvas.Canvas(out, pagesize=(W, H))
c.setTitle('Проба кольорів звороту')
for i, (k, nazva) in enumerate(KOLORY):
    r, col = divmod(i, 4)
    x, y = gx + col*PW, gy + (1-r)*PH
    lpath, (lw0, lh0) = L.lileya(k); lh, lw = L.LILY_H, L.LILY_H*lw0/lh0
    oa = np.asarray(Image.open(os.path.join(TUT, 'malyunky', 'orly_voli.png')).convert('RGBA')).copy(); oa[..., :3] = k
    opath = os.path.join(TUT, 'malyunky', '_orel_%d_%d_%d.png' % k); Image.fromarray(oa, 'RGBA').save(opath)
    L.zvorot_orel(c, x, y, k, lpath, lw, lh, opath, [(L.GURTOK, 8), (L.RIK_RIZDVA, 7)])
    c.setFillColorRGB(.5, .5, .5); c.setFont('Lora', 7)
    c.drawString(x+2*mm, y+PH+2.5*mm if r == 0 else y-5*mm, '%s  (%d, %d, %d)' % (nazva, *k))
c.setStrokeColorRGB(.85, .85, .85); c.setLineWidth(.3)
for col in range(5):
    c.line(gx+col*PW, gy, gx+col*PW, gy+2*PH)
for r in range(3):
    c.line(gx, gy+r*PH, gx+4*PW, gy+r*PH)
c.save()
print('->', os.path.relpath(out, TUT))
