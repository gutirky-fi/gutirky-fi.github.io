/* Вибір точок проби кнопками — СПІЛЬНЕ для «Проб» (proby.html) і «Вхід виховника → Прийшов, перейшов, пішов → Що вже має» (vykhovnyk.html). 14.11.2026.
   Дані — офіційні бланки КБ УПЮ 2021 (вбудовує zibraty.py з etap2/indeks_prob.json) або аркуш книги «Індекс проб» (приймач віддає його в дії {dija:'proby'} → indeks;
   приймач перевіряє точки саме за ним, тому сторінка бере книжний індекс, коли він є).
   Правило проєкту: міняєте, як вибираються точки, — міняйте ТУТ, а не в сторінках.
   Використання:
     const TK = Tochky.stvoryty(INDEKS);          // INDEKS = [{pr, nazva, dodatok, rozdily:[{l, n, t:[…]}]}]
     TK.knyha(v.indeks);                          // індекс з книги (необов'язково)
     box.innerHTML = TK.knopky(pr, vybraniSet, {status, rozdil});   // кнопки
     TK.klik(e, box, pr, vybraniSet) → 'tochka' | 'zmina' | null    // 'zmina' — треба перемалювати, 'tochka' — лише оновити лічильник
   Стилі — у spilne.css (блок .tkv): контейнер кнопок має клас tkv. */
window.Tochky = (function () {
  'use strict';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

  function stvoryty(IXV) {
    IXV = IXV || [];
    const PROBY = IXV.map(p => p.pr), META = Object.fromEntries(IXV.map(p => [p.pr, p]));
    let IXK = {};   // з книги: {проба: [{t, rz, k}]}
    const knyha = ix => { IXK = ix || {}; };

    function rozdily(pr) {   // [{nazva, tt:[{t, k}]}]
      const kn = IXK[pr];
      if (kn && kn.length) {
        const out = []; kn.forEach(x => { let r = out[out.length - 1]; if (!r || r.nazva !== x.rz) out.push(r = {nazva: x.rz, tt: []}); r.tt.push({t: x.t, k: x.k}); });
        return out;
      }
      return (META[pr] ? META[pr].rozdily : []).map(r => ({nazva: r.l ? r.l + ' · ' + r.n : '', tt: r.t.map((k, i) => ({t: r.l + (i + 1), k}))}));
    }
    const tochky = pr => rozdily(pr).flatMap(r => r.tt);
    const nazvaPr = pr => { const M = META[pr]; if (!M) return pr; const d = M.dodatok || ''; return M.nazva + (!d ? '' : d[0] === '«' ? ' ' + d : ' (' + d + ')'); };

    // перелік точок стисло: А1–А4, Б2
    function stysno(tt) {
      const out = []; let i = 0;
      while (i < tt.length) {
        const m = /^(\D*)(\d+)$/.exec(tt[i]); let j = i;
        if (m) while (j + 1 < tt.length) { const n = /^(\D*)(\d+)$/.exec(tt[j + 1]); if (!n || n[1] !== m[1] || +n[2] !== +m[2] + (j + 1 - i)) break; j++; }
        out.push(j - i >= 2 ? tt[i] + '–' + tt[j] : tt.slice(i, j + 1).join(', ')); i = j + 1;
      }
      return out.join(', ');
    }

    // вибрані точки в порядку бланка (власні, яких на бланку немає, — наприкінці)
    function vporyadkuvaty(pr, vybr) {
      const poryadok = tochky(pr).map(x => x.t), v = [...vybr];
      const idx = t => { const i = poryadok.indexOf(t); return i < 0 ? 1e6 : i; };
      return v.map((t, i) => [t, i]).sort((a, b) => idx(a[0]) - idx(b[0]) || a[1] - b[1]).map(x => x[0]);
    }

    /* Кнопки точок. o.status(t) → {vsi: true, text} (точка вже є в усіх вибраних — кнопка заблокована) | {text} (дрібний підпис) | null;
       o.rozdil — біля заголовка розділу кнопка «весь розділ». Якщо бланка немає — поле «впишіть точку, як на бланку». */
    function knopky(pr, vybr, o) {
      o = o || {};
      const rz = rozdily(pr);
      if (!rz.length) {
        const svoi = [...vybr];
        return `<p class="pust">Бланка «${esc(nazvaPr(pr))}» у книзі ще немає (аркуш «Індекс проб»). Впишіть точку так, як на бланку, і натисніть «Додати».</p>
          <div class="tk-vl"><input class="in" data-tk="vl" maxlength="8" placeholder="напр. А3"><button class="btn" type="button" data-tk="vlb">Додати</button></div>
          ${svoi.length ? '<div class="tt">' + svoi.map(t => `<button type="button" class="t" data-t="${esc(t)}" aria-pressed="true"><b>${esc(t)}</b><span>вписано вручну</span></button>`).join('') + '</div>' : ''}`;
      }
      return rz.map((r, ri) => {
        const [l, ...n] = r.nazva.split(' · ');
        const vsiBtn = o.rozdil && r.tt.length > 1 ? `<button type="button" class="tk-all" data-tk="rz" data-i="${ri}">весь розділ</button>` : '';
        return `<div class="rz">${r.nazva ? `<h4><span><b>${esc(l)}</b>${esc(n.join(' · '))}</span>${vsiBtn}</h4>` : ''}<div class="tt">` + r.tt.map(x => {
          const st = o.status ? o.status(x.t) : null, vsi = !!(st && st.vsi);
          return `<button type="button" class="t${vsi ? ' ye' : ''}" data-t="${esc(x.t)}" aria-pressed="${vybr.has(x.t) && !vsi}"${vsi ? ' aria-disabled="true"' : ''} title="${esc(x.k)}"><b>${esc(x.t)}</b><span>${esc(x.k)}</span>${st && st.text ? `<i>${esc(st.text)}</i>` : ''}</button>`;
        }).join('') + '</div></div>';
      }).join('');
    }

    // клік у блоці кнопок: змінює множину vybr; → 'tochka' (змінилась одна кнопка — вже оновлена), 'zmina' (перемалювати), null
    function klik(e, box, pr, vybr) {
      const vlb = e.target.closest('[data-tk="vlb"]');
      if (vlb) { const inp = box.querySelector('[data-tk="vl"]'), v = inp ? inp.value.trim().replace(/\s+/g, '').toUpperCase() : ''; if (!v) return null; vybr.add(v); return 'zmina'; }
      const all = e.target.closest('[data-tk="rz"]');
      if (all) {
        const div = all.closest('.rz'), bb = [...div.querySelectorAll('.t:not(.ye)')], ts = bb.map(b => b.dataset.t);
        if (ts.every(t => vybr.has(t))) ts.forEach(t => vybr.delete(t)); else ts.forEach(t => vybr.add(t));
        return 'zmina';
      }
      const b = e.target.closest('.t[data-t]'); if (!b || b.classList.contains('ye')) return null;
      const t = b.dataset.t; if (vybr.has(t)) vybr.delete(t); else vybr.add(t);
      b.setAttribute('aria-pressed', String(vybr.has(t)));
      return rozdily(pr).length ? 'tochka' : 'zmina';
    }

    return {PROBY, META, rozdily, tochky, nazvaPr, stysno, vporyadkuvaty, knyha, knopky, klik};
  }

  return {stvoryty};
})();
