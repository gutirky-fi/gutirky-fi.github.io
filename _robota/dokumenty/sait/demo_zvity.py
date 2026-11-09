"""Пробні дані для сторінки «Звіти» (Етап 3.4): вигаданий гурток «Лелеки» з KNYHA-HURTKA-pryklad.xlsx
   у тому самому вигляді, що віддає приймач (dija «zvity»), + вигаданий минулий рік для «Роки» й «Історії учасників».
   python3 _robota/dokumenty/sait/demo_zvity.py   (потрібен LibreOffice — перераховує формули) → sait/demo_zvity.json"""
import json, pathlib, subprocess, tempfile, datetime, openpyxl
TUT = pathlib.Path(__file__).parent
SRC = TUT.parent / 'etap2' / 'KNYHA-HURTKA-pryklad.xlsx'
ZVITY = ['Учасники', 'Посади', 'Сходини', 'Відвідуваність', 'Проби', 'Вмілості', 'Відзначки', 'Мандрівки',
         'Фінанси', 'Внески', 'Протоколи', 'Роки', 'Історія учасників']
with tempfile.TemporaryDirectory() as t:
    subprocess.run(['soffice', '--headless', '--convert-to', 'xlsx', '--outdir', t, str(SRC)], check=True, capture_output=True)
    wb = openpyxl.load_workbook(pathlib.Path(t) / SRC.name, data_only=True)
j = lambda v: v.strftime('%Y-%m-%d') if isinstance(v, (datetime.date, datetime.datetime)) else ('' if v is None else v)
out = {}
for n in ZVITY:
    ws = wb[n]
    z = [str(c.value or '').strip() for c in ws[3]]
    k = [i for i, h in enumerate(z) if h and h != 'Прізвище']
    v = [[j(r[i]) for i in k] for r in ws.iter_rows(min_row=4, values_only=True) if r[0] not in (None, '')]
    out[n] = {'z': [z[i] for i in k], 'v': v}
# вигаданий минулий рік — щоб «Картка учасника» і «Роки» мали історію
out['Роки']['v'] = [['2025/26', 4, 30, 0.82, 61, 3, 5, 4, 240, 205.5, 34.5, '', '2026-08-31']]
H = out['Історія учасників']['z']
for im, pos, st, sx, pr, prob, tp, vm, vz in [
        ('Олесь', 'писар', 'активний', 26, 0.87, 'прихильник', 11, '', 'Нашивка табору'),
        ('Мирося', '', 'активний', 24, 0.8, 'прихильник', 11, '', 'Нашивка табору'),
        ('Дана', '', 'активний', 27, 0.9, 'прихильник', 11, '', ''),
        ('Ярко', 'гуртковий', 'активний', 23, 0.77, 'прихильник', 9, 'Писанкарство', 'Нашивка табору')]:
    out['Історія учасників']['v'].append([{'Навчальний рік': '2025/26', "Ім'я": im, 'Посада': pos, 'Статус': st, 'Сходин відвідано': sx,
        'Присутність': pr, 'Проба': prob, 'Точок проб за рік': tp, 'Вмілості за рік': vm, 'Відзнаки вручено за рік': vz,
        'Записано': '2026-08-31'}.get(h, '') for h in H])
dani = {'ok': True, 'nazva': 'Лелеки (приклад)', 'kurin': 'курінь «Приклад»', 'rik': '2026/27', 'vykhovnyk': 'Тарас',
        'sohodni': '2026-11-09', 'arkushi': out}
(TUT / 'demo_zvity.json').write_text(json.dumps(dani, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print('demo_zvity.json:', {n: len(out[n]['v']) for n in out})
