import React from 'react'
import ServicesPage from '@/components/ServicesPage'
import { Suspense } from "react";
import { loadPublicServiceMenu } from '@/lib/publicServiceMenu.mjs';

// 2026-10-26:服务卡显示后台真价;每 60 秒最多重算一次,读不到后台时继续给上一次的页面(规则见 lib/publicServiceMenu.mjs)
export const revalidate = 60;

export const metadata = {
  title: "Premium Services | EasyGo Spa Premium Home Massage",
  description: "Discover our premium home massage services in Metro Manila: Swedish massage, deep tissue massage, Thai dry massage and foot massage, delivered to your hotel, condo or home by verified therapists, 24/7.",
  openGraph: {
    title: "Premium Services | EasyGo Spa Premium Home Massage",
    description: "Explore our range of luxury spa and salon services designed for ultimate relaxation and beauty.",
    images: ["/services-og-image.jpg"],
  },
};

async function Services() {
  const services = await loadPublicServiceMenu();
  return (
    <Suspense fallback={null}>
      <ServicesPage services={services}/>
    </Suspense>
  )
}

export default Services