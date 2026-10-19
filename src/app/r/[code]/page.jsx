import { OpenApp } from "./OpenApp";

// 推荐链接落地页（2026-10-19，App 简化版大检查 B6）：https://www.easygospa.com/r/<推荐码>
// 安卓手机：装了 App → 直接打开 App（带着码）；没装 → 跳 Play 商店，商店把码记下（install referrer），
//   装好第一次打开时 App 从商店拿回这个码，注册时自动绑定给推荐人。客人全程不用填码。
// 其他手机 / 电脑：显示下载按钮。不进搜索引擎。
export const metadata = {
  title: "You're invited to EasyGoSpa",
  description: "Book a licensed massage therapist to your home in Metro Manila with the EasyGoSpa app.",
  robots: { index: false, follow: false },
};

const PACKAGE = "com.easygospa.app";

export default async function ReferralLandingPage({ params }) {
  const { code: raw } = await params;
  const code = /^[A-Za-z0-9]{3,16}$/.test(String(raw || "")) ? String(raw).toUpperCase() : "";
  const referrer = encodeURIComponent(code ? `r=${code}&utm_source=referral` : "utm_source=referral");
  const playUrl = `https://play.google.com/store/apps/details?id=${PACKAGE}&referrer=${referrer}`;
  // Chrome 的 intent 链接：装了 App 就打开 App 的 easygospa://r/<码>，没装就去带码的商店页
  const intentUrl = `intent://r/${code}#Intent;scheme=easygospa;package=${PACKAGE};S.browser_fallback_url=${encodeURIComponent(playUrl)};end`;

  return (
    <main className="pt-28 pb-24 bg-gradient-to-b from-[#F8F2EC] to-white min-h-screen">
      <OpenApp intentUrl={intentUrl} />
      <div className="max-w-md mx-auto px-6 text-center">
        <h1 className="font-serif text-3xl font-bold text-[#0F0F0F]">You&apos;re invited to EasyGoSpa</h1>
        <p className="mt-4 text-[15px] leading-7 text-gray-700">
          Book a licensed massage therapist to your home or hotel in Metro Manila. Get the app to book — your invite is saved automatically.
        </p>
        <a className="mt-8 inline-block rounded-full bg-[#0F4035] px-7 py-3 text-white font-medium" href={playUrl}>
          Get it on Google Play
        </a>
        <p className="mt-4 text-sm text-gray-500">On an iPhone? The iOS app is coming soon — you can still book on this website.</p>
        <a className="mt-2 inline-block text-sm text-[#0F4035] underline" href="/">Book on the website</a>
      </div>
    </main>
  );
}
