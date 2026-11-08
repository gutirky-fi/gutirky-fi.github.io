from playwright.sync_api import sync_playwright
import os
TUT=os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else os.getcwd()
ROB=os.path.abspath(os.path.join(TUT,'..','..'))
S=os.environ.get('OUT','/tmp/perevirka-ihry'); [os.makedirs(os.path.join(S,d),exist_ok=True) for d in ('ov','bt','kv')]
F=os.path.join(ROB,'druk','shryfty'); C=os.path.join(ROB,'offline','shryfty','Caveat.ttf')
B='http://127.0.0.1:8766'
def fonts(c):
    c.route("**/fonts.googleapis.com/**", lambda r: r.fulfill(path=os.path.join(TUT,'fonts.css'), content_type='text/css'))
    c.route("http://fonts.local/Oswald.ttf", lambda r: r.fulfill(path=F+'/Oswald.ttf'))
    c.route("http://fonts.local/SourceSans3.ttf", lambda r: r.fulfill(path=F+'/SourceSans3.ttf'))
    c.route("http://fonts.local/Caveat.ttf", lambda r: r.fulfill(path=C))
    c.route("http://fonts.local/Playfair.ttf", lambda r: r.fulfill(path=os.path.join(ROB,'offline','shryfty','PlayfairDisplay.ttf')))
    c.route("**/*peerjs*", lambda r: r.abort())
OLD="#skob .sk-lbl{font:500 clamp(1.2rem,1.7vw,2rem)/1.1 Caveat,'Segoe Print',cursive!important;color:#2fd2c0!important}"
with sync_playwright() as p:
    b=p.chromium.launch()
    c=b.new_context(viewport={'width':1280,'height':720}); fonts(c)
    h=c.new_page(); h.goto(B+'/proba/skob-hra/?dyz=3&v=b'); h.wait_for_timeout(3000); h.screenshot(path=S+'/sk3/h-skob-intro.png')
    h.evaluate("SKOB.cmd('next')"); h.wait_for_timeout(2500); h.screenshot(path=S+'/sk3/h-skob-q-new.png')
    h.add_style_tag(content=OLD); h.wait_for_timeout(500); h.screenshot(path=S+'/sk3/h-skob-q-old.png')
    for n,u in [('bingo','/proba/bingo/?dyz=3'),('zmag','/proba/svoya-hra/?dyz=3')]:
        h=c.new_page(); h.goto(B+u); h.wait_for_timeout(3000); h.screenshot(path=S+f'/sk3/h-{n}-lobby.png')
    c2=b.new_context(viewport={'width':390,'height':844}); fonts(c2)
    h=c2.new_page(); h.goto(B+'/proba/pult/'); h.wait_for_timeout(2500); h.screenshot(path=S+'/sk3/h-pult.png')
