"""Вбудовує _robota/src/zvyazok.js у сторінки, які не збираються (між <!--ZVYAZOK--> і <!--/ZVYAZOK-->).
    python3 _robota/src/vbuduvaty_zvyazok.py      # після кожної зміни zvyazok.js
Сторінка гравця «Потужний СКОБ!» (skob-gravets.html) збирається zibraty.py гутірок — їх теж перезапустити."""
import os, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
Z = open(os.path.join(ROOT, '_robota/src/zvyazok.js'), encoding='utf8').read()
for f in ['pult/index.html', 'proba/pult/index.html', '_robota/src/skob-gravets.html']:
    p = os.path.join(ROOT, f); s = open(p, encoding='utf8').read()
    n = len(re.findall(r'<!--ZVYAZOK--><script>.*?</script><!--/ZVYAZOK-->', s, flags=re.S)); assert n == 1, (f, n)
    s = re.sub(r'<!--ZVYAZOK--><script>.*?</script><!--/ZVYAZOK-->', lambda m: '<!--ZVYAZOK--><script>\n' + Z + '\n</script><!--/ZVYAZOK-->', s, flags=re.S)
    open(p, 'w', encoding='utf8').write(s); print('ok', f)
