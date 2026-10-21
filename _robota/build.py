#!/usr/bin/env python3
"""Збирає сайт «Бібліотека гутірок» в один файл: бібліотека + каталог вмілостей + гутірка «Кераміка України» (2 версії) + пульт.

Запуск (з будь-якої папки):
    python3 _robota/build.py                 -> записує ../biblioteka/index.html (бібліотека на сайті, з noindex)
    З 19.10.2026 головна сторінка сайту — «кілька входів» (python3 _robota/proby/vhody/zibraty.py sait);
    бібліотека переїхала на /biblioteka/, її «Бібліотека» в меню веде назад у «Виховники» (../#vyh).
Змінні середовища (необовʼязково):
    OUT=шлях          куди записати результат
    SHELL_NAME=shell_file   стара оболонка (дизайн до Д1); за замовчуванням shell_d1 (поточний дизайн Д1)
    PREVIEW=1         бірюзова смужка «попередній перегляд» і примітка в каталозі (для показу копії)
    PULT_URL=адреса   адреса сторінки пульта для QR-коду
    NOINDEX=0         не додавати <meta name="robots" content="noindex, nofollow">
"""
import re, sys, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
PULT_URL = os.environ.get('PULT_URL', 'https://gutirky-fi.github.io/pult/')

SRC = os.path.join(HERE, 'gutirky', 'keramika', 'index.html')   # гутірка «Кераміка України» (повна; вишкіл — той самий код з MODE="short")
if 'OUT' not in os.environ:   # справжній сайт: бібліотека на /biblioteka/, «назад» — у «Виховники»
    os.makedirs(os.path.join(HERE, '..', 'biblioteka'), exist_ok=True)
    os.environ.setdefault('HOME_URL', '../#vyh'); os.environ.setdefault('HOME_LABEL', 'Виховники')
OUT = os.environ.get('OUT', os.path.join(HERE, '..', 'biblioteka', 'index.html'))
D = os.path.join(HERE, 'src') + os.sep


def rep(s, a, b, n=1):
    c = s.count(a)
    assert c == n, (c, a[:90])
    return s.replace(a, b)


