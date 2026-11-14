"""Вирізати малюнок для лицьової і прибрати фон (папір стає прозорим).

    python3 vyrizaty.py vkhid/nova.png nova
    python3 vyrizaty.py vkhid/nova.png nova --ramka 886,150,1595,971   # якщо треба вказати місце вручну
    python3 vyrizaty.py vkhid/nova.png nova --porih 0.06               # більше - чистіший фон, але світлі місця теж зникають
    python3 vyrizaty.py vkhid/nova.png nova --zapovnyty 6000           # світлі дірки всередині предмета (хутро) зробити непрозорими; число - найбільша дірка в точках

Вхід: або розгорт 1654x1122 (малюнок у правій половині), або просто картинка.
Вихід: malyunky/<назва>.png (прозорий фон) і malyunky/_perevirka_<назва>.png (як буде на кремовому папері).
Друкує підказку - колір для лілеї (найтемніший колір малюнка).
Далі додати рядок у KARTKY в lystivka.py і запустити python3 lystivka.py <назва>.

Як прибирається фон ("колір в прозорість"): для кожної точки
  alpha = max по каналах (фон - точка)/фон, колір = (точка - фон*(1-alpha))/alpha.
На тому самому папері виходить точнісінько оригінал, а на іншому папері - малюнок без плями фону.
Якщо папір на малюнку нерівний (градієнт, як у такси) - треба окремо вирівняти фон (див. README).
"""
import sys, os
import numpy as np
from PIL import Image
import scipy.ndimage as ndi

TUT = os.path.dirname(os.path.abspath(__file__))


def main(src, nazva, ramka=None, porih=0.05, zapovnyty=0):
    im = np.asarray(Image.open(src).convert('RGB')).astype(float)
    H, W, _ = im.shape
    if ramka:
        x0, y0, x1, y1 = ramka
    else:
        if W > 1.3*H:                                   # розгорт: беремо праву половину
            part, ox = im[:, W//2:], W//2
        else:
            part, ox = im, 0
        page = np.median(np.concatenate([part[:5].reshape(-1, 3), part[-5:].reshape(-1, 3)]), axis=0)
        diff = np.abs(part - page).max(axis=2) > 6
        diff = ndi.binary_opening(diff, iterations=2)
        ys, xs = np.where(diff)
        x0, x1, y0, y1 = xs.min()+ox, xs.max()+1+ox, ys.min(), ys.max()+1
    plate = im[y0:y1, x0:x1]
    rim = np.concatenate([plate[:3].reshape(-1, 3), plate[-3:].reshape(-1, 3),
                          plate[:, :3].reshape(-1, 3), plate[:, -3:].reshape(-1, 3)])
    bg = np.median(rim, axis=0)
    print('рамка малюнка: %d,%d,%d,%d   колір паперу малюнка: %s' % (x0, y0, x1, y1, bg.round().astype(int)))

    a = np.clip(((bg - plate) / np.maximum(bg, 1)).max(axis=2), 0, 1)
    a[a < porih] = 0
    # дрібні цятки-сміття далеко від малюнка
    m = a > 0.3
    lab, n = ndi.label(m, structure=np.ones((3, 3)))
    if n:
        sizes = ndi.sum(m, lab, range(1, n+1))
        big = np.isin(lab, [i+1 for i, s in enumerate(sizes) if s >= 30])
        small = np.isin(lab, [i+1 for i, s in enumerate(sizes) if s < 30])
        a[ndi.binary_dilation(small, iterations=3) & ~ndi.binary_dilation(big, iterations=1)] = 0
        a[~ndi.binary_dilation(big, iterations=3) & (a < 0.3)] = 0
    if zapovnyty:
        # світле хутро/деталі всередині предмета, що стали «дірками» (папір просвічує): робимо непрозорими
        sil = ndi.binary_fill_holes(ndi.binary_closing(a > 0.12, iterations=2))
        dirky = sil & (a <= 0.12)
        lab, n = ndi.label(dirky)
        if n:
            sizes = ndi.sum(dirky, lab, range(1, n+1))
            mala = np.isin(lab, [i+1 for i, s in enumerate(sizes) if s <= zapovnyty])
            a[ndi.binary_dilation(mala, iterations=2) & sil] = 1.0
            print('заповнено дірок: %d' % int(sum(1 for s in sizes if s <= zapovnyty)))
    safe = np.maximum(a, 1e-6)[..., None]
    ink = np.clip((plate - bg*(1-a[..., None])) / safe, 0, 255)
    ink[a == 0] = 0

    ys, xs = np.where(a > 0.12)
    cy0, cy1, cx0, cx1 = max(ys.min()-4, 0), ys.max()+5, max(xs.min()-4, 0), xs.max()+5
    rgba = np.dstack([ink, a*255])[cy0:cy1, cx0:cx1].round().astype(np.uint8)
    out = os.path.join(TUT, 'malyunky', nazva + '.png')
    Image.fromarray(rgba, 'RGBA').save(out)
    prev = Image.new('RGBA', (rgba.shape[1], rgba.shape[0]), (251, 248, 243, 255))
    prev.alpha_composite(Image.fromarray(rgba, 'RGBA'))
    prev.convert('RGB').save(os.path.join(TUT, 'malyunky', '_perevirka_' + nazva + '.png'))
    solid = rgba[..., 3] > 230
    if solid.any():
        px = rgba[solid][:, :3].astype(int)
        dark = px[px.sum(axis=1) <= np.percentile(px.sum(axis=1), 30)]
        print('підказка - колір лілеї (RGB):', tuple(int(v) for v in np.median(dark, axis=0)))
    print('збережено', os.path.relpath(out, TUT), '%dx%d' % (rgba.shape[1], rgba.shape[0]))


if __name__ == '__main__':
    args = sys.argv[1:]
    ramka, porih, zapovnyty = None, 0.05, 0
    if '--ramka' in args:
        i = args.index('--ramka'); ramka = [int(v) for v in args[i+1].split(',')]; del args[i:i+2]
    if '--porih' in args:
        i = args.index('--porih'); porih = float(args[i+1]); del args[i:i+2]
    if '--zapovnyty' in args:
        i = args.index('--zapovnyty'); zapovnyty = int(args[i+1]); del args[i:i+2]
    if len(args) != 2:
        print(__doc__); sys.exit(1)
    main(args[0], args[1], ramka, porih, zapovnyty)
