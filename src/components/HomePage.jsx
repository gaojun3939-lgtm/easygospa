"use client"
import GlobalHome from "./global/GlobalHome";

// 2026-11-03 全球站首页改版。旧的 Hero、WhyChooseUs 等区块文件没删，对照表在共享笔记夹 窗口5-官网改造/。
export default function HomePage({ services }) {
  return <GlobalHome services={services} />;
}
