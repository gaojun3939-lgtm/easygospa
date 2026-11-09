import { getTranslations } from 'next-intl/server'
import { peso, serviceView } from './serviceText'

// 价目表（价目页用）：一张白卡片，一行一个项目，三档时长三列价格。价格都读后台，不写死（Xendit 审核要一眼看到价格）
/** @param {{ services?: any[] }} props */
export default async function PriceList({ services = [] }) {
  const t = await getTranslations('common')
  const tn = await getTranslations('serviceNames')
  const ti = await getTranslations('serviceInfo')
  const tAlt = await getTranslations('services.photoAlt')
  const views = services.map((service) => ({ key: service.id || service.name, ...serviceView(service, { tn, ti, tAlt }) }))
  const minutes = [...new Set(views.flatMap((v) => v.options.map((o) => Number(o.durationMinutes))))].sort((a, b) => a - b)
  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden animate-fadeInUp">
      <div className="hidden md:grid grid-cols-[1fr_repeat(3,8rem)] gap-4 px-8 py-4 bg-[#F8F2EC] text-sm font-medium text-gray-500 uppercase tracking-wider">
        <span />
        {minutes.slice(0, 3).map((m) => <span key={m} className="text-center">{t('minutes', { count: m })}</span>)}
      </div>
      <ul className="divide-y divide-gray-100">
        {views.map((view) => (
          <li key={view.key} className="px-5 md:px-8 py-5 md:grid md:grid-cols-[1fr_repeat(3,8rem)] md:gap-4 md:items-center">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <img src={view.photo.src} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" loading="lazy" />
              <h2 className="font-serif text-lg md:text-xl text-[#0F0F0F]">{view.name}</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 md:contents">
              {minutes.slice(0, 3).map((m) => {
                const option = view.options.find((o) => Number(o.durationMinutes) === m)
                return (
                  <div key={m} className="rounded-xl bg-[#F8F2EC] md:bg-transparent px-2 py-2 md:p-0 text-center">
                    <span className="block md:hidden text-[11px] text-gray-500">{t('minutes', { count: m })}</span>
                    <b className="text-base md:text-lg font-semibold text-[#0F0F0F]">{option ? peso(option.price) : '—'}</b>
                  </div>
                )
              })}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
