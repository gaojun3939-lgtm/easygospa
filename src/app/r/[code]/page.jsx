import { cache } from "react";
import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { OpenApp } from "./OpenApp";
import { ReferralContent } from "./ReferralContent";

// 推荐链接落地页（2026-10-19，App 简化版大检查 B6）：https://www.easygospa.com/r/<推荐码>
// 安卓手机：装了 App → 直接打开 App（带着码）；没装 → 跳 Play 商店，商店把码记下（install referrer），
//   装好第一次打开时 App 从商店拿回这个码，注册时自动绑定给推荐人。客人全程不用填码。
// 2026-11-03 老板「都补上」：聊天卡片（下面的分享信息）；谷歌、苹果都按上架状态出按钮，见 ReferralContent。
//   谷歌没上架时安卓不自动跳：带 package 的 intent 没装 App 也会去商店，商店页是 404。不进搜索引擎。
const SITE = "https://www.easygospa.com";
const PACKAGE = "com.easygospa.app";
const IOS_APP_ID = "6828713492";
const TITLE = "You're invited to EasyGoSpa";
const DESCRIPTION = "Book a licensed massage therapist to your home or hotel in Metro Manila.";

const parseCode = (raw) => (/^[A-Za-z0-9]{3,16}$/.test(String(raw || "")) ? String(raw).toUpperCase() : "");

// 查 App Store 上架没有，缓存 1 小时；查不到或查询失败都当没上架
const isOnAppStore = cache(async () => {
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

// 查 Google Play 上架没有：只有 200 才算上架，只存结果，缓存 1 小时；查询出错当没上架，下一次再查
const readGooglePlayListing = unstable_cache(
  async () => {
    const response = await fetch(`https://play.google.com/store/apps/details?id=${PACKAGE}&gl=ph&hl=en`, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    return response.status === 200;
  },
  ["google-play-listed", PACKAGE],
  { revalidate: 3600 },
);

const isOnGooglePlay = cache(async () => {
  try {
    return await readGooglePlayListing();
  } catch {
    return false;
  }
});

export async function generateMetadata({ params }) {
  const { code: raw } = await params;
  const code = parseCode(raw);
  const url = code ? `${SITE}/r/${code}` : SITE;
  const onAppStore = await isOnAppStore();
  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: "EasyGo Spa",
      locale: "en_PH",
      url,
      title: TITLE,
      description: DESCRIPTION,
      images: [{ url: `${SITE}/opengraph-image.png`, width: 1200, height: 630, alt: "EasyGo Spa" }],
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
      images: [`${SITE}/twitter-image.png`],
    },
    ...(onAppStore ? { itunes: { appId: IOS_APP_ID, appArgument: url } } : {}),
  };
}

export default async function ReferralLandingPage({ params }) {
  const { code: raw } = await params;
  const code = parseCode(raw);
  const referrer = encodeURIComponent(code ? `r=${code}&utm_source=referral` : "utm_source=referral");
  const playUrl = `https://play.google.com/store/apps/details?id=${PACKAGE}&referrer=${referrer}`;
  // Chrome 的 intent 链接：装了 App 就打开 App 的 easygospa://r/<码>，没装就去带码的商店页
  const intentUrl = `intent://r/${code}#Intent;scheme=easygospa;package=${PACKAGE};S.browser_fallback_url=${encodeURIComponent(playUrl)};end`;

  const userAgent = (await headers()).get("user-agent") || "";
  const [onAppStore, onGooglePlay] = await Promise.all([isOnAppStore(), isOnGooglePlay()]);

  return (
    <main className="pt-28 pb-24 bg-gradient-to-b from-[#F8F2EC] to-white min-h-screen">
      {onGooglePlay ? <OpenApp intentUrl={intentUrl} /> : null}
      <ReferralContent
        iosFromServer={/iPhone|iPad|iPod/i.test(userAgent)}
        androidFromServer={/Android/i.test(userAgent)}
        onAppStore={onAppStore}
        onGooglePlay={onGooglePlay}
        playUrl={playUrl}
        appStoreUrl={`https://apps.apple.com/ph/app/id${IOS_APP_ID}`}
        link={code ? `${SITE}/r/${code}` : ""}
        openAppUrl={code ? `easygospa://r/${code}` : ""}
      />
    </main>
  );
}
