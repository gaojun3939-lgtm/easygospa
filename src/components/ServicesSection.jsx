'use client';

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Head from "next/head";
import Link from "next/link";

// Complete EasyGo Spa Service Menu with SEO-optimized alt text and optimized image URLs
const servicesData = [
  // Massage Services
  {
    id: 1,
    name: "Swedish Massage",
    category: "massage",
    description: "Indulge in a timeless classic at Manila's premier wellness destination. Our Swedish Massage utilizes masterful, flowing strokes and gentle kneading to dissolve muscle tension, enhance circulation, and guide you to a state of profound relaxation. This is the perfect introduction to therapeutic massage, meticulously performed by our certified therapists in Metro Manila to restore your body's natural harmony.",
    price: 2500,
    duration: "60 min",
    image_url: "/images/brand/service-previews/service-swedish-preview.webp",
    alt_text: "Professional Swedish massage therapy session at EasyGo Spa luxury spa in Metro Manila - premium relaxation treatment"
  },
  {
    id: 2,
    name: "Hot Stone Massage",
    category: "massage",
    description: "A relaxing massage using warm stones and gentle techniques to ease muscle tension, improve comfort, and support deep relaxation.",
    price: 3500,
    duration: "90 min",
    image_url: "/images/brand/service-previews/service-hot-stone-preview.webp",
    alt_text: "Hot stone massage with warm basalt stones for professional home massage service in Metro Manila"
  },
  {
    id: 3,
    name: "Thai Dry Massage",
    category: "massage", 
    description: "Experience the ancient art of healing with our authentic Thai Dry Massage in Metro Manila. This traditional, oil-free therapy combines rhythmic acupressure, gentle rocking, and assisted yoga stretches to unblock energy pathways, improve flexibility, and relieve deep-seated tension. Let our expert therapists guide your body into a state of blissful release and renewed vitality.",
    price: 3000,
    duration: "75 min",
    image_url: "/images/brand/service-previews/service-thai-dry-preview.webp",
    alt_text: "Traditional Thai dry massage therapy with acupressure and yoga stretches at EasyGo Spa Metro Manila"
  },
  {
    id: 4,
    name: "Foot Massage",
    category: "massage",
    description: "Revitalize your entire being from the ground up with our specialized Foot Massage. This ancient reflexology-based treatment targets key pressure points in your feet that correspond to different organs and systems in the body. Alleviate fatigue, reduce stress, and promote overall wellness in the comfort of your own space.",
    price: 1500,
    duration: "45 min", 
    image_url: "/images/brand/service-previews/service-foot-preview.webp",
    alt_text: "Relaxing foot reflexology massage therapy at EasyGo Spa luxury wellness center in Metro Manila"
  },
  {
    id: 5,
    name: "Head and Shoulder Massage",
    category: "massage",
    description: "Melt away the stresses of modern life with our targeted Head and Shoulder Massage. This concentrated therapy focuses on the high-tension areas of your neck, shoulders, and scalp, providing immediate relief from headaches, stiffness, and digital fatigue. It's the ultimate quick escape to tranquility, offered from the best home massage team in Metro Manila.",
    price: 1200,
    duration: "30 min",
    image_url: "/images/brand/service-previews/service-head-shoulder-preview.webp",
    alt_text: "Therapeutic head and shoulder massage for stress relief at EasyGo Spa premium spa in Metro Manila"
  },
  {
    id: 6,
    name: "Deep Tissue Massage",
    category: "massage",
    description: "For those seeking powerful relief from chronic pain and muscle tightness, our Deep Tissue Massage is the definitive solution. Our highly skilled therapists use slow, deliberate strokes and deep pressure to target the inner layers of your muscles and connective tissues. Ideal for athletes and individuals with persistent knots, this is a truly transformative treatment.",
    price: 3500,
    duration: "60 min",
    image_url: "/images/brand/service-previews/service-deep-tissue-preview.webp",
    alt_text: "Deep tissue massage therapy for chronic pain relief at EasyGo Spa luxury spa - professional treatment in Metro Manila"
  },
];

const categories = [
  { key: "all", name: "All Services" },
  { key: "massage", name: "Massage Therapy" },
  
];

export default function ServicesSection() {
  

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
              onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal'))}
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
            {servicesData.slice(0, 6).map((service, index) => (
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
                  <img
                    src={service.image_url}
                    alt={service.alt_text}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                    decoding="async"
                  />
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
              <Link
                href="/services" 
                
                className="bg-[#2db83d] text-white px-8 py-4 rounded-full font-medium hover:bg-[#45f248] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                                Book Massage Now
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}