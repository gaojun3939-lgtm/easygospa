import { cache } from 'react';
import { unstable_cache } from 'next/cache';

// App 两家商店（推荐页、首页「下载 App」、页脚、/app 二维码跳转共用一份）。
// 谷歌上架没有是现查的（商店页是不是 200，缓存 1 小时；查不到或出错都当没上架，按钮写「即将上架」，不说过头）。
// 苹果 2026-11-10 已过审上架（老板：「苹果过审了，把连接换成真实的」），直接当已上架、用商店给的正式网址；
// 原来查 iTunes 接口，刚过审那几天接口还返回「查不到」，按钮会一直写「即将上架」，所以不查了。只上菲律宾，网址用 /ph/。
export const PACKAGE = 'com.easygospa.app';
export const IOS_APP_ID = '6828713492';
export const APP_STORE_URL = `https://apps.apple.com/ph/app/easygospa-home-massage/id${IOS_APP_ID}`;

// referrer 会被谷歌商店带进 App（推荐码就是这样传的）；官网来的只标来源
export function playStoreUrl(referrer = 'utm_source=website') {
  return `https://play.google.com/store/apps/details?id=${PACKAGE}&referrer=${encodeURIComponent(referrer)}`;
}

export const isOnAppStore = async () => true;

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
