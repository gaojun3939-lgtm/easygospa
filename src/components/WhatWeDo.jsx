
import React from "react";
import { motion } from "framer-motion";
import { Shield, Leaf, Award, Heart } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Verified Therapists",
    description:
      "Professionally trained and carefully screened therapists."
  },
  {
    icon: Leaf,
    title: "Fast Arrival",
    description:
      "Quick therapist dispatch across Metro Manila."
  },
  {
    icon: Award,
    title: "Safe & Private",
    description:
      "Enjoy massage services in your hotel, condo, or home."
  },
  {
    icon: Heart,
    title: "24/7 Booking",
    description:
      "Book your session anytime through EasyGo Spa."
  }
];

const LeafDecoration = () => (
  <motion.svg 
    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
    whileInView={{ opacity: 0.6, rotate: 0, scale: 1 }}
    transition={{ duration: 2, ease: "easeOut" }}
    viewport={{ once: true }}
    width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#2db83d]"
  >
    <path d="M10 40C15 20 35 10 50 15C55 17 60 22 65 30" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
    <path d="M50 15C52 12 58 8 65 12C70 15 75 22 80 35" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
    <path d="M65 30C68 25 75 20 85 25C90 28 95 35 100 50" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
    <path d="M20 50C25 45 35 40 45 45C50 48 55 55 60 70" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
    <path d="M45 45C48 42 55 38 65 42C70 45 75 52 80 65" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
    <ellipse cx="25" cy="35" rx="8" ry="12" fill="currentColor" opacity="0.3" transform="rotate(-30 25 35)"/>
    <ellipse cx="55" cy="25" rx="6" ry="10" fill="currentColor" opacity="0.3" transform="rotate(-45 55 25)"/>
    <ellipse cx="75" cy="45" rx="7" ry="11" fill="currentColor" opacity="0.3" transform="rotate(-60 75 45)"/>
    <ellipse cx="35" cy="55" rx="5" ry="9" fill="currentColor" opacity="0.3" transform="rotate(-20 35 55)"/>
  </motion.svg>
);

