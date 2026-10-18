  /* ---------------- бібліотека і каталог вмілостей (дизайн Д1) ---------------- */
  const PREVIEW = !!window.GUTIRKA_PREVIEW;
  const PARTIAL = false;   // true — якщо в каталозі лише частина вмілостей
  const plural = (n, f) => { const a = n % 10, b = n % 100; return f[a === 1 && b !== 11 ? 0 : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? 1 : 2]; };
  const POT_W = '<svg viewBox="0 0 100 120" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M38 10h24M40 10c0 8-4 12-10 18-8 8-12 18-12 32 0 28 16 50 32 50s32-22 32-50c0-14-4-24-12-32-6-6-10-10-10-18"/><path d="M22 58h56M24 78h52"/></svg>';
  BUILTIN.forEach(b => { if (b.key === 'budova-la-1') Object.assign(b, { type: 'vm', skill: 'budova-litalnyh-aparativ-i', added: '2026-10-14', art: '<img src="{{LA_ART}}" alt="Навчальний літак, вигляд згори">', short: 'Частини літака, профіль крила, 3D-літачок, гра з телефонів' }); });
  BUILTIN.forEach(b => { if (b.key === 'keramika-1') Object.assign(b, { type: 'vm', skill: 'keramika-i', added: '2026-10-14', art: '<img src="{{K1_ART}}" alt="Ваза на гончарному крузі">', short: 'Історія, техніки, 6 видів кераміки, 3D-ваза, гра з телефонів' }); });
  BUILTIN.forEach(b => { if (b.key === 'keramika') Object.assign(b, { type: 'vm', skill: 'keramika-i', added: '2026-10-13', art: '<img src="{{KERAMIKA_MAP}}" alt="Карта України з регіонами, про які йдеться в гутірці">', badge: POT_W, short: '9 регіонів, вироби, вікторина на карті' }); });

  /* Вмілості — з каталогу Пласту у Фінляндії (SKILL_SPECS, SKILL_LIST, SKILL_LEVEL_IMG — у skills_data.js) */
  const SPECS = SKILL_SPECS;
  const PF = 'https://plast-finland.com/vmilosti/';
  const IMGB = 'https://plast.global/wp-content/uploads/';
  /* до яких рівнів є гутірки і що з точок вони покривають */
  const DETAILS = {
    ...(BUILTIN.some(b => b.key === 'budova-la-1') ? { 'budova-litalnyh-aparativ-i': { pts: 5, g: 'budova-la-1',
      req: [['Знає що таке ЛА та назве кілька їх видів', 'full', 'є: гутірка, «Вивчай сам», «Перевір себе»'],
        ['Знає з яких основних частин складається літак, пояснить призначення кожної частини', 'full', 'є: та сама гутірка'],
        ['Вміє намалювати і знає що таке профіль крила, пояснить виникнення підйомної сили', 'full', 'є: та сама гутірка, дослід зі смужкою паперу'],
        ['Пояснить що таке кут тангажу, крену і рискання, знає які елементи забезпечують керованість', 'full', 'є: та сама гутірка, 3D-літачок'],
        ['Знає і пояснить на прикладах 5 аеродинамічних схем літаків', 'full', 'є: та сама гутірка']] } } : {}),
    'keramika-i': BUILTIN.some(b => b.key === 'keramika-1') ? { pts: 5, g: 'keramika-1',
      req: [['Історія виробів з глини, зокрема в Україні', 'full', 'є: гутірка «Кераміка І», «Вивчай сам», «Перевір себе»'],
        ['Техніки формотворення: ліплення, гончарний круг, шаблон, гіпсові форми, пресування', 'full', 'є: та сама гутірка, усі п’ять технік'],
        ['Види кераміки: теракота, майоліка, фаянс, порцеляна, камʼяна маса, шамот', 'full', 'є: та сама гутірка, гра «Вгадай вид»'],
        ['Відвідати виставку кераміки або музей', 'task', 'практичне завдання; у гутірці — як підготуватися'],
        ['Виконати три вироби власноруч', 'task', 'практичне завдання; у гутірці — поради']] } : { pts: 5, g: 'keramika',
      req: [['Історія виробів з глини, зокрема в Україні', 'full', 'є: гутірка «Кераміка України»'],
        ['Техніки формотворення: ліплення, гончарний круг, шаблон, гіпсові форми, пресування', 'part', 'частково: у тій самій гутірці'],
        ['Види кераміки: теракота, майоліка, фаянс, порцеляна, камʼяна маса, шамот', 'none', 'матеріалу ще немає'],
        ['Відвідати виставку кераміки або музей', 'task', 'практичне завдання'],
        ['Виконати три вироби власноруч', 'task', 'практичне завдання']] }
  };
  const SKILLS = SKILL_LIST.map(([n, sp, img, lv]) => {
    const levels = lv.map(([label, slug]) => ({ label, slug, url: PF + slug, img: SKILL_LEVEL_IMG[slug] ? IMGB + SKILL_LEVEL_IMG[slug] : '', d: DETAILS[slug] }));
    const gl = levels.find(l => l.d && l.d.g);   // рівень, до якого є гутірка
    return { id: levels[0].slug, n, specs: sp.map(i => SPECS[i]), img: img ? IMGB + img : '', levels, gl, g: gl && gl.d.g, lc: n.toLowerCase() };
  });
  const bySlug = {}; SKILLS.forEach(s => s.levels.forEach(l => { bySlug[l.slug] = s; }));
  const lvName = (s, l) => l.label === 'Опис' ? s.n : l.label.startsWith('Опис') ? s.n + ' (' + l.label.replace(/^Опис\s*\(|\)$/g, '') + ')' : s.n + ' ' + l.label;
  const cov = l => [l.d.req.filter(r => r[1] === 'full' || r[1] === 'part').length, l.d.pts];
  const stOf = s => { if (!s.gl) return 'none'; return s.gl.d.req.every(r => r[1] === 'full' || r[1] === 'task') ? 'full' : 'part'; };
  const ST = { full: ['#c8284a', '#ff7d99'], part: ['#c8284a', '#ff9fb4'], none: ['#383d44', '#8a929c'] };   // вмілості юнацтва — малиновий УПЮ; довжина смужки — скільки вимог покриває гутірка
  /* скільки вимог покриває гутірка, % (для смужки над нашивкою); вимоги-«завдання» (task) робить сам юнак — їх не рахуємо */
  const pcOf = s => { if (!s.gl) return 0; const r = s.gl.d.req.filter(x => x[1] !== 'task'); return r.length ? Math.min(100, Math.round(100 * r.reduce((a, x) => a + (x[1] === 'full' ? 1 : x[1] === 'part' ? .5 : 0), 0) / r.length)) : 100; };
  const ptsWord = n => plural(n, ['точка', 'точки', 'точок']);
  const gById = k => BUILTIN.find(b => b.key === k);
  /* нашивка: картинка з plast.global; якщо не завантажиться (немає інтернету) — кружечок з першою літерою */
  /* чорно-білі нашивки (є лише такі) — на світлій круглій підкладці; картинка з білим квадратом — обрізана по колу */
  /* bw — чорно-білі (вмілості Пласту в Польщі, завантажені 2026/03); sq — картинка з білим фоном; sp — інша нестандартна («Сигналізація-комунікація») */
  const picKind = src => /ch_?b|chb/i.test(src) || /2026\/03\/.*artboard/i.test(src) ? ' bw' : /\.png$/i.test(src) ? ' sq' : /artboard/i.test(src) ? ' sp' : '';
  const pic = (src, n, cls) => `<span class="vb ${cls || ''}${src ? picKind(src) : ' noimg'}">${src ? `<img src="${esc(src)}" alt="" loading="lazy" decoding="async" onerror="this.parentNode.classList.add('noimg');this.remove()">` : ''}<span class="fb">${esc(n.replace(/^[^А-ЯІЇЄҐA-Z0-9]+/, '').charAt(0))}</span></span>`;

  let TAB = 'home', gf = '', kSpec = '', kOpen = '', kMore = false;
  const stats = (el, list) => { el.innerHTML = list.map(([n, l]) => `<div><dt>${esc(l)}</dt><dd>${esc(n)}</dd></div>`).join(''); };

  function setTab(t, keepScroll) {
    TAB = t === 'kat' ? 'kat' : 'home';
    $('#l-home').hidden = TAB !== 'home'; $('#l-kat').hidden = TAB !== 'kat';
    document.querySelectorAll('#lib .tabs [data-tab]').forEach(b => { if (b.dataset.tab === TAB) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    try { history.replaceState(null, '', TAB === 'kat' ? '#katalog' : location.pathname); } catch (e) { /* ok */ }
    if (TAB === 'kat') renderKat(); else renderHome();
    if (!keepScroll) V.lib.scrollTop = 0;
  }

  /* ---- головна ---- */
  function vmTag(b) {
    const s = bySlug[b.skill]; if (!s || !s.gl) return '';
    const c = cov(s.gl);
    return `<button class="vm" type="button" data-skill="${s.id}">До вмілості «${esc(lvName(s, s.gl))}» · ${c[0]} з ${c[1]} ${ptsWord(c[1])}</button>`;
  }
  /* v.mode — гутірка в цьому файлі; v.href — гутірка на окремій сторінці сайту */
  const openAttr = v => v.href ? `href="${esc(v.href)}"` : `type="button" data-open="${v.mode}"`;
  const tagOf = v => v.href ? 'a' : 'button';
  function varBtns(b, big) {
    return b.vars.map((v, i) => big
      ? `<${tagOf(v)} class="bigvar${i ? '' : ' main'}${v.yun ? ' yun' : ''}" ${openAttr(v)}><span>${esc(v.label)}<span class="who">${esc(v.who)}</span></span><small>${esc(v.dur)} →</small></${tagOf(v)}>`
      : `<${tagOf(v)} class="var${v.yun ? ' yun' : ''}" ${openAttr(v)}>${esc(v.label)}<small>${esc(v.dur)}</small></${tagOf(v)}>`).join('');
  }
  const nVer = b => b.vars.filter(v => !v.yun && !v.dod).length;
  function renderHome() {
    const nv = BUILTIN.reduce((a, b) => a + nVer(b), 0), nk = SKILLS.filter(s => s.g).length;
    stats($('#l-stats'), [[BUILTIN.length, plural(BUILTIN.length, ['гутірка', 'гутірки', 'гутірок'])], [nv, plural(nv, ['версія', 'версії', 'версій'])], [nk, plural(nk, ['вмілість', 'вмілості', 'вмілостей'])]]);
    const last = BUILTIN.slice().sort((a, b) => String(b.added).localeCompare(String(a.added)))[0];
    $('#l-feat').innerHTML = `<div class="art">${last.art || ''}</div><div class="body">
      <div class="meta"><span class="lbl">Остання гутірка</span>${last.type === 'vm' ? vmTag(last) : ''}</div>
      <h2>${esc(last.title)}</h2><p>${esc(last.desc)}</p><div class="vars2">${varBtns(last, true)}</div></div>`;
    renderGrid();
  }
  function renderGrid() {
    [...$('#l-chips').children].forEach(b => b.setAttribute('aria-pressed', String((b.dataset.gf || '') === gf)));
    const q = $('#l-q').value.trim().toLowerCase();
    const list = BUILTIN.filter(b => (!gf || b.type === gf) &&
      (!q || (b.title + ' ' + b.desc + ' ' + b.tags.join(' ')).toLowerCase().includes(q)));
    let html = list.map(b => `<article class="card" style="--a:${b.accent}">
        <span class="kind">${b.type === 'vm' ? 'До вмілості' : 'Пізнавальна'} · ${b.vars.some(v => v.yun) ? 'гутірка + для юнацтва' : nVer(b) + ' ' + plural(nVer(b), ['версія', 'версії', 'версій'])}</span>
        <h3>${esc(b.title)}</h3><p>${esc(b.short || b.desc)}</p><div class="vars">${varBtns(b, false)}</div></article>`).join('');
    if (!q && !gf && list.length) for (let i = 0; i < (3 - list.length % 3) % 3; i++) html += '<div class="card ph" aria-hidden="true"><img src="{{EMBLEM}}" alt=""></div>';
    $('#l-grid').innerHTML = html;
    const em = $('#l-empty'); em.hidden = list.length > 0;
    em.textContent = gf === 'pz' && !q ? 'Пізнавальних гутірок поки немає.' : 'Нічого не знайдено. Спробуйте інше слово.';
  }
  $('#l-q').addEventListener('input', renderGrid);

  /* ---- каталог ---- */
  /* порядок: спершу з гутірками, далі звичайні кольорові нашивки, потім нестандартні («Настільні ігри», «Сигналізація-комунікація»),
     у самому кінці — чорно-білі й без нашивки */
  const rank = s => { if (s.g) return 0; if (!s.img) return 4; const k = picKind(s.img); return k === ' bw' ? 3 : k === ' sq' || k === ' sp' ? 2 : 1; };
  const specCount = () => { const c = {}; SKILLS.forEach(s => s.specs.forEach(x => { c[x] = (c[x] || 0) + 1; })); return c; };
  function renderKat() {
    const withG = SKILLS.filter(s => s.g).length;
    stats($('#k-stats'), [[withG, 'з гутірками'], [SPECS.length, 'спеціалізацій'], [SKILLS.length, plural(SKILLS.length, ['вмілість', 'вмілості', 'вмілостей'])]]);
    $('#k-demo').hidden = !PARTIAL;
    const cnt = specCount();
    const ord = SPECS.slice().sort((a, b) => (cnt[b] || 0) - (cnt[a] || 0) || a.localeCompare(b, 'uk')), FIRST = 3;
    let shown = kMore ? ord : ord.slice(0, FIRST);
    if (kSpec && !shown.includes(kSpec)) shown = shown.concat(kSpec);
    const rest = ord.length - shown.length;
    $('#k-specs').innerHTML = ['', ...shown].map(x => `<button type="button" data-spec="${esc(x)}" aria-pressed="${x === kSpec}">${esc(x || 'Усі')} <span class="n">${x ? cnt[x] || 0 : SKILLS.length}</span></button>`).join('')
      + (kMore ? '<button type="button" data-more="0">Згорнути ▴</button>' : rest > 0 ? `<button type="button" data-more="1">Ще ${rest} ▾</button>` : '');
    const q = $('#k-q').value.trim().toLowerCase(), only = $('#k-only').checked;
    const list = SKILLS.filter(s => (!kSpec || s.specs.includes(kSpec)) && (!q || s.lc.includes(q)) && (!only || s.g))
      .sort((a, b) => rank(a) - rank(b) || a.n.localeCompare(b.n, 'uk'));
    $('#k-h').innerHTML = esc(kSpec || 'Усі вмілості') + `<small>${list.length} ${plural(list.length, ['вмілість', 'вмілості', 'вмілостей'])}</small>`;
    const grid = $('#k-grid');
    grid.innerHTML = list.map(s => {
      const st = stOf(s);
      const note = s.gl ? `${lvName(s, s.gl)}: ${cov(s.gl)[0]} з ${cov(s.gl)[1]} ${ptsWord(cov(s.gl)[1])}` : kSpec ? '' : s.specs.join(', ');
      return `<button type="button" class="badge ${st}" data-k="${s.id}" aria-expanded="${s.id === kOpen}" aria-controls="k-det" style="--st:${ST[st][0]};--stc:${ST[st][1]};--pc:${pcOf(s)}%">
        ${pic(s.img, s.n)}<b>${esc(s.n)}</b>${note ? `<em>${esc(note)}</em>` : ''}</button>`;
    }).join('');
    const em = $('#k-empty'); em.hidden = list.length > 0;
    em.textContent = q ? 'Нічого не знайдено. Спробуйте іншу назву.' : only ? 'Тут ще немає вмілостей з гутірками.' : 'У цій спеціалізації вмілостей не знайдено.';
    const i = list.findIndex(s => s.id === kOpen);
    if (i < 0) return;
    const cols = Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length);
    const after = Math.min(list.length - 1, (Math.floor(i / cols) + 1) * cols - 1);
    grid.children[after].insertAdjacentHTML('afterend', detHtml(list[i]));
  }
  function detHtml(s) {
    const st = stOf(s), g = s.g && gById(s.g);
    const specs = s.specs.map(x => x.charAt(0).toLowerCase() + x.slice(1)).join(', ');
    const pc = { full: '#ff7d99', part: '#ffb3c4', none: '#8a929c', task: '#8a929c' };
    const pts = s.gl
      ? `<span class="lbl">Точки вмілості «${esc(lvName(s, s.gl))}»</span><ol>${s.gl.d.req.map((r, k) => `<li style="--c2:${pc[r[1]]}"><span>${k + 1}</span><span><b>${esc(r[0])}</b><small>${esc(r[2])}</small></span></li>`).join('')}</ol>`
      : `<p>Гутірки до цієї вмілості ще немає. Вимоги кожного рівня є на порталі Пласту у Фінляндії.</p>`;
    const lv = `<span class="lbl">Рівні й проби</span><div class="lvls">${s.levels.map(l => `<a class="lvl" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${l.img ? pic(l.img, s.n, 'sm') : ''}<span>${esc(lvName(s, l))}</span><small>↗</small></a>`).join('')}</div>`;
    return `<section class="kdet" id="k-det" aria-label="${esc(s.n)}" style="--st:${ST[st][0] === '#383d44' ? '#5a6573' : ST[st][0]}">
      <button class="kd-x" type="button" data-close aria-label="Закрити">×</button>
      <div class="kd-l">${pic(s.img, s.n, 'lg')}<h3>${esc(s.n)}</h3><p class="hand">${esc(specs)}</p></div>
      <div class="kd-r">${pts}${g ? `<div class="vars2">${varBtns(g, true)}</div>` : ''}${lv}</div></section>`;
  }
  function openSkill(id, scroll) {
    kOpen = kOpen === id && !scroll ? '' : id;
    renderKat();
    const d = $('#k-det');
    if (d && kOpen) setTimeout(() => d.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: scroll ? 'start' : 'nearest' }), 30);
  }
  $('#k-q').addEventListener('input', renderKat);
  $('#k-only').addEventListener('change', renderKat);
  let rzT = 0;
  addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { if (VIEW === 'lib' && TAB === 'kat' && kOpen) renderKat(); }, 150); });

  V.lib.addEventListener('click', e => {
    const t = e.target.closest('[data-tab],[data-gf],[data-skill],[data-k],[data-spec],[data-more],[data-close]');
    if (!t) return;
    if (t.hasAttribute('data-tab')) { e.preventDefault(); setTab(t.dataset.tab); }
    else if (t.hasAttribute('data-gf')) { gf = t.dataset.gf || ''; renderGrid(); }
    else if (t.hasAttribute('data-skill')) { kSpec = ''; $('#k-q').value = ''; $('#k-only').checked = false; kOpen = ''; setTab('kat'); openSkill(t.dataset.skill, true); }
    else if (t.hasAttribute('data-k')) openSkill(t.dataset.k);
    else if (t.hasAttribute('data-spec')) { kSpec = t.dataset.spec || ''; renderKat(); }
    else if (t.hasAttribute('data-more')) { kMore = t.dataset.more === '1'; renderKat(); }
    else if (t.hasAttribute('data-close')) { const id = kOpen; kOpen = ''; renderKat(); const b = document.querySelector(`#k-grid [data-k="${id}"]`); if (b) b.focus(); }
  });
  $('#l-prev').hidden = !PREVIEW;
  renderHome();
