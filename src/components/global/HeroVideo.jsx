'use client'

import { useEffect, useRef } from 'react'

// 首屏视频（老板 2026-11-10「顶部放视频」）：技师拎包拿毛巾走进公寓，走到镜头前微笑。
// 1080 高清原片压的：电脑 1920 宽、手机裁成竖的 720×900。只播一遍，停在她微笑那一帧，不来回跳。
// 先显示第一帧静图，页面出来再挂视频；系统开了「减少动态效果」的只显示静图。
export default function HeroVideo({ label }) {
  const ref = useRef(null)
  useEffect(() => {
    const video = ref.current
    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    video.src = window.matchMedia('(max-width: 960px)').matches ? '/global/video/hero-m.mp4' : '/global/video/hero-d.mp4'
    video.play().catch(() => {})
  }, [])
  return (
    <video
      ref={ref}
      className="ga-hero-video"
      poster="/global/video/hero-d.webp"
      muted
      playsInline
      preload="none"
      aria-label={label}
    />
  )
}
