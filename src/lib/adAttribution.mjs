// ================= 广告归因(2026-07-28 老板拍板:先修这条链接通道)=================
// 病根:官网从来不记"这个人从哪来",广告花了 ₱1,265 出 1 单,我们连那 1 单是不是
// 广告带来的都说不清。这里补上第一环——进站抓来源标记,存住,下单时随订单送出。
//
// 抓什么:
//   fbclid       Meta 点击 ID(最准,只有真点了 Meta 广告才有)
//   utm_*        我们自己在广告链接上带的标记(utm_source=meta&utm_medium=paid)
//   referrer     从哪个网站过来的(自然流量也能分辨)
// 存哪:localStorage(客人今天看、明天下单也算得上,30 天有效)
// 铁律:只存来源标记,绝不碰任何个人信息。

const STORAGE_KEY = 'egs-ad-attribution-v1';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 天:Meta 自己的归因窗口也是这个量级

function safeStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null; // 隐私模式/被禁用:静默降级,绝不因为埋点崩掉下单
  }
}

function clean(value, max = 300) {
  return String(value || '').trim().slice(0, max);
}

// 进站时调一次:URL 上有来源标记就记下来(先到先得——第一次带客人来的那条广告算功劳)
export function captureAdAttribution({ search = '', referrer = '', now = Date.now() } = {}) {
  const storage = safeStorage();
  if (!storage) return null;
  let params;
  try {
    params = new URLSearchParams(search || (typeof window !== 'undefined' ? window.location.search : ''));
  } catch {
    return null;
  }
  const fbclid = clean(params.get('fbclid'), 500);
  const utmSource = clean(params.get('utm_source'), 80);
  const utmMedium = clean(params.get('utm_medium'), 80);
  const utmCampaign = clean(params.get('utm_campaign'), 120);
  const utmContent = clean(params.get('utm_content'), 120);
  const hasAdMark = Boolean(fbclid || utmSource);

  const existing = readAdAttribution({ now });
  // 已经有记录、这次又没带新标记 → 保留原记录(别把老来源冲掉)
  if (!hasAdMark) {
    if (existing) return existing;
    // 首次进站且没有广告标记:记一条自然流量,来源写 referrer,方便区分"广告 vs 自己找来的"
    const organic = {
      channel: 'organic',
      referrer: clean(referrer || (typeof document !== 'undefined' ? document.referrer : ''), 300),
      landedAt: new Date(now).toISOString()
    };
    try { storage.setItem(STORAGE_KEY, JSON.stringify(organic)); } catch { /* 存不下就算了 */ }
    return organic;
  }

  const record = {
    channel: 'ad',
    ...(fbclid ? { fbclid } : {}),
    ...(utmSource ? { utmSource } : {}),
    ...(utmMedium ? { utmMedium } : {}),
    ...(utmCampaign ? { utmCampaign } : {}),
    ...(utmContent ? { utmContent } : {}),
    referrer: clean(referrer || (typeof document !== 'undefined' ? document.referrer : ''), 300),
    landedAt: new Date(now).toISOString()
  };
  try { storage.setItem(STORAGE_KEY, JSON.stringify(record)); } catch { /* 存不下就算了 */ }
  return record;
}

// 读回来源(过期的当没有)
export function readAdAttribution({ now = Date.now() } = {}) {
  const storage = safeStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const landedAt = Date.parse(parsed.landedAt || '');
    if (Number.isFinite(landedAt) && now - landedAt > MAX_AGE_MS) {
      storage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// 下单时塞进 metadata 的那一小块(没有来源就返回空对象,不污染 payload)
export function adAttributionMetadata({ now = Date.now() } = {}) {
  const record = readAdAttribution({ now });
  if (!record) return {};
  return { adAttribution: record };
}
