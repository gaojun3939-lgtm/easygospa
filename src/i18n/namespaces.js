// 每种语言一套文字文件（src/messages/<语言>/<名字>.json）。加新文件要在这里登记。
// 客人浏览器里要用到的放 CLIENT；只在服务器上排好的页面（条款、隐私、首页文字等）放 SERVER_ONLY，不往浏览器里塞。
export const CLIENT_NAMESPACES = ['common', 'nav', 'services', 'contact', 'serviceNames', 'serviceInfo', 'booking', 'orders', 'review', 'track', 'welcome', 'referral'];
export const SERVER_ONLY_NAMESPACES = ['meta', 'footer', 'home', 'pricing', 'coverage', 'sitemapPage', 'notFound', 'terms', 'privacy', 'gallery', 'team', 'stores'];
export const NAMESPACES = [...CLIENT_NAMESPACES, ...SERVER_ONLY_NAMESPACES];
