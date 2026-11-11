import { NextResponse } from 'next/server';
import { APP_STORE_URL, isOnAppStore, isOnGooglePlay, playStoreUrl } from '@/lib/appStores.mjs';
import { localePath, routing } from '@/i18n/routing';

// 官网首页「下载 App」的二维码指到这里（照 easygospa.ph 的做法）：
// 安卓手机去谷歌商店、苹果手机去 App Store；电脑、或对应商店还没上架，回首页下载区。
export async function GET(request) {
  const url = new URL(request.url);
  const ua = request.headers.get('user-agent') || '';
  const from = url.searchParams.get('from') || 'qr';
  if (/android/i.test(ua) && (await isOnGooglePlay())) return NextResponse.redirect(playStoreUrl(`utm_source=website&utm_medium=${from}`), 302);
  if (/iphone|ipad|ipod/i.test(ua) && (await isOnAppStore())) return NextResponse.redirect(APP_STORE_URL, 302);
  // 回首页下载区时保持客人原来的语言（官网预约按钮会带 lang，11-12 起）
  const lang = url.searchParams.get('lang');
  const home = routing.locales.includes(lang) ? localePath(lang, '/') : '/';
  return NextResponse.redirect(new URL(`${home}#app`, url.origin), 302);
}
