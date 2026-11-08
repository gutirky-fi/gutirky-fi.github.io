# Перевірка ігор і кіно-гутірок (знімки, помилки, запис відео)

Знімки й відео йдуть у `/tmp/perevirka-ihry` (або в теку з `OUT=...`). Запускати з цієї теки:

    cd _robota/perevirka/ihry
    sh zapusk.sh                                       # сайт локально (8766) і тестовий звʼязок (9001)

    python3 errchk.py        # усі сторінки ігор — чи немає помилок JS
    python3 ovskob.py        # СКОБ: екран, телефон, пульт (знімки в ov/)
    python3 ovzmag.py        # Змаг
    python3 ovopyt.py        # Опитування
    python3 ovbx.py          # Бінго «Кераміка»
    python3 bfull.py         # Бінго повністю: 2 гравці, хибне «БІНГО», перемога, перевірка картки (bt/)
    python3 kvid.py          # кіно-проба: знімок кожного кадру (kv/); `python3 kvid.py rec` — запис відео

`hand.py` — спільне: справжні шрифти (Oswald, Source Sans, Caveat, Playfair) з `_robota/druk|offline/shryfty`.
Повний огляд — лише перед виходом на сайт; для дрібної зміни — один потрібний скрипт.
