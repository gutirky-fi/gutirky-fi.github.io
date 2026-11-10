import json
from PIL import Image, ImageDraw
import cv2, numpy as np
m=json.load(open('/home/claude/qr/m.json'))
n=len(m); q=4; s=24
W=(n+2*q)*s
im=Image.new('RGB',(W,W),'white'); d=ImageDraw.Draw(im)
for y in range(n):
    for x in range(n):
        if m[y][x]:
            d.rectangle([(x+q)*s,(y+q)*s,(x+q+1)*s-1,(y+q+1)*s-1],fill=(20,22,26))
im.save('/home/claude/assets/qr_proba.png')
img=cv2.imread('/home/claude/assets/qr_proba.png')
val,pts,_=cv2.QRCodeDetector().detectAndDecode(img)
print(n,W,repr(val))
small=cv2.resize(img,(420,420),interpolation=cv2.INTER_AREA)
print(repr(cv2.QRCodeDetector().detectAndDecode(small)[0]))
