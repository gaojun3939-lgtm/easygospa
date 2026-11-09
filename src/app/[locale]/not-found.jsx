import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import PageHead from '@/components/global/PageHead';

export default function NotFound() {
  const t = useTranslations('notFound');
  const tm = useTranslations('meta.notFound');
  return (
    <div className="ga ga-page">
      <title>{tm('title')}</title>
      <PageHead eyebrow="404" title={t('title')}>
        <Link className="ga-btn ga-btn-big" href="/">{t('back')}</Link>
      </PageHead>
    </div>
  );
}
