"""Перевірка сайту на 20 розмірах екранів (телефони стоячи й лежачи, планшети, ноутбуки, монітори до 4K).

Спершу запустити сервер у корені сайту:  python3 -m http.server 8765 --bind 127.0.0.1
Потім:  python3 _robota/perevirka/ekrany.py [фільтр, напр. tel]
Знімки й res.json — у _robota/perevirka/znimky/ekrany/ (у git не потрапляють).
Виводить для кожного екрана: горизонтальну прокрутку, елементи за краєм, дрібний текст, дрібні кнопки на сенсорних екранах.
Примітка: кнопки «.vm» і поля пошуку мають більшу зону дотику, ніж видно (::after / label), тож «tiny» для них — не помилка.
"""
import asyncio, json, sys, pathlib, os
CHROME = os.environ.get('CHROME', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
from playwright.async_api import async_playwright
OUT = pathlib.Path(__file__).resolve().parent / 'znimky' / 'ekrany'; OUT.mkdir(parents=True, exist_ok=True)
FILT = sys.argv[1] if len(sys.argv) > 1 else ''
CSS = ''  # шрифти Google в перевірці не вантажимо — беруться системні
BADGE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#c0612f" stroke="#f3d27a" stroke-width="6"/></svg>'
DEV = [
 ('tel-320', 320, 568, True), ('tel-360', 360, 740, True), ('tel-390', 390, 844, True), ('tel-430', 430, 932, True),
 ('tel-alb-568', 568, 320, True), ('tel-alb-740', 740, 360, True), ('tel-alb-844', 844, 390, True), ('tel-alb-932', 932, 430, True),
 ('plan-768', 768, 1024, True), ('plan-820', 820, 1180, True), ('plan-1024p', 1024, 1366, True),
 ('plan-alb-1024', 1024, 768, True), ('plan-alb-1180', 1180, 820, True), ('plan-alb-1366', 1366, 1024, True),
 ('nout-1280', 1280, 720, False), ('nout-1366', 1366, 768, False), ('nout-1440', 1440, 900, False),
 ('mon-1920', 1920, 1080, False), ('mon-2560', 2560, 1440, False), ('mon-4k', 3840, 2160, False),
]
H = 'http://127.0.0.1:8765/'
METRICS = r"""(sel) => {
  const vw = innerWidth, vh = innerHeight, root = document.scrollingElement;
  const vis = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05 && !el.closest('[hidden]'); };
  const scope = sel ? document.querySelector(sel) : document.body;
  const out = { hscroll: root.scrollWidth - root.clientWidth, off: [], small: 0, smallEx: [], tiny: [] };
  const lib = document.querySelector('#lib'); if (lib && !lib.hidden) out.libh = lib.scrollWidth - lib.clientWidth;
  for (const el of scope.querySelectorAll('*')) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    // виходить за край екрана (і не обрізане батьком)
    if ((r.right > vw + 2 || r.left < -2) && r.top < vh && r.bottom > 0) {
      let p = el.parentElement, clipped = false;
      while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o === 'hidden' || o === 'auto' || o === 'scroll' || o === 'clip') { const pr = p.getBoundingClientRect(); if (pr.right <= vw + 2 && pr.left >= -2) { clipped = true; break; } } p = p.parentElement; }
      if (!clipped && out.off.length < 8) out.off.push((el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')) + ` ${Math.round(r.left)}..${Math.round(r.right)}`);
    }
    // дрібний текст
    if (el.closest('svg')) { if (el.tagName === 'text' && el.textContent.trim() && r.top < vh && r.bottom > 0) { out.mapMin = Math.min(out.mapMin || 99, Math.round(r.height * 10) / 10); } continue; }
    if ([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 12 && r.top < vh * 3) { out.small++; if (out.smallEx.length < 5) out.smallEx.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}:${fs}px «${el.textContent.trim().slice(0, 20)}»`); }
    }
  }
  // дрібні кнопки на сенсорних екранах
  if (matchMedia('(pointer:coarse)').matches) for (const el of scope.querySelectorAll('button,a[href],input,select,[role=button]')) {
    if (!vis(el)) continue; const r = el.getBoundingClientRect();
    if ((r.width < 32 || r.height < 32) && r.top < vh && r.bottom > 0 && out.tiny.length < 8) out.tiny.push(`${el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  return out;
}"""
async def main():
    res = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(**({'executable_path': CHROME} if os.path.exists(CHROME) else {}))
        for name, w, h, touch in DEV:
            if FILT and FILT not in name: continue
            ctx = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=touch, has_touch=touch, device_scale_factor=1)
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)[:120]))
            await pg.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=CSS))
            await pg.route('https://plast.global/**', lambda r: r.fulfill(status=200, content_type='image/svg+xml', body=BADGE))
            await pg.route('https://cdnjs.cloudflare.com/**', lambda r: r.abort())
            await pg.route('https://unpkg.com/**', lambda r: r.abort())
            R = res[name] = {}
            async def shot(tag, sel=None):
                await pg.screenshot(path=str(OUT / f'{name}__{tag}.png'))
                R[tag] = await pg.evaluate(METRICS, sel)
            await pg.goto(H); await pg.wait_for_timeout(500)
            await shot('1-holovna')
            await pg.evaluate('scrollTo(0, document.body.scrollHeight)'); await pg.wait_for_timeout(200); await shot('2-niz')
            await pg.goto('about:blank'); await pg.goto(H + '#katalog'); await pg.wait_for_timeout(700); await shot('3-kataloh')
            await pg.locator('#k-grid .badge').first.click(); await pg.wait_for_timeout(500); await shot('4-detali')
            await pg.goto('about:blank'); await pg.goto(H + '#povna'); await pg.wait_for_timeout(1500); await shot('5-g-tytul')
            n = 0
            for k in [2, 6, 10, 14, 19, 24, 29]:
                while n < k:
                    await pg.keyboard.press('ArrowRight'); await pg.wait_for_timeout(120); n += 1
                await pg.wait_for_timeout(900); await shot(f'6-g-{k:02d}')
            # меню в куті
            if touch: await pg.tap('#hot')
            else: await pg.mouse.move(w - 15, 15)
            await pg.wait_for_timeout(500); await shot('7-menu')
            await pg.click('#menu'); await pg.wait_for_timeout(600); await shot('8-zmist')
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
            if touch: await pg.tap('#hot')
            else: await pg.mouse.move(w - 15, 15)
            await pg.wait_for_timeout(400)
            try:
                await pg.click('#phone-mode', timeout=2000); await pg.wait_for_timeout(900); await shot('9-pult-dialog')
            except Exception as e: R['9-pult-dialog'] = {'err': str(e)[:80]}
            await pg.goto(H + 'pult/'); await pg.wait_for_timeout(700); await shot('a-pult')
            await pg.goto(H + 'istoriya/'); await pg.wait_for_timeout(500); await shot('b-istoriya')
            R['errors'] = errs
            await ctx.close()
        await b.close()
    json.dump(res, open(OUT / 'res.json', 'w'), ensure_ascii=False, indent=1)
asyncio.run(main())

# коротке зведення
r = json.load(open(OUT / 'res.json'))
for d, v in r.items():
    bad = []
    for k, m in v.items():
        if k == 'errors':
            if m: bad.append(f'помилки JS: {m}')
            continue
        if m.get('hscroll') or m.get('libh'): bad.append(f'{k}: горизонтальна прокрутка')
        if m.get('off'): bad.append(f"{k}: за краєм {m['off'][:3]}")
        if m.get('err'): bad.append(f"{k}: {m['err']}")
    print(f"{d:14}", 'ГАРАЗД' if not bad else ' | '.join(bad))
