'use client';

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Star, Award, Clock } from "lucide-react";
import Image from "next/image";


// Static team data for the landing page
const teamMembers = [
  {
    id: 1,
    name: "Sarah Mitchell",
    title: "Master Stylist & Spa Director",
    bio: "With over 15 years of experience in luxury beauty treatments, Sarah specializes in organic hair care and holistic wellness approaches.",
    image_url: "https://images.unsplash.com/photo-1585890483046-9461ebc1dace?q=80&w=870&auto=format&fit=crop&q=90",
    specialties: ["Organic Hair Treatments", "Color Specialist", "Wellness Consultation"],
    years_experience: 15
  },
  {
    id: 2,
    name: "Elena Rodriguez",
    title: "Senior Massage Therapist",
    bio: "Elena brings ancient healing techniques combined with modern therapeutic practices to provide transformative massage experiences.",
    image_url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&q=90",
    specialties: ["Deep Tissue Massage", "Hot Stone Therapy", "Aromatherapy"],
    years_experience: 12
  },
  {
    id: 3,
    name: "Marcus Chen",
    title: "Skincare Specialist",
    bio: "Marcus is our expert in organic skincare treatments, focusing on natural and chemical-free approaches to achieve radiant skin.",
    image_url: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&q=90",
    specialties: ["Organic Facials", "Anti-Aging Treatments", "Skin Analysis"],
    years_experience: 10
  },
  {
    id: 4,
    name: "Isabella Thompson",
    title: "Nail Art Specialist",
    bio: "Isabella creates beautiful nail art designs using only organic and toxin-free polishes, ensuring both beauty and health.",
    image_url: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?ixlib=rb-4.0.3&auto=format&fit=crop&q=90",
    specialties: ["Nail Art", "Organic Manicures", "Hand Care Treatments"],
    years_experience: 8
  }
];

export default function Team() {
  return (
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
            <span className="text-lg text-[#2db83d] font-medium">Meet Our Experts</span>
          </div>
          
          <h1 className="font-serif font-medium text-[length:var(--font-h1)] text-[#0F0F0F] mb-6 leading-tight">
            Our Team of Certified Wellness Professionals in Metro Manila
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-[1.618]">
            Meet our passionate team of wellness experts dedicated to providing you with 
            exceptional, personalized care in a luxurious, tranquil environment.
          </p>
        </motion.div>

        {/* Team Grid */}
        <div className="grid lg:grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)]">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.8, 
                delay: index * 0.2,
                ease: "easeOut"
              }}
              className="group"
            >
              <div className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                {/* Member Image */}
                <div className="relative h-80 overflow-hidden">
                  <Image
                    src={member.image_url}
                    alt={`${member.name}, ${member.title} at EasyGo Spa Luxury Spa & Salon Metro Manila`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={index < 2}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Experience Badge */}
                  <div className="absolute top-4 right-4 bg-[#2db83d] text-white rounded-full px-3 py-1 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    <span className="text-xs font-medium">{member.years_experience}+ Years</span>
                  </div>
                </div>

                {/* Member Content */}
                <div className="p-8">
                  <h3 className="font-serif text-2xl font-bold text-[#0F0F0F] mb-2 group-hover:text-[#2db83d] transition-colors duration-300">
                    {member.name}
                  </h3>
                  
                  <p className="text-[#2db83d] font-medium mb-[1.2em]">
                    {member.title}
                  </p>
                  
                  <p className="text-gray-600 leading-[1.618] mb-[1.2em]">
                    {member.bio}
                  </p>
                  
                  {/* Specialties */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-[#0F0F0F]">Specialties:</p>
                    <div className="flex flex-wrap gap-2">
                      {member.specialties.map((specialty, idx) => (
                        <span
                          key={idx}
                          className="bg-[#2db83d]/10 text-[#2db83d] px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
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
            <h2 className="font-serif text-[length:var(--font-h2)] font-bold text-[#0F0F0F] mb-4">
              Ready to Meet Our Team?
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-[1.618]">
              Book your appointment today and experience the expertise and care of our 
              professional wellness team for your organic spa treatments.
            </p>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal'))}
              className="bg-[#2db83d] text-white px-8 py-4 rounded-full font-medium hover:bg-[#45f248] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
              Schedule Consultation
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}