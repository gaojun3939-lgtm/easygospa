'use client';

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Head from "next/head";

import { ServiceCardImage, ServicePrices } from "./ServiceMenuParts";

// 2026-10-26 老板定:原来这里写死 6 张卡(其中 Thai Dry / Foot / Head and Shoulder 后台根本没有,
// 还带着 ₱2,500 这类假价字段)。现在卡片 = 后台「服务项目」里在售的项目,名字、介绍、三档价格都读后台,
// 跟下单页、/pricing 同一份;页面在服务端读好传进来(app/page.tsx)。

export default function ServicesSection({ services = [] }) {
  

  const handleServiceBooking = useCallback((service) => {
    // Dispatch custom event for booking modal
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-booking-modal-with-service', { 
        detail: { service } 
      }));
    }
  }, []);


  return (
    <>

      <div className="pt-20 md:pt-24  pb-20 bg-gradient-to-b from-[#F8F2EC] to-white min-h-screen relative">

        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            {/* 老板 2026-07-19:图标/字体加清晰,并做成可点按钮→直接打开技师墙。 */}
            <button
              type="button"
              data-open-booking="1"
              className="inline-flex items-center gap-2 bg-[#2db83d] rounded-full px-6 py-3 mb-6 shadow-md hover:bg-[#249c32] transition-colors"
            >
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
              <span className="text-lg font-semibold text-white">Our Services</span>
            </button>
            
            <h1 className="max-w-3xl mx-auto text-center flex flex-col justify-center font-serif font-bold text-[clamp(2.5rem,5vw,4rem)] text-[#0F0F0F] mb-6 leading-tight">
              <div>Home Massage Services</div> 
              
              <div className="text-[#2db83d]">Services in Metro Manila</div>
            </h1>
          </motion.div>

          {/* Services Grid */}
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)]">
            {services.map((service, index) => (
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
            <div className="bg-white">
              <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] font-bold text-[#0F0F0F] mb-4">
              </h2>
              {/* 老板 2026-07-19:原来是跳 /services 页,改成直接打开技师墙。 */}
              <button
                type="button"
                data-open-booking="1"
                className="bg-[#2db83d] text-white px-8 py-4 rounded-full font-medium hover:bg-[#45f248] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Book Massage Now
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}