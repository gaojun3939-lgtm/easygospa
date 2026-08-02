import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const dir = path.resolve('creative-output/facebook-cover');
const expected = [
  'EasyGoSpa-Facebook-Cover-A-text-left.png',
  'EasyGoSpa-Facebook-Cover-B-text-top.png',
];
const manifest = JSON.parse(await fs.readFile(path.join(dir, 'manifest.json'), 'utf8'));

if (manifest.canvas.width !== 1640 || manifest.canvas.height !== 624) throw new Error('Manifest canvas mismatch');
if (manifest.safeArea.left !== 220 || manifest.safeArea.right !== 1420 || manifest.safeArea.width !== 1200) throw new Error('Manifest safe area mismatch');
if (manifest.copy.title !== 'You choose your therapist') throw new Error('Title mismatch');
if (manifest.copy.subtitle !== 'Real photos · No deposit · As fast as 30 min') throw new Error('Subtitle mismatch');
if (manifest.copy.brand !== 'EasyGo Spa · Premium Home Massage') throw new Error('Brand line mismatch');
if (!manifest.sourcePolicy.includes('no generated faces')) throw new Error('Source policy missing');

for (const file of expected) {
  const metadata = await sharp(path.join(dir, file)).metadata();
  if (metadata.width !== 1640 || metadata.height !== 624 || metadata.format !== 'png') {
    throw new Error(`${file}: invalid export ${metadata.width}x${metadata.height} ${metadata.format}`);
  }
  const stats = await fs.stat(path.join(dir, file));
  if (stats.size < 100_000) throw new Error(`${file}: suspiciously small output`);
  console.log(`PASS ${file} ${metadata.width}x${metadata.height} ${stats.size} bytes`);
}

console.log('PASS exact copy, 1200px safe-area manifest, therapist-record provenance, and 2/2 PNG exports');
