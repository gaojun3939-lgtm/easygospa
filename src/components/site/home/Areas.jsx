'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { AREAS } from '../areas'

// 模版这里是一排大牌商标（古驰、迪奥……）在走。我们没有合作品牌，换成服务地区名字，同样的走法和灰字。
export default function Areas() {
  const t = useTranslations('home.areas')
  const row = [...AREAS, ...AREAS]
  return (
    <motion.section initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} viewport={{ once: true }} className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <h3 className="text-sm font-sans font-bold uppercase tracking-widest text-gray-500 mb-10">{t('title')}</h3>
        <div className="relative w-full overflow-hidden eg-marquee-wrap">
          <div className="eg-marquee eg-marquee-slow">
            {row.map((area, i) => (
              <div key={i} className="flex-shrink-0 mx-8 lg:mx-12 flex items-center justify-center h-20" aria-hidden={i >= AREAS.length ? 'true' : undefined}>
                <span className="font-serif text-3xl md:text-4xl text-gray-400 hover:text-[#55633F] transition-colors duration-300 whitespace-nowrap">{area}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
