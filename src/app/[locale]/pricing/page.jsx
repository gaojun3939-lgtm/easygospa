import { getTranslations, setRequestLocale } from 'next-intl/server';
import PageHead from '@/components/global/PageHead';
import ServiceRows from '@/components/global/ServiceRows';
import { loadPublicServiceMenu } from '@/lib/publicServiceMenu.mjs';
import { alternatesFor } from '@/i18n/routing';

// ⚠ 2026-07-29 重写。这一页原来把价格**硬写死在代码里**,而且全是建站时的示例假数据:
// Swedish 写 ₱2,500(真价 ₱1,000)、Deep Tissue ₱3,500(真价 ₱1,500),
// 还列着 Japanese Head Spa / Foot Massage —— 这两个服务我们**根本没有**。
// 现在改成读下单弹窗用的同一个真实价目接口:后台改一次价,全站自动跟着变,不会再对不上。
// ⚠ 2026-10-26 再修:原来拉不到接口会退回内置示例目录 —— 那套就是上面说的假价,等于绕一圈又把假价摆出来。
// 现在跟首页、/services 共用 loadPublicServiceMenu():读不到就沿用上一次算好的页面(真价),不再有任何内置价目。
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
  const services = await loadPublicServiceMenu();

  return (
    <div className="ga ga-page">
      <PageHead title={t('title')}>
        <p>{t('lead')}</p>
        <p className="ga-page-note">{t('note')}</p>
      </PageHead>

      <section className="ga-wrap ga-page-sec">
        {services.length ? (
          <ServiceRows services={services} bookable={false} showText={false} />
        ) : (
          <p className="ga-empty">{t('empty')}</p>
        )}

        <div className="ga-page-foot">
          {/* 2026-10-26 修:就地打开预约窗(全站通用的 data-open-booking,跟顶部 Book Now 一样)。 */}
          <button type="button" data-open-booking="1" className="ga-btn ga-btn-big">
            {t('pick')}
          </button>
          <p>{t('foot')}</p>
        </div>
      </section>
    </div>
  );
}
