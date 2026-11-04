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
    '#pult-dlg.vd .pd-box{width:min(840px,100%);border-left:1px solid #3b4048;padding:22px 24px}' +
    '#pult-dlg.vd h2{font-size:24px;letter-spacing:.02em;margin:0 50px 16px 0}' +
    '#pult-dlg.vd .pd-x{border-radius:99px;width:40px;height:40px;right:12px;top:12px}' +
    '#pult-dlg.vd .vd-g{display:grid;grid-template-columns:370px minmax(0,1fr);gap:14px 24px;align-items:start}' +
    '#pult-dlg.vd .vd-g.one{grid-template-columns:minmax(0,420px)}' +
    '#pult-dlg.vd .vd-t h4{margin:0 0 10px;font:700 14px "Source Sans 3",system-ui,sans-serif;color:#a0a8b2}' +
    '#pult-dlg.vd .vd-t .l2xi,#pult-dlg.vd .vd-t .s2xi{margin:0;display:block}' +
    '#pult-dlg.vd .vd-rp{margin-top:18px}#pult-dlg.vd .vd-t>.vd-rp:first-child{margin-top:0}#pult-dlg.vd .vd-t .s3row{display:flex;flex-wrap:wrap;gap:10px}#pult-dlg.vd .vd-t .vd-n{margin:8px 0 0;color:#a0a8b2;font-size:14px;line-height:1.45}' +
    /* картка точно як у Змагу (.ved): QR 112 px ліворуч, заголовок і пояснення праворуч; службове (стан, код, кнопки) — сховано */
    '#pult-dlg.vd .vd-p{display:flex;gap:14px;align-items:center;padding:12px;border-radius:14px;background:#22262b;border:1px solid #383d44}' +
    '#pult-dlg.vd .vq{flex:none;width:112px;height:112px;border-radius:10px;overflow:hidden}' +
    '#pult-dlg.vd .vq .pd-qr{display:block;border-radius:0;box-shadow:none;line-height:0}#pult-dlg.vd .vq svg{width:112px!important;height:112px!important;display:block}' +
    '#pult-dlg.vd .vd-tx b{display:block;font-size:17px;line-height:1.35}#pult-dlg.vd .vd-tx span{display:block;color:#a0a8b2;font-size:15px;line-height:1.45}' +
    '#pult-dlg.vd .vd-ok{display:none;flex-direction:column;gap:4px;padding:6px 4px}#pult-dlg.vd .vd-ok b{color:#3ee08f;font-size:18px}#pult-dlg.vd .vd-ok span{color:#a0a8b2;font-size:15px}' +
    '#pult-dlg.vd .vd-ok button{align-self:flex-start;margin-top:4px;padding:0;border:0;background:none;color:#a0a8b2;font:600 14px "Source Sans 3",system-ui,sans-serif;text-decoration:underline;text-underline-offset:3px;cursor:pointer}' +
    '#pult-dlg.vd[data-st=connected]:not(.more) .vd-p>.vq,#pult-dlg.vd[data-st=connected]:not(.more) .vd-p>.vd-tx{display:none}#pult-dlg.vd[data-st=connected]:not(.more) .vd-ok{display:flex}' +
    '#pult-dlg.vd .vd-hid{display:none}#pult-dlg.vd .pd-site:not([hidden]){display:block}' +
    '#pult-dlg.vd[data-st=error] .vd-tx span::after{content:" Немає звʼязку — перевірте інтернет.";color:#ff9a8a}' +
    '#phone-mode .pd-dot{display:none}#phone-mode.ok span::after{content:" ✓"}' +
    '#pult-dlg.vd.one .pd-box{min-width:0;width:min(520px,100%)}#pult-dlg.vd .vd-g.one{grid-template-columns:minmax(0,1fr)}' +
    '@media (max-width:760px){#pult-dlg.vd .vd-g{grid-template-columns:1fr}}' +
    '</style>');
  dlg.classList.add('vd');
  dlg.querySelector('#pd-ttl').textContent = 'Ведучому';
  /* картка пульта: усе, що було у вікні пульта, крім заголовка й хрестика */
  const card = document.createElement('div'); card.className = 'vd-p';
  const id = (window.GUTIRKA && window.GUTIRKA.id) || '';
  const what = { bingo: 'щойно витягнута кулька, перевірка карток і кнопка «Далі»', opytuvannia: 'результати (раніше, ніж на екрані) і кнопки керування', 'skob-hra': 'правильна відповідь, лідери й кнопка «Далі»' }[id] || 'те, що бачите лише ви, і кнопки керування';
  card.innerHTML = '<div class="vq"></div><div class="vd-tx"><b>Пульт на вашому телефоні</b><span>Наведіть камеру телефона на цей код — він стане пультом: ' + what + '. Учасникам код не показуйте.</span></div>'
    + '<div class="vd-ok"><b>Пульт підключено ✓</b><span>Відповіді й кнопки гри — на вашому телефоні.</span><button type="button">Показати QR-код ще раз</button></div><div class="vd-hid"></div>';
  card.querySelector('.vq').appendChild(box.querySelector('.pd-qr'));
  const site = box.querySelector('.pd-site'); if (site) card.querySelector('.vd-tx').appendChild(site);   /* лише якщо невідома адреса пульта (файл з компʼютера) */
  [...box.children].forEach(el => { if (!el.matches('.pd-x,#pd-ttl')) card.querySelector('.vd-hid').appendChild(el); });
  card.querySelector('.vd-ok button').addEventListener('click', () => { const m = dlg.querySelector('#pd-more'); if (m) m.click(); });
  /* ✓ на кнопці «Ведучому», коли телефон підключено (як у Змагу) */
  const sync = () => btn.classList.toggle('ok', dlg.dataset.st === 'connected');
  new MutationObserver(sync).observe(dlg, { attributes: true, attributeFilter: ['data-st'] }); sync();
  const tools = document.createElement('div'); tools.className = 'vd-t';
  const g = document.createElement('div'); g.className = 'vd-g'; g.append(card, tools); box.appendChild(g);
  /* інструменти гри з її старого вікна «Ведучому» (Бінго, Змаг) — сюди; стару кнопку й вікно прибираємо */
  /* «Репетиція»: тестові гравці (4.11.2026) */
  if (window.REPETYTSIIA && window.GUTIRKA_BOT_URL) {
    const rp = document.createElement('div'); rp.className = 'vd-rp';
    rp.innerHTML = '<h4>Репетиція</h4><div class="s3row"><button type="button" class="pd-b" id="vd-rep">Додати 4 тестових гравців</button></div><p class="vd-n" id="vd-repn">Прожени гру сам, без юнаків: тестові гравці входять і грають самі. Імена — «Тест …».</p>';
    rp.querySelector('#vd-rep').addEventListener('click', e => {
      const r = window.REPETYTSIIA(window.GUTIRKA_BOT_URL, 4), b = e.currentTarget, n = rp.querySelector('#vd-repn');
      if (r === null) { n.textContent = 'Гра ще вмикає звʼязок — спробуйте за кілька секунд.'; return; }
      b.textContent = r ? 'Прибрати тестових гравців' : 'Додати 4 тестових гравців';
      n.textContent = r ? 'Тестові гравці підключаються (кілька секунд). Почніть гру як звичайно.' : 'Тестових гравців прибрано.';
    });
    tools.appendChild(rp);
  }
  function merge() {
    const old = document.querySelector('.s3o'), oldBtn = document.querySelector('.s3v');
    if (old) { const ob = old.querySelector('.bx'); [...ob.children].forEach(el => { if (!el.matches('h3,.x')) tools.appendChild(el); }); old.remove(); const rp = tools.querySelector('.vd-rp'); if (rp) tools.appendChild(rp); }
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
