import { getTranslations, setRequestLocale } from 'next-intl/server';
import BookingTrackingPage from '@/components/BookingTrackingPage.jsx';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'track' });
  return {
    title: t('meta.title'),
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true
      }
    }
  };
}

export default async function TrackBookingPage({ params }) {
  const { locale, ref } = await params;
  setRequestLocale(locale);
  return <BookingTrackingPage reference={String(ref || '').trim()} />;
}
