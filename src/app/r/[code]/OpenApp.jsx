"use client";

// 安卓手机一打开就走 intent 链接：装了 App 直接打开（带着推荐码），没装就去带码的 Play 商店页。
// 其他系统什么都不做，页面上的按钮自己点。
import { useEffect } from "react";

export function OpenApp({ intentUrl }) {
  useEffect(() => {
    if (/Android/i.test(navigator.userAgent || "")) window.location.href = intentUrl;
  }, [intentUrl]);
  return null;
}
