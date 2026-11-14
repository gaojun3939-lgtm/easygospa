'use client'

import { motion } from 'framer-motion'
import { Clock, Lock, ShieldCheck, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useGoApp } from '../AppButton'
import { nums } from '../nums'

// 模版「The NUNYUI Standard」：小字眉题、两行大字、一段话；左右两张圆图，中间四条
const FEATURES = [
  { key: 'verified', icon: ShieldCheck },
  { key: 'fast', icon: Zap },
  { key: 'private', icon: Lock },
  { key: 'open', icon: Clock },
]

function Leaves() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" className="text-[#64734F]" aria-hidden="true">
      <path d="M10 40C15 20 35 10 50 15C55 17 60 22 65 30" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <path d="M50 15C52 12 58 8 65 12C70 15 75 22 80 35" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <path d="M65 30C68 25 75 20 85 25C90 28 95 35 100 50" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <path d="M20 50C25 45 35 40 45 45C50 48 55 55 60 70" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <ellipse cx="25" cy="35" rx="8" ry="12" fill="currentColor" opacity="0.3" transform="rotate(-30 25 35)" />
      <ellipse cx="55" cy="25" rx="6" ry="10" fill="currentColor" opacity="0.3" transform="rotate(-45 55 25)" />
      <ellipse cx="75" cy="45" rx="7" ry="11" fill="currentColor" opacity="0.3" transform="rotate(-60 75 45)" />
      <ellipse cx="35" cy="55" rx="5" ry="9" fill="currentColor" opacity="0.3" transform="rotate(-20 35 55)" />
    </svg>
  )
}

export default function Standard() {
  const t = useTranslations('home.standard')
  const goApp = useGoApp('standard')
  const round = 'w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full overflow-hidden shadow-lg'
  return (
    <section className="eg-sec eg-std py-16 md:py-20 lg:py-24 bg-white relative overflow-hidden">
      <div className="max-md:hidden absolute top-10 left-10 opacity-20"><Leaves /></div>
      <div className="max-md:hidden absolute bottom-10 right-10 opacity-20 rotate-180"><Leaves /></div>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
        <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: 'easeOut' }} viewport={{ once: true }} className="eg-head text-center mb-16">
          <p className="max-md:hidden font-sans text-sm text-gray-500 mb-4 tracking-[0.3em] uppercase">{t('eyebrow')}</p>
          <h2 className="eg-title font-serif text-4xl md:text-5xl lg:text-6xl text-[#0F0F0F] leading-tight mb-6">
            {nums(t('title1'))}
            <br className="eg-br" />
            <span className="eg-t2 text-[#64734F]"> {nums(t('title2'))}</span>
          </h2>
          <p className="eg-lead text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">{t('lead')}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -100, scale: 0.8 }} whileInView={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }} viewport={{ once: true }} className="max-md:hidden lg:col-span-3 flex justify-center lg:justify-start">
            <div className={round}><img src="/global/photos/place-hotel.webp" alt={t('altLeft')} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" loading="lazy" /></div>
          </motion.div>
          <div className="lg:col-span-6">
            <div className="eg-std-list grid grid-cols-1 md:grid-cols-2 gap-8">
              {FEATURES.map((feature, i) => (
                <motion.div key={feature.key} initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: i * 0.15, ease: 'easeOut' }} viewport={{ once: true }} className="eg-std-item flex items-start gap-4 group">
                  <div className="eg-std-ic w-12 h-12 bg-[#F5E6D8] rounded-full flex items-center justify-center group-hover:bg-[#64734F] transition-all duration-500 flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-[#64734F] group-hover:text-white transition-colors duration-300" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-[#0F0F0F] mb-2 group-hover:text-[#55633F] transition-colors duration-300">{t(`${feature.key}.title`)}</h3>
                    <p className="font-sans text-sm text-gray-600 leading-relaxed">{t(`${feature.key}.text`)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div initial={{ opacity: 0, x: 100, scale: 0.8 }} whileInView={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }} viewport={{ once: true }} className="max-md:hidden lg:col-span-3 flex justify-center lg:justify-end">
            <div className={round}><img src="/global/photos/place-condo.webp" alt={t('altRight')} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" loading="lazy" /></div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3 }} viewport={{ once: true }} className="max-md:hidden text-center mt-16">
          <motion.button type="button" whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }} onClick={goApp} className="eg-btn-wide bg-gradient-to-r from-[#55633F] to-[#64734F] text-white px-8 py-4 rounded-full font-sans font-semibold hover:from-[#64734F] hover:to-[#55633F] transition-all duration-300 shadow-lg text-lg">
            {t('cta')}
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}
