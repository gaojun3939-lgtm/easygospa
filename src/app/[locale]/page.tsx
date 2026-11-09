import { setRequestLocale } from "next-intl/server";
import SiteHome from "@/components/global/SiteHome";
import { loadPublicServiceMenu } from "@/lib/publicServiceMenu.mjs";
import { alternatesFor } from "@/i18n/routing";

// 2026-10-26:首页服务卡要显示后台真价(Xendit 审核要一眼看到价格)。
// 每 60 秒最多重算一次;读不到后台时继续给上一次的页面,规则见 lib/publicServiceMenu.mjs。
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { alternates: alternatesFor(locale, "/") };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const services = await loadPublicServiceMenu();
  return <SiteHome locale={locale} services={services} />;
}
