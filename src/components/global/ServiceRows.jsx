'use client'

// 项目和价格的一行行（首页、服务页、价目页共用）。价格都读后台，不写死。
const peso = (value) => `₱${Number(value).toLocaleString('en-US')}`
const niceName = (name) => String(name || '').replace(/\(/, ' (').replace(/\s+/g, ' ').trim()
const bookService = (service) => window.dispatchEvent(new CustomEvent('open-booking-modal-with-service', { detail: { service } }))

// 每个项目配一张图（公司现有素材）。项目名读后台，这里按关键字对；后台新加的项目先用毛巾那张，不会空着
const PHOTOS = [
  [/deep/i, { src: '/global/photos/deep.webp', alt: 'A therapist in the EasyGoSpa uniform working into a client\'s back through a soft towel' }],
  [/stone/i, { src: '/global/photos/stones-back.webp', alt: 'Warm black stones placed along a client\'s back' }],
  [/aroma/i, { src: '/global/photos/oils.webp', alt: 'Small bottles of essential oil with eucalyptus on white linen' }],
  [/shiatsu/i, { src: '/global/photos/shoulders.webp', alt: 'A therapist pressing a clothed client\'s shoulders in a bright condo' }],
  [/swedish/i, { src: '/global/photos/swedish.webp', alt: 'A client resting under a towel while a therapist in uniform massages her back' }],
  [/thai/i, { src: '/global/photos/thai.webp', alt: 'A therapist guiding a seated client through a Thai stretch at home' }],
]
const FALLBACK_PHOTO = { src: '/global/photos/towels.webp', alt: 'Fresh rolled and folded towels on a dark wood bench' }
export const photoFor = (name) => PHOTOS.find(([match]) => match.test(String(name || '')))?.[1] || FALLBACK_PHOTO

export default function ServiceRows({ services = [], light = false, bookable = true, fullText = false, showText = true, photos = false, active = -1, onPick }) {
  return (
    <ul className={`ga-rows${light ? ' is-light' : ''}`}>
      {services.map((service, index) => (
        <li
          className={`ga-row${index === active ? ' is-on' : ''}`}
          key={service.id || service.name}
          data-reveal
          data-row={index}
          onPointerEnter={onPick ? () => onPick(index) : undefined}
        >
          {/* 手机上图跟着每一行；电脑上这张藏起来不下载，用旁边那扇拱门 */}
          {photos ? <figure className="ga-row-photo"><img src={photoFor(service.name).src} alt={photoFor(service.name).alt} loading="lazy" /></figure> : null}
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
