import { ServicePrices } from '../../components/ServiceMenuParts';
import { loadPublicServiceMenu } from '../../lib/publicServiceMenu.mjs';

// ⚠ 2026-07-29 重写。这一页原来把价格**硬写死在代码里**,而且全是建站时的示例假数据:
// Swedish 写 ₱2,500(真价 ₱1,000)、Deep Tissue ₱3,500(真价 ₱1,500),
// 还列着 Japanese Head Spa / Foot Massage —— 这两个服务我们**根本没有**。
// 页面允许 Google 收录,客人搜"多少钱"落到这里,看到贵 2.5 倍的价就走了。
// 现在改成读下单弹窗用的同一个真实价目接口:后台改一次价,全站自动跟着变,不会再对不上。
// ⚠ 2026-10-26 再修:原来拉不到接口会退回内置示例目录 —— 那套就是上面说的假价,等于绕一圈又把假价摆出来。
// 现在跟首页、/services 共用 loadPublicServiceMenu():读不到就沿用上一次算好的页面(真价),不再有任何内置价目。
export const revalidate = 60;

export const metadata = {
  title: 'Pricing | EasyGo Spa Home Massage Manila',
  description: 'Real prices for home massage in Metro Manila. No transport fee, no tips. Cash when your therapist arrives.'
};

export default async function PricingPage() {
  const services = await loadPublicServiceMenu();

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-[#FDFCF9]">
      <div className="max-w-3xl mx-auto">

        <h1 className="font-serif text-4xl md:text-5xl font-bold text-center mb-3 text-[#0F0F0F]">
          Pricing
        </h1>
        <p className="text-center text-gray-600 mb-3">
          The therapist comes to your home, condo or hotel.
        </p>
        <p className="text-center text-[#2db83d] font-semibold mb-10">
          No transport fee · No tips · Cash when she arrives
        </p>

        <div className="bg-white rounded-3xl p-5 md:p-8 shadow-lg">
          {services.length ? services.map((service, index) => (
            <div className={index < services.length - 1 ? 'border-b border-gray-100 pb-5 mb-5' : ''} key={service.id || service.name}>
              <p className="font-semibold text-[#0F0F0F] mb-2">{service.name}</p>
              <ServicePrices options={service.durationOptions || []} />
            </div>
          )) : (
            <p className="text-center text-gray-500 py-8 m-0">
              Prices are loading. Please open the booking page to see live rates.
            </p>
          )}
        </div>

        <div className="mt-10 text-center">
          {/* 2026-10-26 修:原来是站内跳 /?book=1,但预约弹窗挂在全站外壳里、站内跳转不会重查 ?book=1,
              客人点完只回到首页、什么都不弹。改成就地打开预约窗(全站通用的 data-open-booking,跟顶部 Book Now 一样)。 */}
          <button
            type="button"
            data-open-booking="1"
            className="inline-block rounded-full bg-[#2db83d] px-8 py-4 font-semibold text-white"
          >
            Pick your therapist
          </button>
          <p className="mt-4 text-sm text-gray-500">
            You choose the therapist yourself — real photos and profiles on the wall.
          </p>
        </div>

      </div>
    </div>
  );
}
