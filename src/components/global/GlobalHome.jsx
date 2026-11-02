'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// 全球站首页「The Arrival」（2026-11-03，方案全文在共享笔记夹 窗口5-官网改造/arrival/）。
// 一路滑下去像看电影：门慢慢打开 → 技师抵达 → 房间变样 → 项目和价格 → 城市。
// 字都是真网页文字，不靠动效才显示；系统设了「减少动态效果」就全部不动。价格读后台，不写死。
const AREAS = ['Makati', 'BGC', 'Taguig', 'Pasay', 'Manila', 'Quezon City', 'Pasig', 'Mandaluyong']
const MARKETS = [
  { name: 'Philippines', status: 'Now serving', image: 'city-manila', live: true },
  { name: 'Taiwan', status: 'Coming soon', image: 'city-taipei' },
  { name: 'Vietnam', status: 'Coming soon', image: 'city-vietnam' },
  { name: 'Malaysia', status: 'Coming soon', image: 'city-kl' },
  { name: 'Thailand', status: 'Coming soon', image: 'city-bangkok' },
  { name: 'Singapore', status: 'Coming soon', image: 'city-singapore' },
]
const ARRIVAL = [
  { image: 'hand-door', alt: 'A therapist in uniform at a condo door' },
  { image: 'id-card', alt: 'A therapist showing an ID card' },
  { image: 'linen', alt: 'Folded linen beside the EasyGoSpa bag' },
]

