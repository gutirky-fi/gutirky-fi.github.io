/* shared/pult-host.js — пульт на боці ведучого (ноутбук).
   Підключається в кінці сторінки гутірки, після її основного скрипта і shared/qr.js.
   Гутірка має віддати об'єкт window.GUTIRKA:
     { id, title,
       state()  -> { index, total, title, next, note, elapsed, target, sections:[[назва, індекс],…] },
       next(), prev(), jump(i), resetTimer()? }
   і викликати подію  document.dispatchEvent(new CustomEvent('gutirka:slide'))  після зміни слайда. */
(function () {
  'use strict';
  const API = () => window.GUTIRKA;
  const PEER_LIBS = [
    'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.5/peerjs.min.js',
    'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js',
    'https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js'
  ].filter(Boolean);
  const STORE = 'gutirka.host', SITE_KEY = 'gutirka.site';

  const MSG = {
    idle: 'Пульт вимкнено.',
    starting: 'Створюємо підключення…',
    waiting: 'Очікуємо телефон. Скануйте QR-код або введіть код.',
    pending: 'Телефон просить доступ. Підтвердіть нижче.',
    connected: '● Телефон підключено. Можна керувати!',
    lost: 'Телефон відключився. Він підключиться сам, щойно з’явиться зв’язок.',
    offline: 'Немає зв’язку із сервером. Пробуємо знову…',
    error: 'Помилка пульта.'
  };

  let Peer = null, peer = null, code = '', key = '', stopped = true, status = 'idle', statusMsg = '';
  let ctrl = null, pending = null, retryT = 0, attempts = 0, seq = 0, wl = null, hbT = 0, slideT = 0, qrKey = '';
  const tokens = new Set(), unapproved = [];

  /* ---------- допоміжне ---------- */
  const rnd = n => { const b = new Uint32Array(1); crypto.getRandomValues(b); return b[0] % n; };
  const genCode = () => String(rnd(1000000)).padStart(6, '0');
  const genKey = () => Array.from(crypto.getRandomValues(new Uint8Array(10)), b => (b % 36).toString(36)).join('');
  const send = (rec, m) => { try { if (rec && rec.c && rec.c.open) rec.c.send(m); } catch (e) { /* ігноруємо */ } };
  const peerOpts = () => window.GUTIRKA_PEER_OPTS || {};
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = src; s.async = true;
      s.onload = res; s.onerror = () => { s.remove(); rej(new Error('load ' + src)); };
      document.head.appendChild(s);
    });
  }
  async function loadPeer() {
    try { if (window.parent !== window && window.parent.GUTIRKA_LOCAL_PEER) return window.parent.GUTIRKA_LOCAL_PEER; } catch (e) { /* інший сайт */ }   // «Репетиція»: пульт і гутірка в одній сторінці, звʼязок без інтернету
    if (window.Peer) return window.Peer;
    for (const u of PEER_LIBS) { try { await loadScript(u); if (window.Peer) return window.Peer; } catch (e) { /* пробуємо наступне джерело */ } }
    throw new Error('Не вдалося завантажити бібліотеку зв’язку. Перевірте інтернет.');
  }
  const persist = () => {
    try { sessionStorage.setItem(STORE, JSON.stringify({ on: !stopped, code, key, tokens: [...tokens] })); } catch (e) { /* ok */ }
  };
  /* Куди веде QR: 1) адреса пульта, яку ведучий вписав один раз; 2) вбудована адреса; 3) цей самий файл, якщо він на сайті. */
  let editSite = false;
  function pultSite() {
    const baked = window.GUTIRKA_PULT_URL || '';
    if (/^https:\/\//.test(baked) && location.protocol !== 'file:') return { url: baked, self: false, stored: false };   // на сайті — завжди вбудована адреса (вписана вручну стара адреса більше не заважає)
    try { const s = localStorage.getItem(SITE_KEY); if (s) return { url: s, self: false, stored: true }; } catch (e) { /* ok */ }
    if (/^https:\/\//.test(baked)) return { url: baked, self: false, stored: false };
    if (/^https?:$/.test(location.protocol)) return { url: location.origin + location.pathname, self: true, stored: false };
    return null;
  }
  function pultBase() { const s = pultSite(); return s ? s.url : ''; }
  async function wakeLock() {
    try {
      if (!stopped && ctrl && 'wakeLock' in navigator && !wl) {
        wl = await navigator.wakeLock.request('screen');
        wl.addEventListener('release', () => { wl = null; });
      }
    } catch (e) { wl = null; }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wakeLock(); });

  /* ---------- стан і інтерфейс ---------- */
  let btn, dlg, ask;
  const q = s => dlg && dlg.querySelector(s);
  function setStatus(s, msg) { status = s; statusMsg = msg || ''; paint(); }
  function paint() {
    if (btn) { const d = btn.querySelector('.pd-dot'); d.className = 'pd-dot ' + ({ connected: 'ok', error: 'bad', idle: '' }[status] === undefined ? 'warn' : { connected: 'ok', error: 'bad', idle: '' }[status]); }
    if (!dlg) return;
    dlg.dataset.st = status;
    const base = pultBase(), on = status !== 'idle' && status !== 'error';
    q('.pd-status span').textContent = (status === 'waiting' && !base) ? 'Очікуємо телефон. Введіть на ньому код.' : (statusMsg || MSG[status] || '');
    const url = base && code ? base + '?c=' + code + '&k=' + key : '';
    const ps = pultSite();
    const manual = base ? base.replace(/^https?:\/\//, '').replace(/\/$/, '') + (ps && ps.self ? '#pult' : '') : '';
    const showQr = on && url && (status !== 'connected' || dlg.classList.contains('more'));
    if (showQr && window.qrSvg) { if (qrKey !== url) { q('.pd-qr').innerHTML = window.qrSvg(url, 240); qrKey = url; } } else { q('.pd-qr').innerHTML = ''; qrKey = ''; }
    q('.pd-main').hidden = !(on && (status !== 'connected' || dlg.classList.contains('more')));
    q('.pd-or').innerHTML = base ? 'або відкрийте на телефоні <b class="pd-url"></b><br>і введіть код'
      : 'На телефоні відкрийте цей самий файл <b>gutirky.html</b>,<br>натисніть «📱 Цей телефон — пульт» і введіть код:';
    q('.pd-code').textContent = code ? code.slice(0, 3) + ' ' + code.slice(3) : '';
    if (q('.pd-url')) q('.pd-url').textContent = manual;
    q('.pd-site').hidden = !on || (!!base && !editSite);
    q('#pd-site-edit').hidden = !on || !base || editSite || !(ps && !ps.self);
    q('.pd-who').hidden = !(status === 'connected' && ctrl);
    if (ctrl) q('.pd-who b').textContent = ctrl.name || 'Телефон';
    q('#pd-more').hidden = status !== 'connected';
    q('#pd-kick').hidden = !ctrl;
    q('#pd-stop').hidden = status === 'idle';
    q('#pd-go').hidden = status !== 'idle' && status !== 'error';
  }
  function showAsk(rec) {
    ask.querySelector('b').textContent = rec.name || 'Телефон';
    ask.hidden = false;
  }
  const hideAsk = () => { if (ask) ask.hidden = true; };

  const CSS = `
#phone-mode .pd-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-left:7px;background:#6b7480;vertical-align:1px}
#phone-mode .pd-dot.ok{background:#3ee08f;box-shadow:0 0 8px #3ee08f}#phone-mode .pd-dot.warn{background:#ffc247}#phone-mode .pd-dot.bad{background:#ff5d5d}
#pult-dlg{position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(10,12,15,.88);font:16px/1.5 'Source Sans 3',system-ui,sans-serif;color:#f2f4f6}
#pult-dlg.on{display:flex}
#pult-dlg .pd-box{position:relative;width:min(460px,100%);max-height:96vh;overflow:auto;background:#1f2328;border:1px solid #3b4048;border-left:4px solid #2fd2c0;border-radius:18px;padding:22px 22px 18px;box-shadow:0 24px 90px #000a}
#pult-dlg h2{font:600 22px/1.15 Oswald,'Arial Narrow',sans-serif;letter-spacing:.06em;text-transform:uppercase;margin:0 36px 12px 0}
#pult-dlg .pd-x{position:absolute;right:12px;top:10px;width:38px;height:38px;border-radius:50%;border:1px solid #3b4048;background:#272b31;color:#fff;font-size:22px;cursor:pointer}
#pult-dlg .pd-status{display:flex;gap:10px;align-items:center;padding:9px 14px;border-radius:12px;background:#272b31;border:1px solid #3b4048;font-weight:600;font-size:15px}
#pult-dlg .pd-status i{flex:none;width:10px;height:10px;border-radius:50%;background:#6b7480}
#pult-dlg[data-st=connected] .pd-status i{background:#3ee08f;box-shadow:0 0 8px #3ee08f}
#pult-dlg[data-st=waiting] .pd-status i,#pult-dlg[data-st=pending] .pd-status i,#pult-dlg[data-st=starting] .pd-status i,#pult-dlg[data-st=lost] .pd-status i,#pult-dlg[data-st=offline] .pd-status i{background:#ffc247;animation:pdp 1.2s infinite}
#pult-dlg[data-st=error] .pd-status i{background:#ff5d5d}
@keyframes pdp{50%{opacity:.35}}
#pult-dlg .pd-main{text-align:center;margin:14px 0 4px}
#pult-dlg .pd-qr{display:inline-block;line-height:0;border-radius:18px;box-shadow:0 0 0 1px rgba(98,207,147,.35),0 0 28px -6px rgba(61,175,110,.45)}
#pult-dlg .pd-qr:empty{display:none}
#pult-dlg .pd-or{font-size:14px;color:#b7bfc9;margin:10px 0 2px}
#pult-dlg .pd-or b{color:#f2f4f6;word-break:break-all}
#pult-dlg .pd-code{font:600 44px/1.1 Oswald,'Arial Narrow',sans-serif;letter-spacing:.14em;color:#62cf93}
#pult-dlg .pd-link{display:block;margin:8px auto 0;background:none;border:0;color:#98a1ac;text-decoration:underline;font:14px 'Source Sans 3',system-ui,sans-serif;cursor:pointer}
#pult-dlg .pd-site{margin:12px 0;font-size:14px;color:#b7bfc9}
#pult-dlg .pd-site input{display:block;width:100%;margin:6px 0;padding:10px 12px;border-radius:10px;border:1px solid #4a515b;background:#14171a;color:#fff;font-size:15px}
#pult-dlg .pd-who{margin:14px 0 4px;padding:12px 14px;border-radius:12px;background:#1d3a35;border:1px solid #2c6a5e}
#pult-dlg .pd-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
#pult-dlg .pd-b{padding:10px 14px;border-radius:12px;border:1px solid #4a515b;background:#2b3037;color:#fff;font:600 15px 'Source Sans 3',system-ui,sans-serif;cursor:pointer}
#pult-dlg .pd-b.go{background:#3daf6e;border-color:#3daf6e;color:#0e1f15}
#pult-dlg .pd-b:hover{filter:brightness(1.15)}
#pult-dlg .pd-tip{font-size:13px;color:#98a1ac;margin:8px 0 0}
#pult-dlg .pd-det{margin-top:12px;font-size:13px;color:#98a1ac}
#pult-dlg .pd-det summary{cursor:pointer;width:max-content}
#pult-dlg .pd-det .pd-link{margin:6px 0 0}
#pult-dlg .pd-main{margin:18px 0 6px}
#pult-dlg .pd-or{margin:14px 0 2px}
#pult-ask{position:fixed;z-index:70;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(520px,calc(100% - 24px));padding:14px 16px;border-radius:16px;background:#1f2328;border:1px solid #3daf6e;box-shadow:0 12px 50px #000c;color:#f2f4f6;font:16px/1.45 'Source Sans 3',system-ui,sans-serif}
#pult-ask[hidden]{display:none}
#pult-ask div{display:flex;gap:8px;margin-top:10px}
#pult-ask button{flex:1;padding:11px;border-radius:12px;border:1px solid #4a515b;background:#2b3037;color:#fff;font:600 15px 'Source Sans 3',system-ui,sans-serif;cursor:pointer}
#pult-ask button.ok{background:#3daf6e;border-color:#3daf6e;color:#0e1f15}`;

  function buildUi() {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    btn = document.getElementById('phone-mode');
    if (!btn) { btn = document.createElement('button'); btn.id = 'phone-mode'; btn.type = 'button'; (document.getElementById('app') || document.body).appendChild(btn); }
    btn.innerHTML = '📱 Пульт<i class="pd-dot"></i>';
    btn.setAttribute('aria-label', 'Керування презентацією з телефона');
    dlg = document.createElement('div'); dlg.id = 'pult-dlg'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'pd-ttl');
    dlg.innerHTML = `<div class="pd-box">
      <button class="pd-x" type="button" aria-label="Закрити">×</button>
      <h2 id="pd-ttl">📱 Пульт на телефоні</h2>
      <div class="pd-status"><i></i><span></span></div>
      <div class="pd-who" hidden>Керує: <b></b></div>
      <div class="pd-main" hidden>
        <div class="pd-qr"></div>
        <div class="pd-or">або відкрийте <b class="pd-url"></b> і введіть код</div>
        <div class="pd-code"></div>
      </div>
      <div class="pd-site" hidden>Щоб зʼявився QR-код, вставте адресу сторінки пульта (зазвичай <b>https://gutirky-fi.github.io/pult/</b>):
        <input type="url" id="pd-site" placeholder="https://gutirky-fi.github.io/pult/" autocomplete="off" spellcheck="false">
        <button class="pd-b" id="pd-site-save" type="button">Зберегти адресу</button></div>
      <div class="pd-row">
        <button class="pd-b go" id="pd-go" type="button">Створити підключення</button>
        <button class="pd-b" id="pd-more" type="button" hidden>Підключити інший телефон</button>
        <button class="pd-b" id="pd-kick" type="button" hidden>Від’єднати телефон</button>
        <button class="pd-b" id="pd-stop" type="button">Зупинити пульт</button>
      </div>
      <details class="pd-det"><summary>Докладніше</summary>
        <p class="pd-tip">Потрібен інтернет на ноутбуці й телефоні (для самої гутірки інтернет не потрібен). Не закривайте цю вкладку під час гутірки.</p>
        <button class="pd-link" id="pd-site-edit" type="button" hidden>Змінити адресу пульта</button></details></div>`;
    document.body.appendChild(dlg);
    ask = document.createElement('div'); ask.id = 'pult-ask'; ask.hidden = true; ask.setAttribute('role', 'alertdialog');
    ask.innerHTML = '<span>📱 Телефон «<b></b>» просить доступ до пульта. Це ваш телефон?</span><div><button class="ok" type="button" data-a="y">Дозволити</button><button type="button" data-a="n">Відхилити</button></div>';
    document.body.appendChild(ask);

    btn.addEventListener('click', openDlg);
    dlg.addEventListener('click', e => { if (e.target === dlg) closeDlg(); });
    dlg.addEventListener('keydown', e => { if (e.key !== 'Escape') e.stopPropagation(); });
    q('.pd-x').addEventListener('click', closeDlg);
    q('#pd-go').addEventListener('click', () => start(true));
    q('#pd-stop').addEventListener('click', stop);
    q('#pd-kick').addEventListener('click', () => { if (ctrl) { send(ctrl, { t: 'deny', r: 'kicked' }); const c = ctrl; ctrl = null; try { c.c.close(); } catch (e) { /* ok */ } setStatus('waiting'); } });
    q('#pd-site-edit').addEventListener('click', () => { editSite = true; const s = pultSite(); q('#pd-site').value = s && !s.self ? s.url : ''; paint(); });
    q('#pd-more').addEventListener('click', () => { dlg.classList.add('more'); paint(); });
    q('#pd-site-save').addEventListener('click', () => {
      const v = q('#pd-site').value.trim();
      if (!/^https:\/\/[^\s/]+/i.test(v)) { q('#pd-site').style.borderColor = '#ff5d5d'; return; }
      let u = v.replace(/[?#].*$/, ''); if (/^https:\/\/[^/]+$/i.test(u)) u += '/';
      try { localStorage.setItem(SITE_KEY, u); } catch (e) { /* ok */ }
      editSite = false;
      qrKey = ''; paint();
    });
    ask.addEventListener('click', e => {
      const a = e.target.closest('button'); if (!a || !pending) return;
      const rec = pending;
      if (a.dataset.a === 'y') accept(rec); else { pending = null; hideAsk(); deny(rec, 'declined'); setStatus(ctrl ? 'connected' : 'waiting'); }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && dlg.classList.contains('on')) { e.stopImmediatePropagation(); e.preventDefault(); closeDlg(); }
      else if (dlg.classList.contains('on') && !dlg.contains(e.target)) { e.stopImmediatePropagation(); }
    }, true);
    paint();
  }
  function openDlg() { dlg.classList.add('on'); dlg.classList.remove('more'); if (status === 'idle') start(true); paint(); }
  function closeDlg() { dlg.classList.remove('on'); }

  /* ---------- сигнальне з'єднання (PeerJS) ---------- */
  async function start(fresh) {
    if (peer && !peer.destroyed) { paint(); return; }
    stopped = false; setStatus('starting');
    try { Peer = await loadPeer(); } catch (e) { setStatus('error', e.message); return; }
    if (stopped) return;
    if (fresh || !code) { code = genCode(); key = genKey(); tokens.clear(); }
    persist(); create();
  }
  function retryLater(fn, base) {
    clearTimeout(retryT);
    const d = Math.min(15000, (base || 1000) * Math.pow(1.6, attempts++));
    retryT = setTimeout(() => { if (!stopped) fn(); }, d);
  }
  function create() {
    let p;
    try { p = new Peer('gutirka-' + code, peerOpts()); } catch (e) { setStatus('error', 'Не вдалося створити підключення: ' + e.message); return; }
    peer = p;
    p.on('open', () => { if (peer !== p) return; attempts = 0; setStatus(ctrl ? 'connected' : 'waiting'); persist(); });
    p.on('connection', c => { if (peer === p) onConn(c); });
    p.on('disconnected', () => {
      if (peer !== p || stopped) return;
      setStatus('offline');
      retryLater(() => { if (peer === p && !p.destroyed) { try { p.reconnect(); } catch (e) { peer = null; create(); } } });
    });
    p.on('close', () => { if (peer !== p || stopped) return; peer = null; setStatus('offline'); retryLater(create); });
    p.on('error', err => {
      if (peer !== p || stopped) return;
      const ty = err && err.type;
      if (ty === 'unavailable-id') {
        try { p.destroy(); } catch (e) { /* ok */ }
        peer = null;
        if (tokens.size && attempts < 4) { retryLater(create, 1500); return; }   // після перезавантаження сторінки старий код ще може бути зайнятий
        if (attempts > 8) { setStatus('error', 'Не вдалося зайняти код. Натисніть «Створити підключення».'); return; }
        attempts++; code = genCode(); key = genKey(); tokens.clear(); persist(); setTimeout(create, 200); return;
      }
      if (ty === 'browser-incompatible') { setStatus('error', 'Цей браузер не підтримує пульт. Скористайтеся Chrome.'); return; }
      setStatus('offline', ty ? 'Помилка зв’язку (' + ty + '). Пробуємо знову…' : '');
      retryLater(() => {
        if (peer === p && !p.destroyed) { if (p.disconnected) { try { p.reconnect(); } catch (e) { /* ok */ } } }
        else if (!peer) create();
      });
    });
  }
  function stop() {
    stopped = true; clearTimeout(retryT); clearInterval(hbT); hbT = 0;
    const c = ctrl; ctrl = null; pending = null; hideAsk();
    if (c) { send(c, { t: 'deny', r: 'stopped' }); try { c.c.close(); } catch (e) { /* ok */ } }
    try { if (peer) peer.destroy(); } catch (e) { /* ok */ }
    peer = null; tokens.clear(); code = ''; key = ''; qrKey = ''; attempts = 0;
    try { if (wl) wl.release(); } catch (e) { /* ok */ } wl = null;
    try { sessionStorage.removeItem(STORE); } catch (e) { /* ok */ }
    if (dlg) dlg.classList.remove('more');
    setStatus('idle');
  }

  /* ---------- підключення телефонів ---------- */
  function onConn(c) {
    const rec = { c, authed: false, waiting: false, t: Date.now(), name: '', tmo: 0 };
    rec.tmo = setTimeout(() => { if (!rec.authed && !rec.waiting) { try { c.close(); } catch (e) { /* ok */ } } }, 10000);
    c.on('data', d => onData(rec, d));
    c.on('close', () => gone(rec));
    c.on('error', () => gone(rec));
  }
  function deny(rec, r) { send(rec, { t: 'deny', r }); clearTimeout(rec.tmo); setTimeout(() => { try { rec.c.close(); } catch (e) { /* ok */ } }, 250); }
  function onData(rec, d) {
    if (!d || typeof d !== 'object') return;
    if (d.t === 'hello') return hello(rec, d);
    if (!rec.authed) return;
    rec.t = Date.now();
    if (d.t === 'ping') send(rec, { t: 'pong', n: d.n });
    else if (d.t === 'sync') pushState(rec);
    else if (d.t === 'cmd') command(rec, d);
  }
  function hello(rec, d) {
    if (rec.authed || rec.waiting) return;
    if (d.v !== 1) return deny(rec, 'version');
    rec.name = String(d.name || 'Телефон').slice(0, 60);
    if ((d.token && tokens.has(d.token)) || (d.key && d.key === key)) return accept(rec, d.token);
    const now = Date.now(); while (unapproved.length && now - unapproved[0] > 60000) unapproved.shift();
    if (unapproved.length >= 5 || (pending && pending !== rec)) return deny(rec, 'busy');
    unapproved.push(now);
    pending = rec; rec.waiting = true; clearTimeout(rec.tmo);
    send(rec, { t: 'wait' });
    if (status !== 'connected') setStatus('pending');
    showAsk(rec);
  }
  function accept(rec, tok) {
    clearTimeout(rec.tmo); rec.authed = true; rec.waiting = false; rec.t = Date.now();
    if (pending === rec) { pending = null; hideAsk(); }
    const token = tok && tokens.has(tok) ? tok : Array.from(crypto.getRandomValues(new Uint8Array(12)), b => (b % 36).toString(36)).join('');
    tokens.add(token); persist();
    if (ctrl && ctrl !== rec) { send(ctrl, { t: 'deny', r: 'replaced' }); const o = ctrl; ctrl = null; try { o.c.close(); } catch (e) { /* ok */ } }
    ctrl = rec;
    send(rec, { t: 'welcome', token, g: { id: 'library', title: 'Бібліотека гутірок' } });
    setStatus('connected'); pushState(rec); wakeLock();
    if (!hbT) hbT = setInterval(heartbeat, 5000);
  }
  function gone(rec) {
    clearTimeout(rec.tmo);
    if (pending === rec) { pending = null; hideAsk(); if (status === 'pending') setStatus(ctrl ? 'connected' : 'waiting'); }
    if (ctrl === rec) { ctrl = null; if (!stopped) setStatus('lost'); }
  }
  function heartbeat() {
    if (ctrl && Date.now() - ctrl.t > 14000) { const c = ctrl; ctrl = null; try { c.c.close(); } catch (e) { /* ok */ } if (!stopped) setStatus('lost'); }
    else if (ctrl) pushState();
  }
  function pushState(rec) {
    rec = rec || ctrl; if (!rec) return;
    const a = API();
    if (!a) { send(rec, { t: 'state', n: ++seq, idle: true }); return; }
    let s; try { s = a.state(); } catch (e) { return; }
    const SK = window.SKOB;   // «Потужний СКОБ!» відкрито — пульт керує грою
    try { if (SK && SK.view && SK.active()) s = Object.assign({}, s, { ix: { v: 'skob', s: SK.view() } }); } catch (e) { /* ok */ }
    send(rec, Object.assign({ t: 'state', n: ++seq, gtitle: a.title }, s));
  }
  function command(rec, d) {
    if (rec !== ctrl) return;
    const a = API(); if (!a) { pushState(rec); return; }
    if (d.a === 'timer-reset') { if (a.resetTimer) a.resetTimer(); pushState(); return; }
    if (d.a === 'asset' && typeof d.id === 'string' && a.asset) {   // картинки для пульта (міні-карта, мініатюри фото): надсилаємо на запит телефона
      Promise.resolve(a.asset(d.id)).then(v => { if (v != null) send(rec, { t: 'asset', id: d.id, v }); }).catch(() => {}); return;
    }
    const SK = window.SKOB;
    if (SK && SK.cmd && ((d.a === 'act' && typeof d.id === 'string' && d.id.startsWith('skob:')) || ((d.a === 'next' || d.a === 'prev') && SK.active()))) {
      if (d.a === 'act') SK.cmd(d.id.slice(5)); else if (d.a === 'next') SK.cmd('next');   // «Назад» під час гри нічого не робить
      clearTimeout(slideT); slideT = setTimeout(() => pushState(), 40); return;
    }
    let cur = -1; try { cur = a.state().index; } catch (e) { /* ok */ }
    if (typeof d.from === 'number' && d.from !== cur) { pushState(rec); return; }   // застаріла команда: телефон відстав
    if (d.a === 'next') a.next(); else if (d.a === 'prev') a.prev();
    else if (d.a === 'jump' && Number.isInteger(d.i)) a.jump(d.i);
    else if (d.a === 'act' && typeof d.id === 'string' && a.act) a.act(d.id);   // інтерактив гутірки: області, точки, фото (якщо гутірка вміє)
    clearTimeout(slideT); slideT = setTimeout(() => pushState(), 40);
  }
  document.addEventListener('gutirka:slide', () => { clearTimeout(slideT); slideT = setTimeout(() => pushState(), 30); });
  document.addEventListener('skob:state', () => { clearTimeout(slideT); slideT = setTimeout(() => pushState(), 30); });
  addEventListener('online', () => {
    if (stopped) return;
    attempts = 0;
    if (!peer) create(); else if (peer.disconnected && !peer.destroyed) { try { peer.reconnect(); } catch (e) { /* ok */ } }
  });
  addEventListener('pagehide', () => { try { if (peer) peer.destroy(); } catch (e) { /* ok */ } });

  /* ---------- запуск ---------- */
  function init() {
    buildUi();
    window.GutirkaPult = { open: openDlg, close: closeDlg, start, stop, get status() { return status; }, get code() { return code; }, get key() { return key; } };
    let saved = null; try { saved = JSON.parse(sessionStorage.getItem(STORE) || 'null'); } catch (e) { /* ok */ }
    if (saved && saved.on && /^\d{6}$/.test(saved.code || '')) {   // сторінку перезавантажили під час гутірки: пульт відновлюється сам
      code = saved.code; key = saved.key || genKey(); (saved.tokens || []).forEach(t => tokens.add(t));
      start(false);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
