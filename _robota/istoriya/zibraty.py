#!/usr/bin/env python3
"""Створює сторінку «Історія сайту» (istoriya/index.html).

Події — з _robota/istoriya/podii.json (дописувати після помітних змін), публікації — з історії git.
Картинки до подій лежать у istoriya/img/.
Ранні версії (файли в istoriya/arkhiv/) — список у _robota/istoriya/arkhiv.json.
Запуск:  python3 _robota/istoriya/zibraty.py
"""
import json, os, subprocess, html, collections

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'istoriya', 'index.html')
e = html.escape

podii = json.load(open(os.path.join(HERE, 'podii.json'), encoding='utf8'))
arkhiv = json.load(open(os.path.join(HERE, 'arkhiv.json'), encoding='utf8'))
log = subprocess.run(['git', '-C', ROOT, 'log', '--date=format-local:%d.%m.%Y %H:%M', '--pretty=%h\t%ad\t%s'],
                     capture_output=True, text=True, env=dict(os.environ, TZ='Europe/Helsinki')).stdout.strip().split('\n')
commits = [l.split('\t', 2) for l in log if l.count('\t') >= 2]

days = collections.OrderedDict()
for p in podii:
    days.setdefault(p['den'], []).append(p)

def event(p):
    pics = ''.join(f'<figure><a href="img/{e(f)}" target="_blank" rel="noopener"><img src="img/{e(f)}" alt="{e(c)}" loading="lazy"></a><figcaption>{e(c)}</figcaption></figure>'
                   for f, c in p.get('kartynky', []))
    return (f'<li class="ev"><span class="t">{e(p["chas"])}</span><div class="b"><h3>{e(p["nazva"])}</h3>'
            f'<p>{e(p["tekst"])}</p>{f"<div class=pics>{pics}</div>" if pics else ""}</div></li>')

timeline = ''.join(f'<section class="day"><h2>{e(d)}</h2><ol>{"".join(event(p) for p in ps)}</ol></section>' for d, ps in days.items())
arch = ''.join(f'<li><time>{e(a["chas"])}</time><span><a href="{e(a["fail"])}" target="_blank" rel="noopener">{e(a["nazva"])}</a> — {e(a["opys"])}</span></li>' for a in arkhiv)
pubs = ''.join(f'<li><time>{e(d)}</time><span>{e(s)}</span></li>' for h, d, s in commits if s != 'Initial commit')

