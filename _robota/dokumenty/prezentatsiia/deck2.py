#!/usr/bin/env python3
"""Збирає слайди презентації «Документи гуртка» (друга версія) у /home/claude/deck2/project.
Картинки позначені як {IMG:name}; preview.py і publish підставляють свої адреси."""
import json, os, datetime, shutil
from PIL import Image

OUT = '/home/claude/deck2/project'
ASSETS = '/home/claude/assets/'
shutil.rmtree('/home/claude/deck2', ignore_errors=True)
os.makedirs(OUT + '/slides')

# палітра сайту
D_BG, D_PAN, D_LINE, D_FG, D_MUT, D_ACC = '#1b1d21', '#24272c', '#3a3e46', '#f2f4f6', '#a0a8b2', '#e8527a'
L_BG, L_PAN, L_LINE, L_FG, L_TXT, L_MUT, L_ACC = '#f4f1ec', '#ffffff', '#d9d3c8', '#1b1d21', '#33373d', '#5a616b', '#c8284a'
GRN = '#4ecb8d'
HEAD = "font-family:Oswald, 'Source Sans 3', sans-serif;text-transform:uppercase;font-weight:600"
BODY = "font-family:'Source Sans 3', sans-serif"

SIZE = {f[:-4]: Image.open(ASSETS + f).size for f in os.listdir(ASSETS) if f.endswith('.png')}
order, files = [], {}


def fit(name, maxw, maxh):
    w, h = SIZE[name]
    k = min(maxw / w, maxh / h)
    return round(w * k), round(h * k)


def pal(dark):
    return dict(bg=D_BG, fg=D_FG, txt='#d7dce2', mut=D_MUT, acc=D_ACC, line=D_LINE, pan=D_PAN) if dark else \
        dict(bg=L_BG, fg=L_FG, txt=L_TXT, mut=L_MUT, acc=L_ACC, line=L_LINE, pan=L_PAN)


def shot(name, maxw, maxh, alt, radius=14, dark=True):
    w, h = fit(name, maxw, maxh)
    sh = '0 30px 70px rgba(0,0,0,0.55)' if dark else '0 26px 60px rgba(27,29,33,0.28)'
    return f'<img src="{{IMG:{name}}}" alt="{alt}" style="width:{w}px;height:{h}px;object-fit:cover;border-radius:{radius}px;box-shadow:{sh}">'


def phone(name, h, alt, badge=None, dark=False):
    """Телефон у рамці; badge=(номер, x, y) у частках розміру."""
    w = round(h * 780 / 1688)
    sh = '0 30px 70px rgba(0,0,0,0.55)' if dark else '0 26px 60px rgba(27,29,33,0.30)'
    img = (f'<img src="{{IMG:{name}}}" alt="{alt}" style="width:{w}px;height:{h}px;object-fit:cover;'
           f'border-radius:40px;border:9px solid #0f1114;box-shadow:{sh}">')
    b = ''
    if badge:
        n, x, y = badge
        b = (f'<div style="position:absolute;left:{round(w * x) - 26}px;top:{round(h * y) - 26}px;width:52px;height:52px;'
             f'border-radius:50%;background:{L_ACC};border:3px solid #ffffff;display:flex;align-items:center;justify-content:center;'
             f'box-shadow:0 6px 16px rgba(0,0,0,0.45)"><p style="{BODY};font-size:26px;font-weight:700;color:#ffffff;text-align:center;line-height:1">{n}</p></div>')
    return f'<div style="position:relative;width:{w}px;height:{h}px">{img}{b}</div>'


def point(n, lead, text, p):
    mark = (f'<div style="width:48px;height:48px;flex:none;border-radius:50%;background:{p["acc"]};display:flex;align-items:center;justify-content:center">'
            f'<p style="{BODY};font-size:26px;font-weight:700;color:#ffffff;text-align:center;line-height:1">{n}</p></div>') if n else \
           f'<div style="width:14px;height:14px;flex:none;border-radius:50%;background:{p["acc"]}"></div>'
    gap = 20 if n else 22
    al = 'flex-start'
    t = f'<p style="{BODY};font-size:28px;line-height:1.32;color:{p["txt"]}"><b>{lead}</b>{(" " + text) if text else ""}</p>'
    pad = '' if n else 'padding:12px 0 0 6px;'
    return (f'<div style="display:flex;flex-direction:row;gap:{gap}px;align-items:{al}">'
            f'<div style="display:flex;flex-direction:column;flex:none;{pad}">{mark}</div><div style="flex:1;display:flex;flex-direction:column;padding:{"5px" if n else "0"} 0 0 0">{t}</div></div>')


