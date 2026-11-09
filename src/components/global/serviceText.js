// 项目的名字、介绍、配图、价格写法（首页、服务页、价目页共用）。
// 名字和介绍读后台（英文）；别的语言在 serviceNames / serviceInfo 两份文字里按后台原名对上，对不上就显示英文原文。
// 后台改了英文介绍，别的语言要跟着改 src/messages/<语言>/serviceInfo.json。
export const peso = (value) => `₱${Number(value).toLocaleString('en-US')}`
export const niceName = (name) => String(name || '').replace(/\(/, ' (').replace(/\s+/g, ' ').trim()

// 每个项目配一张图（2026-11-10 老板「现在这些图太像 AI」后让 Codex 按真实摄影重拍：客人自己的床、沙发、地垫，没有按摩床）。后台新加的项目先用精油那张，不会空着
const PHOTOS = [
  [/deep/i, 'deep', '/global/photos/svc-deep.webp'],
  [/stone/i, 'stone', '/global/photos/svc-stone.webp'],
  [/aroma/i, 'aroma', '/global/photos/svc-aroma.webp'],
  [/shiatsu/i, 'shiatsu', '/global/photos/svc-shiatsu.webp'],
  [/swedish/i, 'swedish', '/global/photos/svc-swedish.webp'],
  [/thai/i, 'thai', '/global/photos/svc-thai.webp'],
]
// 首页按「身体需要什么」分页签（老板认可的 .ph 首页同一个思路）。后台新加的项目没有对应，就直接用项目名当页签
export const NEED_ORDER = ['relax', 'muscles', 'stretch', 'pressure', 'warmth', 'calm']
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
  return {
    name: tn.has(raw) ? tn(raw) : niceName(raw),
    description: ti.has(raw) ? ti(raw) : service?.description || '',
    photo: { src: photo.src, alt: tAlt(photo.key) },
    options: service?.durationOptions || [],
  }
}

export const bookService = (service) => window.dispatchEvent(new CustomEvent('open-booking-modal-with-service', { detail: { service } }))
