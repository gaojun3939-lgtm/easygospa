import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Clock, Facebook, Instagram, Mail, MapPin, MessageCircle } from 'lucide-react';
import PageShell from '@/components/site/PageShell';
import ContactForm from '@/components/site/ContactForm';
import { CONTACT_EMAIL, COMPANY_PHONE, FACEBOOK_URL, INSTAGRAM_URL } from '@/lib/contactConfig';
import { alternatesFor } from '@/i18n/routing';

// 联系页（建站模版 serinity 的样子：左边四张信息卡 + 关注我们，右边留言表单）
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.contact' });
  return { title: t('title'), alternates: alternatesFor(locale, '/contact') };
}

function InfoCard({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg flex items-start gap-4">
      <div className="w-12 h-12 bg-[#64734F]/10 rounded-full flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-[#64734F]" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <h3 className="font-serif text-xl text-[#0F0F0F] mb-2">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export default async function Contact({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'contact' });
  const strong = 'block text-gray-800 font-medium break-words';
  const note = 'text-sm text-gray-500 mt-1 leading-relaxed';
  return (
    <PageShell pill={t('eyebrow')} title={t('title')} lead={t('lead')} image="/global/photos/place-condo.webp">
      <div className="grid lg:grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)] animate-fadeInUp">
        <div className="space-y-6">
          <InfoCard icon={MapPin} title={t('area.title')}>
            <b className={strong}>{t('area.value')}</b>
            <p className={note}>{t('area.note')}</p>
          </InfoCard>
          <InfoCard icon={MessageCircle} title={t('whatsapp.title')}>
            <a href={`tel:${COMPANY_PHONE.replace(/\s/g, '')}`} className={`${strong} hover:text-[#55633F]`}>{COMPANY_PHONE}</a>
            <p className={note}>{t('whatsapp.note')}</p>
          </InfoCard>
          <InfoCard icon={Mail} title={t('email.title')}>
            <a href={`mailto:${CONTACT_EMAIL}`} className={`${strong} hover:text-[#55633F]`}>{CONTACT_EMAIL}</a>
            <p className={note}>{t('email.note')}</p>
          </InfoCard>
          <InfoCard icon={Clock} title={t('hours.title')}>
            <b className={strong}>{t('hours.value')}</b>
            <p className={note}>{t('hours.note')}</p>
          </InfoCard>
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h3 className="font-serif text-xl text-[#0F0F0F] mb-4">{t('follow.title')}</h3>
            <div className="flex gap-4">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label={t('follow.instagram')} className="w-12 h-12 bg-[#64734F] rounded-full flex items-center justify-center text-white hover:bg-[#55633F] transition-colors duration-300"><Instagram className="w-6 h-6" /></a>
              <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" aria-label={t('follow.facebook')} className="w-12 h-12 bg-[#64734F] rounded-full flex items-center justify-center text-white hover:bg-[#55633F] transition-colors duration-300"><Facebook className="w-6 h-6" /></a>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-lg self-start">
          <ContactForm />
        </div>
      </div>
    </PageShell>
  );
}
