'use client'

import { useRouter } from '@/i18n/navigation'

// 官网所有「预约」都去 App（2026-11-12 老板「官网 就不弄那么复杂了，下单链接啥的全部到app」）：
// 手机上走 /app（安卓去谷歌商店、苹果去 App Store，还没上架的回首页下载区）；电脑上去当前语言首页的下载区（二维码 + 两个商店按钮）。
// 门店预约不走这里：官网门店页「去门店预约」跳门店网站（另外做）。
export function useGoApp(from = 'book') {
  const router = useRouter()
  return () => {
    const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent || ''
    if (/android|iphone|ipad|ipod/i.test(ua)) {
      window.location.href = `/app?from=${encodeURIComponent(from)}`
      return
    }
    router.push('/#app')
  }
}

export default function AppButton({ className = '', from = 'book', children }) {
  const go = useGoApp(from)
  return (
    <button type="button" onClick={go} className={className}>
      {children}
    </button>
  )
}
