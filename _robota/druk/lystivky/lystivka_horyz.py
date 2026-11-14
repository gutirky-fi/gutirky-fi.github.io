"""Горизонтальна листівка («будиночок»): лицьова 95 x 70 мм, згин ЗВЕРХУ. А4 стоячи, 4 шт (2 x 2).

    python3 lystivka_horyz.py rybka      # gotovi/lystivky_rybka_A4_horyz.pdf

Розгорнута листівка - 95 x 140 мм: знизу лицьова (картинка на всю панель), зверху зворот,
ПЕРЕВЕРНУТИЙ догори дриґом (бо при згині він стане рівно). Зворот: лілея ліворуч, праворуч емблема
й «гурток «Орли волі»». Різати по суцільних мітках, згинати по пунктирних (горизонтальних).
"""
import os, sys
import numpy as np
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
import lystivka as L

TUT = os.path.dirname(os.path.abspath(__file__))
KARTKY = {   # назва: (картинка на всю лицьову, колір знаків, заголовок)
    'rybka': ('rybka_lytsova.png', (125, 28, 38), 'Рибка-крик'),
}
# повідомлення-«бульбашки» як у месенджері поверх лицьової (ліворуч унизу), за бажанням
BULBASHKY = {'rybka': ['Ну ок', 'Скоб', 'Хахахаха']}
PW, PH = 95*mm, 70*mm          # лицьова панель
PAGE_W, PAGE_H = 210*mm, 297*mm
COLS, ROWS = 2, 2
gw, gh = COLS*PW, ROWS*2*PH
gx, gy = (PAGE_W-gw)/2, (PAGE_H-gh)/2
BL = 1.5*mm


def zvorot(c, x, y, kolir):
    """Зворот у звичайному положенні в прямокутнику (x, y, PW, PH)."""
    lpath, (lw0, lh0) = L.lileya(kolir); lh = 34*mm; lw = lh*lw0/lh0
    c.drawImage(lpath, x+PW*0.3-lw/2, y+PH/2-lh/2, lw, lh, mask='auto')
    oa = np.asarray(Image.open(os.path.join(TUT, 'malyunky', 'orly_voli.png')).convert('RGBA')).copy(); oa[..., :3] = kolir
    opath = os.path.join(TUT, 'malyunky', '_orel_%d_%d_%d.png' % kolir); Image.fromarray(oa, 'RGBA').save(opath)
    d = 16*mm; ox = x+PW*0.7
    c.drawImage(opath, ox-d/2, y+PH/2-d/2+5*mm, d, d, mask='auto')
    c.setFillColorRGB(*(v/255 for v in kolir)); c.setFont('LoraI', 8)
    c.drawCentredString(ox, y+PH/2-d/2-1*mm, L.GURTOK)


def bulbashky(c, x, y, ryadky):
    """Темні «бульбашки» WhatsApp (білий текст), стовпчиком від лівого нижнього кута."""
    sz, h, gap = 9, 6.2*mm, 1.6*mm
    yy = y + 4*mm + (len(ryadky)-1)*(h+gap)
    for t in ryadky:
        w = c.stringWidth(t, 'DejaVu', sz) + 6*mm
        c.setFillColorRGB(0.13, 0.17, 0.20)
        c.roundRect(x+4*mm, yy, w, h, 2.2*mm, stroke=0, fill=1)
        c.setFillColorRGB(1, 1, 1); c.setFont('DejaVu', sz)
        c.drawString(x+7*mm, yy+h/2-sz*0.35, t)
        yy -= h + gap


def zibraty(nazva):
    fail, kolir, zaholovok = KARTKY[nazva]
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    pdfmetrics.registerFont(TTFont('LoraI', os.path.join(TUT, '..', 'shryfty', 'Lora-Italic-Variable.ttf')))
    pdfmetrics.registerFont(TTFont('DejaVu', os.path.join(TUT, '..', 'shryfty', 'DejaVuSans.ttf')))
    img = os.path.join(TUT, 'malyunky', fail); iw, ih = Image.open(img).size
    out = os.path.join(TUT, 'gotovi', 'lystivky_%s_A4_horyz.pdf' % nazva)
    c = canvas.Canvas(out, pagesize=(PAGE_W, PAGE_H))
    c.setTitle('Листівка «%s» - горизонтальна, А4, 4 шт' % zaholovok)
    for r in range(ROWS):
        for k in range(COLS):
            x, y = gx + k*PW, gy + r*2*PH          # y - низ лицьової панелі
            # лицьова: картинка «cover» з виходом за край
            bw, bh = PW+2*BL, PH+2*BL
            s = max(bw/iw, bh/ih)
            c.saveState(); p = c.beginPath(); p.rect(x-BL, y-BL, bw, PH+BL); c.clipPath(p, stroke=0, fill=0)
            c.drawImage(img, x+PW/2-iw*s/2, y+PH-ih*s, iw*s, ih*s)   # верх картинки - рівно по згину (очі не зрізати)
            c.restoreState()
            if nazva in BULBASHKY:
                bulbashky(c, x, y, BULBASHKY[nazva])
            # зворот: над лицьовою, повернутий на 180°
            c.saveState(); c.translate(x+PW, y+2*PH); c.rotate(180)
            zvorot(c, 0, 0, kolir)
            c.restoreState()
    # мітки різу (суцільні) і згину (пунктир)
    c.setStrokeColorRGB(0, 0, 0); c.setLineWidth(0.6)
    for i in range(COLS+1):
        xx = gx + i*PW
        c.line(xx, gy+gh+2*mm, xx, gy+gh+6*mm); c.line(xx, gy-2*mm, xx, gy-6*mm)
    for j in range(ROWS+1):
        yy = gy + j*2*PH
        c.line(gx-2*mm, yy, gx-6*mm, yy); c.line(gx+gw+2*mm, yy, gx+gw+6*mm, yy)
    c.setStrokeColorRGB(.5, .5, .5); c.setDash(1.2, 1.2)
    for j in range(ROWS):
        yy = gy + j*2*PH + PH
        c.line(gx-2*mm, yy, gx-6*mm, yy); c.line(gx+gw+2*mm, yy, gx+gw+6*mm, yy)
    c.save()
    print('  ->', os.path.relpath(out, TUT))


if __name__ == '__main__':
    for n in (sys.argv[1:] or KARTKY):
        zibraty(n)
