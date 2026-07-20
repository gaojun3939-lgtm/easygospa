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
