import { getTranslations, setRequestLocale } from 'next-intl/server';
import PageShell from '@/components/site/PageShell';
import GalleryGrid from '@/components/site/GalleryGrid';
import { niceName } from '@/components/site/serviceText';
import { alternatesFor } from '@/i18n/routing';

// 相册页（建站模版 serinity 有这一页；2026-11-10 老板「不要删减页面」，用我们自己的图放回来）。
// 11-11 老板「图集里面的内容有点 不对吧」→「执行」：以前九张里五张都是深绿包加毛巾、一个人都没有、泰式配了草药球、少了瑞典和深层、标题手机上看不到。现在分两组：
// 一、从下单到按完：老板「这上面 应该是一套 下单的程序 对吧？」→ 按客人用 App 的先后顺序排 1–6 步：
//    挑技师、下单、技师出发（App 真截图，主窗口用调试包演示单截的，技师换成 Mia）→ 到您门口（Mia 定稿全身照）→ 开始按摩（开场片搓精油）→ 按完评分。
//    App 截图只有中文和英文两种：中文页用中文图，其他语言用英文图。
// 二、按摩项目：后台六个项目各一张，图和名字都跟服务项目页同一份（svc-*、serviceNames）；泰式干推是地垫不用油，指压是一只手大拇指按毛巾、不用油（老板「指压那张也换了」）。
// pos：图片在 4:3 框里往哪边对齐，保证人和东西不被裁掉。
const appShot = (name) => (locale) => `/global/photos/${name}-${locale.startsWith('zh') ? 'zh' : 'en'}.webp`;
const STEPS = [
  { key: 'pick', src: appShot('gal-step-pick') },
  { key: 'book', src: appShot('gal-step-book') },
  { key: 'depart', src: appShot('gal-step-depart') },
  { key: 'arrive', src: '/global/photos/gal-home.webp', pos: 'object-[75%_50%]' },
  { key: 'massage', src: '/global/photos/gal-oil.webp', pos: 'object-[75%_50%]' },
  { key: 'rate', src: appShot('gal-step-rate') },
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
      title: t('groups.steps'),
      images: STEPS.map((image, i) => ({
        src: typeof image.src === 'function' ? image.src(locale) : image.src,
        pos: image.pos,
        step: i + 1,
        title: t(`items.${image.key}.title`),
        alt: t(`items.${image.key}.alt`),
      })),
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