def left_col(eyebrow, title, lead, points, p, width=560, numbered=False):
    h = (f'<p style="{BODY};font-size:24px;font-weight:700;letter-spacing:5px;text-transform:uppercase;color:{p["acc"]}">{eyebrow}</p>'
         f'<h2 style="{HEAD};font-size:64px;line-height:1.08;letter-spacing:1px;color:{p["fg"]}">{title}</h2>'
         f'<div style="width:120px;height:8px;border-radius:4px;background:{p["acc"]}"></div>')
    l = f'<p style="{BODY};font-size:32px;line-height:1.3;color:{p["fg"]}">{lead}</p>' if lead else ''
    pts = ''.join(point(i + 1 if numbered else None, a, b, p) for i, (a, b) in enumerate(points))
    pts = f'<div style="display:flex;flex-direction:column;gap:22px">{pts}</div>' if pts else ''
    return (f'<div style="width:{width}px;flex:none;display:flex;flex-direction:column;gap:28px">'
            f'<div style="display:flex;flex-direction:column;gap:18px">{h}</div>{l}{pts}</div>')


def footer(p, n):
    return (f'<p style="position:absolute;left:128px;bottom:64px;width:700px;{BODY};font-size:24px;letter-spacing:3px;text-transform:uppercase;color:{p["mut"]}">Документи гуртка</p>'
            f'<p style="position:absolute;right:128px;bottom:64px;width:200px;text-align:right;{BODY};font-size:24px;letter-spacing:2px;color:{p["mut"]}">{n:02d}</p>')


def add(sid, html):
    order.append(sid)
    files[sid] = html


def split(sid, eyebrow, title, lead, points, visual, dark, numbered=False, width=560, vgap=40, valign='center'):
    """Типовий слайд: ліворуч текст, праворуч приклад."""
    p = pal(dark)
    n = len(order) + 1
    add(sid, f'<section id="{sid}" data-transition="fade" style="background:{p["bg"]};color:{p["fg"]};{BODY};padding:128px 128px 160px;display:flex;flex-direction:row;gap:72px">'
        + left_col(eyebrow, title, lead, points, p, width, numbered)
        + f'<div style="flex:1;display:flex;flex-direction:row;gap:{vgap}px;align-items:{valign};justify-content:center">{visual}</div>'
        + footer(p, n) + '</section>')


def wide(sid, eyebrow, title, body, dark, lead=''):
    """Слайд на всю ширину: заголовок угорі, під ним зміст."""
    p = pal(dark)
    n = len(order) + 1
    h = (f'<div style="display:flex;flex-direction:column;gap:18px">'
         f'<p style="{BODY};font-size:24px;font-weight:700;letter-spacing:5px;text-transform:uppercase;color:{p["acc"]}">{eyebrow}</p>'
         f'<h2 style="{HEAD};font-size:64px;line-height:1.08;letter-spacing:1px;color:{p["fg"]}">{title}</h2>'
         f'<div style="width:120px;height:8px;border-radius:4px;background:{p["acc"]}"></div></div>')
    add(sid, f'<section id="{sid}" data-transition="fade" style="background:{p["bg"]};color:{p["fg"]};{BODY};padding:128px 128px 160px;display:flex;flex-direction:column;gap:44px">'
        + h + body + footer(p, n) + '</section>')


def icon(paths, color, size=56):
    return (f'<svg aria-label="" width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="1.6" '
            f'stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')


def arrow(color, w=56):
    return (f'<svg aria-label="далі" width="{w}" height="28" viewBox="0 0 56 28" fill="none" stroke="{color}" stroke-width="3.5" '
            f'stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h48"/><path d="M40 4l11 10-11 10"/></svg>')


def check(color, size=36):
    return (f'<svg aria-label="так" width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="2.6" '
            f'stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>')


def cross(color, size=36):
    return (f'<svg aria-label="ні" width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="2.4" '
            f'stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>')


def cap(text, p, w=None, align='left'):
    ws = f'width:{w}px;' if w else ''
    return f'<p style="{BODY};{ws}font-size:24px;line-height:1.3;text-align:{align};color:{p["mut"]}">{text}</p>'


# ───────────────────────── 1. Обкладинка
D, L = pal(True), pal(False)
pw, ph = fit('p_skh', 900, 640)
add('cover', f'<section id="cover" data-transition="fade" style="background:{D_BG};color:{D_FG};{BODY};padding:128px;display:flex;flex-direction:column;justify-content:center;gap:30px">'
    f'<img src="{{IMG:p_skh}}" alt="Заповнений бланк «Сходини — програма»" style="position:absolute;left:930px;top:150px;width:{pw}px;height:{ph}px;object-fit:cover;border-radius:10px;box-shadow:0 40px 90px rgba(0,0,0,0.6);transform:rotate(-3deg)">'
    f'<img src="{{IMG:m_vid3}}" alt="Телефон: «Записано в книгу»" style="position:absolute;left:1470px;top:330px;width:286px;height:619px;object-fit:cover;border-radius:38px;border:9px solid #0f1114;box-shadow:0 40px 90px rgba(0,0,0,0.65);transform:rotate(4deg)">'
    f'<p style="width:760px;{BODY};font-size:26px;font-weight:700;letter-spacing:6px;text-transform:uppercase;color:{D_ACC}">Пластова бібліотека · юнацький гурток</p>'
    f'<h1 style="width:760px;{HEAD};font-size:148px;line-height:1;letter-spacing:2px;color:{D_FG}">Документи<br>гуртка</h1>'
    f'<div style="width:200px;height:10px;border-radius:5px;background:{D_ACC}"></div>'
    f'<p style="width:700px;{BODY};font-size:38px;line-height:1.3;color:#d7dce2">Бланки, записи з телефона, книга гуртка і звіти — в одному розділі</p>'
    f'<p style="position:absolute;left:128px;bottom:64px;width:900px;{BODY};font-size:24px;color:{D_MUT}">Усі приклади — з вигаданим гуртком «Лелеки»</p>'
    '</section>')

