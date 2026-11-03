'use client';

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import Clip from "./global/Clip";
import PageHead from "./global/PageHead";
import ServiceMenu from "./global/ServiceMenu";

// 2026-10-26 老板定:跟首页服务区一样,卡片 = 后台在售项目 + 每档价格(app/services/page.jsx 服务端读好传进来)。
// 原来写死的 6 张卡(含后台没有的项目和假价字段)已删。

const categories = [
  { key: "all", name: "All Services" },
  { key: "massage", name: "Massage Therapy" },
  
];

export default function ServicesPage({ services = [] }) {
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
    // 后台分类写的是「Massage」,网址参数是小写 massage,比较时统一小写
    return activeFilter === "all" 
      ? services 
      : services.filter(service => String(service.category || '').toLowerCase() === activeFilter);
  }, [activeFilter, services]);

  const handleFilterChange = useCallback((filterKey) => {
    setActiveFilter(filterKey);
    
    // Update URL without page reload
    const newUrl = filterKey === 'all' 
      ? '/services' 
      : `/services?category=${filterKey}`;
    
    router.push(newUrl, { scroll: false });
  }, [router]);

  return (
    <div className="ga ga-page">
      <PageHead eyebrow="Our Services" title="Premium Home Massage Services in Metro Manila">
        Professional massage at your home, condo or hotel across Metro Manila. Every treatment and
        price is listed below — no transport fee, no tips.
      </PageHead>

      <section className="ga-band ga-band-tri">
        <figure><img src="/global/photos/foot.webp" alt="A therapist in the EasyGoSpa uniform massaging a client's foot beside the sofa" /></figure>
        <figure><Clip name="walkin" label="A therapist in the EasyGoSpa uniform walking in through an open door" /></figure>
        <figure><img src="/global/photos/stone-arm.webp" alt="A therapist gliding a warm stone along a client's forearm" /></figure>
      </section>

      {/* 老板 2026-07-19:去掉"Massage Therapy"分类筛选;服务本就全是按摩,
          整条筛选无意义,直接移除(默认展示全部服务)。 */}
      <section className="ga-wrap ga-page-sec">
        <ServiceMenu services={filteredServices} light fullText />
      </section>

      <section className="ga-cta ga-cta-film">
        <figure className="ga-cta-arch"><Clip name="glide" label="Gliding through a lit window into a quiet condo living room" /></figure>
        <div className="ga-wrap">
          <h2>Ready for Your Transformation?</h2>
          <p>Book your appointment today — choose your therapist and pay in cash when they arrive.</p>
          <button
            type="button"
            className="ga-btn ga-btn-big ga-btn-light"
            onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal'))}
          >
            Book Your Experience
          </button>
        </div>
      </section>
    </div>
  );
}
