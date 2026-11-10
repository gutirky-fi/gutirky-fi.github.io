# Презентація розділу «Документи» (Slides)

Артефакт: https://claude.ai/artifact/R58E1qA3KnrhGrv8JmoRTq (27 слайдів, друга версія 10.11.2026).

Як зібрано (шляхи в скриптах — робоча тека сесії `/home/claude`, за потреби поправити):
1. `python3 -m http.server 8765` у корені репозиторію; `shots2.py` — знімки проби `proba/dokumenty/` (playwright + Chrome): аркуші, телефон 390 px, вхід виховника, діалог QR (з `etap2/pryimach.gs`, вигадана адреса).
2. Аркуші книги — `etap2/KNYHA-HURTKA-pryklad.xlsx` → LibreOffice → PDF → PNG.
3. `deck2.py` — слайди (картинки як `{IMG:назва}`); `preview.py` — локальний перегляд кожного слайда (шрифти з `_robota/druk/shryfty/`).
4. Картинки — upload_asset в артефакт, `{IMG:…}` → `/_blob/<id>`, тоді publish_files.

Правило вигляду: білі аркуші — на темному тлі, темні екрани — на світлому; ліворуч текст, праворуч приклад.
