'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { AppleLogo, PlayLogo } from '../StoreLogos'
import { heroFontVars } from './heroFonts'

// 首屏（2026-11-11 老板定）：开场片「点一下，她就到」+ 一句大标题 + 两个商店按钮。
// 首屏只讲 App（老板 11-11「官网顶部显示的就说 app」），不放网页预约。
// 11-11 老板拿 easygospa.ph 比「下载的东西 字体 排列 你看看官网的」→「按这个改」：这一块照 .ph 的做法做——
//   标题上方一行字距拉开的小字（现已开通 · 马尼拉）；标题用细衬线常规体（英文 Newsreader，中日韩泰配思源宋体系列，见 heroFonts.js）；
//   商店按钮照苹果、谷歌官方徽章的样子（黑底细灰边、两行字、两个一模一样），Google Play 在前（菲律宾安卓多）；
//   下面四段进度条跟着片子走（下单 / 出发 / 到达 / 放松，11-11 老板改的词），点哪段跳哪段，旁边暂停 / 播放；片子循环播放（11-11 老板「改回循环」，放完从头再放，进度条跟着从头亮）。
// 片子按屏幕宽窄只下一份（电脑 1920×1080 约 11MB、手机 1080×1920 约 6MB）；宽屏上裁切偏下（object-position 50% 25%），人头和手机顶部不被切。
// 系统开了「减少动态效果」或浏览器不让自动放：不自动放，显示封面，进度条旁边的键变成白色播放键，点了才放。

// 每段开始的秒数，跟开场片对齐（codex/开场片/剪辑-新.py）：App 下单 0–4.19 / 地球俯冲马尼拉 / 大堂 + 门口 / 搓精油 + Mia 微笑。电脑和手机同一条时间线
const STARTS = [0, 4.19, 8.89, 15.09]

function useHeroFilm() {
  const videoRef = useRef(null)
  const rootRef = useRef(null)
  const fillRefs = useRef([])
  const [chapter, setChapter] = useState(0)
  const [state, setState] = useState('idle') // idle / playing / paused / ended
  const [manual, setManual] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const phone = window.matchMedia('(max-width: 768px)').matches
    video.poster = phone ? '/global/video/hero-m.webp' : '/global/video/hero-d.webp'
    video.src = phone ? '/global/video/hero-m.mp4' : '/global/video/hero-d.mp4'
    let raf = 0
    const paint = () => {
      const tNow = video.currentTime
      const dur = video.duration || STARTS[STARTS.length - 1] + 7
      let ch = 0
      STARTS.forEach((s, i) => { if (tNow >= s - 0.05) ch = i })
      setChapter((prev) => (prev === ch ? prev : ch))
      STARTS.forEach((s, i) => {
        const end = STARTS[i + 1] ?? dur
        const p = Math.min(Math.max((tNow - s) / (end - s), 0), 1)
        const el = fillRefs.current[i]
        if (el) el.style.transform = `scaleX(${p})`
      })
    }
    const loop = () => { paint(); raf = requestAnimationFrame(loop) }
    const onPlay = () => { setState('playing'); setManual(false); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop) }
    const onPause = () => { cancelAnimationFrame(raf); paint(); if (!video.ended) setState('paused') }
    const onEnded = () => { cancelAnimationFrame(raf); paint(); setState('ended') }
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)
    video.addEventListener('seeked', paint)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setManual(true)
    else video.play().catch(() => setManual(true))
    return () => {
      cancelAnimationFrame(raf)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('seeked', paint)
    }
  }, [])

  // 滑出首屏就暂停省电，滑回来接着放
  useEffect(() => {
    const root = rootRef.current
    const video = videoRef.current
    if (!root || !video) return
    let pausedByScroll = false
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && !video.paused) { pausedByScroll = true; video.pause() }
      else if (entry.isIntersecting && pausedByScroll && !video.ended) { pausedByScroll = false; video.play().catch(() => {}) }
    }, { threshold: 0 })
    io.observe(root)
    return () => io.disconnect()
  }, [])

  const jumpTo = (i) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = STARTS[i]
    setChapter(i)
    video.play().catch(() => setManual(true))
  }
  const toggle = () => {
    const video = videoRef.current
    if (!video) return
    if (state === 'ended') return jumpTo(0)
    if (video.paused) video.play().catch(() => setManual(true))
    else video.pause()
  }
  return { videoRef, rootRef, fillRefs, chapter, state, manual, jumpTo, toggle }
}