page = f'''<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#1b1d21">
<title>Історія сайту — Бібліотека гутірок</title>
<link rel="icon" type="image/png" href="img/fav-32.png">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&family=Caveat:wght@500&family=Source+Sans+3:wght@400;600;700&display=swap">
<style>
:root{{color-scheme:dark;--bg:#1b1d21;--card:#22262b;--ln:#383d44;--ink:#f2f4f6;--mut:#a0a8b2;--gd:#ffc247;--ac:#2fd2c0;--ol:#9fb57a;
  --disp:Oswald,'Arial Narrow',sans-serif;--body:'Source Sans 3',system-ui,sans-serif;--hand:Caveat,'Segoe Print',cursive}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--ink);font:17px/1.55 var(--body)}}
a{{color:var(--ac)}}
.wrap{{max-width:980px;margin:0 auto;padding-inline:max(16px,4vw)}}
header{{position:relative;padding-block:44px 30px;border-bottom:1px solid var(--ln);overflow:hidden}}
header .wm{{position:absolute;right:0;top:10px;height:260px;opacity:.07;pointer-events:none}}
.eyebrow{{font:500 14px var(--disp);letter-spacing:.3em;text-transform:uppercase;color:var(--ol)}}
h1{{margin:10px 0 0;font:600 clamp(2.6rem,7vw,4.6rem)/.95 var(--disp);letter-spacing:.04em;text-transform:uppercase}}
.hand{{margin:12px 0 0;font:500 clamp(1.4rem,3vw,1.8rem)/1.15 var(--hand);color:var(--ac)}}
.back{{display:inline-block;margin-top:18px;padding:8px 16px;border-radius:99px;border:1px solid var(--ln);color:var(--ink);text-decoration:none;font-weight:700;font-size:15px}}
.back:hover{{border-color:var(--gd)}}
.day h2{{margin:40px 0 6px;font:600 24px var(--disp);letter-spacing:.08em;color:var(--gd)}}
ol{{list-style:none;margin:0;padding:0}}
.ev{{display:grid;grid-template-columns:120px minmax(0,1fr);gap:20px;padding:18px 0;border-top:1px solid var(--ln)}}
.ev .t{{font:600 16px var(--disp);letter-spacing:.04em;color:var(--mut);padding-top:3px;font-variant-numeric:tabular-nums}}
.ev h3{{margin:0 0 6px;font:600 22px/1.15 var(--disp);letter-spacing:.03em;text-transform:uppercase}}
.ev p{{margin:0;color:#cfd5dc;max-width:68ch}}
.pics{{display:flex;flex-wrap:wrap;gap:14px;margin-top:14px}}
figure{{margin:0;flex:1 1 260px;max-width:440px}}
figure img{{display:block;width:100%;height:auto;border-radius:12px;border:1px solid var(--ln)}}
figcaption{{margin-top:6px;font-size:14px;color:var(--mut)}}
.pubs h2{{margin:48px 0 4px;font:600 24px var(--disp);letter-spacing:.08em;text-transform:uppercase}}
.pubs p{{margin:0 0 12px;color:var(--mut);font-size:15px}}
.pubs ul{{list-style:none;margin:0;padding:0}}
.pubs li{{display:grid;grid-template-columns:150px minmax(0,1fr);gap:16px;padding:9px 0;border-top:1px solid var(--ln);font-size:15px}}
.pubs time{{color:var(--mut);font-variant-numeric:tabular-nums}}
.arch a{{font-weight:700;text-decoration:none}}
.arch a:hover{{text-decoration:underline}}
.arch span{{color:var(--mut)}}
footer{{display:flex;flex-direction:column;align-items:center;margin-top:56px;padding-block:30px 40px;border-top:1px solid var(--ln);text-align:center}}
footer img{{height:56px;width:auto;opacity:.85}}
footer .skob{{margin-top:14px;padding-left:.3em;font:600 24px/1 var(--disp);letter-spacing:.3em;color:var(--gd)}}
footer small{{margin-top:8px;color:var(--mut);font-size:14px}}
a:focus-visible{{outline:2px solid var(--gd);outline-offset:2px}}
@media (max-width:640px){{.ev{{grid-template-columns:1fr;gap:4px}}.pubs li{{grid-template-columns:1fr;gap:0}}header .wm{{height:170px}}}}
</style>
</head>
<body>
<header><div class="wrap">
<img class="wm" src="img/emblem.webp" alt="" aria-hidden="true">
<span class="eyebrow">Бібліотека гутірок</span>
<h1>Історія сайту</h1>
<p class="hand">як створювався і розвивався</p>
<a class="back" href="../">← До бібліотеки</a>
</div></header>
<main class="wrap">
{timeline}
<section class="pubs arch">
<h2>Ранні версії</h2>
<p>Файли 13 жовтня, з яких усе починалося, — у тому порядку, як вони зʼявлялися. Відкриваються в новій вкладці. Час приблизний.</p>
<ul>{arch}</ul>
</section>
<section class="pubs">
<h2>Усі публікації сайту</h2>
<p>Кожне оновлення, яке потрапило на gutirky-fi.github.io, — від найновішого.</p>
<ul>{pubs}</ul>
</section>
</main>
<footer class="wrap">
<img src="img/emblem.webp" alt="" aria-hidden="true">
<span class="skob">СКОБ!</span>
<small>Бібліотека гутірок Пласту у Фінляндії</small>
</footer>
</body>
</html>
'''
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w', encoding='utf8').write(page)
print(OUT, len(page.encode()), 'байт |', len(podii), 'подій |', len(commits), 'публікацій')