# ───────────────────────── 2. Навіщо
def lst(title, items, good, p):
    rows = ''.join(
        f'<div style="display:flex;flex-direction:row;gap:20px;align-items:flex-start">'
        f'<div style="flex:none;display:flex;flex-direction:column;padding:4px 0 0 0">{check(p["acc"]) if good else cross(p["mut"])}</div>'
        f'<p style="flex:1;{BODY};font-size:36px;line-height:1.3;color:{p["fg"] if good else p["txt"]}">{t}</p></div>' for t in items)
    return (f'<div style="flex:1;display:flex;flex-direction:column;gap:30px">'
            f'<h3 style="{HEAD};font-size:40px;letter-spacing:2px;color:{p["acc"] if good else p["mut"]}">{title}</h3>'
            f'<div style="height:2px;background:{p["line"]}"></div>'
            f'<div style="display:flex;flex-direction:column;gap:34px">{rows}</div></div>')

wide('navishcho', 'Навіщо', 'Навіщо це гуртку',
     '<div style="display:flex;flex-direction:row;gap:96px">'
     + lst('Без системи', ['Записи в зошитах і чатах губляться', 'Кожен діловод пише по-своєму', 'Звіт щоразу складають з нуля', 'Гурток цілком не бачить ніхто'], False, L)
     + lst('З розділом «Документи»', ['Одна книга гуртка на весь рік', 'Однакові бланки й форми для кожної посади', 'Запис — з телефона, просто на сходинах', 'Звіти складаються з книги самі'], True, L)
     + '</div>', dark=False)
files['navishcho'] = files['navishcho'].replace('gap:44px">', 'gap:56px">', 1)

# ───────────────────────── 3. Що вміє розділ
I_DOC = '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M10 12h5M10 16h5"/>'
I_PHONE = '<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/>'
I_SEND = '<path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>'
I_EYE = '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
I_CHART = '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16v-5M12 16V8M16 16v-3"/>'
I_TABLE = '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>'

def tile(ic, t, d, p):
    return (f'<div style="background:{p["pan"]};border:1px solid {p["line"]};border-radius:18px;padding:24px 40px;display:flex;flex-direction:column;justify-content:center;gap:12px">'
            f'{icon(ic, p["acc"], 64)}<h3 style="{HEAD};font-size:38px;letter-spacing:1px;color:{p["fg"]}">{t}</h3>'
            f'<p style="{BODY};font-size:28px;line-height:1.3;color:{p["txt"]}">{d}</p></div>')

wide('mozhlyvosti', 'Огляд', 'Що вміє розділ',
     '<div style="flex:1;display:grid;grid-template-columns:repeat(3, 1fr);grid-template-rows:1fr 1fr;gap:28px">'
     + tile(I_DOC, 'Бланки A4', 'Друк, PDF або Word. Без коду й без книги.', D)
     + tile(I_PHONE, 'Заповнення з телефона', 'Великі поля замість клітинок. Аркуш складається сам.', D)
     + tile(I_SEND, 'Подання в книгу', 'За кодом гуртка запис іде просто в Google Таблицю.', D)
     + tile(I_EYE, 'Вхід виховника', 'Записи за подіями, затвердження, перевірка каси.', D)
     + tile(I_CHART, 'Звіти', 'Шість звітів із книги: друк, PDF, надсилання.', D)
     + tile(I_TABLE, 'Книга гуртка', 'Одна Google Таблиця на рік. Підсумки рахує сама.', D)
     + '</div>', dark=True)

# ───────────────────────── 4. Як влаштовано
def node(n, t, d, p, hot=False):
    bg = p['acc'] if hot else p['pan']
    return (f'<div style="flex:1;background:{bg};border:1px solid {p["acc"] if hot else p["line"]};border-radius:18px;padding:40px 28px 48px;display:flex;flex-direction:column;gap:16px">'
            f'<p style="{BODY};font-size:24px;font-weight:700;letter-spacing:3px;color:{"#ffffff" if hot else p["acc"]}">{n}</p>'
            f'<h3 style="{HEAD};font-size:40px;line-height:1.1;letter-spacing:1px;color:{"#ffffff" if hot else p["fg"]}">{t}</h3>'
            f'<p style="{BODY};font-size:28px;line-height:1.3;color:{"#ffffff" if hot else p["txt"]}">{d}</p></div>')

