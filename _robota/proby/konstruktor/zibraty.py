"""Конструктор гутірки (проба): редактор + рушій показу.
    python3 _robota/proby/konstruktor/zibraty.py        -> proba/konstruktor/index.html (редактор), proba/konstruktor/pokaz/index.html (показ)
    python3 _robota/proby/konstruktor/zibraty.py sait   -> і konstruktor/… на сайті
Рушій показу бере СТИЛЬ гутірок-вмілостей з gutirky/budova-la-1/index.html (тож виглядає так само), гру «Потужний СКОБ!» (skob.js),
QR (qr.js) і пульт (zvyazok.js + pult-host-file.js). Редактор містить рушій (base64), щоб «Зберегти файлом» давало один самодостатній HTML."""
import base64, json, pathlib, sys
TUT = pathlib.Path(__file__).parent
ROB = TUT.parent.parent
SITE = ROB.parent
D = ROB / 'src'
DR = ROB / 'druk'
IC_PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>'
b64 = lambda p, m: 'data:' + m + ';base64,' + base64.b64encode(p.read_bytes()).decode()


def rep(s, a, b):
    assert s.count(a) == 1, (s.count(a), a[:70])
    return s.replace(a, b)


def rushiy():
    s = (TUT / 'rushiy.html').read_text(encoding='utf-8')
    bud = (ROB / 'gutirky' / 'budova-la-1' / 'index.html').read_text(encoding='utf-8')
    st = bud[bud.index('<style>') + 7: bud.index('</style>')]
    st = st.replace('{{DRUK_PLAN}}', (DR / 'plan-druk.css').read_text(encoding='utf-8').replace('__ACC__', '#2f6fb3').replace('__LILY__', b64(DR / 'lileya.png', 'image/png')))
    s = rep(s, '/*STYLE*/', st)
    emblem = b64(D / 'img' / 'emblem.webp', 'image/webp')
    host = (D / 'zvyazok.js').read_text(encoding='utf-8') + '\n' + (D / 'pult-host-file.js').read_text(encoding='utf-8')
    host = rep(host, "btn.innerHTML = '📱 Пульт<i class=\"pd-dot\"></i>';", "btn.innerHTML = " + json.dumps(IC_PHONE + '<span>Пульт</span><i class="pd-dot"></i>') + ";")
    host = rep(host, '<h2 id="pd-ttl">📱 Пульт на телефоні</h2>', '<h2 id="pd-ttl"><img src="' + emblem + '" alt="">Пульт на телефоні</h2>')
    host = rep(host, "'<span>📱 Телефон «<b></b>» просить доступ до пульта.", "'<span>Телефон «<b></b>» просить доступ до пульта.")
    s = rep(s, '<script>/*QR*/</script>', '<script>\n' + (D / 'qr.js').read_text(encoding='utf-8') + '\n</script>')
    pre = "window.SKOB_URL = (location.hostname === 'gutirky-fi.github.io' || location.protocol === 'file:') ? 'https://gutirky-fi.github.io/skob/' : new URL('/skob/', location.href).href;"
    s = rep(s, '<script>/*SKOB*/</script>', '<script>' + pre + '</script>\n<script>\n' + (D / 'skob.js').read_text(encoding='utf-8') + '\n</script>')
    s = rep(s, '<script>/*PULT*/</script>', '<script>\n' + host + '\n</script>')
    s = s.replace('{{EMBLEM}}', emblem)
    assert 'noindex' in s and '{{' not in s.replace('${{', '') and '/*STYLE*/' not in s
    return s


def write(p, t):
    p.parent.mkdir(parents=True, exist_ok=True); p.write_text(t, encoding='utf-8'); print('  ', p.relative_to(SITE), len(t) // 1024, 'КБ')


if __name__ == '__main__':
    R = rushiy()
    ed = (TUT / 'index.html').read_text(encoding='utf-8')
    ed = rep(ed, '{{LOGO}}', b64(D / 'img' / 'logo.png', 'image/png'))
    ed = rep(ed, '{{RUSHIY_B64}}', base64.b64encode(R.encode('utf-8')).decode())
    assert 'noindex' in ed and '{{' not in ed.replace('${{', '')
    for d in ['proba/konstruktor'] + (['konstruktor'] if 'sait' in sys.argv else []):
        write(SITE / d / 'index.html', ed)
        write(SITE / d / 'pokaz' / 'index.html', R)
