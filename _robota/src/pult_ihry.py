"""Пульт ведучого для ігор (4.11.2026): код zvyazok.js + pult-host-file.js з тими самими замінами, що в гутірках.
   Гра має кнопку <button id="phone-mode"> у шапці, обʼєкт window.GUTIRKA (state/next/prev/act) і позначку <script>/*PULT*/</script>."""
import json, pathlib
D = pathlib.Path(__file__).parent
IC_PHONE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>'


def host(with_zvyazok=False):
    h = ((D / 'zvyazok.js').read_text(encoding='utf-8') + '\n' if with_zvyazok else '') + (D / 'pult-host-file.js').read_text(encoding='utf-8')
    a = "btn.innerHTML = '📱 Пульт<i class=\"pd-dot\"></i>';"
    assert h.count(a) == 1
    h = h.replace(a, "btn.innerHTML = " + json.dumps(IC_PHONE + '<span>Пульт</span><i class="pd-dot"></i>') + ";")
    h = h.replace('<h2 id="pd-ttl">📱 Пульт на телефоні</h2>', '<h2 id="pd-ttl">Пульт ведучого на телефоні</h2>')
    h = h.replace("'<span>📱 Телефон «<b></b>» просить доступ до пульта.", "'<span>Телефон «<b></b>» просить доступ до пульта.")
    return h


def inject(s):
    assert s.count('<script>/*PULT*/</script>') == 1
    return s.replace('<script>/*PULT*/</script>', '<script>\n' + host() + '\n</script>')