AR = f'<div style="flex:none;display:flex;flex-direction:column;justify-content:center">{arrow(L_ACC, 48)}</div>'
wide('budova', 'Будова', 'Як це влаштовано',
     '<div style="display:flex;flex-direction:row;gap:14px;align-items:stretch">'
     + node('01', 'Телефон', 'Юнак відкриває сторінку своєї посади', L) + AR
     + node('02', 'Код', 'Вводить код гуртка — і бачить імена', L) + AR
     + node('03', 'Приймач', 'Програма в Google виховника перевіряє код', L) + AR
     + node('04', 'Книга', 'Запис лягає в Google Таблицю виховника', L, hot=True) + AR
     + node('05', 'Звіти', 'З книги — аркуші для друку й PDF', L)
     + '</div><div style="flex:1"></div>'
     + f'<div style="display:flex;flex-direction:row;gap:28px;align-items:center"><div style="width:8px;height:96px;border-radius:4px;background:{L_ACC}"></div>'
       f'<p style="width:1400px;{BODY};font-size:36px;line-height:1.3;color:{L_FG}">Сайт лише показує форму й приймає запис. <b>Імена, гроші й проби зберігає тільки Google Таблиця виховника.</b></p></div>',
     dark=False)

# ───────────────────────── 5. Посади
def trow(a, b):
    return f'<tr><td>{a}</td><td>{b}</td></tr>'

tbl = (f'<table style="width:1032px;{BODY};font-size:28px;color:{D_FG}">'
       f'<tr style="background:{D_PAN}"><th style="width:32%;text-align:left;color:{D_ACC}">Посада</th><th style="width:68%;text-align:left;color:{D_ACC}">Сторінки</th></tr>'
       + trow('гуртковий', 'Сходини · План праці · Завдання')
       + trow('заступник', 'Відвідуваність · Проби · Вмілості · Відзначки')
       + trow('писар', 'Протокол')
       + trow('скарбник', 'Каса · Замовлення нашивок')
       + trow('господар', 'Майно')
       + trow('хронікар', 'Мандрівки й заходи')
       + trow('виховник', 'Вхід виховника · Звіти')
       + '</table>')
split('posady', 'Будова', 'Кожна посада — свої сторінки', 'Юнак знаходить свою посаду — і там усе його.',
      [('Дванадцять сторінок', 'для діловодів гуртка.'), ('Поки посад немає,', 'усе записує виховник одним входом.')],
      tbl, dark=True)

# ───────────────────────── 6. Під'єднання
split('qr', 'Початок роботи', "Один QR — і гурток під'єднано", '',
      [('У книзі:', 'меню «Книга гуртка» → «Посилання для гуртка (QR)».'),
       ('Один QR для всіх', '— або окреме посилання на сторінку посади.'),
       ('Юнак сканує один раз:', "телефон запам'ятовує книгу."),
       ('Код гуртка кажуть усно', '— у посиланні його немає.')],
      shot('qr', 1032, 760, 'Вікно «Посилання для гуртка» з QR-кодом', dark=True) , dark=True, numbered=True)

# ───────────────────────── 7. Бланк
def pill(t, hot=False):
    return (f'<p style="{BODY};font-size:26px;font-weight:700;padding:12px 24px;border-radius:12px;white-space:nowrap;'
            f'background:{L_ACC if hot else D_PAN};color:#ffffff;border:1px solid {L_ACC if hot else D_LINE}">{t}</p>')

bl = (f'<div style="display:flex;flex-direction:column;gap:28px;align-items:center">{shot("p_blank", 1032, 640, "Порожній бланк «Сходини — програма», аркуш A4")}'
      f'<div style="display:flex;flex-direction:row;gap:16px">{pill("Заповнити", True)}{pill("Переглянути")}{pill("Друк або PDF")}{pill("Word")}</div></div>')
split('blank', 'Бланки', 'Бланк для всіх', 'Відкрив сторінку — бланк уже тут. Без коду й без книги.',
      [('Аркуш A4', 'з тими самими стовпцями, що в книзі гуртка.'), ('Чотири кнопки:', 'заповнити, переглянути, надрукувати чи зберегти.'), ('Нічого нікуди не надсилається.', '')],
      bl, dark=True)

# ───────────────────────── 8. Заповнення з телефона
split('telefon', 'Бланки', 'Заповнити з телефона', 'Замість дрібних клітинок — форма з великими полями.',
      [('«Заповнити»', 'на сторінці бланка.'), ('Великі поля:', 'гурток, рік, хто записав.'), ('Рядків — скільки треба.', '«Готово — показати аркуш».')],
      phone('m_skh_top', 690, 'Сторінка «Сходини» на телефоні', (1, 0.80, 0.872))
      + phone('m_form1', 690, 'Форма: гурток, рік, курінь, хто записав', (2, 0.80, 0.24))
      + phone('m_form2', 690, 'Форма: рядок сходин', (3, 0.68, 0.872)),
      dark=False, numbered=True, vgap=34)

