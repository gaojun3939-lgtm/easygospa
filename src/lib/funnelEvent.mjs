// 漏斗底稿的校验与净化 —— 2026-08-04
// 单独放纯函数文件,好让验收脚本 import 真函数灌样例(.jsx/route.js 都起不来)。
//
// 这层的职责就一句话:**收进库的东西必须干净**。
// 这是个公开接口,谁都能往里 POST,所以:
//   - 事件名不在白名单 → 丢掉(别把这张表变成垃圾桶)
//   - 任何能认出人的字段(手机号/姓名/邮箱)→ 一律不接,接了也不存
//   - 长度全部截断,别让人塞一兆字符进来

export const FUNNEL_EVENT_NAMES = [
  'PageView',          // 打开官网
  'ViewContent',       // 点开某个技师
  'AddToCart',         // 选好项目按预订
  'Lead',              // 填完手机号
  'InitiateCheckout',  // 到最后确认页
  'Schedule'           // 按下提交
];

// 这张表就认这几个键,别的一概不存
const 允许的键 = new Set([
  'event_name', 'eventName', 'session_id', 'sessionId', 'value', 'currency',
  'content_name', 'contentName', 'content_ids', 'contentIds', 'page_path', 'pagePath'
]);

// 允许列表之外的键,一旦长得像个人信息就整条丢掉不客气。
// ⚠ 必须先过允许列表再来这一关:`name$` 会把 event_name / content_name 自己误伤,
//   那样一条底稿都收不进来(2026-08-04 验收时踩到,六枪全被自己拦下)。
const 敏感键 = /phone|mobile|tel|email|mail|name|address|passwo?rd|token|otp|card|ip$|lat|lng|birth/i;

function 截断(v, n) {
  return String(v ?? '').trim().slice(0, n);
}

export function normalizeFunnelEvent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;

  const eventName = 截断(input.event_name || input.eventName, 40);
  if (!FUNNEL_EVENT_NAMES.includes(eventName)) return null;   // 白名单外一律不收

  // 允许列表之外还长得像个人信息 = 有人塞脏东西(或者我们自己写错了),整条丢掉。
  // 宁可少一条底稿,也不能把客人手机号存进一张"只写不读"的表里——那种表出了事最难发现。
  for (const key of Object.keys(input)) {
    if (允许的键.has(key)) continue;
    if (敏感键.test(key)) return null;
  }

  const value = Number(input.value);
  const ids = Array.isArray(input.content_ids || input.contentIds)
    ? (input.content_ids || input.contentIds).slice(0, 10).map(v => 截断(v, 80)).filter(Boolean)
    : [];

  // 只留路径,不留查询串:?utm_source=... 之类不该进这张表,
  // 归因有 adAttribution 那条正路管(存在客人自己浏览器里)。
  const rawPath = 截断(input.page_path || input.pagePath, 300);
  const page_path = rawPath.split('?')[0].split('#')[0];

  return {
    event_name: eventName,
    session_id: 截断(input.session_id || input.sessionId, 64),
    value: Number.isFinite(value) && value > 0 ? Math.min(value, 1000000) : 0,
    currency: 截断(input.currency, 8) || 'PHP',
    content_name: 截断(input.content_name || input.contentName, 120),
    content_ids: ids,
    page_path
  };
}
