
import type { Metadata } from "next";
import Navbar from "@/components/navbar"
import BookingModal from "@/components/BookingModal"
// 悬浮 WhatsApp 球已撤(老板 2026-07-21:别把要下单的人引去聊天),入口收进页脚社交图标。
import CustomerOrders from "@/components/CustomerOrders"
import ReviewWidget from "@/components/ReviewWidget"
import LoadingScreen from "@/components/LoadingScreen"
import MetaPixel from "@/components/MetaPixel"
import { Geist, Geist_Mono, Inter, Playfair_Display } from "next/font/google";
import SiteFooter from "@/components/global/SiteFooter";
import "./globals.css";
import "./global-site.css";
import React from "react";
import { Suspense } from "react";

import {Phone,
  Mail,
  Instagram,
  Facebook,
  Sparkles,
  MessageCircle,
  MapPin,} from "lucide-react";

  import SubscribeForm from "@/components/subscribe-form"
const gaSerif = Playfair_Display({
  variable: "--font-ga-serif",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const gaSans = Inter({
  variable: "--font-ga-sans",
  subsets: ["latin", "latin-ext"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EasyGo Spa | Premium Home Massage Service in Manila",
    template: "%s | EasyGo Spa",
  },
  description: "EasyGo Spa provides professional home massage services across Metro Manila. Book trusted therapists for hotel, condo and home massage treatments.",
  keywords: "home massage Manila, hotel massage Manila, Swedish massage, deep tissue massage, EasyGo Spa, mobile massage service",
  authors: [{ name: "EasyGo Spa" }],
  creator: "EasyGo Spa",
  publisher: "EasyGo Spa",
  openGraph: {
    title: "EasyGo Spa | Professional Home Massage in Manila",
    description: "Professional home massage services across Metro Manila. Book trusted therapists for hotel, condo and home visits.",
    url: "https://easygospa.com",
    siteName: "EasyGo Spa",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "EasyGo Spa",
      },
    ],
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EasyGo Spa | Home Massage Manila",
    description: "Book professional home massage services in Metro Manila.",
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
    google: "your-google-verification-code",
    // Meta 域名验证(老板 2026-07-20):证明 easygospa.com 归属,投流/像素的前置条件。
    other: {
      "facebook-domain-verification": "wk56gls7xghwf0rpfv57imh1zdp6ey",
    },
  },
  metadataBase: new URL("https://easygospa.com"),
  // 苹果手机会把页脚的公司注册号当电话自动加链接，页面对不上，整段重新渲染（2026-11-04 模拟器查到）。电话都是自己写的链接，不受影响
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {



  return (
    <html lang="en" className={`${gaSerif.variable} ${gaSans.variable}`} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 预热兜底:页面刚加载、React 还没接管时,带 data-open-booking 的按钮
            也能被这条原生监听接住(先记 flag,Navbar 挂载后补开弹窗)。 */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('[data-open-booking]'):null;if(t){window.__egOpenBooking=true;try{window.dispatchEvent(new CustomEvent('open-booking-modal'))}catch(err){}}});"
          }}
        />
        <MetaPixel/>
        <LoadingScreen/>
        <Suspense fallback={null}>
        <Navbar/>
        </Suspense>
        {children}
         {/* Footer */}
      <SiteFooter/>
      {/* Widgets/Modals */}
      {/* ChatBot 暂时下架:LLM 接口未接通,且菜单数据为模板假数据;AI 阶段接真模型后再恢复 */}
      <BookingModal/>
      <CustomerOrders/>
      </body>
    </html>
  );
}
