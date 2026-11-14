"""Пробний друк: УСІ листівки по одній, на А4 лежачи (4 на аркуш), розмір той самий (140x95 мм розгорнута).

    python3 proba_a4.py        # gotovi/proba_A4_usi_lystivky.pdf і gotovi/proba_A4_vseredyni.pdf

Різдвяні (RIZDVO) - з орлом гуртка під лілеєю, решта - як на своїх аркушах А3.
Фото-лицьові (FOTO в lystivka.py) - фото на всю панель. Під кожною листівкою дрібно - її назва (для вибору).
Внутрішній бік: «Веселих свят! СКОБ!» праворуч у кожній листівці; двосторонній друк - перевертати
за КОРОТКОЮ стороною (аркуш лежачи), тоді напис стоїть на звороті лілеї.
"""
import os
import numpy as np
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import lystivka as L

TUT = os.path.dirname(os.path.abspath(__file__))
SHR = os.path.join(TUT, '..', 'shryfty')
pdfmetrics.registerFont(TTFont('LoraI', os.path.join(SHR, 'Lora-Italic-Variable.ttf')))
pdfmetrics.registerFont(TTFont('Lora', os.path.join(SHR, 'Lora-Variable.ttf')))

RIZDVO = ['kit_yalynka', 'kit_chornyi_hirlianda', 'kit_klubochok', 'kit_khvist_yalynka', 'kit_zirka',
          'kit_yalynka_chornyi', 'kit_kovpak', 'kit_yalynka_smuhastyi', 'kit_svitlyachok', 'kit_oleni_rizhky',
          'korgi', 'vedmid_lys']
INSHI = ['vedmedyk', 'krokodyl', 'taksa', 'za_volyu_ukrainy', 'syl_kras_ober_byst', 'chotyry_symvoly', 'litera_a']
VSI = RIZDVO + INSHI

PAGE_W, PAGE_H = 297*mm, 210*mm
PW, PH = L.PW, L.PH
COLS, ROWS = 2, 2
gw, gh = COLS*2*PW, ROWS*PH
gx, gy = (PAGE_W-gw)/2, (PAGE_H-gh)/2
BL = 1.5*mm


def slot(i):                       # лівий нижній кут листівки i на аркуші (0 - вгорі ліворуч)
    r, k = divmod(i, COLS)
    return gx + k*2*PW, gy + gh - (r+1)*PH


def kartka(c, nazva, x, y):
    fail, kolir, (os_, rozmir), zaholovok = L.KARTKY[nazva]
    foto = nazva in L.FOTO
    orel = nazva in RIZDVO
    lpath, (lw0, lh0) = L.lileya(kolir)
    lh, lw = L.LILY_H, L.LILY_H*lw0/lh0
    if orel:
        oa = np.asarray(Image.open(os.path.join(TUT, 'malyunky', 'orly_voli.png')).convert('RGBA')).copy()
        oa[..., :3] = kolir
        opath = os.path.join(TUT, 'malyunky', '_orel_%d_%d_%d.png' % kolir)
        Image.fromarray(oa, 'RGBA').save(opath)
        c.drawImage(lpath, x+PW/2-lw/2, y+PH/2-lh/2+8*mm, lw, lh, mask='auto')
        c.drawImage(opath, x+PW/2-6*mm, y+13*mm, 12*mm, 12*mm, mask='auto')
        c.setFillColorRGB(*(v/255 for v in kolir)); c.setFont('LoraI', 7)
        c.drawCentredString(x+PW/2, y+8.5*mm, L.OREL_PIDPYS)
    else:
        c.drawImage(lpath, x+PW/2-lw/2, y+PH/2-lh/2, lw, lh, mask='auto')
    if foto:
        c.saveState()
        p = c.beginPath(); p.rect(x+PW, y-BL, PW+BL, PH+2*BL); c.clipPath(p, stroke=0, fill=0)
        c.drawImage(os.path.join(TUT, 'malyunky', L.FOTO[nazva]), x+PW, y-BL, PW+1*mm, PH+2*BL)
        c.restoreState()
    else:
        art_path = os.path.join(TUT, 'malyunky', fail)
        art = Image.open(art_path).convert('RGBA'); aw, ah = art.size
        ys, xs = np.where(np.asarray(art.getchannel('A')) > 30)
        bx0, bx1, by0, by1 = xs.min(), xs.max()+1, ys.min(), ys.max()+1
        s = rozmir*mm / ((bx1-bx0) if os_ == 'w' else (by1-by0))
        cx, cy = (bx0+bx1)/2, (by0+by1)/2
        c.drawImage(art_path, x+1.5*PW-cx*s, y+PH/2-(ah-cy)*s, aw*s, ah*s, mask='auto')
    return zaholovok


