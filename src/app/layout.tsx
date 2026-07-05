
import type { Metadata } from "next";
import Navbar from "@/components/navbar"
import ChatBot from "@/components/ChatBot"
import BookingModal from "@/components/BookingModal"
import ReviewWidget from "@/components/ReviewWidget"
import LoadingScreen from "@/components/LoadingScreen"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from "react";
import { Suspense } from "react";

import Link from "next/link";
import {Phone,
  Mail,
  Instagram,
  Facebook,
  Sparkles,
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
        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/287fd6130_13.jpg?w=1200&q=90",
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
    images: ["https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/287fd6130_13.jpg?w=1200&q=90"],
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
                  href="#"
                  className="w-10 h-10 bg-[#2db83d] rounded-full flex items-center justify-center hover:bg-[#45f248] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F]"
                  aria-label="Follow us on Instagram"
                  role="listitem"
                >
                  <Instagram className="w-5 h-5" aria-hidden="true" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-[#2db83d] rounded-full flex items-center justify-center hover:bg-[#45f248] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F]"
                  aria-label="Follow us on Facebook"
                  role="listitem"
                >
                  <Facebook className="w-5 h-5" aria-hidden="true" />
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
                    href="tel:+639171098079"
                    className="text-gray-300 hover:text-[#2db83d] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F] rounded"
                  >
                    Phone / WhatsApp: +63 917 109 8079
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#2db83d]" aria-hidden="true" />
                  <a
                    href="mailto:easygospa@gmail.com"
                    className="text-gray-300 hover:text-[#2db83d] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F] rounded"
                  >
                    Email: easygospa@gmail.com
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
                Get promotions, discounts, and home massage service updates.
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
                <Link
                  href={"/sitemap"}
                  className="text-gray-400 hover:text-[#2db83d] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F] rounded"
                >
                  Sitemap
                </Link>
                <a
                  href="#"
                  className="text-gray-400 hover:text-[#2db83d] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F] rounded"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
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
      <ChatBot />
      
      <BookingModal/>
      </body>
    </html>
  );
}
