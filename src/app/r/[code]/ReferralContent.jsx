"use client";

// 推荐页的正文和按钮。
// 安卓 / 电脑：Google Play 按钮。iPhone：没有 Google Play 按钮；App Store 上架了才出 App Store 按钮和 Open EasyGoSpa 小链接，
//   没上架就写即将推出 + 官网下单。Open EasyGoSpa 不自动跳：没装 App 时 Safari 会报错。
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

const POINTS = ["Verified therapists", "Home, condo and hotel service across Metro Manila", "Available 24/7"];

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

export function ReferralContent({ iosFromServer, androidFromServer, onAppStore, playUrl, appStoreUrl, link, openAppUrl }) {
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

  const noAppYet = ios && !onAppStore;

  return (
    <div className="max-w-md mx-auto px-6 text-center">
      <h1 className="font-serif text-3xl font-bold text-[#0F0F0F]">You&apos;re invited to EasyGoSpa</h1>
      <p className="mt-4 text-[15px] leading-7 text-gray-700">
        Book a licensed massage therapist to your home or hotel in Metro Manila.
        {noAppYet ? null : " Get the app to book — your invite is saved automatically."}
      </p>
      {ios ? null : (
        <a className="mt-8 mx-1 inline-block rounded-full bg-[#0F4035] px-7 py-3 text-white font-medium" href={playUrl}>
          Get it on Google Play
        </a>
      )}
      {onAppStore && !androidFromServer ? (
        <a className="mt-8 mx-1 inline-block rounded-full bg-[#0F4035] px-7 py-3 text-white font-medium" href={appStoreUrl} onClick={goToAppStore}>
          Download on the App Store
        </a>
      ) : null}
      <ul className="mt-8 space-y-2 text-sm text-gray-700">
        {POINTS.map((point) => (
          <li key={point} className="flex items-center justify-center gap-2">
            <Check className="h-4 w-4 flex-shrink-0 text-[#0F4035]" aria-hidden="true" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      {onAppStore ? null : (
        <p className="mt-8 text-sm text-gray-500">On an iPhone? The iOS app is coming soon — you can still book on this website.</p>
      )}
      {ios && onAppStore && openAppUrl ? (
        <a className="mt-8 block text-sm text-[#0F4035] underline" href={openAppUrl}>Open EasyGoSpa</a>
      ) : null}
      <a className={`${onAppStore ? "mt-8" : "mt-2"} inline-block text-sm text-[#0F4035] underline`} href="/">Book on the website</a>
    </div>
  );
}
