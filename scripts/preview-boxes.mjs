import sharp from 'sharp';
import { writeFileSync } from 'fs';

const boxes = {
  1: { left: 13.52, top: 16.06, width: 23.44, height: 14.77 },
  2: { left: 39.14, top: 16.06, width: 22.27, height: 14.77 },
  3: { left: 63.59, top: 16.06, width: 22.50, height: 14.77 },
  4: { left: 13.52, top: 34.00, width: 27.34, height: 14.18 },
  5: { left: 58.70, top: 34.00, width: 27.39, height: 14.18 },
  6: { left: 13.52, top: 51.23, width: 27.34, height: 13.25 },
  8: { left: 58.70, top: 51.23, width: 27.39, height: 13.25 },
  9: { left: 13.52, top: 67.64, width: 22.55, height: 15.48 },
  7: { left: 39.14, top: 67.64, width: 22.27, height: 15.48 },
  10: { left: 63.59, top: 67.64, width: 22.50, height: 15.48 },
};

const w = 1280;
const h = 853;
const rects = Object.entries(boxes)
  .map(([n, b]) => {
    const x = (b.left / 100) * w;
    const y = (b.top / 100) * h;
    const bw = (b.width / 100) * w;
    const bh = (b.height / 100) * h;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="none" stroke="#C8F542" stroke-width="3"/><text x="${(x + bw / 2).toFixed(1)}" y="${(y + bh / 2 + 8).toFixed(1)}" text-anchor="middle" font-size="28" fill="#C8F542" font-family="sans-serif">${n.padStart(2, '0')}</text>`;
  })
  .join('');

const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
writeFileSync('C:/Users/AKANKSHYA/desktop/brandmylaptop/scripts/boxes.svg', svg);

await sharp('C:/Users/AKANKSHYA/desktop/brandmylaptop/public/laptop/hp-space.jpeg')
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .jpeg({ quality: 90 })
  .toFile('C:/Users/AKANKSHYA/desktop/brandmylaptop/public/laptop/overlay-preview.jpg');

console.log('wrote overlay-preview.jpg');
