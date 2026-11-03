/* «Стиль 3» на телефоні (?dyz=3): логотип гри «значок + назва» вгорі й на першому екрані. Виклик: IHRY_TEL3('zmag'|'bingo'|'opyt') */
window.IHRY_TEL3 = function (gra) {
  if (!/dyz=3/.test(location.search)) return;
  const Z = {
    skob: ['Потужний', 'СКОБ!', '<svg viewBox="0 0 40 40"><rect width="18.5" height="18.5" rx="4" fill="#d64541"/><rect x="21.5" width="18.5" height="18.5" rx="4" fill="#2f6fd0"/><rect y="21.5" width="18.5" height="18.5" rx="4" fill="#e8a321"/><rect x="21.5" y="21.5" width="18.5" height="18.5" rx="4" fill="#2e8f55"/></svg>'],
    zmag: ['Інтелектуальний', 'Змаг', '<svg viewBox="0 0 40 40"><g fill="none" stroke="#ffc247" stroke-width="2.4"><rect x="1.2" y="1.2" width="10.6" height="10.6" rx="2.6"/><rect x="14.7" y="1.2" width="10.6" height="10.6" rx="2.6"/><rect x="28.2" y="1.2" width="10.6" height="10.6" rx="2.6"/><rect x="1.2" y="14.7" width="10.6" height="10.6" rx="2.6"/><rect x="28.2" y="14.7" width="10.6" height="10.6" rx="2.6"/><rect x="1.2" y="28.2" width="10.6" height="10.6" rx="2.6"/><rect x="14.7" y="28.2" width="10.6" height="10.6" rx="2.6"/><rect x="28.2" y="28.2" width="10.6" height="10.6" rx="2.6"/></g><rect x="13.5" y="13.5" width="13" height="13" rx="3" fill="#ffc247"/></svg>'],
    bingo: ['Пластове', 'Бінго', '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#ffc247"/><circle cx="20" cy="20" r="11.5" fill="#fff"/><path d="M16.2 14.6h7.6v1.9l-4.3 10.3h-2.6l4.2-9.9h-4.9z" fill="#1d1606"/></svg>'],
    opyt: ['Швидке', 'Опитування', '<svg viewBox="0 0 40 40"><rect y="18" width="11" height="22" rx="3" fill="#2fd2c0"/><rect x="14.5" width="11" height="40" rx="3" fill="#ffc247"/><rect x="29" y="10" width="11" height="30" rx="3" fill="#cfd5dc"/></svg>']
  };
  const z = Z[gra]; if (!z) return;
  document.body.classList.add('s3t');
  const st = document.createElement('style');
  st.textContent = 'body.s3t .t3{display:inline-flex;align-items:center;gap:8px}body.s3t .t3 svg{width:24px;height:24px;flex:none}body.s3t .t3 b{font:600 20px/1 Oswald,sans-serif;text-transform:uppercase;letter-spacing:.02em;color:#f2f4f6}' +
    'body.s3t .j3{display:flex;flex-direction:column;align-items:flex-start;margin:14px 0 10px}body.s3t .j3 small{font:600 13px/1 Oswald,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:#ffc247;margin:0 0 9px 1px}body.s3t .j3 .w{display:flex;align-items:center;gap:12px}body.s3t .j3 svg{width:40px;height:40px;flex:none}body.s3t .j3 b{font:600 48px/.8 Oswald,sans-serif;text-transform:uppercase;color:#f2f4f6;padding-top:2px}' +
    'body.s3t .qn{font:700 14px "Source Sans 3",sans-serif;text-transform:none;letter-spacing:.02em;color:#a0a8b2}body.s3t #play h1,body.s3t #play h2{text-transform:none}body.s3t .btn{border-radius:12px}body.s3t .top .logo,body.s3t .top>b:not(.t3){display:none}';
  document.head.append(st);
  const top = document.querySelector('.top');
  if (top) top.insertAdjacentHTML('afterbegin', '<span class="t3" aria-label="' + z[0] + ' ' + z[1] + '">' + z[2] + '<b>' + z[1] + '</b></span>');
  const h = document.querySelector('#join h1');
  if (h) h.outerHTML = '<div class="j3" role="heading" aria-level="1" aria-label="' + z[0] + ' ' + z[1] + '"><small>' + z[0] + '</small><div class="w">' + z[2] + '<b>' + z[1] + '</b></div></div>';
};
