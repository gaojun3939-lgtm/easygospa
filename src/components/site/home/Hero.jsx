'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AppleLogo, PlayLogo } from '../StoreLogos'

// 首屏（2026-11-11 老板定）：开场片「点一下，她就到」+ 一句大标题 + 两个商店按钮 + 一行「现已开通 · 马尼拉」。
// 首屏只讲 App（老板 11-11「官网顶部显示的就说 app」），不放网页预约。
// 电脑版：字在左下，片子里的人和手机都在右边；手机版：字压在下半截。
// 片子按屏幕宽窄只下一份（11-11 老板嫌糊后提清楚：电脑 1920×1080 约 11MB、手机 1080×1920 约 6MB）；系统开了「减少动态效果」就只显示封面（结尾 Mia 微笑那帧）。
// 宽屏上片子要铺满宽度，上下会被裁；裁切偏下（object-position 中间 25%），人头和手机顶部不被切，裁掉的是下面放字的地方。

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
      className="absolute inset-0 w-full h-full object-cover object-[50%_25%]"
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
// 11-11 老板嫌首屏「太大」：按钮按商店官方徽章的大小做（48 高），只留标志和名字
function Store({ kind, live, href, qrSvg, scan }) {
  const apple = kind === 'apple'
  const Logo = apple ? AppleLogo : PlayLogo
  const base = 'inline-flex items-center gap-2.5 rounded-xl pl-3.5 pr-5 h-12 transition-all duration-300 [&_svg]:h-5 [&_svg]:w-auto'
  const look = apple
    ? 'bg-white text-[#0F0F0F] hover:bg-[#F3F0EA]'
    : 'bg-white/10 text-white border border-white/40 backdrop-blur-sm hover:bg-white/20'
  const inner = (
    <>
      <Logo />
      <b className="text-[15px] font-semibold whitespace-nowrap">{apple ? 'App Store' : 'Google Play'}</b>
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

// 11-11 老板嫌「太大」→ 照六善、我们 .ph 站的做法：视频照样铺满，但只占九成屏高（露出下一块的开头）；
// 标题 56 像素细一档的衬线字（中日韩泰自动换成系统字），标题、按钮、一行小字挨着排在左下角，不压画面中间。
export default function Hero({ onPlay, onApple, playHref, appleHref, qrSvg }) {
  const t = useTranslations('home.hero')
  return (
    <section className="relative h-[88svh] min-h-[520px] w-full overflow-hidden bg-[#0E100B]">
      <span data-nav-over-dark hidden />
      <HeroVideo label={t('videoLabel')} />
      {/* 衬字的暗色：只在左下角那一片压暗 */}
      <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-black/60 via-black/20 via-40% to-transparent to-60%" aria-hidden="true" />
      <div className="absolute inset-0 hidden md:block bg-gradient-to-t from-black/70 via-black/25 via-30% to-transparent to-55%" aria-hidden="true" />
      {/* 顶上一条压暗：开场片推镜头最后一秒手机顶到菜单下面，白屏衬白字看不清（大厂视频首屏都有这一条） */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 to-transparent" aria-hidden="true" />
      {/* 手机上字压在 Mia 的米白制服上，要压得更暗才看得清 */}
      <div className="absolute inset-0 md:hidden bg-gradient-to-t from-black/90 via-black/65 via-35% to-transparent to-62%" aria-hidden="true" />

      <div className="relative z-10 h-full max-w-7xl mx-auto px-5 sm:px-8 flex items-end pb-28 md:pb-[10svh]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }} className="w-full md:max-w-[46%]">
          <h1 className="font-serif text-white leading-[1.12] text-[clamp(2.1rem,3.65vw,3.5rem)] drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
            {t('title1')}<br />{t('title2')}
          </h1>
          <div className="flex flex-wrap gap-3 mt-6">
            <Store kind="apple" live={onApple} href={appleHref} qrSvg={qrSvg} scan={t('scan')} />
            <Store kind="play" live={onPlay} href={playHref} qrSvg={qrSvg} scan={t('scan')} />
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-[13px] text-[#DDE6CC]">
            <MapPin className="w-3.5 h-3.5 text-[#C9D4B4]" aria-hidden="true" />
            {t('available')}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
