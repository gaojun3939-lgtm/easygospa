import { LANGUAGES, SITE, localePath } from '@/i18n/routing'

// 给搜索引擎看的页面清单（/sitemap.xml）。不带 www 的地址会跳转，这里只写 www 的。
// 不收录的页面（/track、/r、/welcome）不放。
// 不能用 Next 自带的 app/sitemap.js：跟给人看的目录页 /sitemap 冲突，打包会失败，所以单独写这个文件
// 2026-11-09 起七种语言：每一页每种语言一条，并且互相标明「这是同一页的另一种语言」
const PAGES = ['/', '/services', '/pricing', '/coverage', '/contact', '/sitemap', '/terms-of-service', '/privacy-policy']

export const dynamic = 'force-static'

export function GET() {
  const urls = PAGES.flatMap((path) => {
    const links = LANGUAGES.map((lang) => `<xhtml:link rel="alternate" hreflang="${lang.hreflang}" href="${SITE}${localePath(lang.code, path)}"/>`).join('')
      + `<xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${localePath('en', path)}"/>`
    return LANGUAGES.map((lang) => `<url><loc>${SITE}${localePath(lang.code, path)}</loc>${links}</url>`)
  }).join('')
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
