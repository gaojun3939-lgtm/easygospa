// 给搜索引擎看的页面清单（/sitemap.xml）。不带 www 的地址会跳转，这里只写 www 的。
// 不收录的页面（/track、/r、/welcome）不放。
// 不能用 Next 自带的 app/sitemap.js：跟给人看的目录页 /sitemap 冲突，打包会失败，所以单独写这个文件
const PAGES = ['', '/services', '/pricing', '/coverage', '/contact', '/sitemap', '/terms-of-service', '/privacy-policy']

export const dynamic = 'force-static'

export function GET() {
  const urls = PAGES.map((path) => `<url><loc>https://www.easygospa.com${path}</loc></url>`).join('')
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
