/* Документи гуртка — «папір»: аркуш на телефоні й перегляд на весь екран (09.11.2026).
   Вставляє zibraty.py у кожну сторінку, де є аркуші (звіти, бланки, проби, витяг каси).

   Papir.fit(корінь)  — на вузькому екрані аркуші (.ppr, .sheet) самі зменшуються на всю ширину, як сторінка в PDF-переглядачі.
   Papir.view({title, pages, file, print}) — вікно «Переглянути» на весь екран: аркуш цілком на ширину екрана,
       пальцями наблизити / віддалити, кілька аркушів — гортати вниз. Лише потім унизу кнопки:
       «Зберегти PDF», «Надіслати» (той самий PDF через меню телефона: WhatsApp, Telegram, пошта…), «Друк».
       Нічого не завантажується, поки не натиснути кнопку: бібліотеки для PDF беруться з інтернету лише тоді.
   Дані нікуди не йдуть: PDF робиться в самому браузері. */
(function () {
  'use strict';

  var LIB = {
    pdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js',
    h2c: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
  };
  var PAD = 10;      // поле навколо аркушів у вікні перегляду, px
  var TOP = 56;      // зверху лишаємо місце під кнопку «закрити», px
  var GAP = 18;      // відстань між аркушами, px
  var libP = null;

  /* ---------- розміри аркушів ---------- */
  // w — природна ширина (px при 96 dpi), min — найменша ширина, коли аркуш ще не зменшують, land — лежачи
  function nat(el) {
    var c = el.classList;
    if (c.contains('ppr')) { var l = c.contains('land'); return {w: l ? 1123 : 794, min: l ? 1123 : 794, land: l}; }
    if (c.contains('sheet')) {
      if (c.contains('port')) return {w: 800, min: 640, land: false};
      if (c.contains('pt')) return {w: 820, min: 640, land: false};
      return {w: 1080, min: 860, land: true};
    }
    if (c.contains('vtp')) return {w: 794, min: 794, land: false, pad: true};
    var w = el.offsetWidth || 794;
    return {w: w, min: w, land: false};
  }

  /* ---------- 1. аркуш сам зменшується на вузькому екрані ---------- */
  function fit(root) {
    if (!root || root.__papirFit) return;
    root.__papirFit = true;
    var busy = false;
    function run() {
      busy = false;
      var cs = getComputedStyle(root);
      var av = root.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      var list = root.querySelectorAll('.ppr, .sheet');
      for (var i = 0; i < list.length; i++) {
        var n = nat(list[i]), z = av > 0 ? Math.min(1, av / n.min) : 1;
        list[i].style.zoom = z < 0.995 ? z.toFixed(4) : '';
      }
    }
    function later() { if (!busy) { busy = true; requestAnimationFrame(run); } }
    if (window.ResizeObserver) new ResizeObserver(later).observe(root);
    window.addEventListener('resize', later);
    new MutationObserver(later).observe(root, {childList: true, subtree: true});
    run();
  }

  /* ---------- клон аркуша: без id, без редагування, без масштабу ---------- */
  function klon(el) {
    var n = nat(el), c = el.cloneNode(true), all = c.querySelectorAll('*'), i;
    c.removeAttribute('id');
    for (i = 0; i < all.length; i++) {
      if (!all[i].closest('svg')) all[i].removeAttribute('id');   // у значках SVG id потрібні (посилання на градієнти)
      all[i].removeAttribute('contenteditable');
      all[i].removeAttribute('tabindex');
    }
    var a = el.querySelectorAll('input,textarea,select'), b = c.querySelectorAll('input,textarea,select');
    for (i = 0; i < a.length && i < b.length; i++) {
      if (b[i].tagName === 'TEXTAREA') b[i].textContent = a[i].value;
      else if (b[i].tagName === 'SELECT') { for (var j = 0; j < b[i].options.length; j++) b[i].options[j].selected = a[i].options[j].selected; }
      else if (b[i].type === 'checkbox' || b[i].type === 'radio') { if (a[i].checked) b[i].setAttribute('checked', ''); else b[i].removeAttribute('checked'); }
      else b[i].setAttribute('value', a[i].value);
    }
    c.style.zoom = '1';
    c.style.margin = '0';
    if (el.classList.contains('sheet') || el.classList.contains('ppr')) {
      c.style.width = n.w + 'px';
      if (el.classList.contains('sheet')) { c.style.minWidth = '0'; c.style.maxWidth = 'none'; }
    }
    if (n.pad) {   // витяг каси: лише вміст — додаємо білий аркуш із полями, як при друці
      var p = document.createElement('div');
      p.className = 'pv-paper';
      p.style.width = n.w + 'px';
      p.style.minHeight = Math.round(n.w * 297 / 210) + 'px';
      p.appendChild(c);
      return p;
    }
    return c;
  }

  /* ---------- значки .ik: маска не малюється в html2canvas, тому міняємо на звичайну картинку ---------- */
  function hex(rgb) {
    var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb || '');
    if (!m) return '%231d2125';
    return '%23' + [m[1], m[2], m[3]].map(function (x) { return ('0' + (+x).toString(16)).slice(-2); }).join('');
  }
  function znachky(doc) {
    var list = doc.querySelectorAll('.ik'), win = doc.defaultView;
    for (var i = 0; i < list.length; i++) {
      var cs = win.getComputedStyle(list[i]), v = cs.getPropertyValue('--ik') || '';
      var m = /url\(\s*"([^"]+)"\s*\)/.exec(v) || /url\(\s*'([^']+)'\s*\)/.exec(v) || /url\(\s*([^)"']+)\s*\)/.exec(v);
      if (!m || m[1].indexOf('data:image/svg+xml') !== 0) continue;
      var u = m[1].replace(/stroke='black'/g, "stroke='" + hex(cs.color) + "'").replace(/fill='black'/g, "fill='" + hex(cs.color) + "'");
      list[i].style.webkitMask = 'none';
      list[i].style.mask = 'none';
      list[i].style.background = 'url("' + u + '") center/contain no-repeat';
    }
  }

  /* ---------- PDF: бібліотеки беруться лише коли натиснули кнопку ---------- */
  function skrypt(u) {
    return new Promise(function (ok, no) {
      var s = document.createElement('script');
      s.src = u; s.async = true;
      s.onload = function () { ok(); };
      s.onerror = function () { no(new Error('lib')); };
      document.head.appendChild(s);
    });
  }
  function zavLib() {
    if (window.jspdf && window.html2canvas) return Promise.resolve();
    if (!libP) {
      libP = Promise.all([window.jspdf ? 0 : skrypt(LIB.pdf), window.html2canvas ? 0 : skrypt(LIB.h2c)])
        .then(function () { if (!(window.jspdf && window.html2canvas)) throw new Error('lib'); }, function (e) { libP = null; throw e; });
    }
    return libP;
  }

  // Де можна різати довгий аркуш на сторінки: не посеред рядка, таблиці, картки; заголовок не лишається без тексту.
  function zakazy(c) {
    var top0 = c.getBoundingClientRect().top, out = [], all = c.querySelectorAll('*');
    var TAG = /^(TR|LI|P|H1|H2|H3|H4|IMG|SVG|FIGURE|CANVAS|BUTTON|LABEL|THEAD)$/;
    for (var i = 0; i < all.length; i++) {
      var x = all[i], r = x.getBoundingClientRect(), h = r.height;
      if (h < 2) continue;
      var tag = x.tagName.toUpperCase(), cs = null, ya = false;
      if (TAG.test(tag)) ya = true;
      else if (h <= 70) ya = true;
      else { cs = getComputedStyle(x); ya = cs.breakInside === 'avoid' || cs.pageBreakInside === 'avoid'; }
      if (!ya) continue;
      out.push([r.top - top0, r.bottom - top0 + (/^H[1-4]$/.test(tag) ? 26 : 0)]);
    }
    return out;
  }
  function rizaty(zk, y0, lim, najmenshe) {
    for (var y = lim; y > najmenshe; y -= 2) {
      var ok = true;
      for (var i = 0; i < zk.length; i++) { if (zk[i][0] < y - 0.5 && y + 0.5 < zk[i][1]) { ok = false; break; } }
      if (ok) return y;
    }
    return lim;
  }

  function malyuvaty(pages, o, progress) {
    var jsPDF = window.jspdf.jsPDF, host = document.createElement('div'), doc = null, chain = Promise.resolve();
    host.className = 'pv-host';
    host.setAttribute('aria-hidden', 'true');
    document.body.appendChild(host);
    pages.forEach(function (el, idx) {
      chain = chain.then(function () {
        progress(idx + 1, pages.length);
        var n = nat(el), c = klon(el);
        host.innerHTML = '';
        host.style.width = n.w + 'px';
        host.appendChild(c);
        var H = c.offsetHeight, zk = zakazy(c);
        var sc = Math.max(1, Math.min(2, Math.sqrt(12e6 / (n.w * H))));   // не більше ~12 млн пікселів — щоб телефон витримав
        return window.html2canvas(c, {
          scale: sc, backgroundColor: '#ffffff', logging: false, useCORS: true,
          scrollX: 0, scrollY: 0, windowWidth: Math.max(n.w, 1280),
          onclone: function (d) { znachky(d); }
        }).then(function (cv) {
          var PW = n.land ? 297 : 210, PH = n.land ? 210 : 297, k = PW / n.w, topMm = 0, botMm = 8;
          var orient = n.land ? 'l' : 'p', segs = [], y0 = 0;
          if (H * k <= PH * 1.06) {   // одна сторінка (трохи завелике — стискаємо, щоб лишилась A4 на одну сторінку)
            var k1 = Math.min(k, PH / H);
            segs.push({y0: 0, y1: H, k: k1, x: (PW - n.w * k1) / 2, ty: 0});
          } else {
            while (y0 < H - 1) {
              var tp = y0 === 0 ? 0 : 8, per = (PH - tp - botMm) / k, y1;
              if (y0 + per >= H) y1 = H;
              else y1 = rizaty(zk, y0, y0 + per, y0 + per * 0.35);
              segs.push({y0: y0, y1: y1, k: k, x: 0, ty: tp});
              y0 = y1;
            }
          }
          segs.forEach(function (s) {
            var cut = document.createElement('canvas'), w = cv.width, h = Math.max(1, Math.round((s.y1 - s.y0) * sc));
            cut.width = w; cut.height = h;
            var g = cut.getContext('2d');
            g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
            g.drawImage(cv, 0, Math.round(s.y0 * sc), w, h, 0, 0, w, h);
            if (!doc) doc = new jsPDF({unit: 'mm', format: 'a4', orientation: orient, compress: true});
            else doc.addPage('a4', orient);
            doc.addImage(cut.toDataURL('image/jpeg', 0.92), 'JPEG', s.x, s.ty, n.w * s.k, (s.y1 - s.y0) * s.k, undefined, 'FAST');
            cut.width = cut.height = 0;
          });
          cv.width = cv.height = 0;
        });
      });
    });
    return chain.then(function () {
      host.remove();
      if (o.title) { try { doc.setProperties({title: o.title}); } catch (e) {} }
      return doc.output('blob');
    }, function (e) { host.remove(); throw e; });
  }

  /* ---------- 2. вікно «Переглянути» ---------- */
  var IC = {
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>',
    fit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4"/></svg>',
    dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M4 20h16"/></svg>',
    sh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
    pr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>'
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  function dataStr() { var d = new Date(), p = function (x) { return ('0' + x).slice(-2); }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
  function slug(s) { return String(s || 'dokument').trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'dokument'; }
  function mozhnaDilytysia() {
    try {
      if (!navigator.share || !navigator.canShare) return false;
      return navigator.canShare({files: [new File([new Blob(['%PDF-1.4'])], 'a.pdf', {type: 'application/pdf'})]});
    } catch (e) { return false; }
  }

  function view(o) {
    if (document.querySelector('.pv')) return;
    var src = (typeof o.pages === 'function' ? o.pages() : o.pages) || [];
    src = [].slice.call(src).filter(Boolean);
    if (!src.length) return;

    var prev = document.activeElement, ovr = document.createElement('div');
    ovr.className = 'pv';
    ovr.setAttribute('role', 'dialog');
    ovr.setAttribute('aria-modal', 'true');
    ovr.setAttribute('aria-label', 'Перегляд: ' + (o.title || 'аркуш'));
    ovr.setAttribute('data-html2canvas-ignore', 'true');
    ovr.innerHTML =
      '<div class="pv-main"><div class="pv-sc" tabindex="0"><div class="pv-in"><div class="pv-st"></div></div></div>' +
      '<button type="button" class="pv-x" data-a="x" aria-label="Закрити">' + IC.x + '</button>' +
      '<span class="pv-cnt" hidden></span>' +
      '<div class="pv-zm">' +
      '<button type="button" data-a="+" aria-label="Збільшити">' + IC.plus + '</button>' +
      '<button type="button" data-a="-" aria-label="Зменшити">' + IC.minus + '</button>' +
      '<button type="button" data-a="fit" aria-label="На всю ширину">' + IC.fit + '</button></div></div>' +
      '<div class="pv-dock"><p class="pv-msg" role="status" aria-live="polite"></p><div class="pv-bt">' +
      '<button type="button" class="pv-act" data-a="pdf"><i>' + IC.dl + '</i><b>Зберегти PDF</b><small>файл у телефон</small></button>' +
      '<button type="button" class="pv-act main" data-a="share"><i>' + IC.sh + '</i><b>Надіслати</b><small>WhatsApp, Telegram, пошта</small></button>' +
      '<button type="button" class="pv-act" data-a="print"><i>' + IC.pr + '</i><b>Друк</b><small>на папір</small></button></div></div>';
    var sc = ovr.querySelector('.pv-sc'), inn = ovr.querySelector('.pv-in'), st = ovr.querySelector('.pv-st'), msgEl = ovr.querySelector('.pv-msg');
    var W = 0, H = 0, S = {s: 1, s0: 1, min: .3, max: 5};

    src.forEach(function (el) {
      var n = nat(el), pg = document.createElement('div');
      pg.className = 'pv-pg';
      pg.style.width = n.w + 'px';
      pg.appendChild(klon(el));
      st.appendChild(pg);
      W = Math.max(W, n.w);
    });
    st.style.width = W + 'px';

    // ----- масштаб
    function layout(s) {
      S.s = s;
      var cw = sc.clientWidth, left = Math.max(PAD, (cw - W * s) / 2);
      st.style.transform = 'scale(' + s + ')';
      st.style.left = left + 'px';
      st.style.top = TOP + 'px';
      inn.style.width = Math.max(cw, W * s + 2 * PAD) + 'px';
      inn.style.height = (H * s + TOP + PAD) + 'px';
      return left;
    }
    function zoomAt(ns, cx, cy, ux, uy) {   // cx, cy — точка на екрані; ux, uy — точка аркуша, що лишається під пальцями
      ns = Math.max(S.min, Math.min(S.max, ns));
      if (ux == null) {
        var l = parseFloat(st.style.left) || PAD;
        ux = (sc.scrollLeft + cx - l) / S.s; uy = (sc.scrollTop + cy - TOP) / S.s;
      }
      var left = layout(ns);
      sc.scrollLeft = ux * ns + left - cx;
      sc.scrollTop = uy * ns + TOP - cy;
    }
    function ranges() {
      var av = sc.clientWidth - 2 * PAD;
      S.s0 = Math.max(.1, Math.min(1.3, av / W));
      S.min = S.s0 * .5;
      S.max = Math.max(S.s0 * 5, 3);
    }
    function start() {
      st.style.transform = 'none';
      H = st.offsetHeight;
      ranges();
      layout(S.s0);
      sc.scrollTop = 0; sc.scrollLeft = 0;
      if (pgs.length > 1) lichylnyk();
    }

    // ----- «Аркуш 2 з 3» (лише коли аркушів кілька)
    var cnt = ovr.querySelector('.pv-cnt'), pgs = st.querySelectorAll('.pv-pg');
    function lichylnyk() {
      if (pgs.length < 2) return;
      var y = (sc.scrollTop + sc.clientHeight * .35 - TOP) / S.s, k = 0;
      for (var i = 0; i < pgs.length; i++) { if (pgs[i].offsetTop <= y) k = i; }
      cnt.textContent = 'Аркуш ' + (k + 1) + ' з ' + pgs.length;
    }
    if (pgs.length > 1) { cnt.hidden = false; sc.addEventListener('scroll', lichylnyk, {passive: true}); }

    // ----- відкрити
    var inertList = [];
    [].slice.call(document.body.children).forEach(function (x) {
      if (x.tagName === 'SCRIPT' || x.tagName === 'STYLE') return;
      inertList.push([x, x.inert]);
      x.inert = true;
    });
    document.body.appendChild(ovr);
    document.documentElement.classList.add('pv-lock');
    start();
    if (window.ResizeObserver) {   // сторінки з шрифтами можуть трохи змінити висоту, поворот екрана — ширину
      var ro = new ResizeObserver(function () {
        var wasFit = Math.abs(S.s - S.s0) < .005;
        st.style.transform = 'none'; H = st.offsetHeight; ranges();
        var cx = sc.clientWidth / 2, cy = sc.clientHeight / 2;
        if (wasFit) { layout(S.s0); } else zoomAt(S.s, cx, cy);
      });
      ro.observe(sc);
    }
    setTimeout(function () { if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (ovr.parentNode) { var f = Math.abs(S.s - S.s0) < .005; st.style.transform = 'none'; H = st.offsetHeight; if (f) layout(S.s0); else layout(S.s); } }); }, 0);

    var pushed = false;
    try { history.pushState({pv: 1}, ''); pushed = true; } catch (e) {}
    function teardown() {
      if (!ovr.parentNode) return;
      if (ro) ro.disconnect();
      ovr.remove();
      document.documentElement.classList.remove('pv-lock');
      inertList.forEach(function (p) { p[0].inert = p[1]; });
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('keydown', onKey, true);
      try { if (prev && prev.focus) prev.focus(); } catch (e) {}
    }
    function onPop() { pushed = false; teardown(); }
    function zakryty() {
      if (pushed && history.state && history.state.pv) { pushed = false; window.removeEventListener('popstate', onPop); try { history.back(); } catch (e) {} teardown(); }
      else teardown();
    }
    window.addEventListener('popstate', onPop);
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); zakryty(); }
      else if ((e.key === '+' || e.key === '=') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); zoomAt(S.s * 1.25, sc.clientWidth / 2, sc.clientHeight / 2); }
      else if (e.key === '-' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); zoomAt(S.s / 1.25, sc.clientWidth / 2, sc.clientHeight / 2); }
    }
    document.addEventListener('keydown', onKey, true);

    // ----- пальці: двома — масштаб, подвійний дотик — наблизити / назад
    var pin = null, lastTap = null, tapDown = null;
    function dist(t) { var dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY; return Math.sqrt(dx * dx + dy * dy) || 1; }
    function mid(t) { var r = sc.getBoundingClientRect(); return [(t[0].clientX + t[1].clientX) / 2 - r.left, (t[0].clientY + t[1].clientY) / 2 - r.top]; }
    sc.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        var m = mid(e.touches), l = parseFloat(st.style.left) || PAD;
        pin = {d: dist(e.touches), s: S.s, ux: (sc.scrollLeft + m[0] - l) / S.s, uy: (sc.scrollTop + m[1] - TOP) / S.s};
        tapDown = null; lastTap = null;
        e.preventDefault();
      } else if (e.touches.length === 1) {
        tapDown = {t: Date.now(), x: e.touches[0].clientX, y: e.touches[0].clientY};
      }
    }, {passive: false});
    sc.addEventListener('touchmove', function (e) {
      if (pin && e.touches.length === 2) {
        e.preventDefault();
        var m = mid(e.touches);
        zoomAt(pin.s * dist(e.touches) / pin.d, m[0], m[1], pin.ux, pin.uy);
      } else if (tapDown && e.touches.length === 1) {
        var dx = e.touches[0].clientX - tapDown.x, dy = e.touches[0].clientY - tapDown.y;
        if (dx * dx + dy * dy > 100) tapDown = null;
      }
    }, {passive: false});
    sc.addEventListener('touchend', function (e) {
      if (e.touches.length < 2) pin = null;
      if (tapDown && e.touches.length === 0 && e.changedTouches.length === 1 && Date.now() - tapDown.t < 300) {
        var x = e.changedTouches[0].clientX, y = e.changedTouches[0].clientY, now = Date.now();
        if (lastTap && now - lastTap.t < 320 && Math.abs(x - lastTap.x) < 40 && Math.abs(y - lastTap.y) < 40) {
          var r = sc.getBoundingClientRect();
          zoomAt(S.s > S.s0 * 1.3 ? S.s0 : Math.min(S.s0 * 2.4, S.max), x - r.left, y - r.top);
          lastTap = null;
        } else lastTap = {t: now, x: x, y: y};
      }
      tapDown = null;
    });
    ['gesturestart', 'gesturechange'].forEach(function (g) { sc.addEventListener(g, function (e) { e.preventDefault(); }); });   // Safari: не наближати всю сторінку
    sc.addEventListener('wheel', function (e) {
      if (!e.ctrlKey) return;   // Ctrl + коліщатко / щипок на тачпаді
      e.preventDefault();
      var r = sc.getBoundingClientRect();
      zoomAt(S.s * Math.exp(-e.deltaY * .01), e.clientX - r.left, e.clientY - r.top);
    }, {passive: false});

    // ----- PDF
    var blob = null, busyP = null, name = slug(o.file || o.title) + '-' + dataStr() + '.pdf';
    function msg(t, bad) { msgEl.textContent = t || ''; msgEl.classList.toggle('bad', !!bad); }
    function knopky(off) { ovr.querySelectorAll('.pv-act').forEach(function (b) { b.disabled = !!off; }); }
    function zrobyty() {
      if (blob) return Promise.resolve(blob);
      if (busyP) return busyP;
      knopky(true);
      msg('Готую PDF…');
      busyP = zavLib().then(function () {
        return document.fonts && document.fonts.ready;
      }).then(function () {
        return malyuvaty(src, o, function (i, n) { msg(n > 1 ? 'Готую PDF… аркуш ' + i + ' з ' + n : 'Готую PDF…'); });
      }).then(function (b) {
        blob = b; busyP = null; knopky(false); msg('');
        return b;
      }, function (e) {
        busyP = null; knopky(false);
        msg(e && e.message === 'lib' ? 'Немає зв\'язку — для PDF потрібен інтернет (лише на мить). Спробуйте ще.' : 'Не вдалося зробити PDF. Спробуйте ще раз або натисніть «Друк».', true);
        throw e;
      });
      return busyP;
    }
    function zberehty(b) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = name;
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    }
    function zavantazhyty() {
      zrobyty().then(function (b) { zberehty(b); msg('PDF збережено (' + name + ').'); }).catch(function () {});
    }
    var mozhe = mozhnaDilytysia();
    if (!mozhe) ovr.querySelector('[data-a="share"] small').textContent = 'збереже PDF-файл';
    function dilytysia() {
      var wasReady = !!blob;
      zrobyty().then(function (b) {
        var f = new File([b], name, {type: 'application/pdf'});
        if (!(navigator.canShare && navigator.canShare({files: [f]}))) {   // комп'ютер чи старий браузер: даємо файл, надсилати — вручну
          zberehty(b);
          msg('Тут немає меню «Надіслати». PDF збережено (' + name + ') — додайте його в WhatsApp чи Telegram.');
          return;
        }
        return navigator.share({files: [f], title: o.title || name}).then(function () { msg(''); }, function (e) {
          if (e && e.name === 'AbortError') return;
          if (e && e.name === 'NotAllowedError' && !wasReady) msg('PDF готовий. Натисніть «Надіслати» ще раз.');
          else msg('Не вдалося надіслати. Натисніть «Зберегти PDF».', true);
        });
      }).catch(function () {});
    }

    ovr.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
      var a = b.dataset.a, cx = sc.clientWidth / 2, cy = sc.clientHeight / 2;
      if (a === 'x') zakryty();
      else if (a === '+') zoomAt(S.s * 1.25, cx, cy);
      else if (a === '-') zoomAt(S.s / 1.25, cx, cy);
      else if (a === 'fit') { zoomAt(S.s0, cx, cy); sc.scrollLeft = 0; }
      else if (a === 'pdf') zavantazhyty();
      else if (a === 'share') dilytysia();
      else if (a === 'print') { try { (o.print || window.print.bind(window))(); } catch (x) { window.print(); } }
    });
    ovr.querySelector('.pv-x').focus();
  }

  window.Papir = {fit: fit, view: view};
})();
