"use client";

// 安卓手机一打开就走 intent 链接：装了 App 直接打开（带着推荐码），没装就去带码的 Play 商店页。
// 其他系统什么都不做，页面上的按钮自己点。
// 2026-11-12 起这一下记一笔「点了下载」（ReferralDownload / android_auto，只进我们自己的库）；「点开」由 ReferralContent 记，这里不重复记。
import { useEffect } from "react";
import { logOwnEvent } from "@/lib/metaPixelTrack";

export function OpenApp({ intentUrl, code }) {
  useEffect(() => {
    if (!/Android/i.test(navigator.userAgent || "")) return;
    logOwnEvent("ReferralDownload", { content_name: "android_auto", content_ids: code ? [code] : [] });
    window.location.href = intentUrl;
  }, [intentUrl, code]);
  return null;
}