# ───────────────────────── 9. Готовий аркуш
split('arkush', 'Бланки', 'Готовий аркуш', 'З форми сам складається той самий бланк — уже заповнений.',
      [('Прочитати й перевірити.', 'Дрібне виправляють дотиком.'), ('«Виправити у формі»', '— назад з усім уписаним.'), ('«Надіслати», «Зберегти PDF», «Друк».', '')],
      f'<div style="position:relative;width:1032px;height:760px">'
      f'<img src="{{IMG:p_skh}}" alt="Заповнений бланк «Сходини — програма»" style="position:absolute;left:0px;top:40px;width:900px;height:638px;object-fit:cover;border-radius:10px;box-shadow:0 30px 70px rgba(0,0,0,0.55)">'
      f'<img src="{{IMG:m_preview}}" alt="Перегляд аркуша на телефоні з кнопками «Надіслати», «Зберегти PDF», «Друк»" style="position:absolute;left:742px;top:132px;width:290px;height:628px;object-fit:cover;border-radius:38px;border:9px solid #0f1114;box-shadow:0 30px 70px rgba(0,0,0,0.65)">'
      f'</div>', dark=True)

# ───────────────────────── 10. Заповнити й подати
split('podaty', 'Подання в книгу', 'Заповнити й подати', 'За кодом гуртка імена вже є — лишається натиснути.',
      [('Позначити кожного:', 'був, не був, поважна причина.'), ('Вибрати, хто записав,', 'і «Надіслати в книгу».'), ('«Записано в книгу»:', 'запис уже в Google Таблиці.')],
      phone('m_vid1', 690, 'Відвідуваність: позначки навпроти імен', (1, 0.40, 0.447))
      + phone('m_vid2', 690, 'Кнопка «Надіслати в книгу»', (2, 0.86, 0.50))
      + phone('m_vid3', 690, 'Повідомлення «Записано в книгу»', (3, 0.80, 0.13)),
      dark=False, numbered=True, vgap=34)

# ───────────────────────── 11–13. Каса, проби, вмілості
split('kasa', 'Подання в книгу', 'Каса', 'Веде скарбник. Залишок рахує книга.',
      [('Кожен платіж', '— окремий рядок із номером квитанції.'), ('Видаток', '— з фото чека.'), ('Де зараз гроші:', 'на рахунку й готівкою.'), ('Хто винен', 'і витяг для однієї людини.')],
      phone('m_kasa', 760, 'Каса на телефоні: внески й видатки') + shot('kasa_r', 560, 760, 'Каса: де зараз гроші, борги, витяг', dark=False), dark=False)

split('proby', 'Подання в книгу', 'Проби: кожна точка окремо', 'Веде заступник. Офіційний бланк проби лишається головним.',
      [('Вибрати пробу, юнаків і точки', '— кілька за один раз.'), ('Видно, яких точок', 'кому ще бракує.'), ('«Проба здобута»', '— окремою позначкою.')],
      phone('m_proby', 760, 'Проби на телефоні: вибір проби, юнаків і точок') + shot('proby_r', 560, 760, 'Хто на якій пробі: виконані точки й яких бракує', dark=False), dark=False)

split('vmilosti', 'Подання в книгу', 'Вмілості й нашивки', 'Хто на що працює — і що вже час замовляти.',
      [('Одна вмілість одного юнака', '— один рядок.'), ('Скільки точок виконано', 'і хто інструктор.'), ('Підказка про нашивки:', 'скільки треба й скільки є в запасі.')],
      shot('vmil_r', 560, 760, 'Хто на що працює: вмілості, нашивки, що замовляти', dark=False) + phone('m_vmilosti', 760, 'Вмілості на телефоні: форма запису'), dark=False)

# ───────────────────────── 14. Вхід виховника
split('vykhovnyk', 'Виховник', 'Вхід виховника', 'Один вхід за кодом виховника. Усе — за подіями.',
      [('Що сталося,', 'те й записуєте.'), ('Книга сама розкладає', 'запис по своїх аркушах.'), ('Юнаки ще без посад?', 'Цього входу вистачає.')],
      shot('hub', 1032, 760, 'Вхід виховника: кнопки «Після сходин», «Прийшов, перейшов, пішов», «Що нового», «Перевірка каси», «Звіти»', dark=False), dark=False)

# ───────────────────────── 15. Після сходин
def dest(t):
    return (f'<div style="display:flex;flex-direction:row;gap:16px;align-items:center;background:{L_PAN};border:1px solid {L_LINE};border-radius:14px;padding:20px 24px">'
            f'{check(L_ACC, 32)}<p style="{BODY};font-size:28px;font-weight:700;color:{L_FG}">{t}</p></div>')

