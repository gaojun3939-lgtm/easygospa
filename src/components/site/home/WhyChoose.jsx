'use client'

import { motion } from 'framer-motion'
import { Banknote, Home, ShieldCheck } from 'lucide-react'
import BrandMark from '@/components/BrandMark'
import { useTranslations } from 'next-intl'
import { openBooking } from '../motion'
import { nums } from '../nums'

// 模版「Why Choose」：左边一张竖图，右边小胶囊、两行大字、一段话、三条带图标的理由、一个按钮
const FEATURES = [
  { key: 'come', icon: Home },
  { key: 'verified', icon: ShieldCheck },
  { key: 'cash', icon: Banknote },
]

export default function WhyChoose() {
  const t = useTranslations('home.why')
  return (
    <section id="why-us" className="pt-28 md:pt-32 lg:pt-36 pb-16 md:pb-20 lg:pb-24 bg-gradient-to-b from-[#F8F2EC] to-white relative overflow-hidden">
      <motion.div initial={{ opacity: 0, scale: 0.3 }} whileInView={{ opacity: 0.12, scale: 1 }} transition={{ duration: 2.5, ease: 'easeOut', delay: 0.3 }} viewport={{ once: true }} className="absolute bottom-10 left-10" aria-hidden="true">
        <div className="w-96 h-96 bg-[#64734F] rounded-full blur-3xl" />
      </motion.div>

      <div className="relative mx-auto px-6 max-w-7xl lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 items-center">
        <motion.div initial={{ opacity: 0, y: 80, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1.1, ease: 'easeOut' }} viewport={{ once: true }} className="flex justify-center">
          <img src="/global/photos/place-home.webp" alt={t('imageAlt')} className="w-full max-w-[520px] aspect-[3/4] object-cover rounded-2xl shadow-xl" loading="lazy" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 80 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: 'easeOut' }} viewport={{ once: true }} className="space-y-8 text-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#64734F]/10 rounded-full px-4 py-2 mb-6">
              <BrandMark size={22} />
              <span className="font-sans text-sm text-[#55633F] font-medium uppercase tracking-wider">{t('pill')}</span>
            </div>
            <h2 className="font-serif text-4xl md:text-[2.6rem] lg:text-5xl mb-6 leading-tight">
              <span className="text-[#0F0F0F]">{nums(t('title1'))}</span>
              <br />
              <span className="text-[#64734F]">{nums(t('title2'))}</span>
            </h2>
            <p className="font-sans text-lg text-gray-600 leading-relaxed mb-2 max-w-3xl mx-auto">{t('lead')}</p>
          </div>

          <div className="space-y-8 max-w-2xl mx-auto text-left">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.key}
                initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: i * 0.2, ease: 'easeOut' }}
                viewport={{ once: true }}
                className="flex items-start gap-4 group"
              >
                <div className="w-14 h-14 bg-[#64734F]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#64734F] transition-all duration-500 flex-shrink-0">
                  <feature.icon className="w-7 h-7 text-[#64734F] group-hover:text-white transition-colors duration-300" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-xl text-[#0F0F0F] mb-1 group-hover:text-[#55633F] transition-colors duration-300">{t(`${feature.key}.title`)}</h3>
                  <p className="font-sans text-sm font-medium text-[#64734F] uppercase tracking-wider mb-2">{t(`${feature.key}.sub`)}</p>
                  <p className="font-sans text-gray-600 leading-relaxed">{t(`${feature.key}.text`)}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="pt-4">
            <motion.button type="button" whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }} onClick={openBooking} className="bg-[#64734F] text-white px-8 py-4 rounded-full font-sans font-medium hover:bg-[#55633F] transition-colors duration-300 shadow-lg">
              {t('cta')}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
