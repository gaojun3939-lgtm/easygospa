'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

// 全球站首页「The Arrival」（2026-11-03，方案全文在共享笔记夹 窗口5-官网改造/arrival/）。
// 一路滑下去像看电影：门慢慢打开 → 技师抵达 → 房间变样 → 项目和价格 → 城市。
// 字都是真网页文字，不靠动效才显示；系统设了「减少动态效果」就全部不动。价格读后台，不写死。
// 只开了菲律宾，其它地方先不显示（老板 11-03）。开第二个国家时改成 true
const SHOW_MARKETS = false
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

// 「掀开马尼拉」片子（easygospa.ph 做过的那条，老板 11-01 选的方向）拆成一张张图，跟着滑动一帧帧画（AirPods 页面的做法）。
// 从城市夜景飞向亮灯的窗，到纱帘前淡入下一屏。原片后面的按摩房不用：技师不带床（老板 11-03）。手机、电脑各一套
const FILM = {
  desktop: { dir: '/global/film-d', frames: 104 },
  phone: { dir: '/global/film-m', frames: 64 },
}
// 项目那一行鼠标移上去浮出的图
const SERVICE_IMAGE = {
  'swedish-massage': 'svc-swedish',
  'deep-tissue': 'svc-deep',
  'hot-stone-massage': 'svc-hotstone',
  'thai-body-massage': 'svc-thai',
  'shiatsu-body-massage-without-oil': 'svc-shiatsu',
  'whole-body-aromatherapy-massage': 'svc-aroma',
}
const INTRO_KEY = 'ga-intro-seen'

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
    const connection = navigator.connection
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (calm) {
      root.current?.classList.add('ga-still')
      return
    }
    // 省流量、2G、内存小的手机不下载片子，用两张静图代替，不让客人干等
    const lite = !!connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType) || (navigator.deviceMemory && navigator.deviceMemory < 3)
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const isDesktop = window.matchMedia('(min-width: 961px)').matches
    gsap.registerPlugin(ScrollTrigger)

    // 平滑滚动，只在电脑上；弹窗打开时停下，弹窗里的滚动不受影响
    let lenis = null
    let bodyWatch = null
    let tick = null
    if (finePointer && isDesktop) {
      lenis = new Lenis({ lerp: 0.09, prevent: (node) => !!node.closest?.('[role="dialog"], .fixed, [data-lenis-prevent]') })
      lenis.on('scroll', ScrollTrigger.update)
      tick = (time) => lenis.raf(time * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
      const sync = () => {
        const locked = document.body.classList.contains('booking-modal-open') || document.body.style.overflow === 'hidden'
        if (locked) lenis.stop()
        else lenis.start()
      }
      bodyWatch = new MutationObserver(sync)
      bodyWatch.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] })
    }

    // 片子：一帧帧画到画布上，第一帧没到之前显示静图
    const film = isDesktop ? FILM.desktop : FILM.phone
    const canvas = root.current?.querySelector('.ga-door canvas')
    const images = []
    const state = { frame: 0 }
    const draw = () => {
      if (!canvas) return
      // 这一帧还没到就画离它最近的已到的一帧
      const at = Math.round(state.frame)
      let img = null
      for (let gap = 0; gap < film.frames && !img; gap += 1) {
        for (const candidate of [images[at - gap], images[at + gap]]) {
          if (candidate?.complete && candidate.naturalWidth) {
            img = candidate
            break
          }
        }
      }
      if (!img) return
      const ctx = canvas.getContext('2d')
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = canvas.clientWidth * ratio
      const h = canvas.clientHeight * ratio
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
      const dw = img.naturalWidth * scale
      const dh = img.naturalHeight * scale
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
      canvas.classList.add('is-on')
    }
    if (!lite && canvas) {
      // 先隔几帧下一张，一滑就有画面；开始滑了才补中间的，只看一眼就走的客人不多花流量
      const order = []
      for (let i = 0; i < film.frames; i += 4) order.push(i)
      const coarse = order.length
      for (let i = 0; i < film.frames; i += 1) if (i % 4) order.push(i)
      let next = 0
      let scrolled = false
      const loadNext = () => {
        if (next >= order.length || (next >= coarse && !scrolled)) return
        const index = order[next]
        next += 1
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => {
          draw()
          loadNext()
        }
        img.onerror = loadNext
        img.src = `${film.dir}/${String(index + 1).padStart(3, '0')}.webp`
        images[index] = img
      }
      for (let i = 0; i < 6; i += 1) loadNext()
      window.addEventListener('scroll', () => {
        scrolled = true
        for (let i = 0; i < 6; i += 1) loadNext()
      }, { once: true, passive: true })
    }
    window.addEventListener('resize', draw)

    const ctx = gsap.context(() => {
      // 第一次打开：门缝的光 → 莲花 → 门缝拉开成拱门 → 大字升起。点一下就跳过，这次打开过就不再播
      const intro = root.current.querySelector('.ga-intro')
      const seen = document.documentElement.classList.contains('ga-seen')
      const titleWords = () => root.current.querySelectorAll('.ga-hero-title .ga-word-in')
      const splitTitle = () => {
        const el = root.current.querySelector('.ga-hero-title')
        const text = (el.textContent || '').trim()
        el.setAttribute('aria-label', text)
        el.innerHTML = text.split(/\s+/).map((w) => `<span class="ga-word" aria-hidden="true"><span class="ga-word-in">${w}</span></span>`).join(' ')
      }
      splitTitle()
      if (intro && !seen) {
        try { sessionStorage.setItem(INTRO_KEY, '1') } catch {}
        const tl = gsap.timeline({ onComplete: () => intro.remove() })
        tl.fromTo('.ga-slit', { scaleY: 0 }, { scaleY: 1, duration: 0.55, ease: 'power3.inOut' })
          .fromTo('.ga-intro-lotus', { clipPath: 'inset(0 100% 0 0)', autoAlpha: 1 }, { clipPath: 'inset(0 0% 0 0)', duration: 0.5, ease: 'power2.inOut' }, 0.2)
          .to('.ga-intro-lotus', { autoAlpha: 0, duration: 0.25 }, 0.85)
          .to('.ga-slit', { scaleX: 40, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 0.95)
          .to(intro, { autoAlpha: 0, duration: 0.45, ease: 'power1.out' }, 1.1)
          // 开场只动外面这一层，跟滑动控制的拱门分开，开场没播完就滑也不会打架
          .fromTo('.ga-door-reveal', { clipPath: 'inset(0% 49.8% 0% 49.8%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power3.inOut', clearProps: 'clipPath' }, 1.0)
          .from(titleWords(), { yPercent: 112, duration: 1, ease: 'power4.out', stagger: 0.07 }, 1.25)
        intro.addEventListener('click', () => tl.progress(1), { once: true })
      } else {
        gsap.from(titleWords(), { yPercent: 112, duration: 1, ease: 'power4.out', stagger: 0.07 })
      }

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

      // 滑动：拱门拉到整屏，片子一帧帧往前走，大字在飞近窗户时退场
      const hero = gsap.timeline({ scrollTrigger: { trigger: '.ga-hero', start: 'top top', end: 'bottom bottom', scrub: 0.5 } })
      hero.to('.ga-door', { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)', ease: 'none', duration: 0.16 }, 0)
        .to('.ga-hero-title', { yPercent: -22, ease: 'none', duration: 0.55 }, 0)
        .to('.ga-hero-title', { autoAlpha: 0, ease: 'none', duration: 0.14 }, 0.42)
      if (lite) hero.to('.ga-door-open', { autoAlpha: 1, ease: 'none', duration: 0.5 }, 0.4)
      else hero.to(state, { frame: film.frames - 1, ease: 'none', duration: 0.88, onUpdate: draw }, 0.02)
      hero.to('.ga-hero-fade', { autoAlpha: 1, ease: 'none', duration: 0.12 }, 0.88)

      // 电脑上：画面跟着鼠标轻轻动，按钮被鼠标吸过去，项目那一行浮出图
      if (finePointer) {
        const stage = root.current.querySelector('.ga-hero-stage')
        const moveX = gsap.quickTo('.ga-door-inner', 'x', { duration: 1.1, ease: 'power3' })
        const moveY = gsap.quickTo('.ga-door-inner', 'y', { duration: 1.1, ease: 'power3' })
        const titleX = gsap.quickTo('.ga-hero-title', 'x', { duration: 1.4, ease: 'power3' })
        stage.addEventListener('pointermove', (event) => {
          const dx = event.clientX / window.innerWidth - 0.5
          const dy = event.clientY / window.innerHeight - 0.5
          moveX(dx * -26)
          moveY(dy * -16)
          titleX(dx * 14)
        })
        gsap.utils.toArray('.ga-btn', root.current).forEach((button) => {
          const bx = gsap.quickTo(button, 'x', { duration: 0.5, ease: 'power3' })
          const by = gsap.quickTo(button, 'y', { duration: 0.5, ease: 'power3' })
          button.addEventListener('pointermove', (event) => {
            const box = button.getBoundingClientRect()
            bx((event.clientX - box.left - box.width / 2) * 0.32)
            by((event.clientY - box.top - box.height / 2) * 0.42)
          })
          button.addEventListener('pointerleave', () => {
            gsap.to(button, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, .4)' })
          })
        })
        const float = root.current.querySelector('.ga-float')
        const floatImg = float?.querySelector('img')
        if (float && isDesktop) {
          const fx = gsap.quickTo(float, 'x', { duration: 0.7, ease: 'power3' })
          const fy = gsap.quickTo(float, 'y', { duration: 0.7, ease: 'power3' })
          gsap.utils.toArray('.ga-row', root.current).forEach((row) => {
            row.addEventListener('pointerenter', () => {
              floatImg.src = `/global/${row.dataset.image}.jpg`
              gsap.to(float, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'power3.out' })
            })
            row.addEventListener('pointerleave', () => gsap.to(float, { autoAlpha: 0, scale: 0.86, duration: 0.3 }))
            row.addEventListener('pointermove', (event) => {
              // 放在这一行左边，不挡名字和价格
              fx(row.getBoundingClientRect().left - 340 + (event.clientX - row.getBoundingClientRect().left) * 0.04)
              fy(event.clientY - 105)
            })
          })
        }
      }

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
    return () => {
      window.removeEventListener('resize', draw)
      ctx.revert()
      bodyWatch?.disconnect()
      if (tick) gsap.ticker.remove(tick)
      lenis?.destroy()
    }
  }, [])

  return (
    <div className="ga" ref={root}>
      {/* 开场动画：这次打开过就不再播；万一脚本没跑，样式 2.4 秒后自己收起，不挡内容 */}
      <script dangerouslySetInnerHTML={{ __html: `try{if(sessionStorage.getItem('${INTRO_KEY}'))document.documentElement.classList.add('ga-seen')}catch(e){}` }} />
      <div className="ga-intro" aria-hidden="true">
        <span className="ga-slit" />
        <img className="ga-intro-lotus" src="/global/lotus-white.png" alt="" />
      </div>
      {/* 第一幕：门 */}
      <section className="ga-hero" aria-label="EasyGoSpa">
        <div className="ga-hero-stage">
          <div className="ga-door-reveal">
          <div className="ga-door">
            <div className="ga-door-inner">
              <picture>
                <source media="(max-width: 960px)" srcSet="/global/film-first-m.jpg" />
                <img src="/global/film-first.jpg" alt="Metro Manila at night, one window glowing warm in a tall condo tower" fetchPriority="high" />
              </picture>
              <picture>
                <source media="(max-width: 960px)" srcSet="/global/film-last-m.jpg" />
                <img className="ga-door-open" src="/global/film-last.jpg" alt="" loading="lazy" />
              </picture>
              <canvas aria-hidden="true" />
            </div>
          </div>
          </div>
          <div className="ga-hero-shade" aria-hidden="true" />
          <div className="ga-hero-fade" aria-hidden="true" />
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
          <img className="ga-room-img" src="/global/room-before.jpg" alt="A calm condo bedroom" loading="lazy" />
          <img className="ga-room-img ga-room-after" src="/global/room-after.jpg" alt="The same bedroom, the bed made ready with clean towels" loading="lazy" />
          <span className="ga-seam" aria-hidden="true" />
          <div className="ga-room-shade" aria-hidden="true" />
          <div className="ga-room-text ga-wrap">
            <h2 className="ga-big">Your room becomes the spa.</h2>
            <p className="ga-lead">Your therapist comes to you. You stay where you are.</p>
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
              <li className="ga-row" key={service.id} data-reveal data-image={SERVICE_IMAGE[service.id] || 'still-life'}>
                <figure className="ga-row-thumb"><img src={`/global/${SERVICE_IMAGE[service.id] || 'still-life'}.jpg`} alt="" loading="lazy" /></figure>
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

      {/* 第七幕：下一扇门（暂不显示，见 SHOW_MARKETS） */}
      {SHOW_MARKETS ? <section className="ga-cities" data-sideways>
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
      </section> : null}

      {/* 第八幕：门开着 */}
      <section className="ga-closing">
        <figure><img data-zoom src="/global/door-open.jpg" alt="A warmly lit bedroom with folded towels on the bed at night" loading="lazy" /></figure>
        <div className="ga-closing-shade" aria-hidden="true" />
        <div className="ga-closing-text ga-wrap">
          <Words className="ga-big">Choose your therapist. Then exhale.</Words>
          <p className="ga-lead" data-reveal>See profiles and prices before you book. Available around the clock.</p>
          <button type="button" className="ga-btn ga-btn-big" data-open-booking="1">Book Now</button>
        </div>
      </section>

      <div className="ga-float" aria-hidden="true"><img alt="" /></div>

      {/* 手机底部常驻下单 */}
      <div className="ga-bar">
        {from ? <b>From <span className="ga-n">{peso(from)}</span></b> : <b />}
        <button type="button" className="ga-btn" data-open-booking="1">Book Now</button>
      </div>
    </div>
  )
}
