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

// 苹果 2026-11-10 已过审上架（老板：「苹果过审了，把连接换成真实的」）：直接当已上架，用商店给的正式网址。
// 原来查 iTunes 接口，刚过审那几天接口还返回「查不到」，按钮会一直写「即将上架」，所以不查了。只上菲律宾，网址用 /ph/。
const APP_STORE_URL = `https://apps.apple.com/ph/app/easygospa-home-massage/id${IOS_APP_ID}`;
const isOnAppStore = async () => true;

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
        appStoreUrl={APP_STORE_URL}
        link={code ? `${SITE}/r/${code}` : ""}
        openAppUrl={code ? `easygospa://r/${code}` : ""}
      />
    </main>
  );
}
