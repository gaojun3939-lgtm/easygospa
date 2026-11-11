import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft, Clock, MapPin, Tag } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import PageShell from '@/components/site/PageShell';
import { STORES, storePath } from '@/components/site/stores';
import { BookButton, StatusChip, StorePhone, StorePhoto, openingText } from '@/components/site/StoreParts';
import { SITE, alternatesFor, localePath } from '@/i18n/routing';

// 每家门店一页（/stores/<slug>）：照片、营业状态、地址和地图、营业时间、电话、到店价格、预约到店。
// 每家店单独一页，谷歌搜「附近按摩」才能搜到每一家；页里带一段给搜索引擎看的门店资料（地址、电话、营业时间）。
// 门店资料在 components/site/stores.js；清单里没有的网址一律 404。
export const dynamicParams = false;

// 语言那一层由 [locale]/layout 的 generateStaticParams 给，这里只给每家店的 slug
export function generateStaticParams() {
  return STORES.map((store) => ({ slug: store.slug }));
}

const findStore = (slug) => STORES.find((store) => store.slug === slug);

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const store = findStore(slug);
  if (!store) return {};
  const t = await getTranslations({ locale, namespace: 'stores' });
  return {
    title: store.name,
    description: t('storeMeta', { store: store.name, area: store.area || store.city }),
    alternates: alternatesFor(locale, storePath(store)),
  };
}

export default async function StorePage({ params }) {
  const { locale, slug } = await params;
  const store = findStore(slug);
  if (!store) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'stores' });
  const month = openingText(store, locale);
  // 给搜索引擎看的门店资料（schema.org 的按摩店）：只放填了的真资料
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'DaySpa',
    name: store.name,
    url: `${SITE}${localePath(locale, storePath(store))}`,
    ...(store.address ? { address: { '@type': 'PostalAddress', streetAddress: store.address, addressLocality: store.city, addressCountry: 'PH' } } : {}),
    ...(store.phone ? { telephone: store.phone } : {}),
    ...(store.photos?.length ? { image: store.photos.map((src) => `${SITE}${src}`) } : {}),
    ...(store.mapUrl ? { hasMap: store.mapUrl } : {}),
  };
  return (
    <PageShell
      pill={store.city}
      title={store.name}
      lead={store.area}
      image={store.photos?.[0] || '/global/photos/band-living.webp'}
      width="max-w-6xl"
      cta={{ title: t('ctaTitle'), text: t('ctaText'), button: t('ctaButton') }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-start">
        <div className="rounded-3xl overflow-hidden shadow-lg aspect-[4/3]">
          <StorePhoto store={store} alt={t('photoAlt', { store: store.name })} />
        </div>
        <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col gap-5">
          <StatusChip store={store} t={t} locale={locale} />
          {store.status !== 'open' && month ? <p className="text-gray-600">{t('openingNote', { month })}</p> : null}
          <ul className="space-y-4 text-gray-700">
            {store.address ? (
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 flex-none text-[#64734F]" aria-hidden="true" />
                <span>
                  <b className="block text-sm text-gray-500 font-medium mb-0.5">{t('fields.address')}</b>
                  {store.address}
                  {store.mapUrl ? <a href={store.mapUrl} target="_blank" rel="noreferrer" className="block mt-1 text-[#55633F] hover:underline">{t('fields.map')}</a> : null}
                </span>
              </li>
            ) : null}
            {store.hours ? (
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 mt-0.5 flex-none text-[#64734F]" aria-hidden="true" />
                <span><b className="block text-sm text-gray-500 font-medium mb-0.5">{t('fields.hours')}</b>{store.hours}</span>
              </li>
            ) : null}
            {typeof store.samePrice === 'boolean' ? (
              <li className="flex items-start gap-3">
                <Tag className="w-5 h-5 mt-0.5 flex-none text-[#64734F]" aria-hidden="true" />
                <span>
                  <b className="block text-sm text-gray-500 font-medium mb-0.5">{t('fields.price')}</b>
                  {store.samePrice ? <>{t('fields.samePrice')} <Link href="/pricing" className="text-[#55633F] hover:underline">{t('fields.seePrices')}</Link></> : t('fields.ownPrice')}
                </span>
              </li>
            ) : null}
          </ul>
          <StorePhone store={store} t={t} />
          <BookButton store={store} t={t} wide />
          <Link href="/stores" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#55633F]"><ArrowLeft className="w-4 h-4" aria-hidden="true" />{t('back')}</Link>
        </div>
      </div>
      {store.photos?.length > 1 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
          {store.photos.slice(1).map((src) => <img key={src} src={src} alt={t('photoAlt', { store: store.name })} className="w-full aspect-[4/3] object-cover rounded-2xl shadow-lg" loading="lazy" />)}
        </div>
      ) : null}
    </PageShell>
  );
}