export default function WhatWeDo() {
  return (
    <section className="py-16 md:py-20 lg:py-24 bg-white relative overflow-hidden">
      {/* Enhanced Background Decorations */}
      <motion.div 
        initial={{ opacity: 0, x: -200, rotate: -45 }}
        whileInView={{ opacity: 0.2, x: 0, rotate: 0 }}
        transition={{ duration: 2, ease: "easeOut" }}
        viewport={{ once: true }}
        className="absolute top-10 left-10"
      >
        <LeafDecoration />
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, x: 200, rotate: 45 }}
        whileInView={{ opacity: 0.2, x: 0, rotate: 180 }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
        viewport={{ once: true }}
        className="absolute bottom-10 right-10 transform"
      >
        <LeafDecoration />
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.8 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", type: "spring", stiffness: 100 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.p 
            initial={{ opacity: 0, letterSpacing: "0.1em" }}
            whileInView={{ opacity: 1, letterSpacing: "0.3em" }}
            transition={{ duration: 1, delay: 0.3 }}
            viewport={{ once: true }}
            className="font-sans text-sm text-gray-500 mb-4 tracking-wider uppercase"
          >
            PROFESSIONAL HOME MASSAGE
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 50, skewX: 10 }}
            whileInView={{ opacity: 1, y: 0, skewX: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            viewport={{ once: true }}
            className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-[#0F0F0F] leading-tight mb-6"
          >
            EasyGo Spa Home Massage<br />
            <motion.span 
              initial={{ opacity: 0, scale: 0.5, color: "#2db83d" }}
              whileInView={{ opacity: 1, scale: 1, color: "#2db83d" }}
              transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
              className="text-[#2db83d]"
            >
              Professional Service You Can Trust
            </motion.span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30, filter: 'blur(5px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 1, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed"
          >
            EasyGo Spa provides professional home massage services across Metro Manila.

Our experienced therapists travel directly to your hotel, condo, or residence, delivering relaxing and wellness-focused treatments in the comfort of your own space.

Fast booking, verified therapists, and reliable service make EasyGo Spa one of the most convenient home massage platforms in Metro Manila.
          </motion.p>
        </motion.div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Image */}
          <motion.div
            initial={{ opacity: 0, x: -150, rotate: -15, scale: 0.7 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut", type: "spring", stiffness: 80 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="lg:col-span-3 flex justify-center lg:justify-start"
          >
            <motion.div 
              whileHover={{ boxShadow: "0 30px 60px rgba(200, 168, 130, 0.3)" }}
              className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full overflow-hidden shadow-lg"
            >
              <img
                src="/images/brand/home-trust-therapist.webp"
                alt="A serene, luxurious organic spa treatment room at EasyGo Spa Wellness Center in Metro Manila, designed for ultimate relaxation."
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
              />
            </motion.div>
          </motion.div>

          {/* Center Features */}
          <div className="lg:col-span-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ 
                    opacity: 0, 
                    y: 100, 
                    scale: 0.7,
                    rotateX: index % 2 === 0 ? 45 : -45,
                    rotateY: index % 2 === 0 ? -20 : 20
                  }}
                  whileInView={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    rotateX: 0,
                    rotateY: 0
                  }}
                  transition={{ 
                    duration: 1.5, 
                    delay: index * 0.2,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    scale: 1.08, 
                    y: -10,
                    rotateZ: index % 2 === 0 ? 2 : -2,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                  }}
                  className="flex items-start gap-4 group cursor-pointer"
                >
                  {/* Icon */}
                  <motion.div 
                    initial={{ scale: 0, rotate: -360 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      duration: 1, 
                      delay: index * 0.2 + 0.3,
                      type: "spring",
                      stiffness: 300
                    }}
                    viewport={{ once: true }}
                    whileHover={{ 
                      rotate: 180, 
                      scale: 1.3,
                      backgroundColor: "#2db83d"
                    }}
                    className="w-12 h-12 bg-[#F5E6D8] rounded-full flex items-center justify-center group-hover:bg-[#2db83d] transition-all duration-500"
                  >
                    <feature.icon className="w-6 h-6 text-[#2db83d] group-hover:text-white transition-colors duration-300" />
                  </motion.div>
                  
                  {/* Content */}
                  <div>
                    <motion.h3 
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.8, delay: index * 0.2 + 0.5 }}
                      viewport={{ once: true }}
                      className="font-serif text-xl font-bold text-[#0F0F0F] mb-2 group-hover:text-[#2db83d] transition-colors duration-300"
                    >
                      {feature.title}
                    </motion.h3>
                    <motion.p 
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.2 + 0.7 }}
                      viewport={{ once: true }}
                      className="font-sans text-sm text-gray-600 leading-relaxed"
                    >
                      {feature.description}
                    </motion.p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, x: 150, rotate: 15, scale: 0.7 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut", type: "spring", stiffness: 80, delay: 0.3 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="lg:col-span-3 flex justify-center lg:justify-end"
          >
            <motion.div 
              whileHover={{ boxShadow: "0 30px 60px rgba(255, 92, 141, 0.3)" }}
              className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full overflow-hidden shadow-lg"
            >
              <img
                src="/images/brand/home-trust-setup.webp"
                alt="A tranquil premium organic spa massage room, showcasing natural elements at EasyGo Spa, Metro Manila's leading luxury wellness destination."
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 1.5, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <motion.button 
            whileHover={{ scale: 1.1, boxShadow: "0 20px 40px rgba(200, 168, 130, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal'))}
            className="bg-gradient-to-r from-[#2db83d] to-[#45f248] text-white px-8 py-4 rounded-full font-sans font-semibold hover:from-[#45f248] hover:to-[#2db83d] transition-all duration-300 shadow-lg text-lg"
          >
            Book Massage Now
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
