# Проба 4 варіантів звороту на коті-ялинці (А лілея, Б орел без кола, В емблема, Г емблема + підпис). Пише /tmp/zvoroty.pdf → копія в gotovi/proba_A4_varianty_zvorotu.pdf
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
c = canvas.Canvas('/tmp/zvoroty.pdf', pagesize=(W, H))
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
# А лише лілея
x, y = pos[0]; ramka(x, y, 'А — лише лілея'); front(x, y)
c.drawImage(lp, x+PW/2-lw/2, y+PH/2-lh/2, lw, lh, mask='auto')
# Б лише орел (без кола)
x, y = pos[1]; ramka(x, y, 'Б — лише орел, без кола'); front(x, y)
d = 36*mm; c.drawImage(orel_bk, x+PW/2-d/2, y+PH/2-d/2, d, d, mask='auto')
# В емблема (орел у колі)
x, y = pos[2]; ramka(x, y, 'В — емблема гуртка (орел у колі)'); front(x, y)
d = 34*mm; c.drawImage(orel_k, x+PW/2-d/2, y+PH/2-d/2, d, d, mask='auto')
# Г емблема + підпис
x, y = pos[3]; ramka(x, y, 'Г — емблема + підпис'); front(x, y)
d = 34*mm; c.drawImage(orel_k, x+PW/2-d/2, y+PH/2-d/2+5*mm, d, d, mask='auto')
pidpys(x, y+PH/2-d/2-4*mm, 'гурток «Орли волі»', 9); pidpys(x, y+PH/2-d/2-9*mm, 'Різдво 2026', 7.5)
c.save()
