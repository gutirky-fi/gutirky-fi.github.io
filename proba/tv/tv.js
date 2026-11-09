/* ТБ-режим сайту (макет 2). Той самий сайт, лише: більше, жовта рамка, стрілки пульта, «Назад», вхід виховника через QR.
   Вмикається: ?tv=1, або лаунчер (у назві браузера «PlastTV»), або вже раз увімкнено на цьому пристрої. */
(function () {
  'use strict';
  const H = document.documentElement, q = new URLSearchParams(location.search);
  let on = false;
  try { if (q.get('tv') === '0') localStorage.removeItem('plast-tv');
        on = q.get('tv') === '1' || /PlastTV/.test(navigator.userAgent) || localStorage.getItem('plast-tv') === '1' || window.TV_ZAVZHDY;
        if (on) localStorage.setItem('plast-tv', '1'); } catch (e) { on = q.get('tv') === '1' || window.TV_ZAVZHDY; }
  if (!on) return;
  H.classList.add('tv');

  const SEL = 'a[href],button:not([disabled]),input:not([type=hidden]),select,summary,[role=tab],[tabindex]:not([tabindex="-1"])';
  const vis = e => { if (e.closest('[hidden]')) return false; const r = e.getBoundingClientRect(); if (r.width < 4 || r.height < 4) return false;
    const s = getComputedStyle(e); return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05; };
  const scope = () => { const sh = document.getElementById('sheet'); return sh && !sh.hidden ? sh : document; };
  const all = () => [...scope().querySelectorAll(SEL)].filter(vis);
  const mem = {};
  let cur = null;

  function go(el, smooth = true) {
    if (!el) return; cur = el; el.focus({ preventScroll: true });
    mem[location.hash || '#'] = el;
    const blk = el.closest('#lockbox') || el, r = blk.getBoundingClientRect(), top = innerHeight * 0.18, bot = innerHeight * 0.82;
    if (r.top < top || r.bottom > bot || blk !== el) {
      const header = el.closest('header,.top,nav');
      const y = header ? 0 : scrollY + r.top + r.height / 2 - innerHeight / 2;
      scrollTo({ top: Math.max(0, y), behavior: smooth ? 'smooth' : 'auto' });
    }
  }
  /* сусід у напрямку: спершу ближче за напрямком, потім — ближче по іншій осі (щоб не стрибати навскіс) */
  function next(dx, dy) {
    const a = cur && document.contains(cur) && vis(cur) ? cur.getBoundingClientRect() : null;
    const L = all(); if (!a) return first();
    const cx = a.left + a.width / 2, cy = a.top + a.height / 2;
    const C = [];
    for (const e of L) { if (e === cur) continue; const b = e.getBoundingClientRect();
      const by = b.top + b.height / 2; let main, side;
      if (dy) { main = dy > 0 ? b.top - a.bottom : a.top - b.bottom; if (main < -a.height / 2) continue;
        side = Math.max(0, b.left - a.right, a.left - b.right); }
      else { if (Math.abs(by - cy) > Math.max(a.height, b.height) * 0.75) continue;  // вліво-вправо — лише в тому самому рядку
        main = dx > 0 ? b.left - a.right : a.left - b.right; if (main < -a.width / 2) continue; side = Math.abs(by - cy); }
      C.push([e, Math.max(0, main), side]); }
    // вгору-вниз: спершу найближчий ряд, у ньому — найближча по горизонталі кнопка
    let best = null, bs = 1e9;
    if (dy && C.length) { const m = Math.min(...C.map(x => x[1]));
      for (const [e, mn, sd] of C) if (mn <= m + 40 && sd + mn * .01 < bs) { bs = sd + mn * .01; best = e; } }
    else for (const [e, mn, sd] of C) { const s = mn + sd * 3; if (s < bs) { bs = s; best = e; } }
    if (best) return go(best);
    if (dy) scrollBy({ top: dy * innerHeight * 0.5, behavior: 'smooth' });   // нижче немає кнопок — просто прокрутити
  }
  function first() {
    const m = mem[location.hash || '#']; if (m && document.contains(m) && vis(m)) return go(m, false);
    const L = all(); const hb = (document.querySelector('header,.top') || {}).getBoundingClientRect?.().bottom || 0;
    go(L.find(e => !e.closest('header,.top,nav') && e.getBoundingClientRect().top >= hb - 2 && !e.matches('input')) || L[0], false);
  }
  function back() {
    const sh = document.getElementById('sheet');
    if (sh && !sh.hidden) { dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); setTimeout(first, 80); return; }
    if ((location.hash || '#') !== '#') { history.back(); return; }
    if (window.Android && Android.home) Android.home();   // з головної — назад у лаунчер
  }
  addEventListener('keydown', e => {
    const k = e.key, t = e.target, inInput = t && t.matches && t.matches('input');
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k];
    if (d) { if (inInput && d[0]) return; e.preventDefault(); e.stopImmediatePropagation(); next(...d); return; }
    if ((k === 'Enter' || k === ' ') && t && t.matches && t.matches('[tabindex],[role=tab]') && !t.matches('a,button,input,summary')) { e.preventDefault(); t.click(); return; }
    if (k === 'GoBack' || k === 'BrowserBack' || (k === 'Backspace' && !inInput) || (k === 'Escape' && !inInput)) { e.preventDefault(); e.stopImmediatePropagation(); back(); }
  }, true);
  addEventListener('hashchange', () => setTimeout(first, 120));
  addEventListener('click', () => setTimeout(() => { if (!cur || !document.contains(cur) || !vis(cur)) first(); }, 150), true);

  /* ---- вхід виховника: QR для телефона замість поля з кодом ---- */
  function lockQR() {
    const box = document.getElementById('lockbox'); if (!box || box.querySelector('.tvq')) return;
    const id = Math.random().toString(36).slice(2, 8).toUpperCase();
    const url = location.origin + '/proba/tv/telefon.html?p=' + id;
    const d = document.createElement('div'); d.className = 'tvq';
    d.innerHTML = '<div class="qr">' + (window.qrSvg ? qrSvg(url, 220) : '') + '</div><div class="tx"><b>Скануйте телефоном виховника</b>' +
      '<span>На телефоні натисніть «Так» — і розділ відкриється тут. Код на екрані не набирається.</span>' +
      '<button type="button" class="btn ghost tvsim">Макет: ніби телефон натиснув «Так»</button>' +
      '<button type="button" class="btn ghost tvkod">Ввести код кнопками пульта</button></div>';
    box.insertBefore(d, box.querySelector('input'));
    d.querySelector('.tvsim').onclick = () => { const i = document.getElementById('code'); i.value = '1912'; box.requestSubmit ? box.requestSubmit() : box.querySelector('[type=submit]').click(); setTimeout(first, 200); };
    d.querySelector('.tvkod').onclick = () => { box.classList.add('tvkod-on'); const i = document.getElementById('code'); i.type = 'password'; i.setAttribute('inputmode', 'none'); go(i); };
  }
  function start() { lockQR(); first(); }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', () => setTimeout(start, 300)); else setTimeout(start, 300);
})();
