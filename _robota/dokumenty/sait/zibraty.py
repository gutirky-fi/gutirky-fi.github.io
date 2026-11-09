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
    s = s.replace('<!--DATALISTS-->', DL)
    s = s.replace('/*INDEKS*/null/*/INDEKS*/', json.dumps(INDEKS, ensure_ascii=False).replace('</', '<\\/'))
    s = s.replace('/*DEMOZVITY*/null/*/DEMOZVITY*/', DEMOZVITY.replace('</', '<\\/'))
    s = s.replace('/*DEMO*/false/*/DEMO*/', 'false' if SAIT else 'true')   # проби — завжди пробний режим (без коду, нічого не надсилається); на сайті — вхід за кодом
    s = s.replace('<!--RIBBON-->', '' if SAIT else '<div class="ribbon">Проба для перегляду. На сайті цієї сторінки ще немає.</div>')
    assert 'noindex' in s and '{{' not in s
    assert '/*DEMO*/' not in s and not (SAIT and 'const DEMO = true' in s)
    out = SITE / ('dokumenty' if SAIT else 'proba/dokumenty') / ('' if nazva == 'index' else nazva) / 'index.html'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(s, encoding='utf-8')
    print('  ', out.relative_to(SITE), len(s) // 1024, 'КБ')
