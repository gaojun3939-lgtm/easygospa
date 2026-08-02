import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const WIDTH = 1640;
const HEIGHT = 624;
const SAFE_LEFT = 220;
const SAFE_RIGHT = 1420;
const outDir = path.resolve('creative-output/facebook-cover');
const sourceDir = path.join(outDir, 'sources');

const palette = {
  cream: '#F8F2EC',
  green: '#1B4D3E',
  bright: '#2DB83D',
  gold: '#C9A24B',
  muted: '#617A70',
  white: '#FFFFFF',
};

const photos = {
  a018: path.join(sourceDir, 'th-a-018.png'),
  a062: path.join(sourceDir, 'th-a-062.png'),
  a060: path.join(sourceDir, 'th-a-060.png'),
  a023: path.join(sourceDir, 'th-a-023.png'),
  a058: path.join(sourceDir, 'th-a-058.jpg'),
  a057: path.join(sourceDir, 'th-a-057.png'),
};

function svgEscape(text) {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function backgroundSvg() {
  return Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${palette.cream}"/>
      <g opacity="0.045" fill="none" stroke="${palette.green}" stroke-width="1.3">
        <path d="M0 84 C220 22 390 146 610 84 S1010 22 1230 84 S1500 146 1640 84"/>
        <path d="M0 558 C220 496 390 620 610 558 S1010 496 1230 558 S1500 620 1640 558"/>
      </g>
      <circle cx="1530" cy="84" r="116" fill="none" stroke="${palette.gold}" stroke-width="2" opacity="0.11"/>
      <circle cx="110" cy="548" r="82" fill="none" stroke="${palette.bright}" stroke-width="2" opacity="0.08"/>
    </svg>
  `);
}

async function cardBuffer(photoPath, width, height, footerHeight) {
  const photoHeight = height - footerHeight;
  const photo = await sharp(photoPath)
    .resize(width, photoHeight, { fit: 'cover', position: 'north' })
    .modulate({ brightness: 1.025, saturation: 0.96 })
    .toBuffer();

  const radius = 22;
  const mask = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="#fff"/>
    </svg>
  `);
  const accent = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="${photoHeight}" width="${width}" height="${footerHeight}" fill="#fff"/>
      <rect x="${Math.round(width * 0.35)}" y="${photoHeight + 17}" width="${Math.round(width * 0.3)}" height="3" rx="1.5" fill="${palette.gold}" opacity="0.8"/>
    </svg>
  `);

  return sharp({
    create: { width, height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([
      { input: photo, top: 0, left: 0 },
      { input: accent, top: 0, left: 0 },
      { input: mask, blend: 'dest-in' },
    ])
    .png()
    .toBuffer();
}

function textSvgA() {
  return Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .sans { font-family: "Segoe UI", Arial, sans-serif; }
      </style>
      <g class="sans">
        <rect x="260" y="95" width="62" height="6" rx="3" fill="${palette.bright}"/>
        <circle cx="334" cy="98" r="4" fill="${palette.gold}"/>
        <text x="260" y="184" font-size="74" font-weight="800" fill="${palette.green}" letter-spacing="-2">You choose</text>
        <text x="260" y="258" font-size="74" font-weight="800" fill="${palette.green}" letter-spacing="-2">your therapist</text>
        <text x="260" y="325" font-size="25" font-weight="600" fill="${palette.muted}" xml:space="preserve">${svgEscape('Real photos ')}<tspan fill="${palette.gold}">·</tspan>${svgEscape(' No deposit ')}<tspan fill="${palette.gold}">·</tspan>${svgEscape(' As fast as 30 min')}</text>
        <text x="260" y="524" font-size="22" font-weight="700" fill="${palette.green}" xml:space="preserve">${svgEscape('EasyGo Spa ')}<tspan fill="${palette.gold}">·</tspan><tspan fill="${palette.muted}" font-weight="500">${svgEscape(' Premium Home Massage')}</tspan></text>
      </g>
    </svg>
  `);
}

