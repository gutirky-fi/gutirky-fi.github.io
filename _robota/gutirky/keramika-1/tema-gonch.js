/* Стиль «Гончарня» (19.10.2026): вмикає вигляд #pres.t-gn і дає свою розмітку титулки та розділу «Точка N з 5».
   Рушій (index.html) після свого switch питає window.GUT_TEMA[тип слайда](s, D) — якщо повертає HTML, бере його. */
(function () {
  'use strict';
  const KR = { 1: 'історія', 2: 'техніки', 3: 'види', 4: 'виставка', 5: 'власноруч' };
  function on() { const p = document.getElementById('pres'); if (p) p.classList.add('t-gn'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', on); else on();
  window.GUT_TEMA = {
    title(s, D) {
      const m = String(D.title || '').match(/\s(I{1,3}|І{1,3}|IV|V)$/), lv = m ? m[1] : '';
      return `<div class="ttl"><span class="gtag">${D.ey}</span><h2>${D.nazva}</h2>` +
        `<div class="gh">${lv ? `<span class="stmp" aria-label="рівень ${lv}"><small>рівень</small>${lv}</span>` : ''}<p>гутірка для юнацтва</p></div>` +
        `<div class="meta"><span><b>5</b> вимог вмілості</span><span>${D.chas}</span><span>гра з телефонів</span></div></div>`;
    },
    sec(s, D) {
      const pr = n => (D.konspekt.find(k => k.n === n) || {}).pr;
      const t = [1, 2, 3, 4, 5].map(n => `<div class="tl${n === s.n ? ' cur' : n < s.n ? ' done' : ''}${pr(n) ? ' pr' : ''}"><i>${n}</i><span>${KR[n] || ''}</span>${pr(n) ? '<small>практика</small>' : ''}</div>`).join('');
      return `<div class="gsec"><span class="gtag">Вимога вмілості · точка ${s.n} з 5</span><div class="tiles" aria-hidden="true">${t}</div><blockquote>${D.vymogy[s.n - 1]}</blockquote></div>`;
    }
  };
})();
