'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { bookService, peso, serviceView } from './serviceText'

// 模版的项目卡：上面一张图（右上价格、左下时长），下面名字、介绍、按钮。
// 模版在按钮上面放了五颗星和 (4.9)——我们没有这个数，换成三档真价格（读后台）。
export default function ServiceCard({ service, index = 0, fullText = false }) {
  const t = useTranslations('common')
  const tn = useTranslations('serviceNames')
  const ti = useTranslations('serviceInfo')
  const tAlt = useTranslations('services.photoAlt')
  const view = serviceView(service, { tn, ti, tAlt })
  const span = view.minMinutes && view.maxMinutes
    ? (view.minMinutes === view.maxMinutes ? t('minutes', { count: view.minMinutes }) : t('minutesRange', { min: view.minMinutes, max: view.maxMinutes }))
    : ''
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: (index % 3) * 0.1, ease: 'easeOut' }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="group bg-white rounded-3xl overflow-hidden shadow-lg flex flex-col"
    >
      <div className="relative h-64 overflow-hidden">
        <img src={view.photo.src} alt={view.photo.alt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {view.fromPrice ? (
          <div className="absolute top-4 right-4 bg-[#64734F] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">{t('fromPrice', { price: peso(view.fromPrice) })}</div>
        ) : null}
        {span ? (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {span}
          </div>
        ) : null}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-serif text-xl text-[#0F0F0F] mb-3 group-hover:text-[#55633F] transition-colors duration-300">{view.name}</h3>
        {view.description ? <p className={`text-gray-600 text-sm leading-relaxed mb-4 ${fullText ? '' : 'line-clamp-3'}`}>{view.description}</p> : null}
        <div className="mt-auto">
          {view.options.length ? (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {view.options.map((option) => (
                <div key={option.durationMinutes} className="rounded-xl bg-[#F8F2EC] px-2 py-2 text-center">
                  <span className="block text-[11px] text-gray-500">{t('minutes', { count: option.durationMinutes })}</span>
                  <b className="block text-base font-semibold text-[#0F0F0F]">{peso(option.price)}</b>
                </div>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => bookService(service)}
            className="w-full bg-[#64734F]/10 text-[#55633F] py-3 rounded-full font-medium hover:bg-[#64734F] hover:text-white transition-all duration-300 group-hover:shadow-lg flex items-center justify-center gap-2"
          >
            {t('bookNow')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
