import json, re, sys
from playwright.sync_api import sync_playwright
U='http://localhost:8765/proba/dokumenty/'
O='/home/claude/snaps/v2/'
GS=open('/home/claude/gutirky-fi.github.io/_robota/dokumenty/etap2/pryimach.gs',encoding='utf-8').read()
def hide(pg): pg.add_style_tag(content='.ribbon{display:none!important} #v-lock-wrap .demo,.demo-note{}')
def run(name, fn):
    try: fn(); print('ok', name)
    except Exception as e: print('FAIL', name, str(e)[:300])
only = sys.argv[1:] 
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox','--lang=uk-UA'])
    D = b.new_context(viewport={'width':1280,'height':800}, device_scale_factor=2, locale='uk-UA', timezone_id='Europe/Helsinki')
    T = b.new_context(viewport={'width':1280,'height':2800}, device_scale_factor=2, locale='uk-UA', timezone_id='Europe/Helsinki')
    M = b.new_context(viewport={'width':390,'height':844}, device_scale_factor=3, has_touch=True, is_mobile=True, locale='uk-UA', timezone_id='Europe/Helsinki')
    def page(ctx, path):
        pg = ctx.new_page(); pg.goto(U+path); pg.wait_for_timeout(700); hide(pg); return pg
    def jsclick(pg, label):
        ok = pg.evaluate("""(l)=>{const all=[...document.querySelectorAll('body *')].filter(e=>e.offsetParent!==null && [...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim()===l);
          if(!all.length) return false; const e=all[0]; (e.closest('button,a,label,[role=button],[tabindex]')||e).click(); return true}""", label)
        if not ok: raise Exception('no element '+label)
    def shot(pg, path):
        pg.evaluate("""()=>{document.querySelectorAll('input[type=date]').forEach(e=>{const v=e.value; if(!v) return; e.dataset.iso=v; e.type='text'; e.value=v.split('-').reverse().join('.');})}""")
        pg.screenshot(path=path)
        pg.evaluate("""()=>{document.querySelectorAll('input[data-iso]').forEach(e=>{e.type='date'; e.value=e.dataset.iso; delete e.dataset.iso;})}""")
    def top(pg, sel, off=0):
        pg.evaluate("([s,o])=>{const e=document.querySelector(s); window.scrollTo(0, e.getBoundingClientRect().top+window.scrollY-o)}", [sel, off]); pg.wait_for_timeout(300)
    def el(pg, sel, name):
        pg.locator(sel).first.screenshot(path=O+name+'.png')
    ROWS=[('2026-09-06','1','Знайомство, правила гуртка','Відкриття · ігри на знайомство · домовленості','','Дана','домівка','9'),
          ('2026-09-13','2','Вузли й мотузки','Гутірка про вузли · гра «Місток»','Вузли','Ярко','домівка','8'),
          ('2026-09-20','3','Орієнтування','Компас · гра «Скарб» · підсумки','Орієнтування','Дана','парк','9'),
          ('2026-09-27','4','Мапа й компас','Азимут · естафета · підсумки','Орієнтування','Олесь','парк','8'),
          ('2026-10-04','5','Пластові пісні','Співаник · ватра в домівці','','Мирося','домівка','9'),
          ('2026-10-11','6','Підготова до мандрівки','Наплечник · маршрут · безпека','Мандрівництво','Остап','домівка','7'),
          ('2026-10-18','7','Кераміка','Майстерня: ліпимо горнятка','Кераміка','Соломія','майстерня','9')]
    def fill_form(pg, rows):
        pg.click('#b-fill'); pg.wait_for_timeout(500)
        pg.fill('#b-fm [data-top="b-hur"]', 'Лелеки'); pg.fill('#b-fm [data-top="b-rik"]', '2026–2027')
        pg.fill('#b-fm [data-fk="kur"]', 'ч. 12'); pg.fill('#b-fm [data-fk="zap"]', 'Олесь')
        for i, r in enumerate(rows):
            if i: pg.click('#b-fm-add'); pg.wait_for_timeout(350)
            for c, v in zip([0,1,2,3,5,6,7,8], r):
                if v: pg.fill(f'#b-fm [data-fk="{i}:{c}"]', v)

    def s_paper():
        pg = page(D, 'skhodyny/'); fill_form(pg, ROWS)
        pg.click('#b-fm-ok'); pg.wait_for_timeout(2000)
        pg.screenshot(path=O+'d_preview.png')
        pg.click('.pv-x'); pg.wait_for_timeout(600)
        el(pg, '#sheet', 'p_skhodyny')
        top(pg, '#b-fill', 330); pg.screenshot(path=O+'d_blankpage.png')
    def s_blank():
        pg = page(D, 'skhodyny/'); el(pg, '#sheet', 'p_blank'); top(pg, '.seg, #t-b', 40); pg.screenshot(path=O+'d_blank_ui.png')
    def s_zvity():
        for key, label in [('zvit','Звіт гуртка'),('fin','Фінансовий'),('prys','Присутність'),('kartka','Картка учасника'),('dosiah','Досягнення за рік'),('rik','Рік за роком')]:
            try:
                pg = page(T, 'zvity/'); jsclick(pg, label); pg.wait_for_timeout(700)
                if key=='zvit': pg.locator('#z-main').screenshot(path=O+'u_zvity.png')
                jsclick(pg, 'Переглянути'); pg.wait_for_timeout(2200)
                n = pg.locator('.pv-pg').count()
                pg.evaluate("document.querySelectorAll('.pv-zm,.pv-x,.pv-hint,.pv-tip,.pv-dock,.pv-fix,.pv-msg').forEach(e=>e.style.display='none')")
                print('  ', key, pg.evaluate("[...document.querySelectorAll('.pv-paper,.pv-pg,.pv-host')].map(e=>e.className+':'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height)+' kids:'+e.children.length).join(' | ')"))
                pg.locator('.pv-pg').first.screenshot(path=O+f'p_{key}.png')
                pg.close()
            except Exception as e: print('  FAIL', key, str(e)[:160])
    def s_mflow():
        pg = page(M, ''); shot(pg, O+'m_index.png')
        pg = page(M, 'skhodyny/'); shot(pg, O+'m_skh_top.png')
        fill_form(pg, ROWS[:2])
        top(pg, '#b-fm', 0); shot(pg, O+'m_form1.png')
        top(pg, '.fm-r[data-r="0"]', 8); shot(pg, O+'m_form2.png')
        pg.click('#b-fm-ok'); pg.wait_for_timeout(2000); shot(pg, O+'m_preview.png')
    def s_mz():
        pg = page(M, 'vidviduvanist/'); pg.click('#t-z'); pg.wait_for_timeout(700)
        print('   names:', pg.evaluate("document.querySelector('#z-names').innerHTML.slice(0,600)"))
        pg.fill('#z-data', '2026-11-08')
        for sel, v in [('#z-nr','12'),('#z-tema','Вузли й мотузки')]:
            try: pg.fill(sel, v)
            except Exception as e: print('   skip', sel, str(e)[:60])
        marks=['+','+','+','−','+','+','в']
        for i,m in enumerate(marks): pg.click(f'#z-names li[data-i="{i}"] button[data-m="{m}"]')
        top(pg, '#z-form', 8); pg.wait_for_timeout(300); shot(pg, O+'m_vid1.png')
        try:
            pg.select_option('#z-khto', index=1)
        except Exception as e: print('   khto', str(e)[:80])
        pg.locator('#z-send').scroll_into_view_if_needed(); pg.wait_for_timeout(300); shot(pg, O+'m_vid2.png')
        pg.click('#z-send'); pg.wait_for_timeout(1800)
        try: top(pg, '#z-done', 60)
        except Exception as e: print('   done', str(e)[:80])
        shot(pg, O+'m_vid3.png')
    def s_vykh():
        pg = page(D, 'vykhovnyk/'); el(pg, '#v-hub', 'u_hub')
        for key, bid, sel in [('nv','#go-nv','#v-nv'),('kp','#go-kp','#v-kp'),('pp','#go-pp','#v-pp'),('ps','#go-ps','#v-ps')]:
            pg = page(D, 'vykhovnyk/'); pg.click(bid); pg.wait_for_timeout(1500); el(pg, sel, 'u_'+key); pg.close()
    def s_tabs():
        for n in ['proby','vmilosti','kasa']:
            pg = page(D, n+'/'); pg.click('#t-z'); pg.wait_for_timeout(1500); el(pg, '#p-z', 'u_'+n); pg.close()
            pg = page(M, n+'/'); pg.click('#t-z'); pg.wait_for_timeout(1500); top(pg, '#p-z', 8); shot(pg, O+'m_'+n+'.png'); pg.close()
    def s_qr():
        m = re.search(r'var POSYLANNIA_HTML = ("(?:[^"\\]|\\.)*");', GS); html = json.loads(m.group(1))
        st = re.search(r'var STORINKY = (\[.*?\]);', GS, re.S).group(1)
        Q = b.new_context(viewport={'width':620,'height':600}, device_scale_factor=3, locale='uk-UA')
        pg = Q.new_page()
        html = html.replace('<head>', "<head><script>window.DEMO_DANI={url:'https://script.google.com/macros/s/AKfycbPRYKLAD-hurtok-Leleky-0000/exec', sait:'https://gutirky-fi.github.io/dokumenty/', storinky:"+st+"};</script>", 1)
        pg.set_content(html); pg.wait_for_timeout(900); pg.screenshot(path=O+'q_dialog.png')
        try: pg.locator('#kod').screenshot(path=O+'q_kod.png')
        except Exception as e: print('  kod', str(e)[:80])
    S={'paper':s_paper,'blank':s_blank,'zvity':s_zvity,'mflow':s_mflow,'mz':s_mz,'vykh':s_vykh,'tabs':s_tabs,'qr':s_qr}
    for k,f in S.items():
        if not only or k in only: run(k,f)
    b.close()
