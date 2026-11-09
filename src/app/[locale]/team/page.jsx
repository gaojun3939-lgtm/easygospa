import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Award } from 'lucide-react';
import PageShell from '@/components/site/PageShell';
import { niceName } from '@/components/site/serviceText';
import { alternatesFor } from '@/i18n/routing';

// 技师页（建站模版 serinity 的「Our Team」；2026-11-10 老板「不要删减页面」放回来）。
// 模版是四个编出来的员工（名字、照片、从业年数）——我们不编人：老板定过官网不放真人技师照片（11-03），
// 所以四张卡讲的是每位技师都一样的四件事（培训、实名、制服、评分），真人真照在下单窗口里自己挑。
const CARDS = [
  { key: 'trained', src: '/global/photos/svc-deep.webp', chips: ['Swedish Massage', 'Deep tissue', 'Thai Body Massage', 'Hot Stone Massage'] },
  { key: 'verified', src: '/global/photos/svc-swedish.webp', chips: ['id', 'photo', 'name'] },
  { key: 'uniform', src: '/global/photos/closing-corridor.webp', chips: ['uniform', 'door'] },
  { key: 'rated', src: '/global/photos/place-hotel.webp', chips: ['stars', 'profile'] },
];

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'team' });
  return { title: t('metaTitle'), description: t('metaDescription'), alternates: alternatesFor(locale, '/team') };
}

export default async function TeamPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'team' });
  const tn = await getTranslations({ locale, namespace: 'serviceNames' });
  const chip = (card, value) => (card.key === 'trained' ? (tn.has(value) ? tn(value) : niceName(value)) : t(`cards.${card.key}.chips.${value}`));
  return (
    <PageShell
      pill={t('pill')}
      title={t('title')}
      lead={t('lead')}
      image="/global/photos/svc-thai.webp"
      cta={{ title: t('ctaTitle'), text: t('ctaText'), button: t('ctaButton') }}
    >
      <div className="grid lg:grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)]">
        {CARDS.map((card) => (
          <div key={card.key} className="group animate-fadeInUp">
            <div className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 h-full">
              <div className="relative h-80 overflow-hidden">
                <img src={card.src} alt={t(`cards.${card.key}.alt`)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-4 right-4 bg-[#64734F] text-white rounded-full px-3 py-1 flex items-center gap-1">
                  <Award className="w-3 h-3" aria-hidden="true" />
                  <span className="text-xs font-medium">{t(`cards.${card.key}.badge`)}</span>
                </div>
              </div>
              <div className="p-8">
                <h2 className="font-serif text-2xl text-[#0F0F0F] mb-2 group-hover:text-[#55633F] transition-colors duration-300">{t(`cards.${card.key}.title`)}</h2>
                <p className="text-[#64734F] font-medium mb-4">{t(`cards.${card.key}.role`)}</p>
                <p className="text-gray-600 leading-[1.618] mb-5">{t(`cards.${card.key}.text`)}</p>
                <p className="text-sm font-medium text-[#0F0F0F] mb-3">{t('chipsTitle')}</p>
                <div className="flex flex-wrap gap-2">
                  {card.chips.map((value) => <span key={value} className="bg-[#64734F]/10 text-[#55633F] px-3 py-1 rounded-full text-xs font-medium">{chip(card, value)}</span>)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
