import { getTranslations, setRequestLocale } from 'next-intl/server';
import PageShell from '@/components/site/PageShell';
import GalleryGrid from '@/components/site/GalleryGrid';
import { alternatesFor } from '@/i18n/routing';

// 相册页（建站模版 serinity 有这一页；2026-11-10 老板「不要删减页面」，用我们自己的图放回来）。
// 九张是 2026-11-11 老板挑定的第二套自家静物图（同一张台面、同一种傍晚窗光、深绿莲花包、橄榄绿条纹毛巾，没有人脸、没有按摩床），跟首页同一批图。
const IMAGES = [
  { src: '/global/photos/place-home.webp', key: 'home', category: 'home' },
  { src: '/global/photos/place-condo.webp', key: 'condo', category: 'condo' },
  { src: '/global/photos/place-hotel.webp', key: 'hotel', category: 'hotel' },
  { src: '/global/photos/svc-thai.webp', key: 'thai', category: 'treatment' },
  { src: '/global/photos/band-living.webp', key: 'kit', category: 'home' },
  { src: '/global/photos/svc-stone.webp', key: 'stones', category: 'treatment' },
  { src: '/global/photos/closing-corridor.webp', key: 'ready', category: 'hotel' },
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
