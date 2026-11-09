'use client'

import { useTranslations } from 'next-intl'
import { bookService, peso, serviceView } from './serviceText'

// 项目卡片：图、名字、介绍、三档价格、预约（首页、服务页共用）。价格都读后台，不写死
export default function ServiceCards({ services = [], fullText = false }) {
  const t = useTranslations('common')
  const tn = useTranslations('serviceNames')
  const ti = useTranslations('serviceInfo')
  const tAlt = useTranslations('services.photoAlt')
  return (
    <ul className="ga-cards">
      {services.map((service) => {
        const view = serviceView(service, { tn, ti, tAlt })
        return (
          <li className="ga-card" key={service.id || service.name}>
            <figure><img src={view.photo.src} alt={view.photo.alt} loading="lazy" /></figure>
            <div className="ga-card-body">
              <h3>{view.name}</h3>
              {view.description ? <p className={fullText ? 'is-full' : undefined}>{view.description}</p> : null}
              <span className="ga-card-gap" />
              <div className="ga-card-prices">
                {view.options.map((option) => (
                  <div key={option.durationMinutes}>
                    <span>{t('minutes', { count: option.durationMinutes })}</span>
                    <b className="ga-n">{peso(option.price)}</b>
                  </div>
                ))}
              </div>
              <button type="button" className="ga-btn" onClick={() => bookService(service)}>{t('bookNow')}</button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
