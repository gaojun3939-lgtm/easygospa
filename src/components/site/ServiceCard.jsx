'use client'

import { motion } from 'framer-motion'
import { ArrowRight, ChevronRight, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { NEED_ICONS, needOf, peso, serviceView } from './serviceText'
import { Link } from '@/i18n/navigation'
import { useGoApp } from './AppButton'

// 模版的项目卡：上面一张图（右上价格、左下时长），下面名字、介绍、按钮。
// 模版在按钮上面放了五颗星和 (4.9)——我们没有这个数，换成三档真价格（读后台）。
// 服务页传 need：名字上面带「身体需要什么」小标签（图标跟首页那排卡片同一套）；anchor 给首页点进来滚到这张用；highlight = 首页点的就是这张，加一圈绿边。
// row：首页项目区用。手机上（768 以下）整张卡变成 App「选项目」那样的一行：小图、名字、「60–120 分钟 · ₱1,000 起」、右边箭头，
// 点一行进项目页那一项（11-15 照 .ph「像我们 App」）。描述、三档价格、按钮手机上收起（项目页里都有）。电脑上不变。
export default function ServiceCard({ service, index = 0, fullText = false, need = '', anchor, highlight = false, row = false }) {
  const t = useTranslations('common')
  const goApp = useGoApp('service')
  const tNeed = useTranslations('services.needs')
  const NeedIcon = need ? NEED_ICONS[need] : null
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
      id={anchor}
      className={`eg-svc group bg-white rounded-3xl overflow-hidden shadow-lg flex flex-col scroll-mt-28 ${highlight ? 'ring-[3px] ring-[#64734F] ring-offset-4 ring-offset-[#FAF7F2] shadow-2xl' : ''}`}
    >
      <div className="eg-svc-img relative h-64 overflow-hidden">
        <img src={view.photo.src} alt={view.photo.alt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" decoding="async" />
        <div className="eg-svc-badge absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {view.fromPrice ? (
          <div className="eg-svc-badge absolute top-4 right-4 bg-[#64734F] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">{t('fromPrice', { price: peso(view.fromPrice) })}</div>
        ) : null}
        {span ? (
          <div className="eg-svc-badge absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {span}
          </div>
        ) : null}
      </div>
      <div className="eg-svc-body p-6 flex flex-col flex-1">
        {NeedIcon ? (
          <span className="self-start inline-flex items-center gap-1.5 bg-[#64734F]/10 text-[#55633F] px-3 py-1 rounded-full text-xs font-medium mb-3">
            <NeedIcon className="w-3.5 h-3.5" aria-hidden="true" />
            {tNeed(need)}
          </span>
        ) : null}
        <h3 className="eg-svc-name font-serif text-xl text-[#0F0F0F] mb-3 group-hover:text-[#55633F] transition-colors duration-300">{view.name}</h3>
        {row && (span || view.fromPrice) ? <p className="eg-svc-meta">{[span, view.fromPrice ? t('fromPrice', { price: peso(view.fromPrice) }) : ''].filter(Boolean).join(' · ')}</p> : null}
        {view.description ? <p className={`eg-svc-desc text-gray-600 text-sm leading-relaxed mb-4 ${fullText ? '' : 'line-clamp-3'}`}>{view.description}</p> : null}
        <div className="eg-svc-foot mt-auto">
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
            onClick={goApp}
            className="w-full bg-[#64734F]/10 text-[#55633F] py-3 rounded-full font-medium hover:bg-[#64734F] hover:text-white transition-all duration-300 group-hover:shadow-lg flex items-center justify-center gap-2"
          >
            {t('bookNow')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
          </button>
        </div>
      </div>
      {row ? (
        <>
          <span className="eg-svc-go" aria-hidden="true"><ChevronRight /></span>
          <Link href={(need || needOf(service?.name)) ? `/services?need=${need || needOf(service?.name)}` : '/services'} className="eg-svc-link" aria-label={view.name} />
        </>
      ) : null}
    </motion.div>
  )
}
