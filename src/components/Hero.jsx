'use client'
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star, ArrowRight, MapPin, Users, Award } from "lucide-react";

const slides = [
  {
    id: 1,
    image_url: "/images/brand/home-hero-01-desktop.webp",
    mobile_image_url: "/images/brand/home-hero-01-mobile.webp",
    headline: "24/7 Home Massage in Metro Manila",
    subheading: "Professional Massage Service Available 24/7",
    description: "Professional massage therapists available for hotel, condo and home service across Metro Manila. Fast arrival, professional service and available 24 hours a day.",
    cta_text: "BOOK NOW",
    isH1: true,
  },
  {
    id: 2,
    image_url: "/images/young-woman-hero1.jpg",
    headline: "24/7 Hotel Massage Service",
    subheading: "Fast Arrival Across Metro Manila",
    description: "Enjoy professional hotel massage service with experienced therapists. Available day and night throughout Metro Manila.",
    cta_text: "VIEW SERVICES",
    isH1: false,
  },
  {
    id: 3,
    image_url: "/images/young-woman-hero.jpg",
    headline: "Professional Female Therapists",
    subheading: "Comfort, Privacy and Professional Care",
    description: "Choose from Swedish Massage, Deep Tissue Massage, Relaxation Massage and other wellness treatments delivered to your location.",
    cta_text: "BOOK MASSAGE TODAY",
    isH1: false,
  }
];

