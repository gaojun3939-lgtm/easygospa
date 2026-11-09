"use client";

// 推荐页的正文和按钮。
// 电脑：谷歌、苹果两个按钮；iPhone / iPad：只有苹果；安卓：只有谷歌。
// 上架了是能点的下载按钮，没上架是同样的按钮写 Coming soon、不能点（写法跟 easygospa.ph 一致）。
// Open EasyGoSpa 只在 App Store 上架后的 iPhone 上显示，不自动跳：没装 App 时 Safari 会报错。
// 2026-11-09 多语言：文字在 src/messages/<语言>/referral.json；Google Play、App Store 是商店名字，不翻译
import { useEffect, useState } from "react";
import { AppleLogo, PlayLogo } from "@/components/site/StoreLogos";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";

const BRAND = "EasyGoSpa";
const POINTS = ["points.verified", "points.coverage", "points.allDay"];

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



function StoreBadge({ live, href, onClick, logo, small, smallSoon, big }) {
  const t = useTranslations("referral");
  const className = "flex h-[54px] items-center gap-2.5 rounded-[10px] border border-[#a6a6a6] bg-black pl-[13px] pr-[14px] text-white";
  const inner = (
    <>
      {logo}
      <span className="flex flex-col whitespace-nowrap text-left leading-none">
        <span className="mb-1 text-[10px] tracking-wide">{live ? small : smallSoon}</span>
        <span className="text-xl font-semibold tracking-tight">{big}</span>
      </span>
    </>
  );
  if (!live) {
    return (
      <span className={`${className} cursor-default`} aria-disabled="true" title={t("badges.comingSoon")}>
        {inner}
      </span>
    );
  }
  return (
    <a className={className} href={href} onClick={onClick} rel="noopener">
      {inner}
    </a>
  );
}

export function ReferralContent({ iosFromServer, androidFromServer, onAppStore, onGooglePlay, playUrl, appStoreUrl, link, openAppUrl }) {
  const t = useTranslations("referral");
  const [ios, setIos] = useState(iosFromServer);

  // iPad 的 Safari 默认报自己是 Mac，服务器认不出，这里补一下
  useEffect(() => {
    if (/Macintosh/.test(navigator.userAgent || "") && navigator.maxTouchPoints > 1) setIos(true);
  }, []);

  // 先把这条推荐链接写进剪贴板再跳商店，App 第一次打开时读取，客人不用填码；写失败也照常跳
  const goToAppStore = (event) => {
    event.preventDefault();
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
    <div className="max-w-md mx-auto px-6 text-center">
      <h1 className="font-serif text-3xl font-bold text-[#0F0F0F]">{t("title", { brand: BRAND })}</h1>
      <p className="mt-4 text-[15px] leading-7 text-gray-700">
        {canGetApp ? t("descriptionGetApp") : t("description")}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {ios ? null : (
          <StoreBadge live={onGooglePlay} href={playUrl} logo={<PlayLogo />} small={t("badges.googlePlay.get")} smallSoon={t("badges.googlePlay.soon")} big="Google Play" />
        )}
        {androidFromServer ? null : (
          <StoreBadge live={onAppStore} href={appStoreUrl} onClick={goToAppStore} logo={<AppleLogo />} small={t("badges.appStore.get")} smallSoon={t("badges.appStore.soon")} big="App Store" />
        )}
      </div>
      <ul className="mt-8 space-y-2 text-sm text-gray-700">
        {POINTS.map((point) => (
          <li key={point} className="flex items-center justify-center gap-2">
            <Check className="h-4 w-4 flex-shrink-0 text-[#0F4035]" aria-hidden="true" />
            <span>{t(point)}</span>
          </li>
        ))}
      </ul>
      {ios && onAppStore && openAppUrl ? (
        <a className="mt-8 block text-sm text-[#0F4035] underline" href={openAppUrl}>{t("openApp", { brand: BRAND })}</a>
      ) : null}
      <Link className="mt-8 inline-block text-sm text-[#0F4035] underline" href="/">{t("bookOnWebsite")}</Link>
    </div>
  );
}