split('pislia', 'Виховник', 'Після сходин', 'Одне «Надіслати» — і записано три речі.',
      [('Сходини:', 'дата, тема, програма.'), ('Хто був:', 'позначка навпроти кожного.'), ('Внески:', 'хто заплатив і як.')],
      shot('ps', 600, 760, 'Форма «Після сходин»: сходини й хто був', dark=False)
      + f'<div style="flex:none;display:flex;flex-direction:column;justify-content:center">{arrow(L_ACC, 56)}</div>'
      + f'<div style="width:300px;display:flex;flex-direction:column;gap:18px">{cap("Запис іде в аркуші книги:", L)}{dest("Сходини")}{dest("Відвідуваність")}{dest("Фінанси")}</div>',
      dark=False, numbered=True, vgap=28)

# ───────────────────────── 16–18
split('novoho', 'Виховник', 'Що нового: затвердити', 'Кожен запис із сайту видно одразу.',
      [('Хто, що й коли', 'записав чи виправив.'), ('«Затвердити»:', 'після цього сайт запис уже не змінить.'), ("П'ять неправильних кодів", '— вхід закрито на годину.')],
      shot('nv', 660, 760, '«Що нового»: записи, що чекають затвердження', dark=False), dark=False)

split('perevirka', 'Виховник', 'Перевірка каси', 'Чи гроші справді є: банк, готівка, чеки.',
      [('Перекази:', '«є в банку» чи «немає».'), ('Готівка й чеки', '— так само, по одному.'), ('Борги «своїх грошей»:', 'повернути або списати.'), ('Раз на місяць', '— звірка.')],
      shot('kp', 640, 760, '«Перевірка каси»: рахунок, готівка, борги, перекази', dark=False), dark=False)

split('rukh', 'Виховник', 'Прийшов, перейшов, пішов', 'Усе про рух людей — вісім випадків.',
      [('Новенький, з новацтва,', 'з іншого гуртка чи краю.'), ('Що людина вже має,', 'записується одразу.'), ('Особливий випадок', '— коли не підходить ніщо.')],
      shot('pp', 1032, 760, 'Вибір випадку: прийшов, перейшов, повернувся, йде від нас, цілий гурток, особливий випадок', dark=False), dark=False)

# ───────────────────────── 19. Звіти
split('zvity', 'Звіти', 'Звіти з книги', 'Нічого не переписувати: сторінка бере записи з книги.',
      [('Шість звітів:', 'гуртка, фінансовий, присутність, рік за роком, картка учасника, досягнення за рік.'),
       ('Вибрати період', '— і «Переглянути».'), ('Друк, PDF', 'або «Надіслати».')],
      shot('p_zvit', 960, 760, 'Звіт гуртка: показники, провід, каса, учасники'), dark=True)

def paper(name, t, alt):
    w, h = fit(name, 500, 506)
    return (f'<div style="display:flex;flex-direction:column;gap:18px;align-items:center">'
            f'<img src="{{IMG:{name}}}" alt="{alt}" style="width:{w}px;height:{h}px;object-fit:cover;border-radius:10px;box-shadow:0 30px 70px rgba(0,0,0,0.55)">'
            f'<p style="{BODY};font-size:28px;font-weight:700;color:{D_FG}">{t}</p></div>')

wide('zvity2', 'Звіти', 'Гроші, людина, роки',
     '<div style="display:flex;flex-direction:row;justify-content:space-between">'
     + paper('p_fin_sq', 'Фінансовий звіт', 'Фінансовий звіт: прийшло, витратили, залишок')
     + paper('p_kartka_sq', 'Картка учасника', 'Картка учасника: усе про одну людину з книги')
     + paper('p_rik_sq', 'Рік за роком', 'Гурток рік за роком: підсумки кожного року')
     + '</div>', dark=True)

split('dosiahnennia', 'Звіти', 'Досягнення за рік', 'Одна сторінка для юнака й батьків.',
      [('Що здобуто:', 'проби, вмілості, відзнаки.'), ('Присутність', 'на сходинах за рік.'), ('Що далі', 'і слово виховника.'), ('Короткий текст', 'для WhatsApp чи Viber.')],
      shot('p_dosiah', 960, 760, 'Виписка «Мій рік у Пласті»'), dark=True)

