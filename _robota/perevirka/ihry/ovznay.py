exec(open('hand.py').read().split('OLD=')[0])
# «Новий виховник»: екран, пульт, 4 телефони — «Вгадай, хто?» і «Хто з нас…» (знімки в ov/znay-*)
from playwright.sync_api import sync_playwright
INIT="window.GUTIRKA_MQTT=['ws://127.0.0.1:9001/mqtt'];"
O=S+'/ov/'; errs=[]
IM=['Оленка','Тарас','Марко','Іра']; FK=['Я ловив рибу в Норвегії','Я вмію жонглювати трьома мʼячиками','Я бачив вовка в лісі біля дачі','Я грала на сцені в театрі']
with sync_playwright() as p:
    b=p.chromium.launch()
    def ctx(w,h):
        c=b.new_context(viewport={'width':w,'height':h}); fonts(c); c.add_init_script(INIT); return c
    h=ctx(1280,720).new_page(); h.on('pageerror',lambda e:errs.append('H '+str(e)))
    h.goto(B+'/proba/novyi-vykhovnyk/?dyz=3', wait_until='domcontentloaded'); h.wait_for_function("document.querySelector('#qr') && document.querySelector('#qr').dataset.u", timeout=20000)
    url=h.evaluate("document.querySelector('#qr').dataset.u").replace('https://gutirky-fi.github.io',B)
    h.click('#phone-mode'); h.wait_for_timeout(4000); code=h.evaluate("GutirkaPult.code"); key=h.evaluate("GutirkaPult.key"); h.evaluate("document.querySelector('#pult-dlg .pd-x').click()")
    pu=ctx(390,844).new_page(); pu.on('pageerror',lambda e:errs.append('PU '+str(e))); pu.goto(f'{B}/proba/pult/?c={code}&k={key}', wait_until='domcontentloaded'); pu.wait_for_timeout(5000)
    V=[]
    for i,n in enumerate(IM):
        g=ctx(390,844).new_page(); g.on('pageerror',lambda e,i=i:errs.append(f'P{i} '+str(e))); g.goto(url, wait_until='domcontentloaded'); g.wait_for_timeout(800)
        if i==0: g.screenshot(path=O+'znay-p0-join.png')
        g.fill('#f-name',n); g.click('#go'); V.append(g)
    h.wait_for_timeout(6000); h.screenshot(path=O+'znay-h1-lobby.png'); pu.screenshot(path=O+'znay-u1-lobby.png'); V[0].screenshot(path=O+'znay-p1-wait.png')
    pu.click('#next'); pu.wait_for_timeout(2000); V[0].screenshot(path=O+'znay-p2-zbir.png')
    for g,f in zip(V[:3],FK):
        g.fill('#w',f); g.click('#send')
    h.wait_for_timeout(2500); h.screenshot(path=O+'znay-h2-zbir.png'); pu.screenshot(path=O+'znay-u2-zbir.png')
    pu.click('#next'); pu.wait_for_timeout(2500); h.screenshot(path=O+'znay-h3-fakt.png'); pu.screenshot(path=O+'znay-u3-fakt.png')
    st=h.evaluate("ZNAY.state()"); print('state',st)
    for i,g in enumerate(V): g.screenshot(path=O+f'znay-p3-fakt{i}.png')
    pu.click('button[data-act="frev"]'); pu.wait_for_timeout(2000); h.screenshot(path=O+'znay-h4-rev.png'); pu.screenshot(path=O+'znay-u4-rev.png'); V[1].screenshot(path=O+'znay-p4-rev.png')
    pu.click('button[data-act="fok"]'); pu.wait_for_timeout(800)
    pu.click('#next'); pu.wait_for_timeout(800); pu.click('#next'); pu.wait_for_timeout(800); pu.click('#next'); pu.wait_for_timeout(2000)
    h.screenshot(path=O+'znay-h5-end.png'); print('end',h.evaluate("ZNAY.state().phase"))
    # «Хто з нас…»
    pu.click('#next'); h.wait_for_timeout(1500); h.screenshot(path=O+'znay-h6-lobby-my.png')
    pu.click('#next'); pu.wait_for_timeout(2000); V[0].screenshot(path=O+'znay-p6-my.png')
    for g,v in zip(V,[1,0,0,0]):
        try: g.click(f'#body button[data-v="{v}"]', timeout=4000)
        except Exception as e: errs.append('vote '+str(e)[:80])
    h.wait_for_timeout(2500); h.screenshot(path=O+'znay-h7-my.png'); pu.screenshot(path=O+'znay-u7-my.png'); V[0].screenshot(path=O+'znay-p7-voted.png')
    pu.click('button[data-act="mrev"]'); pu.wait_for_timeout(2000); h.screenshot(path=O+'znay-h8-win.png'); V[2].screenshot(path=O+'znay-p8-win.png')
    print('my',h.evaluate("ZNAY.state()"))
    print('ERR', errs[:8])
