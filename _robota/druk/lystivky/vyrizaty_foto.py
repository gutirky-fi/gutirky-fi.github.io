"""Вирізати предмет із ФОТО на гладкому студійному фоні (сірий, градієнт, тінь на підлозі).

    python3 vyrizaty_foto.py vkhid/litera_a.png litera_a
    python3 vyrizaty_foto.py vkhid/litera_a.png litera_a --nizy 880,989,297,583,927,1240

Для малюнків на білому папері є vyrizaty.py. Тут інакше: фон фото не однотонний, тому
  1) гладкі місця (мало дрібних деталей) - це фон, у т.ч. отвори всередині предмета;
  2) місця з фактурою й яскраві блики (лампочки) - предмет;
  3) решту доводить GrabCut (OpenCV), далі край трохи стискається й м'якшає.
--nizy y0,y1,xa0,xa1,xb0,xb1  - обрізати тінь від підлоги: нижче y0 лишити лише стовпці
  xa0..xa1 і xb0..xb1 (дві ніжки), а нижче y1 не лишати нічого. Без цього тінь на підлозі
  може лишитися прилиплою до низу. Числа - у пікселях вхідної картинки.

Вихід: malyunky/<назва>.png (RGBA, прозорий фон), malyunky/_perevirka_<назва>.png (на кремовому папері).
Далі - як зазвичай: рядок у KARTKY в lystivka.py і python3 lystivka.py <назва>.
"""
import sys, os
import numpy as np
import cv2
import scipy.ndimage as ndi

TUT = os.path.dirname(os.path.abspath(__file__))


def main(src, nazva, nizy=None):
    im = cv2.imread(src)
    H, W = im.shape[:2]
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32)
    mu = cv2.blur(g, (9, 9))
    sd = np.sqrt(np.maximum(cv2.blur(g*g, (9, 9)) - mu*mu, 0))

    # впевнено фон: великі гладкі нескраві (не лампочки) ділянки
    smooth = ndi.binary_opening((sd < 4.5) & (g < 205), iterations=2)
    lab, n = ndi.label(smooth)
    sizes = ndi.sum(smooth, lab, range(1, n+1))
    sbg = ndi.binary_erosion(np.isin(lab, [i+1 for i, s in enumerate(sizes) if s > 12000]), iterations=5)

    # впевнено предмет: фактура + яскраві лампочки
    tex = ndi.binary_opening(sd > 7, iterations=3)
    lab, n = ndi.label(tex)
    sizes = ndi.sum(tex, lab, range(1, n+1))
    sfg = ndi.binary_erosion(np.isin(lab, [i+1 for i, s in enumerate(sizes) if s > 3000]), iterations=6)
    br = ndi.binary_opening(g > 215, iterations=2)
    lab, n = ndi.label(br)
    sizes = ndi.sum(br, lab, range(1, n+1))
    bulbs = np.isin(lab, [i+1 for i, s in enumerate(sizes) if 800 < s < 12000])
    sfg |= ndi.binary_erosion(bulbs, iterations=2)

    mask = np.full((H, W), cv2.GC_PR_BGD, np.uint8)
    mask[sbg] = cv2.GC_BGD
    mask[sfg] = cv2.GC_FGD
    mask[:, :2] = cv2.GC_BGD; mask[:, -2:] = cv2.GC_BGD; mask[:2] = cv2.GC_BGD; mask[-2:] = cv2.GC_BGD
    cv2.grabCut(im, mask, None, np.zeros((1, 65)), np.zeros((1, 65)), 5, cv2.GC_INIT_WITH_MASK)
    m = (mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)

    if nizy:
        y0, y1, xa0, xa1, xb0, xb1 = nizy
        cut = np.zeros_like(m)
        cut[y0:, :] = True
        cut[y0:, xa0:xa1] = False
        cut[y0:, xb0:xb1] = False
        cut[y1:, :] = True
        m &= ~cut

    # найбільший шматок; малі дірки (лампочки, цятки) заповнити, великі отвори лишити
    lab, n = ndi.label(m)
    sizes = ndi.sum(m, lab, range(1, n+1))
    m = lab == (1 + int(np.argmax(sizes)))
    holes = ndi.binary_fill_holes(m) & ~m
    lab, n = ndi.label(holes)
    sizes = ndi.sum(holes, lab, range(1, n+1))
    for i, s in enumerate(sizes):
        if s < 3000:
            m |= lab == (i+1)
    m = ndi.binary_opening(m, structure=np.ones((3, 3)), iterations=1)

    # край: трохи стиснути (щоб не лишався світлий обідок фону) і зробити м'яким
    core = ndi.binary_erosion(m, iterations=2).astype(np.float32)
    alpha = np.clip(cv2.GaussianBlur(core, (0, 0), 1.0), 0, 1)

    rgb = cv2.cvtColor(im, cv2.COLOR_BGR2RGB)
    ys, xs = np.where(alpha > 0.05)
    y0, y1, x0, x1 = max(ys.min()-3, 0), ys.max()+4, max(xs.min()-3, 0), xs.max()+4
    rgba = np.dstack([rgb, (alpha*255).round().astype(np.uint8)])[y0:y1, x0:x1]
    print('рамка предмета у вхідній картинці (x0,y0,x1,y1): %d,%d,%d,%d' % (x0, y0, x1, y1))
    from PIL import Image
    out = os.path.join(TUT, 'malyunky', nazva + '.png')
    Image.fromarray(rgba, 'RGBA').save(out)
    prev = Image.new('RGBA', (rgba.shape[1], rgba.shape[0]), (251, 248, 243, 255))
    prev.alpha_composite(Image.fromarray(rgba, 'RGBA'))
    prev.convert('RGB').save(os.path.join(TUT, 'malyunky', '_perevirka_' + nazva + '.png'))
    solid = rgba[..., 3] > 230
    px = rgba[solid][:, :3].astype(int)
    dark = px[px.sum(axis=1) <= np.percentile(px.sum(axis=1), 30)]
    print('підказка - колір лілеї (RGB):', tuple(int(v) for v in np.median(dark, axis=0)))
    print('збережено', os.path.relpath(out, TUT), '%dx%d' % (rgba.shape[1], rgba.shape[0]))


if __name__ == '__main__':
    args = sys.argv[1:]
    nizy = None
    if '--nizy' in args:
        i = args.index('--nizy'); nizy = [int(v) for v in args[i+1].split(',')]; del args[i:i+2]
    if len(args) != 2 or (nizy and len(nizy) != 6):
        print(__doc__); sys.exit(1)
    main(args[0], args[1], nizy)
