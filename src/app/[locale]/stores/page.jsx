import { getTranslations, setRequestLocale } from 'next-intl/server';
import PageShell from '@/components/site/PageShell';
import { STORES, storesByCity } from '@/components/site/stores';
import { NoStoresYet, StoreCard } from '@/components/site/StoreParts';
import { alternatesFor } from '@/i18n/routing';

// 门店总页（2026-11-12 老板「官网里面 没有看到 门店下单啊？」「我们以后肯定不止一家店」→「先做起来」）。
// 按城市分组，每家店一张卡（照片、营业状态、地址、营业时间、查看门店、预约到店）；一家都还没有时显示「首家门店即将开业」，先引去约上门。
// 门店资料在 components/site/stores.js（以后改成后台填写）。
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'stores' });
  return { title: t('metaTitle'), description: t('metaDescription'), alternates: alternatesFor(locale, '/stores') };
}

export default async function StoresPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'stores' });
  const groups = storesByCity(STORES);
  return (
    <PageShell
      pill={t('pill')}
      title={t('title')}
      lead={t('lead')}
      image="/global/photos/band-living.webp"
      cta={{ title: t('ctaTitle'), text: t('ctaText'), button: t('ctaButton') }}
    >
      {groups.length ? (
        groups.map((group) => (
          <section key={group.city} className="mb-[clamp(3rem,6vw,5rem)] last:mb-0">
            <h2 className="font-serif text-[#0F0F0F] text-[clamp(1.6rem,2.6vw,2.25rem)] leading-tight mb-[clamp(1.25rem,2.5vw,2rem)]">{group.city}</h2>
            <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)]">
              {group.stores.map((store) => <StoreCard key={store.slug} store={store} t={t} locale={locale} />)}
            </div>
          </section>
        ))
      ) : (
        <NoStoresYet t={t} />
      )}
    </PageShell>
  );
}
