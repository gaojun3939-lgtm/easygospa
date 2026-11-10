'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AppleLogo, PlayLogo } from '../StoreLogos'

// 首屏（2026-11-11 老板定）：整屏开场片「点一下，她就到」+ 一句大标题 + 两个商店按钮 + 一行「现已开通 · 马尼拉」。
// 首屏只讲 App（老板 11-11「官网顶部显示的就说 app」），不放网页预约。
// 电脑版：字在左边，片子里的人和手机都在右边；手机版：字压在下半截。
// 片子按屏幕宽窄只下一份（电脑约 4MB、手机约 2MB）；系统开了「减少动态效果」就只显示封面（结尾 Mia 微笑那帧）。

function HeroVideo({ label }) {
  const ref = useRef(null)
  useEffect(() => {
    const video = ref.current
    if (!video) return
    const phone = window.matchMedia('(max-width: 768px)').matches
    video.poster = phone ? '/global/video/hero-m.webp' : '/global/video/hero-d.webp'
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    video.src = phone ? '/global/video/hero-m.mp4' : '/global/video/hero-d.mp4'
    video.play().catch(() => {})
  }, [])
  return (
    <video
      ref={ref}
      className="absolute inset-0 w-full h-full object-cover"
      poster="/global/video/hero-d.webp"
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
    />
  )
}

// 商店按钮：手机上点了直接去商店；电脑上鼠标移上去在按钮上方弹出二维码（电脑装不了手机 App）
function Store({ kind, live, href, qrSvg, top, scan }) {
  const apple = kind === 'apple'
  const Logo = apple ? AppleLogo : PlayLogo
  const base = 'inline-flex items-center gap-3 rounded-2xl pl-4 pr-6 h-[60px] transition-all duration-300'
  const look = apple
    ? 'bg-white text-[#0F0F0F] hover:bg-[#F3F0EA]'
    : 'bg-white/10 text-white border border-white/45 backdrop-blur-sm hover:bg-white/20'
  const inner = (
    <>
      <Logo />
      <span className="flex flex-col leading-tight text-left">
        <small className="text-[11px] opacity-75 whitespace-nowrap">{top}</small>
        <b className="text-lg font-semibold whitespace-nowrap">{apple ? 'App Store' : 'Google Play'}</b>
      </span>
    </>
  )
  if (!live) return <span aria-disabled="true" className={`${base} ${look} opacity-60 cursor-default`}>{inner}</span>
  return (
    <span className="relative group">
      <a href={href} target="_blank" rel="noopener" className={`${base} ${look}`}>{inner}</a>
      {qrSvg ? (
        <span className="hidden md:flex pointer-events-none absolute left-0 bottom-full mb-3 items-center gap-3 rounded-2xl bg-white p-3 pr-4 shadow-2xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-200">
          <span className="block w-24 h-24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <span className="text-sm text-[#0F0F0F] max-w-[11em] leading-snug">{scan}</span>
        </span>
      ) : null}
    </span>
  )
}

export default function Hero({ onPlay, onApple, playHref, appleHref, qrSvg }) {
  const t = useTranslations('home.hero')
  const tb = useTranslations('referral.badges')
  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-[#0E100B]">
      <span data-nav-over-dark hidden />
      <HeroVideo label={t('videoLabel')} />
      {/* 衬字的暗色：电脑从左往右淡，手机从下往上淡 */}
      <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-black/75 via-black/40 via-45% to-transparent to-65%" aria-hidden="true" />
      <div className="absolute inset-0 md:hidden bg-gradient-to-t from-black/90 via-black/55 via-40% to-transparent to-65%" aria-hidden="true" />

      <div className="relative z-10 min-h-[100svh] max-w-7xl mx-auto px-5 sm:px-8 flex items-end md:items-center pb-12 md:pb-0">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }} className="w-full md:max-w-[52%]">
          <h1 className="text-white font-semibold leading-[1.08] tracking-[0.02em] text-[clamp(2.5rem,5.6vw,5.5rem)] drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
            {t('title1')}<br />{t('title2')}
          </h1>
          <div className="flex flex-wrap gap-3 mt-8 md:mt-11">
            <Store kind="apple" live={onApple} href={appleHref} qrSvg={qrSvg} top={onApple ? tb('appStore.get') : tb('appStore.soon')} scan={t('scan')} />
            <Store kind="play" live={onPlay} href={playHref} qrSvg={qrSvg} top={onPlay ? tb('googlePlay.get') : tb('googlePlay.soon')} scan={t('scan')} />
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-[#DDE6CC]">
            <MapPin className="w-4 h-4 text-[#C9D4B4]" aria-hidden="true" />
            {t('available')}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
