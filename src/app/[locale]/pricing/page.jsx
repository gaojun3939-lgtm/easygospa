import { getTranslations, setRequestLocale } from 'next-intl/server';
import { HandCoins, Wallet } from 'lucide-react';
import PageShell from '@/components/site/PageShell';
import PriceList from '@/components/site/PriceList';
import { loadPublicServiceMenu } from '@/lib/publicServiceMenu.mjs';
import { alternatesFor } from '@/i18n/routing';

// ⚠ 2026-07-29 重写。这一页原来把价格**硬写死在代码里**,而且全是建站时的示例假数据:
// Swedish 写 ₱2,500(真价 ₱1,000)、Deep Tissue ₱3,500(真价 ₱1,500),
// 还列着 Japanese Head Spa / Foot Massage —— 这两个服务我们**根本没有**。
// 现在改成读下单弹窗用的同一个真实价目接口:后台改一次价,全站自动跟着变,不会再对不上。
// ⚠ 2026-10-26 再修:原来拉不到接口会退回内置示例目录 —— 那套就是上面说的假价,等于绕一圈又把假价摆出来。
// 现在跟首页、/services 共用 loadPublicServiceMenu():读不到就沿用上一次算好的页面(真价),不再有任何内置价目。
// 2026-11-10 外框换成建站模版 serinity 的内页样子（模版没有价目页，用同一个外框）。
export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pricing' });
  return { title: { absolute: t('title') }, description: t('description'), alternates: alternatesFor(locale, '/pricing') };
}

export default async function PricingPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'pricing' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const services = await loadPublicServiceMenu();

  return (
    <PageShell
      pill={t('pill')}
      title={t('title')}
      lead={t('lead')}
      image="/global/photos/svc-stone.webp"
      width="max-w-5xl"
      cta={{ title: t('pick'), text: t('foot'), button: tc('bookNow') }}
    >
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[#64734F]/20 px-4 py-2 text-sm text-[#55633F]"><Wallet className="w-4 h-4" aria-hidden="true" />{t('cash')}</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[#64734F]/20 px-4 py-2 text-sm text-[#55633F]"><HandCoins className="w-4 h-4" aria-hidden="true" />{t('tips')}</span>
      </div>
      {services.length ? <PriceList services={services} /> : <p className="text-center text-gray-600">{t('empty')}</p>}
    </PageShell>
  );
}
