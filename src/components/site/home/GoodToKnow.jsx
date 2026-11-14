'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock, HandCoins, MapPin, Quote, UserRound, Wallet } from 'lucide-react'
import { useTranslations } from 'next-intl'

// 模版这里是客人评价轮播（头像、一段话、五颗星、名字）。我们现在没有能公开的真评价，不编；
// 同样的轮播先放客人最常问的五个问题，有了真评价再换回来。
const ITEMS = [
  { key: 'pay', icon: Wallet }, // 11-12 起付款写「现金或 App 里线上付款」
  { key: 'tips', icon: HandCoins },
  { key: 'where', icon: MapPin },
  { key: 'choose', icon: UserRound },
  { key: 'when', icon: Clock },
]

export default function GoodToKnow() {
  const t = useTranslations('home.faq')
  const [index, setIndex] = useState(0)
  const timer = useRef(null)
  const start = () => {
    clearInterval(timer.current)
    timer.current = setInterval(() => setIndex((i) => (i + 1) % ITEMS.length), 6000)
  }
  useEffect(() => {
    start()
    return () => clearInterval(timer.current)
  }, [])
  const go = (i) => { setIndex((i + ITEMS.length) % ITEMS.length); start() }
  const item = ITEMS[index]
  return (
    <section className="eg-sec eg-faq py-16 md:py-20 relative overflow-hidden bg-[#FDFCF9]" onMouseEnter={() => clearInterval(timer.current)} onMouseLeave={start}>
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <Quote className="max-md:hidden absolute -top-2 right-6 w-16 h-16 text-gray-200/80" aria-hidden="true" />
        <h2 className="eg-faq-title font-serif text-4xl lg:text-5xl italic text-[#0F0F0F] mb-8 relative z-10">{t('title')}</h2>
        {/* 11-15 手机上（照 .ph「像我们 App」）：一张白卡里一行一个问题，点开看答案；电脑上还是下面的轮播 */}
        <div className="eg-faq-list md:hidden">
          {ITEMS.map((faq) => (
            <details key={faq.key}>
              <summary>{t(`${faq.key}.q`)}</summary>
              <p>{t(`${faq.key}.a`)}</p>
            </details>
          ))}
        </div>
        <div className="max-md:hidden">
        <AnimatePresence mode="wait">
          <motion.div key={item.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-6">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full shadow-lg border-4 border-white bg-gradient-to-br from-[#55633F] to-[#7B8A63] flex items-center justify-center">
                <item.icon className="w-10 h-10 text-white" strokeWidth={1.6} aria-hidden="true" />
              </div>
            </div>
            <h3 className="font-serif text-2xl md:text-3xl text-[#0F0F0F]">{t(`${item.key}.q`)}</h3>
            <p className="font-sans text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto min-h-[96px]">{t(`${item.key}.a`)}</p>
            <p className="font-sans text-sm text-gray-500 uppercase tracking-wider">{t(`${item.key}.tag`)}</p>
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center justify-center gap-8 mt-8">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => go(index - 1)} aria-label={t('prev')} className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-[#64734F] hover:text-white transition-all duration-300">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label={t('next')} className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-[#64734F] hover:text-white transition-all duration-300">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            {ITEMS.map((dot, i) => (
              <button key={dot.key} type="button" onClick={() => go(i)} aria-label={t(`${dot.key}.q`)} className={`h-2 rounded-full transition-all duration-300 ${i === index ? 'bg-[#64734F] w-6' : 'w-2 bg-gray-300 hover:bg-gray-400'}`} />
            ))}
          </div>
        </div>
        </div>
      </div>
    </section>
  )
}
