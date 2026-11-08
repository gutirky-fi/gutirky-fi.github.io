exec(open('hand.py').read().split('OLD=')[0])
from playwright.sync_api import sync_playwright
INIT="window.GUTIRKA_MQTT=['ws://127.0.0.1:9001/mqtt'];"
O=S+'/ov/'; errs=[]
with sync_playwright() as p:
    b=p.chromium.launch()
    def ctx(w,h):
        c=b.new_context(viewport={'width':w,'height':h}); fonts(c); c.add_init_script(INIT); c.add_init_script('window.print=()=>{}'); return c
    hc=ctx(1280,720); h=hc.new_page(); h.on('pageerror',lambda e:errs.append('H '+str(e)))
    h.goto(B+'/proba/skob-hra/?dyz=3&v=b'); h.wait_for_timeout(3500); h.screenshot(path=O+'skob-h1-start.png')
    h.click('#phone-mode'); h.wait_for_timeout(4000); h.screenshot(path=O+'skob-h2-veduchomu.png')
    code=h.evaluate("GutirkaPult.code"); key=h.evaluate("GutirkaPult.key"); h.evaluate("document.querySelector('#pult-dlg .pd-x').click()")
    pu=ctx(390,844).new_page(); pu.on('pageerror',lambda e:errs.append('PU '+str(e))); pu.goto(f'{B}/proba/pult/?c={code}&k={key}'); pu.wait_for_timeout(5000); pu.screenshot(path=O+'skob-u1-start.png')
    pu.click('[data-act="skob:lobby"]'); h.wait_for_timeout(5000)
    sc=h.evaluate("SKOB._debug().code")
    P=[]
    for i,nm in enumerate(['Марко','Оля','Тарас']):
        g=ctx(390,844).new_page(); g.on('pageerror',lambda e:errs.append('P '+str(e))); g.goto(B+'/proba/skob/?k='+sc); g.wait_for_timeout(2500)
        if i==0: g.screenshot(path=O+'skob-p1-join.png')
        g.fill('#f-name',nm); g.click('button.main'); P.append(g)
    h.wait_for_timeout(5000)
    for _ in range(3):
        try: pu.click('[data-act^="skob:ok:"]', timeout=1500); pu.wait_for_timeout(1200)
        except Exception: break
    h.wait_for_timeout(1500); h.screenshot(path=O+'skob-h3-lobby.png'); pu.screenshot(path=O+'skob-u2-lobby.png'); P[0].screenshot(path=O+'skob-p2-wait.png')
    pu.click('#next'); pu.wait_for_timeout(2000); h.screenshot(path=O+'skob-h4-intro.png')
    pu.click('#next'); pu.wait_for_timeout(2500); h.screenshot(path=O+'skob-h5-read.png')
    pu.click('#next'); pu.wait_for_timeout(2500)
    P[1].click('#ans button[data-o="1"]'); pu.wait_for_timeout(1500)
    h.screenshot(path=O+'skob-h6a-answering.png'); pu.screenshot(path=O+'skob-u3a-answering.png'); P[0].screenshot(path=O+'skob-p3a-answering.png')
    for g,o in zip([P[0],P[2]],[1,2]):
        try: g.click(f'#ans button[data-o="{o}"]', timeout=4000)
        except Exception as e: pass
    pu.wait_for_timeout(2500); h.screenshot(path=O+'skob-h7-answer.png'); pu.screenshot(path=O+'skob-u4-answer.png'); P[0].screenshot(path=O+'skob-p4-result.png')
    pu.click('#next'); pu.wait_for_timeout(2500); h.screenshot(path=O+'skob-h8-leaders.png'); pu.screenshot(path=O+'skob-u5-leaders.png'); P[1].screenshot(path=O+'skob-p5-place.png')
    pu.click('#next'); pu.wait_for_timeout(2500); P[0].screenshot(path=O+'skob-p3b-read.png')
    h.evaluate("SKOB.cmd('quit')") if False else None
    pu.once('dialog', lambda d: d.accept()); pu.click('#gend'); pu.wait_for_timeout(3000)
    h.screenshot(path=O+'skob-h9-end.png'); pu.screenshot(path=O+'skob-u6-end.png'); P[0].screenshot(path=O+'skob-p6-end.png')
    print('ERR', errs[:5])
