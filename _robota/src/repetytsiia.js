/* «Репетиція» (4.11.2026): тестові гравці, щоб ведучий міг прогнати гру сам, без юнаків.
   1) На сторінці гравця (СКОБ, Бінго, Опитування, Змаг): якщо в адресі є ?bot=N — сторінка сама входить у гру
      під тестовим іменем і сама грає (відповідає, позначає кульки, голосує, тисне «Відповідаю!»).
      Свій «запис» у сховищі браузера (bot.N.…), щоб тестові гравці не плутались між собою й зі справжнім.
   2) На екрані ведучого: window.REPETYTSIIA(urlFn, n) — додає n невидимих тестових гравців (iframe), повторний виклик — прибирає. */
(function () {
  'use strict';
  const q = new URLSearchParams(location.search), BOT = q.get('bot');
  if (BOT !== null && /^\d{1,2}$/.test(BOT)) {
    /* --- тестовий гравець --- */
    const N = +BOT, pre = 'bot.' + N + '.';
    [Storage.prototype].forEach(P => {
      const g = P.getItem, s = P.setItem, r = P.removeItem;
      P.getItem = function (k) { return g.call(this, pre + k); };
      P.setItem = function (k, v) { return s.call(this, pre + k, v); };
      P.removeItem = function (k) { return r.call(this, pre + k); };
    });
    const NAMES = ['Тарас', 'Оксана', 'Богдан', 'Мирослава', 'Устим', 'Зоряна', 'Остап', 'Леся', 'Назар', 'Ярина'];
    const name = 'Тест ' + NAMES[N % NAMES.length];
    const $ = s => document.querySelector(s), vis = el => !!(el && el.offsetParent !== null && !el.disabled);
    const rnd = (a, b) => a + Math.random() * (b - a);
    const done = new Set(); let busy = false;
    const later = (key, ms, fn) => { if (done.has(key) || busy) return; done.add(key); busy = true; setTimeout(() => { busy = false; try { fn(); } catch (e) { /* ok */ } }, ms); };
    const fill = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    const WORDS = ['похід', 'ігри', 'вогнище', 'пісні', 'мандрівка', 'вузли', 'табір'];
    setInterval(() => {
      /* вхід */
      const fn = $('#f-name');
      if (vis(fn)) { if (!fn.value) fill(fn, name); const go = $('#go') || $('#s-join button.main') || $('form button.main'); if (vis(go)) later('join', rnd(300, 1500), () => go.click()); return; }
      const goOnly = $('#join:not([hidden]) #go'); if (goOnly && vis(goOnly) && !$('#f-name')) { later('join', rnd(300, 1500), () => goOnly.click()); return; }
      /* Змаг: вибір команди */
      const tp = document.querySelectorAll('#tp button'); if (tp.length && vis(tp[0])) { later('team', rnd(400, 1200), () => { const t = document.querySelectorAll('#tp button'); if (t.length) t[N % t.length].click(); }); return; }
      /* СКОБ: варіанти відповіді */
      const ans = document.querySelectorAll('#ans button');
      if (ans.length && vis(ans[0])) { const k = 'q:' + ($('#a-q') ? $('#a-q').textContent : ''), o = Math.floor(Math.random() * ans.length); later(k, rnd(1500, 7000), () => { const x = document.querySelectorAll('#ans button')[o]; if (x) x.click(); }); return; }
      /* Бінго: позначити витягнуте, натиснути «БІНГО!» */
      const card = document.querySelectorAll('#card button[data-k]');
      if (card.length) {
        const ba = $('#ba') ? $('#ba').textContent.replace(/^→\s*/, '').trim() : '', ball = ba || ($('#bn') && $('#bn').lastChild ? $('#bn').lastChild.textContent.trim().split(/\s+/).pop() : '');   /* «Б 7» → «7»; у словах — відповідь після «Показати відповідь» */
        const b = [...card].find(x => x.textContent.trim() === ball && x.getAttribute('aria-pressed') !== 'true' && !x.classList.contains('on'));
        if (b && ball) later('m:' + ball, rnd(800, 4000), () => { const x = [...document.querySelectorAll('#card button[data-k]')].find(y => y.textContent.trim() === ball); if (x && x.getAttribute('aria-pressed') !== 'true') x.click(); });   /* кнопки перемальовуються — шукаємо знову */
        const sk = $('#skob'); if (vis(sk)) later('bingo:' + ball, rnd(500, 2500), () => { const x = $('#skob'); if (x && !x.disabled) x.click(); });
        return;
      }
      /* Опитування */
      const opts = document.querySelectorAll('#body button[data-v]');
      if (opts.length && vis(opts[0]) && ![...opts].some(x => x.getAttribute('aria-pressed') === 'true')) { const k = 'v:' + document.body.innerText.slice(0, 80); const o = Math.floor(Math.random() * opts.length); later(k, rnd(1000, 5000), () => { const x = document.querySelectorAll('#body button[data-v]')[o]; if (x) x.click(); }); return; }
      const w = $('#w'), send = $('#send'); if (w && vis(w) && vis(send) && !w.value) { const k = 'w:' + document.body.innerText.slice(0, 80); later(k, rnd(1500, 6000), () => { const w2 = $('#w'), s2 = $('#send'); if (w2 && s2) { fill(w2, WORDS[Math.floor(Math.random() * WORDS.length)]); s2.click(); } }); return; }
      /* Змаг: кнопка «Відповідаю!» — тисне не кожен і не одразу */
      const bz = $('#bz'); if (vis(bz)) { const k = 'bz:' + ($('#q') ? $('#q').textContent : ''); if (!done.has(k)) { done.add(k); if (Math.random() < 0.6) setTimeout(() => { if (vis(bz)) bz.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }, rnd(1500, 6000)); } }
    }, 600);
    return;
  }
  /* --- екран ведучого --- */
  let frames = [];
  window.REPETYTSIIA = function (urlFn, n) {
    if (frames.length) { frames.forEach(f => f.remove()); frames = []; return false; }
    const base = urlFn && urlFn(); if (!base) return null;
    for (let i = 0; i < (n || 4); i++) {
      const f = document.createElement('iframe');
      f.src = base + (base.includes('?') ? '&' : '?') + 'bot=' + i;
      f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1; f.title = 'Тестовий гравець';
      f.style.cssText = 'position:fixed;left:-2000px;top:0;width:360px;height:640px;border:0;opacity:0;pointer-events:none';
      document.body.appendChild(f); frames.push(f);
    }
    return true;
  };
  window.REPETYTSIIA_ON = () => frames.length > 0;
})();
