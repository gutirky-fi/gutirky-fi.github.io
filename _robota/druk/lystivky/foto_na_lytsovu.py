"""Фото НА ВСЮ лицьову панель листівки (замість вирізаного предмета).

    python3 foto_na_lytsovu.py vkhid/litera_a.png litera_a --tsentr 766 --verkh 15 --shyryna 1150 --zverhu 16

Коли що робити: малюнок на білому папері - вирізати (vyrizaty.py). Фото на студійному фоні -
не вирізати, а лишити його фон і підрізати під листівку (так вирізаний предмет не виглядає наліпкою).

Фото 3:2 лежачи, а панель 70x95 мм стоїть, тому фон добудовується вгору й вниз: гладкий фон
продовжується (темнішає до верху, як віньєтка), зерно додається таке саме. Предмет не чіпається.
  --tsentr x   x предмета у вхідному фото (центр) - він стане посередині панелі
  --verkh y    y верху предмета у вхідному фото
  --shyryna w  скільки пікселів вхідного фото = 70 мм ширини панелі (чим менше, тим предмет більший)
  --zverhu mm  відступ від верху панелі до верху предмета, мм (за замовчуванням 16)
Вихід: malyunky/<назва>_lytsova.jpg - панель + запас під різ (1,5 мм зверху й знизу, 1 мм праворуч).
Далі: python3 lystivka.py <назва> --foto
"""
import sys, os
import numpy as np
import cv2

TUT = os.path.dirname(os.path.abspath(__file__))
PW, PH, BL_V, BL_R = 70.0, 95.0, 1.5, 1.0      # мм, як у lystivka.py


def main(src, nazva, tsentr, verkh, shyryna, zverhu=16.0):
    im = cv2.imread(src).astype(np.float32)
    H, W = im.shape[:2]
    ppm = shyryna / PW                                   # пікселів на мм
    cw, ch = int(round((PW+BL_R)*ppm)), int(round((PH+2*BL_V)*ppm))
    off_x = int(round(tsentr - PW/2*ppm))                # x вхідного фото, що стає лівим краєм панелі
    dy = int(round((zverhu+BL_V)*ppm - verkh))           # на скільки вниз зсунуто фото на полотні
    print('полотно %dx%d, %.1f px/мм, зсув фото вниз %d px, зверху додати %d px, знизу %d px'
          % (cw, ch, ppm, dy, dy, ch-dy-H))
    if off_x < 0 or off_x+cw > W:
        sys.exit('панель виходить за краї фото по ширині: зменшити --shyryna')
    if dy < 0 or ch-dy-H < 0:
        sys.exit('фото не вміщується по висоті: збільшити --shyryna чи змінити --zverhu')
    im = im[:, off_x:off_x+cw]
    rng = np.random.default_rng(13)
    sd = float(im[200:260, 20:80, 1].std())              # зерно у вільному місці фону

    def smooth_row(rows):                                # гладка смуга фону без зерна
        r = rows.mean(axis=0)                            # (cw, 3)
        return cv2.GaussianBlur(r[None], (0, 0), 28, borderType=cv2.BORDER_REFLECT)[0]

    top_n, bot_n = dy, ch-dy-H
    base_t, base_b = smooth_row(im[:10]), smooth_row(im[-10:])
    d_t = np.arange(top_n, 0, -1, dtype=np.float32)[:, None, None]    # 1.. від шва вгору
    ext_t = base_t[None] * (1 - 0.15*(1 - np.exp(-d_t/(0.5*ppm*10))))
    d_b = np.arange(1, bot_n+1, dtype=np.float32)[:, None, None]
    ext_b = base_b[None] * (1 - 0.06*(1 - np.exp(-d_b/(0.5*ppm*10))))
    out = np.concatenate([ext_t, im, ext_b], axis=0)
    # зерно тільки на добудованих смугах (оригінал має своє)
    grain = rng.normal(0, 1, (ch, cw)).astype(np.float32)
    grain = cv2.GaussianBlur(grain, (0, 0), 0.7)
    grain *= sd / grain.std()
    mask = np.zeros(ch, np.float32); mask[:top_n] = 1; mask[top_n+H:] = 1
    out += (grain * mask[:, None])[..., None]
    out = np.clip(out, 0, 255).round().astype(np.uint8)
    path = os.path.join(TUT, 'malyunky', nazva + '_lytsova.jpg')
    cv2.imwrite(path, out, [cv2.IMWRITE_JPEG_QUALITY, 93])
    print('збережено', os.path.relpath(path, TUT), '%dx%d' % (cw, ch))


if __name__ == '__main__':
    a = sys.argv[1:]
    def opt(name, default=None):
        if name in a:
            i = a.index(name); v = a[i+1]; del a[i:i+2]; return float(v)
        return default
    tsentr, verkh, shyryna, zverhu = opt('--tsentr'), opt('--verkh'), opt('--shyryna'), opt('--zverhu', 16.0)
    if len(a) != 2 or None in (tsentr, verkh, shyryna):
        print(__doc__); sys.exit(1)
    main(a[0], a[1], tsentr, verkh, shyryna, zverhu)