def mitky(c):
    c.setStrokeColorRGB(0, 0, 0); c.setLineWidth(0.6); c.setDash()
    for i in range(COLS+1):
        xx = gx + i*2*PW
        c.line(xx, gy+gh+2*mm, xx, gy+gh+6*mm); c.line(xx, gy-2*mm, xx, gy-6*mm)
    for j in range(ROWS+1):
        yy = gy + j*PH
        c.line(gx-2*mm, yy, gx-6*mm, yy); c.line(gx+gw+2*mm, yy, gx+gw+6*mm, yy)
    c.setStrokeColorRGB(.5, .5, .5); c.setDash(1.2, 1.2)
    for k in range(COLS):
        fx = gx + k*2*PW + PW
        c.line(fx, gy+gh+2*mm, fx, gy+gh+6*mm); c.line(fx, gy-2*mm, fx, gy-6*mm)
    c.setDash()


out = os.path.join(TUT, 'gotovi', 'proba_A4_usi_lystivky.pdf')
c = canvas.Canvas(out, pagesize=(PAGE_W, PAGE_H))
c.setTitle('Проба: усі листівки по одній, А4')
for st in range(0, len(VSI), COLS*ROWS):
    nazvy = []
    for i, n in enumerate(VSI[st:st+COLS*ROWS]):
        x, y = slot(i)
        nazvy.append((x, y, i, kartka(c, n, x, y)))
    c.setFillColorRGB(.55, .55, .55); c.setFont('Lora', 6.5)
    for x, y, i, z in nazvy:       # назва - у полі над верхнім рядом / під нижнім
        if i < COLS:
            c.drawString(x+PW+1*mm, y+PH+2.5*mm, '%d. %s' % (VSI.index(next(k for k in VSI if L.KARTKY[k][3] == z))+1, z))
        else:
            c.drawString(x+PW+1*mm, y-4.5*mm, '%d. %s' % (VSI.index(next(k for k in VSI if L.KARTKY[k][3] == z))+1, z))
    mitky(c)
    c.showPage()
c.save()
print('->', os.path.relpath(out, TUT), '(%d листівок, %d аркушів)' % (len(VSI), -(-len(VSI)//4)))

out2 = os.path.join(TUT, 'gotovi', 'proba_A4_vseredyni.pdf')
c = canvas.Canvas(out2, pagesize=(PAGE_W, PAGE_H))
c.setTitle('Проба: внутрішній бік, А4')
for i in range(COLS*ROWS):
    x, y = slot(i)
    px, top = x+PW+PW/2, y+PH-7*mm
    c.setFillColorRGB(0.2, 0.2, 0.2); c.setFont('LoraI', 17); c.drawCentredString(px, top-10*mm, 'Веселих свят!')
    c.setFillColorRGB(0.45, 0.45, 0.45); c.setFont('Lora', 8.5); c.drawCentredString(px, top-16*mm, 'С К О Б !')
c.save()
print('->', os.path.relpath(out2, TUT), '(один аркуш - друкувати на звороті кожного)')
