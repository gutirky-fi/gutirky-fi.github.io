/* Оболонка файлу gutirky.html: бібліотека, перемикання видів, пульт на телефоні (PeerJS). */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cut = (s, n) => { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };

  /* ---------------- вбудовані гутірки ---------------- */
  const BUILTIN = [{
    key: 'keramika', title: 'Кераміка України', icon: '🏺', accent: '#e8925b',
    desc: 'Подорож картою України: що таке кераміка, як її роблять, історія по епохах, девʼять регіонів із виробами, запитання до залу та вікторина на карті.',
    tags: ['кераміка', 'народні ремесла', 'історія', 'карта', 'вишкіл'],
    vars: [
      { mode: 'full', label: 'Повна гутірка', who: 'Юнацтво, 12–17 років', dur: '45–50 хв', accent: '#e8925b' },
      { mode: 'short', label: 'Вишкіл', who: 'Виховники, малі групи', dur: 'до 20 хв', accent: '#ffc247' }
    ]
  }, {
    key: 'budova-la-1', proba: true, title: 'Будова літальних апаратів І', icon: '✈️', accent: '#6fb3ff',   // proba — лише в копії для показу (PREVIEW=1), доки власник не погодить
    desc: 'Гутірка точно за вимогами вмілості (Летунська, проба 1): види ЛА, частини літака, профіль крила й підйомна сила, тангаж, крен і рискання на 3D-літачку, п’ять аеродинамічних схем. Наприкінці — гра «Потужний СКОБ!» з телефонів. Після гутірки юнаки отримують посилання, щоб повторити матеріал і перевірити себе.',
    tags: ['авіація', 'літаки', 'летунська', 'гра з телефонів', 'для юнацтва'],
    vars: [   /* href — гутірка на окремій сторінці сайту; dod — додаток для виховника (план), yun — посилання для юнаків; обидва не рахуються як версії */
      { href: 'gutirky/budova-la-1/#hutirka', label: 'Гутірка', who: 'Юнацтво, 12–17 років', dur: '40–45 хв', accent: '#6fb3ff' },
      { href: 'gutirky/budova-la-1/#plan', label: 'План гутірки', who: 'Що казати на кожному слайді', dur: 'друк / PDF', accent: '#ffc247', dod: true },
      { href: 'gutirky/budova-la-1/#yunakam', label: 'Для юнаків', who: 'Вивчай сам і Перевір себе', dur: 'QR-код', accent: '#c8284a', yun: true }
    ]
  }, {
    key: 'keramika-1', proba: true, title: 'Кераміка І', icon: '🏺', accent: '#e8925b',   // proba — лише в копії для показу (PREVIEW=1), доки власник не погодить
    desc: 'Гутірка точно за вимогами вмілості «Кераміка І» (Мистецька, проба 1): історія виробів з глини, зокрема в Україні; техніки формотворення від ліплення до пресування; шість видів кераміки з грою «Вгадай вид»; музей і три вироби власноруч. 3D-ваза на гончарному крузі, запитання після кожної вимоги, гра «Потужний СКОБ!» з телефонів. «Кераміка України» лишається окремою — як історична подорож картою.',
    tags: ['кераміка', 'мистецька', 'гончарство', 'гра з телефонів', 'для юнацтва'],
    vars: [
      { href: 'gutirky/keramika-1/#hutirka', label: 'Гутірка', who: 'Юнацтво, 12–17 років', dur: '45 хв', accent: '#e8925b' },
      { href: 'gutirky/keramika-1/#plan', label: 'План гутірки', who: 'Що казати на кожному слайді', dur: 'друк / PDF', accent: '#ffc247', dod: true },
      { href: 'gutirky/keramika-1/#yunakam', label: 'Для юнаків', who: 'Вивчай сам і Перевір себе', dur: 'QR-код', accent: '#c8284a', yun: true }
    ]
  }].filter(b => !b.proba || window.GUTIRKA_PREVIEW);
  const MODE_LABEL = { full: 'ПОВНА ГУТІРКА · 45–50 ХВ', short: 'ВИШКІЛ · ДО 20 ХВ' };

  /* ---------------- види ---------------- */
  let VIEW = 'lib', CUR = 0, curMode = null, INST = null;
  const V = { lib: $('#lib'), pv: $('#pv'), g: $('#gv') };
  window.__alive = t => t === CUR && VIEW === 'g';
  const slideEvt = () => document.dispatchEvent(new CustomEvent('gutirka:slide'));
  function setView(v) {
    /* у копії для макета (HOME_URL у build.py) бібліотеки немає: «Бібліотека» веде назад у макет */
    if (v === 'lib' && window.GUTIRKA_HOME) { location.replace(window.GUTIRKA_HOME.href); return; }
    VIEW = v;
    for (const k in V) V[k].hidden = k !== v;
    document.body.classList.toggle('v-g', v === 'g');
    document.body.classList.remove('idle');
    if (v !== 'g') { const hs = $('#hs'); if (hs) hs.classList.remove('on'); try { window.GutirkaPult && window.GutirkaPult.close(); } catch (e) { /* ok */ } }
    window.GUTIRKA = v === 'g' ? INST : null;      // пульт керує лише відкритою гутіркою
    if (v === 'pv') pultEnter(); else releaseWake();
    slideEvt();
  }
  function openG(mode) {
    if (curMode === mode && INST) {
      setView('g');
      try { INST.refit && INST.refit(); } catch (e) { /* ok */ }
      return;
    }
    CUR++; curMode = mode;
    $('#hs').classList.remove('on');
    const pan = $('#pan'); pan.className = ''; pan.innerHTML = '';
    $('#hint').textContent = '';
    $('#mode-label').textContent = MODE_LABEL[mode] || '';
    document.body.classList.remove('t0');
    INST = null; window.GUTIRKA = null;
    setView('g');
    window.startGutirka(mode, CUR);
    INST = window.GUTIRKA;
    slideEvt();
    peekCorner(2500);   // на старті показати, де меню
  }
  /* ---------------- кутове меню гутірки ---------------- */
  const corner = $('#corner');
  let cornerT = 0;
  function peekCorner(ms) { corner.classList.add('open'); corner.dataset.user = ''; clearTimeout(cornerT); cornerT = setTimeout(() => corner.classList.remove('open'), ms); }
  $('#hot').addEventListener('click', () => { clearTimeout(cornerT); corner.dataset.user = corner.classList.toggle('open') ? '1' : ''; });   // для сенсорного екрана
  /* Сенсорний екран: дотик лівої третини екрана — назад, решти — далі (свайп теж працює).
     Не спрацьовує на кнопках і посиланнях, у меню, змісті й пульті, коли відкрите меню в куті.
     Гутірка може позначити, що дотик потрібен їй самій:
       data-tap  — завжди (наприклад, області на карті у вікторині);
       data-pick — лише в середній третині екрана (області, які можна обирати на огляді й у фіналі),
                   а з країв дотик однаково гортає.
     Гортання йде тими самими клавішами ← →, тож працює з будь-якою гутіркою. */
  (() => {
    const SKIP = 'button,a,input,select,textarea,label,summary,[role=button],[data-j],[data-n],[data-tap],#corner,#cmenu,#pult-dlg,#pult-ask,#hs';
    const fx = document.createElement('div'); fx.id = 'tapfx'; fx.setAttribute('aria-hidden', 'true'); document.body.appendChild(fx);
    let st = null, eat = false, fxT = 0;
    addEventListener('pointerdown', e => {
      st = null;
      if (VIEW !== 'g' || e.pointerType === 'mouse' || !e.isPrimary) return;
      const menuOpen = corner.classList.contains('open') && corner.dataset.user === '1';
      const overlay = document.querySelector('#hs.on, #pult-dlg.on, #pult-ask:not([hidden])');
      if (menuOpen || overlay) return;              // спершу закрити відкрите — без гортання
      st = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId, el: e.target };
    }, true);
    addEventListener('pointercancel', () => { st = null; }, true);
    addEventListener('pointerup', e => {
      const s = st; st = null;
      if (!s || e.pointerId !== s.id || VIEW !== 'g') return;
      if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > 12 || Date.now() - s.t > 700) return;   // свайп чи прокрутка, а не дотик
      if (s.el.closest && s.el.closest(SKIP)) return;
      const x = e.clientX / innerWidth;
      if (x >= 1 / 3 && x <= 2 / 3 && s.el.closest && s.el.closest('[data-pick]')) return;   // посередині — обрати область
      const dir = x < 1 / 3 ? -1 : 1;
      eat = true; setTimeout(() => { eat = false; }, 600);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: dir > 0 ? 'ArrowRight' : 'ArrowLeft', bubbles: true, cancelable: true }));
      fx.className = dir > 0 ? 'r on' : 'l on'; clearTimeout(fxT); fxT = setTimeout(() => { fx.className = dir > 0 ? 'r' : 'l'; }, 140);
    }, true);
    addEventListener('click', e => { if (eat) { eat = false; e.stopPropagation(); e.preventDefault(); } }, true);   // той самий дотик не відкриває область на карті
  })();
  document.addEventListener('pointerdown', e => {
    document.body.classList.toggle('touchmode', e.pointerType === 'touch');   // на дотику меню відкривається лише натисканням, а не «наведенням»
    if (!corner.contains(e.target)) { clearTimeout(cornerT); corner.classList.remove('open'); }
  }, true);
  $('#cmenu').addEventListener('click', e => {
    const b = e.target.closest('button,a'); if (!b) return;
    if (!b.closest('.cm-nav')) { clearTimeout(cornerT); corner.classList.remove('open'); }
    if (e.detail > 0) setTimeout(() => { try { b.blur(); } catch (er) { /* ok */ } }, 0);   // після кліку мишкою меню не «залипає»
  });
  /* на малих екранах текстова панель гортається: новий слайд — з початку, щойно відкритий пункт — у видиму частину */
  (() => {
    const pan = $('#pan'); if (!pan || !window.MutationObserver) return;
    new MutationObserver(ms => {
      for (const m of ms) {
        if (m.type === 'childList' && m.target === pan) { pan.scrollTop = 0; continue; }
        const el = m.target;
        if (m.type === 'attributes' && el.classList && el.classList.contains('v') && pan.scrollHeight > pan.clientHeight + 2) {
          try { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { /* ok */ }
        }
      }
    }).observe(pan, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  })();
  const fsBtn = $('#fs-btn');
  const fsLabel = () => { fsBtn.textContent = document.fullscreenElement ? '🗗 Вийти з повного екрана' : '⛶ На весь екран'; };
  fsBtn.addEventListener('click', () => {
    try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) { /* ok */ }
  });
  document.addEventListener('fullscreenchange', fsLabel);
  if (!document.documentElement.requestFullscreen) fsBtn.hidden = true;

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-lib],[data-open],[data-pult]');
    if (!t) return;
    e.preventDefault(); e.stopPropagation();
    if (t.hasAttribute('data-lib')) setView('lib');
    else if (t.dataset.open) openG(t.dataset.open);
    else setView('pv');
  }, true);

  /* ---------------- бібліотека ---------------- */
  const LKEY = 'gutirky.links.v1';
  let links = store.get(LKEY, []), tag = '';
  const okHref = u => /^https:\/\/[^\s]+$/i.test(u) || /^[\w\-. %()а-яіїєґʼ'/]+\.html?$/i.test(u);
  links = Array.isArray(links) ? links.filter(l => l && typeof l.title === 'string' && okHref(l.url || '')) : [];
  function allItems() {
    return BUILTIN.map(b => ({ kind: 'b', b, text: (b.title + ' ' + b.desc + ' ' + b.tags.join(' ') + ' ' + b.vars.map(v => v.label + ' ' + v.who + ' ' + v.dur).join(' ')).toLowerCase(), tags: b.tags }))
      .concat(links.map((l, k) => ({ kind: 'l', l, k, text: (l.title + ' ' + (l.desc || '')).toLowerCase(), tags: [] })));
  }
  function cardB(b) {
    const vars = b.vars.map(v => `<button class="var" type="button" data-open="${v.mode}" style="--a:${v.accent}">
        <span>${esc(v.label)}<span class="who">${esc(v.who)}</span></span><small>${esc(v.dur)} ›</small></button>`).join('');
    return `<article class="card" style="--a:${b.accent}"><span class="ic" aria-hidden="true">${b.icon}</span>
      <span class="kind">${b.vars.length} версії</span><h2>${esc(b.title)}</h2><p>${esc(b.desc)}</p>
      <div class="tags">${b.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div><div class="vars">${vars}</div></article>`;
  }
  function cardL(l, k) {
    const ext = /^https:/i.test(l.url);
    return `<article class="card link" style="--a:#8fae63"><span class="ic" aria-hidden="true">📜</span>
      <span class="kind">${ext ? 'Гутірка за посиланням' : 'Гутірка з файлу'}</span><h2>${esc(l.title)}</h2>${l.desc ? `<p>${esc(l.desc)}</p>` : ''}
      <div class="vars"><a class="var" href="${esc(l.url)}" ${ext ? 'target="_blank" rel="noopener noreferrer"' : ''}><span>Відкрити<span class="who">${esc(ext ? l.url.replace(/^https:\/\//, '').slice(0, 40) : l.url)}</span></span><small>${ext ? '↗' : '›'}</small></a></div>
      <button class="del" type="button" data-del="${k}">Прибрати</button></article>`;
  }
  function renderLib() {
    const items = allItems();
    const tags = [...new Set(items.flatMap(i => i.tags))];
    const chips = $('#l-chips'), sig = tags.join('|');
    if (chips.dataset.sig !== sig) {
      chips.dataset.sig = sig; chips.innerHTML = '';
      if (tags.length > 1) ['', ...tags].forEach(t => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t || 'Усі'; b.dataset.t = t; chips.appendChild(b); });
    }
    [...chips.children].forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === tag)));
    const q = $('#l-q').value.trim().toLowerCase();
    const list = items.filter(i => (!q || i.text.includes(q)) && (!tag || i.tags.includes(tag)));
    $('#l-grid').innerHTML = list.map(i => i.kind === 'b' ? cardB(i.b) : cardL(i.l, i.k)).join('');
    $('#l-empty').hidden = list.length > 0;
  }
  $('#l-q').addEventListener('input', renderLib);
  $('#l-chips').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; tag = b.dataset.t || ''; renderLib(); });
  $('#l-grid').addEventListener('click', e => {
    const b = e.target.closest('[data-del]'); if (!b) return;
    if (!b.classList.contains('arm')) { b.classList.add('arm'); b.textContent = 'Точно прибрати? Натисніть ще раз'; setTimeout(() => { if (b.isConnected) { b.classList.remove('arm'); b.textContent = 'Прибрати'; } }, 4000); return; }
    links.splice(+b.dataset.del, 1); store.set(LKEY, links); renderLib();
  });
  if ($('#l-form')) $('#l-form').addEventListener('submit', e => {
    e.preventDefault();
    const msg = $('#l-msg'); msg.className = 'msg';
    const title = $('#l-title').value.trim(), url = $('#l-url').value.trim().replace(/^"|"$/g, ''), desc = $('#l-desc').value.trim();
    if (!title) { msg.className = 'msg bad'; msg.textContent = 'Вкажіть назву гутірки.'; return; }
    if (!okHref(url)) { msg.className = 'msg bad'; msg.textContent = 'Вставте посилання, що починається з https://, або назву файлу, що закінчується на .html'; return; }
    links.push({ title: cut(title, 80), url: cut(url, 400), desc: cut(desc, 200), addedAt: Date.now() });
    if (!store.set(LKEY, links)) { links.pop(); msg.className = 'msg bad'; msg.textContent = 'Браузер не дозволив зберегти. Спробуйте у звичайному (не приватному) вікні Chrome.'; return; }
    $('#l-form').reset(); msg.textContent = 'Додано ✔'; renderLib();
  });
  renderLib();

  /* ---------------- пульт на телефоні ---------------- */
  const PKEY = 'gutirka.pult.v1';
  const LIBS = ['https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.5/peerjs.min.js',
    'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js',
    'https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js'];
  let ses = store.get(PKEY, {}) || {};
  let Peer = null, peer = null, conn = null, att = 0, retryT = 0, hbT = 0, tries = 0, lastRx = 0, pingN = 0;
  let phase = 'entry', st = null, stAt = 0, wl = null, seen = -1, leaving = false, started = false;
  const show = n => { $('#p-entry').hidden = n !== 'entry'; $('#p-msg').hidden = n !== 'msg'; $('#p-pad').hidden = n !== 'pad'; };
  const chip = (s, t) => { const c = $('#p-chip'); c.dataset.s = s; $('#p-chiptxt').textContent = t; };
  const digits = s => String(s || '').replace(/\D/g, '');
  const fmt = c => c.length > 3 ? c.slice(0, 3) + ' ' + c.slice(3) : c;
  const f2 = n => { n = Math.max(0, Math.floor(n)); return String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0'); };
  const deviceName = () => { const u = navigator.userAgent; if (/iPhone/.test(u)) return 'iPhone'; if (/iPad/.test(u)) return 'iPad'; if (/Android/.test(u)) { const m = u.match(/;\s*([^;)]+?)\s+Build/); return m ? m[1].slice(0, 30) : 'Android'; } return 'Телефон'; };
  function showEntry(err) {
    phase = 'entry'; stopLink(); show('entry'); chip('', 'Не підключено');
    $('#p-err').textContent = err || ''; $('#p-code').value = '';
    const r = $('#p-resume'); if (ses.code) { r.hidden = false; r.textContent = 'Продовжити з кодом ' + fmt(ses.code); } else r.hidden = true;
  }
  function showMsg(big, h, p, retry) {
    show('msg'); $('#p-mbig').textContent = big; $('#p-mh').textContent = h; $('#p-mp').textContent = p || '';
    $('#p-mretry').hidden = !retry; $('#p-mcode').hidden = false;
  }
  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = () => { s.remove(); rej(new Error('load')); }; document.head.appendChild(s); }); }
  async function getPeer() { if (window.Peer) return window.Peer; for (const u of LIBS) { try { await loadScript(u); if (window.Peer) return window.Peer; } catch (e) { /* далі */ } } throw new Error('lib'); }
  function stopLink() {
    att++; clearTimeout(retryT); clearInterval(hbT); hbT = 0;
    const c = conn, p = peer; conn = null; peer = null;
    try { if (c) c.close(); } catch (e) { /* ok */ } try { if (p) p.destroy(); } catch (e) { /* ok */ }
    releaseWake();
  }
  function connect() {
    if (!ses.code) return showEntry();
    stopLink(); const my = att;
    phase = phase === 'ok' ? 'ok' : 'connecting';
    if (!st) showMsg('📡', 'Підключаємось…', 'Шукаємо ноутбук з кодом ' + fmt(ses.code) + '.'); else show('pad');
    chip('wait', tries ? 'Відновлюємо звʼязок…' : 'Підключаємось…');
    (async () => {
      try { Peer = await getPeer(); } catch (e) { if (my === att) fail('lib'); return; }
      if (my !== att) return;
      let p; try { p = new Peer(undefined, window.GUTIRKA_PEER_OPTS || {}); } catch (e) { fail('incompatible'); return; }
      peer = p; let opened = false;
      const tmo = setTimeout(() => { if (my === att && !opened) fail('timeout'); }, 14000);
      p.on('error', err => { if (my !== att) return; clearTimeout(tmo); const ty = err && err.type; fail(ty === 'peer-unavailable' ? 'notfound' : ty === 'browser-incompatible' ? 'incompatible' : 'net'); });
      p.on('open', () => {
        if (my !== att) return;
        const c = p.connect('gutirka-' + ses.code, { reliable: true }); conn = c;
        c.on('open', () => {
          if (my !== att) return; opened = true; clearTimeout(tmo); lastRx = Date.now();
          c.send({ t: 'hello', v: 1, name: deviceName(), key: ses.key || '', token: ses.token || '' });
          chip('wait', 'Чекаємо підтвердження…');
          clearTimeout(retryT); retryT = setTimeout(() => { if (my === att && phase !== 'ok') fail('nohello'); }, 25000);
        });
        c.on('data', d => { if (my === att) onData(d); });
        c.on('close', () => { if (my === att && !leaving) fail(phase === 'ok' ? 'lost' : 'closed'); });
        c.on('error', () => { if (my === att && !leaving) fail('net'); });
      });
    })();
  }
  function fail(reason) {
    const my = att; stopLink(); att = my + 1;
    if (leaving || VIEW !== 'pv') return;
    tries++;
    if (reason === 'incompatible') { showMsg('⚠️', 'Браузер не підтримується', 'Відкрийте сторінку в Chrome або Safari.'); chip('bad', 'Помилка'); return; }
    const why = { lib: 'Не вдалося завантажити звʼязок. Перевірте інтернет.', timeout: 'Сервер звʼязку не відповідає.', net: 'Немає звʼязку. Перевіряємо інтернет…', notfound: 'Ноутбук з кодом ' + fmt(ses.code) + ' не знайдено. Пульт на ноутбуці ввімкнено?', nohello: 'Ноутбук не відповів.', closed: 'Зʼєднання закрилося.', lost: 'Звʼязок втрачено.' }[reason];
    chip('wait', reason === 'lost' ? 'Звʼязок втрачено — відновлюємо…' : 'Пробуємо знову…');
    if (tries > 6 && st) st = null;
    if (st) { show('pad'); dim(true); }
    else showMsg('📡', tries > 2 ? 'Не виходить підключитись' : 'Підключаємось…', why + (tries > 2 ? ' Пробуємо ще, або введіть інший код.' : ''), tries > 2);
    retryT = setTimeout(connect, Math.min(10000, 800 * Math.pow(1.7, Math.min(tries, 8))));
  }
  function terminal(big, h, p, retry, clear) {
    stopLink(); att++; phase = 'dead';
    if (clear) { ses.token = ''; ses.key = ''; store.set(PKEY, ses); }
    st = null; dim(false); chip('bad', 'Не підключено'); showMsg(big, h, p, retry);
  }
  function onData(d) {
    if (!d || typeof d !== 'object') return;
    lastRx = Date.now();
    if (d.t === 'wait') { clearTimeout(retryT); chip('wait', 'Підтвердіть на ноутбуці'); showMsg('💻', 'Підтвердіть на ноутбуці', 'На ноутбуці зʼявилось питання «Це ваш телефон?». Натисніть «Дозволити».'); }
    else if (d.t === 'welcome') { clearTimeout(retryT); tries = 0; phase = 'ok'; ses.token = d.token || ses.token; ses.key = ''; store.set(PKEY, ses); chip('ok', 'Підключено'); startHb(); getWake(); if (st) { show('pad'); dim(false); } }
    else if (d.t === 'state') onState(d);
    else if (d.t === 'deny') {
      const r = d.r;
      if (r === 'declined') terminal('🚫', 'Ноутбук відхилив запит', 'Якщо це були ви — спробуйте ще раз і натисніть «Дозволити» на ноутбуці.', true, true);
      else if (r === 'busy') terminal('⏳', 'Ноутбук зайнятий', 'Там уже чекає інший запит. Зачекайте хвилину й спробуйте ще.', true, false);
      else if (r === 'replaced') terminal('📱', 'Керування перейняв інший телефон', 'Щоб повернути керування, підключіться знову.', true, false);
      else if (r === 'kicked') terminal('👋', 'Вас від’єднали', 'Ведучий від’єднав цей телефон на ноутбуці.', false, true);
      else if (r === 'stopped') terminal('⏹', 'Пульт вимкнено', 'На ноутбуці пульт зупинили. Увімкніть його знову й відскануйте новий QR-код.', false, true);
      else terminal('⚠️', 'Підключення відхилено', '', true, false);
    }
  }
  function startHb() {
    clearInterval(hbT);
    hbT = setInterval(() => { if (!conn || !conn.open) return; if (Date.now() - lastRx > 13000) { fail('lost'); return; } try { conn.send({ t: 'ping', n: ++pingN }); } catch (e) { /* ok */ } }, 4000);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || VIEW !== 'pv') return;
    getWake();
    if (phase === 'ok' || (phase === 'connecting' && st)) {
      if (!conn || !conn.open || Date.now() - lastRx > 9000) { tries = 0; connect(); } else { try { conn.send({ t: 'sync' }); } catch (e) { /* ok */ } }
    }
  });
  addEventListener('online', () => { if (VIEW === 'pv' && ses.code && phase !== 'entry' && phase !== 'ok' && phase !== 'dead') { tries = 0; connect(); } });
  async function getWake() { try { if ('wakeLock' in navigator && !wl && phase === 'ok' && VIEW === 'pv') { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); } } catch (e) { wl = null; } }
  function releaseWake() { try { if (wl) wl.release(); } catch (e) { /* ok */ } wl = null; }
  function dim(on) { $('#p-pad').classList.toggle('dim', on); $('#p-prev').disabled = on; $('#p-nextb').disabled = on; }
  function onState(d) {
    st = d; stAt = Date.now(); seen = d.idle ? -1 : d.index;
    if (phase !== 'ok') { phase = 'ok'; chip('ok', 'Підключено'); }
    if (d.idle) { showMsg('💻', 'Відкрийте гутірку на ноутбуці', 'Телефон підключено. Щойно на ноутбуці відкриєте гутірку, тут зʼявляться кнопки.'); $('#p-mcode').hidden = true; return; }
    show('pad'); dim(false); renderState();
  }
  function renderState() {
    if (!st || st.idle) return;
    $('#p-gname').textContent = st.gtitle || ses.title || '';
    $('#p-count').innerHTML = (st.index + 1) + ' <small>/ ' + st.total + '</small>';
    $('#p-bar').style.width = (st.total > 1 ? st.index / (st.total - 1) * 100 : 100) + '%';
    $('#p-steps').textContent = st.steps > 0 ? 'Пункт ' + Math.min(st.step, st.steps) + ' з ' + st.steps : '';
    $('#p-title').textContent = st.title || '';
    const nx = $('#p-next'); if (st.next) { nx.textContent = 'Далі: '; const b = document.createElement('b'); b.textContent = st.next; nx.appendChild(b); } else nx.textContent = 'Це останній слайд.';
    const n = $('#p-note'); n.textContent = st.note || 'Підказок для цього слайда немає.'; n.classList.toggle('empty', !st.note);
    $('#p-prev').disabled = st.index === 0 && !(st.step > 0);
    $('#p-nextb').disabled = st.index >= st.total - 1 && !(st.steps > 0 && st.step < st.steps);
    const wrap = $('#p-secs'), list = st.sections || [], sig = JSON.stringify(list);
    if (wrap.dataset.sig !== sig) { wrap.dataset.sig = sig; wrap.innerHTML = ''; list.forEach(([name, i]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = name; b.dataset.i = i; wrap.appendChild(b); }); }
    let cur = -1; list.forEach(([, i], k) => { if (i <= st.index) cur = k; });
    [...wrap.children].forEach((b, k) => b.classList.toggle('cur', k === cur));
    $('#p-secbox').hidden = !list.length;
    drawTimer();
  }
  function drawTimer() {
    if (!st || st.idle || VIEW !== 'pv') return;
    const el = (st.elapsed || 0) + (st.running === false ? 0 : Math.floor((Date.now() - stAt) / 1000));
    $('#p-ttxt').textContent = '⏱ ' + f2(el) + ' / ' + f2(st.target || 0);
    $('#p-timer').classList.toggle('over', !!st.target && el > st.target);
  }
  setInterval(drawTimer, 1000);
  function cmd(a, extra) {
    if (!conn || !conn.open || phase !== 'ok' || !st || st.idle) return;
    try { navigator.vibrate && navigator.vibrate(12); } catch (e) { /* ok */ }
    try { conn.send(Object.assign({ t: 'cmd', a, from: seen }, extra || {})); } catch (e) { /* ok */ }
  }
  $('#p-nextb').addEventListener('click', () => cmd('next'));
  $('#p-prev').addEventListener('click', () => cmd('prev'));
  $('#p-secs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cmd('jump', { i: +b.dataset.i }); $('#p-secbox').open = false; });
  $('#p-treset').addEventListener('click', e => {
    const b = e.currentTarget;
    if (!b.classList.contains('arm')) { b.classList.add('arm'); b.textContent = 'Точно? Ще раз'; setTimeout(() => { b.classList.remove('arm'); b.textContent = '↺ Скинути'; }, 3000); return; }
    b.classList.remove('arm'); b.textContent = '↺ Скинути'; cmd('timer-reset');
  });
  $('#p-leave').addEventListener('click', e => {
    const b = e.currentTarget;
    if (!b.classList.contains('arm')) { b.classList.add('arm'); b.textContent = 'Точно від’єднатись? Ще раз'; setTimeout(() => { b.classList.remove('arm'); b.textContent = 'Від’єднатись'; }, 3000); return; }
    leaving = true; stopLink(); st = null; ses = {}; store.set(PKEY, ses);
    setTimeout(() => { leaving = false; b.classList.remove('arm'); b.textContent = 'Від’єднатись'; showEntry(); }, 50);
  });
  document.addEventListener('keydown', e => {
    if (VIEW !== 'pv' || phase !== 'ok' || e.target.closest('input')) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key)) { e.preventDefault(); cmd('next'); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); cmd('prev'); }
  });
  const codeIn = $('#p-code');
  codeIn.addEventListener('input', () => { const d = digits(codeIn.value).slice(0, 6); codeIn.value = fmt(d); $('#p-err').textContent = ''; if (d.length === 6) setTimeout(join, 250); });
  codeIn.addEventListener('keydown', e => { if (e.key === 'Enter') join(); });
  $('#p-join').addEventListener('click', join);
  function join() {
    if (phase !== 'entry') return;
    const d = digits(codeIn.value);
    if (d.length !== 6) { $('#p-err').textContent = 'Код складається з 6 цифр.'; return; }
    ses = { code: d, key: '', token: '' }; store.set(PKEY, ses); tries = 0; connect();
  }
  $('#p-resume').addEventListener('click', () => { if (ses.code) { tries = 0; connect(); } });
  $('#p-mretry').addEventListener('click', () => { tries = 0; connect(); });
  $('#p-mcode').addEventListener('click', () => { stopLink(); st = null; showEntry(); });
  function pultEnter() {
    if (started) { if (phase === 'ok') getWake(); return; }
    started = true;
    if (ses.code) connect(); else showEntry();
  }

  /* ---------------- старт ---------------- */
  const q = new URLSearchParams(location.search);
  const qc = digits(q.get('c')), qk = (q.get('k') || '').replace(/[^a-z0-9]/gi, '').slice(0, 20);
  const h0 = (location.hash || '').slice(1);
  if (qc.length === 6) {
    ses = { code: qc, key: qk, token: ses.code === qc ? (ses.token || '') : '' }; store.set(PKEY, ses);
    try { history.replaceState(null, '', location.pathname + '#pult'); } catch (e) { /* ok */ }
    setView('pv');
  } else if (h0 === 'pult') setView('pv');
  else if (h0 === 'povna') openG('full');
  else if (h0 === 'vyshkil') openG('short');
  else setView('lib');
})();
