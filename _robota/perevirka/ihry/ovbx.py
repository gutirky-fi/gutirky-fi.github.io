exec(open('hand.py').read().split('OLD=')[0])
import re
from playwright.sync_api import sync_playwright
INIT="window.GUTIRKA_MQTT=['ws://127.0.0.1:9001/mqtt'];"
O=S+'/ov/'
with sync_playwright() as p:
    b=p.chromium.launch()
    def ctx(w,h):
        c=b.new_context(viewport={'width':w,'height':h}); fonts(c); c.add_init_script(INIT); return c
    h=ctx(1280,720).new_page(); h.goto(B+'/proba/bingo/?dyz=3'); h.wait_for_function("document.querySelector('#qr') && document.querySelector('#qr').dataset.u", timeout=20000)
    h.get_by_text('Кераміка України').first.click(); h.wait_for_timeout(500)
    url=h.evaluate("document.querySelector('#qr').dataset.u").replace('https://gutirky-fi.github.io',B)
    g=ctx(390,844).new_page(); g.goto(url); g.wait_for_timeout(2500); g.screenshot(path=O+'bingo-p0-join.png')
    g.fill('input:visible:not([inputmode=numeric])','Марко'); g.locator('button:visible').filter(has_text=re.compile('Грати')).first.click(); h.wait_for_timeout(4000)
    h.click('#start'); h.wait_for_timeout(800); h.click('#next'); h.wait_for_timeout(1500); h.screenshot(path=O+'bingo-h7-keramika-q.png'); g.screenshot(path=O+'bingo-p6-keramika.png')
    h.click('#next'); h.wait_for_timeout(1500); h.screenshot(path=O+'bingo-h8-keramika-a.png')
