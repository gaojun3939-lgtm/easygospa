import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MapPin } from 'lucide-react';
import PageShell from '@/components/site/PageShell';
import { AREAS } from '@/components/site/areas';
import { alternatesFor } from '@/i18n/routing';

// 服务地区页（模版没有这一页，用同一个内页外框）。地名是专有名词，各语言都写英文（跟地图上一致）
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.coverage' });
  return { title: t('title'), alternates: alternatesFor(locale, '/coverage') };
}

export default async function CoveragePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'coverage' });
  return (
    <PageShell
      pill={t('pill')}
      title={t('title')}
      lead={t('lead')}
      image="/global/photos/band-living.webp"
      width="max-w-5xl"
      cta={{ title: t('ctaTitle'), text: t('ctaText'), button: t('ctaButton') }}
    >
      <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeInUp">
        {AREAS.map((area) => (
          <li key={area} className="bg-white rounded-2xl shadow-lg px-5 py-6 flex flex-col items-center gap-3 text-center">
            <span className="w-11 h-11 rounded-full bg-[#64734F]/10 flex items-center justify-center"><MapPin className="w-5 h-5 text-[#64734F]" aria-hidden="true" /></span>
            <b className="font-serif text-xl text-[#0F0F0F] font-normal">{area}</b>
          </li>
        ))}
      </ul>
      <p className="text-center text-gray-600 mt-8 max-w-2xl mx-auto leading-relaxed">{t('note')}</p>
      <figure className="mt-12 rounded-3xl overflow-hidden shadow-lg">
        <img src="/global/photos/band-living.webp" alt={t('photoAlt')} className="w-full h-[min(60vw,460px)] object-cover" loading="lazy" />
      </figure>
    </PageShell>
  );
}
