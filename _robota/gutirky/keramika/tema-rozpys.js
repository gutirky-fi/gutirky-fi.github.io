/* Стиль «Розпис» для «Кераміки України» (19.10.2026, варіант для порівняння).
   Кожен регіон отримує свій орнамент-мотив (квіти, смуги, зиґзаґ, спіраль, крапки, хвиля) кольором регіону:
   смуга-розпис уздовж панелі з текстом і легкий візерунок на суші регіону. Слухає подію gutirka:slide. */
(function () {
  'use strict';
  const COL = ['#ff6b4a', '#4d8dff', '#2fd08a', '#e0914f', '#b06bd6', '#27c4c9', '#ffc247', '#a8d44a', '#ff7ab0'];
  const MOT = ['fl', 'fl', 'bd', 'zz', 'sp', 'bd', 'dt', 'zz', 'wv'];
  const NAME = { fl: 'квітковий розпис', bd: 'смуги й пояски', zz: 'кривулька-зиґзаґ', sp: 'спіраль', dt: 'крапки-«зернятка»', wv: 'хвиля-меандр' };
  /* плитка 40×40 для кожного мотиву; c — колір регіону, k — світлий кремовий */
  function tile(m, c) {
    const k = '#f3e2bf';
    const T = {
      fl: `<circle cx="20" cy="20" r="4" fill="${c}"/>${[0, 72, 144, 216, 288].map(a => `<ellipse cx="20" cy="11" rx="3.4" ry="6.5" fill="${k}" opacity=".85" transform="rotate(${a} 20 20)"/>`).join('')}<circle cx="20" cy="20" r="2" fill="${k}"/><circle cx="2" cy="2" r="1.6" fill="${c}"/><circle cx="38" cy="38" r="1.6" fill="${c}"/>`,
      bd: `<rect y="4" width="40" height="5" fill="${c}"/><rect y="13" width="40" height="1.6" fill="${k}" opacity=".8"/><rect y="25" width="40" height="1.6" fill="${k}" opacity=".8"/><rect y="31" width="40" height="5" fill="${c}"/>${[5, 15, 25, 35].map(x => `<circle cx="${x}" cy="20" r="2" fill="${k}"/>`).join('')}`,
      zz: `<path d="M0 14 L10 4 L20 14 L30 4 L40 14" fill="none" stroke="${c}" stroke-width="3.2" stroke-linejoin="round"/><path d="M0 34 L10 24 L20 34 L30 24 L40 34" fill="none" stroke="${k}" stroke-width="2" stroke-linejoin="round" opacity=".8"/>${[10, 30].map(x => `<circle cx="${x}" cy="19" r="1.7" fill="${c}"/>`).join('')}`,
      sp: `<path d="M20 20 m0 -2 a2 2 0 1 1 -2 2 a4 4 0 0 1 4 -4 a6 6 0 0 1 6 6 a8 8 0 0 1 -8 8 a10 10 0 0 1 -10 -10 a12 12 0 0 1 12 -12" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/><circle cx="36" cy="36" r="1.8" fill="${k}"/>`,
      dt: [[8, 8], [20, 8], [32, 8], [14, 20], [26, 20], [8, 32], [20, 32], [32, 32]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 2.4 : 3.4}" fill="${i % 2 ? k : c}"/>`).join(''),
      wv: `<path d="M0 12 Q10 2 20 12 T40 12" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/><path d="M0 28 Q10 18 20 28 T40 28" fill="none" stroke="${k}" stroke-width="2" stroke-linecap="round" opacity=".8"/><path d="M4 36 h6 v-4 h4 v4 h6" fill="none" stroke="${c}" stroke-width="1.6"/>`
    };
    return 'url("data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">${T[m] || T.wv}</svg>`) + '")';
  }
  function upd() {
    const sv = document.getElementById('sv'), pan = document.getElementById('pan'); if (!sv || !pan) return;
    const a = sv.dataset.a, i = a === undefined ? -1 : +a;
    const has = i >= 0 && i < 9 && pan.classList.contains('on');
    document.documentElement.classList.toggle('rz-on', has);
    if (!has) { sv.querySelectorAll('.rz-fill').forEach(x => x.remove()); return; }
    const m = MOT[i], c = COL[i];
    pan.style.setProperty('--rz', tile(m, c));
    pan.style.setProperty('--rzc', c);
    if (!pan.querySelector('.rz-band')) pan.insertAdjacentHTML('afterbegin', `<span class="rz-band" aria-hidden="true"></span><span class="rz-tag">орнамент: ${NAME[m]}</span>`);
    /* легкий візерунок на суші активного регіону */
    let defs = sv.querySelector('defs'); const id = 'rzp' + i;
    if (defs && !sv.querySelector('#' + id)) {
      defs.insertAdjacentHTML('beforeend', `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse"><image href=${tile(m, c).slice(4, -1)} width="14" height="14"/></pattern>`);
    }
    sv.querySelectorAll('.rz-fill').forEach(x => x.remove());
    const g = sv.querySelector(`.rg[data-i="${i}"]`);
    if (g) {
      const f = g.cloneNode(true); f.removeAttribute('data-i'); f.setAttribute('class', 'rz-fill'); f.removeAttribute('style'); f.setAttribute('pointer-events', 'none');
      f.querySelectorAll('path').forEach(p => p.setAttribute('fill', `url(#${id})`));
      g.after(f);
    }
  }
  document.addEventListener('gutirka:slide', () => requestAnimationFrame(upd));
  document.documentElement.classList.add('t-rozpys');
})();
