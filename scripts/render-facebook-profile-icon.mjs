import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const outDir = path.resolve('creative-output/facebook-cover');
const svgPath = path.join(outDir, 'EasyGoSpa-Facebook-Profile-Icon.svg');
const pngPath = path.join(outDir, 'EasyGoSpa-Facebook-Profile-Icon-800.png');

await sharp(svgPath, { density: 192 })
  .resize(800, 800, { fit: 'fill' })
  .png({ compressionLevel: 9 })
  .toFile(pngPath);

const metadata = await sharp(pngPath).metadata();
if (metadata.width !== 800 || metadata.height !== 800 || metadata.format !== 'png') {
  throw new Error(`Invalid profile icon export: ${metadata.width}x${metadata.height} ${metadata.format}`);
}

const manifestPath = path.join(outDir, 'manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
manifest.profileIcon = {
  file: path.basename(pngPath),
  vectorSource: path.basename(svgPath),
  width: 800,
  height: 800,
  facebookCircularCropSafe: true,
  palette: ['#1B4D3E', '#F8F2EC', '#C9A24B'],
  provenance: 'Recolored adaptation of the existing EasyGoSpa lotus icon; no generated logo elements.',
};
await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`PASS ${pngPath} 800x800 PNG`);
