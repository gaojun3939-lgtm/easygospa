import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// 多语言（2026-11-09）：每种语言的文字在 src/messages/<语言>/，怎么读在 src/i18n/request.js
const withNextIntl = createNextIntlPlugin("./src/i18n/request.js");

// Cross-address permission (CORS) for the public booking APIs.
// The site is reachable on both easygospa.com and www.easygospa.com (SEO: both
// domains resolve). When a visitor stays on one domain while the API request is
// redirected to the other, the browser treats it as cross-origin and blocks the
// response unless these headers are present. Booking catalog/status/request are
// public, non-credentialed endpoints, so allowing any origin is safe here.
const CORS_HEADERS = [
  { key: "Access-Control-Allow-Origin", value: "*" },
  { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
  { key: "Access-Control-Allow-Headers", value: "Content-Type" },
  { key: "Access-Control-Expose-Headers", value: "Retry-After" },
  { key: "Access-Control-Max-Age", value: "86400" },
];

const nextConfig: NextConfig = {
  // 分享信息一律放在网页头部:聊天软件只看头部,不是每家都在 Next 默认名单里;苹果横幅同理。
  htmlLimitedBots: /.*/,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // 2026-10-26 老板定(重新申请 Xendit 前全站清模板残留):/team、/gallery(建站模板的假团队 / 假实体店相册)、
  // /attribution-check(内部中文调试页)下线,打开直接跳走。
  // 2026-11-10 老板「用模版做骨架、不要删减页面」:/gallery、/team 用我们自己的内容放回来,这两条跳转去掉;调试页照旧跳走。
  async redirects() {
    return [
      // 2026-11-03:不带 www 的地址整站跳 www,只留 /.well-known/ 直接返回(谷歌、苹果校验都不接受跳转)。
      // Vercel 域名层的跳转关掉之后这条才起作用,所以要先部署这条、再关域名层。
      {
        source: "/:path((?!\\.well-known/).*)",
        has: [{ type: "host", value: "easygospa.com" }],
        destination: "https://www.easygospa.com/:path",
        permanent: true,
      },
      { source: "/attribution-check", destination: "/", permanent: true },
      // 2026-11-03 老板「为什么推荐的是 404」:推荐链接不带码时回首页;带码的 /r/<码> 不受影响。
      { source: "/r", destination: "/", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
      {
        source: "/api/:path*",
        headers: CORS_HEADERS,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