const peso = (value) => `₱${Number(value).toLocaleString('en-US')}`
const niceName = (name) => String(name || '').replace(/\(/, ' (').replace(/\s+/g, ' ').trim()
const bookService = (service) => window.dispatchEvent(new CustomEvent('open-booking-modal-with-service', { detail: { service } }))

function Words({ as: Tag = 'h2', children, className = '' }) {
  return <Tag className={className} data-words>{children}</Tag>
}

export default function GlobalHome({ services = [] }) {
  const root = useRef(null)
  const lowest = services.flatMap((service) => (service.durationOptions || []).map((option) => option.price)).filter(Boolean)
  const from = lowest.length ? Math.min(...lowest) : null

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.current?.classList.add('ga-still')
      return
    }
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      // 大字一个词一个词升上来
      gsap.utils.toArray('[data-words]').forEach((el) => {
        const text = (el.textContent || '').trim()
        el.setAttribute('aria-label', text)
        el.innerHTML = text.split(/\s+/).map((w) => `<span class="ga-word" aria-hidden="true"><span class="ga-word-in">${w}</span></span>`).join(' ')
        gsap.from(el.querySelectorAll('.ga-word-in'), {
          yPercent: 112,
          duration: 1.15,
          ease: 'power4.out',
          stagger: 0.07,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 90%',
        once: true,
        onEnter: (els) => gsap.fromTo(els, { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', stagger: 0.08 }),
      })

      // 开场：门从一条拱形缝打开到整屏
      gsap.timeline({ scrollTrigger: { trigger: '.ga-hero', start: 'top top', end: 'bottom bottom', scrub: 0.7 } })
        .to('.ga-door', { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)', ease: 'none' }, 0)
        .fromTo('.ga-door img', { scale: 1.22 }, { scale: 1, ease: 'none' }, 0)
        .to('.ga-hero-title', { yPercent: -18, ease: 'none' }, 0)

      // 房间：一条竖线扫过，空房间变成准备好的房间
      gsap.timeline({ scrollTrigger: { trigger: '.ga-room', start: 'top top', end: 'bottom bottom', scrub: 0.6 } })
        .fromTo('.ga-room-after', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'none' }, 0)
        .fromTo('.ga-seam', { left: '0%' }, { left: '100%', ease: 'none' }, 0)

      // 整屏大图随滑动慢慢拉近、推远
      gsap.utils.toArray('[data-zoom]').forEach((el) => {
        gsap.fromTo(el, { scale: 1.16 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } })
      })
      gsap.utils.toArray('[data-drift]').forEach((el) => {
        gsap.fromTo(el, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } })
      })
      gsap.from('.ga-areas li', { yPercent: 60, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06, scrollTrigger: { trigger: '.ga-areas', start: 'top 85%', once: true } })

      // 电脑上横向滑：抵达那组照片、六个地方。手机用手指左右滑，不接管滚动
      const mm = gsap.matchMedia()
      mm.add('(min-width: 961px)', () => {
        gsap.utils.toArray('[data-sideways]').forEach((section) => {
          const track = section.querySelector('[data-track]')
          gsap.to(track, {
            x: () => -(track.scrollWidth - window.innerWidth),
            ease: 'none',
            scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
          })
        })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div className="ga" ref={root}>
      {/* 第一幕：门 */}
      <section className="ga-hero" aria-label="EasyGoSpa">
        <div className="ga-hero-stage">
          <div className="ga-door">
            <img src="/global/door-night.jpg" alt="An EasyGoSpa therapist arriving at a condo door at night" fetchPriority="high" />
          </div>
          <div className="ga-hero-shade" aria-hidden="true" />
          <p className="ga-hero-title">Let the city wait.</p>
          <div className="ga-hero-foot ga-wrap">
            <div>
              <h1 className="ga-eyebrow">24/7 Home Massage in Metro Manila</h1>
              <p className="ga-hero-line">Professional home massage, across Metro Manila. Available <span className="ga-n">24/7</span>.</p>
            </div>
            <button type="button" className="ga-btn ga-btn-big" data-open-booking="1">Book Now</button>
          </div>
        </div>
      </section>

      {/* 第二幕：抵达 */}
      <section className="ga-arrive" data-sideways>
        <div className="ga-sticky">
          <div className="ga-track" data-track>
            <div className="ga-arrive-text">
              <Words>A considered arrival.</Words>
              <p className="ga-lead" data-reveal>Licensed, uniformed and ID-verified. Your therapist comes to your home, condo or hotel.</p>
              <ol className="ga-steps" data-reveal>
                <li><i className="ga-n">1</i><b>Choose your therapist</b><span>See each profile when you book.</span></li>
                <li><i className="ga-n">2</i><b>Choose your time</b><span>Now, or book for later.</span></li>
                <li><i className="ga-n">3</i><b>Pay cash on arrival</b><span>No deposit, nothing to pay upfront.</span></li>
              </ol>
            </div>
            {ARRIVAL.map((item) => (
              <figure className="ga-arrive-photo" key={item.image}>
                <img src={`/global/${item.image}.jpg`} alt={item.alt} loading="lazy" />
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 第三幕：房间 */}
      <section className="ga-room">
        <div className="ga-sticky">
          <img className="ga-room-img" src="/global/room-before.jpg" alt="A calm condo living room" loading="lazy" />
          <img className="ga-room-img ga-room-after" src="/global/room-after.jpg" alt="The same room, prepared for a massage" loading="lazy" />
          <span className="ga-seam" aria-hidden="true" />
          <div className="ga-room-shade" aria-hidden="true" />
          <div className="ga-room-text ga-wrap">
            <h2 className="ga-big">Your room becomes the spa.</h2>
            <p className="ga-lead">We bring what the ritual needs. You stay where you are.</p>
          </div>
        </div>
      </section>

      {/* 第四幕：项目和价格，不用点就都看得到 */}
      <section className="ga-menu" id="services">
        <div className="ga-wrap ga-menu-in">
          <div className="ga-menu-head">
            <Words>Choose what your body needs.</Words>
            <p className="ga-lead" data-reveal>Six professional massages. Choose your therapist when you book.</p>
            <figure className="ga-menu-photo" data-reveal><img src="/global/still-life.jpg" alt="Folded towels and a glass of water" loading="lazy" /></figure>
          </div>
          <ul className="ga-rows">
            {services.map((service) => (
              <li className="ga-row" key={service.id} data-reveal>
                <div className="ga-row-name">
                  <h3>{niceName(service.name)}</h3>
                  {service.description ? <p>{service.description}</p> : null}
                </div>
                <div className="ga-row-prices">
                  {(service.durationOptions || []).map((option) => (
                    <div key={option.durationMinutes}><span>{option.durationMinutes} min</span><b className="ga-n">{peso(option.price)}</b></div>
                  ))}
                </div>
                <button type="button" className="ga-row-book" onClick={() => bookService(service)}>Book Now</button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 第五幕：价格就是价格 */}
      <section className="ga-price">
        <div className="ga-wrap ga-price-in">
          <div>
            <Words className="ga-big">The price is the price.</Words>
            <ul className="ga-promises">
              <li data-reveal>No transport fee.</li>
              <li data-reveal>No tips.</li>
              <li data-reveal>Pay cash when your therapist arrives.</li>
            </ul>
          </div>
          <figure className="ga-price-photo"><img data-drift src="/global/cash.jpg" alt="Cash on a linen side table" loading="lazy" /></figure>
        </div>
      </section>

      {/* 一页一章的绿 */}
      <section className="ga-olive">
        <div className="ga-wrap">
          <Words className="ga-big">Strictly professional.</Words>
          <p className="ga-lead" data-reveal>Licensed, uniformed, ID-verified therapists. Professional massage only.</p>
        </div>
      </section>

      {/* 第六幕：城市 */}
      <section className="ga-dusk">
        <figure><img data-zoom src="/global/dusk.jpg" alt="Metro Manila at dusk from a high window" loading="lazy" /></figure>
        <div className="ga-dusk-shade" aria-hidden="true" />
        <div className="ga-dusk-text ga-wrap">
          <Words className="ga-big">A calmer hour, across the city.</Words>
          <ul className="ga-areas">{AREAS.map((area) => <li key={area}>{area}</li>)}</ul>
        </div>
      </section>

      {/* 第七幕：下一扇门 */}
      <section className="ga-cities" data-sideways>
        <div className="ga-sticky">
          <div className="ga-track" data-track>
            <div className="ga-cities-text">
              <Words>One ritual. Many cities.</Words>
              <p className="ga-lead" data-reveal>Philippines today. Taiwan, Vietnam, Malaysia, Thailand and Singapore coming soon.</p>
            </div>
            {MARKETS.map((market) => (
              <figure className={`ga-city${market.live ? ' is-live' : ''}`} key={market.name}>
                <img src={`/global/${market.image}.jpg`} alt="" loading="lazy" />
                <figcaption><b>{market.name}</b><span>{market.status}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 第八幕：门开着 */}
      <section className="ga-closing">
        <figure><img data-zoom src="/global/door-open.jpg" alt="A prepared room with the door open at night" loading="lazy" /></figure>
        <div className="ga-closing-shade" aria-hidden="true" />
        <div className="ga-closing-text ga-wrap">
          <Words className="ga-big">Choose your therapist. Then exhale.</Words>
          <p className="ga-lead" data-reveal>See profiles and prices before you book. Available around the clock.</p>
          <button type="button" className="ga-btn ga-btn-big" data-open-booking="1">Book Now</button>
        </div>
      </section>

      {/* 手机底部常驻下单 */}
      <div className="ga-bar">
        {from ? <b>From <span className="ga-n">{peso(from)}</span></b> : <b />}
        <button type="button" className="ga-btn" data-open-booking="1">Book Now</button>
      </div>
    </div>
  )
}
