'use client'

import { motion } from 'framer-motion'
import { BadgeCheck, Car, Clock, HandCoins, Home, Navigation, ReceiptText, Wallet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { nums } from '../nums'
import TitleTail from '../TitleTail'

// 模版「Purely Potent, Naturally」：标题 + 一段话 + 一排图标自己往左走。
// 模版写的是有机产品（无硫酸盐、无酒精……），我们没有这套说法，换成每一单都一样的几条实话。
const ITEMS = [
  { key: 'prices', icon: ReceiptText },
  { key: 'cash', icon: Wallet }, // 11-12 起写「现金或线上付款」
  { key: 'tips', icon: HandCoins },
  { key: 'verified', icon: BadgeCheck },
  { key: 'eta', icon: Navigation }, // 11-11 原来是「统一着装」，老板说技师不一定穿制服 → 换成 App 真有的「随时看到技师多久到」
  { key: 'open', icon: Clock },
  { key: 'places', icon: Home },
]

export default function Included() {
  const t = useTranslations('home.included')
  const row = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS]
  return (
    <motion.section initial={{ opacity: 0, y: 80 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: 'easeOut' }} viewport={{ once: true }} className="eg-sec eg-incl py-16 md:py-20 overflow-hidden relative bg-white">
      <div className="eg-head text-center mb-14 relative px-6">
        <h2 className="eg-title font-serif text-4xl md:text-5xl leading-tight">
          <span className="text-[#0F0F0F]">{nums(t('title1'))}</span>
          <TitleTail t1={t('title1')} t2={t('title2')} className="text-[#64734F]" />
        </h2>
        <p className="eg-lead font-sans text-lg text-gray-600 mt-6 max-w-3xl mx-auto leading-relaxed">{t('lead')}</p>
        {/* 11-12 老板「免小费，这个 夜班费跟车费 算是么？」→ 车费、夜间费写明（都全归技师、下单前合计里有），「透明」才说得过去 */}
        <p className="eg-incl-fees font-sans text-sm text-gray-500 mt-3 max-w-2xl mx-auto leading-relaxed flex items-start justify-center gap-1.5">
          <Car className="w-4 h-4 mt-0.5 flex-none text-[#64734F]" aria-hidden="true" />
          <span>{t('fees')}</span>
        </p>
      </div>
      <div className="eg-incl-wrap relative eg-marquee-wrap overflow-hidden">
        <div className="eg-marquee">
          {row.map((item, i) => (
            <div key={i} className="eg-incl-item flex flex-col items-center justify-center mx-6 sm:mx-8 text-center w-32" aria-hidden={i >= ITEMS.length ? 'true' : undefined}>
              <div className="eg-incl-ic w-24 h-24 rounded-full flex items-center justify-center mb-4 border-2 border-transparent hover:border-[#64734F]/30 transition-all duration-300">
                <item.icon className="w-8 h-8 text-gray-500 hover:text-[#64734F] transition-colors duration-300" strokeWidth={1.6} aria-hidden="true" />
              </div>
              <p className="font-sans text-sm text-gray-700 font-medium">{t(`items.${item.key}`)}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
