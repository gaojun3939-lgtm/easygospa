import Link from 'next/link';
import PageHead from '../components/global/PageHead';

export const metadata = { title: 'Page not found | EasyGoSpa' };

export default function NotFound() {
  return (
    <div className="ga ga-page">
      <PageHead eyebrow="404" title="This page could not be found.">
        <Link className="ga-btn ga-btn-big" href="/">Back to home</Link>
      </PageHead>
    </div>
  );
}
