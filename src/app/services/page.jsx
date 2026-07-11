import React from 'react'
import ServicesPage from '@/components/ServicesPage'
import { Suspense } from "react";

export const metadata = {
  title: "Premium Services | EasyGo Spa Premium Home Massage",
  description: "Discover our premium home massage services in Metro Manila: Swedish massage, deep tissue massage, Thai dry massage and foot massage, delivered to your hotel, condo or home by verified therapists, 24/7.",
  openGraph: {
    title: "Premium Services | EasyGo Spa Premium Home Massage",
    description: "Explore our range of luxury spa and salon services designed for ultimate relaxation and beauty.",
    images: ["/services-og-image.jpg"],
  },
};

function Services() {
  return (
    <Suspense fallback={null}>
      <ServicesPage/>
    </Suspense>
  )
}

export default Services