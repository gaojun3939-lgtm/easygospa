import { getTranslations } from 'next-intl/server'
import { Banknote, BadgeCheck, CalendarClock, Clock, DoorOpen, IdCard, MapPin, Shirt, ShieldCheck, UserRoundCheck } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import ServiceCards from './ServiceCards'
import { peso } from './serviceText'

// 首页（2026-11-09 老板「改简单 这个太花哨了」）：平常网站那种一块一块往下排，没有跟着滑动播放的画面。
// 图全是公司现有素材，没有按摩床。项目和价格读后台。
const AREAS = ['Makati', 'BGC', 'Taguig', 'Pasay', 'Manila', 'Quezon City', 'Pasig', 'Mandaluyong']

function lowestPrice(services) {
  const prices = services.flatMap((service) => (service.durationOptions || []).map((option) => Number(option.price))).filter((price) => price > 0)
  return prices.length ? Math.min(...prices) : 0
}

/** @param {{ locale: string, services?: any[] }} props */
export default async function SiteHome({ locale, services = [] }) {
  const t = await getTranslations({ locale, namespace: 'home' })
  const c = await getTranslations({ locale, namespace: 'common' })
  const from = lowestPrice(services)

  return (
    <div className="ga ga-home">
      <section className="ga-hero ga-wrap">
        <div className="ga-hero-in">
          <div>
            <p className="ga-eyebrow">{c('tagline')}</p>
            <h1>{t('hero.title')}</h1>
            <p className="ga-lead">{t('hero.lead')}</p>
            <div className="ga-hero-actions">
              <button type="button" className="ga-btn ga-btn-big" data-open-booking="1">{c('bookNow')}</button>
              <Link className="ga-btn ga-btn-big ga-btn-line" href="/pricing">{t('hero.prices')}</Link>
            </div>
            {from ? <p className="ga-hero-note">{t('hero.note', { price: peso(from) })}</p> : null}
          </div>
          <figure className="ga-hero-pic">
            <img src="/global/photos/therapist-portrait.webp" alt={t('hero.imageAlt')} fetchPriority="high" style={{ objectPosition: '72% 35%' }} />
          </figure>
        </div>
      </section>

      <section className="ga-wrap">
        <ul className="ga-highlights">
          <li><Clock size={22} aria-hidden="true" />{t('highlights.available')}</li>
          <li><ShieldCheck size={22} aria-hidden="true" />{t('highlights.verified')}</li>
          <li><MapPin size={22} aria-hidden="true" />{t('highlights.coverage')}</li>
          <li><Banknote size={22} aria-hidden="true" />{t('highlights.cash')}</li>
        </ul>
      </section>

      <section className="ga-sec">
        <div className="ga-wrap">
          <div className="ga-sec-head">
            <div>
              <h2>{t('menu.title')}</h2>
              <p className="ga-lead">{t('menu.lead')}</p>
            </div>
            <Link className="ga-more" href="/pricing">{t('menu.all')} →</Link>
          </div>
          <ServiceCards services={services} />
        </div>
      </section>

      <section className="ga-sec ga-sec-tint">
        <div className="ga-wrap">
          <div className="ga-sec-head"><div><h2>{t('steps.title')}</h2></div></div>
          <ol className="ga-steps">
            {/* 2026-11-09 老板「视频做的截图很丑」：三步不配图，图标加文字 */}
            {[
              ['one', UserRoundCheck],
              ['two', CalendarClock],
              ['three', Banknote],
            ].map(([key, Icon]) => (
              <li key={key}>
                <Icon size={30} aria-hidden="true" />
                <h3>{t(`steps.${key}.title`)}</h3>
                <p>{t(`steps.${key}.note`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="ga-sec">
        <div className="ga-wrap">
          <div className="ga-sec-head">
            <div>
              <h2>{t('places.title')}</h2>
              <p className="ga-lead">{t('places.lead')}</p>
            </div>
          </div>
          <ul className="ga-places">
            {[
              ['home', '/global/photos/home-day.webp', '74% 50%'],
              ['condo', '/global/photos/condo-night.webp', '74% 50%'],
              ['hotel', '/global/photos/hotel.webp', '50% 50%'],
            ].map(([key, src, position]) => (
              <li key={key}>
                <figure>
                  <img src={src} alt={t(`places.${key}Alt`)} loading="lazy" style={{ objectPosition: position }} />
                  <figcaption>{t(`places.${key}`)}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="ga-sec ga-sec-tint">
        <div className="ga-wrap ga-trust">
          <figure className="ga-trust-pic"><img src="/global/photos/badge.webp" alt={t('trust.imageAlt')} loading="lazy" /></figure>
          <div>
            <h2>{t('trust.title')}</h2>
            <p className="ga-lead">{t('trust.lead')}</p>
            <ul>
              <li><BadgeCheck size={26} aria-hidden="true" /><b>{t('trust.licensed.title')}</b><span>{t('trust.licensed.note')}</span></li>
              <li><Shirt size={26} aria-hidden="true" /><b>{t('trust.uniformed.title')}</b><span>{t('trust.uniformed.note')}</span></li>
              <li><IdCard size={26} aria-hidden="true" /><b>{t('trust.verified.title')}</b><span>{t('trust.verified.note')}</span></li>
              <li><DoorOpen size={26} aria-hidden="true" /><b>{t('trust.door.title')}</b><span>{t('trust.door.note')}</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="ga-sec">
        <div className="ga-wrap">
          <h2>{t('price.title')}</h2>
          <ul className="ga-stats">
            <li><b className="ga-n">{t('price.cash')}</b><span>{t('price.cashLabel')}</span></li>
            <li><b className="ga-n">₱0</b><span>{t('price.tipsLabel')}</span></li>
            <li><b className="ga-n">{t('price.allDay')}</b><span>{t('price.allDayLabel')}</span></li>
          </ul>
          <p className="ga-stats-note">{t('price.note')}</p>
        </div>
      </section>

      <section className="ga-sec ga-sec-tint">
        <div className="ga-wrap ga-areas">
          <div>
            <h2>{t('areas.title')}</h2>
            <p className="ga-lead">{t('areas.lead')}</p>
            <ul className="ga-chips">{AREAS.map((area) => <li key={area}>{area}</li>)}</ul>
            <Link className="ga-more" href="/coverage">{t('areas.link')} →</Link>
          </div>
          <figure><img src="/global/photos/city-window.webp" alt="" loading="lazy" /></figure>
        </div>
      </section>

      <section className="ga-cta">
        <div className="ga-wrap">
          <h2>{t('closing.title')}</h2>
          <p>{t('closing.lead')}</p>
          <button type="button" className="ga-btn ga-btn-big ga-btn-light" data-open-booking="1">{c('bookNow')}</button>
        </div>
      </section>

      <div className="ga-bar">
        {from ? <b className="ga-n">{c('fromPrice', { price: peso(from) })}</b> : <b />}
        <button type="button" className="ga-btn" data-open-booking="1">{c('bookNow')}</button>
      </div>
    </div>
  )
}
