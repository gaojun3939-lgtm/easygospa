import { getTranslations, setRequestLocale } from 'next-intl/server';
import PageHead from '@/components/global/PageHead';
import { alternatesFor } from '@/i18n/routing';

// 地名是专有名词，各语言都写英文（跟地图上一致）
const AREAS = ['Makati', 'BGC', 'Taguig', 'Pasay', 'Manila', 'Quezon City', 'Pasig', 'Mandaluyong'];

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
    <div className="ga ga-page">
      <PageHead title={t('title')}>{t('lead')}</PageHead>
      <section className="ga-wrap ga-page-sec">
        <ul className="ga-coverage">{AREAS.map((area) => <li key={area}>{area}</li>)}</ul>
        <figure className="ga-coverage-pic"><img src="/global/photos/band-living.webp" alt={t('photoAlt')} loading="lazy" /></figure>
      </section>
    </div>
  );
}