// 商店按钮：照苹果、谷歌官方徽章的样子。手机上点了直接去商店；电脑上鼠标移上去在按钮上方弹出二维码（电脑装不了手机 App）
function Badge({ kind, live, href, qrSvg, scan, small }) {
  const apple = kind === 'apple'
  const Logo = apple ? AppleLogo : PlayLogo
  const base = 'flex items-center gap-2 md:gap-2.5 h-[50px] md:h-[54px] pl-[11px] pr-2.5 md:pl-[13px] md:pr-3.5 rounded-[10px] bg-black text-white border border-[#A6A6A6] [&_svg]:flex-none'
  const inner = (
    <>
      <Logo />
      <span className="flex flex-col leading-none whitespace-nowrap min-w-0">
        <span className="text-[9px] md:text-[10px] tracking-[0.03em] mb-1">{small}</span>
        <span className="text-[18px] md:text-[20px] font-semibold tracking-[-0.01em]">{apple ? 'App Store' : 'Google Play'}</span>
      </span>
    </>
  )
  if (!live) return <span aria-disabled="true" className={`${base} opacity-60 cursor-default`}>{inner}</span>
  return (
    <span className="relative group block">
      <a href={href} target="_blank" rel="noopener" className={`${base} transition-colors duration-200 hover:bg-[#1A1A1A]`}>{inner}</a>
      {qrSvg ? (
        <span className="hidden md:flex pointer-events-none absolute left-0 bottom-full mb-3 items-center gap-3 rounded-2xl bg-white p-3 pr-4 shadow-2xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-200 z-20">
          <span className="block w-24 h-24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <span className="text-sm text-[#0F0F0F] max-w-[11em] leading-snug">{scan}</span>
        </span>
      ) : null}
    </span>
  )
}

export default function Hero({ onPlay, onApple, playHref, appleHref, qrSvg }) {
  const t = useTranslations('home.hero')
  const { videoRef, rootRef, fillRefs, chapter, state, manual, jumpTo, toggle } = useHeroFilm()
  const chapters = [t('ch1'), t('ch2'), t('ch3'), t('ch4')]
  const shown = state === 'idle' && manual ? 0 : chapter
  const ctrlLabel = state === 'playing' ? t('pause') : state === 'ended' ? t('replay') : t('play')
  const big = manual && state === 'idle'
  return (
    <section ref={rootRef} className={`${heroFontVars} relative h-[88svh] min-h-[560px] w-full overflow-hidden bg-[#0E100B]`}>
      <span data-nav-over-dark hidden />
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover object-[50%_25%]"
        poster="/global/video/hero-d.webp"
        muted
        loop
        playsInline
        preload="none"
        disablePictureInPicture
        aria-label={t('videoLabel')}
      />
      {/* 衬字的暗色：只在左下角那一片压暗 */}
      <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-black/60 via-black/20 via-40% to-transparent to-60%" aria-hidden="true" />
      <div className="absolute inset-0 hidden md:block bg-gradient-to-t from-black/75 via-black/25 via-30% to-transparent to-55%" aria-hidden="true" />
      {/* 顶上一条压暗：开场片推镜头最后一秒手机顶到菜单下面，白屏衬白字看不清（大厂视频首屏都有这一条） */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 to-transparent" aria-hidden="true" />
      {/* 手机上字压在 Mia 的米白制服上，要压得更暗才看得清（11-11 加了小字和进度条，字块变高，压暗往上延到 78%） */}
      <div className="absolute inset-0 md:hidden bg-gradient-to-t from-black/90 via-black/65 via-45% to-transparent to-78%" aria-hidden="true" />

      {/* 底下留出圆章的位置：圆章压在首屏下沿正中，往上露出 70 / 80 / 90 像素（手机 / 平板 / 电脑），进度条和暂停键不能被它盖住 */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-5 sm:px-8 flex items-end pb-24 md:pb-[100px] lg:pb-[108px]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }} className="w-full md:max-w-[640px]">
          <p className="eg-hero-eyebrow text-white/80 mb-3.5">{t('available')}</p>
          <h1 className="eg-hero-title text-white">
            {t('title1')}<br />{t('title2')}
          </h1>
          <div className="grid grid-cols-[repeat(2,minmax(0,172px))] md:grid-cols-[repeat(2,184px)] gap-2.5 md:gap-3 mt-6 md:mt-7">
            <Badge kind="play" live={onPlay} href={playHref} qrSvg={qrSvg} scan={t('scan')} small={t('badgePlay')} />
            <Badge kind="apple" live={onApple} href={appleHref} qrSvg={qrSvg} scan={t('scan')} small={t('badgeApple')} />
          </div>
          {/* 分段进度条：像快拍，放到哪段亮哪段，点哪段跳哪段 */}
          <div className="flex items-center gap-3.5 mt-6 md:mt-8">
            <nav className="flex-1 grid grid-cols-4 gap-1.5" aria-label={t('chaptersAria')}>
              {chapters.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => jumpTo(i)}
                  aria-current={shown === i ? 'step' : undefined}
                  className={`flex flex-col items-stretch gap-2 pt-2.5 pb-1.5 text-left text-[12px] md:text-[13px] font-medium tracking-[0.02em] cursor-pointer transition-colors duration-300 ${shown === i ? 'text-white' : 'text-white/60 hover:text-white/85'}`}
                >
                  <span className="relative h-[3px] rounded-[3px] bg-white/30 overflow-hidden">
                    {/* 起始宽度写在 style 里（Tailwind 的 scale-x-0 用的是另一个属性，会把后面的进度盖成 0） */}
                    <span ref={(el) => { fillRefs.current[i] = el }} className="absolute inset-0 bg-white origin-left" style={{ transform: 'scaleX(0)' }} />
                  </span>
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </nav>
            <button
              type="button"
              onClick={toggle}
              aria-label={ctrlLabel}
              className={`flex-none grid place-items-center rounded-full border transition-all duration-200 ${big ? 'w-[52px] h-[52px] bg-white text-[#111] border-white' : 'w-11 h-11 bg-black/40 text-white border-white/45 hover:bg-black/60'}`}
            >
              {state === 'playing' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
              ) : state === 'ended' ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z" /></svg>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
