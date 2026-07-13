import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const appDirectory = path.join(process.cwd(), 'src', 'app');
const iconPath = path.join(appDirectory, 'icon.svg');
const iconSvg = await fs.readFile(iconPath);

const faviconPng = await sharp(iconSvg)
  .resize(32, 32)
  .png({ compressionLevel: 9 })
  .toBuffer();

const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);
icoHeader[6] = 32;
icoHeader[7] = 32;
icoHeader[8] = 0;
icoHeader[9] = 0;
icoHeader.writeUInt16LE(1, 10);
icoHeader.writeUInt16LE(32, 12);
icoHeader.writeUInt32LE(faviconPng.length, 14);
icoHeader.writeUInt32LE(22, 18);
await fs.writeFile(path.join(appDirectory, 'favicon.ico'), Buffer.concat([icoHeader, faviconPng]));

await sharp(iconSvg)
  .resize(180, 180)
  .png({ compressionLevel: 9 })
  .toFile(path.join(appDirectory, 'apple-icon.png'));

const shareCardSvg = Buffer.from(`
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cardBackground" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#080711"/>
        <stop offset="0.55" stop-color="#15112c"/>
        <stop offset="1" stop-color="#211c46"/>
      </linearGradient>
      <linearGradient id="cardGold" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#e0a52b"/>
        <stop offset="0.5" stop-color="#f6d27a"/>
        <stop offset="1" stop-color="#e0a52b"/>
      </linearGradient>
      <radialGradient id="goldGlow" cx="50%" cy="30%" r="68%">
        <stop offset="0" stop-color="#f0b429" stop-opacity="0.18"/>
        <stop offset="0.48" stop-color="#4d3860" stop-opacity="0.10"/>
        <stop offset="1" stop-color="#080711" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#cardBackground)"/>
    <rect width="1200" height="630" fill="url(#goldGlow)"/>
    <rect x="36" y="36" width="1128" height="558" rx="34" fill="none" stroke="#e0a52b" stroke-opacity="0.52" stroke-width="2"/>
    <path d="M80 88 H298 M902 88 H1120" stroke="url(#cardGold)" stroke-opacity="0.55" stroke-width="2"/>
    <circle cx="314" cy="88" r="4" fill="#f6d27a" fill-opacity="0.75"/>
    <circle cx="886" cy="88" r="4" fill="#f6d27a" fill-opacity="0.75"/>
    <text x="600" y="376" text-anchor="middle" fill="url(#cardGold)" font-family="Georgia, 'Times New Roman', serif" font-size="82" font-weight="700" letter-spacing="1">EasyGo Spa</text>
    <path d="M416 414 H784" stroke="url(#cardGold)" stroke-width="2" stroke-opacity="0.72"/>
    <text x="600" y="476" text-anchor="middle" fill="#f8f2ec" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="500" letter-spacing="2.2">Premium Home Massage · Manila</text>
  </svg>
`);

const lotusTile = await sharp(iconSvg)
  .resize(184, 184)
  .png({ compressionLevel: 9 })
  .toBuffer();

async function renderShareCard(filename) {
  await sharp(shareCardSvg)
    .composite([{ input: lotusTile, left: 508, top: 92 }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(appDirectory, filename));
}

await Promise.all([
  renderShareCard('opengraph-image.png'),
  renderShareCard('twitter-image.png'),
]);

console.log('Generated favicon.ico, apple-icon.png, opengraph-image.png, and twitter-image.png');