# ───────────────────────── 22–23. Книга
def window(name, title, tabs, active, maxw, maxh, alt):
    w, h = fit(name, maxw, maxh)
    tb = ''.join(
        f'<p style="{BODY};font-size:24px;font-weight:{700 if t == active else 400};padding:8px 18px;white-space:nowrap;'
        f'color:{"#17603a" if t == active else "#4a5057"};background:{"#e3f1e8" if t == active else "#eef0f2"}">{t}</p>' for t in tabs)
    return (f'<div style="width:{w}px;background:#ffffff;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 70px rgba(0,0,0,0.55)">'
            f'<div style="display:flex;flex-direction:row;gap:14px;align-items:center;padding:14px 20px;background:#f3f4f6">'
            f'<div style="width:26px;height:26px;border-radius:6px;background:#2e9b5f"></div>'
            f'<p style="{BODY};font-size:24px;font-weight:700;color:#24272c">{title}</p></div>'
            f'<img src="{{IMG:{name}}}" alt="{alt}" style="width:{w}px;height:{h}px;object-fit:cover">'
            f'<div style="display:flex;flex-direction:row;gap:4px;padding:8px 12px;background:#eef0f2">{tb}</div></div>')

split('knyha', 'Книга', 'Книга гуртка', 'Одна Google Таблиця на рік — на Диску виховника.',
      [('28 аркушів,', 'згруповані за посадами.'), ('Підсумки рахує сама:', 'присутність, каса, точки проб.'), ('Діловодам відкривати Таблицю не треба.', '')],
      window('b_holovna', 'Книга гуртка «Лелеки (приклад)» · 2026/27', ['Головна', 'Учасники', 'Сходини', 'Проби', 'Фінанси'], 'Головна', 1032, 600, 'Аркуш «Головна»: показники гуртка'), dark=True)

wide('arkushi', 'Книга', 'Аркуші книги',
     '<div style="display:flex;flex-direction:row;justify-content:space-between">'
     + window('b_vidv', 'Аркуш «Відвідуваність»', ['Сходини', 'Відвідуваність', 'Проби'], 'Відвідуваність', 800, 470, 'Аркуш «Відвідуваність»: одні сходини — один рядок')
     + window('b_kasa', 'Аркуш «Фінанси»', ['Фінанси', 'Внески', 'Звірки'], 'Фінанси', 800, 470, 'Аркуш каси: надходження й видатки')
     + '</div>', dark=True)

# ───────────────────────── 24. Диск
def folder(t, d, hot=False):
    return (f'<div style="display:flex;flex-direction:row;align-items:center">'
            f'<div style="width:72px;height:3px;background:{L_MUT}"></div>'
            f'<div style="width:760px;background:{L_ACC if hot else L_PAN};border:1px solid {L_ACC if hot else L_LINE};border-radius:14px;padding:20px 30px;display:flex;flex-direction:column;gap:4px">'
            f'<h3 style="{HEAD};font-size:32px;letter-spacing:1px;color:{"#ffffff" if hot else L_FG}">{t}</h3>'
            f'<p style="{BODY};font-size:26px;line-height:1.25;color:{"#ffffff" if hot else L_TXT}">{d}</p></div></div>')

tree = (f'<div style="display:flex;flex-direction:row;align-items:center">'
        f'<div style="width:300px;background:{L_FG};border-radius:14px;padding:28px 30px;display:flex;flex-direction:column;gap:6px">'
        f'<h3 style="{HEAD};font-size:44px;letter-spacing:1px;color:#ffffff">Гурток</h3><p style="{BODY};font-size:24px;line-height:1.25;color:#d7dce2">Google Диск виховника</p></div>'
        f'<div style="width:40px;height:3px;background:{L_MUT}"></div>'
        f'<div style="display:flex;flex-direction:column;gap:22px;border-left:3px solid {L_MUT}">'
        + folder('Книга', '«Книга гуртка 2026/27» — Google Таблиця', True)
        + folder('Чеки гуртка', 'фото чеків до видатків')
        + folder('Проби та вмілості', 'копії бланків і посвідок')
        + folder('99 Закрите', 'особові дані — окремо від усього')
        + '</div></div>')
split('dysk', 'Книга', 'Де це лежить', 'Усе — в одній папці на Google Диску виховника.',
      [('Книга', '— на кожен гурток своя.'), ('Свої посилання й коди', 'у кожного гуртка.')],
      tree, dark=False, width=440)

# ───────────────────────── 25. Безпека
def sec(t, d):
    return (f'<div style="display:flex;flex-direction:column;gap:12px;border-top:3px solid {L_ACC};padding:28px 0 0 0">'
            f'<h3 style="{HEAD};font-size:40px;line-height:1.12;letter-spacing:1px;color:{L_FG}">{t}</h3>'
            f'<p style="{BODY};font-size:32px;line-height:1.3;color:{L_TXT}">{d}</p></div>')

wide('bezpeka', 'Безпека', 'Дані лишаються у виховника',
     '<div style="flex:1;display:grid;grid-template-columns:repeat(3, 1fr);grid-template-rows:1fr 1fr;gap:36px 56px">'
     + sec('Прізвища — лише в книзі', 'Сайт бачить тільки імена й позначки.')
     + sec('Два коди', 'Один для юнаків, другий для виховника.')
     + sec('Код — усно', 'У посиланні й на сайті коду немає.')
     + sec('Затверджене не змінюється', 'Після «Затвердити» сайт запис не змінить.')
     + sec('Журнал «Зміни»', 'Хто, що й коли записав або виправив.')
     + sec('Папка «99 Закрите»', 'Особові дані — окремо від решти.')
     + '</div>', dark=False)

