import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// 网址里没有语言前缀的就是英文；/en/... 会跳回不带前缀的网址，免得同一页两个地址
export default createMiddleware(routing);

export const config = {
  // 接口、静态文件、两个验证文件（/.well-known）、/app（二维码跳商店）不经过这里
  matcher: ['/((?!api|app$|app/|_next|_vercel|\\.well-known|.*\\..*).*)'],
};
