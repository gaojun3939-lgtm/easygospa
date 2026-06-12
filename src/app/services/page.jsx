import React from 'react'
import ServicesPage from '@/components/ServicesPage'
import { Suspense } from "react";

export const metadata = {
  title: "Premium Services | EasyGo Spa Luxury Spa & Salon",
  description: "Discover our premium services at EasyGo Spa Luxury Spa & Salon in Metro Manila: luxury hair styling, advanced skincare, therapeutic massage, premium nail care, and wellness treatments with state-of-the-art equipment.",
  openGraph: {
    title: "Premium Services | EasyGo Spa Luxury Spa & Salon",
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