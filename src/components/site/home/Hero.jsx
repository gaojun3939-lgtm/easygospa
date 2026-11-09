'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Clock, MapPin, ShieldCheck, Smartphone } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { openBooking } from '../motion'
import { nums } from '../nums'

// 模版首屏：整屏大图轮播 + 大标题 + 三个小标 + 两个按钮 + 下面的小圆点。
// 第一张换成我们的视频（老板 11-10「顶部放视频」），播完自己换下一张；后两张是 Codex 照片，各停 6 秒。
const SLIDES = [
  { key: 's1', video: true },
  { key: 's2', image: '/global/photos/closing-corridor.webp' },
  { key: 's3', image: '/global/photos/band-living.webp' },
]
const PHOTO_MS = 6000
// 视频没能播（省流量模式、被拦）时最多停这么久
const VIDEO_FALLBACK_MS = 12000

function HeroVideo({ label, onEnded }) {
  const ref = useRef(null)
  useEffect(() => {
    const video = ref.current
    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const phone = window.matchMedia('(max-width: 768px)').matches
    video.poster = phone ? '/global/video/hero-m.webp' : '/global/video/hero-d.webp'
    video.src = phone ? '/global/video/hero-m.mp4' : '/global/video/hero-d.mp4'
    video.play().catch(() => {})
  }, [])
  return (
    <video
      ref={ref}
      className="w-full h-full object-cover"
      poster="/global/video/hero-d.webp"
      muted
      playsInline
      preload="none"
      aria-label={label}
      onEnded={onEnded}
    />
  )
}

export default function Hero() {
  const t = useTranslations('home.hero')
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]
  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), [])

  useEffect(() => {
    const timer = setTimeout(next, slide.video ? VIDEO_FALLBACK_MS : PHOTO_MS)
    return () => clearTimeout(timer)
  }, [index, slide.video, next])

  const trust = [
    { icon: Clock, text: t('trust.open'), color: 'text-white' },
    { icon: ShieldCheck, text: t('trust.verified'), color: 'text-[#C9D4B4]' },
    { icon: MapPin, text: t('trust.area'), color: 'text-white' },
  ]
  const Title = slide.key === 's1' ? 'h1' : 'h2'
  const cta = {
    s1: { label: t('s1.cta'), onClick: openBooking },
    s2: { label: t('s2.cta'), href: '/services' },
    s3: { label: t('s3.cta'), href: '/pricing' },
  }[slide.key]
  const ctaClass = 'eg-btn-wide group bg-gradient-to-r from-[#55633F] to-[#64734F] text-white px-6 sm:px-8 lg:px-10 py-4 sm:py-5 rounded-full font-sans font-semibold text-sm sm:text-base lg:text-lg hover:from-[#64734F] hover:to-[#55633F] transition-all duration-500 hover:scale-105 shadow-2xl flex items-center justify-center gap-2 sm:gap-3 min-h-[48px] sm:min-h-[56px] lg:min-h-[60px] w-full sm:w-auto'

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#14120d]">
      <span data-nav-over-dark hidden />
      <AnimatePresence initial={false}>
        <motion.div
          key={slide.key}
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        >
          {slide.video ? (
            <HeroVideo label={t('videoLabel')} onEnded={next} />
          ) : (
            <img src={slide.image} alt={t(`${slide.key}.alt`)} className="w-full h-full object-cover object-center" />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-transparent z-10" />

      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 md:pt-40 pb-16 sm:pb-20">
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.key}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="text-white space-y-6 sm:space-y-8"
            >
              <Title className="font-serif leading-[1.1] text-white text-[clamp(2rem,5vw,3.5rem)]">{nums(t(`${slide.key}.title`))}</Title>
              <p className="text-gray-100 text-[clamp(1.05rem,2.4vw,1.4rem)] font-light leading-relaxed max-w-3xl">{t(`${slide.key}.lead`)}</p>

              <div className="flex flex-wrap gap-4 sm:gap-6 pt-2 sm:pt-4">
                {trust.map((item, i) => (
                  <motion.div key={item.text} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: i * 0.2 }} className="flex items-center gap-2">
                    <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.color}`} aria-hidden="true" />
                    <span className="text-xs sm:text-sm font-medium text-white/90">{item.text}</span>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 sm:pt-6">
                {cta.href ? (
                  <Link href={cta.href} className={ctaClass}>
                    <span className="text-center leading-tight uppercase tracking-wide">{cta.label}</span>
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform duration-300 flex-shrink-0" />
                  </Link>
                ) : (
                  <button type="button" onClick={cta.onClick} className={ctaClass}>
                    <span className="text-center leading-tight uppercase tracking-wide">{cta.label}</span>
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform duration-300 flex-shrink-0" />
                  </button>
                )}
                <a
                  href="#app"
                  className="eg-btn-wide group bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-6 sm:px-8 py-4 sm:py-5 rounded-full font-sans font-semibold text-sm sm:text-base lg:text-lg hover:bg-white hover:text-[#0F0F0F] transition-all duration-500 flex items-center justify-center gap-2 sm:gap-3 min-h-[48px] sm:min-h-[56px] lg:min-h-[60px] w-full sm:w-auto"
                >
                  <Smartphone className="w-5 h-5" aria-hidden="true" />
                  <span className="whitespace-nowrap">{t('app')}</span>
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-30 flex gap-2 sm:gap-3">
        {SLIDES.map((item, i) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setIndex(i)}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${index === i ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white'}`}
            aria-label={t('slideAria', { n: i + 1 })}
          />
        ))}
      </div>
    </section>
  )
}
