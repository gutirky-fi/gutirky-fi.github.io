#!/usr/bin/env python3
"""Локальний перегляд слайдів: кожен слайд → PNG 960x540, потім зведені аркуші."""
import json, re, sys
from playwright.sync_api import sync_playwright
from PIL import Image
R = '/home/claude/deck2/project'
F = '/home/claude/gutirky-fi.github.io/_robota/druk/shryfty/'
order = json.load(open(R + '/deck.raw.json', encoding='utf-8'))['order']
only = sys.argv[1:]
CSS = f"""
@font-face{{font-family:Oswald;src:url(file://{F}Oswald.ttf);font-weight:200 700}}
@font-face{{font-family:'Source Sans 3';src:url(file://{F}SourceSans3.ttf);font-weight:200 900}}
*{{margin:0;box-sizing:border-box}} body{{background:#000}}
section{{position:relative;width:1920px;height:1080px;overflow:hidden}}
div{{display:flex;flex-direction:column;min-width:0}} img,svg{{display:block;flex:none}}
h1,h2,h3,p{{font-weight:400}} h1,h2,h3{{font-weight:600}} table{{border-collapse:collapse}}
td,th{{padding:0.35em 0.6em;border-bottom:1px solid #3a3e46}} a{{color:inherit}}
"""
out = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--allow-file-access-from-files'])
    pg = b.new_page(viewport={'width': 1920, 'height': 1080})
    for i, sid in enumerate(order, 1):
        if only and sid not in only: continue
        s = open(f'{R}/slides/{sid}.html', encoding='utf-8').read()
        s = re.sub(r'\{IMG:([a-zA-Z0-9_]+)\}', r'file:///home/claude/assets/\1.png', s)
        open('/tmp/pv.html', 'w', encoding='utf-8').write(f'<!doctype html><meta charset="utf-8"><style>{CSS}</style>{s}')
        pg.goto('file:///tmp/pv.html'); pg.wait_for_timeout(350)
        ov = pg.evaluate("""()=>{const s=document.querySelector('section');const r=[];
          const lim=s.querySelector('p[style*="bottom:64px"]')?920:952;
          s.querySelectorAll('*').forEach(e=>{const st=getComputedStyle(e); if(st.position==='absolute'&&/bottom:64px/.test(e.getAttribute('style')||''))return;
            const b=e.getBoundingClientRect(); if(b.width&&(b.bottom>lim+1||b.right>1793||b.left<127)&&!e.closest('[style*="rotate"]')&&e.tagName!=='SECTION') r.push(e.tagName+' '+Math.round(b.left)+','+Math.round(b.top)+'-'+Math.round(b.right)+','+Math.round(b.bottom));});
          return r.slice(0,4)}""")
        if ov: print(f'{i:02d} {sid} OVERFLOW', ov)
        f = f'/home/claude/snaps/pv_{i:02d}_{sid}.png'
        pg.screenshot(path=f); out.append(f)
    b.close()
for k in range(0, len(out), 6):
    ims = [Image.open(f).resize((960, 540), Image.LANCZOS) for f in out[k:k + 6]]
    s = Image.new('RGB', (1920 + 6, 540 * ((len(ims) + 1) // 2) + 6 * ((len(ims) + 1) // 2)), '#ff00ff')
    for j, im in enumerate(ims): s.paste(im, ((j % 2) * 966, (j // 2) * 546))
    s.save(f'/home/claude/snaps/pvsheet_{k // 6 + 1}.png'); print('sheet', k // 6 + 1, len(ims))