// Trust indicators data
const trustIndicators = [
  { icon: Users, text: "24/7 Available", color: "text-white" },
  { icon: Award, text: "Verified Therapists", color: "text-[#2db83d]" },
  { icon: MapPin, text: "Metro Manila Coverage", color: "text-white" }
];

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (slideIndex) => {
    setCurrentIndex(slideIndex);
  };

  const currentSlide = slides[currentIndex];

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Images with Super Responsive Design */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        >
          <picture className="block w-full h-full">
            {currentSlide.mobile_image_url && (
              <source
                media="(max-width: 767px)"
                srcSet={currentSlide.mobile_image_url}
              />
            )}
            <img
              src={currentSlide.image_url}
              alt={`EasyGo Spa Home Massage Manila - ${currentSlide.headline}`}
              className="w-full h-full object-cover object-center"
              style={{
                objectPosition: 'center center',
                objectFit: 'cover',
                width: '100%',
                height: '100%',
                minHeight: '100vh',
                maxWidth: '100vw'
              }}
            />
          </picture>
        </motion.div>
      </AnimatePresence>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent z-10" />

      {/* Content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 md:pt-40 pb-16 sm:pb-20">
        <div className="w-full max-w-6xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-white space-y-6 sm:space-y-8"
            >
              {/* Main Headline - Enhanced Glow Effect */}
              {currentSlide.isH1 ? (
                <h1 className="font-serif font-medium leading-[1.1] text-white text-[clamp(1rem,5vw,3rem)]">
                  {currentSlide.headline}
                  {/* <br />
                  <span className="block text-[#2db83d] enhanced-glow-text mt-4 sm:mt-6 text-[0.85em]">
                    {currentSlide.subheading}
                  </span> */}
                </h1>
              ) : (
                <h2 className="font-serif font-medium leading-[1.1] text-white text-[clamp(1rem,5vw,3rem)]">
                  {currentSlide.headline}
                  {/* <br />
                  <span className="block text-[#2db83d] enhanced-glow-text mt-4 sm:mt-6 text-[0.85em]">
                    {currentSlide.subheading}
                  </span> */}
                </h2>
              )}

              {/* Description - Responsive Text */}
              <p className="text-gray-100 text-[clamp(1.125rem,4vw,1.5rem)] font-light leading-relaxed max-w-4xl">
                {currentSlide.description}
              </p>
              
              {/* Trust Indicators - Responsive Layout */}
              <div className="flex flex-wrap gap-4 sm:gap-6 pt-2 sm:pt-4">
                {trustIndicators.map((indicator, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="flex items-center gap-2"
                  >
                    <indicator.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${indicator.color}`} />
                    <span className="text-xs sm:text-sm font-medium text-white/90">{indicator.text}</span>
                  </motion.div>
                ))}
              </div>
              
              {/* CTA Buttons - Super Responsive */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 sm:pt-6">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal'))}
                  className="group bg-gradient-to-r from-[#2db83d] to-[#45f248] text-white px-6 sm:px-8 lg:px-10 py-4 sm:py-5 rounded-full font-sans font-semibold text-sm sm:text-base lg:text-lg hover:from-[#45f248] hover:to-[#2db83d] transition-all duration-500 hover:scale-105 shadow-2xl hover:shadow-[#2db83d]/30 flex items-center justify-center gap-2 sm:gap-3 min-h-[48px] sm:min-h-[56px] lg:min-h-[60px] w-full sm:w-auto"
                >
                  <span className="text-center leading-tight">
                    {currentSlide.cta_text}
                  </span>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform duration-300 flex-shrink-0" />
                </button>
                
                <button
                  onClick={() => window.location.href = 'tel:+63 917 109 8079'}
                  className="group bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-6 sm:px-8 py-4 sm:py-5 rounded-full font-sans font-semibold text-sm sm:text-base lg:text-lg hover:bg-white hover:text-[#0F0F0F] transition-all duration-500 flex items-center justify-center gap-2 sm:gap-3 min-h-[48px] sm:min-h-[56px] lg:min-h-[60px] w-full sm:w-auto"
                >
                  <span className="whitespace-nowrap">Call Now: +63 917 109 8079</span>
                </button>
              </div>

              {/* Urgency Element - Responsive */}
              {/* <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 max-w-sm sm:max-w-md border border-[#2db83d]/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#2db83d] flex-shrink-0" />
                  <span className="text-[#2db83d] font-medium text-xs sm:text-sm">LIMITED TIME OFFER</span>
                </div>
                <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                  Book today and receive a complimentary organic facial add-on worth $2,500
                </p>
              </motion.div> */}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Dots - Responsive Positioning */}
      <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-2 sm:gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
              currentIndex === index ? "bg-white scale-125" : "bg-white/50 hover:bg-white"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Enhanced CSS for perfect responsiveness and a subtle, faded glow effect */}
      <style jsx>{`
  .enhanced-glow-text {
    /* Softer green glow */
    text-shadow: 
      0 0 5px rgba(144, 238, 144, 0.6),   /* LightGreen */
      0 0 15px rgba(34, 139, 34, 0.4);    /* ForestGreen */
    filter: drop-shadow(0 0 4px rgba(0, 100, 0, 0.3)); /* DarkGreen */
  }
  
  @media (max-width: 640px) {
    .enhanced-glow-text {
      text-shadow: 
        0 0 3px rgba(152, 251, 152, 0.7),  /* PaleGreen */
        0 0 8px rgba(0, 128, 0, 0.4);      /* Standard Green */
      filter: drop-shadow(0 0 2px rgba(46, 139, 87, 0.4)); /* SeaGreen */
    }
  }
  
  @media (min-width: 641px) and (max-width: 1024px) {
    .enhanced-glow-text {
      text-shadow: 
        0 0 4px rgba(50, 205, 50, 0.6),    /* LimeGreen */
        0 0 12px rgba(0, 128, 0, 0.4);     /* Green */
      filter: drop-shadow(0 0 3px rgba(0, 100, 0, 0.3)); /* DarkGreen */
    }
  }
  
  @media (min-width: 1025px) {
    .enhanced-glow-text {
      /* Re-apply desktop styles */
      text-shadow: 
        0 0 5px rgba(144, 238, 144, 0.6),   /* LightGreen */
        0 0 15px rgba(34, 139, 34, 0.4);    /* ForestGreen */
      filter: drop-shadow(0 0 4px rgba(0, 100, 0, 0.3)); /* DarkGreen */
    }
  }
`}</style>

    </section>
  );
}