h = open(SRC, encoding='utf8').read()
# картинки з «Кераміки І» для слайдів вступу й технології (19.10.2026): {{K:назва}} -> data:image/webp
import base64 as _b64
h = re.sub(r'\{\{K:([a-z0-9]+)\}\}', lambda m: 'data:image/webp;base64,' + _b64.b64encode(open(os.path.join(HERE, 'gutirky', 'keramika-1', 'kartynky', m.group(1) + '.webp'), 'rb').read()).decode(), h)
assert '{{K:' not in h
font = re.search(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>', h).group(0)
css = h[h.index('<style>') + 7:h.index('</style>')]
body = h[h.index('<body>') + 6:h.index('<script>')]
s0 = h.index('<script>') + 8
app = h[s0:h.index('</script>', s0)]

# ---- CSS гутірки ----
css = rep(css, 'body.idle{cursor:none}', '')
# шрифт Caveat потрібен і бібліотеці — він уже є в посиланні

# ---- розмітка гутірки ----
body = rep(body, '<a id="home-link" href="../../">← Бібліотека</a>', '<a id="home-link" href="#" data-lib>← Бібліотека</a>')
body = rep(body, '<a class="back-home" href="../../">← До бібліотеки гутірок</a>', '<a class="back-home" href="#" data-lib>← До бібліотеки гутірок</a>')
body = re.sub(r'<div id="mode-label">[^<]*</div>', '<div id="mode-label"></div>', body)
assert '../' not in body

# ---- одне кутове меню замість розкиданих кнопок ----
body = rep(body, '<div id="mode-label"></div>\n', '')
body = rep(body, '<button id="menu">☰ Зміст</button><a id="home-link" href="#" data-lib>← Бібліотека</a><button id="phone-mode" type="button" aria-label="Керування презентацією з телефона">📱 Пульт</button>\n', '')
body = rep(body, '<div id="ctl"><button data-n="-1" aria-label="Назад">‹</button><button data-n="1" aria-label="Далі">›</button></div>\n',
  '<div id="corner"><div id="hot" aria-hidden="true"></div>'
  '<nav id="cmenu" aria-label="Меню гутірки">'
  '<div id="mode-label"></div>'
  '<button id="menu" type="button">☰ Зміст</button>'
  '<button id="phone-mode" type="button" aria-label="Керування презентацією з телефона">📱 Пульт</button>'
  '<button id="fs-btn" type="button">⛶ На весь екран</button>'
  '<a id="home-link" href="#" data-lib>← Бібліотека</a>'
  '</nav></div>\n')
css = rep(css, 'body.idle #menu,body.idle #phone-mode,body.idle #home-link,body.idle #ctl,body.idle #mode-label{opacity:0;pointer-events:none}', '')
css += r"""
/* ===== Кутове меню: зʼявляється, лише коли навести мишку в правий верхній кут ===== */
#corner{position:absolute;z-index:6;top:0;right:0;width:110px;height:110px}
#hot{position:absolute;inset:0}
#hot:after{content:"⋯";position:absolute;top:calc(6px + env(safe-area-inset-top,0px));right:16px;font:600 26px/1 'Source Sans 3',sans-serif;color:#fff;opacity:.16;transition:opacity .4s}
body.idle #hot:after,body:not(.touchmode) #corner:hover #hot:after,#corner.open #hot:after{opacity:0}
#cmenu *{pointer-events:inherit}
#cmenu{position:absolute;top:calc(10px + env(safe-area-inset-top,0px));right:12px;width:236px;display:flex;flex-direction:column;gap:6px;padding:12px;border-radius:18px;background:rgba(31,35,40,.96);border:1px solid #3b4048;box-shadow:0 18px 60px #000b;opacity:0;transform:translateY(-6px) scale(.98);transform-origin:top right;pointer-events:none;transition:opacity .2s,transform .2s}
#corner.open #cmenu,#corner:has(:focus-visible) #cmenu{opacity:1;transform:none;pointer-events:auto}
@media(hover:hover){body:not(.touchmode) #corner:hover #cmenu{opacity:1;transform:none;pointer-events:auto}}
#cmenu #mode-label,#cmenu #menu,#cmenu #phone-mode,#cmenu #home-link,#cmenu button{position:static!important;inset:auto!important;transform:none!important;opacity:1!important;pointer-events:inherit!important;margin:0!important;max-width:none!important}
#cmenu #mode-label{padding:2px 4px 6px;background:none;border:0;color:#ffc247;font:700 11px/1.3 'Source Sans 3',sans-serif;letter-spacing:.1em;text-align:left}
#cmenu .cm-nav{display:grid;grid-template-columns:1fr 1fr;gap:6px}
#cmenu button,#cmenu a{display:flex;align-items:center;gap:8px;width:100%;padding:10px 12px!important;border-radius:12px!important;border:1px solid #3b4048!important;background:#272b31!important;color:#f2f4f6!important;font:600 15px/1.2 'Source Sans 3',system-ui,sans-serif!important;text-decoration:none;text-align:left;cursor:pointer}
#cmenu .cm-nav button{justify-content:center}
#cmenu button:hover,#cmenu a:hover,#cmenu button:focus-visible,#cmenu a:focus-visible{background:#353a42!important;border-color:#ffc247!important;outline:none}
#cmenu #phone-mode .pd-dot{margin-left:auto}
@media(prefers-reduced-motion:reduce){#cmenu{transition:none}}
/* ===== Краї екрана: ліворуч — назад, праворуч — далі ===== */
.edge{position:absolute;z-index:4;top:120px;bottom:64px;width:24px;cursor:pointer;-webkit-tap-highlight-color:transparent}
#edge-l{left:0}#edge-r{right:0}
#edge-l span{left:6px}#edge-r span{right:6px}
.edge span{position:absolute;top:50%;margin-top:-22px;display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:rgba(31,35,40,.85);border:1px solid #3b4048;color:#f2f4f6;font:600 30px/1 'Source Sans 3',sans-serif;padding-bottom:4px;opacity:0;transform:scale(.85);transition:opacity .2s,transform .2s;pointer-events:none}
@media(hover:hover){body:not(.touchmode) .edge:hover span{opacity:1;transform:none}}
.edge:active span{opacity:1;transform:scale(.95)}
@media(prefers-reduced-motion:reduce){.edge span{transition:none}}
"""

# ---- код гутірки: у функцію, щоб запускати потрібну версію ----
app = rep(app, 'const MODE="full",SH_=MODE==="short";', 'const SH_=MODE==="short";')
app = rep(app, '<a class="back-home" href="../../">← До бібліотеки гутірок</a>', '<a class="back-home" href="#" data-lib>← До бібліотеки гутірок</a>')
app = rep(app, 'document.addEventListener(', 'docOn(', 2)
app = rep(app, '$("#app").addEventListener(', 'elOn($("#app"),', 2)
n_win = len(re.findall(r'(?<![.\w$])addEventListener\(', app))
assert n_win == 3, n_win
app = re.sub(r'(?<![.\w$])addEventListener\(', 'winOn(', app)
assert 'addEventListener' not in app.replace('.addEventListener', '') or True

adapter = r'''
const slideTitle=s=>{if(!s)return"";switch(s.t){case"title":return"Титульний слайд";case"overview":return"Карта України";case"card":return s.x[1];case"tech":return s.e.t;case"hist":return s.e[1];case"ask":return"Запитання: "+s.q;case"ri":return R[s.i].n;case"rf":return R[s.i].n+" · особливості";case"rp":{const p=P[s.i][s.j];return R[s.i].n+" · "+(p&&p[2]?p[2]:"виріб")}case"home":return R[s.i].n+" · підсумок";case"q":return"Вікторина, запитання "+(s.k+1);case"end":return"Завершення"}return""};
const sections=[["Початок",0],["Вступ",sec.i],["Технологія",sec.t],...(SH_?[]:[["Історія",sec.h]]),...R.map((r,i)=>[r.n,st[i]]),["Вікторина",sec.q],["Завершення",sec.e]];
window.GUTIRKA={id:"keramika-"+MODE,title:"Кераміка України · "+(SH_?"вишкіл":"повна гутірка"),
state:()=>({mode:MODE,index:idx,total:S.length,title:slideTitle(S[idx]),next:idx<S.length-1?slideTitle(S[idx+1]):"",note:typeof noteNow==="function"?noteNow():noteFor(S[idx]),ns:typeof nsNow==="function"?nsNow():null,step:rev>tot?tot:rev,steps:tot,elapsed:T0?Math.floor(((typeof TE!=="undefined"&&TE||Date.now())-T0)/1000):0,running:!!T0&&!(typeof TE!=="undefined"&&TE),target:TARGET*60,sections,ix:typeof ixOf==="function"?ixOf():null}),
next:()=>adv(1),prev:()=>adv(-1),jump:i=>{if(i>=0&&i<S.length)go(i)},resetTimer:()=>{T0=idx>0?Date.now():0;if(typeof TE!=="undefined")TE=0},refit:()=>focus(lg,lf),act:id=>{if(typeof gAct==="function")gAct(id)},asset:id=>typeof gAsset==="function"?gAsset(id):null};
'''
gscript = ('/* Гутірка «Кераміка України». MODE: "full" або "short". Кожен запуск — окремий екземпляр; '
           'неактивні екземпляри не реагують на події. */\n'
           'function startGutirka(MODE,TOKEN){\n'
           'const alive=()=>window.__alive(TOKEN);\n'
           'const docOn=(t,f,o)=>document.addEventListener(t,e=>{if(alive())f(e)},o);\n'
           'const winOn=(t,f,o)=>window.addEventListener(t,e=>{if(alive())f(e)},o);\n'
           'const elOn=(el,t,f,o)=>el.addEventListener(t,e=>{if(alive())f(e)},o);\n'
           + app + '\n' + adapter + '}\n')

SHELL_NAME = os.environ.get('SHELL_NAME', 'shell_d1')
head_extra = ''
shell_css = open(D + 'shell_file.css', encoding='utf8').read()
shell_html = open(D + SHELL_NAME + '.html', encoding='utf8').read()
shell_js = open(D + 'shell_file.js', encoding='utf8').read()
host_js = open(D + 'pult-host-file.js', encoding='utf8').read()
if SHELL_NAME == 'shell_d1':
    # ---------- дизайн Д1 ----------
    # стилі: пульт на телефоні і спільне — зі старого файлу, бібліотека і меню гутірки — нові
    keep = []
    for ln in shell_css.split('\n'):
        t = ln.strip()
        if t.startswith('#lib ') and not t.startswith('#lib button:focus-visible'):
            continue
        if t.startswith('@media (pointer:coarse){#lib') or t.startswith('/* Кнопка «Пульт» у бібліотеці'):
            continue
        keep.append(ln)
    shell_css = ('\n'.join(keep) + '\n' + open(D + 'lib_d1.css', encoding='utf8').read()
                 + '\n' + open(D + 'gutirka_d1.css', encoding='utf8').read())
    # код бібліотеки: старий блок замінюється новим (бібліотека + каталог вмілостей)
    i1 = shell_js.index('  /* ---------------- бібліотека ---------------- */')
    i2 = shell_js.index('  /* ---------------- пульт на телефоні ---------------- */')
    shell_js = shell_js[:i1] + open(D + 'lib_d1.js', encoding='utf8').read() + '\n' + shell_js[i2:]
    shell_js = open(D + 'skills_data.js', encoding='utf8').read() + '\n' + shell_js   # повний перелік вмілостей
    shell_js = rep(shell_js, "  else setView('lib');\n})();", "  else if (h0 === 'katalog') { setView('lib'); setTab('kat'); }\n  else setView('lib');\n})();")
    IC = {
        'list': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg>',
        'phone': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
        'fs': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
        'fsx': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
        'back': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    }
    shell_js = rep(shell_js, "fsBtn.textContent = document.fullscreenElement ? '🗗 Вийти з повного екрана' : '⛶ На весь екран';",
                   "fsBtn.innerHTML = document.fullscreenElement ? " + json.dumps(IC['fsx'] + '<span>Вийти з повного екрана</span>') + " : " + json.dumps(IC['fs'] + '<span>На весь екран</span>') + ";")
    shell_js = rep(shell_js, "    $('#mode-label').textContent = MODE_LABEL[mode] || '';",
                   "    $('#mode-label').textContent = MODE_LABEL[mode] || '';\n    $('#cm-title').textContent = (BUILTIN.find(b => b.vars.some(v => v.mode === mode)) || {}).title || '';")
    # меню в куті гутірки: емблема, назва гутірки, значки замість емодзі
    body = rep(body, '<nav id="cmenu" aria-label="Меню гутірки"><div id="mode-label"></div><button id="menu" type="button">☰ Зміст</button>'
               '<button id="phone-mode" type="button" aria-label="Керування презентацією з телефона">📱 Пульт</button>'
               '<button id="fs-btn" type="button">⛶ На весь екран</button><a id="home-link" href="#" data-lib>← Бібліотека</a></nav>',
               '<nav id="cmenu" aria-label="Меню гутірки"><div class="cm-head"><img src="{{EMBLEM}}" alt=""><div><b id="cm-title"></b><div id="mode-label"></div></div></div>'
               '<button id="menu" type="button">' + IC['list'] + '<span>Зміст</span></button>'
               '<button id="phone-mode" type="button" aria-label="Керування презентацією з телефона">' + IC['phone'] + '<span>Пульт</span></button>'
               '<button id="fs-btn" type="button">' + IC['fs'] + '<span>На весь екран</span></button>'
               '<a id="home-link" href="#" data-lib>' + IC['back'] + '<span>Бібліотека</span></a></nav>')
    # зміст: колір регіону — кружечком, а не смугою збоку
    gscript = rep(gscript, 'style="border-left:5px solid ${r.col}"', 'style="--rc:${r.col}"')
    # вікно пульта
    host_js = rep(host_js, "btn.innerHTML = '📱 Пульт<i class=\"pd-dot\"></i>';", "btn.innerHTML = " + json.dumps(IC['phone'] + '<span>Пульт</span><i class="pd-dot"></i>') + ";")
    host_js = rep(host_js, '<h2 id="pd-ttl">📱 Пульт на телефоні</h2>', '<h2 id="pd-ttl"><img src="{{EMBLEM}}" alt="">Пульт на телефоні</h2>')
    host_js = rep(host_js, "'<span>📱 Телефон «<b></b>» просить доступ до пульта.", "'<span>Телефон «<b></b>» просить доступ до пульта.")
    # картинки
    import base64
    def data_uri(path, mime='image/png'):
        return 'data:' + mime + ';base64,' + base64.b64encode(open(path, 'rb').read()).decode()
    IMG = {'{{LOGO}}': data_uri(D + 'img/logo.png'), '{{EMBLEM}}': data_uri(D + 'img/emblem.webp', 'image/webp'), '{{EMBLEM_QR}}': data_uri(D + 'img/emblem-qr.webp', 'image/webp'),
           '{{KERAMIKA_MAP}}': data_uri(D + 'img/keramika-map.webp', 'image/webp'), '{{LA_ART}}': data_uri(D + 'img/budova-la-1.webp', 'image/webp'), '{{K1_ART}}': data_uri(D + 'img/keramika-1.webp', 'image/webp')}
    def imgs(t):
        for k, v in IMG.items():
            t = t.replace(k, v)
        assert '{{LOGO}}' not in t and '{{EMBLEM}}' not in t and '{{KERAMIKA_MAP}}' not in t and '{{LA_ART}}' not in t and '{{K1_ART}}' not in t
        return t
    shell_html, shell_js, shell_css, body, host_js = map(imgs, (shell_html, shell_js, shell_css, body, host_js))
    font = font.replace('Source+Sans+3:wght@400;600', 'Source+Sans+3:wght@400;600;700')
    # значок вкладки: емблема Пласту
    def _png(f): return 'data:image/png;base64,' + base64.b64encode(open(D + 'img/' + f, 'rb').read()).decode()
    head_extra = ('<link rel="icon" type="image/png" sizes="16x16" href="' + _png('fav-16.png') + '">\n'
                  '<link rel="icon" type="image/png" sizes="32x32" href="' + _png('fav-32.png') + '">\n'
                  '<link rel="icon" type="image/png" sizes="48x48" href="' + _png('fav-48.png') + '">\n'
                  '<link rel="apple-touch-icon" href="' + _png('fav-180.png') + '">\n')
    if os.environ.get('PREVIEW'):
        shell_js = 'window.GUTIRKA_PREVIEW = true;\n' + shell_js
    if os.environ.get('HOME_URL'):   # копія для макета: «Бібліотека» веде на HOME_URL з підписом HOME_LABEL
        shell_js = ('window.GUTIRKA_HOME = ' + json.dumps({'href': os.environ['HOME_URL'], 'label': os.environ.get('HOME_LABEL', 'Назад')}, ensure_ascii=False) + ';\n'
                    "document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('#home-link, .back-home').forEach(a => {"
                    " const w = document.createTreeWalker(a, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) n.nodeValue = n.nodeValue.replace(/[Бб]ібліотек[аи]( гутірок)?/, window.GUTIRKA_HOME.label); }));\n" + shell_js)
qr = open(D + 'qr.js', encoding='utf8').read()
tema_css = tema_js = ''
for _n in filter(None, os.environ.get('TEMA', '').split('+')):   # стилі для порівняння: TEMA=mandrivka або mandrivka+dyzain
    _t = os.path.join(HERE, 'gutirky', 'keramika', 'tema-' + _n)
    if os.path.exists(_t + '.css'): tema_css += open(_t + '.css', encoding='utf8').read() + '\n'
    if os.path.exists(_t + '.js'): tema_js += '<script>\n' + re.sub(r'\{\{K:([a-z0-9]+)\}\}', lambda m: 'data:image/webp;base64,' + _b64.b64encode(open(os.path.join(HERE, 'gutirky', 'keramika-1', 'kartynky', m.group(1) + '.webp'), 'rb').read()).decode(), open(_t + '.js', encoding='utf8').read()) + '</script>\n'
    if os.path.exists(_t + '.json'):   # {"zamina": [[старе, нове], ...] у коді гутірки, "shryfty": "family=...&family=..."}
        _j = json.load(open(_t + '.json', encoding='utf8'))
        for _a, _b in _j.get('zamina', []):
            assert _a in gscript, _a
            gscript = gscript.replace(_a, _b)
        if _j.get('shryfty'):
            font = font.replace('family=', _j['shryfty'] + '&family=', 1)
skel_css = ':root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}'
page = ('<!DOCTYPE html>\n<html lang="uk">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<meta name="theme-color" content="#181a1d">\n<title>Бібліотека гутірок</title>\n'
        + head_extra + font + '\n<style>\n' + skel_css + '\n' + css + '\n' + shell_css + '\n' + tema_css + '\n</style>\n</head>\n<body>\n'
        + shell_html + '\n<div id="gv" hidden>' + body + '</div>\n'
        + '<script>\n' + gscript + '</script>\n' + tema_js
        + '<script>\n' + qr + '\n</script>\n'
        + '<script>window.GUTIRKA_PULT_URL = ' + json.dumps(PULT_URL) + ';</script>\n'
        + '<script>\n' + host_js + '\n</script>\n'
        + '<script>\n' + shell_js + '</script>\n</body>\n</html>\n')
if os.environ.get('NOINDEX', '1') != '0':   # сайт прихований від пошуковиків
    vp = '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    page = page.replace(vp, vp + '<meta name="robots" content="noindex, nofollow">\n', 1)
open(OUT, 'w', encoding='utf8').write(page)
print(OUT, len(page.encode('utf8')), 'байт')
