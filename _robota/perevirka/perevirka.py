#!/usr/bin/env python3
"""Швидка перевірка зібраного сайту в браузері (Playwright + Chromium).

Запуск:  python3 _robota/perevirka/perevirka.py [шлях до index.html]
Знімки екрана — у _robota/perevirka/znimky/ (у git не потрапляють, див. .gitignore).
Шрифти Google і нашивки з plast.global у середовищі без інтернету не завантажаться — це нормально:
нашивки замінюються тестовими кружечками, а шрифти — системними.
"""
import asyncio, os, sys, pathlib
from playwright.async_api import async_playwright

HERE = pathlib.Path(__file__).resolve().parent
PAGE = 'file://' + str(pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent.parent / 'index.html').resolve())
OUT = HERE / 'znimky'
OUT.mkdir(exist_ok=True)
CHROME = os.environ.get('CHROME', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
BADGE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#1d63ad" stroke="#c4234a" stroke-width="8"/></svg>'


async def main():
    ok = True
    def check(cond, text):
        nonlocal ok
        print(('ТАК ' if cond else 'НІ  ') + text)
        ok = ok and bool(cond)
    async with async_playwright() as p:
        kw = {'executable_path': CHROME} if os.path.exists(CHROME) else {}
        b = await p.chromium.launch(args=['--allow-file-access-from-files'], **kw)
        errs = []
        for w, h, mob in [(1280, 900, False), (390, 844, True)]:
            tag = 'telefon' if mob else 'noutbuk'
            ctx = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=mob, has_touch=mob)
            pg = await ctx.new_page()
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.route('https://plast.global/**', lambda r: r.fulfill(status=200, content_type='image/svg+xml', body=BADGE))
            await pg.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=''))
            await pg.route('https://cdnjs.cloudflare.com/**', lambda r: r.abort())
            await pg.goto(PAGE); await pg.wait_for_timeout(500)
            check(await pg.is_visible('#lib'), f'[{tag}] бібліотека відкрилась')
            check(await pg.locator('#l-grid .card:not(.ph)').count() >= 1, f'[{tag}] є картки гутірок')
            await pg.screenshot(path=str(OUT / f'{tag}-holovna.png'), full_page=False)
            sw = await pg.evaluate("[document.querySelector('#lib').scrollWidth, document.querySelector('#lib').clientWidth]")
            check(sw[0] <= sw[1], f'[{tag}] немає горизонтальної прокрутки')
            await pg.locator('#lib .tabs [data-tab=kat]').click(); await pg.wait_for_timeout(300)
            n = await pg.locator('#k-grid .badge').count()
            check(n > 100, f'[{tag}] каталог: {n} вмілостей')
            await pg.locator('#k-grid .badge').first.click(); await pg.wait_for_timeout(500)
            check(await pg.is_visible('#k-det'), f'[{tag}] деталі вмілості відкриваються')
            await pg.screenshot(path=str(OUT / f'{tag}-katalog.png'))
            await pg.locator('#k-det [data-open]').first.click(); await pg.wait_for_timeout(1200)
            check(await pg.evaluate("!document.querySelector('#gv').hidden && document.querySelector('#lib').hidden"), f'[{tag}] гутірка відкривається з каталогу')
            await pg.screenshot(path=str(OUT / f'{tag}-hutirka.png'))
            if not mob:
                await pg.mouse.move(w - 20, 20); await pg.wait_for_timeout(400)
            else:
                await pg.tap('#hot'); await pg.wait_for_timeout(400)
            await pg.click('#home-link'); await pg.wait_for_timeout(400)
            check(await pg.is_visible('#lib'), f'[{tag}] повернення в бібліотеку через меню в куті')
            await ctx.close()
        await b.close()
    check(not errs, 'помилок JavaScript немає' + ('' if not errs else ': ' + '; '.join(errs[:3])))
    print('\nУСЕ ГАРАЗД' if ok else '\nЄ ПРОБЛЕМИ')
    return 0 if ok else 1

sys.exit(asyncio.run(main()))
