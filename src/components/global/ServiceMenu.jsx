'use client'

import { useEffect, useRef, useState } from 'react'
import ServiceRows, { photoFor } from './ServiceRows'

// 项目表 + 旁边一扇拱门：滑到哪一行、鼠标指到哪一行，拱门里就换成哪个项目的图。手机上图跟着每一行走。
export default function ServiceMenu({ services = [], light = false, fullText = false }) {
  const box = useRef(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    // 手机上拱门是藏起来的，不用算
    if (!window.matchMedia('(min-width: 961px)').matches) return undefined
    const rows = box.current?.querySelectorAll('[data-row]') || []
    const middle = new IntersectionObserver((entries) => {
      const hit = entries.filter((entry) => entry.isIntersecting).pop()
      if (hit) setActive(Number(hit.target.dataset.row))
    }, { rootMargin: '-48% 0px -48% 0px' })
    rows.forEach((row) => middle.observe(row))
    return () => middle.disconnect()
  }, [services.length])

  return (
    <div className="ga-menu-grid" ref={box}>
      <ServiceRows services={services} light={light} fullText={fullText} photos active={active} onPick={setActive} />
      <figure className="ga-menu-arch" aria-hidden="true">
        {services.map((service, index) => (
          <img
            key={service.id || service.name}
            className={index === active ? 'is-on' : undefined}
            src={photoFor(service.name).src}
            alt=""
            loading="lazy"
          />
        ))}
      </figure>
    </div>
  )
}
