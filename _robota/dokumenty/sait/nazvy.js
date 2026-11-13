/* Назви нашивок і відзнак: підказка зі списку книги + м'яке попередження «такої назви ще немає» — СПІЛЬНЕ для «Відзначок» (forma.html)
   і «Вхід виховника → Прийшов, перейшов, пішов → Що вже має» (vykhovnyk.html). 14.11.2026.
   Навіщо: книга рахує нашивки за назвою; «Табір 2025» і «табір 2025» чи зайвий пробіл — для неї різні, тож підказуємо, що вже є.
   Приймач: {dija:'nazvy'} → {ok, nazvy:[…]} — назви з аркушів «Вмілості», «Відзначки», «Замовлення», «Запас» (без повторів).
   Правило проєкту: міняєте, як порівнюються назви чи що кажемо, — міняйте ТУТ. */
window.Nazvy = (function () {
  'use strict';
  const norm = x => String(x == null ? '' : x).trim().toLowerCase();
  const maye = (spysok, v) => (spysok || []).some(x => norm(x) === norm(v));
  const NEMAE = 'Такої назви ще немає в книзі. Нова нашивка — усе гаразд. Якщо така вже є — перевірте, як вона написана: інакше книга порахує її окремо.';
  const NEMAE_VMIL = 'Такої вмілості немає в каталозі й ще немає в книзі. Нова — усе гаразд. Якщо така вже є — перевірте, як вона написана: інакше книга порахує її окремо.';

  /* Текст попередження або '' (усе гаразд). spysok — назви з книги (порожній — ще не завантажено: мовчимо);
     katalog — назви каталогу вмілостей (лише для вмілостей: назва з каталогу — теж гаразд). */
  function poperedzhennia(spysok, v, katalog) {
    v = String(v == null ? '' : v).trim();
    if (!v || !(spysok || []).length) return '';
    if (maye(spysok, v)) return '';
    if (katalog) return maye(katalog, v) ? '' : NEMAE_VMIL;
    return NEMAE;
  }

  // назви з книги; null — немає зв'язку (сторінка просто працює без підказок)
  async function zavantazhyty(zapyt, kod) {
    try { const v = await zapyt({kod, dija: 'nazvy'}); return v && v.ok ? (v.nazvy || []) : null; } catch (x) { return null; }
  }

  // показати / прибрати попередження під полем (f — обгортка поля, .f)
  function pokazaty(f, tekst) {
    let w = f.querySelector('.dlw');
    if (!tekst) { if (w) w.remove(); return; }
    if (!w) { w = document.createElement('small'); w.className = 'dlw'; f.append(w); }
    w.textContent = tekst;
  }

  return {norm, maye, poperedzhennia, zavantazhyty, pokazaty, NEMAE, NEMAE_VMIL};
})();
