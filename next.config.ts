import type { NextConfig } from "next";

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
  // 2026-10-26 老板定(重新申请 Xendit 前全站清模板残留):这三页下线,打开直接跳走。
  // /team、/gallery 是建站模板的假团队 / 假实体店相册;/attribution-check 是内部中文调试页。
  // 页面代码在 git 历史里(提交 519146c 及以前),要恢复从那里找。
  async redirects() {
    return [
      { source: "/team", destination: "/services", permanent: true },
      { source: "/gallery", destination: "/services", permanent: true },
      { source: "/attribution-check", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: CORS_HEADERS,
      },
    ];
  },
};

export default nextConfig;
