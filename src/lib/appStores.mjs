import { cache } from 'react';
import { unstable_cache } from 'next/cache';

// App 两家商店（推荐页、首页「下载 App」、/app 二维码跳转共用一份）。
// 上架没有是现查的：苹果查 iTunes 接口、谷歌查商店页是不是 200，各缓存 1 小时；查不到或出错都当没上架，按钮写「即将上架」，不说过头。
export const PACKAGE = 'com.easygospa.app';
export const IOS_APP_ID = '6828713492';
export const APP_STORE_URL = `https://apps.apple.com/ph/app/id${IOS_APP_ID}`;

// referrer 会被谷歌商店带进 App（推荐码就是这样传的）；官网来的只标来源
export function playStoreUrl(referrer = 'utm_source=website') {
  return `https://play.google.com/store/apps/details?id=${PACKAGE}&referrer=${encodeURIComponent(referrer)}`;
}

export const isOnAppStore = cache(async () => {
  try {
    const response = await fetch(`https://itunes.apple.com/lookup?id=${IOS_APP_ID}&country=ph`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.resultCount > 0;
  } catch {
    return false;
  }
});

const readGooglePlayListing = unstable_cache(
  async () => {
    const response = await fetch(`https://play.google.com/store/apps/details?id=${PACKAGE}&gl=ph&hl=en`, {
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    return response.status === 200;
  },
  ['google-play-listed', PACKAGE],
  { revalidate: 3600 },
);

export const isOnGooglePlay = cache(async () => {
  try {
    return await readGooglePlayListing();
  } catch {
    return false;
  }
});
