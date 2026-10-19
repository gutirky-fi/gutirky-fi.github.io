/* Стиль «Гончарня» (19.10.2026): вмикає вигляд #pres.t-gn і дає свою розмітку деяких слайдів.
   Рушій (index.html) після свого switch питає window.GUT_TEMA[тип слайда](s, D): рядок — HTML панелі, або { h, a, wide }.
   Ще: no3d — без 3D-вази на титулці; vt — плавні переходи між слайдами; toc — свій зміст. */
(function () {
  'use strict';
  const KR = { 1: 'історія', 2: 'техніки', 3: 'види', 4: 'виставка', 5: 'власноруч' };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function on() {
    const p = document.getElementById('pres'); if (p) p.classList.add('t-gn');
    const t = document.getElementById('toc'); if (t) t.classList.add('t-gn');
    document.documentElement.classList.add('t-gn-vt');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', on); else on();
  const isPr = (D, n) => !!(D.konspekt.find(k => k.n === n) || {}).pr;
  /* п’ять плиток-проб; mode: 'plan' — усі рівні, n — поточна точка */
  function tiles(D, n, mode) {
    return [1, 2, 3, 4, 5].map((k, i) => {
      const c = mode === 'plan' ? '' : k === n ? ' cur' : k < n ? ' done' + (k === n - 1 ? ' was' : '') : '';
      return `<div class="tl${c}${isPr(D, k) ? ' pr' : ''}" style="--i:${i}"><i>${k}</i><span>${KR[k] || ''}</span>${isPr(D, k) ? '<small>практика</small>' : ''}</div>`;
    }).join('');
  }
  const ptsHtml = s => s.pts ? `<ul class="pts">${s.pts.map(p => `<li>${p}</li>`).join('')}</ul>` : '';
  window.GUT_TEMA = {
    no3d: true, vt: true,
    title(s, D) {
      const m = String(D.title || '').match(/\s(I{1,3}|І{1,3}|IV|V)$/), lv = m ? m[1] : '';
      return { a: `<div class="gtitle-art">${LA_ART.get('vessels')}</div>`,
        h: `<div class="ttl"><span class="gtag">${D.ey}</span><h2>${D.nazva}</h2>` +
          `<div class="gh">${lv ? `<span class="stmp" aria-label="рівень ${lv}"><small>рівень</small>${lv}</span>` : ''}<p>гутірка для юнацтва</p></div>` +
          `<div class="meta"><span><b>5</b> вимог вмілості</span><span>${D.chas}</span><span>гра з телефонів</span></div></div>` };
    },
    /* «Про що гутірка»: замість малюнка — ті самі п’ять плиток, що далі світитимуться по черзі */
    plan(s, D) { return { a: `<div class="gplan"><div class="tiles">${tiles(D, 0, 'plan')}</div><p>п’ять точок — п’ять плиток: пройдені вкриваються глазур’ю</p></div>` }; },
    sec(s, D) {
      return `<div class="gsec"><span class="gtag">Вимога вмілості · точка ${s.n} з 5</span><div class="tiles" aria-hidden="true">${tiles(D, s.n)}</div><blockquote>${D.vymogy[s.n - 1]}</blockquote></div>`;
    },
    /* «великий факт»: величезне число, рукописний підпис, далі — звичайні пункти */
    card(s) {
      if (!s.fakt) return null;
      return `<div class="k">${s.k} · ${s.h}</div><div class="gfakt"><b class="gbig">${s.fakt[0].replace(' ', '&#8239;')}</b><span class="ghw">${s.fakt[1]}</span></div>` +
        ptsHtml(s) + (s.ask ? `<p class="ask">${s.ask}</p>` : '') + (s.note ? `<p class="note">${s.note}</p>` : '');
    },
    /* зміст: розділи-точки з плитками, у кожному — слайди; поточний підсвічено */
    toc(SL, cur, D, GN) {
      const out = []; let grp = null;
      const item = (i, label, cls = '') => `<button class="ti${i === cur ? ' on' : ''}${cls}" type="button" data-go="${i}">${label}</button>`;
      SL.forEach((s, i) => {
        if (s.t === 'title') out.push(`<div class="tg"><button class="th${cur === 0 ? ' on' : ''}" type="button" data-go="${i}"><i>·</i><span>Початок<small>титулка і план гутірки</small></span></button></div>`);
        else if (s.t === 'sec') { grp = { i, n: s.n, items: [] }; out.push(grp); }
        else if (s.t === 'kintro') { grp = null; out.push(`<div class="tg"><button class="th${i === cur ? ' on' : ''}" type="button" data-go="${i}"><i>?</i><span>Гра «Потужний СКОБ!»<small>вікторина з телефонів по всіх точках</small></span></button></div>`); }
        else if (s.t === 'end') { grp = null; out.push(`<div class="tg"><button class="th${i === cur ? ' on' : ''}" type="button" data-go="${i}"><i>✓</i><span>Що далі<small>QR-код на «Вивчай сам»</small></span></button></div>`); }
        else if (grp) {
          if (s.t === 'card' || s.t === 'prac') grp.items.push(item(i, esc(s.h)));
          else if (s.t === 'gintro') grp.items.push(item(i, 'Гра «' + esc(GN) + '»', ' gm'));
          if (i === cur) grp.here = true;
        }
      });
      return out.map(g => typeof g === 'string' ? g : (() => {
        const k = D.konspekt.find(x => x.n === g.n) || {};
        return `<div class="tg${g.here || g.i === cur ? ' here' : ''}"><button class="th${g.i === cur ? ' on' : ''}" type="button" data-go="${g.i}"><i class="${isPr(D, g.n) ? 'pr' : ''}">${g.n}</i><span>${esc(k.h || '')}<small>${isPr(D, g.n) ? 'практика — юнак робить сам' : 'вимога ' + g.n + ' з 5'}</small></span></button>` +
          (g.items.length ? `<div class="tis">${g.items.join('')}</div>` : '') + '</div>';
      })()).join('');
    }
  };
})();