function textSvgB() {
  return Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .sans { font-family: "Segoe UI", Arial, sans-serif; }
      </style>
      <g class="sans">
        <text x="820" y="102" text-anchor="middle" font-size="70" font-weight="800" fill="${palette.green}" letter-spacing="-2">You choose your therapist</text>
        <rect x="574" y="125" width="62" height="5" rx="2.5" fill="${palette.bright}"/>
        <circle cx="648" cy="127.5" r="4" fill="${palette.gold}"/>
        <text x="820" y="165" text-anchor="middle" font-size="25" font-weight="600" fill="${palette.muted}" xml:space="preserve">${svgEscape('Real photos ')}<tspan fill="${palette.gold}">·</tspan>${svgEscape(' No deposit ')}<tspan fill="${palette.gold}">·</tspan>${svgEscape(' As fast as 30 min')}</text>
        <text x="254" y="606" font-size="20" font-weight="700" fill="${palette.green}" xml:space="preserve">${svgEscape('EasyGo Spa ')}<tspan fill="${palette.gold}">·</tspan><tspan fill="${palette.muted}" font-weight="500">${svgEscape(' Premium Home Massage')}</tspan></text>
      </g>
    </svg>
  `);
}

function assertInsideSafeArea(items) {
  for (const item of items) {
    if (item.left < SAFE_LEFT || item.left + item.width > SAFE_RIGHT) {
      throw new Error(`Safe-area violation: ${JSON.stringify(item)}`);
    }
  }
}

async function renderA() {
  const width = 142;
  const height = 456;
  const gap = 16;
  const left = 792;
  const top = 74;
  const chosen = [photos.a018, photos.a060, photos.a023, photos.a058];
  const placements = chosen.map((_, index) => ({ left: left + index * (width + gap), top, width, height }));
  assertInsideSafeArea(placements);
  const cards = await Promise.all(chosen.map(photo => cardBuffer(photo, width, height, 42)));
  const shadows = placements.map(item => ({
    input: Buffer.from(`<svg width="${item.width + 24}" height="${item.height + 24}" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="12" width="${item.width}" height="${item.height}" rx="22" fill="#1B4D3E" opacity="0.12"/></svg>`),
    left: item.left - 12,
    top: item.top - 5,
  }));
  const composites = [
    ...shadows,
    ...cards.map((input, index) => ({ input, left: placements[index].left, top: placements[index].top })),
    { input: textSvgA(), left: 0, top: 0 },
  ];
  return sharp(backgroundSvg()).composite(composites).png({ compressionLevel: 9 }).toFile(path.join(outDir, 'EasyGoSpa-Facebook-Cover-A-text-left.png'));
}

async function renderB() {
  const width = 190;
  const height = 362;
  const gap = 18;
  const left = 309;
  const top = 210;
  const chosen = [photos.a062, photos.a060, photos.a023, photos.a058, photos.a057];
  const placements = chosen.map((_, index) => ({ left: left + index * (width + gap), top, width, height }));
  assertInsideSafeArea(placements);
  const cards = await Promise.all(chosen.map(photo => cardBuffer(photo, width, height, 36)));
  const shadows = placements.map(item => ({
    input: Buffer.from(`<svg width="${item.width + 24}" height="${item.height + 24}" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="12" width="${item.width}" height="${item.height}" rx="22" fill="#1B4D3E" opacity="0.12"/></svg>`),
    left: item.left - 12,
    top: item.top - 5,
  }));
  const composites = [
    ...shadows,
    ...cards.map((input, index) => ({ input, left: placements[index].left, top: placements[index].top })),
    { input: textSvgB(), left: 0, top: 0 },
  ];
  return sharp(backgroundSvg()).composite(composites).png({ compressionLevel: 9 }).toFile(path.join(outDir, 'EasyGoSpa-Facebook-Cover-B-text-top.png'));
}

await fs.mkdir(outDir, { recursive: true });
const [a, b] = await Promise.all([renderA(), renderB()]);

const manifest = {
  generatedAt: new Date().toISOString(),
  canvas: { width: WIDTH, height: HEIGHT },
  safeArea: { left: SAFE_LEFT, right: SAFE_RIGHT, width: SAFE_RIGHT - SAFE_LEFT, height: HEIGHT },
  copy: {
    title: 'You choose your therapist',
    subtitle: 'Real photos · No deposit · As fast as 30 min',
    brand: 'EasyGo Spa · Premium Home Massage',
  },
  sourcePolicy: 'EasyGoSpa therapist-record images only; deterministic crop and tone normalization; no generated faces.',
  variants: [
    { file: 'EasyGoSpa-Facebook-Cover-A-text-left.png', layout: 'text-left', technicians: ['th-a-018', 'th-a-060', 'th-a-023', 'th-a-058'], output: a },
    { file: 'EasyGoSpa-Facebook-Cover-B-text-top.png', layout: 'text-top', technicians: ['th-a-062', 'th-a-060', 'th-a-023', 'th-a-058', 'th-a-057'], output: b },
  ],
};
await fs.writeFile(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(manifest, null, 2));
