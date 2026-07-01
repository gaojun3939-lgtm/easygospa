'use client';

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, ArrowRight, Sparkles } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Head from "next/head";

// Complete EasyGo Spa Service Menu with SEO-optimized alt text and optimized image URLs
const servicesData = [
  // Massage Services
  {
    id: 1,
    name: "Swedish Massage",
    category: "massage",
    description: "Indulge in a timeless classic at Metro Manila's premier wellness destination. Our Swedish Massage utilizes masterful, flowing strokes and gentle kneading to dissolve muscle tension, enhance circulation, and guide you to a state of profound relaxation. This is the perfect introduction to therapeutic massage, meticulously performed by our certified therapists in Ho to restore your body's natural harmony.",
    price: 2500,
    duration: "60 min",
    image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/77609c815_image.png?w=600&q=80",
    alt_text: "Professional Swedish massage therapy session at EasyGo Spa luxury spa in Metro Manila - premium relaxation treatment"
  },
  {
    id: 2,
    name: "Japanese Head Spa",
    category: "massage",
    description: "Embark on a transcendent sensory journey with our state-of-the-art Japanese Head Spa. Submerge your senses in a sanctuary of tranquility as a therapeutic waterfall, enriched with potent organic elixirs, bathes your scalp and hair under the ethereal glow of chromotherapy lighting. This is not merely a treatment—it is a meticulous ritual designed to detoxify the scalp, restore hair vitality, and guide you to a state of profound, meditative calm.",
    price: 3500,
    duration: "90 min",
    image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/ddade6f79_image.png?w=600&q=80",
    alt_text: "Japanese Head Spa waterfall treatment with chromotherapy lighting at EasyGo Spa Ho salon - luxury scalp therapy"
  },
  {
    id: 3,
    name: "Thai Dry Massage",
    category: "massage", 
    description: "Experience the ancient art of healing with our authentic Thai Dry Massage in Metro Manila. This traditional, oil-free therapy combines rhythmic acupressure, gentle rocking, and assisted yoga stretches to unblock energy pathways, improve flexibility, and relieve deep-seated tension. Let our expert therapists guide your body into a state of blissful release and renewed vitality.",
    price: 3000,
    duration: "75 min",
    image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5ea9a35b6_image.png?w=600&q=80",
    alt_text: "Traditional Thai dry massage therapy with acupressure and yoga stretches at EasyGo Spa Metro Manila"
  },
  {
    id: 4,
    name: "Foot Massage",
    category: "massage",
    description: "Revitalize your entire being from the ground up with our specialized Foot Massage. This ancient reflexology-based treatment targets key pressure points in your feet that correspond to different organs and systems in the body. Alleviate fatigue, reduce stress, and promote overall wellness in our luxurious Ho spa.",
    price: 1500,
    duration: "45 min", 
    image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/0c4d65a6a_image.png?w=600&q=80",
    alt_text: "Relaxing foot reflexology massage therapy at EasyGo Spa luxury wellness center in Metro Manila"
  },
  {
    id: 5,
    name: "Head and Shoulder Massage",
    category: "massage",
    description: "Melt away the stresses of modern life with our targeted Head and Shoulder Massage. This concentrated therapy focuses on the high-tension areas of your neck, shoulders, and scalp, providing immediate relief from headaches, stiffness, and digital fatigue. It's the ultimate quick escape to tranquility, offered at the best spa in Metro Manila.",
    price: 1200,
    duration: "30 min",
    image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/30adeac89_image.png?w=600&q=80",
    alt_text: "Therapeutic head and shoulder massage for stress relief at EasyGo Spa premium spa in Ho Metro Manila"
  },
  {
    id: 6,
    name: "Deep Tissue Massage",
    category: "massage",
    description: "For those seeking powerful relief from chronic pain and muscle tightness, our Deep Tissue Massage is the definitive solution. Our highly skilled therapists use slow, deliberate strokes and deep pressure to target the inner layers of your muscles and connective tissues. Ideal for athletes and individuals with persistent knots, this is a truly transformative treatment.",
    price: 3500,
    duration: "60 min",
    image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/7581a5afb_image.png?w=600&q=80",
    alt_text: "Deep tissue massage therapy for chronic pain relief at EasyGo Spa luxury spa - professional treatment in Metro Manila"
  },

  
  
   
];

const categories = [
  { key: "all", name: "All Services" },
  { key: "massage", name: "Massage Therapy" },
  
];

export default function ServicesPage() {
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
    return activeFilter === "all" 
      ? servicesData 
      : servicesData.filter(service => service.category === activeFilter);
  }, [activeFilter]);

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
      <Head>
        <title>Premium Home Massage Services in Metro Manila | EasyGo Spa</title>
        <meta 
          name="description" 
          content="Discover luxury spa treatments, massage therapy, beauty services, laser hair removal, nail care, and hair styling at EasyGo Spa Metro Manila. Book your premium wellness experience today." 
        />
        <meta name="keywords" content="spa services Metro Manila, massage therapy, beauty salon, laser hair removal, nail care, hair styling, Ho wellness center" />
        <meta property="og:title" content="Premium Home Massage Services in Metro Manila | EasyGo Spa" />
        <meta property="og:description" content="Experience luxury wellness treatments at Metro Manila's premier spa. From therapeutic massages to beauty services and hair care." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://yourwebsite.com/services" />
      </Head>

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
              Discover our comprehensive menu of luxury treatments, performed by certified professionals 
              using state-of-the-art equipment and organic products.
            </p>
          </motion.div>

          {/* Category Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => handleFilterChange(category.key)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  activeFilter === category.key
                    ? 'bg-[#2db83d] text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-[#2db83d]/10 hover:text-[#2db83d] border border-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </motion.div>

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
                  <img
                    src={service.image_url}
                    alt={service.alt_text}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Price Badge */}
                  <div className="absolute top-4 right-4 bg-[#2db83d] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    ₱{service.price.toLocaleString()}
                    {service.priceNote && <span className="text-xs ml-1">{service.priceNote}</span>}
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {service.duration}
                  </div>
                </div>

                {/* Service Content */}
                <div className="p-6">
                  <h3 className="font-serif text-xl font-bold text-[#0F0F0F] mb-3 group-hover:text-[#2db83d] transition-colors duration-300">
                    {service.name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {service.description}
                  </p>
                  <div className="mb-4 rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-600">
                    No verified reviews yet
                  </div>
                  
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
                Book your appointment today and experience the luxury wellness treatments 
                that have made EasyGo Spa the #1 spa in Metro Manila.
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