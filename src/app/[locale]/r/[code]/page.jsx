import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { alternatesFor, languageOf } from "@/i18n/routing";
import { OpenApp } from "./OpenApp";
import { ReferralContent } from "./ReferralContent";
import { APP_STORE_URL, IOS_APP_ID, PACKAGE, isOnAppStore, isOnGooglePlay, playStoreUrl } from "@/lib/appStores.mjs";

// 推荐链接落地页（2026-10-19，App 简化版大检查 B6）：https://www.easygospa.com/r/<推荐码>
// 安卓手机：装了 App → 直接打开 App（带着码）；没装 → 跳 Play 商店，商店把码记下（install referrer），
//   装好第一次打开时 App 从商店拿回这个码，注册时自动绑定给推荐人。客人全程不用填码。
// 2026-11-03 老板「都补上」：聊天卡片（下面的分享信息）；谷歌、苹果都按上架状态出按钮，见 ReferralContent。
//   谷歌没上架时安卓不自动跳：带 package 的 intent 没装 App 也会去商店，商店页是 404。不进搜索引擎。
const SITE = "https://www.easygospa.com";
// 2026-11-09 多语言：标题和介绍在 src/messages/<语言>/referral.json。推荐链接本身（复制给 App 读的、苹果横幅带的）不带语言前缀，App 认的就是这个
const BRAND = "EasyGoSpa";

const parseCode = (raw) => (/^[A-Za-z0-9]{3,16}$/.test(String(raw || "")) ? String(raw).toUpperCase() : "");

export async function generateMetadata({ params }) {
  const { locale, code: raw } = await params;
  const code = parseCode(raw);
  const url = code ? `${SITE}/r/${code}` : SITE;
  const onAppStore = await isOnAppStore();
  const t = await getTranslations({ locale, namespace: "referral" });
  const title = t("title", { brand: BRAND });
  const description = t("description");
  return {
    title: { absolute: title },
    description,
    ...(code ? { alternates: alternatesFor(locale, `/r/${code}`) } : {}),
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: "EasyGo Spa",
      locale: languageOf(locale).og,
      url,
      title,
      description,
      images: [{ url: `${SITE}/opengraph-image.png`, width: 1200, height: 630, alt: "EasyGo Spa" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE}/twitter-image.png`],
    },
    ...(onAppStore ? { itunes: { appId: IOS_APP_ID, appArgument: url } } : {}),
  };
}

export default async function ReferralLandingPage({ params }) {
  const { locale, code: raw } = await params;
  setRequestLocale(locale);
  const code = parseCode(raw);
  const playUrl = playStoreUrl(code ? `r=${code}&utm_source=referral` : "utm_source=referral");
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
