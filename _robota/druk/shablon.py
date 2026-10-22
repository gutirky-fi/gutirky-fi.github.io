"""Спільний шаблон друкованих матеріалів бібліотеки гутірок (А4, світлий папір).

Однаково для всіх гутірок: шрифти (Oswald — заголовки, Source Sans 3 — текст), шапка
(вид матеріалу · назва гутірки · підзаголовок · лілея), підвал «Пласт у Фінляндії».
Від гутірки — лише колір (ACC) і світлий відтінок (TINT).

    from shablon import Doc
    d = Doc(gutirka='Кераміка України', acc='#b0532a', tint='#f7e9df')
    d.page(kind='Аркуш учасника', title='Кераміка України', sub='…', body='<…>', who='uch')
    d.pdf('/шлях/файл.pdf')

who: 'uch' — для учасника, 'vd' — для ведучого, 'ved' — лише для ведучого (є відповіді), None — без помітки.
"""
import base64, os, html as H

D = os.path.dirname(os.path.abspath(__file__))
_b64 = lambda p: base64.b64encode(open(p, 'rb').read()).decode()
LILY = 'data:image/png;base64,' + _b64(os.path.join(D, 'lileya.png'))
FONT_URL = lambda n: 'file://' + os.path.join(D, 'shryfty', n)

CSS = '''
@font-face{font-family:"SS3";src:url("%(ss)s") format("truetype");font-weight:200 900}
@font-face{font-family:"Osw";src:url("%(os)s") format("truetype");font-weight:200 700}
@page{size:A4;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:"SS3","Source Sans 3",sans-serif;color:var(--ink);font-size:10.5pt;line-height:1.38;-webkit-print-color-adjust:exact;print-color-adjust:exact}
:root{--ink:#1d2125;--mut:#5f6873;--ln:#cfd5dc;--soft:#f3f4f6;--acc:%(acc)s;--tint:%(tint)s}
.page{width:210mm;height:297mm;padding:11mm 13mm 9mm;display:flex;flex-direction:column;overflow:hidden;break-after:page;position:relative}
.page:last-child{break-after:auto}
.page>*{flex-shrink:0}
.hd{display:flex;align-items:flex-end;gap:6mm;padding-bottom:3mm;border-bottom:2.2pt solid var(--acc);margin-bottom:4.5mm}
.hl{flex:1;min-width:0}
.kind{display:flex;align-items:center;gap:7px;font-weight:700;font-size:10.5pt;color:var(--acc)}
.for{font-weight:700;font-size:8pt;padding:.4mm 2.4mm;border-radius:99px;border:1pt solid currentColor}
.for.ved{color:#8a5a00;background:#fff3cf;border-color:#e0b04a}
.for.uch{color:var(--mut);border-color:var(--ln)}
h1{margin:.6mm 0 0;font:600 24pt/1.02 "Osw","Oswald",sans-serif;letter-spacing:.01em;text-transform:uppercase}
.sub{margin-top:1mm;color:var(--mut);font-size:10.5pt}
.lily{height:17mm;width:auto;flex:none;margin-bottom:.5mm}
h2{display:flex;align-items:center;gap:2.4mm;margin:4mm 0 2.2mm;font:600 12.5pt/1.15 "Osw","Oswald",sans-serif;letter-spacing:.015em;text-transform:uppercase;color:var(--ink)}
h2 b{flex:none;min-width:4.2mm;color:var(--acc);font:600 12.5pt "Osw",sans-serif}
h2 small{font:600 9.5pt "SS3",sans-serif;text-transform:none;letter-spacing:0;color:var(--mut)}
.page>h2:first-of-type,.hd+h2{margin-top:0}
p{margin:0 0 2mm}
ul{margin:0 0 2mm;padding-left:5mm}li{margin:.6mm 0}
table{width:100%%;border-collapse:collapse}
th,td{border:.6pt solid var(--ln);padding:1.5mm 2mm;text-align:left;vertical-align:top}
th{background:var(--tint);font-weight:700;font-size:9.5pt}
.ft{margin-top:auto;padding-top:3mm;display:flex;justify-content:space-between;gap:4mm;color:var(--mut);font-size:8.5pt;border-top:.6pt solid var(--ln)}
.ft b{color:var(--ink);font-weight:600}
.box{border:.7pt solid var(--ln);border-radius:2.5mm;padding:2.6mm 3.2mm}
.note{background:var(--tint);border-radius:2.5mm;padding:2.6mm 3.2mm}
.mut{color:var(--mut)}
'''


class Doc:
    def __init__(self, gutirka, acc, tint, extra_css=''):
        self.g, self.acc, self.tint, self.extra, self.pages = gutirka, acc, tint, extra_css, []

    def page(self, kind, title, sub, body, who=None, foot=None):
        self.pages.append((kind, title, sub, body, who, foot))

    def html(self):
        n = len(self.pages)
        out = []
        for i, (kind, title, sub, body, who, foot) in enumerate(self.pages):
            tag = {'uch': '<span class="for uch">для учасника</span>', 'ved': '<span class="for ved">лише для ведучого</span>', 'vd': '<span class="for uch">для ведучого</span>'}.get(who, '')
            right = foot or f'{H.escape(self.g)} · {H.escape(kind)}' + (f' · {i + 1} / {n}' if n > 1 else '')
            out.append(f'''<section class="page"><header class="hd"><div class="hl"><div class="kind">{H.escape(kind)}{tag}</div><h1>{H.escape(title)}</h1>{f'<div class="sub">{sub}</div>' if sub else ''}</div><img class="lily" src="{LILY}" alt="Пластова лілея"></header>
{body}
<footer class="ft"><span><b>Пласт у Фінляндії</b> · бібліотека гутірок</span><span>{right}</span></footer></section>''')
        css = CSS % {'ss': FONT_URL('SourceSans3.ttf'), 'os': FONT_URL('Oswald.ttf'), 'acc': self.acc, 'tint': self.tint}
        return f'<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>{H.escape(self.g)}</title><style>{css}{self.extra}</style></head><body>{"".join(out)}</body></html>'

    def pdf(self, path, png=None):
        """Записує PDF (Chromium). png — тека для знімків сторінок (за потреби)."""
        from playwright.sync_api import sync_playwright
        tmp = path[:-4] + '.html'
        open(tmp, 'w', encoding='utf8').write(self.html())
        with sync_playwright() as p:
            b = p.chromium.launch(); pg = b.new_page()
            pg.goto('file://' + os.path.abspath(tmp)); pg.wait_for_timeout(600)
            pg.evaluate('document.fonts.ready')
            pg.pdf(path=path, prefer_css_page_size=True, print_background=True)
            b.close()
        os.remove(tmp)
        return path
