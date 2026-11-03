'use client'

import { useEffect, useRef } from 'react'

// 片段（公司现有素材，在 public/global/clips）。快滑到才挂上，看得见才下载才播，滑走就停；
// 播完停在最后一格，滑回来再播一次。省流量、2G、内存小的手机和「减少动态效果」只放一张静图。
export default function Clip({ name, phone, label, at = 0.3, manual = false }) {
  const ref = useRef(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return undefined
    const connection = navigator.connection
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || !!connection?.saveData
      || ['slow-2g', '2g'].includes(connection?.effectiveType)
      || (navigator.deviceMemory && navigator.deviceMemory < 3)
    const file = phone && window.matchMedia('(max-width: 960px)').matches ? phone : name
    video.muted = true
    video.setAttribute('muted', '')

    let attached = false
    const attach = () => {
      if (attached) return
      attached = true
      video.poster = `/global/clips/${file}${still ? '-still' : ''}.jpg`
      if (still) return
      // 一下跳过来时外面可能已经喊过放了，那时还没挂片子，挂上要再喊一次，不然停在第一格
      const asked = !video.paused
      video.src = `/global/clips/${file}.mp4`
      if (asked) video.play().catch(() => {})
    }
    // 手机上藏起来的片子（display: none）不下载
    const near = new IntersectionObserver((entries) => {
      if (!entries[entries.length - 1].isIntersecting || !video.getClientRects().length) return
      near.disconnect()
      attach()
    }, { rootMargin: '100% 0px' })
    near.observe(video.closest('section') || video)
    // manual：叠在一起的片子看不出谁被盖住，由外面决定什么时候放
    if (still || manual) return () => near.disconnect()

    // 滑得快时一次会攒好几条记录，只有最后一条算数；两个观察者谁先到不一定，所以这里也挂一次
    const seen = new IntersectionObserver((entries) => {
      if (entries[entries.length - 1].isIntersecting) {
        attach()
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    }, { threshold: at })
    seen.observe(video)
    return () => {
      near.disconnect()
      seen.disconnect()
    }
  }, [name, phone, at, manual])

  return <video ref={ref} muted playsInline preload="none" aria-label={label} />
}
