"""Ігри виховника — підготовлені ігри (питання з відповідями) у розділі «Виховники → Ігри».

Репозиторій ВІДКРИТИЙ, тому тут лежить лише ЗАШИФРОВАНЕ (ihry.enc.json). Відкритий текст питань у репозиторій не класти.
Шифр: PBKDF2-SHA256 (код виховників + сіль, 250 000 кроків) -> AES-256-GCM; у браузері розшифровує WebCrypto тим кодом,
який виховник ввів на вході. Код береться зі змінної IHRY_KOD (або питається).

  python3 _robota/ihry-vyh/ihry.py spysok                 — список ігор (назви)
  python3 _robota/ihry-vyh/ihry.py dodaty gra.json        — додати/замінити гру (за id)
  python3 _robota/ihry-vyh/ihry.py prybraty <id>          — прибрати гру
  python3 _robota/ihry-vyh/ihry.py vytyahty <id> out.json — розшифрувати гру у файл (поза репозиторієм!)
  python3 _robota/ihry-vyh/ihry.py perekod                — перешифрувати все новим кодом (IHRY_KOD_NOVYI)

gra.json: {"id": "2026-11-09-ukraina", "gra": "zmag", "nazva": "Неділя 9.11 — Україна", "vik": "12–15 років",
           "opys": "5 тем · 25 питань", "c": [ {"n": "Тема", "q": [["Питання", "Відповідь (довідка)", ["хибна", "хибна", "хибна"]], ×5]} ×5 ]}
Після змін: python3 _robota/proby/vhody/zibraty.py (макет) — гра з'явиться у вкладці «Ігри»."""
import base64, getpass, json, os, pathlib, sys
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

F = pathlib.Path(__file__).parent / 'ihry.enc.json'
IT = 250000
b64 = lambda b: base64.b64encode(b).decode()
unb64 = base64.b64decode


def key(kod, salt):
    return PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=IT).derive(kod.encode())


def kod(env='IHRY_KOD'):
    return os.environ.get(env) or getpass.getpass('Код виховників: ')


def load():
    if F.exists():
        return json.loads(F.read_text(encoding='utf-8'))
    return {'v': 1, 'salt': b64(os.urandom(16)), 'it': IT, 'ihry': []}


def save(d):
    F.write_text(json.dumps(d, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


def enc(k, obj):
    iv = os.urandom(12)
    return {'iv': b64(iv), 'ct': b64(AESGCM(k).encrypt(iv, json.dumps(obj, ensure_ascii=False).encode(), None))}


def dec(k, e):
    return json.loads(AESGCM(k).decrypt(unb64(e['iv']), unb64(e['ct']), None))


def check(g):
    assert g.get('id') and g.get('nazva') and g.get('gra') in ('zmag',), 'потрібні id, nazva, gra=zmag'
    c = g['c']; assert len(c) == 5 and all(len(C['q']) == 5 for C in c), '5 тем × 5 питань'


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'spysok'
    d = load(); k = key(kod(), unb64(d['salt']))
    if cmd == 'spysok':
        for e in d['ihry']:
            g = dec(k, e); print(g['id'], '|', g['gra'], '|', g['nazva'])
        print('усього:', len(d['ihry']))
    elif cmd == 'dodaty':
        g = json.loads(pathlib.Path(sys.argv[2]).read_text(encoding='utf-8')); check(g)
        d['ihry'] = [e for e in d['ihry'] if dec(k, e)['id'] != g['id']]
        d['ihry'].insert(0, enc(k, g)); save(d); print('додано:', g['nazva'])
    elif cmd == 'prybraty':
        n = len(d['ihry']); d['ihry'] = [e for e in d['ihry'] if dec(k, e)['id'] != sys.argv[2]]; save(d); print('прибрано:', n - len(d['ihry']))
    elif cmd == 'vytyahty':
        g = next(dec(k, e) for e in d['ihry'] if dec(k, e)['id'] == sys.argv[2])
        pathlib.Path(sys.argv[3]).write_text(json.dumps(g, ensure_ascii=False, indent=1), encoding='utf-8'); print('записано', sys.argv[3])
    elif cmd == 'perekod':
        games = [dec(k, e) for e in d['ihry']]; d['salt'] = b64(os.urandom(16)); k2 = key(kod('IHRY_KOD_NOVYI'), unb64(d['salt']))
        d['ihry'] = [enc(k2, g) for g in games]; save(d); print('перешифровано:', len(games))
