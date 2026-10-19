# Бібліотека гутірок (gutirky-fi.github.io)

**Спершу прочитайте `_robota/PROEKT.md`** — там уся історія, будова сайту, рішення власника і як збирати й публікувати.

Коротко:
- Власник — пластовий виховник (Пласт у Фінляндії), не програміст. Відповідати українською, просто, покроково, з готовими посиланнями.
- `index.html` і `biblioteka/index.html` не правити руками. З 19.10.2026 сайт — «кілька входів»: `python3 _robota/proby/vhody/zibraty.py sait` збирає головну `index.html` і (через `_robota/build.py`) бібліотеку `biblioteka/index.html`. Перевірка: `python3 _robota/perevirka/perevirka.py`. Стара версія сайту — гілка `stara-versiya-19-10` (як повернути — у `_robota/PROEKT.md`, журнал 19.10).
- Публікація: commit + `git push origin HEAD:main`, дочекатися GitHub Pages (`gh api repos/gutirky-fi/gutirky-fi.github.io/actions/runs`).
- Зміни дизайну — спершу показати (знімки або копія), ставити на сайт лише після згоди власника.
- Сайт прихований (noindex + robots.txt) — не прибирати.
- Після помітних змін дописати «Журнал» у `_robota/PROEKT.md`, додати подію в `_robota/istoriya/podii.json` і запустити `python3 _robota/istoriya/zibraty.py` (сторінка https://gutirky-fi.github.io/istoriya/ — внутрішня, не в меню).
