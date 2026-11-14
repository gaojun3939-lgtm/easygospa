import { setRequestLocale } from "next-intl/server";
import { loadPublicServiceMenu } from "@/lib/publicServiceMenu.mjs";
import { APP_STORE_URL, isOnAppStore, isOnGooglePlay, playStoreUrl } from "@/lib/appStores.mjs";
import { appQrSvg } from "@/lib/appQr.mjs";
import { alternatesFor, SITE } from "@/i18n/routing";
import ClientText from "@/components/site/ClientText";
import Hero from "@/components/site/home/Hero";
import Seal from "@/components/site/home/Seal";
import WhyChoose from "@/components/site/home/WhyChoose";
import Services from "@/components/site/home/Services";
import Stats from "@/components/site/home/Stats";
import Journeys from "@/components/site/home/Journeys";
import Included from "@/components/site/home/Included";
import Standard from "@/components/site/home/Standard";
import AppBanner from "@/components/site/home/AppBanner";
import Areas from "@/components/site/home/Areas";
import GoodToKnow from "@/components/site/home/GoodToKnow";
import Ways from "@/components/site/home/Ways";
import QuickCard from "@/components/site/home/QuickCard";

// 首页（2026-11-10 老板：用建站模版 serinity 当骨架，模版首页每一块都留着，按原顺序，只换成我们的内容）。
// 模版顺序：首屏+圆章 → 为什么选我们 → 项目 → 大图数字 → 横走卡片 → 横走图标 → 标准 → 横幅 → 品牌条 → 评价。
// 首屏 2026-11-11 换成整屏开场片 + 下载 App（老板「官网顶部显示的就说 app」），模版的三张轮播去掉。
// 项目卡显示后台真价（Xendit 审核要一眼看到价格）；每 60 秒最多重算一次，读不到后台时继续给上一次的页面（lib/publicServiceMenu.mjs）。
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { alternates: alternatesFor(locale, "/") };
}

type MenuService = { durationOptions?: { durationMinutes?: number; price?: number }[] };

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [services, onPlay, onApple] = await Promise.all([
    loadPublicServiceMenu() as Promise<MenuService[]>,
    isOnGooglePlay(),
    isOnAppStore(),
  ]);
  // 大图那块的起步价：所有项目 60 分钟里最便宜的一档
  const sixty = services.flatMap((s) => s.durationOptions || []).filter((o) => Number(o.durationMinutes) === 60).map((o) => Number(o.price)).filter((p) => p > 0);
  const fromPrice = sixty.length ? Math.min(...sixty) : null;
  // 电脑上扫码：/app 按手机系统跳对应商店（两家都没上架就不出二维码）
  const qrSvg = onPlay || onApple ? await appQrSvg(SITE) : "";

  return (
    <ClientText namespaces={["home"]}>
      {/* eg-home：手机版「像我们 App」的样式都挂在它下面（site.css 末尾，只在 768 以下生效） */}
      <div className="eg-home">
        <div className="relative">
          <Hero onPlay={onPlay} onApple={onApple} playHref={playStoreUrl("utm_source=website&utm_medium=hero")} appleHref={APP_STORE_URL} qrSvg={qrSvg} />
          <Seal />
        </div>
        {/* 11-15 手机上首屏下面一张白卡（三个数 + 身体需要什么），电脑上不出现 */}
        <QuickCard fromPrice={fromPrice} />
        <div className="bg-[#FDFCF9] relative">
          <WhyChoose />
          {/* 11-12 老板「官网里面 没有看到 门店下单啊？」→ 上门 / 到店两种方式，到店进门店页 */}
          <Ways />
          <Services services={services} />
          <Stats fromPrice={fromPrice} />
        </div>
        <Journeys />
        <Included />
        <div className="bg-[#FDFCF9] relative">
          <Standard />
          <AppBanner onPlay={onPlay} onApple={onApple} playHref={playStoreUrl("utm_source=website&utm_medium=home")} appleHref={APP_STORE_URL} qrSvg={qrSvg} />
          <Areas />
          <GoodToKnow />
        </div>
      </div>
    </ClientText>
  );
}
