/* Стрілка «назад» у грі: туди, звідки прийшли (сторінка сайту) — інакше на «Для всіх → Ігри» (03.11.2026) */
window.IHRY_BACK = function (a) {
  a.href = (location.pathname.startsWith('/proba/') ? '/proba/vhody/' : '/') + '#vsi'; a.setAttribute('aria-label', 'Назад');
  a.addEventListener('click', e => { try { const r = document.referrer && new URL(document.referrer); if (r && r.origin === location.origin && r.pathname !== location.pathname && history.length > 1) { e.preventDefault(); history.back(); } } catch (x) { /* звичайне посилання */ } });
};
/* «Стиль 3» ігор (проба ?dyz=3): логотип «значок + назва», картка QR ліворуч, «Ведучому» в шапці, лінійні значки.
   Викликається з гри: IHRY_S3({gra, m (блок із заголовком), x (розкривний блок ведучого або null), knopky: {id: 'значок'}}) */
window.IHRY_S3 = function (o) {
  const L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
  const IC = { play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>', dice: '<rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>', plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', gear: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>', back: '<path d="M15 6l-6 6 6 6"/>', print: '<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="8" rx="2"/><path d="M7 14h10v6.5H7z"/>' };
  const ic = n => '<i class="s3i">' + L + IC[n] + '</svg></i>';
  const Z = {
    skob: ['Потужний', 'СКОБ!', '<svg viewBox="0 0 40 40"><rect width="18.5" height="18.5" rx="4" fill="#d64541"/><rect x="21.5" width="18.5" height="18.5" rx="4" fill="#2f6fd0"/><rect y="21.5" width="18.5" height="18.5" rx="4" fill="#e8a321"/><rect x="21.5" y="21.5" width="18.5" height="18.5" rx="4" fill="#2e8f55"/></svg>'],
    zmag: ['Інтелектуальний', 'Змаг', '<svg viewBox="0 0 40 40"><g fill="none" stroke="#ffc247" stroke-width="2.4"><rect x="1.2" y="1.2" width="10.6" height="10.6" rx="2.6"/><rect x="14.7" y="1.2" width="10.6" height="10.6" rx="2.6"/><rect x="28.2" y="1.2" width="10.6" height="10.6" rx="2.6"/><rect x="1.2" y="14.7" width="10.6" height="10.6" rx="2.6"/><rect x="28.2" y="14.7" width="10.6" height="10.6" rx="2.6"/><rect x="1.2" y="28.2" width="10.6" height="10.6" rx="2.6"/><rect x="14.7" y="28.2" width="10.6" height="10.6" rx="2.6"/><rect x="28.2" y="28.2" width="10.6" height="10.6" rx="2.6"/></g><rect x="13.5" y="13.5" width="13" height="13" rx="3" fill="#ffc247"/></svg>'],
    bingo: ['Пластове', 'Бінго', '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#ffc247"/><circle cx="20" cy="20" r="11.5" fill="#fff"/><path d="M16.2 14.6h7.6v1.9l-4.3 10.3h-2.6l4.2-9.9h-4.9z" fill="#1d1606"/></svg>'],
    opyt: ['Швидке', 'Опитування', '<svg viewBox="0 0 40 40"><rect y="18" width="11" height="22" rx="3" fill="#2fd2c0"/><rect x="14.5" width="11" height="40" rx="3" fill="#ffc247"/><rect x="29" y="10" width="11" height="30" rx="3" fill="#cfd5dc"/></svg>'],
    znay: ['Новий', 'Виховник', '<svg viewBox="0 0 40 40"><circle cx="16" cy="16" r="11.5" fill="none" stroke="#ffc247" stroke-width="5"/><path d="M25 25l10.5 10.5" stroke="#2fd2c0" stroke-width="7" stroke-linecap="round"/></svg>']
  }[o.gra];
  document.body.classList.add('s3');
  /* QR-код гравців: у центрі — знак гри (правило 03.11.2026: «гра — свій знак, усе інше — лілея»; пульт ведучого лишається з лілеєю) */
  { const svg = Z[2]; window.IHRY_QRMARK = { logo: '', mark: (c, R) => { const w = R * 1.25; return svg.replace(/^<svg[^>]*>/, '<g transform="translate(' + (c - w / 2).toFixed(2) + ' ' + (c - w / 2).toFixed(2) + ') scale(' + (w / 40).toFixed(4) + ')">').replace(/<\/svg>$/, '</g>'); }   /* <g>, а не вкладений <svg> — щоб CSS сторінки («#qr svg{width:…}») його не розтягував */ };
    const qe = document.getElementById('qr'); if (qe && qe.dataset.u && window.qrSvg) { const old = qe.querySelector('svg'); qe.innerHTML = window.qrSvg(qe.dataset.u, old ? +old.getAttribute('width') : 280, Object.assign({ eye: '#ffc247' }, window.IHRY_QRMARK)); } }
  /* логотип замість заголовка */
  const h1 = o.m.querySelector('h1');
  if (h1) { const d = document.createElement('div'); d.className = 's3lg'; d.setAttribute('role', 'heading'); d.setAttribute('aria-level', '1'); d.setAttribute('aria-label', Z[0] + ' ' + Z[1]); d.innerHTML = '<small>' + Z[0] + '</small><div class="w">' + Z[2] + '<b>' + Z[1] + '</b></div>'; h1.replaceWith(d); }
  /* підказка при першому запуску на цьому компʼютері */
  if (o.kroky) {
    const K = 'ihry.pidkazka.' + o.gra; let seen = false; try { seen = localStorage.getItem(K) === '1'; } catch (e) { /* ok */ }
    if (!seen) {
      const t = document.createElement('div'); t.className = 's3tip'; t.setAttribute('role', 'note');
      t.innerHTML = '<ol>' + o.kroky.map(k => '<li>' + k + '</li>').join('') + '</ol><button type="button">Зрозуміло</button>';
      t.querySelector('button').addEventListener('click', () => { t.remove(); try { localStorage.setItem(K, '1'); } catch (e) { /* ok */ } });
      o.m.prepend(t);
    }
  }
  /* значки в кнопках замість символів ▶ ✎ + */
  Object.entries(o.knopky || {}).forEach(([id, n]) => { const b = document.getElementById(id); if (!b) return; [...b.childNodes].forEach(c => { if (c.nodeType === 3) c.textContent = c.textContent.replace(/^[\s▶✎+🖨]+/, ''); }); b.querySelectorAll('i.ic').forEach(e => e.remove()); b.insertAdjacentHTML('afterbegin', ic(n)); });
  /* кнопка «назад» — значок, як у Змагу */
  const home = document.getElementById('home'); if (home && !home.querySelector('i')) home.innerHTML = ic('back');
  if (home) IHRY_BACK(home);
  /* картка QR: «або відкрийте адресу й введіть код» — під кодом, як у Змагу */
  const jc = document.querySelector('.s2j'); if (jc) { const l = [...jc.querySelectorAll('.s2l')].find(e => /відкрийте/.test(e.textContent)), cd = jc.querySelector('.code'); if (l && cd) cd.after(l); }
  /* стрілки «→ ←» з підписів кнопок прибираємо (кнопки й так кажуть, що станеться) */
  const tidy = b => { if (!b) return; const f = () => { [...b.childNodes].forEach(c => { if (c.nodeType === 3 && /[→←]/.test(c.textContent)) c.textContent = c.textContent.replace(/\s*[→←]\s*/g, ' ').trim(); }); }; f(); new MutationObserver(f).observe(b, { childList: true, characterData: true, subtree: true }); };
  (o.strilky || []).forEach(id => tidy(document.getElementById(id)));
  /* «Ведучому» в шапці: відкриває вікно з інструментами */
  if (o.x) {
    const ov = document.createElement('div'); ov.className = 's3o'; ov.hidden = true;
    ov.innerHTML = '<div class="bx"><button type="button" class="x" aria-label="Закрити">' + ic('x') + '</button><h3>Ведучому</h3></div>';
    const inner = o.x.querySelector('.l2xi, .s2xi'); if (inner) ov.querySelector('.bx').append(inner);
    document.body.append(ov);
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 's3v'; btn.innerHTML = ic('gear') + 'Ведучому';
    const top = document.querySelector('.top'); const snd = document.getElementById('snd'); if (snd) snd.after(btn); else top.append(btn);
    btn.addEventListener('click', () => { ov.hidden = false; });
    /* Змаг: окрема мітка «Ведучий» у шапці зайва — її роль тепер у «Ведучому»; галочка «пульт підключено» переходить сюди */
    const vc = document.getElementById('vedc');
    if (vc) {
      const vd = ov.querySelector('.ved');
      if (vd) { vd.insertAdjacentHTML('beforeend', '<div class="s3okm"><b>Пульт підключено ✓</b><span>Відповіді й кнопки ✓ / ✕ — на вашому телефоні.</span><button type="button" class="s3okb">Показати код ще раз</button></div>'); vd.querySelector('.s3okb').addEventListener('click', () => vd.classList.add('s3show')); }
      const sync = () => { const ok = /✓/.test(vc.textContent); btn.lastChild.textContent = ok ? 'Ведучому ✓' : 'Ведучому'; if (vd) { vd.classList.toggle('s3ok', ok); if (!ok) vd.classList.remove('s3show'); } };
      sync(); new MutationObserver(sync).observe(vc, { childList: true, characterData: true, subtree: true });
    }
    ov.querySelector('.x').addEventListener('click', () => { ov.hidden = true; });
    ov.addEventListener('click', e => { if (e.target === ov) ov.hidden = true; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') ov.hidden = true; });
  }
};
