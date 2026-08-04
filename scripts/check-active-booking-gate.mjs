// 防重复下单的"纸条"验收 —— 2026-08-04
//
// 背景(真事故):老板今早在官网下的测试单 EG-0804-001,下午从数据库删了。
// 之后他在同一个浏览器里彻底卡死:下不了单、点"查看我的订单"是 Booking not found、
// 点"取消这单"说找不到。原因是网站把服务器的两句话听混了——
//   "这单没了"(404)  和  "我答不上来"(502/断网)
// 都被 `if (!response.ok) return null` 抹成同一个 null,于是一律继续拦。
//
// 真客人也会踩:只要他那张单在库里没了,他就永远下不了第二单,而且不会来告诉你。
//
// 这个脚本盯五种情况 + 24 小时过期 + 一条安全底线。
// 跑法:node scripts/check-active-booking-gate.mjs

import {
  ACTIVE_BOOKING_MAX_AGE_MS,
  ACTIVE_BOOKING_STORAGE_KEY,
  clearActiveBooking,
  isActiveBookingExpired,
  readActiveBooking,
  resolveActiveBookingGate,
  writeActiveBooking
} from '../src/lib/activeBooking.mjs';

let fail = 0;
const ok = (cond, msg) => { console.log(cond ? '✅' : '❌', msg); if (!cond) fail++; };

// 假的 localStorage
function fakeStorage(initial = null) {
  const box = { value: initial };
  return {
    getItem: () => box.value,
    setItem: (_k, v) => { box.value = v; },
    removeItem: () => { box.value = null; },
    peek: () => box.value
  };
}

const REF = 'mbr-brand-a-278ff9a6c790597a';                       // 老板那张被删的单
const TOKEN = `egc1_${'A'.repeat(43)}`;
const NOW = Date.parse('2026-08-04T12:00:00.000Z');

function freshStorage({ ageMs = 0 } = {}) {
  const s = fakeStorage();
  writeActiveBooking(REF, {
    cancelToken: TOKEN,
    storage: s,
    now: () => new Date(NOW - ageMs).toISOString()
  });
  return s;
}

// 状态接口的各种回答。跟 BookingModal 里那个 loadStatus 的返回形状对齐:
//   404 → { ok:false, missing:true }     其他错 → null      正常 → 后端 JSON
const 答复 = {
  单没了: () => ({ ok: false, missing: true }),
  服务器抽风: () => null,
  断网: () => { throw new Error('Failed to fetch'); },
  还在等技师: () => ({ ok: true, status: 'waiting_acceptance' }),
  已被接单: () => ({ ok: true, status: 'confirmed' }),
  已完成: () => ({ ok: true, status: 'completed' })
};

async function gate(答, { ageMs = 0 } = {}) {
  const storage = freshStorage({ ageMs });
  const marker = await resolveActiveBookingGate({
    storage,
    loadStatus: async () => 答(),
    now: NOW
  });
  return { 拦不拦: Boolean(marker), 纸条还在: storage.peek() !== null };
}

console.log('=== 🔴 五种情况(老板点头的那五条)===\n');

{
  const r = await gate(答复.单没了);
  ok(!r.拦不拦 && !r.纸条还在, `单没了 → 放行,纸条撕掉  ← 就是今天卡住老板的那种`);
}
{
  const r = await gate(答复.服务器抽风);
  ok(r.拦不拦 && r.纸条还在, '服务器抽风(502)→ 继续拦,纸条留着');
}
{
  const r = await gate(答复.断网);
  ok(r.拦不拦 && r.纸条还在, '断网 → 继续拦,纸条留着');
}
{
  const r = await gate(答复.还在等技师);
  ok(r.拦不拦 && r.纸条还在, '单还在等技师 → 继续拦(本来就该拦)');
}
{
  const r = await gate(答复.已完成);
  ok(!r.拦不拦 && !r.纸条还在, '单已经做完 → 放行,纸条撕掉');
}
{
  const r = await gate(答复.已被接单);
  ok(!r.拦不拦 && !r.纸条还在, '单已被技师接了 → 放行(可以下下一单了)');
}

console.log('\n=== 🔴 24 小时自动作废 ===\n');
{
  const r = await gate(答复.还在等技师, { ageMs: ACTIVE_BOOKING_MAX_AGE_MS + 1000 });
  ok(!r.拦不拦 && !r.纸条还在, '纸条超过 24 小时 → 直接作废,连问都不问服务器');
}
{
  const r = await gate(答复.还在等技师, { ageMs: ACTIVE_BOOKING_MAX_AGE_MS - 60000 });
  ok(r.拦不拦 && r.纸条还在, '差一分钟到 24 小时 → 还拦着(边界没提前失效)');
}
{
  ok(isActiveBookingExpired({ createdAt: '' }, { now: NOW }), '纸条上没写时间 → 当作过期(脏数据不许赖着)');
  ok(isActiveBookingExpired({ createdAt: '乱写' }, { now: NOW }), '时间写的是乱码 → 当作过期');
  ok(!isActiveBookingExpired({ createdAt: new Date(NOW - 1000).toISOString() }, { now: NOW }), '一秒钟前写的 → 没过期');
}

console.log('\n=== 🔴 服务器抽风时绝不能放行(防重复下单的底线)===\n');
{
  // 把所有"答不上来"的形状都试一遍,一个都不许漏成放行
  const 答不上来 = [
    ['返回 null', () => null],
    ['返回 undefined', () => undefined],
    ['ok=false 但没说 missing', () => ({ ok: false })],
    ['ok=false + reason=upstream_error', () => ({ ok: false, reason: 'upstream_error' })],
    ['ok=true 但没有 status', () => ({ ok: true })],
    ['status 是空字符串', () => ({ ok: true, status: '   ' })],
    ['missing 是字符串 "true" 不是布尔', () => ({ ok: false, missing: 'true' })]
  ];
  for (const [名字, 答] of 答不上来) {
    const r = await gate(答);
    ok(r.拦不拦 && r.纸条还在, `${名字} → 继续拦`);
  }
}

console.log('\n=== 🔴 纸条本身的读写 ===\n');
{
  const s = fakeStorage();
  ok(writeActiveBooking(REF, { cancelToken: TOKEN, storage: s }) !== null, '正常写得进去');
  ok(readActiveBooking({ storage: s })?.reference === REF, '读得回来');
  ok(writeActiveBooking('随便写的号', { cancelToken: TOKEN, storage: fakeStorage() }) === null, '单号格式不对 → 拒绝写');
  ok(writeActiveBooking(REF, { cancelToken: 'bad', storage: fakeStorage() }) === null, '凭证格式不对 → 拒绝写');
}
{
  const s = freshStorage();
  ok(clearActiveBooking({ storage: s, reference: '别的单号' }) === false, '拿错单号来撕 → 撕不动(不能误伤别人的纸条)');
  ok(s.peek() !== null, '纸条还在');
  ok(clearActiveBooking({ storage: s, reference: REF }) === true, '拿对单号 → 撕掉');
  ok(s.peek() === null, '纸条没了');
}
{
  const s = fakeStorage('{坏掉的json');
  ok(readActiveBooking({ storage: s }) === null, '存的是坏 JSON → 读出 null,不炸');
  ok(s.peek() === null, '顺手把坏纸条清了');
}

console.log(`\n存的键名:${ACTIVE_BOOKING_STORAGE_KEY}`);
console.log(`${fail ? `\n❌ ${fail} 条没过` : '\n✅ 全过'}`);
process.exitCode = fail ? 1 : 0;
