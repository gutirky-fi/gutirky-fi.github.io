"""Документи гуртка — сторінки сайту (Етап 3).
   python3 _robota/dokumenty/sait/zibraty.py        -> проба  proba/dokumenty/ (картки посад) і proba/dokumenty/vidviduvanist/  (зі смужкою «Проба»)
   python3 _robota/dokumenty/sait/zibraty.py sait   -> сайт   dokumenty/vidviduvanist/        (лише після «так» власника)
   Проба з вигаданими іменами без мережі: додати до адреси ?demo (код 1234).
   Адресу приймача сторінка бере з посилання виховника (#p=…), не з репозиторію."""
import pathlib, base64, sys
TUT = pathlib.Path(__file__).parent
ROB = TUT.parent.parent
SITE = ROB.parent
IMG = ROB / 'src' / 'img'


def uri(p, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(p.read_bytes()).decode()


SAIT = len(sys.argv) > 1 and sys.argv[1] == 'sait'
SPILNE = (TUT / 'spilne.css').read_text(encoding='utf-8')
PAPIRCSS = (TUT / 'papir.css').read_text(encoding='utf-8')
PAPIR = (TUT / 'papir.js').read_text(encoding='utf-8')   # аркуш на телефоні, «Переглянути», PDF (09.11)
assert '</script' not in PAPIR and '{{' not in PAPIR
VNESKY = (TUT / 'vnesky.js').read_text(encoding='utf-8')   # спільна логіка внесків: Каса (forma.html) + «Після сходин» (vykhovnyk.html), 12.11
assert '</script' not in VNESKY and '{{' not in VNESKY
STAN = (TUT / 'stan.js').read_text(encoding='utf-8')   # спільне «ця дата вже записана?»: Відвідуваність + «Після сходин», 13.11
assert '</script' not in STAN and '{{' not in STAN
TOCHKY = (TUT / 'tochky.js').read_text(encoding='utf-8')   # спільні кнопки точок проби: Проби + «Що вже має» у вході виховника, 14.11
assert '</script' not in TOCHKY and '{{' not in TOCHKY
TOCHKYCSS = (TUT / 'tochky.css').read_text(encoding='utf-8')
BORHY = (TUT / 'borhy.js').read_text(encoding='utf-8')   # спільні борги «свої гроші»: заліки, «Повернули» — Каса + «Перевірка каси», 14.11
assert '</script' not in BORHY and '{{' not in BORHY
NAZVY = (TUT / 'nazvy.js').read_text(encoding='utf-8')   # спільна підказка й попередження про назви нашивок: Відзначки + «Що вже має», 14.11
assert '</script' not in NAZVY and '{{' not in NAZVY
import json, re, html
FORMA = (TUT / 'forma.html').read_text(encoding='utf-8')
FORMY = {k: v for k, v in json.loads((TUT / 'formy.json').read_text(encoding='utf-8')).items() if k != '_'}
FORMY.pop('proby', None)   # «Проби» — окрема сторінка proby.html (етап 3.6); запис у formy.json лишився як історія
INDEKS = json.loads((TUT.parent / 'etap2' / 'indeks_prob.json').read_text(encoding='utf-8'))['proby']   # точки з офіційних бланків


# підказки для полів (пошук під час введення; можна вписати й своє)
def datalists():
    shell = (ROB / 'src' / 'shell_file.js').read_text(encoding='utf-8')
    hut = ['гутірка «' + m.group(1) + '»' for m in (re.search(r"title: '([^']+)'", ln) for ln in shell.splitlines() if '// proba' not in ln) if m]   # проби — ні
    hut += ['гра «Потужний СКОБ!»', 'гра «Пластове Бінго»', 'гра «Інтелектуальний Змаг»', 'гра «Швидке Опитування»']
    sk = (ROB / 'src' / 'skills_data.js').read_text(encoding='utf-8')
    m = re.search(r'SKILL_LIST\s*=\s*(\[.*?\]);', sk, re.S)
    vm = [x[0] for x in json.loads(m.group(1))]
    vm = ['1-ша проба', '2-га проба', '3-тя проба'] + ['вмілість «' + v + '»' for v in vm]
    dl = lambda i, l: f'<datalist id="dl-{i}">' + ''.join('<option value="' + html.escape(x, quote=True) + '">' for x in l) + '</datalist>'
    return dl('gutirky', hut) + dl('vmilosti', vm) + dl('vmilNazvy', sorted(x[0] for x in json.loads(m.group(1))))   # лише назви — для аркуша «Вмілості»


DL = datalists()


def dzherelo(nazva):   # окрема сторінка або документ із заготовки forma.html (опис — formy.json)
    if nazva not in FORMY:
        return (TUT / (nazva + '.html')).read_text(encoding='utf-8')
    k = FORMY[nazva]
    return FORMA.replace('{{TITLE}}', k['t']).replace('/*KONFIG*/{}/*/KONFIG*/', json.dumps(k, ensure_ascii=False).replace('</', '<\\/'))


DEMOZVITY = (TUT / 'demo_zvity.json').read_text(encoding='utf-8').strip()   # вигаданий гурток «Лелеки» для проби «Звітів» (python3 demo_zvity.py)

for nazva in ('index', 'vidviduvanist', 'proby', 'vykhovnyk', 'zvity', 'knyha', 'kinets-roku', *FORMY):
    s = dzherelo(nazva)
    s = s.replace('{{LOGO}}', uri(IMG / 'logo.png', 'image/png')).replace('{{EMBLEM}}', uri(IMG / 'emblem.webp', 'image/webp')).replace('{{LILY}}', uri(ROB / 'druk' / 'lileya.png', 'image/png'))
    s = s.replace('/*SPILNE*/', SPILNE)
    s = s.replace('/*PAPIRCSS*/', PAPIRCSS)
    s = s.replace('/*PAPIR*/', PAPIR)
    s = s.replace('/*VNESKY*/', VNESKY)
    s = s.replace('/*STAN*/', STAN)
    s = s.replace('/*TOCHKY*/', TOCHKY).replace('/*TOCHKYCSS*/', TOCHKYCSS)
    s = s.replace('/*BORHY*/', BORHY)
    s = s.replace('/*NAZVY*/', NAZVY)
    s = s.replace('<!--DATALISTS-->', DL)
    s = s.replace('/*INDEKS*/null/*/INDEKS*/', json.dumps(INDEKS, ensure_ascii=False).replace('</', '<\\/'))
    s = s.replace('/*DEMOZVITY*/null/*/DEMOZVITY*/', DEMOZVITY.replace('</', '<\\/'))
    s = s.replace('/*DEMO*/false/*/DEMO*/', 'false' if SAIT else 'true')   # проби — завжди пробний режим (без коду, нічого не надсилається); на сайті — вхід за кодом
    s = s.replace('<!--RIBBON-->', '<div class="ribbon rozrob">Розділ у розробці. Бланки, форми й звіти працюють; запис у Google Таблицю гуртка вмикається після налаштування книги. Позначка «готується» — ще не зроблено. <a href="/proba/dokumenty/" style="color:inherit;text-decoration:underline">Подивитись, як це працює, на прикладі з вигаданим гуртком</a>.</div>' if SAIT else '<div class="ribbon">Приклад із вигаданим гуртком: нічого не надсилається й не зберігається. <a href="/dokumenty/" style="color:inherit;text-decoration:underline">Справжній розділ</a></div>')
    assert 'noindex' in s and '{{' not in s
    assert '/*DEMO*/' not in s and not (SAIT and 'const DEMO = true' in s)
    out = SITE / ('dokumenty' if SAIT else 'proba/dokumenty') / ('' if nazva == 'index' else nazva) / 'index.html'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(s, encoding='utf-8')
    print('  ', out.relative_to(SITE), len(s) // 1024, 'КБ')
