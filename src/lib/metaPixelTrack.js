// Meta 像素打枪的那一下,单独拎出来放纯 JS 里(2026-08-04)。
// 原来它长在 MetaPixel.jsx 组件文件里,Node 起不来 .jsx,埋点就只能靠肉眼看代码
// ——老板的规矩是"说好了必须有实测证据",所以搬到这儿,让 scripts 能 import 真函数灌样例。
// 组件那边照旧 re-export,所有调用方一个字不用改。

const PIXEL_ID = String(process.env.NEXT_PUBLIC_META_PIXEL_ID || '').trim();

// options 走 fbq 的第四个参数,目前只用 eventID:同一单浏览器和服务端都报时,
// Meta 靠它去重,不会算成两次。
export function trackMetaEvent(eventName, params, options) {
  try {
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
    if (options && options.eventID) window.fbq('track', eventName, params || {}, options);
    else window.fbq('track', eventName, params || {});
  } catch { /* 像素是增强,绝不影响主流程 */ }
}

// ================= 进阶匹配(Advanced Matching)——老板 2026-08-04 拍板开 =================
// 解决的是一条断掉的链子:
//   浏览器这边报 Schedule(下单),认人只靠 cookie;
//   服务端那边报 Purchase(钱到手),认人靠手机号哈希(见 easygospa-ai/lib/metaAds.js)。
//   两边对不上同一个人 → Meta 学到的是"一个人下了单"+"另一个人付了钱",归因链是断的。
// 把客人留下的手机号(等)喂给像素,Meta 两边都能按同一个人认领。
//
// ⚠ 隐私:这里传的是明文,但 Meta 的 fbevents.js 在**发出去之前**会做 SHA-256 哈希,
//   网络上跑的是哈希值,不是手机号本身。服务端那条路早就在这么做了,两边一致。
//   除此之外一个字段都不多给——只送认人必需的,不送地址门牌、不送订单内容。

// Meta 要求的规范化(不照做它认不出人):手机号只留数字、必须含国家码、不带 + 和符号。
export function normalizeMatchPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 7) return '';
  // 菲律宾本地写法 09xxxxxxxxx → 639xxxxxxxxx(Meta 认的是含国家码的形式)
  if (digits.startsWith('0')) return `63${digits.slice(1)}`;
  return digits;
}

// 姓名/城市:小写、去两头空格、去标点。Meta 文档要求,大小写不一致会匹配不上。
function normalizeMatchText(value) {
  return String(value || '').trim().toLowerCase().replace(/[.,'"`]/g, '').replace(/\s+/g, ' ');
}

function normalizeMatchEmail(value) {
  const v = String(value || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : '';
}

// 客人资料 → Meta 认人字段。只挑有值的送,空字段一律不传(传空串会拉低匹配质量分)。
export function buildAdvancedMatch(user = {}) {
  const out = {};
  const ph = normalizeMatchPhone(user.phone);
  if (ph) out.ph = ph;
  const em = normalizeMatchEmail(user.email);
  if (em) out.em = em;
  // 客人只填一个 name,按空格拆:第一段当名,剩下当姓。拆不出姓就只给名。
  const name = normalizeMatchText(user.name);
  if (name) {
    const parts = name.split(' ').filter(Boolean);
    if (parts[0]) out.fn = parts[0];
    if (parts.length > 1) out.ln = parts.slice(1).join(' ');
  }
  const ct = normalizeMatchText(user.city);
  if (ct) out.ct = ct.replace(/\s/g, '');   // 城市要求连空格也去掉
  if (ph || em) out.country = 'ph';         // 有联系方式才补国家,单给国家没意义
  return out;
}

// 把客人认给 Meta。重复 init 同一个像素 ID 是 Meta 官方推荐的更新姿势,不会重复初始化。
export function identifyMetaUser(user, pixelId = PIXEL_ID) {
  try {
    if (typeof window === 'undefined' || typeof window.fbq !== 'function' || !pixelId) return null;
    const data = buildAdvancedMatch(user);
    if (!data.ph && !data.em) return null;   // 连手机号邮箱都没有,认不了人,别白调
    window.fbq('init', pixelId, data);
    return data;
  } catch {
    return null;   // 认人是增强,绝不影响主流程
  }
}
