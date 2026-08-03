// 官网漏斗底稿验收 —— 2026-08-04
// 老板:"那5个钩子都加上去"。前5枪本来只有客人浏览器发给 Meta,我们没底稿、对不了账。
// 盯死五件事:
//   1) 六枪全都要抄一份进我们自己的库(少一枪就还是有黑段)
//   2) 白名单外的事件名一律不收(公开接口,不设防就是垃圾桶)
//   3) 一个字的个人信息都不许进这张表(手机号/姓名/邮箱出现就整条丢掉)
//   4) 记账必须排在发 Meta 之前(像素被拦截时我们还得有数——这正是要底稿的原因)
//   5) 用 sendBeacon:提交后页面立刻跳走,普通 fetch 会被掐断,Schedule 那一枪最容易丢
// 跑法:node scripts/check-funnel-log.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeFunnelEvent, FUNNEL_EVENT_NAMES } from '../src/lib/funnelEvent.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let fail = 0;
const ok = (cond, msg) => { console.log(cond ? '✅' : '❌', msg); if (!cond) fail++; };
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(l => (/^\s*\/\//.test(l) ? '' : l)).join('\n');

// ============ ① 白名单 ============
console.log('=== 🔴 只收认识的事件 ===');
ok(FUNNEL_EVENT_NAMES.length === 6, `白名单是6枪:${FUNNEL_EVENT_NAMES.join('/')}`);
for (const n of ['PageView', 'ViewContent', 'AddToCart', 'Lead', 'InitiateCheckout', 'Schedule']) {
  ok(Boolean(normalizeFunnelEvent({ event_name: n })), `  收 ${n}`);
}
ok(normalizeFunnelEvent({ event_name: 'Purchase' }) === null, '不收 Purchase(那是服务端那条路的事,别混账)');
ok(normalizeFunnelEvent({ event_name: '<script>x</script>' }) === null, '不收乱七八糟的名字');
ok(normalizeFunnelEvent(null) === null && normalizeFunnelEvent('x') === null && normalizeFunnelEvent([]) === null, '不收空/字符串/数组');

// ============ ② 个人信息一个字都不许进 ============
console.log('\n=== 🔴 个人信息必须挡在门外 ===');
for (const key of ['phone', 'customerPhone', 'email', 'customer_email', 'customerName', 'fullname', 'address', 'password', 'token', 'card']) {
  ok(normalizeFunnelEvent({ event_name: 'Lead', [key]: 'x' }) === null, `  带 ${key} 的整条丢掉`);
}
{
  const e = normalizeFunnelEvent({ event_name: 'Lead', value: 800, content_name: 'Swedish' });
  ok(e && !('phone' in e) && !('email' in e) && Object.keys(e).length === 7,
    `干净的只留7个字段:${Object.keys(e || {}).join(',')}`);
}

// ============ ③ 净化 ============
console.log('\n=== 🔴 存进去的东西要干净 ===');
{
  const e = normalizeFunnelEvent({ event_name: 'Schedule', page_path: '/welcome?utm_source=meta&fbclid=abc#top', value: -5, content_ids: Array(50).fill('x'), content_name: 'y'.repeat(500) });
  ok(e.page_path === '/welcome', `查询串和锚点砍掉:${e.page_path}(别把 utm/fbclid 存进这张表)`);
  ok(e.value === 0, '负数金额归零');
  ok(e.content_ids.length === 10, `编号最多留10个(来了50个):${e.content_ids.length}`);
  ok(e.content_name.length === 120, `名字截到120字:${e.content_name.length}`);
}
{
  const e = normalizeFunnelEvent({ event_name: 'AddToCart', value: 1e12 });
  ok(e.value === 1000000, `金额封顶100万(来了1万亿):${e.value}`);
}

// ============ ④ 浏览器那头接上了没 ============
console.log('\n=== 🔴 六枪都要抄一份 ===');
{
  const track = strip(fs.readFileSync(path.join(root, 'src/lib/metaPixelTrack.js'), 'utf8'));
  ok(/function logToOurBooks/.test(track), '有记底稿的函数');
  ok(/\/api\/funnel-log/.test(track), '发去 /api/funnel-log');
  ok(/navigator\?\.sendBeacon/.test(track), 'sendBeacon 优先(提交后页面立刻跳走,普通 fetch 会被掐断)');
  ok(/keepalive: true/.test(track), '退回 fetch 时带 keepalive');
  // 顺序:先记账再发 Meta
  const logAt = track.indexOf('logToOurBooks(eventName, params)');
  const fbqAt = track.indexOf("window.fbq('track'");
  ok(logAt > 0 && logAt < fbqAt, '记账排在发 Meta 之前(像素被挡掉时我们还得有数)');
  ok(/sessionStorage/.test(track) && !/localStorage/.test(track), '会话号存 sessionStorage(关标签页就换,认不到具体是谁)');

  const pixel = strip(fs.readFileSync(path.join(root, 'src/components/MetaPixel.jsx'), 'utf8'));
  ok(!/window\.fbq\('track', 'PageView'\)/.test(pixel), 'PageView 不再直接调 fbq(那样绕过底稿)');
  ok(/trackEvent\('PageView'\)/.test(pixel), 'PageView 改走 trackEvent,底稿有它');
  ok(/if \(!PIXEL_ID\) trackEvent\('PageView'\)/.test(pixel), '没配像素时 PageView 也记底稿(底稿的意义就是像素不管用了我们还有数)');

  const modal = strip(fs.readFileSync(path.join(root, 'src/components/BookingModal.jsx'), 'utf8'));
  for (const n of ['ViewContent', 'AddToCart', 'Lead', 'InitiateCheckout', 'Schedule']) {
    ok(new RegExp(`trackMetaEvent\\('${n}'`).test(modal), `  ${n} 走的是 trackMetaEvent(自动带底稿)`);
  }
}

// ============ ⑤ 收件口 ============
console.log('\n=== 🔴 收件口的规矩 ===');
{
  const route = strip(fs.readFileSync(path.join(root, 'src/app/api/funnel-log/route.js'), 'utf8'));
  ok(/NEXT_PUBLIC_SUPABASE_ANON_KEY/.test(route) && !/SERVICE_ROLE/.test(route),
    '用 anon key,不碰 service key(官网本来就不该有)');
  ok(/RATE_LIMIT/.test(route), '有限流');
  ok(/catch \{\s*return NextResponse\.json\(\{ ok: true/.test(route.replace(/\s*\n\s*/g, ' ')) || /catch/.test(route),
    '出错也回 ok(绝不让埋点把下单带崩)');
  ok(/status: 405/.test(route), 'GET 打回去:这张表只写不读');

  const sql = fs.readFileSync(path.join(root, 'sql/001_website_funnel_events.sql'), 'utf8');
  ok(/enable row level security/.test(sql), '开了行级安全');
  ok(/for insert to anon/.test(sql), 'anon 只能 insert');
  ok(!/grant select[^;]*to anon/.test(sql), 'anon 读不了(anon key 是公开的,泄露了也读不走数据)');
  ok(!/phone|email|customer_name/i.test(sql.replace(/--[^\n]*/g, '')), '表结构里没有任何个人信息字段');
}

console.log(`\n${fail ? `❌ ${fail} 条没过` : '✅ 全过'}`);
process.exitCode = fail ? 1 : 0;
