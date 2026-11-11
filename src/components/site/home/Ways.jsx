'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Home, Store } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import SectionHead from '../SectionHead'
import { openBooking } from '../motion'
import { STORES } from '../stores'
import { StorePhoto } from '../StoreParts'

// 首页「上门 / 到店」两种方式（2026-11-12 老板「官网里面 没有看到 门店下单啊？」→「先做起来」）。
// 首页只把 home 这份字传给浏览器（ClientText），所以这里的字都放在 home.ways 里，不用 stores 那份。
// 左边上门（Mia 到门口的真照片 + 预约上门）；右边到店：有门店就放第一家店的真照片和家数，一家都没有就写「首家门店即将开业」（不放示意图）。
export default function Ways() {
  const t = useTranslations('home.ways')
  const open = STORES.filter((store) => store.status === 'open')
  const first = STORES[0]
  const storeText = open.length ? t('store.textOpen', { count: open.length }) : t('store.textSoon')
  return (
    <section id="ways" className="py-16 md:py-20 lg:py-24 relative">
      <div className="mx-auto px-6 max-w-7xl lg:px-8">
        <SectionHead pill={t('pill')} title1={t('title1')} title2={t('title2')} className="mb-12" />
        <div className="grid md:grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)]">
          <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }} viewport={{ once: true }} className="group bg-white rounded-3xl overflow-hidden shadow-lg flex flex-col">
            <div className="relative aspect-[16/10] overflow-hidden">
              <img src="/global/photos/gal-step-arrive.webp" alt={t('home.alt')} className="w-full h-full object-cover object-[50%_20%] group-hover:scale-105 transition-transform duration-700" loading="lazy" />
            </div>
            <div className="p-8 flex flex-col flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-11 h-11 rounded-2xl bg-[#64734F]/10 flex items-center justify-center"><Home className="w-5 h-5 text-[#64734F]" aria-hidden="true" /></span>
                <h3 className="font-serif text-2xl text-[#0F0F0F]">{t('home.title')}</h3>
              </div>
              <p className="text-gray-600 leading-relaxed mb-6">{t('home.text')}</p>
              <button type="button" onClick={openBooking} className="mt-auto self-start inline-flex items-center gap-2 bg-[#64734F] text-white px-6 py-3 rounded-full font-medium hover:bg-[#55633F] transition-colors shadow-lg">
                {t('home.button')}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: 'easeOut' }} viewport={{ once: true }} className="group bg-white rounded-3xl overflow-hidden shadow-lg flex flex-col">
            <div className="relative aspect-[16/10] overflow-hidden">
              {first ? (
                <StorePhoto store={first} alt={t('store.alt', { store: first.name })} className="group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#64734F] to-[#3F4A33] flex flex-col items-center justify-center gap-4" aria-hidden="true">
                  <Store className="w-14 h-14 text-white/90" strokeWidth={1.4} />
                  <span className="bg-white/90 text-[#55633F] px-4 py-1.5 rounded-full text-sm font-medium">{t('store.soon')}</span>
                </div>
              )}
            </div>
            <div className="p-8 flex flex-col flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-11 h-11 rounded-2xl bg-[#64734F]/10 flex items-center justify-center"><Store className="w-5 h-5 text-[#64734F]" aria-hidden="true" /></span>
                <h3 className="font-serif text-2xl text-[#0F0F0F]">{t('store.title')}</h3>
              </div>
              <p className="text-gray-600 leading-relaxed mb-6">{storeText}</p>
              <Link href="/stores" className="mt-auto self-start inline-flex items-center gap-2 bg-[#64734F]/10 text-[#55633F] px-6 py-3 rounded-full font-medium hover:bg-[#64734F] hover:text-white transition-colors">
                {t('store.button')}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
