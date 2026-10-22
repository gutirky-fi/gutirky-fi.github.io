"""Плани гутірок «Кераміка І» і «Будова ЛА І» у спільному паперовому стилі (дизайн 3).

    python3 _robota/druk/plany.py          # після zibraty.py цих гутірок (бере зібрану сторінку з сайту)

Зміст береться з розділу «План гутірки» зібраної сторінки (gutirky/<назва>/index.html#plan),
тож PDF завжди збігається з тим, що бачить виховник на сайті. Результат — gutirky/<назва>/plan-hutirky.pdf.
"""
import html as H, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shablon import Doc

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
G = {   # назва в теці: (назва, підзаголовок, колір, відтінок)
    'keramika-1': ('Кераміка І', 'Мистецька вмілість · проба 1 · близько 45 хв', '#8f4f25', '#f5e8de'),
    'budova-la-1': ('Будова літальних апаратів І', 'Летунська вмілість · проба 1 · близько 40–45 хв', '#2f6fb3', '#e3eef9'),
}

JS = r'''() => {
  if (typeof renderPlan === 'function') renderPlan();
  const box = document.querySelector('#plan-box'), out = {mats: [], secs: []};
  let cur = null;
  for (const el of box.children) {
    if (el.matches('.mat')) out.mats.push({h: el.querySelector('b').textContent.trim(), li: [...el.querySelectorAll('li')].map(x => x.innerHTML)});
    else if (el.tagName === 'H2') { const sm = el.querySelector('small'); cur = {h: el.childNodes[0].textContent.trim(), t: sm ? sm.textContent.trim() : '', p: '', rows: []}; out.secs.push(cur); }
    else if (el.tagName === 'P' && cur) cur.p = el.innerHTML;
    else if (el.matches('.row') && cur) { const t = el.querySelector('.t'), sm = t.querySelector('small');
      cur.rows.push({t: t.childNodes[0].textContent.trim(), tag: sm ? sm.textContent.trim() : '', s: el.querySelector('.s').innerHTML}); }
  }
  return out;
}'''

CSS = """
.page h2{margin:4.5mm 0 1.6mm;break-after:avoid}.page h2 small{margin-left:1mm}
.note{margin-bottom:1mm}
.bar{display:flex;gap:.6mm;height:9mm;border-radius:1.6mm;overflow:hidden;margin-top:1mm}
.sg{display:flex;align-items:center;justify-content:center;gap:1.2mm;background:var(--tint);font-size:8.3pt;font-weight:600;white-space:nowrap;overflow:hidden;min-width:0;padding:0 1mm}
.sg:nth-child(odd){filter:brightness(.94)}.sg b{color:var(--acc);font:600 9pt "Osw",sans-serif;flex:none}
.ticks{position:relative;height:4mm;margin-top:.6mm;font-size:7.5pt;color:var(--mut)}.ticks span{position:absolute;transform:translateX(-50%);white-space:nowrap}.ticks span:first-child{transform:none}.ticks span:last-child{transform:translateX(-100%)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:3mm;align-items:start}.box h2{margin:0 0 1.4mm!important;font-size:11pt}
ul.chk{list-style:none;padding:0;margin:0}ul.chk li{display:flex;gap:2mm;align-items:baseline;margin:.8mm 0;font-size:9.6pt;line-height:1.3}
.cb{flex:none;display:inline-block;width:3.4mm;height:3.4mm;border:1.1pt solid var(--ink);border-radius:.7mm;transform:translateY(.5mm)}
.box ul.how{margin:0;padding-left:4.5mm;font-size:9.6pt}.box ul.how li{margin:.6mm 0}
.sec{break-inside:auto}
.req{margin:0 0 1.6mm;color:var(--mut);font-size:9.8pt}
.rw{display:grid;grid-template-columns:44mm 1fr;gap:0 4mm;padding:1.5mm 0;border-top:.6pt solid var(--ln);break-inside:avoid;font-size:9.8pt;line-height:1.34}
.rw .t{font-weight:700}.rw .t small{display:block;font-weight:600;color:var(--mut);font-size:8.3pt}
.rw.chk{background:var(--tint);padding-left:2mm;padding-right:2mm;border-radius:1.5mm;border-top:0;margin:1mm 0}
.rw em{font-style:normal;font-weight:700;color:var(--acc)}
"""


def build(key):
    title, sub, acc, tint = G[key]
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        pg.goto('file://' + os.path.join(ROOT, 'gutirky', key, 'index.html') + '#plan'); pg.wait_for_function("document.querySelectorAll('#plan-box .row').length > 5", timeout=15000)
        data = pg.evaluate(JS); b.close()
    secs = data['secs']
    mins = [float(re.sub(r'[^\d.,]', '', s['t']).replace(',', '.') or 0) for s in secs]
    total = sum(mins) or 1
    bar = ''.join(f'<div class="sg" style="flex:{m}"><b>{k + 1}</b>' + (f'<span>{H.escape(s["h"])}</span>' if m / total > .1 else '') + '</div>' for k, (s, m) in enumerate(zip(secs, mins)))
    tk = [0] + [n for n in range(10, int(total), 10)] + [int(round(total))]
    ticks = '<div class="ticks">' + ''.join(f'<span style="left:{n / total * 100:.2f}%">{n} хв</span>' for n in tk) + '</div>'
    mats = data['mats']
    prep = next((m for m in mats if 'підготувати' in m['h'].lower()), mats[0])
    how = next((m for m in mats if m is not prep), None)
    chk = ''.join(f'<li><span class="cb"></span><span>{x}</span></li>' for x in prep['li'])
    body = (f'<div class="note"><b>Для кого:</b> юнацтво 12–17 років · {len(secs)} частин: початок, вимоги, підсумок · разом ≈ <b>{int(round(total))} хв</b></div>'
            f'<h2>{int(round(total))} хвилин одним поглядом</h2><div class="bar">{bar}</div>{ticks}'
            f'<div class="two"><div class="box"><h2>{H.escape(prep["h"])} — чек-лист</h2><ul class="chk">{chk}</ul></div>'
            + (f'<div class="box"><h2>{H.escape(how["h"])}</h2><ul class="how">{"".join(f"<li>{x}</li>" for x in how["li"])}</ul></div>' if how else '') + '</div>')
    for k, s in enumerate(secs):
        rows = ''.join(f'<div class="rw{" chk" if r["t"].startswith("Перевірка") else ""}"><div class="t">{"❓ " if r["t"].startswith("Перевірка") else ""}{H.escape(r["t"])}'
                       + (f'<small>{H.escape(r["tag"])}</small>' if r['tag'] else '') + f'</div><div>{r["s"]}</div></div>' for r in s['rows'])
        body += (f'<div class="sec"><h2><b>{k + 1}</b>{H.escape(s["h"])} <small>{H.escape(s["t"])}</small></h2>'
                 + (f'<p class="req">{s["p"]}</p>' if s['p'] else '') + rows + '</div>')
    d = Doc(title, acc, tint, CSS)
    d.flow('План гутірки', title, sub, body, who='vd')
    out = os.path.join(ROOT, 'gutirky', key, 'plan-hutirky.pdf')
    d.pdf(out)
    return out


if __name__ == '__main__':
    for k in (sys.argv[1:] or G):
        print(build(k))
