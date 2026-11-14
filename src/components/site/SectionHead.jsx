'use client'

import { motion } from 'framer-motion'
import BrandMark from '@/components/BrandMark'
import { Link } from '@/i18n/navigation'
import { rise } from './motion'
import { nums } from './nums'

// 模版每一块的标题：小胶囊 + 两行大字（第二行绿色）+ 一段说明
// 小胶囊前面的图标 11-11 起用我们定稿的莲花（模版原来是星星，老板「这个服务项目的logo也没改成我们的」）
// 手机上（11-15 照 easygospa.ph「像我们 App」那套，样式在 site.css 末尾）：靠左、20 号粗体一行、不放小胶囊，
// 右边一个「全部 ›」（more，只在手机上出现）点进对应的页。电脑上跟原来一模一样。
export default function SectionHead({ pill, title1, title2, lead, dark = false, as: Tag = 'h2', className = 'mb-14', more }) {
  return (
    <motion.div {...rise()} className={`eg-head text-center ${className}`}>
      {pill ? (
        <div className={`eg-pill inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 ${dark ? 'bg-[#64734F]/85' : 'bg-[#64734F]/10'}`}>
          <BrandMark size={28} tone={dark ? 'light' : 'brand'} />
          <span className={`font-sans text-sm font-medium uppercase tracking-wider ${dark ? 'text-white' : 'text-[#55633F]'}`}>{pill}</span>
        </div>
      ) : null}
      <div className="eg-head-row">
        <Tag className={`eg-title font-serif text-4xl md:text-5xl lg:text-6xl leading-tight mb-6 ${dark ? 'eg-title-dark text-white' : 'text-[#0F0F0F]'}`}>
          {nums(title1)}
          {title2 ? (
            <>
              <br className="eg-br" />
              <span className={`eg-t2 ${dark ? 'text-[#C9D4B4]' : 'text-[#64734F]'}`}> {nums(title2)}</span>
            </>
          ) : null}
        </Tag>
        {more ? (
          <Link href={more.href} className="eg-more">
            {more.label} ›
          </Link>
        ) : null}
      </div>
      {lead ? <p className={`eg-lead font-sans text-lg leading-relaxed max-w-3xl mx-auto ${dark ? 'text-gray-100' : 'text-gray-600'}`}>{lead}</p> : null}
    </motion.div>
  )
}
