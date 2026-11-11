// 浏览器标签小图标（icon.png 512、apple-icon.png 180、favicon.ico 32）。
// 2026-11-11 起照老板 09-11 定稿的五瓣线描莲花生成（public/brand/lotus-mark.png，跟 App、easygospa.ph 同一个文件）：
// 米白底 #F7F4EE、墨色莲花 #171A17、莲花宽占七成，跟 App 桌面图标一样。以前的黑金 / 紫金莲花小图标作废。
// 分享图（opengraph-image.png / twitter-image.png）是 11-05 换的新版（带新莲花），这个脚本不碰。
// 用法：node scripts/generate-site-icon-assets.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const appDirectory = path.join(process.cwd(), 'src', 'app');
const lotusPath = path.join(process.cwd(), 'public', 'brand', 'lotus-mark.png');
const IVORY = { r: 0xf7, g: 0xf4, b: 0xee, alpha: 1 };
const INK = { r: 0x17, g: 0x1a, b: 0x17 };

async function tile(size, widthRatio = 0.7) {
  const w = Math.round(size * widthRatio);
  // 莲花图是透明底黑色：拿它的透明度当形状，涂成墨色
  const alpha = await sharp(lotusPath).resize({ width: w }).extractChannel('alpha').raw().toBuffer({ resolveWithObject: true });
  const ink = await sharp({ create: { width: alpha.info.width, height: alpha.info.height, channels: 3, background: INK } })
    .joinChannel(alpha.data, { raw: { width: alpha.info.width, height: alpha.info.height, channels: 1 } })
    .png()
    .toBuffer();
  const top = Math.round((size - alpha.info.height) / 2 + size / 40);
  return sharp({ create: { width: size, height: size, channels: 4, background: IVORY } })
    .composite([{ input: ink, left: Math.round((size - alpha.info.width) / 2), top }])
    .png({ compressionLevel: 9 });
}

await (await tile(512)).toFile(path.join(appDirectory, 'icon.png'));
await (await tile(180)).toFile(path.join(appDirectory, 'apple-icon.png'));

// favicon.ico：一个 32×32 的 PNG 包在 ico 文件头里（小图上莲花放大到八成宽，线条才看得清）
const faviconPng = await (await tile(32, 0.8)).toBuffer();
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
console.log('icon.png / apple-icon.png / favicon.ico 已按定稿莲花生成');
