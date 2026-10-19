/* Стиль «Експозиція» для «Кераміки України» (19.10.2026, проба). Іде разом із «Мандрівкою» (TEMA=mandrivka+dyzain).
   Титулка як обкладинка каталогу: «Кераміка / України» у два рядки і полиця з посудом; на слайдах регіонів — номер «03 / 09». */
(function () {
  'use strict';
  const N = 9, pad = n => String(n).padStart(2, '0');
  const HERO = '{{K:vessels}}';
  function setup() {
    const t = document.getElementById('ttl'), app = document.getElementById('app');
    if (!t || !app || t.dataset.dz) return !!(t && t.dataset.dz);
    t.dataset.dz = '1';
    for (const n of [...t.childNodes]) if (n.nodeType === 3 && /Кераміка України/.test(n.nodeValue)) {
      const s = document.createElement('span'); s.className = 'dz-name';
      s.innerHTML = '<span class="l1">Кераміка</span> <span class="l2">України</span>';
      n.replaceWith(s);
    }
    const f = document.createElement('figure'); f.id = 'dzhero'; f.setAttribute('aria-hidden', 'true');
    f.innerHTML = `<img src="${HERO}" alt="">`;
    app.appendChild(f);
    return true;
  }
  function upd() {
    setup();
    const sv = document.getElementById('sv'), pan = document.getElementById('pan'); if (!sv || !pan) return;
    const a = sv.dataset.a, i = a === undefined ? -1 : +a;
    if (i >= 0 && i < N && pan.classList.contains('on') && !pan.querySelector('#qa') && !pan.querySelector('.dz-n'))
      pan.insertAdjacentHTML('afterbegin', `<span class="dz-n" aria-label="регіон ${i + 1} з ${N}">${pad(i + 1)}<i></i>${pad(N)}</span>`);
  }
  document.addEventListener('gutirka:slide', () => requestAnimationFrame(upd));
  document.documentElement.classList.add('t-dz');
})();
