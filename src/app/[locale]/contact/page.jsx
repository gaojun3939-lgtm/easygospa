import { getTranslations, setRequestLocale } from 'next-intl/server';
import ContactPage from '@/components/global/ContactPage';
import { alternatesFor } from '@/i18n/routing';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.contact' });
  return { title: t('title'), alternates: alternatesFor(locale, '/contact') };
}

export default async function Contact({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContactPage />;
}
