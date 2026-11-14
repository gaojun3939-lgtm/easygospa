'use client'

import { useEffect, useState } from 'react'
import { Download, Sparkles, Store, Tag } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { useGoApp } from './AppButton'

// 手机底部浮起来的一排（11-15 照 easygospa.ph「像我们 App」那套，老板「照这个改」；照我们 App 的底栏）：
// 服务项目 / 价格 / 门店（官网菜单里的栏目，四样以内），右边绿色「下载 App」——手机上直接去商店，商店没开回首页下载区。
// 滑到首页下载区、页脚，或者打开菜单时整条收起来，不挡内容。只在手机上出现（样式在 site.css 末尾）。
// 推荐页 /r/<码> 不放：那一页本身就是下载页。
export default function TabBar() {
  const t = useTranslations('nav')
  const goApp = useGoApp('tabbar')
  const pathname = usePathname() || '/'
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const inView = new Set()
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? inView.add(entry.target) : inView.delete(entry.target)))
      setHidden(inView.size > 0)
    })
    document.querySelectorAll('#app, footer[role="contentinfo"]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [pathname])

  if (pathname.startsWith('/r/') || pathname === '/r') return null

  const items = [
    { href: '/services', label: t('services'), Icon: Sparkles },
    { href: '/pricing', label: t('pricing'), Icon: Tag },
    { href: '/stores', label: t('stores'), Icon: Store },
  ]
  return (
    <nav className="eg-tabbar" data-hidden={hidden ? '1' : '0'} aria-label={t('mainAria')} aria-hidden={hidden ? 'true' : undefined}>
      {items.map(({ href, label, Icon }) => (
        <Link key={href} href={href} className="eg-tab" data-active={pathname === href ? '1' : undefined} tabIndex={hidden ? -1 : undefined}>
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
      <button type="button" onClick={goApp} className="eg-tab-get" tabIndex={hidden ? -1 : undefined}>
        <Download aria-hidden="true" />
        {t('getApp')}
      </button>
    </nav>
  )
}
