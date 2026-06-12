'use client'

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from 'next/link'

const categories = [
  {
  id: 1,
  key: "swedish",
  title: "Swedish Massage",
  description: "Relaxing full body massage to reduce stress and improve circulation.",
  icon: "💆",
  bgColor: "bg-[#F0F8E8]"
},

{
  id: 2,
  key: "deep_tissue",
  title: "Deep Tissue Massage",
  description: "Focused pressure to relieve muscle tension and chronic pain.",
  icon: "💪",
  bgColor: "bg-[#F5E6D8]"
},

{
  id: 3,
  key: "aromatherapy",
  title: "Aromatherapy Massage",
  description: "Essential oils combined with massage for complete relaxation.",
  icon: "🌿",
  bgColor: "bg-[#E8F4F8]"
},

{
  id: 4,
  key: "hot_stone",
  title: "Hot Stone Massage",
  description: "Heated stones help release deep tension and improve circulation.",
  icon: "🔥",
  bgColor: "bg-[#F8E8F0]"
},

{
  id: 5,
  key: "thai",
  title: "Thai Massage",
  description: "Traditional stretching techniques to restore flexibility and energy.",
  icon: "🧘",
  bgColor: "bg-white border border-[#2db83d]/20"
}
];

export default function CategoriesSection() {
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollAmount = 0;
    const scrollStep = 1;
    const scrollDelay = 50;

    const autoScroll = () => {
      if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
        scrollAmount = 0;
        scrollContainer.scrollLeft = 0;
      } else {
        scrollAmount += scrollStep;
        scrollContainer.scrollLeft = scrollAmount;
      }
    };

    const intervalId = setInterval(autoScroll, scrollDelay);

    const handleMouseEnter = () => clearInterval(intervalId);
    const handleMouseLeave = () => {
      const newIntervalId = setInterval(autoScroll, scrollDelay);
      return newIntervalId;
    };

    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', () => {
      clearInterval(intervalId);
      const newIntervalId = setInterval(autoScroll, scrollDelay);
    });

    return () => {
      clearInterval(intervalId);
      if (scrollContainer) {
        scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
        scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <section className="py-16 md:py-20 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-[#2db83d]/10 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-[#2db83d]" />
            <span className="font-sans text-sm text-[#2db83d] font-medium">Popular Services</span>
          </div>
          
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-[#0F0F0F]">Professional Massage</span>
            <br />
            <span className="text-[#2db83d]">Services</span>
          </h2>
          
          <p className="font-sans text-lg text-gray-600 max-w-2xl mx-auto">
            Choose from our most popular home massage treatments available across Metro Manila.
          </p>
        </motion.div>

        {/* Auto-Scrolling Categories */}
        <div className="relative">
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white via-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white to-transparent z-10 pointer-events-none" />
          
          {/* Scrollable Container */}
          <div 
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 cursor-pointer"
            style={{ 
              scrollBehavior: 'smooth',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {/* Duplicate categories for seamless loop */}
            {[...categories, ...categories].map((category, index) => (
              <Link 
                key={`${category.id}-${index}`} 
                href={`services?category=${category.key}`} 
                className="flex-shrink-0 w-80 group cursor-pointer"
              >
                <motion.div
                  initial={{ opacity: 0, y: 60, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.8, 
                    delay: (index % categories.length) * 0.1,
                    ease: "easeOut"
                  }}
                  viewport={{ once: true }}
                  className="h-full"
                >
                  <div className={`${category.bgColor} rounded-3xl p-6 h-full flex flex-col hover:shadow-xl transition-all duration-500 group-hover:-translate-y-2 min-h-[280px]`}>
                    {/* Icon */}
                    <div className="mb-6 text-[#8B6F3F] group-hover:text-[#2db83d] transition-colors duration-300">
                      {category.icon}
                    </div>
                    
                    {/* Content */}
                    <h3 className="font-serif text-2xl font-bold text-[#0F0F0F] mb-4 group-hover:text-[#2db83d] transition-colors duration-300 leading-tight">
                      {category.title}
                    </h3>
                    
                    <p className="font-sans text-gray-500 leading-relaxed mb-6 flex-grow">
                      {category.description}
                    </p>
                    
                    {/* Read More Button */}
                    <div className="flex items-center gap-2 font-sans text-sm font-medium text-gray-500 hover:text-[#2db83d] transition-colors duration-300 group mt-auto">
                      DISCOVER THE EXPERIENCE
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Manual Navigation Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="font-sans text-sm text-gray-400">
            Hover to pause • Auto-scrolling categories
          </p>
        </motion.div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
