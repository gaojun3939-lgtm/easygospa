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
  const title = t("shareTitle", { brand: BRAND });
  const description = t("description");
  return {
    title: { absolute: title },
    description,
    ...(code ? { alternates: alternatesFor(locale, `/r/${code}`) } : {}),
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: "EasyGoSpa",
      locale: languageOf(locale).og,
      url,
      title,
      description,
      images: [{ url: `${SITE}/opengraph-image.jpg`, width: 1200, height: 630, alt: "EasyGoSpa" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE}/twitter-image.jpg`],
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

  // 2026-11-12 老板「这个太丑了吧」→ 照效果图重做：深色底，跟新分享图同一个画面。
  // 电脑：整幅 Mia（11 号，首屏片子封面那帧）铺满、左边压暗放字，中间一部 App 手机（宽屏才放，窄了会挡字）；
  // 手机：上面 Mia 照片，下面字和按钮。照片和手机截图都是装饰，读屏跳过。
  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#0E0E0C] text-white">
      <span data-nav-over-dark hidden />
      {onGooglePlay ? <OpenApp intentUrl={intentUrl} code={code} /> : null}
      <div className="relative h-[60svh] md:hidden" aria-hidden="true">
        <img src="/global/photos/team-rated.webp" alt="" className="h-full w-full object-cover object-[100%_0%]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0E0E0C] to-transparent" />
      </div>
      <div className="absolute inset-0 hidden md:block" aria-hidden="true">
        <img src="/global/photos/team-rated.webp" alt="" className="h-full w-full object-cover object-[100%_0%]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,14,12,.95)_0%,rgba(14,14,12,.88)_36%,rgba(14,14,12,.45)_56%,rgba(14,14,12,0)_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0E0E0C]/70 to-transparent" />
      </div>
      <div className="absolute left-[48%] top-[190px] hidden w-[290px] rounded-[44px] bg-[#111] p-[11px] shadow-[0_30px_70px_rgba(0,0,0,.55),inset_0_0_0_2px_#333] xl:block" aria-hidden="true">
        <img src="/global/photos/app-welcome.webp" alt="" className="block w-full rounded-[34px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 -mt-24 md:mt-0 md:pt-40 lg:px-8 xl:pt-44">
        <ReferralContent
        code={code}
        iosFromServer={/iPhone|iPad|iPod/i.test(userAgent)}
        androidFromServer={/Android/i.test(userAgent)}
        onAppStore={onAppStore}
        onGooglePlay={onGooglePlay}
        playUrl={playUrl}
        appStoreUrl={APP_STORE_URL}
        link={code ? `${SITE}/r/${code}` : ""}
        openAppUrl={code ? `easygospa://r/${code}` : ""}
        />
      </div>
    </main>
  );
}
