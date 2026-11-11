import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Geist, Geist_Mono, Inter, Playfair_Display } from "next/font/google";
import Navbar from "@/components/navbar";
import BookingModal from "@/components/BookingModal";
// 悬浮 WhatsApp 球已撤(老板 2026-07-21:别把要下单的人引去聊天),入口收进页脚社交图标。
import CustomerOrders from "@/components/CustomerOrders";
import LoadingScreen from "@/components/LoadingScreen";
import MetaPixel from "@/components/MetaPixel";
import Footer from "@/components/site/Footer";
import { routing, languageOf, SITE } from "@/i18n/routing";
import { CLIENT_NAMESPACES } from "@/i18n/namespaces";
import "../globals.css";
import "../site.css";

const gaSerif = Playfair_Display({
  variable: "--font-ga-serif",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

// 越南文要 vietnamese 这一套字形，不然带声调的字母会掉到别的字体
const gaSans = Inter({
  variable: "--font-ga-sans",
  subsets: ["latin", "latin-ext", "vietnamese"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: {
      default: t("site.title"),
      template: "%s | EasyGoSpa",
    },
    description: t("site.description"),
    keywords: t("site.keywords"),
    authors: [{ name: "EasyGoSpa" }],
    creator: "EasyGoSpa",
    publisher: "EasyGoSpa",
    // 每页自己写正式网址和七种语言的网址（alternatesFor），这里不写，免得没写的页面被当成首页
    openGraph: {
      title: t("site.ogTitle"),
      description: t("site.ogDescription"),
      siteName: "EasyGoSpa",
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "EasyGoSpa" }],
      locale: languageOf(locale).og,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("site.twitterTitle"),
      description: t("site.twitterDescription"),
      images: ["/twitter-image.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      // Meta 域名验证(老板 2026-07-20):证明 easygospa.com 归属,投流/像素的前置条件。
      other: {
        "facebook-domain-verification": "wk56gls7xghwf0rpfv57imh1zdp6ey",
      },
    },
    metadataBase: new URL(SITE),
    // 苹果手机会把页脚的公司注册号当电话自动加链接，页面对不上，整段重新渲染（2026-11-04 模拟器查到）。电话都是自己写的链接，不受影响
    formatDetection: { telephone: false },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const clientMessages = Object.fromEntries(CLIENT_NAMESPACES.map((name) => [name, messages[name] || {}]));

  return (
    <html lang={locale} className={`${gaSerif.variable} ${gaSans.variable}`} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* 预热兜底:页面刚加载、React 还没接管时,带 data-open-booking 的按钮
            也能被这条原生监听接住(先记 flag,Navbar 挂载后补开弹窗)。 */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('[data-open-booking]'):null;if(t){window.__egOpenBooking=true;try{window.dispatchEvent(new CustomEvent('open-booking-modal'))}catch(err){}}});"
          }}
        />
        <NextIntlClientProvider locale={locale} messages={clientMessages} timeZone="Asia/Manila">
          <MetaPixel />
          <LoadingScreen />
          <Suspense fallback={null}>
            <Navbar />
          </Suspense>
          {children}
          <Footer />
          {/* ChatBot 暂时下架:LLM 接口未接通,且菜单数据为模板假数据;AI 阶段接真模型后再恢复 */}
          <BookingModal />
          <CustomerOrders />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
