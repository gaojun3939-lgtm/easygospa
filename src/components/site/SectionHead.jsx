'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { rise } from './motion'
import { nums } from './nums'

// 模版每一块的标题：小胶囊 + 两行大字（第二行绿色）+ 一段说明
export default function SectionHead({ pill, title1, title2, lead, dark = false, as: Tag = 'h2', className = 'mb-14' }) {
  return (
    <motion.div {...rise()} className={`text-center ${className}`}>
      {pill ? (
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 ${dark ? 'bg-[#64734F]/85' : 'bg-[#64734F]/10'}`}>
          <Sparkles className={`w-4 h-4 ${dark ? 'text-white' : 'text-[#64734F]'}`} aria-hidden="true" />
          <span className={`font-sans text-sm font-medium uppercase tracking-wider ${dark ? 'text-white' : 'text-[#55633F]'}`}>{pill}</span>
        </div>
      ) : null}
      <Tag className={`font-serif text-4xl md:text-5xl lg:text-6xl leading-tight mb-6 ${dark ? 'text-white' : 'text-[#0F0F0F]'}`}>
        {nums(title1)}
        {title2 ? (
          <>
            <br />
            <span className={dark ? 'text-[#C9D4B4]' : 'text-[#64734F]'}>{nums(title2)}</span>
          </>
        ) : null}
      </Tag>
      {lead ? <p className={`font-sans text-lg leading-relaxed max-w-3xl mx-auto ${dark ? 'text-gray-100' : 'text-gray-600'}`}>{lead}</p> : null}
    </motion.div>
  )
}
