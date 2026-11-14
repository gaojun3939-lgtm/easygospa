'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import SectionHead from '../SectionHead'
import ServiceCard from '../ServiceCard'
import { rise } from '../motion'

// 模版「Our Services」：标题 + 三列六张项目卡 + 「看全部项目」。项目和价格读后台
/** @param {{ services?: any[] }} props */
export default function Services({ services = [] }) {
  const t = useTranslations('home.services')
  const tc = useTranslations('common')
  return (
    <section id="services" className="eg-sec pt-20 md:pt-24 pb-20 bg-gradient-to-b from-[#F8F2EC] to-white relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <SectionHead pill={t('pill')} title1={t('title1')} title2={t('title2')} lead={t('lead')} more={{ href: '/services', label: tc('seeAll') }} />
        <div className="eg-svc-list grid lg:grid-cols-3 md:grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)]">
          {services.slice(0, 6).map((service, i) => <ServiceCard key={service.id || service.name} service={service} index={i} row />)}
        </div>
        <motion.div {...rise(0.2)} className="text-center mt-16 max-md:hidden">
          <Link href="/services" className="inline-block bg-[#64734F] text-white px-8 py-4 rounded-full font-medium hover:bg-[#55633F] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
            {t('all')}
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
