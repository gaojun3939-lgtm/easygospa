"use client";

// 推荐页的正文和按钮。
// 2026-11-12 老板「点的这个链接 界面 是不是也要弄下啊 这个太丑了吧」→ 效果图「推荐页-改后效果图」→「执行」：
//   跟新分享图同一个画面（Mia + App 手机 + 下载按钮），深色底；标题用万能称呼「您的朋友邀请您 / 来体验 EasyGoSpa」
//   （老板「是邀请你来体验 懂么不是加入」；不显示邀请人真名：App 里的名字五花八门、链接会被转发）；
//   邀请码写出来；四个小卖点；去掉「在官网预约」（官网预约都去 App）。
//   老板「记下有多少人点开、有多少人点了下载」：点开记 ReferralView，点下载 / 打开 App 记 ReferralDownload（只进我们自己的库，不发 Meta）。
// 电脑：谷歌、苹果两个按钮；iPhone / iPad：只有苹果；安卓：只有谷歌。
// 上架了是能点的下载按钮，没上架是同样的按钮写 Coming soon、不能点（写法跟 easygospa.ph 一致）。
// Open EasyGoSpa 只在 App Store 上架后的 iPhone 上显示，不自动跳：没装 App 时 Safari 会报错。
// 多语言：文字在 src/messages/<语言>/referral.json；Google Play、App Store 是商店名字，不翻译
import { useEffect, useRef, useState } from "react";
import { Clock, Home, Navigation, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import BrandMark from "@/components/BrandMark";
import { AppleLogo, PlayLogo } from "@/components/site/StoreLogos";
import { logOwnEvent } from "@/lib/metaPixelTrack";

const BRAND = "EasyGoSpa";
const POINTS = [
  { key: "verified", icon: ShieldCheck },
  { key: "home", icon: Home },
  { key: "eta", icon: Navigation },
  { key: "allDay", icon: Clock },
];

// 新写法写不进剪贴板时的老办法，再失败就算了
const copyByCommand = (text) => {
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.readOnly = true;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, text.length);
    document.execCommand("copy");
    area.remove();
  } catch {}
};

// 推荐页的点开 / 点下载记进我们自己的库（content_ids 放推荐码，好算每个码带来多少人；不带任何个人信息）
const logReferral = (eventName, code, where = "") => logOwnEvent(eventName, { content_name: where, content_ids: code ? [code] : [] });

function StoreBadge({ live, href, onClick, logo, small, smallSoon, big }) {
  const t = useTranslations("referral");
  const className = "flex h-[56px] items-center gap-3 rounded-xl border border-[#a6a6a6] bg-black pl-[14px] pr-[18px] text-white";
  const inner = (
    <>
      {logo}
      <span className="flex flex-col whitespace-nowrap text-left leading-none">
        <span className="mb-1 text-[10px] tracking-wide">{live ? small : smallSoon}</span>
        <span className="text-[21px] font-semibold tracking-tight">{big}</span>
      </span>
    </>
  );
  if (!live) {
    return (
      <span className={`${className} cursor-default opacity-70`} aria-disabled="true" title={t("badges.comingSoon")}>
        {inner}
      </span>
    );
  }
  return (
    <a className={`${className} transition-colors hover:bg-[#1A1A1A]`} href={href} onClick={onClick} rel="noopener">
      {inner}
    </a>
  );
}

export function ReferralContent({ code, iosFromServer, androidFromServer, onAppStore, onGooglePlay, playUrl, appStoreUrl, link, openAppUrl }) {
  const t = useTranslations("referral");
  const [ios, setIos] = useState(iosFromServer);
  const viewed = useRef(false);

  // iPad 的 Safari 默认报自己是 Mac，服务器认不出，这里补一下；点开记一次
  useEffect(() => {
    if (/Macintosh/.test(navigator.userAgent || "") && navigator.maxTouchPoints > 1) setIos(true);
    if (!viewed.current) {
      viewed.current = true;
      logReferral("ReferralView", code);
    }
  }, [code]);

  // 先把这条推荐链接写进剪贴板再跳商店，App 第一次打开时读取，客人不用填码；写失败也照常跳
  const goToAppStore = (event) => {
    event.preventDefault();
    logReferral("ReferralDownload", code, "app_store");
    let left = false;
    const leave = () => {
      if (left) return;
      left = true;
      window.location.href = appStoreUrl;
    };
    if (!link) return leave();
    setTimeout(leave, 400);
    const retryThenLeave = () => {
      copyByCommand(link);
      leave();
    };
    try {
      navigator.clipboard.writeText(link).then(leave, retryThenLeave);
    } catch {
      retryThenLeave();
    }
  };

  // 这台设备有能下载的商店才说下载 App：谷歌、苹果都没上架时，Coming soon 按钮已经说明了
  const canGetApp = ios ? onAppStore : androidFromServer ? onGooglePlay : onAppStore || onGooglePlay;

  return (
    <div className="max-w-xl">
      <span className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm tracking-wide backdrop-blur-sm">
        <BrandMark size={28} tone="light" />
        {t("pill")}
      </span>
      <h1 className="font-serif font-normal text-[34px] sm:text-[40px] md:text-[54px] xl:text-[62px] leading-[1.12] mt-5 mb-4">
        {t("friend")}
        <br />
        {t("title", { brand: BRAND })}
      </h1>
      <p className="text-[15.5px] md:text-lg leading-relaxed text-white/85">{canGetApp ? t("descriptionGetApp") : t("description")}</p>
      {code ? (
        <p className="mt-6 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-[#F7F4EE]/95 px-4 py-3 text-[#171A17]">
          <span className="text-sm">{t("code")}</span>
          <b className="font-mono text-xl tracking-[0.12em] text-[#3F4A33]">{code}</b>
          <span className="text-sm text-[#55633F]">{t("codeNote")}</span>
        </p>
      ) : null}
      <div className="mt-6 mb-8 flex flex-wrap gap-3">
        {ios ? null : (
          <StoreBadge live={onGooglePlay} href={playUrl} onClick={() => logReferral("ReferralDownload", code, "google_play")} logo={<PlayLogo />} small={t("badges.googlePlay.get")} smallSoon={t("badges.googlePlay.soon")} big="Google Play" />
        )}
        {androidFromServer ? null : (
          <StoreBadge live={onAppStore} href={appStoreUrl} onClick={goToAppStore} logo={<AppleLogo />} small={t("badges.appStore.get")} smallSoon={t("badges.appStore.soon")} big="App Store" />
        )}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 sm:gap-x-6">
        {POINTS.map(({ key, icon: Icon }) => (
          <li key={key} className="flex items-center gap-3 text-[15px] text-white/90">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white/10">
              <Icon className="h-[19px] w-[19px] text-[#E9DFC3]" strokeWidth={1.8} aria-hidden="true" />
            </span>
            {t(`points.${key}`)}
          </li>
        ))}
      </ul>
      {ios && onAppStore && openAppUrl ? (
        <a className="mt-8 inline-block text-sm text-white/80 underline" href={openAppUrl} onClick={() => logReferral("ReferralDownload", code, "open_app")}>{t("openApp", { brand: BRAND })}</a>
      ) : null}
    </div>
  );
}
