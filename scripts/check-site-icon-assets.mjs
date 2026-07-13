import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';

const expectedIconSvg = '<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="lcTile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#211c46"/><stop offset="1" stop-color="#14102e"/></linearGradient><linearGradient id="lcGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6d27a"/><stop offset="1" stop-color="#e0a52b"/></linearGradient></defs><rect width="512" height="512" rx="114" fill="url(#lcTile)"/><g stroke="url(#lcGold)" stroke-width="14" stroke-linejoin="round" fill="none"><path d="M256 118 C 292 176 292 244 256 300 C 220 244 220 176 256 118 Z" fill="rgba(240,180,41,0.10)"/><path d="M172 170 C 226 186 258 232 262 296 C 204 288 170 244 172 170 Z"/><path d="M340 170 C 286 186 254 232 250 296 C 308 288 342 244 340 170 Z"/><path d="M104 246 C 158 240 216 268 246 312 C 188 324 130 300 104 246 Z" opacity="0.85"/><path d="M408 246 C 354 240 296 268 266 312 C 324 324 382 300 408 246 Z" opacity="0.85"/><path d="M140 344 C 208 384 304 384 372 344 C 348 408 164 408 140 344 Z" fill="rgba(240,180,41,0.14)"/></g></svg>';
const layoutSource = fs.readFileSync('src/app/layout.tsx', 'utf8');
const iconSource = fs.readFileSync('src/app/icon.svg', 'utf8').trim();
const generatorSource = fs.existsSync('scripts/generate-site-icon-assets.mjs')
  ? fs.readFileSync('scripts/generate-site-icon-assets.mjs', 'utf8')
  : '';

function check(condition, message) {
  assert.ok(condition, message);
  console.log(`[site-icon] PASS ${message}`);
}

async function checkPng(path, width, height, label) {
  check(fs.existsSync(path), `${label} exists`);
  const metadata = await sharp(path).metadata();
  check(metadata.format === 'png' && metadata.width === width && metadata.height === height, `${label} is a ${width}x${height} PNG`);
}

check(iconSource === expectedIconSvg, 'icon.svg exactly matches the approved black-gold lotus vector');

const faviconPath = 'src/app/favicon.ico';
check(fs.existsSync(faviconPath), 'favicon.ico exists for legacy browser and crawler requests');
const favicon = fs.readFileSync(faviconPath);
check(favicon.readUInt16LE(0) === 0 && favicon.readUInt16LE(2) === 1 && favicon.readUInt16LE(4) === 1, 'favicon.ico has one valid icon entry');
check(favicon[6] === 32 && favicon[7] === 32, 'favicon.ico advertises a 32x32 icon');
const faviconImageOffset = favicon.readUInt32LE(18);
const faviconMetadata = await sharp(favicon.subarray(faviconImageOffset)).metadata();
check(faviconMetadata.format === 'png' && faviconMetadata.width === 32 && faviconMetadata.height === 32, 'favicon.ico embeds the 32x32 lotus PNG');

await checkPng('src/app/apple-icon.png', 180, 180, 'Apple touch icon');
await checkPng('src/app/opengraph-image.png', 1200, 630, 'Open Graph image');
await checkPng('src/app/twitter-image.png', 1200, 630, 'Twitter image');

check(generatorSource.includes("from 'sharp'") && generatorSource.includes('Premium Home Massage · Manila'), 'asset generator uses sharp and the approved share-card subtitle');
check(layoutSource.includes('metadataBase: new URL("https://easygospa.com")'), 'metadataBase resolves local social-image URLs');
check(layoutSource.includes('url: "/opengraph-image.png"'), 'Open Graph metadata uses the generated local image');
check(layoutSource.includes('images: ["/twitter-image.png"]'), 'Twitter metadata uses the generated local image');

check(layoutSource.includes('default: "EasyGo Spa | Premium Home Massage Service in Manila"'), 'existing default title remains unchanged');
check(layoutSource.includes('description: "EasyGo Spa provides professional home massage services across Metro Manila. Book trusted therapists for hotel, condo and home massage treatments."'), 'existing site description remains unchanged');
check(layoutSource.includes('title: "EasyGo Spa | Professional Home Massage in Manila"'), 'existing Open Graph title remains unchanged');
check(layoutSource.includes('title: "EasyGo Spa | Home Massage Manila"'), 'existing Twitter title remains unchanged');
