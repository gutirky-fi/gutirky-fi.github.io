"""«Від знаку до вивіски» — кіно-версія (4.11.2026): збирає одну сторінку з кадрами, переходами, 3D-літерою, запитаннями,
грою «Потужний СКОБ!», пультом і планом для друку.
   python3 _robota/gutirky/vyvisky-kino/zibraty.py            -> proba/vyvisky-povna/  (проба)
   python3 _robota/gutirky/vyvisky-kino/zibraty.py sait       -> gutirky/vyvisky/      (лише після «так» власника)
Кадри k1…k10.webp, 3D litera.spz, шрифти — з proba/vyvisky-kino і proba/vyvisky-3d-litera (джерела — у теці kadry/ поруч).
Бібліотеки — ../../lib (gsap-3, three-0.187, spark-2.4.0)."""
import pathlib, sys, json, base64, shutil
from PIL import Image, ImageFilter, ImageEnhance
TUT = pathlib.Path(__file__).parent
ROB = TUT.parent.parent
SITE = ROB.parent
D = ROB / 'src'
K = TUT / 'kadry'
IC_PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>'


def rep(s, a, b):
    assert s.count(a) == 1, (s.count(a), a[:80])
    return s.replace(a, b)


def page():
    s = (TUT / 'index.html').read_text(encoding='utf-8')
    host = (D / 'zvyazok.js').read_text(encoding='utf-8') + '\n' + (D / 'pult-host-file.js').read_text(encoding='utf-8')
    host = rep(host, "btn.innerHTML = '📱 Пульт<i class=\"pd-dot\"></i>';", "btn.innerHTML = " + json.dumps(IC_PHONE + '<span>Пульт на телефоні</span><i class="pd-dot"></i>') + ";")
    host = rep(host, '<h2 id="pd-ttl">📱 Пульт на телефоні</h2>', '<h2 id="pd-ttl">Пульт на телефоні</h2>')
    host = rep(host, "'<span>📱 Телефон «<b></b>» просить доступ до пульта.", "'<span>Телефон «<b></b>» просить доступ до пульта.")
    dani = (TUT / 'dani.js').read_text(encoding='utf-8')
    kviz = (TUT / 'kviz.json').read_text(encoding='utf-8')
    dani = rep(dani, '/*KVIZ*/[]', kviz)
    pre = "window.SKOB_URL = location.hostname === 'gutirky-fi.github.io' ? 'https://gutirky-fi.github.io/skob/' : new URL('../skob/', location.href).href;\n"
    pre += "window.SKOB_S3 = true; window.SKOB_PLAST = 'data:image/png;base64," + base64.b64encode((D / 'img' / 'logo.png').read_bytes()).decode() + "';\n"
    s = rep(s, '<script>/*QR*/</script>', '<script>\n' + (D / 'qr.js').read_text(encoding='utf-8') + '\n</script>')
    s = rep(s, '<script>/*SKOB*/</script>', '<script>' + pre + '</script>\n<script>\n' + (D / 'skob.js').read_text(encoding='utf-8') + '\n</script>')
    s = rep(s, '<script>/*DANI*/</script>', '<script>\n' + dani + '\n</script>')
    s = rep(s, '<script>/*PULT*/</script>', '<script>\n' + host + '\n</script>')
    dr = ROB / 'druk'
    s = rep(s, '{{DRUK_PLAN}}', (dr / 'plan-druk.css').read_text(encoding='utf-8').replace('__ACC__', '#b5701c').replace('__LILY__', 'data:image/png;base64,' + base64.b64encode((dr / 'lileya.png').read_bytes()).decode()))
    assert 'noindex' in s and '{{' not in s.replace('${{', '')
    return s


def assets(out):
    out.mkdir(parents=True, exist_ok=True)
    for f in sorted(K.iterdir()):
        dst = out / f.name
        if not dst.exists() or dst.stat().st_mtime < f.stat().st_mtime: shutil.copy2(f, dst)
        if f.name.startswith('k') and f.suffix == '.webp' and '-b' not in f.name:   # розмитий темний фон для запитань і гри
            im = Image.open(f).convert('RGB'); im.thumbnail((640, 640)); im = im.filter(ImageFilter.GaussianBlur(10))
            im.save(out / (f.stem + '-b.webp'), quality=70)


if __name__ == '__main__':
    out = SITE / ('gutirky/vyvisky' if 'sait' in sys.argv else 'proba/vyvisky-povna')
    assets(out)
    (out / 'index.html').write_text(page(), encoding='utf-8')
    print('  ', out.relative_to(SITE), len((out / 'index.html').read_text()) // 1024, 'КБ')
