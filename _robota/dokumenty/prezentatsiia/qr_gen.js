const fs=require('fs');
const src=fs.readFileSync('/home/claude/gutirky-fi.github.io/_robota/dokumenty/etap2/qr.js','utf8');
const QR=new Function(src+';return QR;')();
const m=QR.matrytsia(process.argv[2]);
fs.writeFileSync('/home/claude/qr/m.json',JSON.stringify(m));
console.log(m.length);
