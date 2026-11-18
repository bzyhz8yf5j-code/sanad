import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const sourcePath = path.join(root, 'assets/brand/sanad-logo.rle.json');
const assetsDir = path.join(root, 'assets');

const SOURCE_WIDTH = 380;
const SOURCE_HEIGHT = 127;
const NAVY = [6, 20, 37, 255];
const PALETTE = [
  [0, 0, 0, 0],
  [255, 255, 255, 255],
  [242, 236, 222, 255],
  [232, 184, 83, 255],
  [214, 160, 58, 255],
  [180, 126, 35, 255],
];

function decodeRle(runs) {
  const pixels = new Uint8Array(SOURCE_WIDTH * SOURCE_HEIGHT);
  let offset = 0;
  for (let i = 0; i < runs.length; i += 2) {
    const count = runs[i];
    const value = runs[i + 1];
    if (!Number.isInteger(count) || count < 1 || value < 0 || value >= PALETTE.length) {
      throw new Error('invalid_brand_rle');
    }
    pixels.fill(value, offset, offset + count);
    offset += count;
  }
  if (offset !== pixels.length) throw new Error(`brand_rle_size_mismatch:${offset}`);
  return pixels;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let k = 0; k < 8; k += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const payload = Buffer.from(data);
  const out = Buffer.alloc(12 + payload.length);
  out.writeUInt32BE(payload.length, 0);
  typeBuffer.copy(out, 4);
  payload.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([typeBuffer, payload])), 8 + payload.length);
  return out;
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  const rowBytes = width * 4;
  for (let y = 0; y < height; y += 1) {
    const dst = y * (rowBytes + 1);
    raw[dst] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * rowBytes, rowBytes).copy(raw, dst + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function paintBrand({ width = 1024, height = 1024, background = [0, 0, 0, 0], logoWidth }) {
  const runs = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const source = decodeRle(runs);
  const output = new Uint8Array(width * height * 4);

  for (let p = 0; p < width * height; p += 1) output.set(background, p * 4);

  const targetWidth = logoWidth;
  const targetHeight = Math.round((SOURCE_HEIGHT / SOURCE_WIDTH) * targetWidth);
  const left = Math.round((width - targetWidth) / 2);
  const top = Math.round((height - targetHeight) / 2);

  for (let y = 0; y < targetHeight; y += 1) {
    const sy = Math.min(SOURCE_HEIGHT - 1, Math.floor((y * SOURCE_HEIGHT) / targetHeight));
    for (let x = 0; x < targetWidth; x += 1) {
      const sx = Math.min(SOURCE_WIDTH - 1, Math.floor((x * SOURCE_WIDTH) / targetWidth));
      const paletteIndex = source[sy * SOURCE_WIDTH + sx];
      if (paletteIndex === 0) continue;
      const color = PALETTE[paletteIndex];
      const dst = ((top + y) * width + (left + x)) * 4;
      output.set(color, dst);
    }
  }

  return encodePng(width, height, output);
}

fs.mkdirSync(assetsDir, { recursive: true });

const icon = paintBrand({ background: NAVY, logoWidth: 760 });
const splash = paintBrand({ logoWidth: 680 });

fs.writeFileSync(path.join(assetsDir, 'icon.png'), icon);
fs.writeFileSync(path.join(assetsDir, 'splash-icon.png'), splash);

console.log('brand-assets: generated assets/icon.png and assets/splash-icon.png from approved Sanad handoff');