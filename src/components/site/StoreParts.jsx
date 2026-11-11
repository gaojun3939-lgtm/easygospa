import { Clock, ExternalLink, MapPin, MessageCircle, Phone, Store } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import BrandMark from '@/components/BrandMark'
import AppButton from './AppButton'
import { COMPANY_PHONE, whatsappLink } from '@/lib/contactConfig'
import { intlLocale } from '@/i18n/routing'
import { storePath } from './stores'

// 门店页用的零件：门店卡、营业状态小标签、预约按钮、「首家门店即将开业」。门店资料在 stores.js。
// 门店预约（11-12 老板「我们就直接在弄个网站 给门店，官网点了门店，跳转过去，那里全部都是小程序」）：
// 这家店填了 bookingUrl（门店网站上这家店的预约页）就「去门店预约」跳过去；门店网站还没好时先走公司 WhatsApp（预填哪家店，客服看英文所以预填英文）。
// 官网别的「预约」都去 App（AppButton.jsx），门店预约是唯一不去 App 的。

export function openingText(store, locale) {
  if (!store.opening) return ''
  const date = new Date(`${store.opening}-01T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(intlLocale(locale), { year: 'numeric', month: 'long' })
}

export function StatusChip({ store, t, locale, onDark = false }) {
  const open = store.status === 'open'
  const month = open ? '' : openingText(store, locale)
  const label = open ? t('status.open') : month ? t('openingOn', { month }) : t('status.soon')
  const cls = onDark
    ? 'bg-white/90 text-[#55633F]'
    : open ? 'bg-[#64734F] text-white' : 'bg-[#64734F]/10 text-[#55633F]'
  return <span className={`self-start w-fit inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cls}`}>{open ? <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" /> : null}{label}</span>
}

export function BookButton({ store, t, wide = false }) {
  const base = `inline-flex items-center justify-center gap-2 rounded-full py-3 font-medium whitespace-nowrap transition-all duration-300 ${wide ? 'w-full px-4' : 'px-6'}`
  if (store.status !== 'open' || store.booking === 'none') {
    return <span className={`${base} bg-gray-100 text-gray-500 cursor-default`}>{t('bookSoon')}</span>
  }
  if (store.bookingUrl) {
    return (
      <a href={store.bookingUrl} target="_blank" rel="noreferrer" className={`${base} bg-[#64734F] text-white hover:bg-[#55633F] shadow-lg`}>
        {t('book')}
        <ExternalLink className="w-4 h-4" aria-hidden="true" />
      </a>
    )
  }
  return (
    <a href={whatsappLink(t('waText', { store: store.name }))} target="_blank" rel="noreferrer" className={`${base} bg-[#64734F] text-white hover:bg-[#55633F] shadow-lg`}>
      <MessageCircle className="w-4 h-4" aria-hidden="true" />
      {t('book')}
    </a>
  )
}

// 门店照片：有真照片就放第一张；还没有就放一块橄榄绿底 + 莲花标（不放示意图）
export function StorePhoto({ store, alt, className = '' }) {
  if (store.photos?.length) {
    return <img src={store.photos[0]} alt={alt} className={`w-full h-full object-cover ${className}`} loading="lazy" />
  }
  return (
    <div className={`w-full h-full bg-gradient-to-br from-[#64734F] to-[#3F4A33] flex flex-col items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <BrandMark size={84} tone="light" />
      <span className="font-serif text-white/90 text-xl">{store.name}</span>
    </div>
  )
}

export function StoreCard({ store, t, locale }) {
  return (
    <article className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col">
      <Link href={storePath(store)} className="relative block aspect-[4/3] overflow-hidden">
        <StorePhoto store={store} alt={t('photoAlt', { store: store.name })} className="group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute top-4 left-4"><StatusChip store={store} t={t} locale={locale} onDark /></div>
      </Link>
      <div className="p-6 flex flex-col flex-1 gap-3">
        <h3 className="font-serif text-2xl text-[#0F0F0F]"><Link href={storePath(store)} className="hover:text-[#55633F] transition-colors">{store.name}</Link></h3>
        {store.area ? <p className="text-sm font-medium text-[#64734F]">{store.area}</p> : null}
        <ul className="text-sm text-gray-600 space-y-2">
          {store.address ? <li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 flex-none text-[#64734F]" aria-hidden="true" />{store.address}</li> : null}
          {store.hours ? <li className="flex items-start gap-2"><Clock className="w-4 h-4 mt-0.5 flex-none text-[#64734F]" aria-hidden="true" />{store.hours}</li> : null}
        </ul>
        <div className="mt-auto pt-2 grid grid-cols-2 gap-3">
          <Link href={storePath(store)} className="inline-flex items-center justify-center rounded-full px-4 py-3 font-medium whitespace-nowrap bg-[#64734F]/10 text-[#55633F] hover:bg-[#64734F]/20 transition-colors">{t('view')}</Link>
          <BookButton store={store} t={t} wide />
        </div>
      </div>
    </article>
  )
}

// 还没有门店：独立的空状态（不是空框），告诉客人首家店在筹备、现在可以先下载 App 约上门
export function NoStoresYet({ t }) {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg p-8 md:p-12 text-center animate-fadeInUp">
      <span className="inline-flex w-16 h-16 rounded-2xl bg-[#64734F]/10 items-center justify-center mb-6"><Store className="w-8 h-8 text-[#64734F]" aria-hidden="true" /></span>
      <h2 className="font-serif text-[clamp(1.7rem,3.2vw,2.4rem)] text-[#0F0F0F] mb-4">{t('empty.title')}</h2>
      <p className="text-gray-600 leading-[1.618] max-w-xl mx-auto mb-8">{t('empty.text')}</p>
      <AppButton from="stores" className="bg-[#64734F] text-white px-8 py-4 rounded-full font-medium hover:bg-[#55633F] transition-all duration-300 hover:scale-105 shadow-lg">{t('empty.button')}</AppButton>
    </div>
  )
}

export function StorePhone({ store, t }) {
  const phone = store.phone || COMPANY_PHONE
  return <a href={`tel:${phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 text-[#55633F] hover:underline"><Phone className="w-4 h-4" aria-hidden="true" />{t('fields.callStore', { phone })}</a>
}
