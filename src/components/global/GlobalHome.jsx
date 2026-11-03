'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import Clip from './Clip'
import ServiceMenu from './ServiceMenu'

// 全球站首页「The Arrival」（2026-11-03，方案全文在共享笔记夹 窗口5-官网改造/arrival/）。
// 一路滑下去像看电影：飞进窗户 → 门打开、技师走到面前 → 正在按摩的画面 → 项目和价格 → 三步 → 一天任何钟点 → 家 / 公寓 / 酒店 → 城市 → 门开着。
// 字都是真网页文字，不靠动效才显示；系统设了「减少动态效果」就全部不动。价格读后台，不写死。
// 片子全部是公司现有素材，能放的都放上去，人物露脸（老板 11-03「都花了钱的」）；带按摩床的镜头不用，技师不带床。
// 只开了菲律宾，其它地方先不显示（老板 11-03）。开第二个国家时改成 true
const SHOW_MARKETS = false
const AREAS = ['Makati', 'BGC', 'Taguig', 'Pasay', 'Manila', 'Quezon City', 'Pasig', 'Mandaluyong']
const MARKETS = [
  { name: 'Philippines', status: 'Now serving', live: true },
  { name: 'Taiwan', status: 'Coming soon' },
  { name: 'Vietnam', status: 'Coming soon' },
  { name: 'Malaysia', status: 'Coming soon' },
  { name: 'Thailand', status: 'Coming soon' },
  { name: 'Singapore', status: 'Coming soon' },
]

// 「掀开马尼拉」片子（easygospa.ph 做过的那条，老板 11-01 选的方向）拆成一张张图，跟着滑动一帧帧画（AirPods 页面的做法）。
// 从城市夜景飞向亮灯的窗，到纱帘前淡入下一屏。原片后面的按摩房不用：技师不带床（老板 11-03）。手机、电脑各一套
const FILM = {
  desktop: { dir: '/global/film-d', frames: 104 },
  phone: { dir: '/global/film-m', frames: 64 },
}
// 门打开、技师走到面前，也跟着滑动走
const ARRIVE = {
  desktop: { dir: '/global/arrive-d', frames: 96 },
  phone: { dir: '/global/arrive-m', frames: 64 },
}
// 「你的房间变成水疗室」：先整屏一张，缩回去，周围的图露出来
const SPA_TILES = [
  { key: 'a', src: 'foot', alt: 'A therapist in the EasyGoSpa uniform massaging a client\'s foot beside the sofa' },
  { key: 'b', src: 'stone-arm', alt: 'A therapist gliding a warm stone along a client\'s forearm' },
  { key: 'c', src: 'neck', alt: 'A therapist easing the tension in a client\'s neck' },
  { key: 'd', src: 'amber', alt: 'A bottle of massage oil beside a folded towel' },
  { key: 'e', src: 'towels', alt: 'Rolled and folded towels on a dark wood bench' },
  { key: 'f', src: 'lotus', alt: 'A white lotus floating in a celadon bowl' },
  { key: 'g', src: 'cup', alt: 'A folded towel and a small tea cup in soft afternoon light' },
]
const STRIP = ['stones-linen', 'bag', 'towels-sofa', 'handle', 'oils', 'lotus', 'glass', 'leaf']
const STEPS = [
  { title: 'Choose your therapist', note: 'See each profile when you book.', clip: 'greet', label: 'A therapist in uniform opening a door and smiling' },
  { title: 'Choose your time', note: 'Now, or book for later.', clip: 'glide', label: 'Gliding through a lit window into a quiet condo living room' },
  { title: 'Pay cash on arrival', note: 'No deposit, nothing to pay upfront.', clip: 'night', label: 'A therapist walking in through a condo door at night, carrying folded towels' },
]
// 一天里任何钟点都能约（24/7）：从早上滑到半夜，画面跟着从白天变成黑夜
const HOURS = [
  { time: '7:00', part: 'am', line: 'Before the first meeting.', src: 'morning', alt: 'A bright bedroom with the city in morning light' },
  { time: '1:00', part: 'pm', line: 'Between checkout and the flight.', src: 'hotel', alt: 'The EasyGoSpa bag on a hotel bed, the city through the window' },
  { time: '6:30', part: 'pm', line: 'After the long week.', src: 'sunset', alt: 'Metro Manila at sunset from a high window' },
  { time: '11:00', part: 'pm', line: 'When the city finally quiets.', src: 'night-hands', alt: 'A therapist massaging a client\'s back at night, a lamp on and the city lit outside' },
  { time: '2:00', part: 'am', line: 'Yes, even now.', clip: 'window', label: 'Gliding through a lit window into a quiet condo living room at night' },
]
const PLACES = [
  { word: 'Home.', clip: 'living', label: 'A therapist stepping into a living room with a view of the city' },
  { word: 'Condo.', clip: 'lobby', label: 'A therapist walking in through a condo door, carrying folded towels and the EasyGoSpa bag' },
  { word: 'Hotel.', clip: 'corridor', label: 'A smiling therapist walking down a corridor with folded towels and the EasyGoSpa bag' },
]
const TRUST = [
  { word: 'Licensed', clip: 'walkin', label: 'A therapist in the EasyGoSpa uniform walking in through an open door' },
  { word: 'Uniformed', clip: 'uniform', label: 'A smiling therapist in the EasyGoSpa uniform, carrying folded towels' },
  { word: 'ID-verified', src: 'badge', alt: 'A therapist in the EasyGoSpa uniform holding up her ID card' },
  { word: 'At your door', clip: 'closeup', label: 'A smiling therapist arriving at a condo door with towels and the EasyGoSpa bag' },
]
const INTRO_KEY = 'ga-intro-seen'

