import React from 'react'
import ServicesPage from '@/components/ServicesPage'
import { Suspense } from "react";
import { loadPublicServiceMenu } from '@/lib/publicServiceMenu.mjs';

// 2026-10-26:服务卡显示后台真价;每 60 秒最多重算一次,读不到后台时继续给上一次的页面(规则见 lib/publicServiceMenu.mjs)
export const revalidate = 60;

export const metadata = {
  title: "Premium Services | EasyGo Spa Premium Home Massage",
  // 2026-10-26:原来写着 Thai dry / foot massage(我们没有)、分享卡写 salon、配图文件不存在;改成真项目,配图用全站默认那张
  description: "Home massage in Metro Manila with prices for every treatment: Swedish, deep tissue, shiatsu, Thai, hot stone and aromatherapy massage, delivered to your hotel, condo or home by verified therapists, 24/7.",
  openGraph: {
    title: "Premium Services | EasyGo Spa Premium Home Massage",
    description: "Professional home massage in Metro Manila — see every treatment and price.",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "EasyGo Spa" }],
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