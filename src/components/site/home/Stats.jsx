'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, HandCoins, Tag, Users, Wallet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { peso } from '../serviceText'
import { nums } from '../nums'
import TitleTail from '../TitleTail'

// 模版「Our Impact」：整幅照片压暗，标题 + 一段话 + 四个大字。
// 模版的四个数（2000+ 客人、4.9 分、15 个奖、5 年）我们拿不出来，换成四样真的：起步价、到场付现金或 App 里线上付款（11-12 老板「线上开通了」）、不收小费、24 小时。
// 起步价从 0 往上跳（模版的跳数动效），读后台最低价；别的三样是字，不跳。
function CountUp({ to }) {
  const ref = useRef(null)
  const [value, setValue] = useState(to)
  useEffect(() => {
    const el = ref.current
    if (!el || !to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setValue(0)
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const tick = (now) => {
        const p = Math.min(1, (now - start) / 1600)
        setValue(Math.round(to * (1 - Math.pow(1 - p, 3))))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [to])
  return <span ref={ref}>{peso(value)}</span>
}

export default function Stats({ fromPrice }) {
  const t = useTranslations('home.stats')
  const items = [
    { key: 'from', icon: Tag, value: fromPrice ? <span className="eg-n"><CountUp to={fromPrice} /></span> : null },
    { key: 'cash', icon: Wallet },
    { key: 'tips', icon: HandCoins },
    { key: 'open', icon: Clock },
  ].filter((item) => item.key !== 'from' || item.value)
  return (
    <section id="stats-section" style={{ backgroundImage: 'url(/global/photos/band-living.webp)' }} className="eg-sec eg-band py-16 md:py-24 bg-center bg-cover bg-no-repeat relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 z-10 relative">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} viewport={{ once: true }} className="eg-band-head text-center mb-16">
          <div className="eg-pill inline-flex items-center gap-2 bg-[#64734F]/85 rounded-full px-4 py-2 mb-6 mx-auto">
            <Users className="w-4 h-4 text-white" aria-hidden="true" />
            <span className="font-sans text-sm text-white font-medium uppercase tracking-wider">{t('pill')}</span>
          </div>
          <h2 className="eg-band-title font-serif text-4xl text-white md:text-5xl lg:text-6xl mb-6">
            {nums(t('title1'))}
            <TitleTail t1={t('title1')} t2={t('title2')} className="text-[#C9D4B4]" />
          </h2>
          <p className="eg-band-lead font-sans text-xl text-gray-100 max-w-3xl mx-auto leading-relaxed">{t('lead')}</p>
        </motion.div>

        <div className={`max-md:hidden grid grid-cols-2 gap-x-6 gap-y-10 ${items.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {items.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: i * 0.15, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-[#64734F] transition-all duration-500">
                <item.icon className="w-8 h-8 text-[#C9D4B4] group-hover:text-white transition-colors duration-300" aria-hidden="true" />
              </div>
              <p className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#f8f2ec]">{item.value || nums(t(`${item.key}.value`))}</p>
              <p className="font-sans text-sm text-gray-200 uppercase tracking-wider mt-2">{t(`${item.key}.label`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
