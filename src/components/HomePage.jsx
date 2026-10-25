"use client"
import Hero from "./Hero";
import TransitionCircle from "./TransitionCircle";
import WhyChooseUs from "./WhyChooseUs";
import PromotionalBanner from "./PromotionalBanner";
import ProductSpecialty from "./ProductSpecialty";
import WhatWeDo from "./WhatWeDo";
import TestimonialsSection from "./TestimonialsSection";
import BrandPartners from "./BrandPartners";
import StatsSection from "./StatsSection";
import ServicesSection from "./ServicesSection";

// 首页内容原样搬自 app/page.tsx(2026-10-26):page.tsx 改成服务端读后台价目,
// 这里保持客户端渲染,各区块一个不动,只把价目传给服务区。
export default function HomePage({ services }) {
  return (
    <div>
      <div className="relative">
        <Hero />
        <TransitionCircle />
      </div>
      {/* The container below provides the background for all subsequent sections, ensuring a seamless transition */}
      <div className="bg-[#FDFCF9] relative">
        <WhyChooseUs />
        <ServicesSection services={services} />
        <StatsSection />
      </div>
      <ProductSpecialty />
      <div className="bg-[#FDFCF9] relative">
        <WhatWeDo />
        <PromotionalBanner />
        <BrandPartners />

      </div>
    </div>
  );
}
