// Мінімальний MQTT-брокер через WebSocket — лише для локальної перевірки (QoS 0, точні теми).
const http = require('http'), crypto = require('crypto');
const port = +process.argv[2] || 9001, dropAfter = +process.argv[3] || 0;
const subs = new Map(); // topic -> Set(client)
let count = 0;
function frame(buf) { const n = buf.length; let h; if (n < 126) h = Buffer.from([0x82, n]); else if (n < 65536) { h = Buffer.alloc(4); h[0] = 0x82; h[1] = 126; h.writeUInt16BE(n, 2); } else { h = Buffer.alloc(10); h[0] = 0x82; h[1] = 127; h.writeBigUInt64BE(BigInt(n), 2); } return Buffer.concat([h, buf]); }
const enc = n => { const o = []; do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; o.push(d); } while (n > 0); return Buffer.from(o); };
const mpkt = (h, body) => Buffer.concat([Buffer.from([h]), enc(body.length), body]);
const srv = http.createServer((q, r) => { r.writeHead(200); r.end('mini'); });
srv.on('upgrade', (req, sock) => {
  const key = req.headers['sec-websocket-key'];
  const acc = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acc + '\r\nSec-WebSocket-Protocol: mqtt\r\n\r\n');
  const cl = { sock, topics: new Set() }; let wbuf = Buffer.alloc(0), mbuf = Buffer.alloc(0);
  const send = b => { try { sock.write(frame(b)); } catch (e) {} };
  cl.send = send;
  sock.on('data', d => {
    wbuf = Buffer.concat([wbuf, d]);
    for (;;) {
      if (wbuf.length < 2) break;
      const op = wbuf[0] & 15; let len = wbuf[1] & 127, off = 2;
      if (len === 126) { if (wbuf.length < 4) break; len = wbuf.readUInt16BE(2); off = 4; } else if (len === 127) { if (wbuf.length < 10) break; len = Number(wbuf.readBigUInt64BE(2)); off = 10; }
      const masked = wbuf[1] & 128; const mk = masked ? wbuf.slice(off, off + 4) : null; if (masked) off += 4;
      if (wbuf.length < off + len) break;
      let pl = Buffer.from(wbuf.slice(off, off + len)); wbuf = wbuf.slice(off + len);
      if (mk) for (let i = 0; i < pl.length; i++) pl[i] ^= mk[i & 3];
      if (op === 8) { sock.end(); return; }
      if (op === 2 || op === 0) { mbuf = Buffer.concat([mbuf, pl]); mqtt(); }
    }
  });
  function mqtt() {
    for (;;) {
      if (mbuf.length < 2) return;
      let m = 1, v = 0, i = 1, d; do { if (i >= mbuf.length) return; d = mbuf[i++]; v += (d & 127) * m; m *= 128; } while (d & 128);
      if (mbuf.length < i + v) return;
      const t = mbuf[0] >> 4, body = mbuf.slice(i, i + v); mbuf = mbuf.slice(i + v);
      if (t === 1) send(mpkt(0x20, Buffer.from([0, 0])));
      else if (t === 8) { const pid = body.slice(0, 2); const tl = body.readUInt16BE(2); const topic = body.slice(4, 4 + tl).toString(); cl.topics.add(topic); if (!subs.has(topic)) subs.set(topic, new Set()); subs.get(topic).add(cl); send(mpkt(0x90, Buffer.concat([pid, Buffer.from([0])]))); }
      else if (t === 3) { const tl = body.readUInt16BE(0); const topic = body.slice(2, 2 + tl).toString(); count++; if (dropAfter && count > dropAfter) continue; (subs.get(topic) || []).forEach(c => c.send(mpkt(0x30, body))); }
      else if (t === 12) send(Buffer.from([0xD0, 0]));
      else if (t === 14) sock.end();
    }
  }
  sock.on('close', () => cl.topics.forEach(t => subs.get(t) && subs.get(t).delete(cl)));
  sock.on('error', () => {});
});
srv.listen(port, '127.0.0.1', () => console.log('mini broker', port));
