exec(open('hand.py').read().split('OLD=')[0])
import sys
from playwright.sync_api import sync_playwright
REC=len(sys.argv)>1
with sync_playwright() as p:
    b=p.chromium.launch()
    kw=dict(viewport={'width':1280,'height':720})
    if REC: kw.update(record_video_dir=S+'/kv/rec',record_video_size={'width':1280,'height':720})
    c=b.new_context(**kw); fonts(c)
    pg=c.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    pg.goto(B+'/proba/k-kino/'); pg.wait_for_timeout(3200)
    n=pg.evaluate('KINO.n')
    for i in range(n):
        if i: pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(3600 if REC else 2800)
        if not REC: pg.screenshot(path=f'{S}/kv/f{i}.png')
    if REC: pg.wait_for_timeout(1000)
    c.close(); print(n,errs)
