/* Стиль «Креслення» (19.10.2026): вмикає вигляд #pres.t-bp, рамку й штамп «аркуш N», свою розмітку титулки,
   розділу «Точка N з 5» (маршрут польоту) і «великого факту». Рушій питає window.GUT_TEMA[тип слайда](s, D). */
(function () {
  'use strict';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  function on() {
    const p = document.getElementById('pres');
    if (p) { p.classList.add('t-bp'); p.insertAdjacentHTML('afterbegin', '<span class="bp-frm" aria-hidden="true"></span><span class="bp-stamp" aria-hidden="true"></span>'); }
    const t = document.getElementById('toc'); if (t) t.classList.add('t-bp');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', on); else on();
  /* маршрут польоту: 5 точок; пройдені — з галочкою, на поточній — літачок, далі — пунктир */
  function route(n) {
    const X = [60, 280, 500, 720, 940], Y = [118, 70, 56, 70, 110], i = n - 1;
    const seg = (a, b) => `M${X[a]},${Y[a]} C${(X[a] + X[b]) / 2},${Y[a]} ${(X[a] + X[b]) / 2},${Y[b]} ${X[b]},${Y[b]}`;
    let done = '', rest = '';
    for (let k = 0; k < 4; k++) (k < i ? (done += seg(k, k + 1) + ' ') : (rest += seg(k, k + 1) + ' '));
    const pts = X.map((x, k) => k < i
      ? `<circle cx="${x}" cy="${Y[k]}" r="11" fill="#5cc8ff"/><path d="M${x - 6},${Y[k]} l4,4 l8,-9" stroke="#081529" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      : k === i ? `<circle cx="${x}" cy="${Y[k]}" r="21" fill="none" stroke="#5cc8ff" stroke-width="2" opacity=".45"/><circle cx="${x}" cy="${Y[k]}" r="11" fill="#081529" stroke="#5cc8ff" stroke-width="3"/>`
        : `<circle cx="${x}" cy="${Y[k]}" r="9" fill="#081529" stroke="#93b1d1" stroke-width="2" opacity=".85"/>`).join('') +
      X.map((x, k) => `<text x="${x}" y="${Y[k] + 46}" text-anchor="middle" font-family="Unbounded" font-weight="700" font-size="20" fill="${k === i ? '#eaf2ff' : '#93b1d1'}">${pad(k + 1)}</text>`).join('');
    const from = i > 0 ? X[i - 1] - X[i] : -60;
    const plane = `<g class="pl" style="--from:${from}px"><g transform="translate(${X[i] + 6},${Y[i] - 34}) rotate(-4)"><path d="M22 0 L8 -2.4 L-1 -17 L-6 -17 L-2 -2.4 L-14 -2.4 L-19 -9 L-22 -9 L-19.5 0 L-22 9 L-19 9 L-14 2.4 L-2 2.4 L-6 17 L-1 17 L8 2.4 Z" fill="#eaf2ff"/></g></g>`;
    return `<svg viewBox="0 0 1000 180" aria-hidden="true">${rest ? `<path d="${rest}" stroke="#93b1d1" stroke-width="2.5" fill="none" stroke-dasharray="3 9" stroke-linecap="round" opacity=".8"/>` : ''}` +
      `${done ? `<path class="done" d="${done}" stroke="#5cc8ff" stroke-width="3" fill="none"/>` : ''}${pts}${plane}</svg>`;
  }
  const ptsHtml = s => s.pts ? `<ul class="pts">${s.pts.map(p => `<li>${p}</li>`).join('')}</ul>` : '';
  const secName = (s, SL, idx) => { if (s.t === 'title') return 'Титул'; for (let k = idx; k >= 0; k--) { const x = SL[k]; if (x.t === 'sec') return 'Точка ' + x.n; if (x.t === 'kintro' || x.t === 'end') return 'Підсумок'; } return 'Вступ'; };
  window.GUT_TEMA = {
    vt: true,
    title(s, D) {
      return `<div class="ttl"><span class="bey">${esc(D.spec || '')} вмілість · проба 1</span><h2>Будова<br>літальних<br>апаратів <em>${esc(D.riven || '')}</em></h2><p>гутірка для юнацтва</p>` +
        `<div class="meta"><span><b>5</b> вимог вмілості</span><span>${D.chas}</span><span>гра з телефонів</span></div></div>`;
    },
    sec(s, D) {
      return `<div class="bsec"><span class="bey">Вимога вмілості · точка ${s.n} з 5</span><div class="bnum"><b>${pad(s.n)}</b><span>/05</span></div>` +
        `<blockquote>${D.vymogy[s.n - 1]}</blockquote><div class="route">${route(s.n)}</div></div>`;
    },
    card(s) {
      if (!s.fakt) return null;
      return `<div class="k">${s.k} · ${s.h}</div><div class="bfakt"><span class="d">${s.fakt[0]}</span><b>${s.fakt[1]}</b><span>${s.fakt[2]}</span></div>` +
        (s.p ? `<p class="pp">${s.p}</p>` : '') + ptsHtml(s) + (s.ask ? `<p class="ask">${s.ask}</p>` : '') + (s.note ? `<p class="note">${s.note}</p>` : '');
    },
    /* штамп у кутку: назва, розділ, аркуш N / усього */
    after(s, idx, SL) {
      const st = document.querySelector('#pres .bp-stamp'); if (!st) return;
      st.innerHTML = `<span>Будова ЛА І</span><span>${secName(s, SL, idx)}</span><span>Аркуш <b>${pad(idx + 1)}</b>/${SL.length}</span>`;
    },
    toc(SL, cur, D, GN) {
      const out = []; let grp = null;
      const item = (i, label, cls = '') => `<button class="ti${i === cur ? ' on' : ''}${cls}" type="button" data-go="${i}">${label}</button>`;
      const row = (i, ic, t, sm) => `<div class="tg"><button class="th${i === cur ? ' on' : ''}" type="button" data-go="${i}"><i>${ic}</i><span>${t}<small>${sm}</small></span></button></div>`;
      SL.forEach((s, i) => {
        if (s.t === 'title') out.push(row(i, '·', 'Початок', 'титул і план гутірки'));
        else if (s.t === 'sec') { grp = { i, n: s.n, items: [] }; out.push(grp); }
        else if (s.t === 'kintro') { grp = null; out.push(row(i, '?', 'Гра «Потужний СКОБ!»', 'вікторина з телефонів по всіх точках')); }
        else if (s.t === 'end') { grp = null; out.push(row(i, '✓', 'Що далі', 'QR-код на «Вивчай сам»')); }
        else if (grp) {
          if (s.t === 'card' || s.t === 'prac' || s.t === 'scheme') grp.items.push(item(i, esc(s.h)));
          else if (s.t === 'gintro') grp.items.push(item(i, 'Гра «' + esc(GN) + '»', ' gm'));
          if (i === cur) grp.here = true;
        }
      });
      return out.map(g => typeof g === 'string' ? g : (() => {
        const k = D.konspekt.find(x => x.n === g.n) || {};
        return `<div class="tg${g.here || g.i === cur ? ' here' : ''}"><button class="th${g.i === cur ? ' on' : ''}" type="button" data-go="${g.i}"><i>${pad(g.n)}</i><span>${esc(k.h || '')}<small>вимога ${g.n} з 5</small></span></button>` +
          (g.items.length ? `<div class="tis">${g.items.join('')}</div>` : '') + '</div>';
      })()).join('');
    }
  };
})();
