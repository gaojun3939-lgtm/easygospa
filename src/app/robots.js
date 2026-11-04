// 给搜索引擎看的规矩（/robots.txt）。/track、/r、/welcome 页面自己写了不收录，这里不能拦，拦了搜索引擎看不到那句话；
// /r 还要让脸书抓分享预览。只拦接口
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: 'https://www.easygospa.com/sitemap.xml',
  }
}
