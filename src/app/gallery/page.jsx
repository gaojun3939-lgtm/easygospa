'use client';

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, X } from "lucide-react";
import Image from "next/image";


const galleryImages = [
  {
    src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/287fd6130_13.jpg?w=1200&q=90",
    title: "Reception Area",
    category: "Reception",
    alt: "Elegant reception area at EasyGo Spa luxury spa and salon in  Metro Manila - welcoming entrance with modern design"
  },
  {
    src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/831601306_14.jpg?w=1200&q=90",
    title: "Main Salon Floor",
    category: "Salon",
    alt: "Main salon floor at EasyGo Spa Metro Manila - spacious styling area with professional stations and premium equipment"
  },
  {
    src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/7b593983f_15.jpg?w=1200&q=90",
    title: "Styling Stations", 
    category: "Salon",
    alt: "Professional styling stations at EasyGo Spa hair salon - modern equipment and luxurious seating for premium hair services"
  },
  {
    src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/572e1afba_16.jpg?w=1200&q=90",
    title: "Private Lounge",
    category: "Interior",
    alt: "Private lounge area at EasyGo Spa - intimate relaxation space with comfortable seating and ambient lighting"
  },
  {
    src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5e03cef8d_17.jpg?w=1200&q=90",
    title: "Reception", 
    category: "Reception",
    alt: "Secondary view of EasyGo Spa reception area - customer service desk with elegant interior design and branding"
  },
  {
    src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/1d99ea153_24.jpg?w=1200&q=90",
    title: "Treatment Corridor",
    category: "Interior",
    alt: "Treatment corridor at EasyGo Spa wellness center - peaceful hallway leading to private therapy rooms"
  },
  {
    src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/601ccd748_1.jpg?w=1200&q=90",
    title: "Massage Room",
    category: "Treatment",
    alt: "Serene massage room at EasyGo Spa - therapeutic treatment space with professional massage table and calming ambiance"
  },
  {
    src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/0d0096c79_2.jpg?w=1200&q=90",
    title: "Spa Suite",
    category: "Treatment",
    alt: "Luxury spa suite at EasyGo Spa Ho - premium treatment room with advanced equipment for beauty and wellness services"
  },
  {
    src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/664dc3f67_15.jpg?w=1200&q=90",
    title: "Relaxation Room",
    category: "Treatment",
    alt: "Peaceful relaxation room at EasyGo Spa Metro Manila - comfortable seating area for post-treatment relaxation and recovery"
  }
];

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState(null);

  const openLightbox = (image, index) => {
    setSelectedImage({ ...image, index });
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    const nextIndex = (selectedImage.index + 1) % galleryImages.length;
    setSelectedImage({ ...galleryImages[nextIndex], index: nextIndex });
  };

  const prevImage = () => {
    const prevIndex = selectedImage.index === 0 ? galleryImages.length - 1 : selectedImage.index - 1;
    setSelectedImage({ ...galleryImages[prevIndex], index: prevIndex });
  };

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedImage) return;
      
      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        default:
          break;
      }
    };

    if (selectedImage) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

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
              <span className="text-lg font-medium">Visual Journey</span>
            </div>
            
            <h1 className="font-serif font-medium text-[clamp(2.5rem,5vw,4rem)] text-[#0F0F0F] mb-6 leading-tight">
              Luxury Organic Spa & Salon in Metro Manila | EasyGo Spa Wellness
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-[1.618]">
              Step inside our tranquil sanctuary and explore the luxurious spaces designed 
              for your ultimate relaxation and rejuvenation.
            </p>
          </motion.div>

          {/* Gallery Grid */}
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)]">
            {galleryImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                className="group cursor-pointer"
                onClick={() => openLightbox(image, index)}
              >
                <div className="relative overflow-hidden rounded-3xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                  {/* Image */}
                  <div className="relative h-80 overflow-hidden">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Overlay Content */}
                    <div className="absolute inset-0 flex items-end justify-start p-6 opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <div className="text-white">
                        <span className="inline-block bg-[#2db83d] text-white px-3 py-1 rounded-full text-xs font-medium mb-2">
                          {image.category}
                        </span>
                        <h3 className="font-serif text-xl font-bold">
                          {image.title}
                        </h3>
                      </div>
                    </div>

                    {/* Hover Icon */}
                    <div className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                      <ArrowRight className="w-5 h-5 text-[#2db83d]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mt-16"
          >
            <div className="bg-white rounded-3xl p-12 shadow-lg border border-[#2db83d]/20">
              <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] font-bold text-[#0F0F0F] mb-4">
                Ready to Experience EasyGo Spa?
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-[1.618]">
                Book your appointment today and step into our world of luxury, wellness, and tranquility. 
                Our organic spa treatments await.
              </p>
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('open-booking-modal'));
                  }
                }}
                className="bg-[#2db83d] text-white px-8 py-4 rounded-full font-medium hover:bg-[#45f248] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Schedule Your Visit
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Buttons */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300"
          >
            <ArrowRight className="w-6 h-6 rotate-180" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300"
          >
            <ArrowRight className="w-6 h-6" />
          </button>

          {/* Image Container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative max-w-4xl max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage.src}
              alt={selectedImage.alt}
              width={1200}
              height={800}
              className="w-full h-full object-contain rounded-lg"
              priority
            />
            
            {/* Image Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
              <div className="text-white">
                <span className="inline-block bg-[#2db83d] text-white px-3 py-1 rounded-full text-sm font-medium mb-2">
                  {selectedImage.category}
                </span>
                <h3 className="font-serif text-2xl font-bold mb-1">
                  {selectedImage.title}
                </h3>
                <p className="text-sm text-gray-300">
                  {selectedImage.index + 1} of {galleryImages.length}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}