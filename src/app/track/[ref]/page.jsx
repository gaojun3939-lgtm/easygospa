import BookingTrackingPage from '../../../components/BookingTrackingPage.jsx';

export const metadata = {
  title: 'Track My Booking',
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

export default async function TrackBookingPage({ params }) {
  const { ref } = await params;
  return <BookingTrackingPage reference={String(ref || '').trim()} />;
}
