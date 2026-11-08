exec(open('hand.py').read().split('OLD=')[0])
import re
from playwright.sync_api import sync_playwright
INIT="window.GUTIRKA_MQTT=['ws://127.0.0.1:9001/mqtt'];"
O=S+'/bt/'
errs=[]; log=[]
def L(*a): log.append(' '.join(str(x) for x in a)); print(*a)
with sync_playwright() as p:
    b=p.chromium.launch()
    def ctx(w,h):
        c=b.new_context(viewport={'width':w,'height':h}); fonts(c); c.add_init_script(INIT); c.add_init_script('window.print=()=>{}'); return c
    hc=ctx(1280,720); h=hc.new_page(); h.on('pageerror',lambda e:errs.append('HOST '+str(e)))
    h.goto(B+'/proba/bingo/?dyz=3'); h.wait_for_function("document.querySelector('#qr') && document.querySelector('#qr').dataset.u", timeout=20000)
    h.get_by_text('Швидке 1–20').click(); h.wait_for_timeout(800); h.screenshot(path=O+'01-host-lobby.png')
    url=h.evaluate("document.querySelector('#qr').dataset.u").replace('https://gutirky-fi.github.io',B); L('player url',url)
    P=[]
    for nm in ['Марко','Оля']:
        pg=ctx(390,844).new_page(); pg.on('pageerror',lambda e,nm=nm:errs.append(nm+' '+str(e))); pg.goto(url); pg.wait_for_timeout(2500)
        pg.fill('input:visible:not([inputmode=numeric])', nm); pg.locator('button:visible').filter(has_text=re.compile('Грати')).first.click(); P.append(pg)
    h.wait_for_timeout(5000); P[0].screenshot(path=O+'02-player-wait.png'); h.screenshot(path=O+'03-host-lobby-players.png')
    L('host players text', h.evaluate("document.getElementById('pl').innerText.replace(/\\n/g,' | ')"))
    # pult
    h.click('#phone-mode'); h.wait_for_timeout(4000); h.screenshot(path=O+'04-host-ved.png')
    code=h.evaluate("GutirkaPult.code"); key=h.evaluate("GutirkaPult.key")
    pu=ctx(390,844).new_page(); pu.on('pageerror',lambda e:errs.append('PULT '+str(e))); pu.goto(f'{B}/proba/pult/?c={code}&k={key}'); pu.wait_for_timeout(6000)
    L('pult status', h.evaluate("GutirkaPult.status"), 'ask', h.evaluate("!document.getElementById('pult-ask').hidden"))
    # print paper cards
    with hc.expect_page() as np:
        h.evaluate("[...document.querySelectorAll('#pult-dlg button')].find(b=>/Надрукувати/.test(b.textContent)).click()")
    pr=np.value; pr.wait_for_timeout(1500); pr.set_viewport_size({'width':900,'height':1200}); pr.screenshot(path=O+'05-print-cards.png'); L('print pages title', pr.title())
    h.evaluate("document.querySelector('#pult-dlg .pd-x').click()")
    pu.screenshot(path=O+'06-pult-lobby.png')
    pu.click('#next'); h.wait_for_timeout(2000)   # почати гру
    L('phase after start', h.evaluate("BINGO.state().phase"))
    cards={}
    for i,pg in enumerate(P): cards[i]=pg.evaluate("[...document.querySelectorAll('#card button[data-k]')].map(b=>b.textContent.trim())")
    L('cards', cards)
    # Оля одразу натискає «БІНГО» (кнопка неактивна) — пробуємо зробити позначки невірно
    won=False; n=0
    while n<20 and not won:
        pu.click('#next'); pu.wait_for_timeout(1200); n+=1
        cur=h.evaluate("document.getElementById('bn').textContent.trim()")
        for i,pg in enumerate(P):
            bn=pg.evaluate("document.getElementById('bn').textContent.trim()")
            if bn!=cur: L('MISMATCH ball', i, bn, cur)
            if i==0:   # Оля пропускає кожну другу кульку
                if cur in cards[i]:
                    pg.locator('#card button[data-k]').nth(cards[i].index(cur)).click()
        if n==1:
            for k in range(3): P[1].locator('#card button[data-k]').nth(k).click()   # Оля «хитрує»: позначає перший рядок
            P[1].wait_for_timeout(300); dis=P[1].locator('#skob').is_disabled(); L('Olya button disabled?', dis)
            if not dis: P[1].click('#skob'); P[1].wait_for_timeout(2000); P[1].screenshot(path=O+'07b-olya-false.png'); h.screenshot(path=O+'07c-host-toast.png')
            L('olya msg', P[1].evaluate("document.getElementById('msg').textContent"))
            for k in range(3): P[1].locator('#card button[data-k]').nth(k).click()
        if not P[0].locator('#skob').is_disabled():
            P[0].screenshot(path=O+'07-player-can-bingo.png'); P[0].click('#skob'); won=True
    h.wait_for_timeout(2500)
    L('balls drawn', n, 'won', won, 'winners', h.evaluate("BINGO.state().winners"))
    h.screenshot(path=O+'08-host-win.png'); P[0].screenshot(path=O+'09-player-win.png'); P[1].screenshot(path=O+'10-player-other.png'); pu.screenshot(path=O+'11-pult-win.png')
    h.click('#goon'); h.wait_for_timeout(800)
    # перевірка паперової картки з пульта
    pu.fill('#ix .g-inp input','3'); pu.click('#ix .g-inp button'); pu.wait_for_timeout(2500)
    pu.screenshot(path=O+'12-pult-check.png'); h.screenshot(path=O+'13-host-check.png')
    L('verd', h.evaluate("document.getElementById('verd').textContent"))
    # завершити з пульта
    pu.once('dialog', lambda d: d.accept()); pu.click('#gend'); pu.wait_for_timeout(2500)
    L('phase after end', h.evaluate("BINGO.state().phase")); h.screenshot(path=O+'14-host-after-end.png'); pu.screenshot(path=O+'15-pult-after-end.png'); P[0].screenshot(path=O+'16-player-after-end.png')
    P[0].screenshot(path=O+'16-player-after-end.png')
    L('player0 msg after end', repr(P[0].evaluate("document.getElementById('msg').textContent")), 'marked', P[0].evaluate("document.querySelectorAll('#card button.on, #card button[aria-pressed=true]').length"))
    L('ERRORS', errs)
open(O+'log.txt','w').write('\n'.join(log))
