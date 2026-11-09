// 项目的名字、介绍、配图、价格写法（首页、服务页、价目页共用）。
// 名字和介绍读后台（英文）；别的语言在 serviceNames / serviceInfo 两份文字里按后台原名对上，对不上就显示英文原文。
// 后台改了英文介绍，别的语言要跟着改 src/messages/<语言>/serviceInfo.json。
export const peso = (value) => `₱${Number(value).toLocaleString('en-US')}`
export const niceName = (name) => String(name || '').replace(/\(/, ' (').replace(/\s+/g, ' ').trim()

// 每个项目配一张图（公司现有素材）。后台新加的项目先用毛巾那张，不会空着
const PHOTOS = [
  [/deep/i, 'deep', '/global/photos/deep.webp'],
  [/stone/i, 'stone', '/global/photos/stones-back.webp'],
  [/aroma/i, 'aroma', '/global/photos/oils.webp'],
  [/shiatsu/i, 'shiatsu', '/global/photos/shoulders.webp'],
  [/swedish/i, 'swedish', '/global/photos/swedish.webp'],
  [/thai/i, 'thai', '/global/photos/thai.webp'],
]
export function photoFor(name) {
  const hit = PHOTOS.find(([match]) => match.test(String(name || '')))
  return hit ? { key: hit[1], src: hit[2] } : { key: 'other', src: '/global/photos/towels.webp' }
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