# ───────────────────────── 26. Стан
def stan(title, items, done):
    c = GRN if done else D_ACC
    rows = ''.join(
        f'<div style="display:flex;flex-direction:row;gap:18px;align-items:flex-start">'
        f'<div style="flex:none;display:flex;flex-direction:column;padding:{"7px" if done else "17px"} 0 0 {"0" if done else "10px"}">'
        + (check(c, 34) if done else f'<div style="width:14px;height:14px;border-radius:50%;border:3px solid {c}"></div>')
        + f'</div><p style="flex:1;{BODY};font-size:36px;line-height:1.3;color:{D_FG}">{t}</p></div>' for t in items)
    return (f'<div style="flex:1;display:flex;flex-direction:column;gap:26px">'
            f'<h3 style="{HEAD};font-size:40px;letter-spacing:2px;color:{c}">{title}</h3><div style="height:2px;background:{D_LINE}"></div>'
            f'<div style="display:flex;flex-direction:column;gap:30px">{rows}</div></div>')

wide('stan', 'Стан', 'Що зроблено і що далі',
     '<div style="display:flex;flex-direction:row;gap:96px">'
     + stan('Зроблено', ['Бланки, форма «Заповнити», PDF і друк', 'Сторінки посад і вхід виховника', 'Шість звітів із книги', 'Книга гуртка і приймач', 'Один QR для гуртка'], True)
     + stan('Далі', ['Перевірка на справжніх телефонах', 'Проба наживо з одним діловодом', '«Хто що веде»: передача справ юнакам', 'Друковані шаблони, конфіденційність, запуск'], False)
     + '</div><div style="flex:1"></div>'
     + f'<p style="{BODY};font-size:28px;color:{D_MUT}">Розділ уже на сайті — зі смужкою «У розробці».</p>', dark=True)

# ───────────────────────── 27. Спробувати
add('sprobuvaty', f'<section id="sprobuvaty" data-transition="fade" style="background:{L_ACC};color:#ffffff;{BODY};padding:128px;display:flex;flex-direction:column;justify-content:center;gap:34px">'
    f'<p style="{BODY};font-size:26px;font-weight:700;letter-spacing:6px;text-transform:uppercase;color:#ffe1e9">Спробуйте самі</p>'
    f'<h2 style="width:1500px;{HEAD};font-size:124px;line-height:1.02;letter-spacing:2px;color:#ffffff">Відкрийте пробу</h2>'
    f'<div style="width:200px;height:10px;border-radius:5px;background:#ffffff"></div>'
    f'<p style="width:1500px;{BODY};font-size:54px;font-weight:700;line-height:1.2;color:#ffffff"><a href="https://gutirky-fi.github.io/proba/dokumenty/">gutirky-fi.github.io/proba/dokumenty</a></p>'
    f'<p style="width:1200px;{BODY};font-size:34px;line-height:1.35;color:#ffe1e9">Вигаданий гурток «Лелеки». Бланки, «Заповнити», перегляд, PDF і друк працюють без книги. Нічого не надсилається й не зберігається.</p>'
    '</section>')

# ───────────────────────── файли
for sid, html in files.items():
    open(f'{OUT}/slides/{sid}.html', 'w', encoding='utf-8').write(html)
sec_ = {"s1": {"description": "Навіщо розділ і що він уміє", "start": "cover"},
        "s2": {"description": "Як це влаштовано і як під'єднати гурток", "start": "budova"},
        "s3": {"description": "Бланки: порожній, заповнення з телефона, готовий аркуш", "start": "blank"},
        "s4": {"description": "Подання в книгу: відвідуваність, каса, проби, вмілості", "start": "podaty"},
        "s5": {"description": "Виховник: вхід, після сходин, затвердження, каса, рух людей", "start": "vykhovnyk"},
        "s6": {"description": "Звіти з книги", "start": "zvity"},
        "s7": {"description": "Книга гуртка й Диск", "start": "knyha"},
        "s8": {"description": "Безпека, стан і як спробувати", "start": "bezpeka"}}
deck = {"v": 4, "createdOnFiles": {"v": 1, "at": datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')},
        "title": "Документи гуртка — презентація розділу", "order": order, "cover": "cover", "sections": sec_,
        "faces": {"oswald": {"family": "Oswald", "href": "https://fonts.googleapis.com/css2?family=Oswald:wght@400..700&display=swap"},
                  "source-sans-3": {"family": "Source Sans 3", "href": "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300..700&display=swap"}},
        "designSystems": []}
json.dump(deck, open(OUT + '/deck.raw.json', 'w', encoding='utf-8'), ensure_ascii=False)
print(len(order), ' '.join(order))
