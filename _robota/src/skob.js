/* «Потужний СКОБ!» — гра-вікторина: запитання на екрані, відповіді з телефонів.
   Телефони підключаються через QR-код і 6-значний код (PeerJS, як пульт); сторінка гравця — /skob/.
   Нічого не зберігається: імена й бали живуть лише в цій вкладці, поки триває гра.
   Потрібен qr.js (window.qrSvg). Адреса сторінки гравця — window.SKOB_URL (інакше <сайт>/skob/).
   API (window.SKOB):
     lobby()               — показати QR і гравців (вмикає звʼязок)
     count()               — скільки телефонів зараз на звʼязку
     ask(el, q, o) → ctl   — одне запитання в контейнері el; ctl.next() → true, якщо крок спожито; ctl.stop()
     game(list, o)         — повна гра поверх сторінки; o.onClose(), o.T (секунд), o.title, o.endText,
                             o.keepOrder (не перемішувати запитання й відповіді)
     active(), key(e)      — чи відкрита гра/лобі; передати натискання клавіші
     on(fn)                — підписка на зміни (гравці, звʼязок)
   q = { q, a:[4 варіанти], ok: індекс правильного, why } */
(function () {
  'use strict';
  if (window.SKOB) return;
  const LIBS = ['https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.5/peerjs.min.js',
    'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js',
    'https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js'];
  const PREFIX = 'gutirky-skob-', LET = ['С', 'К', 'О', 'Б'], MAXP = 60, READ_MS = 3500, AUTO_MS = 1800;
  /* знак посередині QR-коду гри: кольорові квадратики С К О Б, як у логотипі гри */
  const QR_COL = [['#d64541', '#fff'], ['#2f6fd0', '#fff'], ['#e8b02a', '#1d1606'], ['#2e8f55', '#fff']];
  const QR_MARK = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' + LET.map((l, i) => '<rect x="' + (i % 2) * 52 + '" y="' + Math.floor(i / 2) * 52 + '" width="48" height="48" rx="9" fill="' + QR_COL[i][0] + '"/><text x="' + ((i % 2) * 52 + 24) + '" y="' + (Math.floor(i / 2) * 52 + 36) + '" text-anchor="middle" font-family="Oswald,Arial Narrow,Arial,sans-serif" font-weight="700" font-size="34" fill="' + QR_COL[i][1] + '">' + l + '</text>').join('') + '</svg>');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const LOGO = (cls = '') => `<span class="sk-logo ${cls}" aria-label="Потужний СКОБ!"><small>Потужний</small><span class="sk-lt">${LET.map((l, i) => `<i class="c${i}">${l}</i>`).join('')}<b>!</b></span></span>`;

  const CSS = `
.sk-logo{display:inline-flex;flex-direction:column;align-items:flex-start;line-height:1;font-family:Oswald,'Arial Narrow',sans-serif}
.sk-logo small{font:600 .34em/1 Oswald,'Arial Narrow',sans-serif;letter-spacing:.32em;text-transform:uppercase;color:#ffc247;margin:0 0 .18em .06em}
.sk-lt{display:flex;gap:.08em;align-items:center}
.sk-lt i{display:grid;place-items:center;width:1.04em;height:1.04em;border-radius:.16em;font:600 .78em/1 Oswald,'Arial Narrow',sans-serif;font-style:normal;color:#fff}
.sk-lt i.c2{color:#1d1606}.sk-lt b{font:600 .9em/1 Oswald,sans-serif;color:#ffc247;margin-left:.06em}
.c0{background:#d64541}.c1{background:#2f6fd0}.c2{background:#e8b02a}.c3{background:#2e8f55}
.sk-logo.sm{font-size:30px}.sk-logo.sm small{display:none}

/* ---- запитання ---- */
.sk-round{width:100%;max-width:min(1250px,94vw);margin:0 auto;color:#f2f4f6;font-family:'Source Sans 3',system-ui,sans-serif}
.sk-head{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:6px}
.sk-lbl{font:500 clamp(1.2rem,1.7vw,2rem)/1.1 Caveat,'Segoe Print',cursive;color:#2fd2c0}
.sk-head .sp{flex:1}
.sk-cnt{font-size:clamp(.95rem,1.2vw,1.3rem);color:#a0a8b2;white-space:nowrap}.sk-cnt b{color:#fff;font-size:1.2em}
.sk-ring{position:relative;width:clamp(54px,6vw,92px);height:clamp(54px,6vw,92px);flex:none}
.sk-ring svg{width:100%;height:100%;transform:rotate(-90deg)}
.sk-ring circle{fill:none;stroke-width:4.5}.sk-ring .bg{stroke:#2a2f35}.sk-ring .fg{stroke:#ffc247;stroke-linecap:round;transition:stroke-dashoffset .12s linear}
.sk-ring.low .fg{stroke:#ff6b5e}
.sk-ring b{position:absolute;inset:0;display:grid;place-items:center;font:600 clamp(1.3rem,2vw,2.3rem)/1 Oswald,sans-serif}
.sk-qq{margin:4px 0 16px;font:600 clamp(1.5rem,3vw,3.3rem)/1.1 Oswald,'Arial Narrow',sans-serif;letter-spacing:.01em;text-wrap:balance}
.sk-readbar{height:6px;border-radius:99px;background:#2a2f35;overflow:hidden;margin:6px 0 0}
.sk-readbar i{display:block;height:100%;background:#2fd2c0;transform-origin:left;animation:skread linear forwards}
@keyframes skread{from{transform:scaleX(1)}to{transform:scaleX(0)}}
.sk-tiles{display:grid;grid-template-columns:1fr 1fr;gap:clamp(8px,1.1vw,16px)}
.sk-tile{position:relative;display:flex;align-items:center;gap:14px;min-height:clamp(62px,11vh,132px);padding:12px 18px;border:0;border-radius:16px;text-align:left;color:#fff;
  font:600 clamp(1rem,1.75vw,2rem)/1.2 'Source Sans 3',system-ui,sans-serif;cursor:pointer;transition:opacity .3s,transform .3s,box-shadow .3s;box-shadow:inset 0 -5px 0 rgba(0,0,0,.22)}
.sk-tile.c2{color:#1d1606}
.sk-tile i{flex:none;display:grid;place-items:center;width:1.9em;height:1.9em;border-radius:12px;background:rgba(0,0,0,.2);font:600 1.15em/1 Oswald,sans-serif;font-style:normal}
.sk-tile:hover{transform:translateY(-2px)}.sk-tile:focus-visible{outline:3px solid #fff;outline-offset:3px}
.sk-tile em{position:absolute;right:14px;top:50%;transform:translateY(-50%);font:600 1.1em Oswald,sans-serif;font-style:normal;opacity:0}
.sk-round[data-ph=read] .sk-tiles,.sk-round[data-ph=read] .sk-ring,.sk-round[data-ph=read] .sk-cnt{visibility:hidden}
.sk-round:not([data-ph=read]) .sk-readbar{display:none}
.sk-round.pl .sk-tile{cursor:default;pointer-events:none}
.sk-round[data-ph=rev] .sk-tile{pointer-events:none;opacity:.28;transform:none}
.sk-round[data-ph=rev] .sk-tile.ok{opacity:1;box-shadow:0 0 0 4px #fff,0 8px 30px rgba(0,0,0,.4)}
.sk-round[data-ph=rev] .sk-tile.ok::after{content:"✓";position:absolute;right:16px;top:50%;transform:translateY(-50%);font:700 1.5em Oswald,sans-serif}
.sk-round[data-ph=rev].pl .sk-tile em{opacity:1}.sk-round[data-ph=rev].pl .sk-tile.ok::after{display:none}
.sk-round[data-ph=rev] .sk-tile.bad{opacity:.75;box-shadow:0 0 0 4px #ff6b5e}
.sk-why{min-height:1.4em;margin:14px 0 0;font-size:clamp(1rem,1.45vw,1.6rem);color:#cfd5dc}
.sk-why b{color:#2fd2c0}.sk-why b.no{color:#ff8a7f}
.sk-round:not([data-ph=rev]) .sk-why{visibility:hidden}
@media (max-aspect-ratio:1/1){.sk-tiles{grid-template-columns:1fr}.sk-tile{min-height:clamp(54px,8.5vh,120px)}}
@media (orientation:landscape) and (max-height:520px){.sk-qq{font-size:1.25rem;margin-bottom:10px}.sk-tile{min-height:46px;font-size:1rem;padding:8px 12px}.sk-ring{width:46px;height:46px}.sk-why{font-size:.95rem;margin-top:8px}}

/* ---- гра поверх сторінки ---- */
#skob{position:fixed;inset:0;z-index:40;display:flex;flex-direction:column;background:radial-gradient(80% 70% at 50% 40%,#232a33,#15171b 75%);color:#f2f4f6;font:17px/1.5 'Source Sans 3',system-ui,sans-serif;overflow:hidden}
#skob .sk-top{display:flex;align-items:center;gap:10px;padding:max(10px,env(safe-area-inset-top)) 14px 0 18px}
#skob .sp{flex:1}
.sk-btn{min-height:44px;padding:0 16px;border-radius:99px;border:1px solid #3b4048;background:rgba(34,38,43,.9);color:#f2f4f6;font:600 15px 'Source Sans 3',system-ui,sans-serif;cursor:pointer;white-space:nowrap}
.sk-btn:hover{border-color:#ffc247}.sk-btn.main{background:#ffc247;border-color:#ffc247;color:#16130a;font-size:18px;padding:0 26px;min-height:54px}
.sk-btn.warn{border-color:#ff6b5e;color:#ffb3ab}
.sk-btn .dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#6b7480;margin-right:7px;vertical-align:1px}
.sk-btn .dot.ok{background:#3ee08f;box-shadow:0 0 8px #3ee08f}.sk-btn .dot.wait{background:#ffc247}
#skob .sk-stage{flex:1;min-height:0;overflow-y:auto;display:flex;align-items:center;justify-content:center;padding:14px max(16px,3vw) 46px}
#skob .sk-stage>*{animation:skup .4s both}
@keyframes skup{from{opacity:0;transform:translateY(10px)}}
#skob .sk-next{position:absolute;right:max(14px,env(safe-area-inset-right));bottom:calc(10px + env(safe-area-inset-bottom))}
#skob[data-ph=intro] .sk-next,#skob[data-ph=end] .sk-next{display:none}
#skob .sk-hint{position:absolute;left:0;right:0;bottom:calc(12px + env(safe-area-inset-bottom));text-align:center;color:#a0a8b2;font-size:15px;pointer-events:none}
.sk-intro{text-align:center;max-width:900px}
.sk-intro .sk-logo{font-size:clamp(64px,13vw,170px)}
.sk-intro .sk-gt{margin:18px 0 0;font:600 clamp(1.6rem,3.4vw,3rem)/1.1 Oswald,'Arial Narrow',sans-serif;letter-spacing:.01em;text-wrap:balance}
.sk-intro p{font-size:clamp(1.05rem,1.8vw,1.6rem);color:#cfd5dc;margin:18px 0 22px}
.sk-intro .btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.sk-lead{width:min(900px,100%)}
.sk-lead h2,.sk-end h2{font:600 clamp(2rem,4.5vw,4.4rem)/1 Oswald,sans-serif;letter-spacing:.04em;text-transform:uppercase;margin:0 0 18px}
.sk-lead ol{list-style:none;margin:0;padding:0}
.sk-lead li{display:grid;grid-template-columns:2.2em minmax(0,1fr) auto;align-items:center;gap:12px;margin:10px 0;padding:12px 18px;border-radius:14px;background:#22262b;font-size:clamp(1.05rem,1.9vw,1.9rem);animation:skup .4s both}
.sk-lead li .pl{font:600 1.1em Oswald,sans-serif;color:#ffc247}
.sk-lead li .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}
.sk-lead li .sc{font:600 1.05em Oswald,sans-serif;font-variant-numeric:tabular-nums;text-align:right}
.sk-lead li small{display:block;font:600 .55em 'Source Sans 3',sans-serif;color:#3ee08f;text-align:right}
.sk-lead li:first-child{background:#3a3220;box-shadow:inset 4px 0 0 #ffc247}
.sk-pod{display:flex;align-items:flex-end;justify-content:center;gap:clamp(8px,2vw,24px);margin:10px 0 18px}
.sk-pod>div{display:flex;flex-direction:column;align-items:center;width:clamp(96px,18vw,230px)}
.sk-pod .nm{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:700 clamp(1rem,2vw,1.8rem) 'Source Sans 3',sans-serif}
.sk-pod .sc{font:600 clamp(.9rem,1.5vw,1.4rem) Oswald,sans-serif;color:#cfd5dc;margin-bottom:8px}
.sk-pod .blk{width:100%;display:grid;place-items:start center;padding-top:10px;border-radius:14px 14px 0 0;font:600 clamp(2rem,5vw,4.4rem) Oswald,sans-serif;color:#16130a;transform-origin:bottom;animation:skgrow .7s cubic-bezier(.2,.9,.3,1.2) both}
.sk-pod .p1 .blk{height:clamp(130px,30vh,300px);background:#ffc247;animation-delay:.9s}.sk-pod .p1 .nm,.sk-pod .p1 .sc{animation:skup .4s 1.4s both}
.sk-pod .p2 .blk{height:clamp(96px,21vh,210px);background:#cfd5dc;animation-delay:.45s}.sk-pod .p2 .nm,.sk-pod .p2 .sc{animation:skup .4s .9s both}
.sk-pod .p3 .blk{height:clamp(70px,14vh,140px);background:#d9925b}.sk-pod .p3 .nm,.sk-pod .p3 .sc{animation:skup .4s .5s both}
@keyframes skgrow{from{transform:scaleY(0)}}
.sk-end{text-align:center;width:min(980px,100%)}
.sk-end .rest{color:#cfd5dc;font-size:clamp(.95rem,1.4vw,1.3rem);margin:0 0 18px}
.sk-end .btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.sk-sure{display:none;align-items:center;gap:8px}.sk-sure.on{display:flex}

/* ---- лобі: QR і гравці ---- */
#skob-lobby{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,12,15,.9);color:#f2f4f6;font:17px/1.5 'Source Sans 3',system-ui,sans-serif}
#skob-lobby .box{position:relative;width:min(1060px,100%);max-height:100%;overflow:auto;padding:24px 26px 22px;border-radius:22px;background:#1f2328;border:1px solid #3b4048;box-shadow:0 24px 90px #000a}
#skob-lobby .x{position:absolute;right:14px;top:12px;width:44px;height:44px;border-radius:50%;border:1px solid #3b4048;background:#272b31;color:#fff;font-size:22px;cursor:pointer}
#skob-lobby .sk-logo{font-size:clamp(44px,6vw,66px)}
#skob-lobby .row{display:grid;grid-template-columns:auto minmax(0,1fr);gap:24px;align-items:center;margin:18px 0 8px}

#skob-lobby .qr{width:min(380px,46vh,70vw);aspect-ratio:1;border-radius:20px;display:grid;place-items:center;box-shadow:0 0 0 1px rgba(255,194,71,.4),0 0 32px -6px rgba(255,194,71,.45)}
#skob-lobby .qr svg{width:100%;height:100%}
#skob-lobby .qr svg{width:100%;height:100%}
#skob-lobby .steps{min-width:0}
#skob-lobby .s1{margin:0;font:600 clamp(1.1rem,1.7vw,1.5rem)/1.25 'Source Sans 3',sans-serif;color:#fff}
#skob-lobby .or{display:flex;align-items:center;gap:12px;margin:12px 0 8px;color:#6b7480;font-size:14px}
#skob-lobby .or::before,#skob-lobby .or::after{content:"";flex:1;height:1px;background:#383d44}
#skob-lobby .lbl{margin:10px 0 2px;color:#a0a8b2;font-size:14px;letter-spacing:.12em;text-transform:uppercase;font-weight:600}
#skob-lobby .url{font:600 clamp(1.4rem,2.6vw,2.2rem)/1.1 Oswald,'Arial Narrow',sans-serif;color:#fff;letter-spacing:.02em;overflow-wrap:anywhere}
#skob-lobby .code{font:600 clamp(2.6rem,6vw,4.8rem)/1 Oswald,sans-serif;letter-spacing:.08em;color:#ffc247;font-variant-numeric:tabular-nums}
#skob-lobby .st{margin-top:10px;color:#a0a8b2;font-size:15px}
#skob-lobby h3{display:flex;align-items:baseline;gap:10px;margin:16px 0 8px;font:600 20px Oswald,sans-serif;letter-spacing:.08em;text-transform:uppercase}
#skob-lobby h3 span{color:#ffc247}
#skob-lobby .chips{display:flex;flex-wrap:wrap;gap:8px;min-height:44px}
#skob-lobby .chips .empty{color:#a0a8b2}
#skob-lobby .chip{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:4px 14px;border-radius:99px;border:1px solid #3b4048;background:#272b31;color:#f2f4f6;font:600 16px 'Source Sans 3',sans-serif;cursor:pointer;animation:skup .3s both}
#skob-lobby .chip.off{opacity:.45}
.chip .cx,.chip .cok{display:grid;place-items:center;width:28px;height:28px;margin:0 -8px 0 4px;border-radius:50%;border:0;background:#3b4048;color:#fff;font:700 14px sans-serif;cursor:pointer}
.chip .cx:hover{background:#ff6b5e}.chip .cok{background:#2e8f55;margin-right:2px}.chip .cok:hover{background:#3ee08f;color:#0f1714}
#skob-lobby .chip.wait,#skob-req .chip.wait{border-color:#ffc247}
#skob-lobby .pend h3{color:#ffc247}
#skob-req{position:fixed;left:max(12px,env(safe-area-inset-left));bottom:calc(12px + env(safe-area-inset-bottom));z-index:45;display:flex;flex-wrap:wrap;align-items:center;gap:8px;max-width:min(560px,calc(100% - 24px));padding:10px 14px;border-radius:16px;background:#1f2328;border:1px solid #ffc247;color:#f2f4f6;font:15px/1.4 'Source Sans 3',system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.5)}
#skob-req .chip{display:inline-flex;align-items:center;gap:6px;min-height:38px;padding:4px 12px;border-radius:99px;border:1px solid #3b4048;background:#272b31;font-weight:600}
.sk-img{display:flex;justify-content:center;height:clamp(130px,30vh,340px);margin:2px 0 8px}.sk-img svg{height:100%;width:auto;max-width:100%}
.sk-auto{display:block;height:4px;margin-top:10px;border-radius:99px;background:#2a2f35;overflow:hidden;max-width:320px}.sk-auto i{display:block;height:100%;background:#3ee08f;transform-origin:left;animation:skauto linear forwards}
@keyframes skauto{from{transform:scaleX(0)}to{transform:scaleX(1)}}
#skob-lobby .note{margin:12px 0 0;color:#a0a8b2;font-size:14px}
#skob-lobby .btns{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
@media (max-width:640px){#skob-lobby .row{grid-template-columns:1fr;justify-items:center;text-align:center}#skob-lobby .sk-logo{font-size:44px}}
@media (prefers-reduced-motion:reduce){#skob *,#skob-lobby *{animation:none!important;transition:none!important}}
`;
  let cssDone = false;
  function injectCss() { if (cssDone) return; cssDone = true; const s = document.createElement('style'); s.id = 'skob-css'; s.textContent = CSS; document.head.appendChild(s); }

  /* ================= звʼязок ================= */
  let Peer = null, peer = null, code = '', net = 'off', netMsg = '', att = 0, retryT = 0, idRetry = 0, joinSeq = 0;
  const players = new Map(), banned = new Set(), subs = new Set();
  const rnd = n => { const b = new Uint32Array(1); crypto.getRandomValues(b); return b[0] % n; };
  const genCode = () => String(100000 + rnd(900000));
  const genTok = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => (b % 36).toString(36)).join('');
  const emit = () => { subs.forEach(f => { try { f(); } catch (e) { /* ok */ } }); paintLobby(); if (R) R.paint(); paintTop(); paintReq(); };
  let RQ = null;
  function paintReq() {   // нові імена, що чекають ✓, — видно й тоді, коли вікно з QR закрите
    const pend = [...players.values()].filter(P => P.pending), show = pend.length && !(L && !L.hidden);
    if (!show) { if (RQ) RQ.hidden = true; return; }
    if (!RQ) { injectCss(); RQ = document.createElement('div'); RQ.id = 'skob-req'; document.body.appendChild(RQ);
      RQ.addEventListener('click', e => { const b = e.target.closest('[data-x],[data-ok]'); if (!b) return; e.stopPropagation(); if (b.dataset.x) kick(b.dataset.x); else approve(b.dataset.ok); }); }
    RQ.hidden = false;
    RQ.innerHTML = '<b>Хочуть приєднатися:</b>' + pend.map(P => `<span class="chip wait">${esc(P.name)}<button type="button" class="cok" data-ok="${P.tok}" aria-label="Пустити">✓</button><button type="button" class="cx" data-x="${P.tok}" aria-label="Не пускати">✕</button></span>`).join('');
  }
  const send = (P, m) => { try { if (P && P.c && P.c.open) P.c.send(m); } catch (e) { /* ok */ } };
  const online = () => [...players.values()].filter(P => P.on && !P.pending);
  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = () => { s.remove(); rej(new Error('load')); }; document.head.appendChild(s); }); }
  async function getPeer() { if (window.Peer) return window.Peer; for (const u of LIBS) { try { await loadScript(u); if (window.Peer) return window.Peer; } catch (e) { /* далі */ } } throw new Error('lib'); }
  function startNet() {
    if (net === 'on' || net === 'starting') return;
    net = 'starting'; netMsg = ''; emit();
    const my = ++att;
    (async () => {
      try { Peer = await getPeer(); } catch (e) { if (my === att) { net = 'error'; netMsg = 'Не вдалося завантажити звʼязок. Перевірте інтернет.'; emit(); } return; }
      if (my !== att) return;
      if (!code) code = genCode();
      let p; try { p = new Peer(PREFIX + code, window.GUTIRKA_PEER_OPTS || {}); } catch (e) { net = 'error'; netMsg = 'Цей браузер не підтримує гру. Відкрийте сторінку в Chrome.'; emit(); return; }
      peer = p;
      p.on('open', () => { if (my !== att) return; net = 'on'; idRetry = 0; emit(); });
      p.on('connection', c => { if (my === att) onConn(c); });
      p.on('disconnected', () => { if (my !== att) return; net = 'retry'; emit(); setTimeout(() => { if (my === att && peer && peer.disconnected && !peer.destroyed) try { peer.reconnect(); } catch (e) { /* ok */ } }, 1500); });
      p.on('error', err => {
        if (my !== att) return;
        const ty = err && err.type;
        if (ty === 'peer-unavailable') return;
        if (ty === 'unavailable-id') { if (players.size && idRetry++ < 6) { relaunch(4000); return; } code = genCode(); relaunch(200); return; }
        net = 'retry'; netMsg = ''; emit(); relaunch(3000);
      });
    })();
  }
  function relaunch(ms) { att++; clearTimeout(retryT); try { if (peer) peer.destroy(); } catch (e) { /* ok */ } peer = null; net = 'retry'; emit(); retryT = setTimeout(() => { net = 'off'; startNet(); }, ms); }
  function stopNet() {
    players.forEach(P => send(P, { t: 'bye', r: 'stopped' }));
    att++; clearTimeout(retryT);
    setTimeout(() => { players.forEach(P => { try { P.c && P.c.close(); } catch (e) { /* ok */ } }); players.clear(); }, 300);
    const p = peer; peer = null; setTimeout(() => { try { if (p) p.destroy(); } catch (e) { /* ok */ } }, 400);
    net = 'off'; code = ''; emit();
  }
  setInterval(() => { let ch = false; players.forEach(P => { if (P.on && Date.now() - P.last > 15000) { P.on = false; ch = true; } }); if (ch) emit(); }, 5000);
  addEventListener('beforeunload', () => { players.forEach(P => send(P, { t: 'bye', r: 'stopped' })); });
  function cleanName(s) { return String(s || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16); }
  /* ---------- імена: зі списку — одразу в гру; інші — після підтвердження ведучого; лайка й нісенітниці — ні ---------- */
  const normN = s => String(s).toLowerCase().replace(/[’ʼ`´]/g, "'").replace(/ё/g, 'е').replace(/[ыэъ]/g, '').trim();
  const NAMES = new Set(`адам адріан адріян олександр олександра саша сашко сашка олесь олеся олексій олекса льоша альоша анатолій толя андрій андрійко андрійка андрюша андрій антон антоша арсен арсеній артем тьома артемко артур богдан богданко бодя богдана борис вадим валентин валентина валя валерій валерія лера василь вася василько віктор вітя вікторія віка віталій віталіна владислав влад владислава влада володимир володя вова вовчик всеволод сева в'ячеслав вячеслав слава гліб григорій гриць гриша давид даниїл данило даня данилко денис дмитро діма дмитрик дмитрій євген женя євгенія захар зіновій іван ваня іванко іванна ігор ілля ілько йосип кирило кирилко костянтин костя лев левко леонід льоня любомир макар максим макс максимко марко марк мартин матвій мирон мирослав мирослава михайло миша михась мишко микита микола коля назар назарко нестор олег орест остап павло паша павлик петро петрик пилип роман рома романа ростислав ростик ростислава руслан руслана святослав свят святослава семен сергій сергійко серафим степан стефан тарас тарасик тимофій тимко тимур тихон федір федя філіп юліан юрій юра юрко ярема ярослав ярик ярослава яким ян лука еміль еліас ілля юхим омелян охрім панас прохор устим харитон аліна алла аліса анастасія настя настуся ангеліна анна аня ганна ганнуся антоніна аріна арина вероніка віра владислава галина галя дарина даринка дар'я дарія дарья даша діана домініка ева єва єлизавета ліза лізонька емілія злата зоряна іра ірина ірися ія каріна катерина катя катруся кіра христина христя лариса леся ліана лілія ліля любов люба людмила маргарита рита марина марія маша марічка маруся мар'яна марьяна меланія мілана мія надія надя наталія наталя наташа ніна оксана олена оленка лена ольга оля олечка поліна роксолана роксана світлана соломія соля софія софійка соня стефанія таїсія тая тамара тетяна таня уляна уляночка устина юлія юля юліана ярина яна ілона інна еліна амелія емма ніка нікол ліна ліка евеліна адріана альбіна ассоль богдана віолета вірослава зорина златослава квітослава лукія любава маргарита мирослава оксана орися орина ореста роксоляна станіслава таміла фросина христина юстина ярослава станіслав всеслав добромир дем'ян демид еміль ерік захарко зенон ісак лаврін лазар лесь любомир нікіта олелько радим радомир родіон савелій сава тимофей устим фрол хома ян янко`.split(/\s+/).filter(Boolean).map(normN));
  const BAD = /(х[уy][йяюеїі]|п[иі]зд|бля|їба|йоб|ебат|ебан|ебал|сука|суки|мудак|гандон|залуп|шлюх|fuck|shit|bitch|dick|cunt|porn|sex|секс|жоп|срак|дебіл|дебил|ідіот|идиот|nazi|гітлер|гитлер|путін|путин)/i;
  function nameCheck(raw) {
    const name = cleanName(raw);
    if (name.replace(/[^A-Za-zА-ЩЬЮЯҐЄІЇа-щьюяґєії]/g, '').length < 2) return { bad: 1 };
    if (!/^[A-Za-zА-ЩЬЮЯҐЄІЇа-щьюяґєії'’ʼ\- .]+$/.test(name)) return { bad: 1 };
    if (BAD.test(name.replace(/[^A-Za-zА-ЩЬЮЯҐЄІЇа-щьюяґєії]/g, ''))) return { bad: 1 };
    return { name, known: NAMES.has(normN(name.split(/[ .\-]/)[0])) };
  }
  function onConn(c) {
    let P = null;
    c.on('data', d => {
      if (!d || typeof d !== 'object') return;
      if (d.t === 'join') { P = join(c, d); return; }
      if (!P || P.c !== c) return;
      P.last = Date.now();
      if (d.t === 'ans') answer(P, d);
      else if (d.t === 'ping') send(P, { t: 'pong' });
      else if (d.t === 'sync') send(P, stateFor(P));
      else if (d.t === 'leave') { players.delete(P.tok); try { c.close(); } catch (e) { /* ok */ } emit(); }
    });
    c.on('close', () => { if (P && P.c === c) { P.c = null; P.on = false; emit(); } });
    c.on('error', () => { /* закриття обробить close */ });
  }
  function join(c, d) {
    const nope = r => { try { c.send({ t: 'bye', r }); } catch (e) { /* ok */ } setTimeout(() => { try { c.close(); } catch (e) { /* ok */ } }, 600); return null; };
    if (d.tok && banned.has(d.tok)) return nope('kicked');
    let P = d.tok && players.get(d.tok);
    if (P) { if (P.c && P.c !== c) try { P.c.close(); } catch (e) { /* ok */ } P.c = c; P.on = true; P.last = Date.now(); }
    else {
      if (players.size >= MAXP) return nope('full');
      const ch = nameCheck(d.name);
      if (ch.bad) return nope('badname');
      let name = ch.name;
      const taken = new Set([...players.values()].map(x => x.name.toLowerCase()));
      if (taken.has(name.toLowerCase())) { let k = 2; const base = name.slice(0, 13); while (taken.has((base + ' ' + k).toLowerCase())) k++; name = base + ' ' + k; }
      P = { tok: genTok(), name, score: 0, c, on: true, seq: ++joinSeq, last: Date.now(), pending: !ch.known };
      players.set(P.tok, P);
    }
    if (P.pending) { send(P, { t: 'pending', name: P.name, tok: P.tok }); emit(); return P; }
    send(P, { t: 'hi', name: P.name, tok: P.tok, score: P.score });
    send(P, stateFor(P)); emit();
    return P;
  }
  function kick(tok) {   // ✕: гравця прибрано, телефон просить написати справжнє ім’я
    const P = players.get(tok); if (!P) return;
    send(P, { t: 'bye', r: 'name' });
    setTimeout(() => { try { P.c && P.c.close(); } catch (e) { /* ok */ } }, 400);
    players.delete(tok); emit();
  }
  function approve(tok) {
    const P = players.get(tok); if (!P || !P.pending) return;
    P.pending = false; send(P, { t: 'hi', name: P.name, tok: P.tok, score: P.score }); send(P, stateFor(P)); emit();
  }
  const accepted = () => [...players.values()].filter(P => !P.pending);
  const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const mixQ = q => { const ord = shuf(q.a.map((x, i) => i)); return Object.assign({}, q, { a: ord.map(i => q.a[i]), ok: ord.indexOf(q.ok) }); };
  const ranked = () => accepted().sort((a, b) => b.score - a.score || a.seq - b.seq);
  const rankOf = P => ranked().indexOf(P) + 1;
  const bcast = () => players.forEach(P => { if (!P.pending) send(P, stateFor(P)); });

  /* ================= одне запитання ================= */
  let R = null, rid = 0, phoneView = { t: 'wait' };
  function stateFor(P) {
    const base = { name: P.name, score: P.score };
    if (R && R.ph === 'read') return { t: 'read', id: R.id, lbl: R.lbl, q: R.q.q };
    if (R && R.ph === 'ans') {
      if (R.ans.has(P.tok)) return { t: 'got', id: R.id, o: R.ans.get(P.tok).o };
      return { t: 'ask', id: R.id, lbl: R.lbl, q: R.q.q, a: R.q.a, left: Math.max(0, R.T * 1000 - (Date.now() - R.tA)), T: R.T };
    }
    if (R && R.ph === 'rev') { const a = R.ans.get(P.tok); return { t: 'res', id: R.id, ok: !!(a && a.o === R.q.ok), got: a ? a.o : -1, pts: a ? a.pts : 0, score: P.score, rank: rankOf(P), of: accepted().length, right: R.q.ok, rightText: R.q.a[R.q.ok] }; }
    if (phoneView.t === 'lead') return { t: 'lead', score: P.score, rank: rankOf(P), of: accepted().length };
    if (phoneView.t === 'end') { const top = ranked().slice(0, 3).map(x => ({ name: x.name, score: x.score })); return { t: 'end', score: P.score, rank: rankOf(P), of: accepted().length, top }; }
    return Object.assign({ t: 'wait' }, base);
  }
  function answer(P, d) {
    if (!R || R.ph !== 'ans' || d.id !== R.id || R.ans.has(P.tok)) return;
    const o = d.o | 0; if (o < 0 || o > 3) return;
    const ms = Date.now() - R.tA, ok = o === R.q.ok;
    const pts = ok ? Math.round(1000 * (1 - Math.min(1, ms / (R.T * 1000)) / 2)) : 0;
    R.ans.set(P.tok, { o, ms, pts });
    send(P, { t: 'got', id: R.id, o });
    R.paint();
    const on = online();
    if (on.length && on.every(x => R.ans.has(x.tok))) setTimeout(() => { if (R && R.ph === 'ans') R.reveal(); }, 500);
  }
  function ask(el, q, o = {}) {
    injectCss();
    if (R) R.stop();
    if (o.mix !== false) q = mixQ(q);
    const withPl = o.players !== false && online().length > 0;
    const r = { id: ++rid, q, el, lbl: o.label || '', T: o.T || 20, ph: withPl ? 'read' : 'ans', pl: withPl, ans: new Map(), pick: -1, tA: Date.now(), t0: Date.now(), tick: 0, done: false };
    R = r;
    el.innerHTML = `<div class="sk-round${withPl ? ' pl' : ''}" data-ph="${r.ph}">
      <div class="sk-head"><span class="sk-lbl">${esc(r.lbl)}</span><span class="sp"></span><span class="sk-cnt"></span>
        <div class="sk-ring"><svg viewBox="0 0 44 44" aria-hidden="true"><circle class="bg" cx="22" cy="22" r="19"/><circle class="fg" cx="22" cy="22" r="19" pathLength="100" stroke-dasharray="100" stroke-dashoffset="0"/></svg><b></b></div></div>
      ${q.img ? `<div class="sk-img">${q.img}</div>` : ''}<h2 class="sk-qq">${esc(q.q)}</h2><div class="sk-readbar"><i style="animation-duration:${READ_MS}ms"></i></div>
      <div class="sk-tiles">${q.a.map((x, i) => `<button type="button" class="sk-tile c${i}${i === q.ok ? ' ok' : ''}" data-o="${i}"${withPl ? ' tabindex="-1"' : ''}><i>${LET[i]}</i><span>${esc(x)}</span><em></em></button>`).join('')}</div>
      <p class="sk-why"></p></div>`;
    const box = el.firstElementChild, ring = box.querySelector('.sk-ring'), fg = ring.querySelector('.fg'), sec = ring.querySelector('b'), cnt = box.querySelector('.sk-cnt');
    box.querySelector('.sk-tiles').addEventListener('click', e => {
      const b = e.target.closest('.sk-tile'); if (!b || r.pl || r.ph !== 'ans') return;
      e.stopPropagation(); r.pick = +b.dataset.o; r.reveal();
    });
    r.paint = () => {
      if (R !== r) return;
      box.dataset.ph = r.ph;
      const on = online().length;
      cnt.innerHTML = r.pl ? `Відповіли: <b>${r.ans.size}</b> з ${Math.max(on, r.ans.size)}` : '';
      if (r.ph === 'rev') {
        if (r.pl) { const k = [0, 0, 0, 0]; r.ans.forEach(a => k[a.o]++); box.querySelectorAll('.sk-tile em').forEach((m, i) => { m.textContent = (i === q.ok ? '✓ ' : '') + k[i]; }); }
        else if (r.pick >= 0 && r.pick !== q.ok) box.querySelector(`.sk-tile[data-o="${r.pick}"]`).classList.add('bad');
      }
    };
    r.draw = () => {
      if (R !== r) return;
      const now = Date.now();
      if (r.ph === 'read' && now - r.t0 >= READ_MS) r.open();
      if (r.ph === 'ans') {
        const left = Math.max(0, r.T * 1000 - (now - r.tA));
        sec.textContent = Math.ceil(left / 1000); fg.style.strokeDashoffset = String(100 - left / (r.T * 10));
        ring.classList.toggle('low', left <= 5000);
        if (left <= 0) r.reveal();
      }
    };
    r.open = () => { if (r.ph !== 'read') return; r.ph = 'ans'; r.tA = Date.now(); bcast(); r.paint(); r.draw(); if (o.onPhase) o.onPhase('ans'); };
    r.reveal = () => {
      if (r.ph === 'rev' || R !== r) return;
      if (r.ph === 'read') { r.ph = 'ans'; r.tA = Date.now(); }
      r.ph = 'rev'; clearInterval(r.tick);
      r.ans.forEach((a, tok) => { const P = players.get(tok); if (P) P.score += a.pts; });
      const why = box.querySelector('.sk-why');
      let lead = '';
      if (r.pl) { const right = [...r.ans.values()].filter(a => a.o === q.ok).length; lead = `<b>Правильно: ${LET[q.ok]} — ${esc(q.a[q.ok])}.</b> Влучили ${right} з ${r.ans.size || 0}. `; }
      else if (r.pick >= 0) lead = r.pick === q.ok ? '<b>Правильно!</b> ' : `<b class="no">Не зовсім.</b> Правильно: ${LET[q.ok]} — ${esc(q.a[q.ok])}. `;
      else lead = `<b>Правильно: ${LET[q.ok]} — ${esc(q.a[q.ok])}.</b> `;
      const auto = !r.pl && r.pick >= 0 && r.pick === q.ok && o.auto;
      why.innerHTML = lead + esc(q.why || '') + (auto ? `<span class="sk-auto"><i style="animation-duration:${AUTO_MS}ms"></i></span>` : '');
      if (auto) r.autoT = setTimeout(() => { if (R === r) o.auto(); }, AUTO_MS);
      ring.querySelector('b').textContent = '0'; fg.style.strokeDashoffset = '100';
      bcast(); r.paint(); if (o.onPhase) o.onPhase('rev');
    };
    r.next = () => { if (R !== r) return false; if (r.ph === 'read') { r.open(); return true; } if (r.ph === 'ans') { r.reveal(); return true; } return false; };
    r.stop = () => { clearInterval(r.tick); clearTimeout(r.autoT); if (R === r) { R = null; if (!r.keep) bcast(); } };
    r.paint(); r.draw();
    r.tick = setInterval(r.draw, 100);
    if (withPl) bcast();
    return { next: r.next, stop: (keep) => { r.keep = keep; r.stop(); }, phase: () => r.ph };
  }

  /* ================= гра поверх сторінки ================= */
  let G = null, gEl = null, lastPT = '';
  function game(list, o = {}) {
    injectCss(); closeGame(true);
    G = { src: list, list: o.keepOrder ? list.slice() : shuf(list), i: -1, ph: 'intro', o, ctl: null, before: new Map() };
    gEl = document.createElement('div'); gEl.id = 'skob'; gEl.setAttribute('role', 'dialog'); gEl.setAttribute('aria-label', 'Гра «Потужний СКОБ!»');
    gEl.innerHTML = `<div class="sk-top">${LOGO('sm')}<span class="sp"></span><button type="button" class="sk-btn" data-k="lobby"></button>
      <span class="sk-sure"><button type="button" class="sk-btn warn" data-k="quit">Так, завершити</button><button type="button" class="sk-btn" data-k="stay">Ні</button></span>
      <button type="button" class="sk-btn" data-k="x" aria-label="Завершити гру">✕</button></div><div class="sk-stage"></div><div class="sk-hint"></div><button type="button" class="sk-btn sk-next" data-k="next">Далі →</button>`;
    document.body.appendChild(gEl);
    gEl.addEventListener('click', e => {
      const b = e.target.closest('[data-k]');
      if (b) { e.stopPropagation(); const k = b.dataset.k;
        if (k === 'lobby') lobby(); else if (k === 'x') gEl.querySelector('.sk-sure').classList.toggle('on'); else if (k === 'stay') gEl.querySelector('.sk-sure').classList.remove('on');
        else if (k === 'quit') closeGame(); else if (k === 'start' || k === 'next') gNext(); else if (k === 'again') { players.forEach(P => { P.score = 0; }); G.list = G.o.keepOrder ? G.src.slice() : shuf(G.src); G.i = -1; G.ph = 'intro'; gNext(); } else if (k === 'done') closeGame();
        return; }
      if (e.target.closest('button,a') || lastPT === 'mouse') return;
      gNext();
    });
    gEl.addEventListener('pointerdown', e => { lastPT = e.pointerType; });
    paintTop(); gIntro();
  }
  function gStage() { gEl.dataset.ph = G.ph; return gEl.querySelector('.sk-stage'); }
  function hint(t) { if (gEl) gEl.querySelector('.sk-hint').textContent = t || ''; }
  function gIntro() {
    G.ph = 'intro'; phoneView = { t: 'wait' }; bcast();
    const n = online().length, had = [...players.values()].some(P => P.score > 0);
    gStage().innerHTML = `<div class="sk-intro">${LOGO()}${G.o.title ? `<h2 class="sk-gt">${esc(G.o.title)}</h2>` : ''}<p>${G.list.length} ${plural(G.list.length, 'запитання', 'запитання', 'запитань')} · по ${G.o.T || 20} секунд · за швидку правильну відповідь — більше балів.<br>${n ? `На звʼязку ${n} ${plural(n, 'телефон', 'телефони', 'телефонів')}.${had ? ' Бали з гутірки теж рахуються.' : ''}` : 'Грати можна з телефонами — або просто на екрані, відповідаючи вголос.'}</p>
      <div class="btns"><button type="button" class="sk-btn main" data-k="start">Почати</button><button type="button" class="sk-btn" data-k="lobby">Запросити гравців</button></div></div>`;
    hint('');
  }
  function gNext() {
    if (!G) return;
    if (G.ph === 'intro') return gQ(0);
    if (G.ph === 'q') {
      if (G.ctl && G.ctl.next()) return;
      if (G.pl) return gLead();
      return gQ(G.i + 1);
    }
    if (G.ph === 'lead') return gQ(G.i + 1);
  }
  function gQ(i) {
    if (G.ctl) G.ctl.stop(true);
    if (i >= G.list.length) return gEnd();
    G.i = i; G.ph = 'q'; phoneView = { t: 'wait' };
    G.before = new Map([...players.values()].map(P => [P.tok, P.score]));
    const st = gStage(); st.innerHTML = '<div style="width:100%"></div>';
    G.ctl = ask(st.firstElementChild, G.list[i], { mix: !G.o.keepOrder, label: `Запитання ${i + 1} з ${G.list.length}`, T: G.o.T || 20, auto: () => { if (G && G.ph === 'q' && G.i === i) gNext(); }, onPhase: ph => hint(ph === 'rev' ? (G.pl ? 'Далі — таблиця лідерів' : (i + 1 < G.list.length ? 'Далі — наступне запитання' : 'Далі — підсумок')) : 'Далі — показати відповідь') });
    G.pl = R && R.pl;
    hint(G.pl ? '' : 'Натисніть на відповідь. Правильно — гра піде далі сама, неправильно — зупиниться, щоб прочитати пояснення.');
  }
  function gLead() {
    if (G.ctl) G.ctl.stop(true); G.ctl = null;
    G.ph = 'lead'; phoneView = { t: 'lead' }; bcast();
    const top = ranked().slice(0, 5);
    gStage().innerHTML = `<div class="sk-lead"><h2>Лідери</h2><ol>${top.map((P, k) => { const d = P.score - (G.before.get(P.tok) || 0); return `<li style="animation-delay:${k * 90}ms"><span class="pl">${k + 1}</span><span class="nm">${esc(P.name)}</span><span class="sc">${num(P.score)}${d > 0 ? `<small>+${num(d)}</small>` : ''}</span></li>`; }).join('')}</ol></div>`;
    hint(G.i + 1 < G.list.length ? 'Далі — наступне запитання' : 'Далі — переможці');
  }
  function gEnd() {
    G.ctl = null; G.ph = 'end'; phoneView = { t: 'end' }; bcast();
    const top = ranked();
    let h;
    if (top.length) {
      const cell = (P, k) => P ? `<div class="p${k}"><span class="nm">${esc(P.name)}</span><span class="sc">${num(P.score)}</span><div class="blk">${k}</div></div>` : `<div class="p${k}"></div>`;
      h = `<h2>Переможці</h2><div class="sk-pod">${cell(top[1], 2)}${cell(top[0], 1)}${cell(top[2], 3)}</div>` +
        (top.length > 3 ? `<p class="rest">${top.slice(3, 12).map((P, k) => `${k + 4}. ${esc(P.name)} — ${num(P.score)}`).join(' · ')}</p>` : '');
    } else h = `<h2>Вікторину завершено</h2><p class="rest">${esc(G.o.endText || `${G.list.length} ${plural(G.list.length, 'запитання', 'запитання', 'запитань')} позаду. Хто знає все — може йти складати вмілість!`)}</p>`;
    gStage().innerHTML = `<div class="sk-end">${h}<div class="btns"><button type="button" class="sk-btn main" data-k="done">Завершити</button><button type="button" class="sk-btn" data-k="again">Зіграти ще раз</button></div></div>`;
    hint('');
  }
  function closeGame(silent) {
    if (!G) return;
    const o = G.o; if (G.ctl) G.ctl.stop(); G = null;
    if (gEl) gEl.remove(); gEl = null;
    phoneView = { t: 'wait' }; bcast();
    if (!silent && o.onClose) o.onClose();
  }
  function paintTop() {
    if (!gEl) return;
    const b = gEl.querySelector('[data-k=lobby]'), n = online().length, w = [...players.values()].filter(P => P.pending).length;
    b.innerHTML = `<span class="dot ${net === 'on' ? (n ? 'ok' : 'wait') : net === 'off' ? '' : 'wait'}"></span>${n ? `Гравців: ${n}` : 'Запросити гравців'}${w ? ` · чекають: ${w}` : ''}`;
  }
  const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c; };

  /* ================= лобі ================= */
  let L = null, killArm = '';
  function playerUrl() { return window.SKOB_URL || (location.origin + '/skob/'); }
  function lobby() {
    injectCss(); startNet();
    if (!L) {
      L = document.createElement('div'); L.id = 'skob-lobby'; L.setAttribute('role', 'dialog'); L.setAttribute('aria-label', 'Підключити телефони');
      L.innerHTML = `<div class="box"><button type="button" class="x" data-k="close" aria-label="Закрити">✕</button>${LOGO()}
        <div class="row"><div class="qr"></div><div class="steps">
          <p class="s1">Скануйте QR-код камерою телефона</p>
          <p class="or"><span>або</span></p>
          <p class="lbl">відкрийте</p><div class="url"></div>
          <p class="lbl">і введіть код</p><div class="code"></div>
          <div class="st"></div></div></div>
        <div class="pend" hidden><h3>Чекають підтвердження <span class="np"></span></h3><div class="chips pchips"></div></div>
        <h3>Гравці <span class="n"></span></h3><div class="chips"></div>
        <p class="note">Імена зі списку українських імен заходять одразу. Інші (прізвиська, рідкісні імена, латиницею) — лише після вашого ✓. Лайку не пропускає. ✕ — прибрати гравця: його телефон попросить написати справжнє ім’я. Нічого не зберігається.</p>
        <div class="btns"><button type="button" class="sk-btn main" data-k="close">Готово</button><button type="button" class="sk-btn warn" data-k="off">Вимкнути гру для телефонів</button></div></div>`;
      document.body.appendChild(L);
      L.addEventListener('click', e => {
        const b = e.target.closest('[data-k],[data-x],[data-ok]');
        if (!b) { if (e.target === L) closeLobby(); return; }
        if (b.dataset.k === 'close') closeLobby();
        else if (b.dataset.k === 'off') { stopNet(); closeLobby(); }
        else if (b.dataset.x) kick(b.dataset.x);
        else if (b.dataset.ok) approve(b.dataset.ok);
      });
    }
    L.hidden = false; paintLobby();
    setTimeout(() => { try { L.querySelector('[data-k=close].main').focus(); } catch (e) { /* ok */ } }, 50);
  }
  function closeLobby() { if (L) L.hidden = true; killArm = ''; paintReq(); }
  let qrFor = '';
  function paintLobby() {
    if (!L || L.hidden) return;
    const url = playerUrl(), full = code ? url + '?k=' + code : '';
    const qr = L.querySelector('.qr');
    if (full && window.qrSvg) { if (qrFor !== full) { qr.innerHTML = window.qrSvg(full, 250, { eye: '#ffc247', logo: QR_MARK, logoH: 1.5, logoA: 1 }); qrFor = full; } } else if (!full) { qr.innerHTML = '<span style="color:#555">…</span>'; qrFor = ''; }
    L.querySelector('.url').textContent = window.SKOB_SHORT || url.replace(/^https?:\/\//, '').replace(/\/$/, '');   // SKOB_SHORT — коротка адреса, якщо є
    L.querySelector('.code').textContent = code ? code.slice(0, 3) + ' ' + code.slice(3) : '··· ···';
    L.querySelector('.st').textContent = { on: '● Можна підключатися.', starting: 'Вмикаємо звʼязок…', retry: 'Відновлюємо звʼязок…', error: netMsg || 'Помилка звʼязку.', off: 'Звʼязок вимкнено.' }[net] || '';
    const all = accepted().sort((a, b) => a.seq - b.seq), pend = [...players.values()].filter(P => P.pending);
    L.querySelector('.n').textContent = all.length ? all.length : '';
    L.querySelector('.chips:not(.pchips)').innerHTML = all.length ? all.map(P => `<span class="chip${P.on ? '' : ' off'}">${esc(P.name)}<button type="button" class="cx" data-x="${P.tok}" aria-label="Прибрати ${esc(P.name)}">✕</button></span>`).join('') : '<span class="empty">Поки нікого. Щойно хтось підключиться, ім’я з’явиться тут.</span>';
    L.querySelector('.pend').hidden = !pend.length; L.querySelector('.np').textContent = pend.length || '';
    L.querySelector('.pchips').innerHTML = pend.map(P => `<span class="chip wait">${esc(P.name)}<button type="button" class="cok" data-ok="${P.tok}" aria-label="Пустити ${esc(P.name)}">✓</button><button type="button" class="cx" data-x="${P.tok}" aria-label="Не пускати ${esc(P.name)}">✕</button></span>`).join('');
  }

  /* ================= клавіші ================= */
  function key(e) {
    if (L && !L.hidden) { if (['Escape', 'Enter'].includes(e.key) && !(e.target && e.target.closest && e.target.closest('#skob-lobby button:not(.main)'))) { e.preventDefault(); closeLobby(); } return true; }
    if (!G) return false;
    const k = e.key;
    if (k === 'Escape') { e.preventDefault(); gEl.querySelector('.sk-sure').classList.toggle('on'); return true; }
    if (e.target && e.target.closest && e.target.closest('#skob button') && (k === 'Enter' || k === ' ')) return true;
    if ([' ', 'ArrowRight', 'ArrowDown', 'PageDown', 'Enter'].includes(k)) { e.preventDefault(); gNext(); }
    else if (G.ph === 'q' && !G.pl && /^[1-4]$/.test(k) && R && R.ph === 'ans') { R.pick = +k - 1; R.reveal(); }
    return true;
  }
  document.addEventListener('keydown', e => { if ((L && !L.hidden) || G) { if (!e.defaultPrevented) key(e); e.stopImmediatePropagation(); } }, true);

  window.SKOB = {
    lobby, ask, game, key, logo: LOGO, shuffle: shuf,
    close: () => { closeGame(true); closeLobby(); },
    count: () => online().length,
    active: () => !!G || !!(L && !L.hidden),
    on: fn => { subs.add(fn); return () => subs.delete(fn); },
    _debug: () => ({ net, code, players: [...players.values()].map(P => ({ name: P.name, score: P.score, on: P.on })), R: R && { ph: R.ph, ans: R.ans.size } })
  };
})();
