/* Звʼязок пульта з гутіркою — з запасними каналами (з 22.10.2026).
   window.GutirkaNet(PeerJS) → клас, схожий на Peer з PeerJS (той самий API для pult-host-file.js і сторінки пульта),
   але працює одразу двома шляхами:
     1) PeerJS (безкоштовний сервер 0.peerjs.com) — як і раніше;
     2) запасний: кілька публічних MQTT-брокерів через WebSocket (повідомлення йдуть через усі, повтори відкидаються).
   Пульт підключається тим шляхом, що відповів першим. Якщо PeerJS-сервер «лежить» — працює запасний, і навпаки.
   Запасні повідомлення зашифровані (AES-GCM, ключ — з коду й ключа з QR), адреса гутірки — хеш коду.
   Брокери можна замінити: window.GUTIRKA_MQTT = ['wss://…', …] (перед завантаженням). */
(function () {
  'use strict';
  if (window.GutirkaNet) return;
  const BROKERS = () => window.GUTIRKA_MQTT || ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081/mqtt'];
  const NS = 'gutirky-fi/v1/';
  const rnd = n => { const a = new Uint8Array(n); crypto.getRandomValues(a); return [...a].map(b => (b % 36).toString(36)).join(''); };
  class Em {
    constructor() { this._h = {}; }
    on(e, f) { (this._h[e] = this._h[e] || []).push(f); return this; }
    off(e, f) { this._h[e] = (this._h[e] || []).filter(x => x !== f); return this; }
    emit(e, ...a) { (this._h[e] || []).slice().forEach(f => { try { f(...a); } catch (x) { console.error(x); } }); }
  }

  /* ---------------- найпростіший клієнт MQTT 3.1.1 через WebSocket (QoS 0) ---------------- */
  const te = new TextEncoder(), td = new TextDecoder();
  const str = s => { const b = te.encode(s); return [b.length >> 8, b.length & 255, ...b]; };
  const len = n => { const o = []; do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; o.push(d); } while (n > 0); return o; };
  const pkt = (h, body) => { const b = body instanceof Uint8Array ? body : Uint8Array.from(body); const L = len(b.length); const o = new Uint8Array(1 + L.length + b.length); o[0] = h; o.set(L, 1); o.set(b, 1 + L.length); return o; };
  class Mqtt extends Em {
    constructor(url) { super(); this.url = url; this.subs = new Set(); this.ok = false; this.dead = false; this.tries = 0; this.buf = new Uint8Array(0); this.open(); }
    open() {
      if (this.dead) return;
      let ws; try { ws = new WebSocket(this.url, ['mqtt']); } catch (e) { return this.retry(); }
      this.ws = ws; ws.binaryType = 'arraybuffer';
      const to = setTimeout(() => { if (!this.ok) try { ws.close(); } catch (e) { /* ok */ } }, 8000);
      ws.onopen = () => {
        const id = 'gf' + rnd(12);
        ws.send(pkt(0x10, [...str('MQTT'), 4, 2, 0, 45, ...str(id)]));   // CONNECT, clean session, keepalive 45 с
      };
      ws.onmessage = ev => { const d = new Uint8Array(ev.data); const b = new Uint8Array(this.buf.length + d.length); b.set(this.buf); b.set(d, this.buf.length); this.buf = b; this.parse(); };
      ws.onclose = ws.onerror = () => { clearTimeout(to); clearInterval(this.ping); const was = this.ok; this.ok = false; if (this.ws === ws) { this.ws = null; if (was) this.emit('down'); this.retry(); } };
    }
    retry() { if (this.dead) return; this.tries++; clearTimeout(this.rt); this.rt = setTimeout(() => this.open(), Math.min(20000, 1000 * 2 ** Math.min(this.tries, 4))); }
    parse() {
      for (;;) {
        const b = this.buf; if (b.length < 2) return;
        let m = 1, v = 0, i = 1, d;
        do { if (i >= b.length) return; d = b[i++]; v += (d & 127) * m; m *= 128; } while (d & 128);
        if (b.length < i + v) return;
        const t = b[0] >> 4, body = b.subarray(i, i + v); this.buf = b.slice(i + v);
        if (t === 2) {   // CONNACK
          if (body[1] !== 0) { try { this.ws.close(); } catch (e) { /* ok */ } return; }
          this.ok = true; this.tries = 0;
          this.ping = setInterval(() => { try { this.ws.send(Uint8Array.of(0xC0, 0)); } catch (e) { /* ok */ } }, 20000);
          this.subs.forEach(s => this.sendSub(s));
          this.emit('up');
        } else if (t === 3) {   // PUBLISH (QoS 0)
          const tl = (body[0] << 8) | body[1], topic = td.decode(body.subarray(2, 2 + tl));
          this.emit('msg', topic, td.decode(body.subarray(2 + tl)));
        }
      }
    }
    sendSub(topic) { try { this.ws.send(pkt(0x82, [0, 1, ...str(topic), 0])); } catch (e) { /* ok */ } }
    sub(topic) { this.subs.add(topic); if (this.ok) this.sendSub(topic); }
    pub(topic, text) { if (!this.ok) return false; const t = str(topic), p = te.encode(text); const b = new Uint8Array(t.length + p.length); b.set(t); b.set(p, t.length); try { this.ws.send(pkt(0x30, b)); return true; } catch (e) { return false; } }
    close() { this.dead = true; clearTimeout(this.rt); clearInterval(this.ping); const ws = this.ws; this.ws = null; this.ok = false; if (ws) { try { ws.send(Uint8Array.of(0xE0, 0)); } catch (e) { /* ok */ } try { ws.close(); } catch (e) { /* ok */ } } }
  }

  /* ---------------- шифрування й адреси ---------------- */
  const b64 = a => btoa(String.fromCharCode(...new Uint8Array(a)));
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const sha = async s => new Uint8Array(await crypto.subtle.digest('SHA-256', te.encode(s)));
  const hex = a => [...a].map(x => x.toString(16).padStart(2, '0')).join('');
  const KEYS = {};
  const aesKey = (code, k) => KEYS[code + '|' + k] || (KEYS[code + '|' + k] = sha('gutirky-fi|' + code + '|' + (k || '')).then(h => crypto.subtle.importKey('raw', h, 'AES-GCM', false, ['encrypt', 'decrypt'])));
  const hostTopic = async id => NS + 'h/' + hex(await sha('gutirky-fi:' + id)).slice(0, 32);
  async function seal(key, obj) { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key, te.encode(JSON.stringify(obj))); return JSON.stringify({ v: 1, iv: b64(iv), ct: b64(ct) }); }
  async function open(key, text) { try { const e = JSON.parse(text); const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(e.iv) }, await key, unb64(e.ct)); return JSON.parse(td.decode(pt)); } catch (e) { return null; } }
  const codeOf = id => String(id || '').replace(/^gutirka-/, '');

  /* ---------------- запасний «Peer» поверх брокерів ---------------- */
  const PART = 30000;   // великі повідомлення (картинки для пульта) — частинами
  class RelayConn extends Em {
    constructor(peer, cid, to, key) { super(); this.p = peer; this.cid = cid; this.to = to; this.key = key; this.open = false; this.parts = {}; this.peer = to; }
    send(d) {
      if (!this.open) return;
      const s = JSON.stringify(d), mid = rnd(10);
      if (s.length <= PART) return this.p.out(this.to, this.key, { k: 'data', cid: this.cid, from: this.p.inbox, s });
      const n = Math.ceil(s.length / PART);
      for (let i = 0; i < n; i++) this.p.out(this.to, this.key, { k: 'part', cid: this.cid, from: this.p.inbox, m: mid, i, n, s: s.slice(i * PART, (i + 1) * PART) });
    }
    got(m) {
      let s = m.s;
      if (m.k === 'part') { const P = this.parts[m.m] = this.parts[m.m] || []; P[m.i] = m.s; if (P.filter(x => x != null).length < m.n) return; s = P.join(''); delete this.parts[m.m]; }
      let d; try { d = JSON.parse(s); } catch (e) { return; }
      this.emit('data', d);
    }
    close() { if (!this.open) return; this.open = false; this.p.out(this.to, this.key, { k: 'close', cid: this.cid, from: this.p.inbox }); delete this.p.conns[this.cid]; setTimeout(() => this.emit('close'), 0); }
  }
  class RelayPeer extends Em {
    constructor(id) {
      super();
      this.id = id || 'r' + rnd(14); this.host = /^gutirka-/.test(this.id); this.conns = {}; this.seen = new Set(); this.disconnected = false; this.destroyed = false; this.isOpen = false;
      this.code = codeOf(this.id);
      this.brokers = BROKERS().map(u => new Mqtt(u));
      (async () => {
        this.inbox = this.host ? await hostTopic(this.id) : NS + 'p/' + this.id;
        this.brokers.forEach(b => {
          b.on('up', () => { if (!this.isOpen && !this.destroyed) { this.isOpen = true; this.emit('open', this.id); } });
          b.on('msg', (t, text) => { if (t === this.inbox) this.inMsg(text); });
          b.sub(this.inbox);
        });
      })();
      this.failT = setTimeout(() => { if (!this.isOpen && !this.destroyed) this.emit('error', { type: 'network' }); }, 15000);
    }
    up() { return this.brokers.some(b => b.ok); }
    out(to, key, msg) {
      msg.mid = rnd(10);
      seal(key, msg).then(text => { this.brokers.forEach(b => b.pub(to, text)); });
    }
    async inMsg(text) {
      // гутірка: пробуємо ключ з QR, тоді — лише код (пульт, де код ввели вручну); пульт: ключ свого зʼєднання
      let m = null, key = null;
      if (this.host) { for (const k of [window.GUTIRKA_NET_KEY || '', '']) { key = aesKey(this.code, k); m = await open(key, text); if (m) break; } }
      else for (const c of Object.values(this.conns)) { m = await open(c.key, text); if (m) { key = c.key; break; } }
      if (!m || this.seen.has(m.mid)) return;
      this.seen.add(m.mid); if (this.seen.size > 800) this.seen = new Set([...this.seen].slice(-400));
      let c = this.conns[m.cid];
      if (m.k === 'conn' && this.host) {
        if (!c) { c = this.conns[m.cid] = new RelayConn(this, m.cid, m.from, key); c.open = true; this.emit('connection', c); setTimeout(() => c.emit('open'), 0); }
        this.out(m.from, key, { k: 'ack', cid: m.cid, from: this.inbox });
      } else if (m.k === 'ack' && c && !c.open) { c.open = true; clearInterval(c.knock); c.emit('open'); }
      else if ((m.k === 'data' || m.k === 'part') && c) c.got(m);
      else if (m.k === 'close' && c) { c.open = false; delete this.conns[m.cid]; c.emit('close'); }
    }
    connect(id) {
      const cid = rnd(12), key = aesKey(codeOf(id), window.GUTIRKA_NET_KEY || '');
      const c = this.conns[cid] = new RelayConn(this, cid, null, key);
      hostTopic(id).then(to => {
        c.to = to; c.peer = id;
        const knock = () => { if (!c.open && !this.destroyed) this.out(to, key, { k: 'conn', cid, from: this.inbox }); };
        knock(); c.knock = setInterval(knock, 2500);   // повторюємо, поки гутірка не відповість
        setTimeout(() => { if (!c.open) { clearInterval(c.knock); c.emit('error', { type: 'peer-unavailable' }); } }, 12000);
      });
      return c;
    }
    destroy() { this.destroyed = true; clearTimeout(this.failT); Object.values(this.conns).forEach(c => { try { c.close(); } catch (e) { /* ok */ } clearInterval(c.knock); }); this.brokers.forEach(b => b.close()); }
    disconnect() {} reconnect() {}
  }

  /* ---------------- спільний Peer: PeerJS + запасний одночасно ---------------- */
  window.GutirkaNet = function (PJ) {
    class NetConn extends Em {
      constructor(peer, id, opts) {
        super(); this.peer = id; this.open = false; this.win = null; this.tries = []; this.failed = 0; this.n = 0;
        const add = c => {
          this.n++; this.tries.push(c);
          c.on('open', () => {
            if (this.win || this.closed) { if (this.win !== c) try { c.close(); } catch (e) { /* ok */ } return; }
            this.win = c; this.open = true;
            this.tries.forEach(x => { if (x !== c) try { x.close(); } catch (e) { /* ok */ } });
            c.on('data', d => this.emit('data', d));
            c.on('close', () => { if (this.win === c) { this.open = false; this.emit('close'); } });
            this.emit('open');
          });
          c.on('error', e => { if (this.win === c) { this.emit('error', e); return; } if (++this.failed >= this.need()) { peer.emit('error', e && e.type ? e : { type: 'peer-unavailable' }); this.emit('error', e); } });
        };
        this.need = () => peer.inner.length;
        peer.inner.forEach(p => { if (p.isUp) { try { add(p.connect(id, opts)); } catch (e) { this.failed++; } } else p._gq.push(() => { if (!this.win && !this.closed) try { add(p.connect(id, opts)); } catch (e) { this.failed++; } }); });
      }
      send(d) { if (this.win) this.win.send(d); }
      close() { this.closed = true; this.open = false; this.tries.forEach(c => { try { c.close(); } catch (e) { /* ok */ } }); }
    }
    class NetPeer extends Em {
      constructor(id, opts) {
        super(); this.id = id; this.inner = []; this.destroyed = false; this.opened = false; this.errs = 0;
        const add = (p, kind) => {
          p.kind = kind; p.isUp = false; p._gq = []; this.inner.push(p);
          p.on('open', pid => { p.isUp = true; if (!this.id) this.id = pid; p._gq.splice(0).forEach(f => f()); if (!this.opened) { this.opened = true; this.emit('open', this.id); } });
          p.on('connection', c => this.emit('connection', c));
          p.on('error', e => {
            const ty = e && e.type;
            if (ty === 'unavailable-id' || ty === 'browser-incompatible') { this.emit('error', e); return; }   // код зайнятий — гутірка сама візьме інший
            if (ty === 'peer-unavailable') return;   // це вирішує NetConn
            p.isUp = false;
            if (!this.inner.some(x => x.isUp)) this.emit('error', e);   // помилка лише тоді, коли не працює жоден шлях
          });
          p.on('disconnected', () => {
            p.isUp = false;
            if (!this.inner.some(x => x.isUp)) { this.emit('disconnected'); return; }
            // інший шлях працює — цей відновлюємо самі, тихо
            const again = () => { if (this.destroyed || p.destroyed || !p.disconnected) return; try { p.reconnect(); } catch (e) { /* ok */ } setTimeout(again, 10000); };
            setTimeout(again, 3000);
          });
          p.on('close', () => { p.isUp = false; if (!this.destroyed && !this.inner.some(x => x.isUp)) this.emit('close'); });
        };
        if (PJ) { try { add(new PJ(id, opts), 'peerjs'); } catch (e) { /* без PeerJS */ } }
        try { add(new RelayPeer(id), 'relay'); } catch (e) { /* без запасного */ }
      }
      get disconnected() { return !this.inner.some(x => x.isUp); }
      connect(id, opts) { return new NetConn(this, id, opts); }
      reconnect() { this.inner.forEach(p => { if (p.disconnected && !p.destroyed) try { p.reconnect(); } catch (e) { /* ok */ } }); }
      destroy() { this.destroyed = true; this.inner.forEach(p => { try { p.destroy(); } catch (e) { /* ok */ } }); }
    }
    return NetPeer;
  };
  window.GutirkaNet.RelayPeer = RelayPeer;
})();
