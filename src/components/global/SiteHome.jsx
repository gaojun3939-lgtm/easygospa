import { getTranslations } from 'next-intl/server'
import { BadgeCheck, DoorOpen, IdCard, Shirt } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import HeroVideo from './HeroVideo'
import ServiceNeeds from './ServiceNeeds'
import { NEED_ORDER, peso } from './serviceText'
import { nums } from './nums'

// 首页（2026-11-10 老板「图片不好看 设计也差点意思」）：照老板认可的 easygospa.ph 首页的路子——
// 整屏明亮大图配标题、一条四格亮点、按「身体需要什么」看项目和价格、整屏窗景大图、家/公寓/酒店三张图、资质、三步、夜景收尾。
// 顶上是视频；下面的图 2026-11-10 让 Codex 按真实摄影重拍（老板「现在这些图太像 AI」），没有按摩床。主色橄榄绿不换。
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
  const needLabels = Object.fromEntries(NEED_ORDER.map((key) => [key, t(`needs.${key}`)]))

  return (
    <div className="ga ga-home">
      <section className="ga-hero">
        <HeroVideo label={t('hero.imageAlt')} />
        <div className="ga-wrap ga-hero-in">
          <div className="ga-hero-text">
            <p className="ga-eyebrow">{c('tagline')}</p>
            <h1>{nums(t('hero.title'))}</h1>
            <p className="ga-lead">{t('hero.lead')}</p>
            <div className="ga-hero-actions">
              <button type="button" className="ga-btn ga-btn-big" data-open-booking="1">{c('bookNow')}</button>
              <Link className="ga-btn ga-btn-big ga-btn-line ga-btn-on-dark" href="/pricing">{t('hero.prices')}</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="ga-stats-band">
        <ul className="ga-stats ga-wrap">
          {from ? <li><b>{nums(t('stats.from', { price: peso(from) }))}</b><span>{t('stats.fromNote')}</span></li> : null}
          <li><b>{nums(t('stats.cash'))}</b><span>{t('stats.cashNote')}</span></li>
          <li><b>{nums(t('stats.tips'))}</b><span>{t('stats.tipsNote')}</span></li>
          <li><b>{nums(t('stats.open'))}</b><span>{t('stats.openNote')}</span></li>
        </ul>
      </section>

      <section className="ga-sec">
        <div className="ga-wrap">
          <div className="ga-sec-head ga-sec-head-center">
            <div>
              <h2>{t('menu.title')}</h2>
              <p className="ga-lead">{t('menu.lead')}</p>
            </div>
          </div>
          <ServiceNeeds services={services} labels={needLabels} />
          <p className="ga-center"><Link className="ga-more" href="/pricing">{t('menu.all')} →</Link></p>
        </div>
      </section>

      <section className="ga-band">
        <img src="/global/photos/band-living.webp" alt={t('band.alt')} loading="lazy" />
        <div className="ga-wrap ga-band-text">
          <h2>{t('band.title')}</h2>
          <p className="ga-lead">{t('band.lead')}</p>
        </div>
      </section>
      <section className="ga-areas">
        <div className="ga-wrap">
          <ul>{AREAS.map((area) => <li key={area}>{area}</li>)}</ul>
          <Link className="ga-more" href="/coverage">{t('band.link')} →</Link>
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
              ['home', '/global/photos/place-home.webp', '50% 40%'],
              ['condo', '/global/photos/place-condo.webp', '50% 50%'],
              ['hotel', '/global/photos/place-hotel.webp', '50% 55%'],
            ].map(([key, src, position]) => (
              <li key={key}>
                <figure><img src={src} alt={t(`places.${key}Alt`)} loading="lazy" style={{ objectPosition: position }} /></figure>
                <h3>{t(`places.${key}`)}</h3>
                <p>{t(`places.${key}Note`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="ga-sec ga-sec-tint">
        <div className="ga-wrap">
          <div className="ga-sec-head">
            <div>
              <h2>{t('trust.title')}</h2>
              <p className="ga-lead">{t('trust.lead')}</p>
            </div>
          </div>
          <ul className="ga-trust">
            <li><BadgeCheck size={28} aria-hidden="true" /><b>{t('trust.licensed.title')}</b><span>{t('trust.licensed.note')}</span></li>
            <li><Shirt size={28} aria-hidden="true" /><b>{t('trust.uniformed.title')}</b><span>{t('trust.uniformed.note')}</span></li>
            <li><IdCard size={28} aria-hidden="true" /><b>{t('trust.verified.title')}</b><span>{t('trust.verified.note')}</span></li>
            <li><DoorOpen size={28} aria-hidden="true" /><b>{t('trust.door.title')}</b><span>{t('trust.door.note')}</span></li>
          </ul>
        </div>
      </section>

      <section className="ga-sec">
        <div className="ga-wrap">
          <div className="ga-sec-head"><div><h2>{t('steps.title')}</h2></div></div>
          <ol className="ga-steps">
            {['one', 'two', 'three'].map((key, index) => (
              <li key={key}>
                <span className="ga-step-n ga-n">{String(index + 1).padStart(2, '0')}</span>
                <h3>{t(`steps.${key}.title`)}</h3>
                <p>{t(`steps.${key}.note`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="ga-closing">
        <img src="/global/photos/closing-corridor.webp" alt="" loading="lazy" />
        <div className="ga-wrap ga-closing-text">
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
