'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import BrandMark from '@/components/BrandMark'

// 模版首屏底下压着的圆章：中间是我们的莲花标和名字，外圈一圈字慢慢转
export default function Seal() {
  const t = useTranslations('home.seal')
  // 11-15 手机上不放（max-md:hidden，照 .ph「像我们 App」：模版的转圈圆章手机上不放，首屏下面换成白卡 QuickCard）
  return (
    <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 z-30 max-md:hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        viewport={{ once: true }}
        className="relative w-[140px] h-[140px] md:w-[160px] md:h-[160px] lg:w-[180px] lg:h-[180px]"
      >
        <div className="absolute inset-0 bg-[#F5E6D8] rounded-full shadow-xl p-3 md:p-4 lg:p-5">
          <div className="w-full h-full rounded-full flex flex-col items-center justify-center bg-white text-center px-2">
            <BrandMark size={44} />
            <p className="font-serif text-[#333333] leading-tight mt-1" style={{ fontSize: 'clamp(15px, 3.4vw, 18px)', letterSpacing: '0.5px' }}>EasyGoSpa</p>
            <p className="font-sans text-[#55633F] tracking-wider" style={{ fontSize: 'clamp(10px, 2.3vw, 12px)' }}>{t('sub')}</p>
          </div>
        </div>
        <motion.div className="absolute inset-0 w-full h-full" animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} aria-hidden="true">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path id="eg-seal-path" d="M 50, 50 m -42, 0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0" fill="transparent" />
            <text fill="#333333" className="uppercase" style={{ fontSize: '6.4px', fontFamily: 'var(--ga-sans)', letterSpacing: '0.5px' }}>
              <textPath href="#eg-seal-path" textLength="262" lengthAdjust="spacingAndGlyphs">{t('ring')}</textPath>
            </text>
          </svg>
        </motion.div>
      </motion.div>
    </div>
  )
}
