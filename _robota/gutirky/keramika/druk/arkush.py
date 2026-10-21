import json, re, sys
SRC = '/home/claude/gutirky-fi.github.io/_robota/gutirky/keramika/index.html'
OUT = sys.argv[1]
s = open(SRC, encoding='utf8').read()
dec = json.JSONDecoder()
OB, _ = dec.raw_decode(s[s.find('OB=') + 3:])
PH, _ = dec.raw_decode(s[s.find('const PH=') + 9:])
RLP, _ = dec.raw_decode(s[s.find('const RLP=') + 10:])
names = re.findall(r'\{n:"([^"]+)",c:"[^"]*",col:"([^"]+)"', s)[:9]

paths = ''.join(f'<path d="{o[2]}" fill="{names[o[1]][1]}" fill-opacity=".28" stroke="#fff" stroke-width=".8"/>' for o in OB if o[2])
border = ''.join(f'<path d="{o[2]}" fill="none" stroke="#9aa3ad" stroke-width=".35"/>' for o in OB if o[2])
nums = ''.join(f'<circle cx="{x}" cy="{y-3}" r="12" fill="#fff" stroke="{names[i][1]}" stroke-width="2"/><text x="{x}" y="{y+2}" text-anchor="middle" font-size="14" font-weight="700" fill="#222">{i+1}</text>' for i, (x, y) in enumerate(RLP))
mapsvg = f'<svg viewBox="0 0 612.5 408" class="map">{paths}{border}{nums}</svg>'
legend = ''.join(f'<li><b style="border-color:{c}">{i+1}</b>{n}</li>' for i, (n, c) in enumerate(names))

ITEMS = [('1-0', 'Кахля з півнем'), ('6-1', 'Посудина-«бублик»'), ('4-0', 'Горщик зі спіралями'),
         ('2-0', 'Чорний глек'), ('3-3', 'Глечик на білому тлі'), ('8-0', 'Висока посудина з гострим дном')]
cards = ''.join(f'<div class="card"><div class="ph"><img src="{PH[k]}" alt=""></div><div class="cap">{i+1}. {t}</div><div class="ans">Край № <span></span></div></div>' for i, (k, t) in enumerate(ITEMS))

