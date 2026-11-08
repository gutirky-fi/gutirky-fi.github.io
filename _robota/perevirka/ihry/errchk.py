from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch()
    for u in ['/proba/svoya-hra/?dyz=3','/proba/bingo/?dyz=3','/proba/skob-hra/?dyz=3&v=b','/proba/opytuvannia/?dyz=3','/proba/svoya-hra/hravets/?dyz=3','/proba/skob/','/proba/bingo/gravets/?dyz=3','/proba/opytuvannia/golos/?dyz=3','/proba/pult/','/proba/svoya-hra/vedyuchyi/?dyz=3']:
        pg=b.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:120])); pg.goto('http://127.0.0.1:8766'+u); pg.wait_for_timeout(2500); print(u, errs[:3]); pg.close()
