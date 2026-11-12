import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ServicesPage from '@/components/ServicesPage'
import PageShell from '@/components/site/PageShell';
import { loadPublicServiceMenu } from '@/lib/publicServiceMenu.mjs';
import { alternatesFor } from '@/i18n/routing';
import { OG_IMAGE } from '@/lib/shareImage';

// 2026-10-26:服务卡显示后台真价;每 60 秒最多重算一次,读不到后台时继续给上一次的页面(规则见 lib/publicServiceMenu.mjs)
export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.services' });
  // 2026-10-26:原来写着 Thai dry / foot massage(我们没有)、分享卡写 salon、配图文件不存在;改成真项目,配图用全站默认那张
  return {
    // 标题里已经带品牌名，不再让外框在后面多加一个「| EasyGoSpa」
    title: { absolute: t('title') },
    description: t('description'),
    alternates: alternatesFor(locale, '/services'),
    openGraph: {
      title: t('title'),
      description: t('ogDescription'),
      images: [OG_IMAGE],
    },
  };
}

export default async function Services({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const services = await loadPublicServiceMenu();
  const t = await getTranslations({ locale, namespace: 'services' });
  return (
    <PageShell
      pill={t('eyebrow')}
      title={t('title')}
      lead={t('lead')}
      image="/global/photos/svc-swedish.webp"
      cta={{ title: t('ctaTitle'), text: t('ctaText'), button: t('ctaButton') }}
    >
      <Suspense fallback={null}>
        <ServicesPage services={services}/>
      </Suspense>
    </PageShell>
  )
}
