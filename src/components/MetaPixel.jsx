'use client';

import { useEffect } from 'react';
import { captureAdAttribution } from '@/lib/adAttribution.mjs';

// Meta Pixel(批A 投流引擎的旁路眼睛):记录官网访客与下单动作,回传 Meta 让广告越投越准,
// 并为将来"追官网来过没下单的人"攒受众。
// ⚠ 2026-07-28 加第二件职责:进站抓自家归因标记(fbclid / utm_*)。
//   Pixel 只让 Meta 那边看得见;我们自己系统能不能算清"这单从哪来",全靠 captureAdAttribution。
//   老板原话:花 ₱1,265 出 1 单,连那单是不是广告带来的都说不清——链子从这里补。
//   两件事互不依赖:没配像素 ID 时归因照抓。
const PIXEL_ID = String(process.env.NEXT_PUBLIC_META_PIXEL_ID || '').trim();

export function trackMetaEvent(eventName, params) {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') window.fbq('track', eventName, params || {});
  } catch { /* 像素是增强,绝不影响主流程 */ }
}

export default function MetaPixel() {
  useEffect(() => {
    // 归因抓取:每次进站跑一次,先到先得(第一次把客人带来的那条广告算功劳)
    try { captureAdAttribution(); } catch { /* 埋点绝不能拖累页面 */ }
  }, []);

  useEffect(() => {
    if (!PIXEL_ID || typeof window === 'undefined' || window.fbq) return;
    const n = function (...args) { n.callMethod ? n.callMethod(...args) : n.queue.push(args); };
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    window.fbq = n; window._fbq = n;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }, []);
  return null;
}
