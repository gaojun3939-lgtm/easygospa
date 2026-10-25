'use client';

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

import { ServiceCardImage, ServicePrices } from "./ServiceMenuParts";

// 2026-10-26 老板定:跟首页服务区一样,卡片 = 后台在售项目 + 每档价格(app/services/page.jsx 服务端读好传进来)。
// 原来写死的 6 张卡(含后台没有的项目和假价字段)已删。

const categories = [
  { key: "all", name: "All Services" },
  { key: "massage", name: "Massage Therapy" },
  
];

export default function ServicesPage({ services = [] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl && categories.some(cat => cat.key === categoryFromUrl)) {
      setActiveFilter(categoryFromUrl);
    }
  }, [searchParams]);

  const filteredServices = useMemo(() => {
    // 后台分类写的是「Massage」,网址参数是小写 massage,比较时统一小写
    return activeFilter === "all" 
      ? services 
      : services.filter(service => String(service.category || '').toLowerCase() === activeFilter);
  }, [activeFilter, services]);

  const handleServiceBooking = useCallback((service) => {
    // Dispatch custom event for booking modal
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-booking-modal-with-service', { 
        detail: { service } 
      }));
    }
  }, []);

  const handleFilterChange = useCallback((filterKey) => {
    setActiveFilter(filterKey);
    
    // Update URL without page reload
    const newUrl = filterKey === 'all' 
      ? '/services' 
      : `/services?category=${filterKey}`;
    
    router.push(newUrl, { scroll: false });
  }, [router]);

  return (
    <>

      <div className="pt-32 pb-24 bg-gradient-to-b from-[#F8F2EC] to-white min-h-screen relative">
        <div style={{backgroundImage:'url(/images/young-woman-hero2.jpg)'}} className="inset-0 w-full h-80 bg-center bg-cover bg-no-repeat bg-fixed -mt-70">
      <div className="inset-0 w-full h-full bg-black/70 flex items-center justify-center">
      </div>
        </div>

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
              <span className="text-lg font-medium text-[#0F0F0F]">Our Services</span>
            </div>
            
            <h1 className="font-serif font-medium text-[clamp(2.5rem,5vw,4rem)] text-[#0F0F0F] mb-6 leading-tight">
              Premium Home Massage Services in Metro Manila
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-[1.618]">
              Professional massage at your home, condo or hotel across Metro Manila. Every treatment and
              price is listed below — no transport fee, no tips.
            </p>
          </motion.div>

          {/* 老板 2026-07-19:去掉"Massage Therapy"分类筛选;服务本就全是按摩,
              整条筛选无意义,直接移除(默认展示全部服务)。 */}

          {/* Services Grid */}
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)]">
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                whileHover={{ scale: 1.03, y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                className="group bg-white rounded-3xl overflow-hidden shadow-lg will-change-transform"
              >
                {/* Service Image */}
                <div className="relative h-64 overflow-hidden">
                  <ServiceCardImage service={service} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                </div>

                {/* Service Content */}
                <div className="p-6">
                  <h3 className="font-serif text-xl font-bold text-[#0F0F0F] mb-3 group-hover:text-[#2db83d] transition-colors duration-300">
                    {service.name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {service.description}
                  </p>
                  <ServicePrices options={service.durationOptions} className="mb-4" />
                  <button 
                    onClick={() => handleServiceBooking(service)}
                    className="w-full bg-[#2db83d]/10 text-[#2db83d] py-3 rounded-full font-medium hover:bg-[#2db83d] hover:text-white transition-all duration-300 group-hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    Book Now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mt-16"
          >
            <div className="bg-white rounded-3xl p-12 shadow-lg border border-[#2db83d]/20">
              <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] font-bold text-[#0F0F0F] mb-4">
                Ready for Your Transformation?
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-[1.618]">
                Book your appointment today — choose your therapist and pay in cash when they arrive.
              </p>
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('open-booking-modal'));
                  }
                }}
                className="bg-[#2db83d] text-white px-8 py-4 rounded-full font-medium hover:bg-[#45f248] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Book Your Experience
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}