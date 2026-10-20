/* Стиль «Гончарня» (19.10.2026): вмикає вигляд #pres.t-gn і дає свою розмітку деяких слайдів.
   Рушій (index.html) після свого switch питає window.GUT_TEMA[тип слайда](s, D): рядок — HTML панелі, або { h, a, wide }.
   Ще: no3d — без 3D-вази на титулці; vt — плавні переходи між слайдами; toc — свій зміст. */
(function () {
  'use strict';
  let KR = { 1: 'історія', 2: 'техніки', 3: 'види', 4: 'виставка', 5: 'власноруч' };
  const KRf = () => (window.LA && window.LA.kr) || KR;
  const NN = () => (window.LA && window.LA.vymogy ? window.LA.vymogy.length : 5);
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
    return Array.from({ length: NN() }, (_, i) => i + 1).map((k, i) => {
      const c = mode === 'plan' ? '' : k === n ? ' cur' : k < n ? ' done' + (k === n - 1 ? ' was' : '') : '';
      return `<div class="tl${c}${isPr(D, k) ? ' pr' : ''}" style="--i:${i}"><i>${k}</i><span>${KRf()[k] || ''}</span>${isPr(D, k) ? '<small>практика</small>' : ''}</div>`;
    }).join('');
  }
  /* полиця з п'ятьма виробами — по одному на точку вимог: сира глина → на крузі (поточна, «виростає») → у глазурі (пройдена) */
  const VES = [   // профіль [висота 0..1, радіус], висота виробу, вушко
    { p: [[0, 24], [.08, 36], [.3, 48], [.52, 50], [.74, 40], [.86, 30], [.92, 31], [.97, 34], [1, 33]], h: 104 },          // горщик
    { p: [[0, 20], [.1, 30], [.35, 38], [.55, 34], [.72, 20], [.85, 15], [.95, 18], [1, 21]], h: 150, ear: 1 },           // глечик
    { p: [[0, 18], [.08, 24], [.45, 31], [.85, 34], [1, 35]], h: 82, ear: 2 },                                              // чашка
    { p: [[0, 15], [.07, 18], [.3, 30], [.5, 32], [.7, 21], [.86, 14], [1, 19]], h: 160 },                                  // ваза
    { p: [[0, 18], [.15, 34], [.45, 46], [.8, 52], [1, 54]], h: 58 }                                                        // миска
  ];
  const f1 = n => Math.round(n * 10) / 10;
  function cr(pts) { let d = ''; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`; } return d; }
  function vessel(v, cx, by) {
    const L = v.p.map(([t, r]) => [cx - r, by - t * v.h]), R = v.p.map(([t, r]) => [cx + r, by - t * v.h]).reverse();
    let d = `M${f1(L[0][0])},${f1(L[0][1])}${cr(L)} L${f1(R[0][0])},${f1(R[0][1])}${cr(R)} Z`;
    const top = v.p[v.p.length - 1], ty = by - v.h, mouth = `<ellipse cx="${cx}" cy="${f1(ty)}" rx="${top[1]}" ry="${f1(top[1] * .22)}" class="mo"/>`;
    let ear = '';
    if (v.ear) { const a = v.p[v.ear === 1 ? 6 : 3], b = v.p[v.ear === 1 ? 3 : 1], ya = by - a[0] * v.h, yb = by - b[0] * v.h, xa = cx + a[1], xb = cx + b[1];
      ear = `<path d="M${xa},${f1(ya)} C${xa + 30},${f1(ya - 4)} ${xb + 30},${f1(yb - 2)} ${xb},${f1(yb)}" class="ear"/>`; }
    return { body: `<path d="${d}"/>`, mouth, ear };
  }
  function shelf(D, n, mode) {
    const X = NN() === 4 ? [140, 380, 620, 860] : [110, 305, 500, 695, 890], BY = 196;
    let g = `<defs><linearGradient id="gs-raw" x1="0" x2="1"><stop offset="0" stop-color="#b9a283"/><stop offset=".45" stop-color="#e4d2b8"/><stop offset="1" stop-color="#a48c6c"/></linearGradient>` +
      `<linearGradient id="gs-cl" x1="0" x2="1"><stop offset="0" stop-color="#9c4220"/><stop offset=".4" stop-color="#f08c52"/><stop offset="1" stop-color="#8a3a1c"/></linearGradient>` +
      `<linearGradient id="gs-gl" x1="0" x2="1"><stop offset="0" stop-color="#1f6b4b"/><stop offset=".4" stop-color="#6cc49a"/><stop offset="1" stop-color="#1c5a40"/></linearGradient>` +
      `<linearGradient id="gs-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a37"/><stop offset="1" stop-color="#4a2c18"/></linearGradient>` +
      `<radialGradient id="gs-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f08c52" stop-opacity=".55"/><stop offset="1" stop-color="#f08c52" stop-opacity="0"/></radialGradient></defs>` +
      `<rect x="10" y="${BY + 6}" width="980" height="16" rx="4" fill="url(#gs-wood)"/><rect x="10" y="${BY + 22}" width="980" height="6" fill="#000" opacity=".25"/>`;
    X.forEach((x, k) => {
      const num = k + 1, pr = isPr(D, num), st = mode === 'plan' ? 'raw' : num === n ? 'cur' : num < n ? 'done' : 'raw', was = mode !== 'plan' && num === n - 1;
      const v = vessel(VES[k], x, BY + (st === 'cur' ? -10 : 0)), fill = st === 'done' ? 'url(#gs-gl)' : st === 'cur' ? 'url(#gs-cl)' : 'url(#gs-raw)';
      let it = '';
      if (st === 'cur') it += `<ellipse cx="${x}" cy="${BY - 40}" rx="120" ry="95" fill="url(#gs-glow)"/>` +
        `<ellipse cx="${x}" cy="${BY - 4}" rx="74" ry="13" fill="#15100c" stroke="#ffc247" stroke-width="2"/><ellipse cx="${x}" cy="${BY - 4}" rx="58" ry="9" fill="none" stroke="#ffe08a" stroke-width="2" class="spin"/>`;
      it += `<g class="ves ${st}${was ? ' was' : ''}${pr ? ' pr' : ''}" style="--i:${k}"><g fill="${fill}">${v.ear}${v.body}</g>` +
        (was ? `<g class="over" fill="url(#gs-cl)">${v.ear}${v.body}</g>` : '') + v.mouth +
        (st === 'done' ? `<path d="M${x - VES[k].p[2][1] * .55},${BY - VES[k].h * .7} q-4,${VES[k].h * .25} 2,${VES[k].h * .45}" class="shine"/>` : '') + '</g>';
      it += `<text x="${x}" y="${BY + 62}" class="nm${st === 'cur' ? ' on' : ''}">${num}</text><text x="${x}" y="${BY + 92}" class="lb${st === 'cur' ? ' on' : ''}">${KRf()[num]}</text>` +
        (pr ? `<text x="${x}" y="${BY + 114}" class="pt">практика</text>` : '');
      g += it;
    });
    return `<svg class="gshelf" viewBox="0 0 1000 320" aria-hidden="true">${g}</svg>`;
  }
  const ptsHtml = s => s.pts ? `<ul class="pts">${s.pts.map(p => `<li>${p}</li>`).join('')}</ul>` : '';
  window.GUT_TEMA = {
    no3d: true, vt: true,
    title(s, D) {
      const m = String(D.title || '').match(/\s(I{1,3}|І{1,3}|IV|V)$/), lv = m ? m[1] : '';
      return { a: `<div class="gtitle-art">${LA_ART.get('vessels')}</div>`,
        h: `<div class="ttl"><span class="gtag">${D.ey}</span><h2>${D.nazva}</h2>` +
          `<div class="gh">${lv ? `<span class="stmp" aria-label="рівень ${lv}"><small>рівень</small>${lv}</span>` : ''}<p>гутірка для юнацтва</p></div>` +
          `<div class="meta"><span><b>${D.vymogy.length}</b> кроки</span><span>${D.chas}</span><span>гра з телефонів</span></div></div>` };
    },
    /* «Про що гутірка»: замість малюнка — ті самі п’ять плиток, що далі світитимуться по черзі */
    plan(s, D) { return { a: `<div class="gplan">${shelf(D, 0, 'plan')}<p>чотири кроки — чотири вироби на полиці: пройдені вкриваються глазурʼю</p></div>` }; },
    sec(s, D) {
      return `<div class="gsec"><span class="gtag">Крок ${s.n} з ${D.vymogy.length}</span>${shelf(D, s.n)}<blockquote>${D.vymogy[s.n - 1]}</blockquote></div>`;
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
        return `<div class="tg${g.here || g.i === cur ? ' here' : ''}"><button class="th${g.i === cur ? ' on' : ''}" type="button" data-go="${g.i}"><i class="${isPr(D, g.n) ? 'pr' : ''}">${g.n}</i><span>${esc(k.h || '')}<small>${isPr(D, g.n) ? 'практика — юнак робить сам' : 'крок ' + g.n + ' з ' + D.vymogy.length}</small></span></button>` +
          (g.items.length ? `<div class="tis">${g.items.join('')}</div>` : '') + '</div>';
      })()).join('');
    }
  };
})();
