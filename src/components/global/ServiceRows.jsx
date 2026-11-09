'use client'

import { useTranslations } from 'next-intl'
import { bookService, peso, serviceView } from './serviceText'

// 项目和价格一行一行（价目页用）。价格都读后台，不写死。
export default function ServiceRows({ services = [], bookable = true, showText = true }) {
  const t = useTranslations('common')
  const tn = useTranslations('serviceNames')
  const ti = useTranslations('serviceInfo')
  const tAlt = useTranslations('services.photoAlt')
  return (
    <ul className="ga-rows">
      {services.map((service) => {
        const view = serviceView(service, { tn, ti, tAlt })
        return (
          <li className="ga-row" key={service.id || service.name}>
            <div className="ga-row-name">
              <h3>{view.name}</h3>
              {showText && view.description ? <p>{view.description}</p> : null}
            </div>
            <div className="ga-row-prices">
              {view.options.map((option) => (
                <div key={option.durationMinutes}><span>{t('minutes', { count: option.durationMinutes })}</span><b className="ga-n">{peso(option.price)}</b></div>
              ))}
            </div>
            {bookable ? <button type="button" className="ga-row-book" onClick={() => bookService(service)}>{t('bookNow')}</button> : null}
          </li>
        )
      })}
    </ul>
  )
}
