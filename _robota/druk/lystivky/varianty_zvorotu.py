# Проба 3 варіантів звороту на коті-ялинці: 1 лілея+емблема, 2 + «Різдво 2026», 3 + «гурток «Орли волі»» і «Різдво 2026». Пише /tmp/zvoroty3.pdf → копія в gotovi/proba_A4_varianty_zvorotu.pdf
import sys, os
sys.path.insert(0, '/home/claude/gutirky-fi.github.io/_robota/druk/lystivky')
import numpy as np
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
import proba_a4 as P   # шрифти й kartka
import lystivka as L
T = '/home/claude/gutirky-fi.github.io/_robota/druk/lystivky/'
PW, PH = L.PW, L.PH
kol = L.KARTKY['kit_yalynka'][1]
def farb(f):
    a = np.asarray(Image.open(T+'malyunky/'+f).convert('RGBA')).copy(); a[..., :3] = kol
    p = '/tmp/z_'+f; Image.fromarray(a).save(p); return p
orel_k, orel_bk = farb('orly_voli.png'), farb('orly_voli_bez_kiltsia.png')
lp, (lw0, lh0) = L.lileya(kol); lh = L.LILY_H; lw = lh*lw0/lh0
W, H = 297*mm, 210*mm
c = canvas.Canvas('/tmp/zvoroty3.pdf', pagesize=(W, H))
pos = [(8.5*mm, 110*mm), (148.5*mm, 110*mm), (8.5*mm, 8*mm), (148.5*mm, 8*mm)]
def front(x, y):   # лицьова з котом-ялинкою
    P.kartka.__globals__  # noop
    fail, k, (os_, rozmir), z = L.KARTKY['kit_yalynka']
    art = Image.open(T+'malyunky/'+fail).convert('RGBA'); aw, ah = art.size
    ys, xs = np.where(np.asarray(art.getchannel('A')) > 30)
    s = rozmir*mm/(xs.max()-xs.min()); cx, cy = (xs.min()+xs.max())/2, (ys.min()+ys.max())/2
    c.drawImage(T+'malyunky/'+fail, x+1.5*PW-cx*s, y+PH/2-(ah-cy)*s, aw*s, ah*s, mask='auto')
def ramka(x, y, t):
    c.setStrokeColorRGB(.8,.8,.8); c.setLineWidth(.5); c.setDash(); c.rect(x, y, 2*PW, PH)
    c.setDash(2,2); c.line(x+PW, y, x+PW, y+PH); c.setDash()
    c.setFillColorRGB(.2,.2,.2); c.setFont('Lora', 10); c.drawString(x, y+PH+2.5*mm, t)
def pidpys(x, yy, t='Орли волі · Різдво 2026', size=7):
    c.setFillColorRGB(*(v/255 for v in kol)); c.setFont('LoraI', size); c.drawCentredString(x+PW/2, yy, t)
def back(x, y, ryadky):
    c.drawImage(lp, x+PW/2-lw/2, y+PH/2-lh/2+10*mm, lw, lh, mask='auto')
    d = 12*mm; oy = y+16*mm if ryadky else y+11*mm
    c.drawImage(orel_k, x+PW/2-d/2, oy, d, d, mask='auto')
    for j, (t, sz) in enumerate(ryadky):
        pidpys(x, oy-4.5*mm-j*4*mm, t, sz)
VAR = [('1 — лілея + емблема', []),
       ('2 — лілея + емблема + рік', [('Різдво 2026', 7.5)]),
       ('3 — лілея + емблема + назва + рік', [('гурток «Орли волі»', 8), ('Різдво 2026', 7)])]
for (x, y), (t, r) in zip(pos, VAR):
    ramka(x, y, t); front(x, y); back(x, y, r)
c.save()
