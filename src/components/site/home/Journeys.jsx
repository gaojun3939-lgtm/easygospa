'use client'

import { useEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import SectionHead from '../SectionHead'
import { NEED_ICONS, NEED_ORDER } from '../serviceText'

// 模版「Curated Wellness Journeys」：一排卡片自己慢慢往左走，鼠标放上去停。
// 模版写的是会员卡项目（美甲、修眉、做头发……），我们换成「身体需要什么」六种，点进服务页滚到对应那个项目（11-12 起服务页不再筛选）。
// 11-11 老板「这几个为什么不增加背景图片？」：模版的浅蓝、粉色色块换成同一套自家静物照（跟项目卡的图不重复），
// 字改白色放在下面、压一层深色渐变；图标放进半透明小圆底。图标跟服务页项目卡上的小标签同一套（NEED_ICONS）。
const STYLE = Object.fromEntries(NEED_ORDER.map((need) => [need, { icon: NEED_ICONS[need], photo: `/global/photos/need-${need}.webp` }]))

export default function Journeys() {
  const t = useTranslations('home.journeys')
  const tn = useTranslations('services.needs')
  const tc = useTranslations('common')
  const scrollRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let paused = false
    const id = setInterval(() => {
      if (paused) return
      if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0
      else el.scrollLeft += 1
    }, 30)
    const stop = () => { paused = true }
    const go = () => { paused = false }
    el.addEventListener('mouseenter', stop)
    el.addEventListener('mouseleave', go)
    el.addEventListener('touchstart', stop, { passive: true })
    el.addEventListener('touchend', go)
    return () => {
      clearInterval(id)
      el.removeEventListener('mouseenter', stop)
      el.removeEventListener('mouseleave', go)
      el.removeEventListener('touchstart', stop)
      el.removeEventListener('touchend', go)
    }
  }, [])

  return (
    <section className="eg-sec eg-needs py-16 md:py-20 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <SectionHead pill={t('pill')} title1={t('title1')} title2={t('title2')} lead={t('lead')} className="mb-12" more={{ href: '/services', label: tc('seeAll') }} />
        <div className="relative">
          <div className="max-md:hidden absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white via-white to-transparent z-10 pointer-events-none" />
          <div className="max-md:hidden absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white to-transparent z-10 pointer-events-none" />
          <div ref={scrollRef} className="eg-needs-row flex gap-6 overflow-x-auto scrollbar-hide pb-4">
            {[...NEED_ORDER, ...NEED_ORDER].map((need, i) => {
              const style = STYLE[need]
              return (
                <Link key={`${need}-${i}`} href={`/services?need=${need}`} className="eg-need flex-shrink-0 w-72 sm:w-80 group" aria-hidden={i >= NEED_ORDER.length ? 'true' : undefined} tabIndex={i >= NEED_ORDER.length ? -1 : undefined}>
                  <div className="relative overflow-hidden bg-[#171A17] rounded-3xl p-6 h-full flex flex-col hover:shadow-xl transition-all duration-500 group-hover:-translate-y-2 min-h-[340px]">
                    <img src={style.photo} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/5" aria-hidden="true" />
                    <div className="eg-need-ic relative w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white">
                      <style.icon className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
                    </div>
                    <div className="relative mt-auto pt-10">
                      <h3 className="font-serif text-2xl text-white mb-3 leading-tight">{tn(need)}</h3>
                      <p className="font-sans text-white/80 leading-relaxed mb-5">{t(`items.${need}`)}</p>
                      <div className="eg-need-more flex items-center gap-2 font-sans text-sm font-medium text-white/80 group-hover:text-white transition-colors duration-300 uppercase tracking-wide">
                        {t('more')}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
        <p className="max-md:hidden font-sans text-sm text-gray-400 text-center mt-8">{t('hint')}</p>
      </div>
    </section>
  )
}
