exec(open('hand.py').read().split('OLD=')[0])
import re
from playwright.sync_api import sync_playwright
INIT="window.GUTIRKA_MQTT=['ws://127.0.0.1:9001/mqtt'];"
O=S+'/ov/'; errs=[]
with sync_playwright() as p:
    b=p.chromium.launch()
    def ctx(w,h):
        c=b.new_context(viewport={'width':w,'height':h}); fonts(c); c.add_init_script(INIT); c.add_init_script('window.print=()=>{}'); return c
    h=ctx(1280,720).new_page(); h.on('pageerror',lambda e:errs.append('H '+str(e)))
    h.goto(B+'/proba/svoya-hra/?dyz=3'); h.wait_for_function("document.querySelector('#qr') && document.querySelector('#qr').dataset.u && document.querySelector('#vqr2') && document.querySelector('#vqr2').dataset.u", timeout=25000)
    url=h.evaluate("document.querySelector('#qr').dataset.u").replace('https://gutirky-fi.github.io',B)
    vu=h.evaluate("document.querySelector('#vqr2').dataset.u").replace('https://gutirky-fi.github.io',B)
    C=[]
    for i,(nm,tm) in enumerate([('Марко','Вовки'),('Оля','Соколи')]):
        g=ctx(390,844).new_page(); g.on('pageerror',lambda e:errs.append('C '+str(e))); g.goto(url); g.wait_for_timeout(2500)
        if i==0: g.screenshot(path=O+'zmag-p1-join.png')
        g.fill('#f-name',nm); g.click('#go'); g.wait_for_timeout(2500)
        if i==0: g.screenshot(path=O+'zmag-p2-team.png')
        g.locator('#tp button', has_text=tm).click(); g.wait_for_timeout(1500); C.append(g)
    pu=ctx(390,844).new_page(); pu.on('pageerror',lambda e:errs.append('PU '+str(e))); pu.goto(vu); pu.wait_for_timeout(5000)
    h.wait_for_timeout(1500); h.screenshot(path=O+'zmag-h1-lobby.png'); pu.screenshot(path=O+'zmag-u1-lobby.png'); C[0].screenshot(path=O+'zmag-p3-wait.png')
    h.click('.s3v'); h.wait_for_timeout(1200); h.screenshot(path=O+'zmag-h2-veduchomu.png'); h.keyboard.press('Escape'); h.wait_for_timeout(500)
    h.click('#start'); h.wait_for_timeout(2500); h.screenshot(path=O+'zmag-h3-board.png'); pu.screenshot(path=O+'zmag-u2-board.png'); C[0].screenshot(path=O+'zmag-p4-board.png')
    pu.click('.bd button:not([disabled])'); pu.wait_for_timeout(3000)
    h.screenshot(path=O+'zmag-h4-question.png'); pu.screenshot(path=O+'zmag-u3-question.png'); C[0].screenshot(path=O+'zmag-p5-question.png'); C[1].screenshot(path=O+'zmag-p6-question-other.png')
    pu.click('[data-a="yes"]'); pu.wait_for_timeout(2500)
    h.screenshot(path=O+'zmag-h5-correct.png'); pu.screenshot(path=O+'zmag-u4-correct.png'); C[0].screenshot(path=O+'zmag-p7-correct.png')
    pu.click('[data-a="back"]'); pu.wait_for_timeout(2000)
    pu.once('dialog', lambda d: d.accept()); pu.click('.hend'); pu.wait_for_timeout(9000)
    h.screenshot(path=O+'zmag-h6-final.png'); pu.screenshot(path=O+'zmag-u5-final.png'); C[0].screenshot(path=O+'zmag-p8-final.png')
    print('ERR', errs[:6])
