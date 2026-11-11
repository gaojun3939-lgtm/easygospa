import { getTranslations, setRequestLocale } from 'next-intl/server';
import PageShell from '@/components/site/PageShell';
import GalleryGrid from '@/components/site/GalleryGrid';
import { niceName } from '@/components/site/serviceText';
import { alternatesFor } from '@/i18n/routing';

// 相册页（建站模版 serinity 有这一页；2026-11-10 老板「不要删减页面」，用我们自己的图放回来）。
// 11-11 老板「图集里面的内容有点 不对吧」→「执行」：以前九张里五张都是深绿包加毛巾、一个人都没有、泰式配了草药球、少了瑞典和深层、标题手机上看不到。现在分两组：
// 一、上门是什么样子：技师 Mia 到家门口 / 在公寓 / 到酒店房门口（Mia 定稿照和开场片原片截帧，房间看得出来），搓热精油，加两张静物（用品一包带齐、夜里的酒店）。
// 二、按摩项目：后台六个项目各一张，图和名字都跟服务项目页同一份（svc-*、serviceNames）；泰式干推是地垫不用油，指压是一只手大拇指按毛巾、不用油（老板「指压那张也换了」）。
// pos：图片在 4:3 框里往哪边对齐，保证人和东西不被裁掉。
const VISIT = [
  { key: 'home', src: '/global/photos/gal-home.webp', pos: 'object-[75%_50%]' },
  { key: 'condo', src: '/global/photos/team-rated.webp', pos: 'object-[95%_30%]' },
  { key: 'hotel', src: '/global/photos/gal-hotel.webp', pos: 'object-[40%_30%]' },
  { key: 'oil', src: '/global/photos/gal-oil.webp', pos: 'object-[75%_50%]' },
  { key: 'kit', src: '/global/photos/band-living.webp', pos: 'object-[80%_50%]' },
  { key: 'night', src: '/global/photos/place-hotel.webp', pos: 'object-[50%_0%]' }, // 竖图，往上对齐，窗外夜里的城市灯光才露得出来
];
// name = 后台项目的英文原名（serviceNames 里按它翻译）
const TREATMENTS = [
  { key: 'swedish', name: 'Swedish Massage', src: '/global/photos/svc-swedish.webp' },
  { key: 'deep', name: 'Deep tissue', src: '/global/photos/svc-deep.webp' },
  { key: 'thai', name: 'Thai Body Massage', src: '/global/photos/svc-thai.webp' },
  { key: 'shiatsu', name: 'Shiatsu Massage(without Oil)', src: '/global/photos/svc-shiatsu.webp' },
  { key: 'stone', name: 'Hot Stone Massage', src: '/global/photos/svc-stone.webp' },
  { key: 'aroma', name: 'Relaxing Premium Aromatherapy Body Massage', src: '/global/photos/svc-aroma.webp' },
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
  const tn = await getTranslations({ locale, namespace: 'serviceNames' });
  const groups = [
    {
      title: t('groups.visit'),
      images: VISIT.map((image) => ({ src: image.src, pos: image.pos, title: t(`items.${image.key}.title`), alt: t(`items.${image.key}.alt`) })),
    },
    {
      title: t('groups.treatments'),
      images: TREATMENTS.map((image) => ({ src: image.src, pos: image.pos, title: tn.has(image.name) ? tn(image.name) : niceName(image.name), alt: t(`items.${image.key}.alt`) })),
    },
  ];
  return (
    <PageShell
      pill={t('pill')}
      title={t('title')}
      lead={t('lead')}
      image="/global/photos/band-living.webp"
      cta={{ title: t('ctaTitle'), text: t('ctaText'), button: t('ctaButton') }}
    >
      <GalleryGrid groups={groups} labels={{ close: t('close'), prev: t('prev'), next: t('next'), count: t.raw('count') }} />
    </PageShell>
  );
}
