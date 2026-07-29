import Link from 'next/link';
import { getFallbackWebsiteBookingCatalog, normalizePublicBookingCatalog } from '../../lib/bookingCatalogNormalizer.mjs';
import { resolveAiOfficeApiUrl } from '../../lib/aiofficeApiBase.mjs';

// ⚠ 2026-07-29 重写。这一页原来把价格**硬写死在代码里**,而且全是建站时的示例假数据:
// Swedish 写 ₱2,500(真价 ₱1,000)、Deep Tissue ₱3,500(真价 ₱1,500),
// 还列着 Japanese Head Spa / Foot Massage —— 这两个服务我们**根本没有**。
// 页面允许 Google 收录,客人搜"多少钱"落到这里,看到贵 2.5 倍的价就走了。
// 现在改成读下单弹窗用的同一个真实价目接口:后台改一次价,全站自动跟着变,不会再对不上。
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Pricing | EasyGo Spa Home Massage Manila',
  description: 'Real prices for home massage in Metro Manila. No transport fee, no tips. Cash when your therapist arrives.'
};

const peso = value => `₱${Number(value || 0).toLocaleString('en-US')}`;

async function loadServices() {
  const backend = resolveAiOfficeApiUrl('bookingCatalog');
  if (!backend.ok) return normalizePublicBookingCatalog(getFallbackWebsiteBookingCatalog()).services || [];
  try {
    const response = await fetch(backend.url, { cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    // 后端回的是 {ok, data:{...}} 双层信封,两层都要试(见 [[growth-api-double-envelope]])
    const raw = payload?.data ?? payload;
    const normalized = normalizePublicBookingCatalog(raw);
    if (normalized?.services?.length) return normalized.services;
  } catch {
    // 拉不到就退回内置目录,**绝不退回写死的假价**
  }
  return normalizePublicBookingCatalog(getFallbackWebsiteBookingCatalog()).services || [];
}

export default async function PricingPage() {
  const services = await loadServices();

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
              <div className="grid grid-cols-3 gap-2">
                {(service.durationOptions || []).map(option => (
                  <div className="rounded-xl bg-[#FDFCF9] px-3 py-2 text-center" key={option.id || option.durationMinutes}>
                    <p className="text-xs text-gray-500 m-0">{option.durationMinutes} min</p>
                    <p className="text-lg font-bold text-[#0F0F0F] m-0">{peso(option.price)}</p>
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <p className="text-center text-gray-500 py-8 m-0">
              Prices are loading. Please open the booking page to see live rates.
            </p>
          )}
        </div>

        <div className="mt-10 text-center">
          <Link
            className="inline-block rounded-full bg-[#2db83d] px-8 py-4 font-semibold text-white"
            href="/?book=1"
          >
            Pick your therapist
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            You choose the therapist yourself — real photos and profiles on the wall.
          </p>
        </div>

      </div>
    </div>
  );
}
