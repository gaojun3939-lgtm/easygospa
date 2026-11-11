// 浏览器标签小图标（icon.png 512、apple-icon.png 180、favicon.ico 32）。
// 2026-11-12 老板定「方块图标」统一：App 桌面图标、脸书头像、官网小图标都用 App 图标原图（深绿底金莲花，09-11 定稿的五瓣莲花）。
// 原图 scripts/assets/app-icon.png = App 仓库 assets/icon-a.png 原样拷贝（App 换图标时这里跟着换）；只缩小、不裁、不改色，
// 跟 easygospa.ph 的小图标同一个来源。取代 11-11 的米白底墨色莲花，更早的黑金 / 紫金莲花早已作废。
// 分享图（opengraph-image.jpg / twitter-image.jpg）这个脚本不碰。
// 用法：node scripts/generate-site-icon-assets.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const appDirectory = path.join(process.cwd(), 'src', 'app');
const source = path.join(process.cwd(), 'scripts', 'assets', 'app-icon.png');

// 压成 256 色的 PNG：深绿底金线条，放大对比看不出差别，文件小很多
const icon = (size) => sharp(source).resize(size, size, { kernel: 'lanczos3' }).png({ palette: true, colors: 256, compressionLevel: 9 });

await icon(512).toFile(path.join(appDirectory, 'icon.png'));
await icon(180).toFile(path.join(appDirectory, 'apple-icon.png'));

// favicon.ico：一个 32×32 的 PNG 包在 ico 文件头里
const faviconPng = await icon(32).toBuffer();
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
console.log('icon.png / apple-icon.png / favicon.ico 已按 App 图标原图生成');
