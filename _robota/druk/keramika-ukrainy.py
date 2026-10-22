"""Друковані матеріали «Кераміка України» (вишкіл, до 20 хв) у спільному шаблоні.

    python3 _robota/druk/keramika-ukrainy.py <тека>

Створює: plan-vyshkil-20.pdf, arkush-uchasnyka.pdf, shpargalka-veduchomu.pdf, tablychky-doslid.pdf.
Фото й карта — з рушія гутірки (_robota/gutirky/keramika/index.html).
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shablon import Doc

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(OUT, exist_ok=True)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = open(os.path.join(ROOT, '_robota/gutirky/keramika/index.html'), encoding='utf8').read()
dec = json.JSONDecoder()
OB, _ = dec.raw_decode(SRC[SRC.find('OB=') + 3:])
PH, _ = dec.raw_decode(SRC[SRC.find('const PH=') + 9:])
RLP, _ = dec.raw_decode(SRC[SRC.find('const RLP=') + 10:])
NAMES = re.findall(r'\{n:"([^"]+)",c:"[^"]*",col:"([^"]+)"', SRC)[:9]

G = 'Кераміка України'
ACC, TINT = '#b0532a', '#f7e9df'   # теракота — колір цієї гутірки на папері
SUB = 'Подорож Україною за керамікою · вишкіл, до 20 хв'


def doc(extra=''):
    return Doc(G, ACC, TINT, extra)


# ---------------------------------------------------------------- аркуш учасника
def arkush():
    paths = ''.join(f'<path d="{o[2]}" fill="{NAMES[o[1]][1]}" fill-opacity=".28" stroke="#fff" stroke-width=".8"/>' for o in OB if o[2])
    border = ''.join(f'<path d="{o[2]}" fill="none" stroke="#9aa3ad" stroke-width=".35"/>' for o in OB if o[2])
    nums = ''.join(f'<circle cx="{x}" cy="{y - 3}" r="12" fill="#fff" stroke="{NAMES[i][1]}" stroke-width="2.4"/><text x="{x}" y="{y + 2.2}" text-anchor="middle" font-size="14.5" font-weight="700" font-family="SS3" fill="#1d2125">{i + 1}</text>' for i, (x, y) in enumerate(RLP))
    mapsvg = f'<svg viewBox="0 0 612.5 408" class="map">{paths}{border}{nums}</svg>'
    legend = ''.join(f'<li><b style="border-color:{c}">{i + 1}</b>{n}</li>' for i, (n, c) in enumerate(NAMES))
    items = [('1-0', 'Кахля з півнем'), ('6-1', 'Посудина-«бублик»'), ('4-0', 'Горщик зі спіралями'),
             ('2-0', 'Чорний глек'), ('3-3', 'Глечик на білому тлі'), ('8-0', 'Висока посудина з гострим дном')]
    cards = ''.join(f'<div class="card"><div class="ph"><img src="{PH[k]}" alt=""></div><div class="cap">{i + 1}. {t}</div><div class="ans">Край № <span></span></div></div>' for i, (k, t) in enumerate(items))
    box = '<span class="cb"></span>'
    p1 = f'''<h2><b>1</b>Дев'ять країв України</h2>
<div class="mapwrap">{mapsvg}<ul class="leg">{legend}</ul></div>
<h2><b>2</b>Звідки цей виріб? <small>Під час подорожі впиши номер краю з карти</small></h2>
<div class="grid">{cards}</div>
<h2><b>3</b>Крапля води: що станеться? <small>Познач до досліду, а потім перевір</small></h2>
<table class="drop"><tr><th></th><th>вбирається</th><th>крапля лежить зверху</th><th>скочується</th></tr>
<tr><td>Вазон без глазурі</td><td>{box}</td><td>{box}</td><td>{box}</td></tr>
<tr><td>Печатка (випал 1250°)</td><td>{box}</td><td>{box}</td><td>{box}</td></tr>
<tr><td>Піала з глазур'ю</td><td>{box}</td><td>{box}</td><td>{box}</td></tr></table>
<h2><b>4</b>Яка кераміка сподобалася найбільше? <small>Звідки вона і чому?</small></h2>
<div class="line"></div><div class="line"></div>
<h2><b>5</b>Одна річ, яку я сьогодні запам'ятав(-ла)</h2>
<div class="line"></div>'''
    GL = [('Глина', 'природний матеріал: з водою — м\'яка й пластична, після випалу — тверда.'), ('Кераміка', 'вироби з глини, обпалені в печі.'),
          ('Черепок', 'обпалена глина, з якої складається виріб; також уламок посуду.'), ('Шлікер', 'рідка глиняна маса, як кефір; її заливають у гіпсову форму.'),
          ('Гіпсова форма', 'форма з гіпсу: вбирає воду зі шлікеру; для лиття однакових виробів.'), ('Гончарний круг', 'круг, що обертається; на ньому посуд «точать» руками.'),
          ('Випал', 'нагрівання виробу в печі (≈ 900–1250 °C); після нього глина тверда, як камінь.'), ('Бісквіт', 'виріб після першого випалу, без глазурі: матовий і пористий.'),
          ('Ангоб', 'рідка кольорова глина для розпису.'), ('Ріжок', 'посудинка з трубочкою (колись — коров\'ячий ріг), якою малюють ангобом тонкі лінії.'),
          ('Ритування', 'лінії, процарапані шилом крізь ангоб.'), ('Полива', 'склоподібне покриття на народній кераміці; дає блиск і не пропускає воду.'),
          ('Глазур', 'те саме, що полива: мелений кварц із водою, у печі плавиться в скло.'), ('Лощіння', 'полірування виробу камінцем до випалу; блиск без поливи.'),
          ('Димлення', 'наприкінці випалу піч закривають — дим робить глину чорною.'), ('Молочення', 'гарячий після випалу виріб занурюють у молоко — він коричневіє й міцнішає.'),
          ('Кахля', 'керамічна плитка для печі або стіни.'), ('Куманець', 'посудина-«бублик» з горлечком для води, вина чи олії.'),
          ('Макітра', 'широка глиняна миска, у якій розтирають мак.'), ('Амфора', 'висока посудина з гострим дном для вина й олії (давні греки).')]
    GR = [('Глина і вогонь', ['Глина', 'Кераміка', 'Черепок', 'Випал', 'Бісквіт']),
          ('Як надають форму', ['Шлікер', 'Гіпсова форма', 'Гончарний круг']),
          ('Як прикрашають', ['Ангоб', 'Ріжок', 'Ритування', 'Полива', 'Глазур', 'Лощіння', 'Димлення', 'Молочення']),
          ('Вироби', ['Кахля', 'Куманець', 'Макітра', 'Амфора'])]
    gd = dict(GL)
    assert sorted(w for _, ws in GR for w in ws) == sorted(gd)
    p2 = '<p class="mut gi">Слова зібрано за темами. Шукай заголовок теми — а під ним слово.</p><div class="gl">' + ''.join(
        f'<div class="gg"><h3>{t}</h3>' + ''.join(f'<p><b>{w}</b> — {gd[w]}</p>' for w in ws) + '</div>' for t, ws in GR) + '</div>'
    css = '''
.mapwrap{display:grid;grid-template-columns:1fr 56mm;gap:4mm;align-items:center}.map{width:100%;height:47mm}
ul.leg{list-style:none;margin:0;padding:0;font-size:9.6pt;line-height:1.48}ul.leg b{display:inline-grid;place-items:center;width:4.6mm;height:4.6mm;border:1.6pt solid;border-radius:50%;font-size:8.5pt;margin-right:2mm}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3.5mm}
.card{border:.7pt solid var(--ln);border-radius:2.5mm;padding:2.2mm;text-align:center}
.ph{height:21mm;display:flex;align-items:center;justify-content:center;background:#f3f1ec;border-radius:1.6mm}.ph img{max-height:19.5mm;max-width:100%;object-fit:contain}
.cap{font-size:9.5pt;margin:1.2mm 0 .6mm;line-height:1.2}.ans{font-weight:700}.ans span{display:inline-block;width:14mm;border-bottom:1.2pt solid var(--ink)}
table.drop td,table.drop th{text-align:center;font-size:10pt;padding:1.1mm 2mm}
.page h2{margin:3.4mm 0 2mm}table.drop td:first-child{text-align:left;font-weight:600}
.cb{display:inline-block;width:4mm;height:4mm;border:1.2pt solid var(--ink);border-radius:.8mm;vertical-align:-.8mm}
.line{border-bottom:.8pt solid var(--ink);height:8mm}
.gi{margin:0 0 3mm}.gl{columns:2;column-gap:9mm}.gg{break-inside:avoid;margin-bottom:5mm}.gg h3{margin:0 0 2mm;padding-bottom:1mm;border-bottom:1.4pt solid var(--acc);font:600 13pt 'Osw',sans-serif;text-transform:uppercase;letter-spacing:.02em}.gl p{margin:0 0 2.6mm;break-inside:avoid;font-size:11.5pt;line-height:1.38}.gl b{color:var(--acc)}
'''
    d = doc(css)
    d.page('Аркуш учасника', G, 'Подорож Україною за керамікою', p1, who='uch')
    d.page('Аркуш учасника', 'Словничок гончаря', 'Слова з гутірки «Кераміка України» — щоб не загубитися', p2, who='uch')
    return d.pdf(os.path.join(OUT, 'arkush-uchasnyka.pdf'))


# ---------------------------------------------------------------- шпаргалка ведучому
# частини гутірки: (назва, з, до, [(№ слайда, назва, закінчити до, позначка ⭐/⚡, дія ✋, запитання ❓, що сказати)])
PARTS = [
    ('Вступ і майстерня', '0:00', '9:00', [
        ('1', 'Титул', '0:30', '', '', 'Хто ліпив з глини?', 'Привітатись. Тема: подорож Україною за керамікою'),
        ('2', 'Що таке кераміка', '2:00', '', '', 'Що у вас удома з глини?', 'глина + вогонь · після випалу не розмокає'),
        ('3', 'Гіпсова форма', '4:30', '', 'показати форму й піалу', 'Чому форму роблять з гіпсу?', 'гіпс тягне воду · біля стінок наростає шар глини · виріб зменшується й виходить'),
        ('4', 'Крапля: три зразки', '7:00', '', 'капнути воду на кожен зразок', 'Що буде з краплею?', 'вазон — вбирає (пористий) · печатка 1250° — не вбирає · піала — скочується (глазур = скло)'),
        ('5', 'Колись і тепер', '8:00', '', '', 'Як можна зробити глечик?', 'ліплення, круг, гіпсова форма · дрова → газ, електропіч'),
        ('6', 'Запитання до залу', '9:00', '', 'роздати аркуші', 'Яку кераміку знаєте? З якого краю?', 'названий край — тикнути на карті')]),
    ('Подорож краями', '9:00', '17:30', [
        ('7', 'Карта 9 країв', '9:30', '', '', '', '9 «почерків»: глина, кольори, візерунки · із заходу на схід і до моря'),
        ('8', 'Закарпаття', '10:00', '⚡', '', '', 'Вільхівка: темне тло, птахи й квіти, «Смерічка»'),
        ('9', 'Гуцульщина', '12:00', '⭐', '', 'Як отримують ці кольори?', 'білий ангоб · ритування · червінь · мідь = зелений, залізо = жовтий · полива · ЮНЕСКО'),
        ('10', 'Галичина', '12:30', '⚡', '', 'Чому глек чорний?', 'дим наприкінці випалу · кахлі Львова й Потелича'),
        ('11', 'Поділля', '13:30', '⭐', '', 'Чим відрізняються Бубнівка й Бар?', "Бубнівка — червоний посуд, «пір'ячко» · Бар — біле тло, Бона Сфорца"),
        ('12', 'Київщина', '14:30', '⭐', '', 'Навіщо посудина з двома «трубами»?', 'Трипілля — понад 5000 років · спіралі'),
        ('13', 'Полісся', '15:00', '⚡', '', '', 'Олешня, Ічня: прості задимлені горщики, лощіння'),
        ('14', 'Полтавщина', '16:30', '⭐', '', 'Хто знає, що таке куманець?', '«бублик» з горлечком · Опішня — гончарна столиця'),
        ('15', 'Слобожанщина', '17:00', '⚡', '', 'Навіщо гарячий глек — у молоко?', 'молочена кераміка: коричнева, міцніша'),
        ('16', "Причорномор'я", '17:30', '⚡', '', 'Чому в амфори гостре дно?', 'амфори Ольвії, Тіри, Херсонеса')]),
    ('Вікторина і кінець', '17:30', '20:00', [
        ('17–21', 'Вікторина, 5 запитань', '19:30', '', 'учасники називають — тикнути край', '', 'мало часу → після 3-го запитання до підсумку'),
        ('22', 'Підсумок', '20:00', '', '', "Що одне ви сьогодні запам'ятали?", 'кожен виріб — «паспорт» свого краю'),
        ('23', 'Бонус: «Потужний СКОБ!»', 'якщо є час', '', '«▶ Почати гру» на пульті', '', 'без телефонів — відповідають уголос, ведучий тикає відповідь')])]

SH_CSS = """
body{font-size:9.4pt}.page{padding-top:9mm}.hd{margin-bottom:2.6mm}h1{font-size:20pt}.lily{height:14mm}
.leg{font-size:8.6pt;color:var(--mut);margin:0 0 2mm;line-height:1.5}.mk{padding:0 1.4mm;border-radius:1mm;color:var(--ink);white-space:nowrap}.mk.m{background:var(--tint)}.mk.s{border:.6pt solid var(--ln)}
table.sh th{font-size:8.6pt;padding:1mm 1.6mm}table.sh td{padding:.75mm 1.6mm;vertical-align:top;line-height:1.22}
td.t{width:17mm;font:600 11pt/1.1 "Osw",sans-serif;text-align:center;white-space:nowrap}
td.n{width:9mm;text-align:center;color:var(--mut);font-size:8.6pt}td.sl{width:34mm;font-weight:700}
tr.m td{background:var(--tint)}tr.s td.sl{font-weight:600}
tr.part td{background:#fff;border-left:0;border-right:0;padding:1.8mm 0 .6mm;border-bottom:1.4pt solid var(--acc)}
tr.part b{font:600 11pt "Osw",sans-serif;text-transform:uppercase;letter-spacing:.02em}tr.part span{margin-left:3mm;color:var(--mut);font-weight:600;font-size:9pt}
.q{font-weight:700}.act{color:var(--acc);font-weight:600}.say{color:#2d3339}
.two{display:grid;grid-template-columns:1fr 1fr;gap:3.5mm;margin-top:3mm}.two h2{font-size:10.5pt;margin:0 0 1.2mm}.two ol{margin:0;padding-left:5mm}.two li{margin:.3mm 0}
.tip{margin:2.6mm 0 0;font-size:9pt}
ol.big{margin:0 0 2mm;padding-left:7mm;font-size:13pt;line-height:1.5}ol.big b{color:var(--acc)}
table.drop2 td{font-size:12.5pt;padding:2.2mm 3mm}table.drop2 td:first-child{width:62mm;font-weight:600}
p.g{font-size:12pt;line-height:1.45}.page h2{margin-top:6mm}
"""


def shpargalka():
    def row(n, t, until, mk, act, q, say):
        cls = 'm' if mk == '⭐' else 's' if mk == '⚡' else ''
        txt = (f'<div class="q">❓ {q}</div>' if q else '') + (f'<div class="act">✋ {act}</div>' if act else '') + f'<div class="say">{say}</div>'
        return f'<tr class="{cls}"><td class="t">{until}</td><td class="n">{n}</td><td class="sl">{mk + " " if mk else ""}{t}</td><td>{txt}</td></tr>'
    body_rows = ''.join(f'<tr class="part"><td colspan="4"><b>{k + 1}. {nm}</b><span>{a} – {b}</span></td></tr>' + ''.join(row(*r) for r in rs) for k, (nm, a, b, rs) in enumerate(PARTS))
    qz = [("Музей-заповідник гончарства", "Полтавщина (Опішня)"), ("Село, за яким названа Трипільська культура", "Київщина"),
          ("Грецькі міста з амфорами", "Причорномор'я"), ("Косівська мальована кераміка", "Гуцульщина"), ("Олешня, задимлені горщики", "Полісся")]
    ark = [("Кахля з півнем", "2 · Гуцульщина"), ("Посудина-«бублик»", "7 · Полтавщина"), ("Горщик зі спіралями", "5 · Київщина"),
           ("Чорний глек", "3 · Галичина"), ("Глечик на білому тлі", "4 · Поділля"), ("Посудина з гострим дном", "9 · Причорномор'я")]
    qz_li = ''.join(f'<li>{q} — <b>{a}</b></li>' for q, a in qz)
    ark_li = ''.join(f'<li>{q} — <b>{a}</b></li>' for q, a in ark)
    body = ('<p class="leg"><b>Закінчити до</b> — час від початку гутірки · <span class="mk m">⭐ головне, можна довше</span> '
            '<span class="mk s">⚡ коротко: фото й одне речення</span> · ❓ запитати · ✋ зробити · № — номер слайда, як на пульті</p>'
            f'<table class="sh"><tr><th>Закінчити до</th><th>№</th><th>Слайд</th><th>Що запитати й сказати</th></tr>{body_rows}</table>'
            '<p class="tip"><b>Пульт не працює?</b> Гортати ← → на ноутбуці, краї відкривати мишкою; ця шпаргалка — замість підказок. Відповіді — на звороті.</p>')
    p2 = (f'<h2><b>1</b>Вікторина на карті <small>слайди 17–21</small></h2><ol class="big">{qz_li}</ol>'
          f'<h2><b>2</b>Аркуш учасника: «Звідки цей виріб?» <small>номер краю з карти</small></h2><ol class="big">{ark_li}</ol>'
          '<h2><b>3</b>Крапля води</h2><table class="drop2"><tr><td>Вазон без глазурі</td><td><b>вбирається</b> — пористий, як губка</td></tr>'
          '<tr><td>Печатка (випал 1250°)</td><td><b>крапля лежить зверху</b> — глина спеклася, щільна</td></tr>'
          "<tr><td>Піала з глазур'ю</td><td><b>скочується</b> — глазур = тонке скло</td></tr></table>"
          '<h2><b>4</b>Гра «Потужний СКОБ!» <small>якщо є час</small></h2><p class="g">6 фото: звідки виріб і що це. Почати — кнопкою на слайді 23 або на пульті. '
          'Без телефонів: учасники відповідають уголос, ви тикаєте відповідь на пульті (там видно ✓ правильну).</p>')
    d = doc(SH_CSS)
    d.page('Шпаргалка ведучому', G, SUB, body, who='ved')
    d.page('Шпаргалка ведучому', 'Відповіді', 'Кераміка України · вишкіл — тримайте під рукою під час вікторини', p2, who='ved')
    return d.pdf(os.path.join(OUT, 'shpargalka-veduchomu.pdf'))


# ---------------------------------------------------------------- план гутірки
# етапи: (з, до, хв, назва, запитання, що робить ведучий, хто залучений, підпис на смужці)
HID = [
    ('0:00', '2:00', 2, 'Вступ: що таке кераміка', 'Що у вас удома зроблено з глини?', 'Кераміка = глина + вогонь; після випалу не розмокає.', 'відповідають усі', 'Вступ'),
    ('2:00', '4:30', 2.5, 'Майстерня 1: гіпсова форма', 'Чому форму роблять саме з гіпсу?', 'Показати форму й піалу, відлиту в ній. Гіпс тягне воду зі шлікеру, біля стінок наростає шар глини.', 'учасник 1 відповідає; форма й піала йдуть по колу', 'Форма'),
    ('4:30', '7:00', 2.5, 'Майстерня 2: крапля води', 'Що станеться з краплею на кожному зразку?', 'Вазон без глазурі — вбирає (пористий); печатка, обпалена при 1250°, — не вбирає (крапля лежить); глазурована піала — крапля скочується (глазур = скло).', 'учасники 2–4 капають на свій зразок', 'Крапля'),
    ('7:00', '8:00', 1, 'Колись і тепер', 'Як можна зробити глечик?', 'Ліплення, гончарний круг, лиття в гіпс; випал на дровах, газі, в електропечі. Місток: а як робили в різних краях?', '', ''),
    ('8:00', '9:30', 1.5, 'Запитання + карта', 'Яку українську кераміку ви знаєте? З якого вона краю?', 'Названий край відкрити на карті. Роздати аркуші.', 'відповідають усі; аркуш — кожному', ''),
    ('9:30', '17:30', 8, 'Подорож 9 країв', '', "<b>⭐ Довше (1–2 хв):</b> Гуцульщина, Поділля, Київщина, Полтавщина («Хто знає, що таке куманець?»).<br><b>⚡ Коротко (30 с):</b> Закарпаття, Галичина, Полісся, Слобожанщина, Причорномор'я.", 'учасник 5 — куманець; усі заповнюють аркуш', 'Подорож краями'),
    ('17:30', '19:30', 2, 'Вікторина на карті', '', '5 запитань «де це?» — учасники називають, ведучий натискає край. Мало часу — 3 запитання.', 'усі; перевірка аркуша', 'Вікторина'),
    ('19:30', '20:00', .5, 'Підсумок', "Що одне ви сьогодні запам'ятали?", 'Кожен виріб — «паспорт» свого краю.', 'кожен (5–6 відповідей)', '')]

PLAN_CSS = """
.page h2{margin:3.4mm 0 1.8mm}.note{margin-bottom:0}
.bar{display:flex;gap:.6mm;height:9mm;border-radius:1.6mm;overflow:hidden}
.sg{display:flex;align-items:center;justify-content:center;gap:1.4mm;background:var(--tint);color:var(--ink);font-size:8.5pt;font-weight:600;white-space:nowrap;overflow:hidden;min-width:0}
.sg:nth-child(odd){background:#efd2bf}.sg b{color:var(--acc);font:600 9pt "Osw",sans-serif;flex:none}
.ticks{position:relative;height:4mm;margin-top:.6mm;font-size:7.5pt;color:var(--mut)}.ticks span{position:absolute;transform:translateX(-50%);white-space:nowrap}.ticks span:first-child{transform:none}.ticks span:last-child{transform:translateX(-100%)}
.steps{display:flex;flex-direction:column}
.st{display:grid;grid-template-columns:17mm 8mm 1fr;gap:0 2.5mm;padding:1.45mm 0;border-top:.6pt solid var(--ln);break-inside:avoid}
.tm b{display:block;font:600 13pt/1 "Osw",sans-serif}.tm span{display:block;margin-top:.8mm;font-size:8.5pt;color:var(--mut)}
.nm i{display:block;color:var(--acc);font:600 13pt/1 "Osw",sans-serif;font-style:normal}
.tx h3{margin:0 0 .6mm;font:600 12pt/1.15 "Osw",sans-serif;text-transform:uppercase;letter-spacing:.01em}.tx p{margin:0 0 .4mm;font-size:9.8pt;line-height:1.32}
.tx .q{font-weight:700}.tx .who{color:var(--acc);font-weight:600;font-size:9.5pt}
.st.bonus .nm i{color:var(--acc)}.st.bonus .tm b{font-size:11pt}
.two{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:1mm;align-items:start}.box h2{margin:0 0 1.6mm;font-size:11pt}.two ul{margin:0;padding-left:4.5mm}
ul.chk{list-style:none;padding:0!important}ul.chk li{display:flex;gap:2mm;align-items:baseline;margin:.9mm 0;font-size:9.8pt;line-height:1.3}
.cb{flex:none;display:inline-block;width:3.6mm;height:3.6mm;border:1.1pt solid var(--ink);border-radius:.7mm;transform:translateY(.5mm)}
table.sl td{border:0;border-bottom:.6pt solid var(--ln);padding:1.3mm 2mm}table.sl td:first-child{width:36mm;color:var(--acc)}
"""

PLAN_P2 = """<div class="two"><div><h2>Мета</h2>
<p>Показати, як глина стає керамікою (форма, випал, глазур), і що кожен край України має свій «почерк» гончарства — через живу майстерню, карту й вироби.</p>
<h2>Залучення всіх 5–6 учасників</h2>
<ul><li><b>Учасник 1:</b> чому форма з гіпсу?</li><li><b>Учасники 2–4:</b> кожен капає воду на свій зразок і каже, що бачить.</li>
<li><b>Учасник 5:</b> що таке куманець?</li><li><b>Учасник 6:</b> чому гаварецький глек чорний без фарби?</li><li><b>Усі:</b> аркуш, вікторина, підсумок — кожен називає одну річ.</li></ul></div>
<div class="box"><h2>Що взяти — чек-лист</h2><ul class="chk">__CHK__</ul></div></div>
<h2>Слова, які треба пояснити</h2>
<table class="sl"><tr><td><b>Шлікер</b></td><td>рідка глиняна маса, як кефір; її заливають у гіпсову форму</td></tr><tr><td><b>Ангоб</b></td><td>кольорова глина для розпису</td></tr>
<tr><td><b>Полива / глазур</b></td><td>скло на виробі: мелений кварц із водою, у печі плавиться</td></tr><tr><td><b>Ритування</b></td><td>лінії, процарапані шилом крізь ангоб</td></tr>
<tr><td><b>Лощіння</b></td><td>полірування виробу камінцем до випалу; блиск без поливи</td></tr><tr><td><b>Куманець</b></td><td>посудина-«бублик» з горлечком для води, вина чи олії</td></tr></table>
<p class="mut" style="margin-top:1.5mm">Повний словничок (20 слів, за темами) — на другій сторінці аркуша учасника.</p>
<div class="two"><div class="box"><h2>Якщо час закінчується</h2><ul><li>Стежити за «⏱ закінчити до …» у підказках на пульті.</li><li>Короткі краї (⚡) — лише фото й одне речення.</li><li>У вікторині зупинитися після 3-го запитання.</li><li>Гру «Потужний СКОБ!» пропустити.</li><li>Майстерню не скорочувати — це головний інтерактив.</li></ul></div>
<div class="box"><h2>Якщо техніка підводить</h2><ul><li>Пульт не підключився — гортати ← → на ноутбуці, краї відкривати мишкою; підказки — на шпаргалці.</li><li>Немає проєктора — показувати зразки й аркуш учасника; карта й фото є на аркуші.</li></ul></div></div>
<h2>Вимоги вишколу</h2>
<p>Тема доступна юнацтву, вказано вік (12–17); залучено 5–6 учасників; терміни пояснено; є роздаткові матеріали (аркуш учасника) та інтерактив (майстерня, карта, вікторина, гра); гутірка до 20 хв.</p>"""

MATS = [('Ноутбук і проєктор', 'гутірка: бібліотека → «Кераміка України» → вишкіл; відкрити заздалегідь'),
        ('Телефон-пульт', 'QR-код у меню гутірки: підказки, карта, фото, таймер, гра'),
        ('Гіпсова форма й піала, відлита в ній', ''), ('Теракотовий вазон без глазурі', ''), ('Печатка, обпалена вдруге при 1250°', ''),
        ('Глазурована піала', ''), ('Склянка води й ложка', ''), ('Таблички до досліду', 'вирізати й зігнути'),
        ('Аркуш учасника', 'по одному на кожного'), ('Ручки', 'на кожного'), ('Шпаргалка ведучому', 'на випадок, якщо пульт не підключиться')]


def plan():
    bar = ''.join(f'<div class="sg" style="flex:{h[2]}"><b>{k + 1}</b>' + (f'<span>{h[7]}</span>' if h[7] else '') + '</div>' for k, h in enumerate(HID))
    ticks = '<div class="ticks">' + ''.join(f'<span style="left:{n / 20 * 100}%">{n} хв</span>' for n in (0, 5, 10, 15, 20)) + '</div>'
    steps = ''
    for k, (a, b, m, t, q, do, who, lab) in enumerate(HID):
        steps += (f'<div class="st"><div class="tm"><b>{a}</b><span>до {b}</span></div><div class="nm"><i>{k + 1}</i></div><div class="tx"><h3>{t}</h3>'
                  + (f'<p class="q">❓ {q}</p>' if q else '') + f'<p>{do}</p>' + (f'<p class="who">👥 {who}</p>' if who else '') + '</div></div>')
    steps += ('<div class="st bonus"><div class="tm"><b>бонус</b><span>якщо є час</span></div><div class="nm"><i>+</i></div><div class="tx"><h3>Гра «Потужний СКОБ!»</h3>'
              '<p>6 фото: звідки виріб і що це. З телефонів або вголос — ведучий тикає відповідь на пульті.</p></div></div>')
    p1 = ('<div class="note"><b>Для кого:</b> юнацтво 12–17 років · гурток 5–6 осіб, кожен учасник залучений · <b>до 20 хв</b></div>'
          f'<h2>20 хвилин одним поглядом</h2><div class="bar">{bar}</div>{ticks}<h2>Хід гутірки</h2><div class="steps">{steps}</div>')
    chk = ''.join(f'<li><span class="cb"></span><span><b>{a}</b>' + (f' — {b}' if b else '') + '</span></li>' for a, b in MATS)
    d = doc(PLAN_CSS)
    d.page('План гутірки', G, SUB, p1, who='vd')
    d.page('План гутірки', G, SUB, PLAN_P2.replace('__CHK__', chk), who='vd')
    return d.pdf(os.path.join(OUT, 'plan-vyshkil-20.pdf'))


# ---------------------------------------------------------------- таблички до досліду
def tablychky():
    T = [('1', 'Вазон без глазурі', 'один випал ≈ 900–1000°', 'пористий, як губка'),
         ('2', 'Печатка', 'другий випал при 1250°', 'глина спеклася, щільна, як камінь'),
         ('3', 'Піала з глазур\'ю', 'глазур = тонке скло', 'вода не проходить')]
    cards = ''.join(f'''<div class="tc"><div class="fold"><span>{n}</span><b>{a}</b></div><div class="face"><span>{n}</span><div><b>{a}</b><i>{b}</i></div><em>Що станеться з краплею?</em></div></div>''' for n, a, b, c in T)
    body = f'''<p class="mut" style="margin:0 0 3mm">Виріжте по пунктирі, зігніть навпіл по суцільній лінії — табличка стоятиме «будиночком» біля зразка. Учасники бачать назву й питання; що станеться — з'ясуєте разом.</p>{cards}'''
    css = '''
.tc{border:1pt dashed #9aa3ad;height:76mm;margin-bottom:4mm;display:grid;grid-template-rows:1fr 1fr;position:relative}
.tc::after{content:"✂";position:absolute;left:-1mm;top:-3.6mm;font-size:10pt;color:#9aa3ad;background:#fff}
.fold{transform:rotate(180deg);display:flex;align-items:center;gap:5mm;padding:0 10mm;border-top:1pt solid #9aa3ad}
.face{display:flex;align-items:center;gap:6mm;padding:0 10mm;position:relative}
.tc span{flex:none;display:grid;place-items:center;width:15mm;height:15mm;border-radius:50%;background:var(--acc);color:#fff;font:600 22pt "Osw",sans-serif}
.tc b{font:600 23pt/1.05 "Osw",sans-serif;text-transform:uppercase}
.face div{display:flex;flex-direction:column;gap:1mm}.face i{font-style:normal;font-size:13pt;color:var(--mut)}
.face em{position:absolute;right:8mm;bottom:5mm;font-style:normal;font-weight:700;color:var(--acc);font-size:11pt}
.fold b{font-size:20pt}
'''
    d = doc(css)
    d.page('Таблички до досліду', 'Крапля води', 'Три зразки — поставте табличку біля кожного', body)
    return d.pdf(os.path.join(OUT, 'tablychky-doslid.pdf'))


if __name__ == '__main__':
    for f in (plan, arkush, shpargalka, tablychky):
        print(f())
