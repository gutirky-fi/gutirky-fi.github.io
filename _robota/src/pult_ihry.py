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
    h = h.replace("connected: '● Телефон підключено. Можна керувати!'", "connected: 'Телефон підключено. Можна керувати!'")   # крапка вже є ліворуч
    return h


IC_GEAR = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>'

# «Ведучому» (4.11.2026, як у Змагу): одна кнопка в шапці — вікно з пультом (QR) і інструментами гри
VED = r"""
(function () {
  'use strict';
  function run() {
  const dlg = document.getElementById('pult-dlg'), btn = document.getElementById('phone-mode');
  if (!dlg || !btn) return;
  const box = dlg.querySelector('.pd-box');
  document.head.insertAdjacentHTML('beforeend', '<style>' +
    '#pult-dlg.vd{align-items:flex-start;padding:70px 16px 16px;background:rgba(10,12,15,.8)}' +
    '#pult-dlg.vd .pd-box{width:min(860px,100%);border-left:1px solid #3b4048;padding:22px 24px}' +
    '#pult-dlg.vd h2{font-size:24px;letter-spacing:.02em;margin:0 50px 16px 0}' +
    '#pult-dlg.vd .pd-x{border-radius:99px;width:40px;height:40px;right:12px;top:12px}' +
    '#pult-dlg.vd .vd-g{display:grid;grid-template-columns:minmax(0,420px) minmax(0,1fr);gap:18px 26px;align-items:start}' +
    '#pult-dlg.vd .vd-g.one{grid-template-columns:minmax(0,420px)}' +
    '#pult-dlg.vd .vd-p{padding:16px;border-radius:16px;background:#22262b;border:1px solid #383d44}' +
    '#pult-dlg.vd .vd-p>b{display:block;font-weight:700;font-size:17px;margin-bottom:4px}' +
    '#pult-dlg.vd .vd-p>p{margin:0 0 12px;color:#a0a8b2;font-size:14px;line-height:1.45}' +
    '#pult-dlg.vd .pd-main{margin:12px 0 0}#pult-dlg.vd .pd-qr{box-shadow:none}#pult-dlg.vd .pd-code{font-size:34px;color:#f2f4f6}' +
    '#pult-dlg.vd .pd-row{margin-top:12px}#pult-dlg.vd .pd-b{font-size:14px;padding:8px 12px}' +
    '#pult-dlg.vd .vd-t h4{margin:0 0 10px;font:700 14px "Source Sans 3",system-ui,sans-serif;color:#a0a8b2}' +
    '#pult-dlg.vd .vd-t .l2xi,#pult-dlg.vd .vd-t .s2xi{margin:0;display:block}' +
    /* компактна картка, як у Змагу: невеликий QR ліворуч, текст і код праворуч */
    '#pult-dlg.vd .vd-p{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:16px;align-items:start}' +
    '#pult-dlg.vd .vd-p>*{grid-column:2}' +
    '#pult-dlg.vd .vd-p:has(.pd-main[hidden]){grid-template-columns:minmax(0,1fr)}#pult-dlg.vd .vd-p:has(.pd-main[hidden])>*{grid-column:1}' +
    '#pult-dlg.vd .vd-p .pd-main{grid-column:1;grid-row:1/span 9;margin:0;text-align:center}' +
    '#pult-dlg.vd .pd-qr svg{width:132px;height:132px;display:block}#pult-dlg.vd .pd-qr{border-radius:12px;overflow:hidden}' +
    '#pult-dlg.vd .pd-or{display:none}#pult-dlg.vd .pd-code{font-size:20px;letter-spacing:.1em;color:#a0a8b2;margin-top:6px}' +
    '#pult-dlg.vd .pd-status{padding:7px 10px;font-size:14px;margin-top:2px}' +
    '#pult-dlg.vd .pd-det{grid-column:1/-1;margin-top:8px;font-size:13px;color:#98a1ac}' +
    '#pult-dlg.vd .vd-g.one{grid-template-columns:minmax(0,1fr)}#pult-dlg.vd.one .pd-box{width:min(560px,100%)}' +
    '@media (max-width:760px){#pult-dlg.vd .vd-g{grid-template-columns:1fr}}' +
    '</style>');
  dlg.classList.add('vd');
  dlg.querySelector('#pd-ttl').textContent = 'Ведучому';
  /* картка пульта: усе, що було у вікні пульта, крім заголовка й хрестика */
  const card = document.createElement('div'); card.className = 'vd-p';
  card.innerHTML = '<b>Пульт на вашому телефоні</b><p>Скануйте код своїм телефоном: там будуть правильні відповіді й кнопки гри. Юнакам його не показуйте.</p>';
  [...box.children].forEach(el => { if (!el.matches('.pd-x,#pd-ttl')) card.appendChild(el); });
  const tools = document.createElement('div'); tools.className = 'vd-t';
  const g = document.createElement('div'); g.className = 'vd-g'; g.append(card, tools); box.appendChild(g);
  /* інструменти гри з її старого вікна «Ведучому» (Бінго, Змаг) — сюди; стару кнопку й вікно прибираємо */
  function merge() {
    const old = document.querySelector('.s3o'), oldBtn = document.querySelector('.s3v');
    if (old) { const ob = old.querySelector('.bx'); [...ob.children].forEach(el => { if (!el.matches('h3,.x')) tools.appendChild(el); }); old.remove(); }
    if (oldBtn) oldBtn.remove();
    g.classList.toggle('one', !tools.children.length); dlg.classList.toggle('one', !tools.children.length); tools.hidden = !tools.children.length;
    const top = document.querySelector('.top'); if (top && btn.parentNode === top) top.appendChild(btn);
  }
  merge(); setTimeout(merge, 600); setTimeout(merge, 2000);
  /* кнопка в шапці */
  btn.innerHTML = """ + json.dumps(IC_GEAR) + """ + '<span>Ведучому</span><i class="pd-dot"></i>';
  btn.setAttribute('aria-label', 'Ведучому: пульт на телефоні й інструменти гри');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();   /* після того, як пульт збудував своє вікно */
})();
"""


def inject(s):
    assert s.count('<script>/*PULT*/</script>') == 1
    return s.replace('<script>/*PULT*/</script>', '<script>\n' + host() + '\n</script>\n<script>' + VED + '</script>')
