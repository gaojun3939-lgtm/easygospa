'use client'

import { useEffect, useRef } from 'react'
import { ArrowRight, Flame, Footprints, Hand, HeartPulse, Leaf, Moon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import SectionHead from '../SectionHead'
import { NEED_ORDER } from '../serviceText'

// 模版「Curated Wellness Journeys」：一排彩色卡片自己慢慢往左走，鼠标放上去停。
// 模版写的是会员卡项目（美甲、修眉、做头发……），我们换成「身体需要什么」六种，点进服务页对应那一类。
const STYLE = {
  relax: { icon: Leaf, bg: 'bg-[#F5E6D8]' },
  muscles: { icon: HeartPulse, bg: 'bg-[#E8F4F8]' },
  stretch: { icon: Footprints, bg: 'bg-white border border-[#64734F]/20' },
  pressure: { icon: Hand, bg: 'bg-[#EEF2E6]' },
  warmth: { icon: Flame, bg: 'bg-[#F8E8F0]' },
  calm: { icon: Moon, bg: 'bg-[#F3F0E8]' },
}

export default function Journeys() {
  const t = useTranslations('home.journeys')
  const tn = useTranslations('services.needs')
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
    <section className="py-16 md:py-20 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <SectionHead pill={t('pill')} title1={t('title1')} title2={t('title2')} lead={t('lead')} className="mb-12" />
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white via-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white to-transparent z-10 pointer-events-none" />
          <div ref={scrollRef} className="flex gap-6 overflow-x-auto scrollbar-hide pb-4">
            {[...NEED_ORDER, ...NEED_ORDER].map((need, i) => {
              const style = STYLE[need]
              return (
                <Link key={`${need}-${i}`} href={`/services?need=${need}`} className="flex-shrink-0 w-72 sm:w-80 group" aria-hidden={i >= NEED_ORDER.length ? 'true' : undefined} tabIndex={i >= NEED_ORDER.length ? -1 : undefined}>
                  <div className={`${style.bg} rounded-3xl p-6 h-full flex flex-col hover:shadow-xl transition-all duration-500 group-hover:-translate-y-2 min-h-[280px]`}>
                    <div className="mb-6 text-[#8B6F3F] group-hover:text-[#64734F] transition-colors duration-300">
                      <style.icon className="w-9 h-9 md:w-10 md:h-10" strokeWidth={1.5} aria-hidden="true" />
                    </div>
                    <h3 className="font-serif text-2xl text-[#0F0F0F] mb-4 group-hover:text-[#55633F] transition-colors duration-300 leading-tight">{tn(need)}</h3>
                    <p className="font-sans text-gray-500 leading-relaxed mb-6 flex-grow">{t(`items.${need}`)}</p>
                    <div className="flex items-center gap-2 font-sans text-sm font-medium text-gray-500 group-hover:text-[#55633F] transition-colors duration-300 mt-auto uppercase tracking-wide">
                      {t('more')}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
        <p className="font-sans text-sm text-gray-400 text-center mt-8">{t('hint')}</p>
      </div>
    </section>
  )
}
