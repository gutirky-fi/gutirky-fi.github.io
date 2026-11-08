#!/bin/sh
# Перевірка Етапу 2: збирає книгу, перераховує приклад у LibreOffice, шукає помилки формул і проганяє тест приймача.
set -e
TUT=$(cd "$(dirname "$0")" && pwd); T=$(mktemp -d)
python3 "$TUT/zibraty_knyhu.py"
soffice --headless --convert-to xlsx --outdir "$T" "$TUT/KNYHA-HURTKA-pryklad.xlsx" >/dev/null 2>&1
python3 - "$TUT/KNYHA-HURTKA-pryklad.xlsx" "$T/KNYHA-HURTKA-pryklad.xlsx" "$T/knyha.json" <<'EOF'
import sys, json, datetime, openpyxl
f = openpyxl.load_workbook(sys.argv[1]); d = openpyxl.load_workbook(sys.argv[2], data_only=True)
j = lambda v: {"d": v.strftime('%Y-%m-%d')} if isinstance(v, (datetime.date, datetime.datetime)) else v
out, err = {}, 0
for ws in f:
    g = [[j(ws.cell(r, c).value) for c in range(1, ws.max_column + 1)] for r in range(1, ws.max_row + 1)]
    x = [[j(d[ws.title].cell(r, c).value) for c in range(1, ws.max_column + 1)] for r in range(1, ws.max_row + 1)]
    err += sum(1 for row in x for v in row if isinstance(v, str) and v.startswith(('#', 'Err:')))
    out[ws.title] = {"f": g, "v": x}
json.dump(out, open(sys.argv[3], 'w'), ensure_ascii=False)
print("Помилок у формулах:", err); sys.exit(1 if err else 0)
EOF
node "$TUT/test_pryimach.js" "$T/knyha.json"
