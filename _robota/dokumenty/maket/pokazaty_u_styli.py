exec(open('/tmp/skripty/znimky.py', encoding='utf-8').read().split("with sync_playwright()")[0])
dot = lambda c: f'<i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:{c};margin-right:2px"></i>'
def ul(c, n, pid, rows):
    return f'<h4>{dot(c)}{n} <small>{pid}</small></h4><ol class="khr">' + ''.join(f'<li{" class=\"rk\"" if rk else ""}><span>{d}</span><div>{t}</div></li>' for d, t, rk in rows) + '</ol>'
HTML = f'''<header class="hd"><div class="hl"><div class="kind">Документи гуртка<span class="for">особисто пластунові</span></div><h3>Пластовий шлях</h3><div class="sub">Усе пластове життя людини — від першого дня в Пласті</div></div><img src="IMGSRC" alt="Пластова лілея"></header>
<div class="meta"><span>Ім'я та прізвище: <b>Олесь Коваленко</b></span><span>У Пласті від: <b>09.2015</b></span><span>Уклад зараз: <b>старше пластунство</b></span><span>Осередок: <b>Гельсінкі</b></span><span>Останній гурток: <b>Лелеки (приклад)</b></span><span>№ <b>ПШ-2026-07</b></span></div>
<div class="kpi"><div><b>11</b><small>років у Пласті</small></div><div><b>3</b><small>уклади пройдено</small></div><div><b>118</b><small>сходин у юнацтві</small></div><div><b>6</b><small>таборів</small></div><div class="ok"><b>2</b><small>проби здобуто</small></div><div class="ok"><b>9</b><small>вмілостей здобуто</small></div><div class="ok"><b>1</b><small>Пластова присяга</small></div><div class="ok"><b>5</b><small>відзнак вручено</small></div></div>
{ul('#4a8fd0','Пташата','2015–2018 · гніздо «Сонечка», виховниця Оксана',[('09.2015','<b>прийшов(-ла) в Пласт</b>',1),('05.2016','перший пташачий знак <span style="color:#5f6873">(назва умовна)</span>',0),('07.2017','літній табір пташат',0),('06.2018','<b>перейшов(-ла) до новацтва</b>',1)])}
{ul('#d9a20f','Новацтво','2018–2022 · рій «Вовчики», виховник Андрій',[('09.2018','<b>прийшов(-ла) до рою</b>',1),('05.2019','новацький ступінь I <span style="color:#5f6873">(назва умовна)</span>',0),('2019–2021','вмілості «Плавець», «Кухар», «Художник»',0),('2020–2021','посада: вістовий рою',0),('07.2021','табір «Лісова країна»',0),('06.2022','<b>перейшов(-ла) до юнацтва</b>',1)])}
{ul('#c8284a','Юнацтво','2022–2026 · гурток «Лелеки», виховник Максим',[('09.2022','<b>прийшов(-ла) до гуртка</b> · прихильник',1),('04.2023','<b>здобув(-ла) «1-ша проба»</b> — посвідка № 12',0),('05.2023','<b>Пластова присяга</b>',0),('2023–2024','посада: скарбник',0),('2023–2025','вмілості «Кераміка», «Вузли», «Перша допомога», «Табірник»',0),('05.2025','<b>здобув(-ла) «2-га проба»</b> — посвідка № 31',0),('2024–2026','посада: гуртковий · відзнака гуртка',0),('09.2026','<b>перейшов(-ла) до старшого пластунства</b> — 3-тя проба розпочата',1)])}
<h4>Здобуто — перелік</h4>
<table class="tb"><thead><tr><th>Що</th><th>Уклад</th><th class="m">Коли</th><th class="m">Посвідка / хто прийняв</th></tr></thead><tbody>
<tr><td><b>1-ша проба</b></td><td>юнацтво</td><td class="m">04.2023</td><td class="m">№ 12 · ст. пл. Ірина</td></tr>
<tr><td><b>2-га проба</b></td><td>юнацтво</td><td class="m">05.2025</td><td class="m">№ 31</td></tr>
<tr><td><b>Пластова присяга</b></td><td>юнацтво</td><td class="m">05.2023</td><td class="m">—</td></tr>
<tr><td><b>9 вмілостей</b></td><td>новацтво 3 · юнацтво 6</td><td class="m">2019–2026</td><td class="m">див. хронологію</td></tr></tbody></table>
<h4>Слово виховника <small>можна дописати тут або від руки</small></h4>
<div class="vr"><div><i>Яким був(-ла) у гуртку</i><div>Надійний і уважний до молодших; добре вів касу й перший брав відповідальність на мандрівках.</div></div></div>
<div class="sig"><span>Виховник (Максим): <u>&nbsp;</u></span><span>Голова осередку: <u>&nbsp;</u></span><span>Дата: <u>&nbsp;</u></span></div>
<p class="pp">Видано особисто пластунові або батькам — не пересилати в загальні чати. Оригінали посвідок — у самого пластуна; тут — перелік із датами й номерами. Макет: людина вигадана, назви пташачих знаків і новацьких ступенів умовні.</p>
<footer class="ft"><span><b>Пласт у Фінляндії</b> · бібліотека гутірок</span><span>З книг гуртків: гніздо «Сонечка», рій «Вовчики», гурток «Лелеки» · станом на 14.11.2026</span></footer>'''
with sync_playwright() as p:
    b = p.chromium.launch(); c = b.new_context(viewport={'width': 1100, 'height': 1000}); fonts(c); pg = c.new_page()
    pg.goto('http://127.0.0.1:8766/proba/dokumenty/zvity/?demo'); pg.wait_for_timeout(1500)
    pg.click('[data-z="kartka"]'); pg.wait_for_timeout(1000); pg.select_option('#z-im', index=1); pg.wait_for_timeout(1000)
    pg.evaluate("h => { const e = document.querySelector('.ppr'); const src = e.querySelector('.hd img').src; e.innerHTML = h.replace('IMGSRC', src); }", HTML)
    pg.wait_for_timeout(500)
    pg.query_selector('.ppr').screenshot(path='/tmp/znimky/shlyakh-yak-kartka.png')
    open('/tmp/znimky/shlyakh-yak-kartka.html','w').write(HTML)
    b.close()
