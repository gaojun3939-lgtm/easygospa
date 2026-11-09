'use client'

import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AppleLogo, PlayLogo } from '../StoreLogos'
import { nums } from '../nums'

// 模版这里是绿底大字「50% OFF」促销条。我们不搞促销（老板定的），换成同样样子的「下载 App」。
// 两家商店上没上架由服务器每小时查一次（src/lib/appStores.mjs），没上架的按钮变灰写「即将上架」，上架后自己变成能点。
function StoreBadge({ live, href, kind, tb }) {
  const Logo = kind === 'play' ? PlayLogo : AppleLogo
  const top = kind === 'play' ? (live ? tb('googlePlay.get') : tb('googlePlay.soon')) : (live ? tb('appStore.get') : tb('appStore.soon'))
  const inner = (
    <>
      <Logo />
      <span className="flex flex-col leading-tight text-left">
        <small className="text-[10px] uppercase tracking-wide opacity-80 whitespace-nowrap">{top}</small>
        <b className="text-lg font-semibold whitespace-nowrap">{kind === 'play' ? 'Google Play' : 'App Store'}</b>
      </span>
    </>
  )
  const cls = 'inline-flex items-center gap-3 rounded-2xl px-5 h-14 border border-white/20 shadow-xl transition-all duration-300'
  return live
    ? <a href={href} target="_blank" rel="noopener" className={`${cls} bg-black/85 text-white hover:bg-black hover:scale-105`}>{inner}</a>
    : <span aria-disabled="true" className={`${cls} bg-black/35 text-white/70 cursor-default`}>{inner}</span>
}

export default function AppBanner({ onPlay, onApple, playHref, appleHref, qrSvg }) {
  const t = useTranslations('home.app')
  const tb = useTranslations('referral.badges')
  const storeLine = onPlay && onApple ? t('storeBoth') : onPlay ? t('storePlay') : onApple ? t('storeApple') : t('storeNone')
  const scan = onPlay && onApple ? t('scanAny') : onPlay ? t('scanAndroid') : onApple ? t('scanIphone') : ''
  return (
    <section id="app" className="relative py-16 md:py-20 overflow-hidden bg-gradient-to-br from-[#7B8A63] via-[#64734F] to-[#3E4A2E] scroll-mt-20">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, 180, 360], y: [-20, -80, -120], x: [0, 30, -20] }}
            transition={{ duration: 6, repeat: Infinity, delay: i * 0.8, ease: 'easeInOut' }}
            style={{ left: `${10 + i * 11}%`, top: `${20 + (i % 3) * 25}%` }}
          >
            <Sparkles className="w-6 h-6 text-white/50" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: 'easeOut' }} viewport={{ once: true }} className="space-y-6">
          <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-4" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.35)' }}>{nums(t('big'))}</h2>
          <div className="space-y-2">
            <p className="font-sans text-xl md:text-2xl font-light text-white/90 tracking-wide">{t('lead')}</p>
            <p className="font-sans text-lg md:text-xl font-semibold text-white">{storeLine}</p>
          </div>

          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 max-w-4xl mx-auto pt-2">
            {['pick', 'later', 'eta', 'chat'].map((key) => (
              <li key={key} className="flex items-center gap-2 text-sm md:text-base text-white/90">
                <Check className="w-4 h-4 text-[#E3EAD3] flex-shrink-0" aria-hidden="true" />
                {t(`points.${key}`)}
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 pt-6">
            <StoreBadge kind="play" live={onPlay} href={playHref} tb={tb} />
            <StoreBadge kind="apple" live={onApple} href={appleHref} tb={tb} />
          </div>

          {qrSvg && scan ? (
            <div className="hidden md:flex items-center justify-center gap-4 pt-2">
              <div className="w-24 h-24 rounded-xl bg-white p-2 shadow-lg" role="img" aria-label={scan} dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <p className="text-sm text-white/85 max-w-[14em] text-left">{scan}</p>
            </div>
          ) : null}

          <div className="flex justify-center items-center gap-4 pt-4" aria-hidden="true">
            <div className="w-16 h-0.5 bg-white/30" />
            <Sparkles className="w-6 h-6 text-white/60" />
            <div className="w-16 h-0.5 bg-white/30" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
