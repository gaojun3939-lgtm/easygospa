'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { NEED_ICONS, NEED_ORDER, peso } from '../serviceText'
import { nums } from '../nums'

// 只在手机上出现（11-15 照 easygospa.ph「像我们 App」那套，老板「照这个改」）：首屏片子下面一张白卡，
// 照 App 首页那张——上面三个数（起步价 / 24 小时 / 付款），下面一排「身体需要什么」小标签，点了进项目页那一类。
// 字都用首页数字区（home.stats）和项目页（services.needs）现成的，不另写。样式在 site.css 末尾。
export default function QuickCard({ fromPrice }) {
  const t = useTranslations('home.stats')
  const tc = useTranslations('common')
  const tn = useTranslations('services.needs')
  const facts = [
    fromPrice ? { big: tc('fromPrice', { price: peso(fromPrice) }), small: t('from.label') } : null,
    { big: t('open.value'), small: t('open.label') },
    { big: t('cash.value'), small: t('cash.label') },
  ].filter(Boolean)
  return (
    <div className="eg-quick md:hidden">
      <ul className="eg-quick-facts">
        {facts.map((fact) => (
          <li key={fact.big}>
            <b>{nums(fact.big)}</b>
            <span>{fact.small}</span>
          </li>
        ))}
      </ul>
      <div className="eg-quick-chips">
        {NEED_ORDER.map((need) => {
          const Icon = NEED_ICONS[need]
          return (
            <Link key={need} href={`/services?need=${need}`} className="eg-chip">
              <Icon aria-hidden="true" />
              {tn(need)}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
