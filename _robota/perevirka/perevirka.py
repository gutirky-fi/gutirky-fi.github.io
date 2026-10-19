#!/usr/bin/env python3
"""Швидка перевірка зібраного сайту в браузері (Playwright + Chromium).

Запуск:  python3 _robota/perevirka/perevirka.py [шлях до бібліотеки]
Перевіряє бібліотеку (з 19.10.2026 — biblioteka/index.html) і головну «кілька входів» (index.html).
Знімки екрана — у _robota/perevirka/znimky/ (у git не потрапляють, див. .gitignore).
Шрифти Google і нашивки з plast.global у середовищі без інтернету не завантажаться — це нормально:
нашивки замінюються тестовими кружечками, а шрифти — системними.
"""
import asyncio, os, sys, pathlib
from playwright.async_api import async_playwright

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
(HERE / 'znimky').mkdir(exist_ok=True)
if len(sys.argv) > 1:
    PAGE = 'file://' + str(pathlib.Path(sys.argv[1]).resolve())
else:   # бібліотека на сайті без власної головної («назад» — у «Виховники»), тож перевіряємо її копію без HOME_URL
    import subprocess
    t = HERE / 'znimky' / 'biblioteka-test.html'
    env = dict(os.environ, OUT=str(t)); [env.pop(k, None) for k in ('HOME_URL', 'HOME_LABEL', 'PREVIEW')]
    subprocess.run([sys.executable, str(ROOT / '_robota' / 'build.py')], check=True, env=env, stdout=subprocess.DEVNULL)
    PAGE = 'file://' + str(t)
# головну відкриваємо через маленький локальний сервер (щоб /biblioteka/ відкривалась як на сайті)
import threading, functools, http.server
_srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(type('Q', (http.server.SimpleHTTPRequestHandler,), {'log_message': lambda *a: None}), directory=str(ROOT)))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
HOME = f'http://127.0.0.1:{_srv.server_address[1]}/'
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
            # «Кераміка України» відкривається з картки бібліотеки (у каталозі до «Кераміки» тепер веде «Кераміка І» — окрема сторінка)
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
            await pg.locator('#lib .tabs [data-tab=lib], #lib .tabs [data-tab]').first.click(); await pg.wait_for_timeout(300)
            await pg.locator('#lib [data-open]').first.click(); await pg.wait_for_timeout(1200)
            check(await pg.evaluate("!document.querySelector('#gv').hidden && document.querySelector('#lib').hidden"), f'[{tag}] гутірка «Кераміка України» відкривається з бібліотеки')
            await pg.screenshot(path=str(OUT / f'{tag}-hutirka.png'))
            if not mob:
                await pg.mouse.move(w - 20, 20); await pg.wait_for_timeout(400)
            else:
                await pg.tap('#hot'); await pg.wait_for_timeout(400)
            await pg.click('#home-link'); await pg.wait_for_timeout(400)
            check(await pg.is_visible('#lib'), f'[{tag}] повернення в бібліотеку через меню в куті')
            # головна «кілька входів»
            if len(sys.argv) < 2:
                await pg.goto(HOME); await pg.wait_for_timeout(500)
                check(await pg.is_visible('.door'), f'[{tag}] головна: входи «Для всіх / Юнацтво / Виховники»')
                check(not await pg.locator('.ribbon').count(), f'[{tag}] головна: без смужки «макет»')
                sw = await pg.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth]")
                check(sw[0] <= sw[1], f'[{tag}] головна: немає горизонтальної прокрутки')
                await pg.screenshot(path=str(OUT / f'{tag}-vhody.png'))
                await pg.goto(HOME + '#povna'); await pg.wait_for_timeout(1500)
                check('/biblioteka/' in pg.url and await pg.evaluate("!document.querySelector('#gv').hidden"), f'[{tag}] старе посилання #povna відкриває гутірку з /biblioteka/')
                await pg.evaluate("document.getElementById('home-link').click()"); await pg.wait_for_timeout(900)
                check(pg.url.endswith('/#vyh'), f'[{tag}] з гутірки «Бібліотека» в меню веде у «Виховники» ({pg.url})')
            await ctx.close()
        await b.close()
    check(not errs, 'помилок JavaScript немає' + ('' if not errs else ': ' + '; '.join(errs[:3])))
    print('\nУСЕ ГАРАЗД' if ok else '\nЄ ПРОБЛЕМИ')
    return 0 if ok else 1

sys.exit(asyncio.run(main()))
