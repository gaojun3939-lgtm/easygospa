import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Smartphone } from 'lucide-react';

// 付款跳回页 https://www.easygospa.com/pay/ok（2026-11-14 收款换 PayMongo，窗口 3 的 paymongo-pay 把这里当 return_url）：
// 客人在 App 里选 GCash / Maya 付款，App 跳出去付，付完 PayMongo 把浏览器带回这一页，客人自己切回 App。
// PayMongo 付成功、付失败、中途取消都会跳回同一个网址，这一页不知道结果，所以不写「付款完成」，只请客人回 App 看结果。
// 不放下单入口、不碰网页下单那一套；不进搜索引擎、不进网站地图。样子照找不到页（顶上深色条 + 居中大字）。
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pay' });
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default async function PayOkPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'pay' });
  return (
    <div className="pt-32 pb-24 bg-gradient-to-b from-[#F8F2EC] to-white min-h-[70vh] relative">
      <span data-nav-over-dark hidden />
      <div style={{ backgroundImage: 'url(/global/photos/closing-corridor.webp)' }} className="w-full h-80 bg-center bg-cover -mt-[280px] mb-10" aria-hidden="true">
        <div className="w-full h-full bg-black/70" />
      </div>
      <div className="max-w-2xl mx-auto px-6 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#64734F]/10 mb-6" aria-hidden="true">
          <Smartphone className="h-8 w-8 text-[#55633F]" strokeWidth={1.8} />
        </span>
        <h1 className="font-serif text-3xl md:text-4xl text-[#0F0F0F] mb-4 leading-tight">{t('title')}</h1>
        <p className="text-lg text-gray-600 leading-[1.618]">{t('text')}</p>
      </div>
    </div>
  );
}
