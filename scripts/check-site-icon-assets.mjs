// 检查网站的标都是老板 09-11 定稿的五瓣线描莲花、名字写 EasyGoSpa（2026-11-11 老板「我们不是有我们的专用图表 你还记得么」→「全部换」）。
// 用法：node scripts/check-site-icon-assets.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import sharp from 'sharp';

function check(condition, message) {
  assert.ok(condition, message);
  console.log(`[site-icon] PASS ${message}`);
}
async function checkPng(p, width, height, label) {
  check(fs.existsSync(p), `${label} exists`);
  const m = await sharp(p).metadata();
  check(m.format === 'png' && m.width === width && m.height === height, `${label} is a ${width}x${height} PNG`);
}

check(fs.existsSync('public/brand/lotus-mark.png'), 'public/brand/lotus-mark.png（定稿莲花）存在');
if (fs.existsSync('../easygospa-ph/public/images/lotus-mark.png')) {
  check(fs.readFileSync('public/brand/lotus-mark.png').equals(fs.readFileSync('../easygospa-ph/public/images/lotus-mark.png')), '跟 easygospa.ph 的莲花是同一个文件');
}
check(!fs.existsSync('src/app/icon.svg'), '旧的黑金莲花 icon.svg 已删');
await checkPng('src/app/icon.png', 512, 512, '标签小图标 icon.png');
await checkPng('src/app/apple-icon.png', 180, 180, '苹果桌面图标 apple-icon.png');
const favicon = fs.readFileSync('src/app/favicon.ico');
check(favicon.readUInt16LE(0) === 0 && favicon.readUInt16LE(2) === 1, 'favicon.ico 是有效的 ico');

const brandMark = fs.readFileSync('src/components/BrandMark.jsx', 'utf8');
check(brandMark.includes('/brand/lotus-mark.png') && !brandMark.includes('<path'), 'BrandMark 用定稿莲花图，不再画旧的三瓣莲花');

const left = execSync(
  "grep -rl 'EasyGo Spa' src || true",
  { encoding: 'utf8' },
).split('\n').filter(Boolean)
  // 下面这几个是旧官网留下、全球站没有任何页面在用的零件
  .filter((f) => !/src\/components\/(TestimonialsSection|StatsSection|ChatBot|WhyChooseUs|WhatWeDo|Hero)\.jsx$/.test(f));
check(left.length === 0, `网站上的名字都写 EasyGoSpa（还剩：${left.join(', ') || '无'}）`);
