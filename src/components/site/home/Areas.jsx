'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { AREAS } from '../areas'

// 模版这里是一排大牌商标（古驰、迪奥……）在走。我们没有合作品牌，换成服务地区名字，同样的走法和灰字。
export default function Areas() {
  const t = useTranslations('home.areas')
  const tc = useTranslations('common')
  const row = [...AREAS, ...AREAS]
  return (
    <motion.section initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} viewport={{ once: true }} className="eg-sec eg-areas py-12 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        {/* 11-15 手机上：标题跟别的块一样靠左粗体，右边「全部 ›」去服务范围页；区名换成小胶囊（site.css 末尾） */}
        <div className="eg-head-row">
          <h3 className="eg-areas-title text-sm font-sans font-bold uppercase tracking-widest text-gray-500 mb-10">{t('title')}</h3>
          <Link href="/coverage" className="eg-more">{tc('seeAll')} ›</Link>
        </div>
        <div className="eg-areas-wrap relative w-full overflow-hidden eg-marquee-wrap">
          <div className="eg-marquee eg-marquee-slow">
            {row.map((area, i) => (
              <div key={i} className="eg-area flex-shrink-0 mx-8 lg:mx-12 flex items-center justify-center h-20" aria-hidden={i >= AREAS.length ? 'true' : undefined}>
                <span className="font-serif text-3xl md:text-4xl text-gray-400 hover:text-[#55633F] transition-colors duration-300 whitespace-nowrap">{area}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
