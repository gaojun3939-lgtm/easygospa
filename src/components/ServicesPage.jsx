'use client';

import React, { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import ServiceCard from "./site/ServiceCard";
import { NEED_ORDER, needOf } from "./site/serviceText";

// 服务页（建站模版 serinity 的样子：一排分类按钮 + 三列项目卡）。卡片 = 后台在售项目 + 每档价格（服务器读好传进来）。
// 2026-07-19 老板去掉过「全部 / 按摩」那两个按钮（只有按摩一类，按了没区别）；11-10 老板要模版一样不少，
// 分类改成「身体需要什么」六种，跟首页那排卡片对上（首页卡片点进来带 ?need=）。旧网址 ?category=massage 照旧显示全部。
export default function ServicesPage({ services = [] }) {
  const t = useTranslations("services");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const fromUrl = searchParams.get("need");
  const active = fromUrl && NEED_ORDER.includes(fromUrl) ? fromUrl : "all";
  const shown = useMemo(() => (active === "all" ? services : services.filter((s) => needOf(s.name) === active)), [active, services]);
  // 后台新加的项目对不上任何一类时，那一类不出按钮
  const needs = NEED_ORDER.filter((need) => services.some((s) => needOf(s.name) === need));
  const pick = (need) => router.replace(need === "all" ? pathname : `${pathname}?need=${need}`, { scroll: false });

  return (
    <>
      <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-12">
        {["all", ...needs].map((need) => (
          <button
            key={need}
            type="button"
            onClick={() => pick(need)}
            aria-pressed={active === need}
            className={`px-5 md:px-6 py-3 rounded-full font-medium transition-all duration-300 ${active === need ? "bg-[#64734F] text-white shadow-lg" : "bg-white text-gray-600 hover:bg-[#64734F]/10 hover:text-[#55633F] border border-gray-200"}`}
          >
            {need === "all" ? t("all") : t(`needs.${need}`)}
          </button>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)]">
        {shown.map((service, i) => <ServiceCard key={service.id || service.name} service={service} index={i} fullText />)}
      </div>
    </>
  );
}
