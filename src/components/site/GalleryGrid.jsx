'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, X } from 'lucide-react'

// 相册（建站模版 serinity 的相册页）：分组、三列图，点开大图，左右键翻、Esc 关。
// 11-11 老板「图集里面的内容有点 不对吧」→ 标题直接写在每张图下面（以前鼠标放上去才出来，手机上看不到）；大图里左右翻跨组连着翻。
export default function GalleryGrid({ groups, labels }) {
  const images = groups.flatMap((group) => group.images)
  const [open, setOpen] = useState(null)
  const move = (step) => setOpen((i) => (i + step + images.length) % images.length)

  useEffect(() => {
    if (open === null) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen((i) => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setOpen((i) => (i - 1 + images.length) % images.length)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, images.length])

  const current = open === null ? null : images[open]
  const starts = groups.map((_, g) => groups.slice(0, g).reduce((n, group) => n + group.images.length, 0))
  return (
    <>
      {groups.map((group, g) => (
        <section key={group.title} className="mb-[clamp(3rem,6vw,5rem)] last:mb-0">
          <h2 className="font-serif text-[#0F0F0F] text-[clamp(1.6rem,2.6vw,2.25rem)] leading-tight mb-[clamp(1.25rem,2.5vw,2rem)]">{group.title}</h2>
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)]">
            {group.images.map((image, k) => {
              const i = starts[g] + k
              return (
                <motion.button
                  key={image.src + image.title}
                  type="button"
                  onClick={() => setOpen(i)}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: (k % 3) * 0.1, ease: 'easeOut' }}
                  viewport={{ once: true }}
                  className="group text-left"
                  aria-label={image.title}
                >
                  <div className="relative overflow-hidden rounded-3xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img src={image.src} alt={image.alt} className={`w-full h-full object-cover ${image.pos || ''} group-hover:scale-110 transition-transform duration-700`} loading="lazy" />
                      <div className="absolute top-4 right-4 w-11 h-11 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <ArrowRight className="w-5 h-5 text-[#64734F]" aria-hidden="true" />
                      </div>
                    </div>
                    <h3 className="font-serif text-[#0F0F0F] text-xl px-6 py-5">{image.title}</h3>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </section>
      ))}

      {current ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => setOpen(null)} role="dialog" aria-modal="true" aria-label={current.title}>
          <button type="button" onClick={() => setOpen(null)} aria-label={labels.close} className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"><X className="w-6 h-6" /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); move(-1) }} aria-label={labels.prev} className="absolute left-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"><ArrowRight className="w-6 h-6 rotate-180" /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); move(1) }} aria-label={labels.next} className="absolute right-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"><ArrowRight className="w-6 h-6" /></button>
          <div className="relative max-w-5xl max-h-[90vh] mx-4" onClick={(e) => e.stopPropagation()}>
            <img src={current.src} alt={current.alt} className="w-full h-full max-h-[90vh] object-contain rounded-lg" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg text-white">
              <h3 className="font-serif text-2xl mb-1">{current.title}</h3>
              <p className="text-sm text-gray-300">{labels.count.replace('{n}', String(open + 1)).replace('{total}', String(images.length))}</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