// 片子一帧帧画到画布上，第一帧没到之前显示静图。先隔几帧下一张，一滑就有画面；开始滑了才补中间的
function makeFilm(canvas, film) {
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
  const order = []
  for (let i = 0; i < film.frames; i += 4) order.push(i)
  const coarse = order.length
  for (let i = 0; i < film.frames; i += 1) if (i % 4) order.push(i)
  let next = 0
  let all = false
  const loadNext = () => {
    if (next >= order.length || (next >= coarse && !all)) return
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
  const start = () => {
    for (let i = 0; i < 6; i += 1) loadNext()
  }
  const loadAll = () => {
    all = true
    start()
  }
  return { state, draw, start, loadAll, frames: film.frames }
}

const peso = (value) => `₱${Number(value).toLocaleString('en-US')}`

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

    const heroFilm = makeFilm(root.current?.querySelector('.ga-door canvas'), isDesktop ? FILM.desktop : FILM.phone)
    const arriveFilm = makeFilm(root.current?.querySelector('.ga-film canvas'), isDesktop ? ARRIVE.desktop : ARRIVE.phone)
    const redraw = () => {
      heroFilm.draw()
      arriveFilm.draw()
    }
    let filmNear = null
    if (lite) {
      root.current?.classList.add('ga-lite')
    } else {
      // 只看一眼就走的客人不多花流量；进门那条快滑到才下载
      heroFilm.start()
      window.addEventListener('scroll', heroFilm.loadAll, { once: true, passive: true })
      filmNear = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return
        filmNear.disconnect()
        arriveFilm.loadAll()
      }, { rootMargin: '150% 0px' })
      const filmSection = root.current?.querySelector('.ga-film')
      if (filmSection) filmNear.observe(filmSection)
    }
    window.addEventListener('resize', redraw)

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
      else hero.to(heroFilm.state, { frame: heroFilm.frames - 1, ease: 'none', duration: 0.88, onUpdate: heroFilm.draw }, 0.02)
      hero.to('.ga-hero-fade', { autoAlpha: 1, ease: 'none', duration: 0.12 }, 0.88)

      // 进门：滑动带着门打开、技师走到面前；大字先走，人到了只留一行小字
      const arrive = gsap.timeline({ scrollTrigger: { trigger: '.ga-film', start: 'top top', end: 'bottom bottom', scrub: 0.5 } })
      if (!lite) arrive.to(arriveFilm.state, { frame: arriveFilm.frames - 1, ease: 'none', duration: 0.92, onUpdate: arriveFilm.draw }, 0)
      arrive.to('.ga-film-title', { autoAlpha: 0, yPercent: -18, ease: 'none', duration: 0.16 }, 0.14)
        .fromTo('.ga-film-note', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, ease: 'none', duration: 0.14 }, 0.72)

      // 电脑上：画面跟着鼠标轻轻动，按钮被鼠标吸过去
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
      }

      // 按摩：先整屏一张，缩回左上角，周围的图露出来、各走各的速度，字从白变深
      const spa = gsap.timeline({ scrollTrigger: { trigger: '.ga-spa', start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true } })
      spa.from('.ga-spa-main', { left: 0, top: 0, width: '100%', height: '100%', borderRadius: 0, ease: 'power2.inOut', duration: 0.42 }, 0.06)
        .fromTo('.ga-spa-main-shade', { autoAlpha: 1 }, { autoAlpha: 0, ease: 'none', duration: 0.2 }, 0.18)
        // 字：整屏时白字；图缩回去的时候先退场，图让开了再换深色回来，不叠在图边上
        .fromTo('.ga-spa-text', { color: '#ffffff', autoAlpha: 1 }, { autoAlpha: 0, ease: 'none', duration: 0.07 }, 0.08)
        .set('.ga-spa-text', { color: '#171a17' }, 0.2)
        .to('.ga-spa-text', { autoAlpha: 1, ease: 'none', duration: 0.1 }, 0.36)
      gsap.utils.toArray('.ga-spa-tile', root.current).forEach((tile, index) => {
        // 下半部分的图往上走得少，不压到中间的字
        const drift = [6, 22, 7, 26, 6, 7, 6][index % 7]
        spa.fromTo(tile, { y: `${drift}vh`, autoAlpha: 0.2 }, { y: 0, autoAlpha: 1, ease: 'power2.out', duration: 0.4 }, 0.12 + index * 0.012)
          .to(tile, { y: `${-drift * 0.8}vh`, ease: 'none', duration: 0.46 }, 0.54)
      })
      spa.to('.ga-spa-main', { y: '-17vh', ease: 'none', duration: 0.46 }, 0.54)
        .to('.ga-spa-text', { y: '-7vh', ease: 'none', duration: 0.46 }, 0.54)

      // 三步：一张卡盖上一张卡，被盖住的往后缩一点，片子也停
      const cards = gsap.utils.toArray('.ga-stack-card', root.current)
      cards.forEach((card, index) => {
        const next = cards[index + 1]
        if (!next) return
        gsap.to(card.querySelector('.ga-stack-in'), {
          scale: 0.93,
          ease: 'none',
          scrollTrigger: {
            trigger: next,
            start: 'top bottom',
            end: 'top top',
            scrub: true,
            onLeave: () => card.querySelector('video')?.pause(),
            onEnterBack: () => card.querySelector('video')?.play().catch(() => {}),
          },
        })
      })

      // 任何钟点：一张从下往上盖过上一张，只有看得见的片子在放
      const slides = gsap.utils.toArray('.ga-hour-slide', root.current)
      const ticks = gsap.utils.toArray('.ga-hour-rail li', root.current)
      let hourNow = -1
      const hour = gsap.timeline({
        scrollTrigger: {
          trigger: '.ga-hour',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.4,
          onUpdate: (self) => {
            const now = Math.min(slides.length - 1, Math.floor(self.progress * slides.length))
            if (now === hourNow) return
            hourNow = now
            ticks.forEach((tick, index) => tick.classList.toggle('is-on', index <= now))
            slides.forEach((slide, index) => {
              const video = slide.querySelector('video')
              if (!video) return
              if (index === now) video.play().catch(() => {})
              else video.pause()
            })
          },
          onLeave: () => slides.forEach((slide) => slide.querySelector('video')?.pause()),
          onLeaveBack: () => slides.forEach((slide) => slide.querySelector('video')?.pause()),
        },
      })
      slides.forEach((slide, index) => {
        if (!index) {
          hour.fromTo(slide.querySelector('.ga-hour-pic'), { scale: 1.12 }, { scale: 1, ease: 'none', duration: 1 }, 0)
          return
        }
        const at = index - 0.5
        hour.fromTo(slide, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut', duration: 0.6 }, at)
          .fromTo(slide.querySelector('.ga-hour-pic'), { scale: 1.18, yPercent: 6 }, { scale: 1, yPercent: 0, ease: 'none', duration: 1.2 }, at)
          .fromTo(slide.querySelector('.ga-hour-text'), { y: 70, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: 'power2.out', duration: 0.42 }, at + 0.22)
      })

      // 三种地方：哪一块轮到了就撑开。手机只放撑开那块的片子，别的先停
      const places = gsap.utils.toArray('.ga-place', root.current)
      let placeNow = -1
      const onlyActive = window.matchMedia('(max-width: 960px)').matches
      const place = gsap.timeline({
        scrollTrigger: {
          trigger: '.ga-places',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
          onUpdate: (self) => {
            const now = Math.min(places.length - 1, Math.floor(self.progress * places.length))
            if (now === placeNow) return
            placeNow = now
            places.forEach((item, index) => {
              item.classList.toggle('is-on', index === now)
              if (!onlyActive) return
              const video = item.querySelector('video')
              if (index === now) video?.play().catch(() => {})
              else video?.pause()
            })
          },
        },
      })
      place.fromTo(places[0], { flexGrow: 3.4 }, { flexGrow: 1, ease: 'power2.inOut', duration: 1 }, 0.3)
        .fromTo(places[1], { flexGrow: 1 }, { flexGrow: 3.4, ease: 'power2.inOut', duration: 1 }, 0.3)
        .to(places[1], { flexGrow: 1, ease: 'power2.inOut', duration: 1 }, 1.7)
        .fromTo(places[2], { flexGrow: 1 }, { flexGrow: 3.4, ease: 'power2.inOut', duration: 1 }, 1.7)
        .to({}, { duration: 0.3 }, 2.7)

      // 城市：片子先只从 Manila 几个字里透出来，字越飞越大，人就穿过字飞进城市
      const maskWord = root.current.querySelector('.ga-dusk-word')
      const pivot = maskWord?.querySelector('em')
      const setPivot = () => {
        if (!maskWord || !pivot) return
        const box = maskWord.getBoundingClientRect()
        const stem = pivot.getBoundingClientRect()
        // 转动中心放在字母 i 的那一竖上，放大时正好从这里穿过去
        if (box.width) gsap.set(maskWord, { transformOrigin: `${((stem.left + stem.width / 2 - box.left) / box.width) * 100}% 62%` })
      }
      setPivot()
      document.fonts?.ready?.then(setPivot)
      gsap.timeline({ scrollTrigger: { trigger: '.ga-dusk', start: 'top top', end: 'bottom bottom', scrub: 0.5, onRefresh: setPivot } })
        .fromTo(maskWord, { scale: 1 }, { scale: 26, ease: 'power3.in', duration: 0.62, force3D: false }, 0.06)
        .fromTo('.ga-dusk-mask', { autoAlpha: 1 }, { autoAlpha: 0, ease: 'none', duration: 0.14 }, 0.54)
        .fromTo('.ga-dusk-shade', { autoAlpha: 0 }, { autoAlpha: 1, ease: 'none', duration: 0.2 }, 0.66)
        .fromTo('.ga-dusk-text', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.2 }, 0.72)

      // 价格下面那条静物，跟着滑动往左走
      const strip = root.current.querySelector('.ga-strip')
      gsap.fromTo(strip, { x: 0 }, {
        x: () => Math.min(0, window.innerWidth - strip.scrollWidth),
        ease: 'none',
        scrollTrigger: { trigger: strip, start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true },
      })

      // 电脑上横向滑：六个地方（暂不显示）。手机用手指左右滑，不接管滚动
      const mm = gsap.matchMedia()
      mm.add('(min-width: 961px)', () => {
        // 拱门高低错开，滑动时各走各的
        gsap.utils.toArray('.ga-olive-arch', root.current).forEach((arch, index) => {
          gsap.fromTo(arch, { y: 60 + (index % 2) * 70 }, {
            y: -20 - (index % 2) * 30,
            ease: 'none',
            scrollTrigger: { trigger: '.ga-olive-row', start: 'top bottom', end: 'bottom top', scrub: 0.6 },
          })
        })
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
      window.removeEventListener('resize', redraw)
      window.removeEventListener('scroll', heroFilm.loadAll)
      ctx.revert()
      filmNear?.disconnect()
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

      {/* 第二幕：进门，跟着滑动走 */}
      <section className="ga-film">
        <div className="ga-sticky">
          <picture>
            <source media="(max-width: 960px)" srcSet="/global/arrive-m/001.webp" />
            <img src="/global/arrive-d/001.webp" alt="A closed condo door at night" loading="lazy" />
          </picture>
          <picture className="ga-film-end">
            <source media="(max-width: 960px)" srcSet="/global/arrive-m/064.webp" />
            <img src="/global/arrive-d/096.webp" alt="A smiling therapist in the EasyGoSpa uniform at the door, carrying folded towels and the EasyGoSpa bag" loading="lazy" />
          </picture>
          <canvas aria-hidden="true" />
          <div className="ga-film-shade" aria-hidden="true" />
          <div className="ga-film-title ga-wrap"><Words className="ga-big">A considered arrival.</Words></div>
          <p className="ga-film-note ga-wrap">Licensed, uniformed and ID-verified. Your therapist comes to your home, condo or hotel.</p>
        </div>
      </section>

      {/* 第三幕：正在按摩。先整屏一张，缩回去，周围的图露出来 */}
      <section className="ga-spa">
        <div className="ga-sticky">
          {SPA_TILES.map((tile) => (
            <figure className={`ga-spa-tile is-${tile.key}`} key={tile.key}>
              <img src={`/global/photos/${tile.src}.webp`} alt={tile.alt} loading="lazy" />
            </figure>
          ))}
          <figure className="ga-spa-main">
            <img src="/global/photos/night-hands.webp" alt="A therapist massaging a client's back at night, a lamp on and the city lit outside" loading="lazy" />
            <span className="ga-spa-main-shade" aria-hidden="true" />
          </figure>
          <div className="ga-spa-text">
            <h2 className="ga-big">Your room becomes the spa.</h2>
            <p className="ga-lead">Your therapist comes to you. You stay where you are.</p>
          </div>
        </div>
      </section>

      {/* 第四幕：项目和价格，不用点就都看得到；旁边的拱门跟着换图 */}
      <section className="ga-menu" id="services">
        <div className="ga-wrap">
          <div className="ga-menu-head">
            <Words>Choose what your body needs.</Words>
            <p className="ga-lead" data-reveal>Every treatment and price, listed. Choose your therapist when you book.</p>
          </div>
          <ServiceMenu services={services} />
        </div>
      </section>

      {/* 第五幕：三步，一张卡盖上一张卡 */}
      <section className="ga-stack">
        <div className="ga-stack-head ga-wrap"><Words className="ga-big">Book in three steps.</Words></div>
        {STEPS.map((step, index) => (
          <article className={`ga-stack-card is-${index + 1}`} key={step.title}>
            <div className="ga-stack-in ga-wrap">
              <div className="ga-stack-text">
                <i className="ga-n">{index + 1}</i>
                <h3>{step.title}</h3>
                <p>{step.note}</p>
              </div>
              <figure className="ga-stack-film"><Clip name={step.clip} label={step.label} /></figure>
            </div>
          </article>
        ))}
      </section>

      {/* 第六幕：一天任何钟点（24/7） */}
      <section className="ga-hour">
        <div className="ga-sticky">
          {HOURS.map((item) => (
            <div className="ga-hour-slide" key={item.time + item.part}>
              <div className="ga-hour-pic">
                {item.clip ? <Clip name={item.clip} label={item.label} manual /> : <img src={`/global/photos/${item.src}.webp`} alt={item.alt} loading="lazy" />}
              </div>
              <div className="ga-hour-shade" aria-hidden="true" />
              <div className="ga-hour-text ga-wrap">
                <b className="ga-n">{item.time}<small>{item.part}</small></b>
                <p>{item.line}</p>
              </div>
            </div>
          ))}
          <p className="ga-hour-tag ga-wrap"><b className="ga-n">24/7</b></p>
          <ol className="ga-hour-rail" aria-hidden="true">{HOURS.map((item, index) => <li key={item.time + item.part} className={index ? undefined : 'is-on'} />)}</ol>
        </div>
      </section>

      {/* 第七幕：家、公寓、酒店，哪一块轮到了就撑开 */}
      <section className="ga-places">
        <div className="ga-sticky">
          <div className="ga-places-row">
            {PLACES.map((item, index) => (
              <figure className={`ga-place${index ? '' : ' is-on'}`} key={item.word}>
                <Clip name={item.clip} label={item.label} at={0.2} />
                <figcaption>{item.word}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 第八幕：价格就是价格 */}
      <section className="ga-price">
        <div className="ga-wrap">
          <Words className="ga-big">The price is the price.</Words>
          <ul className="ga-nums">
            <li data-reveal><b className="ga-n">₱0</b><span>Transport Fee</span></li>
            <li data-reveal><b className="ga-n">₱0</b><span>Tips Expected</span></li>
            <li data-reveal><b className="ga-n">24/7</b><span>Available</span></li>
          </ul>
          <p className="ga-price-note" data-reveal>Pay cash when your therapist arrives.</p>
        </div>
        <div className="ga-strip" aria-hidden="true">
          {STRIP.map((name) => <figure key={name}><img src={`/global/photos/${name}.webp`} alt="" loading="lazy" /></figure>)}
        </div>
      </section>

      {/* 一页一章的绿：四扇拱门 */}
      <section className="ga-olive">
        <div className="ga-wrap ga-olive-text">
          <Words className="ga-big">Strictly professional.</Words>
          <p className="ga-lead" data-reveal>Licensed, uniformed, ID-verified therapists. Professional massage only.</p>
        </div>
        <div className="ga-olive-row">
          {TRUST.map((item) => (
            <figure className="ga-olive-arch" key={item.word}>
              <div className="ga-olive-door">
                {item.clip ? <Clip name={item.clip} label={item.label} /> : <img src={`/global/photos/${item.src}.webp`} alt={item.alt} loading="lazy" />}
              </div>
              <figcaption>{item.word}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 第九幕：城市，从 Manila 几个字里透出来 */}
      <section className="ga-dusk">
        <div className="ga-sticky">
          <figure className="ga-dusk-film"><Clip name="city-wide" phone="city-tall" label="Flying past lit condo towers in Metro Manila at night" /></figure>
          <div className="ga-dusk-shade" aria-hidden="true" />
          <div className="ga-dusk-text ga-wrap">
            <h2 className="ga-big">A calmer hour, across the city.</h2>
            <ul className="ga-areas">{AREAS.map((area) => <li key={area}>{area}</li>)}</ul>
          </div>
          <div className="ga-dusk-mask" aria-hidden="true"><span className="ga-dusk-word">Man<em>i</em>la</span></div>
        </div>
      </section>

      {/* 下一扇门（暂不显示，见 SHOW_MARKETS） */}
      {SHOW_MARKETS ? <section className="ga-cities" data-sideways>
        <div className="ga-sticky">
          <div className="ga-track" data-track>
            <div className="ga-cities-text">
              <Words>One ritual. Many cities.</Words>
              <p className="ga-lead" data-reveal>Philippines today. Taiwan, Vietnam, Malaysia, Thailand and Singapore coming soon.</p>
            </div>
            {MARKETS.map((market) => (
              <figure className={`ga-city${market.live ? ' is-live' : ''}`} key={market.name}>
                <figcaption><b>{market.name}</b><span>{market.status}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section> : null}

      {/* 第八幕：门开着 */}
      <section className="ga-closing">
        <figure className="ga-closing-door"><Clip name="door" at={0.6} label="A condo door swinging open onto warm light and the city at night" /></figure>
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
