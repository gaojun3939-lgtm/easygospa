import { getTranslations, setRequestLocale } from 'next-intl/server';
import PageShell from '@/components/site/PageShell';
import GalleryGrid from '@/components/site/GalleryGrid';
import { alternatesFor } from '@/i18n/routing';

// 相册页（建站模版 serinity 有这一页；2026-11-10 老板「不要删减页面」，用我们自己的图放回来）。
// 九张都是 Codex 按真实摄影拍的上门场景（客人自己的家、公寓、酒店，没有按摩床），跟首页同一批图。
const IMAGES = [
  { src: '/global/photos/place-home.webp', key: 'door', category: 'home' },
  { src: '/global/photos/place-condo.webp', key: 'feet', category: 'condo' },
  { src: '/global/photos/place-hotel.webp', key: 'towels', category: 'hotel' },
  { src: '/global/photos/svc-thai.webp', key: 'stretch', category: 'treatment' },
  { src: '/global/photos/band-living.webp', key: 'tea', category: 'home' },
  { src: '/global/photos/svc-stone.webp', key: 'stones', category: 'treatment' },
  { src: '/global/photos/closing-corridor.webp', key: 'hallway', category: 'condo' },
  { src: '/global/photos/svc-shiatsu.webp', key: 'shiatsu', category: 'treatment' },
  { src: '/global/photos/svc-aroma.webp', key: 'oil', category: 'treatment' },
];

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'gallery' });
  return { title: t('metaTitle'), description: t('metaDescription'), alternates: alternatesFor(locale, '/gallery') };
}

export default async function GalleryPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'gallery' });
  const images = IMAGES.map((image) => ({
    src: image.src,
    title: t(`items.${image.key}.title`),
    alt: t(`items.${image.key}.alt`),
    category: t(`categories.${image.category}`),
  }));
  return (
    <PageShell
      pill={t('pill')}
      title={t('title')}
      lead={t('lead')}
      image="/global/photos/closing-corridor.webp"
      cta={{ title: t('ctaTitle'), text: t('ctaText'), button: t('ctaButton') }}
    >
      <GalleryGrid images={images} labels={{ close: t('close'), prev: t('prev'), next: t('next'), count: t.raw('count') }} />
    </PageShell>
  );
}
