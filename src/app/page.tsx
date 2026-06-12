"use client"
import Hero from "../components/Hero";
import TransitionCircle from "../components/TransitionCircle";
import WhyChooseUs from "../components/WhyChooseUs";
import PromotionalBanner from "../components/PromotionalBanner";
import ProductSpecialty from "../components/ProductSpecialty";
import WhatWeDo from "../components/WhatWeDo";
import CategoriesSection from "../components/CategoriesSection";
import TestimonialsSection from "../components/TestimonialsSection";
import BrandPartners from "../components/BrandPartners";
import StatsSection from "../components/StatsSection";
import ServicesSection from "../components/ServicesSection";

export default function Home() {
  return (
    <div>
      <div className="relative">
        <Hero />
        <TransitionCircle />
      </div>
      {/* The container below provides the background for all subsequent sections, ensuring a seamless transition */}
      <div className="bg-[#FDFCF9] relative">
        <WhyChooseUs />
        <ServicesSection />
        <StatsSection />
      </div>
      <CategoriesSection />
      <ProductSpecialty />
      <div className="bg-[#FDFCF9] relative">
        <WhatWeDo />
        <PromotionalBanner />
        <BrandPartners />
       
      </div>
    </div>
  );
}
