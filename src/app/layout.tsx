
import type { Metadata } from "next";
import Navbar from "@/components/navbar"
import BookingModal from "@/components/BookingModal"
// 悬浮 WhatsApp 球已撤(老板 2026-07-21:别把要下单的人引去聊天),入口收进页脚社交图标。
import CustomerOrders from "@/components/CustomerOrders"
import ReviewWidget from "@/components/ReviewWidget"
import LoadingScreen from "@/components/LoadingScreen"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {



  return (
    <html lang="en">
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
        <LoadingScreen/>
        <Suspense fallback={null}>
        <Navbar/>
        </Suspense>
        {children}
         {/* Footer */}
      <footer
        className="bg-[#0F0F0F] text-white relative overflow-hidden"
        role="contentinfo"
      >
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F] via-[#1a1a1a] to-[#0F0F0F]"
          aria-hidden="true"
        />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[clamp(1rem,2vw,2.5rem)] text-center md:text-left">
            {/* Brand */}
            <div className="lg:col-span-1 flex flex-col items-center md:items-start mb-[1.2em]">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles
                  className="w-8 h-8 text-[#2db83d] sparkle-animation"
                  aria-hidden="true"
                />
                <div>
                  <h2 className="font-serif text-2xl font-bold glow-text">
                    EasyGo Spa
                  </h2>
                  <p className="text-xs text-[#2db83d] tracking-widest">
                    Professional Home Massage
                  </p>
                </div>
              </div>
              <p className="text-sm leading-[1.618] text-gray-300 mb-6">
                EasyGoSpa provides professional home massage services across Metro Manila. Book relaxing massage treatments at your hotel, condo, home, or office with trained and trusted therapists.
              </p>
              <div className="flex gap-4" role="list" aria-label="Social media links">
                <a
                  href="https://www.instagram.com/easygospa_services"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 bg-[#2db83d] rounded-full flex items-center justify-center hover:bg-[#45f248] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F]"
                  aria-label="Follow us on Instagram"
                  role="listitem"
                >
                  <Instagram className="w-5 h-5" aria-hidden="true" />
                </a>
                <a
                  href="https://web.facebook.com/easygospa"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 bg-[#2db83d] rounded-full flex items-center justify-center hover:bg-[#45f248] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F]"
                  aria-label="Follow us on Facebook"
                  role="listitem"
                >
                  <Facebook className="w-5 h-5" aria-hidden="true" />
                </a>
                <a
                  href="https://wa.me/639648570967?text=Hi%20EasyGoSpa%2C%20I%20would%20like%20to%20ask%20about%20a%20home%20massage%20booking."
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 bg-[#2db83d] rounded-full flex items-center justify-center hover:bg-[#45f248] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F]"
                  aria-label="Chat with EasyGoSpa on WhatsApp"
                  role="listitem"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Services */}
            <div className="mb-[1.2em]">
              <h3 className="font-serif text-lg font-semibold mb-6 text-[#2db83d]">
                Popular Treatments
              </h3>
              <nav aria-label="Services navigation">
                <ul className="space-y-3 text-sm">
                  <li>
                    <a
                      href="#"
                      className="text-gray-300 hover:text-[#2db83d] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F] rounded"
                    >
                      Swedish Massage
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-300 hover:text-[#2db83d] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F] rounded"
                    >
                      Combination Massage
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-300 hover:text-[#2db83d] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F] rounded"
                    >
                      Deep Tissue Massage
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-300 hover:text-[#2db83d] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F] rounded"
                    >
                      Traditional Hilot
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-300 hover:text-[#2db83d] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F] rounded"
                    >
                      Couple Massage
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-300 hover:text-[#2db83d] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F] rounded"
                    >
                      Home & Hotel Massage
                    </a>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Contact */}
            <div className="mb-[1.2em]">
              <h3 className="font-serif text-lg font-semibold mb-6 text-[#2db83d]">
                Contact EasyGoSpa
              </h3>
              <address className="space-y-4 text-sm flex flex-col items-center md:items-start not-italic">
                <div className="flex items-start gap-3">
                  <Sparkles
                    className="w-5 h-5 text-[#2db83d] mt-0.5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <a
                    href="https://www.easygospa.com/"
                    className="text-gray-300 hover:text-[#2db83d] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F] rounded"
                  >
                    Website: https://www.easygospa.com/
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin
                    className="w-5 h-5 text-[#2db83d] mt-0.5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-gray-300 leading-[1.618]">
                    Service Area: Metro Manila<br />
                    Metro Manila Home Service<br />
                    Available in selected areas across Metro Manila
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#2db83d]" aria-hidden="true" />
                  <a
                    href="tel:+63 964 857 0967"
                    className="text-gray-300 hover:text-[#2db83d] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F] rounded"
                  >
                    Phone: +63 964 857 0967
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-[#2db83d]" aria-hidden="true" />
                  <a
                    href="https://wa.me/639648570967?text=Hi%20EasyGoSpa%2C%20I%20would%20like%20to%20ask%20about%20a%20home%20massage%20booking."
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-300 hover:text-[#2db83d] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F] rounded"
                  >
                    WhatsApp: +63 964 857 0967
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#2db83d]" aria-hidden="true" />
                  <a
                    href="mailto:services@easygospa.com"
                    className="text-gray-300 hover:text-[#2db83d] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F] rounded"
                  >
                    Email: services@easygospa.com
                  </a>
                </div>
              </address>
            </div>

            {/* Newsletter */}
            <div className="mb-[1.2em]">
              <h3 className="font-serif text-lg font-semibold mb-6 text-[#2db83d]">
                Special Offers
              </h3>
              <p className="text-sm text-gray-300 mb-4 leading-[1.618]">
                Follow us on Facebook for promotions, discounts, and home massage service updates.
              </p>
              <SubscribeForm/>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © 2026 EasyGo Spa. All rights reserved.
            </p>
            <nav aria-label="Legal links">
              <div className="flex gap-6 text-sm">
                <a
                  href="/privacy-policy"
                  className="text-gray-400 hover:text-[#2db83d] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F] rounded"
                >
                  Privacy Policy
                </a>
                <a
                  href="/terms-of-service"
                  className="text-gray-400 hover:text-[#2db83d] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F] rounded"
                >
                  Terms of Service
                </a>
              </div>
            </nav>
          </div>
        </div>
      </footer>
      {/* Widgets/Modals */}
      {/* ChatBot 暂时下架:LLM 接口未接通,且菜单数据为模板假数据;AI 阶段接真模型后再恢复 */}
      <BookingModal/>
      <CustomerOrders/>
      </body>
    </html>
  );
}
