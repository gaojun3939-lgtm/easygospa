'use client';

import React, { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import PageHead from "./global/PageHead";
import ServiceCards from "./global/ServiceCards";

// 2026-10-26 老板定:跟首页服务区一样,卡片 = 后台在售项目 + 每档价格(app/[locale]/services/page.jsx 服务端读好传进来)。
// 2026-07-19 老板去掉了分类筛选按钮;网址带 ?category=massage 时照旧只显示按摩类(其实全是按摩)。
const CATEGORY_KEYS = ["all", "massage"];

export default function ServicesPage({ services = [] }) {
  const t = useTranslations("services");
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("category");
  const activeFilter = fromUrl && CATEGORY_KEYS.includes(fromUrl) ? fromUrl : "all";

  const filteredServices = useMemo(() => {
    // 后台分类写的是「Massage」,网址参数是小写 massage,比较时统一小写
    return activeFilter === "all"
      ? services
      : services.filter((service) => String(service.category || "").toLowerCase() === activeFilter);
  }, [activeFilter, services]);

  return (
    <div className="ga ga-page">
      <PageHead eyebrow={t("eyebrow")} title={t("title")}>
        {t("lead")}
      </PageHead>

      <section className="ga-wrap ga-page-sec">
        <ServiceCards services={filteredServices} fullText />
      </section>

      <section className="ga-cta">
        <div className="ga-wrap">
          <h2>{t("ctaTitle")}</h2>
          <p>{t("ctaText")}</p>
          <button type="button" className="ga-btn ga-btn-big ga-btn-light" data-open-booking="1">
            {t("ctaButton")}
          </button>
        </div>
      </section>
    </div>
  );
}
