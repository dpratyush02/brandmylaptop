import sharp from 'sharp';

const path = 'C:/Users/AKANKSHYA/desktop/brandmylaptop/public/laptop/hp-space.jpeg';
const { data, info } = await sharp(path).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
const { width, height } = info;
console.log('size', width, height);

// Bright dashed strokes vs dark lid
const mask = new Uint8Array(width * height);
for (let i = 0; i < width * height; i++) {
  const o = i * 4;
  const r = data[o], g = data[o + 1], b = data[o + 2];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  // dashed box lines are pale gray, nearly neutral
  mask[i] = lum > 140 && lum < 245 && max - min < 40 ? 1 : 0;
}

function rowCount(y) {
  let c = 0;
  for (let x = 0; x < width; x++) if (mask[y * width + x]) c++;
  return c;
}
function colCount(x, y0, y1) {
  let c = 0;
  for (let y = y0; y < y1; y++) if (mask[y * width + x]) c++;
  return c;
}

console.log('--- horizontal bright density ---');
for (let y = 0; y < height; y += 8) {
  const c = rowCount(y);
  if (c > 40) console.log(y, (y / height * 100).toFixed(2) + '%', c);
}

// Find laptop content region: ignore very top/bottom black studio
const contentY = [];
for (let y = 0; y < height; y++) {
  let dark = 0;
  for (let x = 0; x < width; x++) {
    const o = (y * width + x) * 4;
    const lum = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
    if (lum > 18 && lum < 90) dark++;
  }
  if (dark > width * 0.25) contentY.push(y);
}
const lidTop = contentY[0];
const lidBot = contentY[contentY.length - 1];
console.log('lid Y', lidTop, lidBot, (lidTop / height * 100).toFixed(2), (lidBot / height * 100).toFixed(2));

const contentX = [];
for (let x = 0; x < width; x++) {
  let dark = 0;
  for (let y = lidTop; y <= lidBot; y++) {
    const o = (y * width + x) * 4;
    const lum = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
    if (lum > 18 && lum < 90) dark++;
  }
  if (dark > (lidBot - lidTop) * 0.25) contentX.push(x);
}
const lidLeft = contentX[0];
const lidRight = contentX[contentX.length - 1];
console.log('lid X', lidLeft, lidRight, (lidLeft / width * 100).toFixed(2), (lidRight / width * 100).toFixed(2));

// Scan for horizontal dashed edges inside lid
console.log('--- dashed rows inside lid ---');
for (let y = lidTop; y <= lidBot; y++) {
  let c = 0;
  for (let x = lidLeft; x <= lidRight; x++) if (mask[y * width + x]) c++;
  if (c > 80) console.log('y', y, (y / height * 100).toFixed(2) + '%', 'count', c);
}

function colBright(x, y0, y1) {
  let c = 0;
  for (let y = y0; y <= y1; y++) if (mask[y * width + x]) c++;
  return c;
}

function lumAt(x, y) {
  const o = (y * width + x) * 4;
  return 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
}

function profile(y) {
  const pts = [];
  for (let x = 120; x <= 1160; x += 2) pts.push({ x, p: (x / width * 100), lum: lumAt(x, y) });
  return pts;
}

for (const y of [200, 350, 490, 640]) {
  console.log('\n=== lum row y', y, (y / height * 100).toFixed(1) + '% ===');
  const pts = profile(y);
  let inHi = false;
  let start = null;
  for (const p of pts) {
    const hi = p.lum > 95;
    if (hi && !inHi) { start = p; inHi = true; }
    if (!hi && inHi) {
      console.log('bright span', start.p.toFixed(1) + '-' + p.p.toFixed(1), 'lum', start.lum.toFixed(0), '-', p.lum.toFixed(0));
      inHi = false;
    }
  }
}

console.log('\n=== mid-row dark spans (inside boxes) ===');
for (const y of [200, 350, 490, 640]) {
  console.log('-- y', y);
  let inDark = false;
  let start = null;
  for (let x = 140; x <= 1140; x++) {
    const lum = lumAt(x, y);
    const dark = lum > 25 && lum < 85;
    if (dark && !inDark) { start = x; inDark = true; }
    if (!dark && inDark) {
      const w = x - start;
      if (w > 80) console.log('dark', (start / width * 100).toFixed(2), '-', (x / width * 100).toFixed(2), 'w', (w / width * 100).toFixed(2), 'px', start, x);
      inDark = false;
    }
  }
}

for (const band of bands) {
  console.log('---', band.name, 'vertical dashed edges ---');
  let last = 0;
  for (let x = lidLeft; x <= lidRight; x++) {
    const c = colBright(x, band.y0, band.y1);
    if (c > (band.y1 - band.y0) * 0.25 && x - last > 8) {
      console.log('x', x, (x / width * 100).toFixed(2) + '%', 'count', c);
      last = x;
    }
  }
}
