"""Макет 2 ТБ-режиму: копія головної сайту (index.html) з доданим шаром proba/tv/tv.css + tv.js.
Кладе tv-proba.html у корінь (щоб усі шляхи й посилання сайту працювали як є). Запуск з кореня репозиторію."""
import os
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
s = open(os.path.join(R, 'index.html'), encoding='utf-8').read()
add = ('<link rel="stylesheet" href="proba/tv/tv.css">'
       '<script>window.TV_ZAVZHDY=1</script><script src="_robota/src/qr.js"></script><script src="proba/tv/tv.js"></script>')
s = s.replace('</head>', add + '</head>', 1).replace('<title>', '<title>ТБ · макет · ', 1)
open(os.path.join(R, 'tv-proba.html'), 'w', encoding='utf-8').write(s)
print('tv-proba.html готово')
