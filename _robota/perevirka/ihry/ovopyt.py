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
    h.goto(B+'/proba/opytuvannia/?dyz=3'); h.wait_for_function("document.querySelector('#qr') && document.querySelector('#qr').dataset.u", timeout=20000)
    url=h.evaluate("document.querySelector('#qr').dataset.u").replace('https://gutirky-fi.github.io',B)
    h.click('#phone-mode'); h.wait_for_timeout(4000); code=h.evaluate("GutirkaPult.code"); key=h.evaluate("GutirkaPult.key"); h.evaluate("document.querySelector('#pult-dlg .pd-x').click()")
    pu=ctx(390,844).new_page(); pu.on('pageerror',lambda e:errs.append('PU '+str(e))); pu.goto(f'{B}/proba/pult/?c={code}&k={key}'); pu.wait_for_timeout(5000)
    V=[]
    for i in range(4):
        g=ctx(390,844).new_page(); g.on('pageerror',lambda e:errs.append('P '+str(e))); g.goto(url); V.append(g)
    h.wait_for_timeout(6000); h.screenshot(path=O+'opyt-h1-lobby.png'); pu.screenshot(path=O+'opyt-u1-lobby.png'); V[0].screenshot(path=O+'opyt-p1-wait.png')
    pu.click('#next'); pu.wait_for_timeout(2000); V[0].screenshot(path=O+'opyt-p2-ots.png')
    for g,v in zip(V,[4,4,3,4]):
        try: g.click(f'button[data-v="{v}"]', timeout=5000)
        except Exception: pass
    h.wait_for_timeout(2500); h.screenshot(path=O+'opyt-h2-ots.png'); pu.screenshot(path=O+'opyt-u2-ots.png'); V[0].screenshot(path=O+'opyt-p3-voted.png')
    pu.click('#next'); pu.wait_for_timeout(2000)
    for g,v in zip(V,[1,0,1,3]):
        try: g.click(f'button[data-v="{v}"]', timeout=5000)
        except Exception: pass
    h.wait_for_timeout(2500); h.screenshot(path=O+'opyt-h3-var.png'); pu.screenshot(path=O+'opyt-u3-var.png'); V[1].screenshot(path=O+'opyt-p4-var.png')
    pu.click('#next'); pu.wait_for_timeout(1500)
    for g,v in zip(V,[0,0,1,0]):
        try: g.click(f'button[data-v="{v}"]', timeout=5000)
        except Exception: pass
    pu.click('#next'); pu.wait_for_timeout(2000)
    for g,w in zip(V,['похід','похід','ігри','вогнище']):
        try: g.fill('input:visible', w, timeout=4000); g.locator('button:visible').last.click()
        except Exception as e: errs.append('word '+str(e)[:60])
    h.wait_for_timeout(2500); h.screenshot(path=O+'opyt-h4-slovo.png'); pu.screenshot(path=O+'opyt-u4-slovo.png'); V[2].screenshot(path=O+'opyt-p5-slovo.png')
    pu.click('#next'); pu.wait_for_timeout(2500); h.screenshot(path=O+'opyt-h5-summary.png'); pu.screenshot(path=O+'opyt-u5-end.png'); V[0].screenshot(path=O+'opyt-p6-end.png')
    print('ERR', errs[:6])
