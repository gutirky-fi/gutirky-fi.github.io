/* Стиль «Мандрівка» для «Кераміки України» (19.10.2026, варіант для порівняння).
   Поверх карти: маршрут через 9 регіонів у порядку гутірки, на пройдених — печатка «побували», на поточному — пульсуюче коло;
   угорі — «Маршрут: N з 9», у кутку — троянда вітрів. Працює ззовні гутірки: слухає подію gutirka:slide і читає window.GUTIRKA.state(). */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg', N = 9;
  const SKIP = ['Початок', 'Вступ', 'Технологія', 'Історія', 'Вікторина', 'Завершення', 'Підсумок'];
  function ensure(sv) {
    let g = sv.querySelector('#mroute'); if (g) return g;
    const pts = [...sv.querySelectorAll('.rg')].slice(0, N).map(r => { const b = r.getBBox(); return [b.x + b.width / 2, b.y + b.height / 2]; });
    if (pts.length < N) return null;
    // поправки для регіонів, де центр рамки не на суші (Причорномор'я з Кримом, Полісся)
    pts[8] = [pts[8][0] - 30, pts[8][1] - 30];
    /* плавні дуги між зупинками, як дорога на старій мапі */
    const d = pts.map((p, i) => { if (!i) return 'M' + p[0].toFixed(1) + ',' + p[1].toFixed(1);
      const q = pts[i - 1], mx = (q[0] + p[0]) / 2, my = (q[1] + p[1]) / 2, dx = p[0] - q[0], dy = p[1] - q[1], k = (i % 2 ? .22 : -.22);
      return 'Q' + (mx - dy * k).toFixed(1) + ',' + (my + dx * k).toFixed(1) + ' ' + p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    g = document.createElementNS(NS, 'g'); g.id = 'mroute'; g.setAttribute('pointer-events', 'none');
    g.innerHTML = `<path class="mr-all" d="${d}"/><path class="mr-done" d="${d}"/>` +
      pts.map((p, i) => `<g class="mst" data-n="${i}" transform="translate(${p[0].toFixed(1)},${p[1].toFixed(1)})"><g class="sz"><circle class="here" r="9"/>` +
        `<g class="stamp" transform="rotate(${[-14, 9, -6, 12, -10, 7, -12, 10, -8][i]})"><circle r="8.5"/><circle r="6.3" class="in"/><path d="M-3.2,0.2 l2.2,2.4 l4.4,-4.8"/></g></g></g>`).join('');
    g.dataset.len = '1';
    sv.appendChild(g);
    new MutationObserver(() => keepSize(sv)).observe(sv, { attributes: true, attributeFilter: ['viewBox'] }); keepSize(sv);
    const all = g.querySelector('.mr-done'); try { const L = all.getTotalLength(); g.dataset.len = L; all.style.strokeDasharray = L; all.style.strokeDashoffset = L; } catch (e) { /* ok */ }
    g._pts = pts;
    return g;
  }
  /* довжина шляху до кожної зупинки (крива, тож шукаємо по точках) */
  function atLen(path, pts) {
    const L = path.getTotalLength(), out = [0]; let j = 1;
    for (let l = 0; l <= L && j < pts.length; l += 1) { const p = path.getPointAtLength(l); if (Math.hypot(p.x - pts[j][0], p.y - pts[j][1]) < 1.2) { out.push(l); j++; } }
    while (out.length < pts.length) out.push(L);
    return out;
  }
  /* карта наближається до регіону — печатки й кола лишаються однакового розміру на екрані */
  function keepSize(sv) {
    const g = sv.querySelector('#mroute'); if (!g) return;
    const vb = (sv.getAttribute('viewBox') || '0 0 612.5 408').split(/[ ,]+/).map(Number), z = Math.max(1, 612.5 / (vb[2] || 612.5));
    g.style.setProperty('--z', (1 / z).toFixed(3));
  }
  function chip() {
    let c = document.getElementById('mchip');
    if (!c) { const app = document.getElementById('app'); if (!app) return null; c = document.createElement('div'); c.id = 'mchip'; app.appendChild(c);
      const k = document.createElement('div'); k.id = 'mcomp'; k.setAttribute('aria-hidden', 'true');
      k.innerHTML = '<svg viewBox="-50 -50 100 100"><circle r="44" class="o"/><circle r="30" class="o2"/><path class="n" d="M0,-42 L7,0 L0,6 L-7,0Z"/><path class="s" d="M0,42 L7,0 L0,-6 L-7,0Z"/><path class="e" d="M42,0 L0,6 L-5,0 L0,-6Z"/><path class="e" d="M-42,0 L0,6 L5,0 L0,-6Z"/><text y="-30">Пн</text></svg>';
      app.appendChild(k); }
    return c;
  }
  function upd() {
    const sv = document.getElementById('sv'), G = window.GUTIRKA; if (!sv || !G || !G.state) return;
    const st = G.state(), cur = st.index, secs = st.sections || [];
    const reg = secs.filter(([n]) => !SKIP.includes(n)).slice(0, N).map(x => x[1]);
    const quiz = (secs.find(([n]) => n === 'Вікторина') || [0, 1e9])[1];
    if (reg.length < N) return;
    const g = ensure(sv); if (!g) return;
    let here = -1, done = 0;
    reg.forEach((s, i) => { if (s <= cur) here = i; });
    if (cur >= quiz) { here = -1; done = N; } else done = Math.max(0, here);
    g.querySelectorAll('.mst').forEach((m, i) => { m.classList.toggle('done', i < done || (cur >= quiz)); m.classList.toggle('now', i === here); m.classList.toggle('vis', here >= 0 || cur >= quiz); });
    // суцільна лінія — до поточного регіону
    const path = g.querySelector('.mr-done'), L = +g.dataset.len, pts = g._pts;
    const k = cur >= quiz ? N - 1 : here, upto = k <= 0 ? 0 : (g._at || (g._at = atLen(path, pts)))[k];
    path.style.strokeDashoffset = Math.max(0, L - upto);
    g.classList.toggle('on', here >= 0 || cur >= quiz);
    const c = chip(); if (c) { const n = cur >= quiz ? N : here >= 0 ? here + 1 : 0; c.innerHTML = `<b>Маршрут</b><span>${n}&nbsp;з&nbsp;${N}</span><i style="--p:${n / N}"></i>`; c.classList.toggle('on', n > 0); }
  }
  document.addEventListener('gutirka:slide', () => requestAnimationFrame(upd));
  document.documentElement.classList.add('t-mandr');
})();