html = f'''<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Аркуш учасника</title>
<style>
@page{{size:A4;margin:10mm 12mm}}
*{{box-sizing:border-box}}body{{margin:0;font-family:'DejaVu Sans','Source Sans 3',Arial,sans-serif;color:#1d2125;font-size:10.5pt}}
.top{{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2.5px solid #1f6b44;padding-bottom:5px;margin-bottom:8px}}
h1{{margin:0;font-size:16pt;letter-spacing:.01em}}.sub{{color:#555;font-size:9.5pt}}
.kind{{font-size:10pt;font-weight:700;color:#1f6b44;margin-bottom:1px}}
h2{{font-size:11pt;margin:7px 0 4px;color:#1f6b44}}h2 b{{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#1f6b44;color:#fff;font-size:10pt;margin-right:6px}}
.mapwrap{{display:grid;grid-template-columns:1fr 52mm;gap:4mm;align-items:center}}.map{{width:100%;height:59mm}}
ul.leg{{list-style:none;margin:0;padding:0;font-size:9.6pt;line-height:1.55}}ul.leg b{{display:inline-grid;place-items:center;width:17px;height:17px;border:2px solid;border-radius:50%;font-size:8.5pt;margin-right:5px}}
.grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}}
.card{{border:1px solid #cfd5dc;border-radius:3mm;padding:2.5mm;text-align:center}}
.ph{{height:29mm;display:flex;align-items:center;justify-content:center;background:#f3f1ec;border-radius:2mm}}.ph img{{max-height:27mm;max-width:100%;object-fit:contain}}
.cap{{font-size:9pt;margin:1.5mm 0 1mm;min-height:2.3em}}.ans{{font-weight:700}}.ans span{{display:inline-block;width:14mm;border-bottom:1.5px solid #333}}
table{{width:100%;border-collapse:collapse;font-size:10pt}}td,th{{border:1px solid #cfd5dc;padding:1.6mm;text-align:center}}th{{background:#eef4f0}}td:first-child{{text-align:left;font-weight:600}}
.box{{display:inline-block;width:3.6mm;height:3.6mm;border:1.4px solid #333;border-radius:.6mm;vertical-align:-.6mm;margin-right:1.5mm}}
.line{{border-bottom:1px solid #333;height:7mm}}
.foot{{margin-top:6px;color:#777;font-size:8pt;text-align:right}}
.pb{{break-after:page}}
.gl{{columns:2;column-gap:8mm;margin-top:4mm}}.gl p{{margin:0 0 5mm;break-inside:avoid;font-size:12.5pt;line-height:1.45}}.gl b{{color:#1f6b44}}
</style></head><body>
<div class="top"><div><div class="kind">Аркуш учасника</div><h1>Кераміка України</h1><div class="sub">Подорож Україною за керамікою</div></div></div>
<h2><b>1</b>Дев'ять країв України</h2>
<div class="mapwrap">{mapsvg}<ul class="leg">{legend}</ul></div>
<h2><b>2</b>Звідки цей виріб? Під час подорожі впиши номер краю з карти</h2>
<div class="grid">{cards}</div>
<h2><b>3</b>Крапля води: що станеться? Познач до досліду, а потім перевір</h2>
<table><tr><th></th><th>вбирається</th><th>крапля лежить зверху</th><th>скочується</th></tr>
<tr><td>Вазон без глазурі</td><td><span class="box"></span></td><td><span class="box"></span></td><td><span class="box"></span></td></tr>
<tr><td>Печатка (випал 1250°)</td><td><span class="box"></span></td><td><span class="box"></span></td><td><span class="box"></span></td></tr>
<tr><td>Піала з глазур'ю</td><td><span class="box"></span></td><td><span class="box"></span></td><td><span class="box"></span></td></tr></table>
<h2><b>4</b>Яка кераміка сподобалася найбільше? Звідки вона і чому?</h2>
<div class="line"></div><div class="line"></div>
<h2><b>5</b>Одна річ, яку я сьогодні запам'ятав(-ла)</h2>
<div class="line"></div>
<div class="foot">Пласт у Фінляндії</div>
<div class="pb"></div>
<div class="top"><div><div class="kind">Аркуш учасника · сторінка 2</div><h1>Словничок гончаря</h1><div class="sub">Слова з гутірки «Кераміка України» — щоб не загубитися</div></div></div>
<div class="gl"><p><b>Глина</b> — природний матеріал: з водою — м'яка й пластична, після випалу — тверда.</p><p><b>Кераміка</b> — вироби з глини, обпалені в печі.</p><p><b>Черепок</b> — обпалена глина, з якої складається виріб; також уламок посуду.</p><p><b>Шлікер</b> — рідка глиняна маса, як кефір; її заливають у гіпсову форму.</p><p><b>Гіпсова форма</b> — форма з гіпсу: вбирає воду зі шлікеру; для лиття однакових виробів.</p><p><b>Гончарний круг</b> — круг, що обертається; на ньому посуд «точать» руками.</p><p><b>Випал</b> — нагрівання виробу в печі (≈ 900–1250 °C); після нього глина тверда, як камінь.</p><p><b>Бісквіт</b> — виріб після першого випалу, без глазурі: матовий і пористий.</p><p><b>Ангоб</b> — рідка кольорова глина для розпису.</p><p><b>Ріжок</b> — посудинка з трубочкою (колись — коров'ячий ріг), якою малюють ангобом тонкі лінії.</p><p><b>Ритування</b> — лінії, процарапані шилом крізь ангоб.</p><p><b>Полива</b> — склоподібне покриття на народній кераміці; дає блиск і не пропускає воду.</p><p><b>Глазур</b> — те саме, що полива: мелений кварц із водою, у печі плавиться в скло.</p><p><b>Лощіння</b> — полірування виробу камінцем до випалу; блиск без поливи.</p><p><b>Димлення</b> — наприкінці випалу піч закривають — дим робить глину чорною.</p><p><b>Молочення</b> — гарячий після випалу виріб занурюють у молоко — він коричневіє й міцнішає.</p><p><b>Кахля</b> — керамічна плитка для печі або стіни.</p><p><b>Куманець</b> — посудина-«бублик» з горлечком для води, вина чи олії.</p><p><b>Макітра</b> — широка глиняна миска, у якій розтирають мак.</p><p><b>Амфора</b> — висока посудина з гострим дном для вина й олії (давні греки).</p></div>
<div class="foot">Пласт у Фінляндії</div>
</body></html>'''
open(OUT, 'w', encoding='utf8').write(html)
print('ok')
