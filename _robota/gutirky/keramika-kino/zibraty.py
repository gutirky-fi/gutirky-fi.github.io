"""Проба «Кераміка України — кіно» (4.11.2026): камера летить картою, пірнає в край, виріб на світному кільці.
   Дані (карта, краї, вироби, фото) беремо з _robota/gutirky/keramika/index.html.
   python3 _robota/gutirky/keramika-kino/zibraty.py  ->  proba/k-kino/ (index.html + img/*.webp)"""
import pathlib, json, re, subprocess, base64
TUT = pathlib.Path(__file__).parent
SITE = TUT.parent.parent.parent
SRC = TUT.parent / 'keramika' / 'index.html'
OUT = SITE / 'proba' / 'k-kino'
ITEMS = ['6-0', '6-1', '3-0']

JS = r"""
const fs=require('fs');const s=fs.readFileSync(process.argv[1],'utf8');
function grab(name){const m=new RegExp('(?:const |,)'+name+'=').exec(s);if(!m)throw name;let j=m.index+m[0].length;let d=0,k=j;
for(;k<s.length;k++){const c=s[k];if(c==='"'||c==="'"||c==='`'){const q=c;k++;while(s[k]!==q){if(s[k]==='\\')k++;k++;}continue}
if('[{('.includes(c))d++;if(']})'.includes(c)){d--;if(d===0)break}}return eval('('+s.slice(j,k+1)+')')}
const PH=grab('PH');const want=JSON.parse(process.argv[2]);const ph={};want.forEach(k=>ph[k]=PH[k]);
process.stdout.write(JSON.stringify({R:grab('R'),OB:grab('OB'),P:grab('P'),MK:grab('MK'),PH:ph}));
"""

if __name__ == '__main__':
    raw = subprocess.run(['node', '-e', JS, str(SRC), json.dumps(ITEMS)], capture_output=True, text=True, check=True).stdout
    d = json.loads(raw)
    (OUT / 'img').mkdir(parents=True, exist_ok=True)
    for k, v in d.pop('PH').items():
        (OUT / 'img' / (k + '.webp')).write_bytes(base64.b64decode(v.split(',', 1)[1]))
    html = (TUT / 'index.html').read_text(encoding='utf-8')
    assert html.count('/*DANI*/') == 1
    html = html.replace('/*DANI*/', 'const DANI=' + json.dumps(d, ensure_ascii=False) + ';')
    (OUT / 'index.html').write_text(html, encoding='utf-8')
    print(OUT / 'index.html', len(html))
