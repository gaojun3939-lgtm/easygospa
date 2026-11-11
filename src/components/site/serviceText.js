// 项目的名字、介绍、配图、价格写法（首页、服务页、价目页共用）。
// 名字和介绍读后台（英文）；别的语言在 serviceNames / serviceInfo 两份文字里按后台原名对上，对不上就显示英文原文。
// 后台改了英文介绍，别的语言要跟着改 src/messages/<语言>/serviceInfo.json。
import { Flame, Footprints, Hand, HeartPulse, Leaf, Moon } from 'lucide-react'

export const peso = (value) => `₱${Number(value).toLocaleString('en-US')}`
export const niceName = (name) => String(name || '').replace(/\(/, ' (').replace(/\s+/g, ' ').trim()

// 每个项目配一张图（2026-11-11 第二套自家静物图：同一张台面、傍晚窗光、橄榄绿条纹毛巾，没有人脸、没有按摩床）。后台新加的项目先用精油那张，不会空着
const PHOTOS = [
  [/deep/i, 'deep', '/global/photos/svc-deep.webp'],
  [/stone/i, 'stone', '/global/photos/svc-stone.webp'],
  [/aroma/i, 'aroma', '/global/photos/svc-aroma.webp'],
  [/shiatsu/i, 'shiatsu', '/global/photos/svc-shiatsu.webp'],
  [/swedish/i, 'swedish', '/global/photos/svc-swedish.webp'],
  [/thai/i, 'thai', '/global/photos/svc-thai.webp'],
]
// 「身体需要什么」：首页横排卡片、服务页每张项目卡上的小标签都按这个（图标两边同一套）。
// 11-12 老板「你这个里面放这个 合适不合适？」→ 服务页那排筛选按钮去掉（六个按钮对六个项目，点哪个都只剩一张）；首页卡片点进来带 ?need=，服务页滚到那一张、加绿边。
// 后台新加的项目对不上就不带小标签
export const NEED_ORDER = ['relax', 'muscles', 'stretch', 'pressure', 'warmth', 'calm']
export const NEED_ICONS = { relax: Leaf, muscles: HeartPulse, stretch: Footprints, pressure: Hand, warmth: Flame, calm: Moon }
const NEEDS = [[/swedish/i, 'relax'], [/deep/i, 'muscles'], [/thai/i, 'stretch'], [/shiatsu/i, 'pressure'], [/stone/i, 'warmth'], [/aroma/i, 'calm']]
export const needOf = (name) => NEEDS.find(([match]) => match.test(String(name || '')))?.[1] || ''

export function photoFor(name) {
  const hit = PHOTOS.find(([match]) => match.test(String(name || '')))
  return hit ? { key: hit[1], src: hit[2] } : { key: 'other', src: '/global/photos/svc-aroma.webp' }
}

// tn = serviceNames，ti = serviceInfo，tAlt = services.photoAlt（都是 next-intl 的取字函数）
export function serviceView(service, { tn, ti, tAlt }) {
  const raw = String(service?.name || '')
  const photo = photoFor(raw)
  const options = service?.durationOptions || []
  const prices = options.map((o) => Number(o.price)).filter((p) => Number.isFinite(p) && p > 0)
  const minutes = options.map((o) => Number(o.durationMinutes)).filter((m) => Number.isFinite(m) && m > 0)
  return {
    name: tn.has(raw) ? tn(raw) : niceName(raw),
    description: ti.has(raw) ? ti(raw) : service?.description || '',
    photo: { src: photo.src, alt: tAlt(photo.key) },
    options,
    fromPrice: prices.length ? Math.min(...prices) : null,
    minMinutes: minutes.length ? Math.min(...minutes) : null,
    maxMinutes: minutes.length ? Math.max(...minutes) : null,
  }
}

export const bookService = (service) => window.dispatchEvent(new CustomEvent('open-booking-modal-with-service', { detail: { service } }))
