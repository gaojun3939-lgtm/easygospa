// EasyGoSpa 的标：老板 2026-09-11 定稿的五瓣线描莲花（「这个是我们的 logo，以后全部用这个」）。
// 跟 App（src/assets/brand/lotus-mark.png）、easygospa.ph（public/images/lotus-mark.png）用的是同一个文件：public/brand/lotus-mark.png。
// 图是透明底黑色，这里当遮罩用，颜色随 tone 换（brand = 橄榄绿，light = 白）。size 是宽，高按原图 512×242 算。
// 浏览器标签小图标（src/app/icon.png、apple-icon.png、favicon.ico）11-12 起用 App 图标原图（深绿底金莲花），脚本 scripts/generate-site-icon-assets.mjs。
// 11-11 前这里是一个三瓣实心莲花加托盘的旧标（定稿前就有的），老板「我们不是有我们的专用图表 你还记得么」→ 全部换成定稿的。
export default function BrandMark({ size = 32, tone = 'brand', className = '' }) {
  const color = tone === 'light' ? '#ffffff' : '#64734F';
  const mask = 'url(/brand/lotus-mark.png) center / contain no-repeat';
  return (
    <span
      aria-hidden="true"
      className={`inline-block flex-none ${className}`}
      style={{ width: size, height: Math.round((size * 242) / 512), backgroundColor: color, WebkitMask: mask, mask }}
    />
  );
}
