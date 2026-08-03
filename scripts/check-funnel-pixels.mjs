// 下单漏斗埋点验收(2026-08-04)。
// 背景:017cc0f 那次照电商三件套埋,漏了"填完手机号"这一步——最容易掉人的那道坎
// 反倒是黑的。这次补 Lead,顺带给四个老事件都带上金额(原来全是光秃秃的,
// Meta 只知道"有人点了",不知道值多少钱,学不出高价单长什么样)。
// 盯死四件事:
//   1) 五个漏斗节点一个都不能少(少一个就又出现黑段)
//   2) 该带钱的事件必须带 value+currency(不然没法切"最大化转化价值")
//   3) ViewContent 不能带钱(进详情时故意不预选服务,报 0 会把均价学歪)
//   4) Schedule 必须带 eventID=单号(服务端也报这单时 Meta 才能去重)
// 跑法:node scripts/check-funnel-pixels.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { trackMetaEvent, identifyMetaUser, buildAdvancedMatch, normalizeMatchPhone } from '../src/lib/metaPixelTrack.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let fail = 0;
const ok = (cond, msg) => { console.log(cond ? '✅' : '❌', msg); if (!cond) fail++; };

// ================= ① 真函数灌样例:参数和 eventID 到底传没传出去 =================
console.log('=== 🔴 trackMetaEvent 真函数行为 ===');
const shots = [];
globalThis.window = { fbq: (...args) => shots.push(args) };

trackMetaEvent('AddToCart', { value: 800, currency: 'PHP' });
ok(shots.length === 1 && shots[0][0] === 'track' && shots[0][1] === 'AddToCart',
  `普通事件打出去了:${JSON.stringify(shots[0])}`);
ok(shots[0][2]?.value === 800 && shots[0][2]?.currency === 'PHP',
  '金额和币种原样送达 Meta');
ok(shots[0].length === 3, '没带 eventID 时不多塞第四个参数(旧行为不变)');

shots.length = 0;
trackMetaEvent('Schedule', { value: 1200, currency: 'PHP' }, { eventID: 'mbr-brand-a-abc123' });
ok(shots[0]?.length === 4 && shots[0][3]?.eventID === 'mbr-brand-a-abc123',
  `带单号时走 fbq 第四参数:eventID=${shots[0]?.[3]?.eventID}`);

shots.length = 0;
globalThis.window = {};                 // 像素没加载(没配 PIXEL_ID 的情况)
let threw = false;
try { trackMetaEvent('Lead', { value: 1 }); } catch { threw = true; }
ok(!threw && shots.length === 0, '像素没加载时静默跳过,绝不炸主流程');
delete globalThis.window;

// ================= ①.5 进阶匹配:Meta 认不认得出这是同一个人 =================
console.log('\n=== 🔴 进阶匹配(浏览器 Schedule 和服务端 Purchase 要认成同一个人)===');
ok(normalizeMatchPhone('+63 917-539 8328') === '639175398328',
  `E164 带符号 → ${normalizeMatchPhone('+63 917-539 8328')}(去 + 去空格去横杠)`);
ok(normalizeMatchPhone('09175398328') === '639175398328',
  `菲律宾本地写法 09xx → ${normalizeMatchPhone('09175398328')}(补国家码,不然 Meta 认不出)`);
ok(normalizeMatchPhone('123') === '', '太短的号直接丢掉,不拿垃圾去污染匹配质量分');

const m1 = buildAdvancedMatch({ phone: '+639175398328', email: '  Gab@Example.COM ', name: 'Gab  Santos', city: 'Quezon City' });
ok(m1.ph === '639175398328', `手机 → ${m1.ph}`);
ok(m1.em === 'gab@example.com', `邮箱 → ${m1.em}(转小写去空格)`);
ok(m1.fn === 'gab' && m1.ln === 'santos', `姓名拆开 → fn=${m1.fn} ln=${m1.ln}`);
ok(m1.ct === 'quezoncity', `城市 → ${m1.ct}(Meta 要求连空格都去掉)`);
ok(m1.country === 'ph', '国家码补上 ph');

