'use client'

// 项目和价格的一行行（首页、服务页、价目页共用）。价格都读后台，不写死。
const peso = (value) => `₱${Number(value).toLocaleString('en-US')}`
const niceName = (name) => String(name || '').replace(/\(/, ' (').replace(/\s+/g, ' ').trim()
const bookService = (service) => window.dispatchEvent(new CustomEvent('open-booking-modal-with-service', { detail: { service } }))

export default function ServiceRows({ services = [], light = false, bookable = true, fullText = false, showText = true }) {
  return (
    <ul className={`ga-rows${light ? ' is-light' : ''}`}>
      {services.map((service) => (
        <li className="ga-row" key={service.id || service.name} data-reveal>
          <div className="ga-row-name">
            <h3>{niceName(service.name)}</h3>
            {showText && service.description ? <p className={fullText ? 'is-full' : undefined}>{service.description}</p> : null}
          </div>
          <div className="ga-row-prices">
            {(service.durationOptions || []).map((option) => (
              <div key={option.durationMinutes}><span>{option.durationMinutes} min</span><b className="ga-n">{peso(option.price)}</b></div>
            ))}
          </div>
          {bookable ? <button type="button" className="ga-row-book" onClick={() => bookService(service)}>Book Now</button> : null}
        </li>
      ))}
    </ul>
  )
}
