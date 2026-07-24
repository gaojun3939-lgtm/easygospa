'use client';

import { useEffect } from 'react';

// Meta Pixel(批A 投流引擎的旁路眼睛):记录官网访客与下单动作,回传 Meta 让广告越投越准,
// 并为将来"追官网来过没下单的人"攒受众。主路归因走 CTWA 盖章,不依赖本文件。
// 没配 NEXT_PUBLIC_META_PIXEL_ID 时整个组件静默不加载,零影响。
const PIXEL_ID = String(process.env.NEXT_PUBLIC_META_PIXEL_ID || '').trim();

export function trackMetaEvent(eventName, params) {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') window.fbq('track', eventName, params || {});
  } catch { /* 像素是增强,绝不影响主流程 */ }
}

export default function MetaPixel() {
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