const m2 = buildAdvancedMatch({ phone: '+639175398328' });
ok(!('em' in m2) && !('fn' in m2), '没填的字段一个都不传(传空串会拉低匹配质量分)');

// 服务端那边认人也是这个号——两边必须归一化成同一串,否则白搭
ok(normalizeMatchPhone('+639175398328') === '639175398328'
  && normalizeMatchPhone('639175398328') === '639175398328',
  '同一个号不管怎么写,归一化结果都一样 → 两条路认得出是同一个人');

const initCalls = [];
globalThis.window = { fbq: (...a) => initCalls.push(a) };
identifyMetaUser({ phone: '+639175398328', name: 'Gab' }, 'PIXEL_TEST');
ok(initCalls.length === 1 && initCalls[0][0] === 'init' && initCalls[0][1] === 'PIXEL_TEST',
  '走的是 fbq(init, 像素ID, 认人字段)——Meta 官方的更新姿势');
ok(initCalls[0][2]?.ph === '639175398328', `送出去的是规范化后的号:${initCalls[0][2]?.ph}`);

initCalls.length = 0;
identifyMetaUser({ name: '只有名字没有联系方式' }, 'PIXEL_TEST');
ok(initCalls.length === 0, '连手机号邮箱都没有时不白调 fbq');

initCalls.length = 0;
identifyMetaUser({ phone: '+639175398328' }, '');
ok(initCalls.length === 0, '没配像素 ID 时静默跳过');
delete globalThis.window;

// (认人和 Lead 的先后顺序,放到 ③ 里按函数体比位置,不受注释长度影响)

// ================= ② 源码结构:五个节点一个都不能少 =================
console.log('\n=== 🔴 下单五步,每一步都得有眼睛 ===');

