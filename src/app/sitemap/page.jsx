'use client';

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, Home, ArrowRight } from "lucide-react";

// 2026-10-26 老板定(重新申请 Xendit 前全站清模板残留):原来列着 Gallery / Our Team(假页面,已下线)
// 和美容、激光脱毛、美甲、美发、Japanese Head Spa(我们没有)。现在只列真页面和后台在售的 6 个按摩项目,
// 项目名照后台原样,点了去价目表;后台改名 / 加项目时这里要跟着改。
const sitePages = [
  {
    category: "Main Pages",
    icon: Home,
    pages: [
      { name: "Home", url: "/", description: "Professional home massage across Metro Manila" },
      { name: "Services", url: "/services", description: "All massage treatments with prices" },
      { name: "Pricing", url: "/pricing", description: "Prices for every treatment and duration" },
      { name: "Contact", url: "/contact", description: "Phone, WhatsApp, email and service area" },
      { name: "Terms of Service", url: "/terms-of-service", description: "Booking, payment, cancellation and refund rules" },
      { name: "Privacy Policy", url: "/privacy-policy", description: "How we handle your personal information" }
    ]
  },
  {
    category: "Massage Treatments",
    icon: Sparkles,
    pages: [
      { name: "Deep tissue", url: "/pricing", description: "Firm, targeted pressure for chronic muscle tension" },
      { name: "Hot Stone Massage", url: "/pricing", description: "Warm stones and soothing massage to relax tight muscles" },
      { name: "Relaxing Premium Aromatherapy Body Massage", url: "/pricing", description: "Gentle massage with natural essential oils" },
      { name: "Shiatsu Massage(without Oil)", url: "/pricing", description: "Traditional Japanese finger and palm pressure, no oil" },
      { name: "Swedish Massage", url: "/pricing", description: "Gentle full-body massage with oil, great for beginners" },
      { name: "Thai Body Massage", url: "/pricing", description: "Oil-free deep pressure with full-body stretching" }
    ]
  }
];

export default function Sitemap() {
  return (
    <div className="pt-32 pb-24 bg-gradient-to-b from-[#F8F2EC] to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-[#2db83d]/10 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-[#2db83d]" />
            <span className="text-sm font-medium">Site Navigation</span>
          </div>
          
          <h1 className="font-serif font-medium text-[length:var(--font-h1)] text-[#0F0F0F] mb-6 leading-tight">
            EasyGo Spa Website Sitemap
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-[1.618]">
            Find every page of the EasyGoSpa website in one place.
          </p>
        </motion.div>

        {/* Sitemap Grid */}
        <div className="space-y-12">
          {sitePages.map((section, sectionIndex) => (
            <motion.div
              key={section.category}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.8, 
                delay: sectionIndex * 0.2,
                ease: "easeOut"
              }}
              className="bg-white rounded-3xl p-8 shadow-lg border border-[#2db83d]/20"
            >
              {/* Section Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#2db83d]/10 rounded-2xl flex items-center justify-center">
                  <section.icon className="w-6 h-6 text-[#2db83d]" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-[#0F0F0F]">
                  {section.category}
                </h2>
              </div>

              {/* Pages Grid */}
              <div className="grid lg:grid-cols-2 gap-6">
                {section.pages.map((page, pageIndex) => (
                  <motion.div
                    key={page.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: sectionIndex * 0.2 + pageIndex * 0.1
                    }}
                    className="group"
                  >
                    <Link
                      href={page.url}
                      className="block p-6 bg-gray-50 rounded-2xl hover:bg-[#2db83d]/5 transition-all duration-300 hover:shadow-md group-hover:border-[#2db83d]/30 border border-transparent"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-serif text-lg font-bold text-[#0F0F0F] group-hover:text-[#2db83d] transition-colors duration-300">
                          {page.name}
                        </h3>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#2db83d] group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      
                      <p className="text-gray-600 text-sm leading-relaxed mb-3">
                        {page.description}
                      </p>
                      
                      <div className="text-xs font-mono text-[#2db83d] bg-[#2db83d]/10 px-3 py-1 rounded-full inline-block">
                        {page.url}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* SEO Information */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 bg-white rounded-3xl p-8 shadow-lg border border-[#2db83d]/20"
        >
          <h2 className="font-serif text-2xl font-bold text-[#0F0F0F] mb-6 text-center">
            About Our Website
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2db83d] mb-3">
                Website Features
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Responsive design for all devices</li>
                <li>• Online booking — choose your own therapist</li>
                <li>• Service menu with prices</li>
                <li>• Order tracking</li>
                <li>• Contact and service area information</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2db83d] mb-3">
                Registered Office
              </h3>
              {/* 原来是建站模板的假地址(P-145, Sector A…1229),换成跟页脚一致的公司注册地址 */}
              <div className="text-gray-600 space-y-1">
                <p>EASYGOSPA HOME MASSAGE SERVICES OPC</p>
                <p>Unit 706, Medical Towers Makati, 103 Rufino Street,</p>
                <p>Legazpi Village, Bel-Air, Makati City, Metro Manila 1209</p>
                <p>Home service only — our therapists come to you.</p>
                <p className="mt-3 font-medium">Phone: +63 964 857 0967</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-br from-[#2db83d] to-[#45f248] rounded-3xl p-12 text-white">
            <h2 className="font-serif text-3xl font-bold mb-4">
              Ready to Experience EasyGo Spa?
            </h2>
            <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
              Book your appointment today — choose your therapist and pay in cash when they arrive.
            </p>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal'))}
              className="bg-white text-[#2db83d] px-8 py-4 rounded-full font-medium hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Book Your Experience
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}