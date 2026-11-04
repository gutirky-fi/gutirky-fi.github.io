/* Звуки ігор (4.11.2026): ті самі справжні звуки, що в Змагу (SFX Kit, CC0) — для СКОБ і Бінго.
   Файли лежать поруч зі Змагом: ../svoya-hra/zvuky/*.mp3. Завантажуються після першого дотику (так вимагає браузер).
   window.IHRY_ZVUK.play('ok'|'no'|'tick'|'time'|'open'|'roll'|'rise'|'win'), .toggle(), .on, .chip(el) — кнопка 🔊 у шапці. */
(function () {
  'use strict';
  const BASE = new URL('../svoya-hra/zvuky/', location.href).href, K = 'ihry.zvuk';
  const N = ['ok', 'no', 'tick', 'tick2', 'time', 'open', 'rise', 'tada', 'applause', 'roll1', 'roll2', 'roll3'];
  let on = true; try { on = localStorage.getItem(K) !== '0'; } catch (e) { /* ok */ }
  let A = null, loaded = false; const B = {};
  const ac = () => { A = A || new (window.AudioContext || window.webkitAudioContext)(); if (A.state === 'suspended') A.resume(); return A; };
  function load() {
    if (loaded) return; loaded = true;
    try { const a = ac(); N.forEach(n => fetch(BASE + n + '.mp3').then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(b => new Promise((ok, no) => a.decodeAudioData(b, ok, no))).then(buf => { B[n] = buf; }).catch(() => { /* без звуку */ })); } catch (e) { /* ok */ }
  }
  document.addEventListener('pointerdown', load, { once: true }); document.addEventListener('keydown', load, { once: true });
  function snd(n, vol, at) { if (!on || !B[n]) return; try { const a = ac(), s = a.createBufferSource(), g = a.createGain(); s.buffer = B[n]; g.gain.value = vol == null ? 1 : vol; s.connect(g); g.connect(a.destination); s.start(a.currentTime + (at || 0)); } catch (e) { /* ok */ } }
  const MAP = {
    ok: () => snd('ok', .8), no: () => snd('no', .5), tick: () => snd('tick', .6), time: () => snd('time', .7), open: () => snd('open', .55), rise: () => snd('rise', .6),
    roll: () => snd('roll' + (1 + Math.floor(Math.random() * 3)), .7),
    win: () => { snd('tada', .9); snd('applause', .7, .8); }
  };
  const chips = [];
  const paint = () => chips.forEach(c => { c.setAttribute('aria-pressed', String(on)); c.title = on ? 'Звук увімкнено — натисніть, щоб вимкнути' : 'Звук вимкнено — натисніть, щоб увімкнути';
    c.innerHTML = on ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/></svg>'; });
  window.IHRY_ZVUK = {
    play(k) { load(); if (MAP[k]) MAP[k](); },
    get on() { return on; },
    toggle() { on = !on; try { localStorage.setItem(K, on ? '1' : '0'); } catch (e) { /* ok */ } paint(); if (on) { load(); MAP.ok(); } },
    chip(el) { if (!el) return; chips.push(el); el.setAttribute('aria-label', 'Звук'); el.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); window.IHRY_ZVUK.toggle(); }); paint(); }
  };
})();
