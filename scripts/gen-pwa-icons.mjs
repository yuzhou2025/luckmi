/**
 * scripts/gen-pwa-icons.mjs
 * 零依赖生成 PWA PNG 图标（紫底 #1A1426 + 暖金 L 字母标）。
 * 产出：public/icon-192.png、icon-512.png、apple-touch-icon-180.png
 * 用法：node scripts/gen-pwa-icons.mjs
 */
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const PURPLE = [0x1a, 0x14, 0x26];
const GOLD = [0xd4, 0xaf, 0x37];

/** CRC32（PNG chunk 校验） */
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/** 生成 size×size RGBA PNG：紫底 + 居中金色 L */
function makePng(size) {
  const px = Buffer.alloc(size * (size * 4 + 1));
  // L 笔画几何（相对 512 坐标系）：竖条 + 底条
  const s = size / 512;
  const barW = 56 * s;
  const x0 = 168 * s, x1 = 344 * s;
  const yTop = 128 * s, yBot = 384 * s;

  const inL = (x, y) =>
    (x >= x0 && x <= x0 + barW && y >= yTop && y <= yBot) ||
    (x >= x0 && x <= x1 && y >= yBot - barW && y <= yBot);

  let o = 0;
  for (let y = 0; y < size; y++) {
    px[o++] = 0; // row filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = inL(x + 0.5, y + 0.5) ? GOLD : PURPLE;
      px[o++] = r; px[o++] = g; px[o++] = b; px[o++] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  // 10-12: compression/filter/interlace = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(px)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = path.join(process.cwd(), 'public');
fs.mkdirSync(outDir, { recursive: true });
for (const size of [192, 512, 180]) {
  const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
  fs.writeFileSync(path.join(outDir, name), makePng(size));
  console.log(`written public/${name} (${size}×${size})`);
}
