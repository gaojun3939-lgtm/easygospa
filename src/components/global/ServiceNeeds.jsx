'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { NEED_ORDER, bookService, needOf, peso, serviceView } from './serviceText'

// 首页项目区：上面一排「身体需要什么」页签，下面一张大卡（图、名字、介绍、三档价格、预约），再下面一排小卡列出全部项目和起价。
// 价格都读后台，不写死。页签文字由服务器那层（首页）按语言传进来。
export default function ServiceNeeds({ services = [], labels = {} }) {
  const t = useTranslations('common')
  const tn = useTranslations('serviceNames')
  const ti = useTranslations('serviceInfo')
  const tAlt = useTranslations('services.photoAlt')
  const list = useMemo(() => [...services].sort((a, b) => {
    const rank = (s) => { const i = NEED_ORDER.indexOf(needOf(s.name)); return i < 0 ? 99 : i }
    return rank(a) - rank(b)
  }), [services])
  const [active, setActive] = useState(0)
  if (!list.length) return null
  const views = list.map((service) => serviceView(service, { tn, ti, tAlt }))
  const current = views[active] || views[0]
  const lowest = (view) => Math.min(...view.options.map((option) => Number(option.price)).filter((price) => price > 0))

  return (
    <div className="ga-needs">
      <div className="ga-need-tabs" role="tablist">
        {list.map((service, index) => (
          <button
            key={service.id || service.name}
            type="button"
            role="tab"
            aria-selected={index === active}
            className={index === active ? 'is-on' : undefined}
            onClick={() => setActive(index)}
          >
            {labels[needOf(service.name)] || views[index].name}
          </button>
        ))}
      </div>

      <div className="ga-need-card" role="tabpanel">
        <figure>
          {views.map((view, index) => (
            <img key={list[index].id || list[index].name} className={index === active ? 'is-on' : undefined} src={view.photo.src} alt={index === active ? view.photo.alt : ''} loading="lazy" />
          ))}
        </figure>
        <div className="ga-need-body">
          <h3>{current.name}</h3>
          {current.description ? <p>{current.description}</p> : null}
          <ul className="ga-need-prices">
            {current.options.map((option) => (
              <li key={option.durationMinutes}><span>{t('minutes', { count: option.durationMinutes })}</span><b className="ga-n">{peso(option.price)}</b></li>
            ))}
          </ul>
          <button type="button" className="ga-btn ga-btn-big" onClick={() => bookService(list[active])}>{t('bookNow')}</button>
        </div>
      </div>

      <ul className="ga-need-minis">
        {views.map((view, index) => (
          <li key={list[index].id || list[index].name}>
            <button type="button" className={index === active ? 'is-on' : undefined} onClick={() => setActive(index)}>
              <img src={view.photo.src} alt="" loading="lazy" />
              <span><b>{view.name}</b><small>{Number.isFinite(lowest(view)) ? t('fromPrice', { price: peso(lowest(view)) }) : null}</small></span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
