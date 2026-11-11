'use client';

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ServiceCard from "./site/ServiceCard";
import { NEED_ORDER, needOf } from "./site/serviceText";

// 服务页（建站模版 serinity 的样子：三列项目卡）。卡片 = 后台在售项目 + 每档价格（服务器读好传进来）。
// 2026-07-19 老板去掉过「全部 / 按摩」那两个按钮（只有按摩一类，按了没区别）；11-10 模版要一样不少，曾改成「身体需要什么」六个筛选按钮。
// 11-12 老板「你这个里面放这个 合适不合适？」→「执行」：六个按钮正好对六个项目，点哪个都只剩一张卡、右边一大片空 → 按钮去掉，
// 六个项目一直全部摆出来，每张卡上带「身体需要什么」小标签（放松、肌肉紧绷……）；首页那排卡片点进来带 ?need=，滚到对应那张、加一圈绿边。
// 旧网址 ?category=massage 照旧显示全部。
export default function ServicesPage({ services = [] }) {
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("need");
  const target = fromUrl && NEED_ORDER.includes(fromUrl) ? fromUrl : "";

  useEffect(() => {
    if (!target) return;
    const el = document.getElementById(`service-${target}`);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // 等卡片的淡入动画开始后再滚，页头是固定的，滚到屏幕中间
    const timer = setTimeout(() => el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }), 300);
    return () => clearTimeout(timer);
  }, [target]);

  return (
    <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)]">
      {services.map((service, i) => {
        const need = needOf(service.name);
        return (
          <ServiceCard
            key={service.id || service.name}
            service={service}
            index={i}
            fullText
            need={need}
            anchor={need ? `service-${need}` : undefined}
            highlight={Boolean(target) && need === target}
          />
        );
      })}
    </div>
  );
}
