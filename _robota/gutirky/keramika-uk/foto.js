/* «Кераміка України» (вишкіл, 20.10.2026) — справжні фото виробів (надіслав власник) як «картинки» рушія «Кераміки І».
   Ключі: f:назва — фото на весь кадр 1672×941 (+ мала карта з точкою краю, якщо задано край);
          g:f-назва — те саме для гри «Вгадай край» (без карти, щоб не підказувати);
          quad — чотири способи прикрасити (ангоб, полива, димлення, молочення);
          kmap — карта дев'яти країв. */
(function () {
  'use strict';
  const W = 1672, H = 941;
  const F = { /*{{FOTO}}*/ };
  const KMAP = '{{KMAP}}';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  /* точки країв на карті keramika-map.webp (760×512) */
  const RG = { zak: [52, 255, '#ff6b4a'], hut: [128, 250, '#4d8dff'], hal: [92, 190, '#2fd08a'], pod: [240, 215, '#e0914f'], kyi: [372, 200, '#b06bd6'],
    pol: [262, 118, '#27c4c9'], opi: [470, 170, '#ffc247'], slo: [605, 215, '#a8d44a'], pry: [430, 350, '#ff7ab0'] };
  const svg = (label, body) => `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}" class="kart">${body}</svg>`;
  const pic = (k, x = 0, y = 0, w = W, h = H) => `<image href="${F[k]}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
  function inset(r) {   /* мала карта в правому нижньому куті з кільцем на краї */
    const p = RG[r]; if (!p) return '';
    const mw = 470, mh = mw * 512 / 760, x = W - mw - 10, y = H - mh - 6, sx = mw / 760;
    return `<g opacity=".95"><image href="${KMAP}" x="${x}" y="${y}" width="${mw}" height="${mh.toFixed(1)}"/>` +
      `<circle cx="${(x + p[0] * sx).toFixed(1)}" cy="${(y + p[1] * sx).toFixed(1)}" r="26" fill="none" stroke="#fff" stroke-width="7"/>` +
      `<circle cx="${(x + p[0] * sx).toFixed(1)}" cy="${(y + p[1] * sx).toFixed(1)}" r="26" fill="none" stroke="${p[2]}" stroke-width="3"/></g>`;
  }
  function label(x, y, t) {
    const w = [...t].length * 21 + 44;
    return `<rect x="${(x - w / 2).toFixed(1)}" y="${y - 30}" width="${w}" height="60" rx="30" fill="#1d1511" fill-opacity=".93" stroke="#ffb27a" stroke-width="3"/>` +
      `<text x="${x}" y="${y + 12}" font-size="34" font-weight="700" fill="#fff" text-anchor="middle">${esc(t)}</text>`;
  }
  const QUAD = [['zak0', 'Ангоб'], ['hut0', 'Полива'], ['hal0', 'Димлення'], ['slo0', 'Молочення']];
  const get0 = window.LA_ART.get;
  window.LA_ART.get = k => {
    if (!k) return get0(k);
    if (k === 'kmap') return svg('Карта дев’яти країв', `<image href="${KMAP}" x="${(W - 1300) / 2}" y="${(H - 876) / 2}" width="1300" height="876"/>`);
    if (k === 'quad') return svg('Чотири способи прикрасити кераміку', QUAD.map(([f, t], i) => {
      const x = (i % 2) * W / 2, y = Math.floor(i / 2) * H / 2;
      return pic(f, x + 20, y + 10, W / 2 - 40, H / 2 - 70) + label(x + W / 4, y + H / 2 - 32, t);
    }).join(''));
    if (k.startsWith('g:f-') && F[k.slice(4)]) return svg('Звідки цей виріб?', pic(k.slice(4), 80, 20, W - 160, H - 40));
    if (k.startsWith('f:')) {
      const [f, r] = k.slice(2).split('@');
      if (F[f]) return svg('Фото виробу', r ? pic(f, 40, 20, W - 560, H - 40) + inset(r) : pic(f, 60, 20, W - 120, H - 40));
    }
    return get0(k);
  };
})();
