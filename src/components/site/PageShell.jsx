import BrandMark from '@/components/BrandMark'
import AppButton from './AppButton'
import { nums } from './nums'

// 内页外框（建站模版 serinity 的内页样子）：顶上一条压暗的大图垫在菜单下面，下面小胶囊 + 大标题 + 一段说明，
// 中间放各页内容，最底下一张白卡片「预约」。11-12 起官网下单全部去 App（老板「下单链接啥的全部到app」）：按钮手机跳商店、电脑去首页下载区。
export function BottomCta({ title, text, button }) {
  return (
    <div className="text-center mt-16 animate-fadeInUp">
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-lg border border-[#64734F]/20">
        <h2 className="font-serif text-[clamp(1.9rem,4vw,3rem)] text-[#0F0F0F] mb-4">{nums(title)}</h2>
        {text ? <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-[1.618]">{text}</p> : null}
        <AppButton from="cta" className="bg-[#64734F] text-white px-8 py-4 rounded-full font-medium hover:bg-[#55633F] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
          {button}
        </AppButton>
      </div>
    </div>
  )
}

export default function PageShell({ pill, title, lead, image = '/global/photos/band-living.webp', cta, width = 'max-w-7xl', children }) {
  return (
    <div className="pt-32 pb-24 bg-gradient-to-b from-[#F8F2EC] to-white min-h-screen relative">
      <span data-nav-over-dark hidden />
      <div style={{ backgroundImage: `url(${image})` }} className="w-full h-80 bg-center bg-cover bg-no-repeat md:bg-fixed -mt-[280px] mb-6" aria-hidden="true">
        <div className="w-full h-full bg-black/70" />
      </div>
      <div className={`${width} mx-auto px-6 lg:px-8`}>
        <header className="text-center mb-14 animate-fadeInUp">
          {pill ? (
            <div className="inline-flex items-center gap-2 bg-[#64734F]/10 rounded-full px-4 py-2 mb-6">
              <BrandMark size={28} />
              <span className="text-base font-medium text-[#55633F]">{pill}</span>
            </div>
          ) : null}
          <h1 className="font-serif text-[clamp(2.1rem,5vw,3.75rem)] text-[#0F0F0F] mb-6 leading-tight max-w-5xl mx-auto">{nums(title)}</h1>
          {lead ? <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-[1.618]">{lead}</p> : null}
        </header>
        {children}
        {cta ? <BottomCta {...cta} /> : null}
      </div>
    </div>
  )
}