// ⚠ 必须先把注释剥掉再查(2026-08-04 负向测试抓到):
//   原来是拿源码原文做字符串匹配,谁把某一枪 `// 注释掉`,这里照样报绿——
//   等于检查器瞎了。实测过:注释掉 Lead 那行,28 条全绿,退出码 0。
//   只剥"整行注释"(去掉缩进后以 // 开头的行),不动行尾注释,免得误伤 https:// 这种。
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map(line => (/^\s*\/\//.test(line) ? '' : line))
    .join('\n');
}
const src = stripComments(fs.readFileSync(path.join(root, 'src/components/BookingModal.jsx'), 'utf8'));

const NODES = [
  { 步骤: '点开技师详情', 事件: 'ViewContent', 要带钱: false },
  { 步骤: '选好服务项目', 事件: 'AddToCart', 要带钱: true },
  { 步骤: '填完手机号', 事件: 'Lead', 要带钱: true },
  { 步骤: '到最后确认页', 事件: 'InitiateCheckout', 要带钱: true },
  { 步骤: '提交成功', 事件: 'Schedule', 要带钱: true }
];

for (const n of NODES) {
  // 抓 trackMetaEvent('X', {...}) 整段(含跨行)
  const m = new RegExp(`trackMetaEvent\\(\\s*'${n.事件}'([\\s\\S]{0,400}?)\\n\\s*\\}?\\);`).exec(src)
    || new RegExp(`trackMetaEvent\\(\\s*'${n.事件}'([^;]{0,400});`).exec(src);
  if (!m) { ok(false, `${n.步骤} → ${n.事件} 没埋!这一步又是黑的`); continue; }
  const body = m[1];
  ok(true, `${n.步骤} → ${n.事件} 埋了`);
  const hasMoney = /value:/.test(body) && /currency:\s*'PHP'/.test(body);
  if (n.要带钱) ok(hasMoney, `    ${n.事件} 带了金额+币种`);
  else ok(!/value:/.test(body), `    ${n.事件} 按设计不带金额(此时还没选服务,报 0 会把均价学歪)`);
}

const scheduleShot = /trackMetaEvent\(\s*'Schedule'[\s\S]{0,400}?eventID/.test(src);
ok(scheduleShot, 'Schedule 带了 eventID(=订单号),服务端重复报同一单时 Meta 能去重');

// ================= ③ 别再漏:管这一步的函数里,必须有对应那一枪 =================
// ⚠ 别改回"数字符"的写法:第一版是 setStep('x') 之后取 N 个字符里找事件,
//   注释一长就撑爆窗口,把埋好的 details 步误判成没埋(2026-08-04 踩过,把窗口从
//   300 调到 1000 只是把雷往后挪)。现在按**函数体**切,注释爱多长多长。
console.log('\n=== 🔴 有没有新的黑段(管这一步的函数里没打枪)===');

// 取组件内某个 handler 的函数体:从 `const 名字 =` 起,到下一个同级 `const `/`function ` 止。
// 这个文件里组件内的函数一律是两格缩进的 const,所以这条边界是稳的。
function funcBody(source, name) {
  const start = source.search(new RegExp(`\\n  const ${name}\\s*=`));
  if (start < 0) return '';
  const rest = source.slice(start + 3);
  const end = rest.search(/\n  (const|function) /);
  return end < 0 ? rest : rest.slice(0, end);
}

const HANDLERS = [
  { fn: 'enterTherapistDetail', step: 'detail', evt: 'ViewContent', 管的事: '点开技师详情' },
  { fn: 'handleBookSelection', step: 'email', evt: 'AddToCart', 管的事: '选好服务项目' },
  { fn: 'handleEmailContinue', step: 'details', evt: 'Lead', 管的事: '填完手机号' },
  { fn: 'handleDetailsContinue', step: 'confirm', evt: 'InitiateCheckout', 管的事: '资料填完进确认页' }
];

for (const h of HANDLERS) {
  const body = funcBody(src, h.fn);
  if (!body) { ok(false, `${h.fn}() 找不到了——函数改名了?这个检查得跟着改`); continue; }
  ok(body.includes(`setStep('${h.step}')`), `${h.fn}() 确实是管「${h.管的事}」的(它跳到 ${h.step} 步)`);
  ok(body.includes(`trackMetaEvent('${h.evt}'`), `    里面打了 ${h.evt}`);
}

// 认人必须排在 Lead 前面(同一个函数体内比位置,不受注释长度影响)
const emailBody = funcBody(src, 'handleEmailContinue');
ok(emailBody.indexOf('identifyMetaUser') >= 0
  && emailBody.indexOf('identifyMetaUser') < emailBody.indexOf("trackMetaEvent('Lead'"),
  '认人排在 Lead 之前(顺序反了这枪只剩 cookie)');

// ================= ④ 自检:这套检查真抓得到漏埋吗 =================
// 不做这一步,上面全绿也可能是因为检查本身失灵了(正则写错=永远绿灯)。
// 拿一份故意漏埋的假源码喂进去,它必须报红。
console.log('\n=== 🔴 检查器自检(拿故意漏埋的假代码试它)===');
const 假源码 = `
  const handleEmailContinue = event => {
    setStep('details');
  };

  const validateDetails = () => {
    return '';
  };
`;
const 假函数体 = funcBody(假源码, 'handleEmailContinue');
ok(假函数体.includes("setStep('details')"), '    能切出函数体');
ok(!假函数体.includes("trackMetaEvent('Lead'"), '    漏埋的假代码被抓出来了(说明这套检查不是摆设)');
ok(!假函数体.includes('validateDetails'), '    函数体边界切得准,没串到下一个函数里去');

// 被注释掉的埋点绝不能算数(2026-08-04 负向测试抓到的真洞:注释掉 Lead 那行,全场照样绿)
const 注释掉的源码 = `
  const handleEmailContinue = event => {
    setStep('details');
    // trackMetaEvent('Lead', { value: 800, currency: 'PHP' });
  };

  const validateDetails = () => { return ''; };
`;
ok(funcBody(注释掉的源码, 'handleEmailContinue').includes("trackMetaEvent('Lead'"),
  '    (对照)不剥注释的话,注释掉的埋点会被误判成埋了');
ok(!funcBody(stripComments(注释掉的源码), 'handleEmailContinue').includes("trackMetaEvent('Lead'"),
  '    剥掉注释后,被注释掉的埋点判为没埋 ✔ 这个洞补上了');

console.log(`\n${fail ? `❌ ${fail} 条没过` : '✅ 全过'}`);
process.exitCode = fail ? 1 : 0;
