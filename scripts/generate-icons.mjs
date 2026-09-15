// Generates the PWA icon set as plain PNGs with zero image-processing
// dependencies: a hand-rolled minimal PNG encoder (raw RGBA -> zlib IDAT)
// plus simple rounded-rect pixel fills. Re-run with `npm run generate-icons`
// if you want to redesign the icon later.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('public/icons');
mkdirSync(OUT_DIR, { recursive: true });

// ---- minimal PNG encoder ----

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = chunk('IHDR', ihdrData);

  const stride = width * 4;
  const raw = Buffer.alloc(height * (1 + stride));
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (1 + stride);
    raw[rowStart] = 0; // filter type: None
    rgba.copy(raw, rowStart + 1, y * stride, (y + 1) * stride);
  }
  const idat = chunk('IDAT', deflateSync(raw));
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// ---- drawing helpers ----

function createCanvas(size, [r, g, b, a]) {
  const buf = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i += 1) {
    buf[i * 4] = r;
    buf[i * 4 + 1] = g;
    buf[i * 4 + 2] = b;
    buf[i * 4 + 3] = a;
  }
  return buf;
}

function setPixel(buf, size, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const idx = (y * size + x) * 4;
  buf[idx] = r;
  buf[idx + 1] = g;
  buf[idx + 2] = b;
  buf[idx + 3] = a;
}

function fillRoundedRect(buf, size, x0, y0, w, h, radius, color) {
  for (let y = y0; y < y0 + h; y += 1) {
    for (let x = x0; x < x0 + w; x += 1) {
      const relX = x - x0;
      const relY = y - y0;
      let inside = true;
      if (radius > 0) {
        const cornerDist = (dx, dy) => dx * dx + dy * dy > radius * radius;
        if (relX < radius && relY < radius && cornerDist(radius - relX, radius - relY)) {
          inside = false;
        } else if (relX >= w - radius && relY < radius && cornerDist(relX - (w - radius - 1), radius - relY)) {
          inside = false;
        } else if (relX < radius && relY >= h - radius && cornerDist(radius - relX, relY - (h - radius - 1))) {
          inside = false;
        } else if (
          relX >= w - radius &&
          relY >= h - radius &&
          cornerDist(relX - (w - radius - 1), relY - (h - radius - 1))
        ) {
          inside = false;
        }
      }
      if (inside) setPixel(buf, size, x, y, color);
    }
  }
}

// ---- icon design: rounded square background + a 2x2 tile grid ----

const BG = [143, 122, 102, 255]; // #8f7a66
const TILE_LIGHT = [238, 228, 218, 255]; // #eee4da
const TILE_ORANGE = [242, 177, 121, 255]; // #f2b179

function drawIcon(size, { squareBg = false, extraPadding = false } = {}) {
  const canvas = createCanvas(size, [0, 0, 0, 0]);
  const bgRadius = squareBg ? 0 : Math.round(size * 0.18);
  fillRoundedRect(canvas, size, 0, 0, size, size, bgRadius, BG);

  const padding = Math.round(size * (extraPadding ? 0.22 : 0.14));
  const gap = Math.round(size * 0.06);
  const gridSize = size - padding * 2;
  const tileSize = Math.round((gridSize - gap) / 2);
  const tileRadius = Math.round(tileSize * 0.2);

  const positions = [
    [padding, padding, TILE_LIGHT],
    [padding + tileSize + gap, padding, TILE_ORANGE],
    [padding, padding + tileSize + gap, TILE_ORANGE],
    [padding + tileSize + gap, padding + tileSize + gap, TILE_LIGHT],
  ];

  positions.forEach(([x, y, color]) => {
    fillRoundedRect(canvas, size, x, y, tileSize, tileSize, tileRadius, color);
  });

  return canvas;
}

function writeIcon(filename, size, options) {
  const png = encodePNG(size, size, drawIcon(size, options));
  writeFileSync(path.join(OUT_DIR, filename), png);
  console.log(`wrote ${filename} (${size}x${size})`);
}

writeIcon('icon-192.png', 192, {});
writeIcon('icon-512.png', 512, {});
// Maskable icons must fill the full canvas (OS applies its own shape mask)
// and keep key content inside a safe zone, hence the square bg + extra padding.
writeIcon('icon-maskable-512.png', 512, { squareBg: true, extraPadding: true });
// iOS applies its own corner rounding to apple-touch-icon, so ship it square.
writeIcon('apple-touch-icon.png', 180, { squareBg: true });
