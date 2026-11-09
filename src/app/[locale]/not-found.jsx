import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

// 找不到页面（模版没有这一页，用模版内页的样子：顶上深色条 + 大字 + 回首页按钮）
export default function NotFound() {
  const t = useTranslations('notFound');
  const tm = useTranslations('meta.notFound');
  return (
    <div className="pt-32 pb-24 bg-gradient-to-b from-[#F8F2EC] to-white min-h-[70vh] relative">
      <title>{tm('title')}</title>
      <span data-nav-over-dark hidden />
      <div style={{ backgroundImage: 'url(/global/photos/closing-corridor.webp)' }} className="w-full h-80 bg-center bg-cover -mt-[280px] mb-10" aria-hidden="true">
        <div className="w-full h-full bg-black/70" />
      </div>
      <div className="max-w-3xl mx-auto px-6 text-center">
        <p className="font-serif text-7xl text-[#64734F] mb-4"><span className="eg-n">404</span></p>
        <h1 className="font-serif text-3xl md:text-4xl text-[#0F0F0F] mb-8">{t('title')}</h1>
        <Link href="/" className="inline-block bg-[#64734F] text-white px-8 py-4 rounded-full font-medium hover:bg-[#55633F] transition-all duration-300 shadow-lg">{t('back')}</Link>
      </div>
    </div>
  );
}
