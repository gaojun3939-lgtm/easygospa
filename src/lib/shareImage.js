// 分享图：WhatsApp、脸书、推特等聊天软件里链接预览的那张图（11 号 Mia + App 手机 + 两个下载按钮）。
// 全站、服务页、推荐页都从这里拿，改图只改这里和 src/app/opengraph-image.jpg、twitter-image.jpg 两个文件。
//
// 2026-11-12 老板「这个分享的图呢 怎么没了？」：推荐链接在 WhatsApp 里只有标题和小字、没有图。
//   Vercel 访问记录：WhatsApp 的服务器（美国）抓页面后，只分段要了一部分图（206），预览就没图；脸书官方调试工具抓同一个链接图是好的。
//   所以：图从 155KB 压到约 80KB（普通 JPEG，不用渐进式），网址带版本号 ?v=…——WhatsApp 按网址记住抓过的结果，
//   换了图一定要把 SHARE_IMAGE_VERSION 加一，不然已经抓过的地方还用旧结果。
const SITE = "https://www.easygospa.com";
export const SHARE_IMAGE_VERSION = "2";

const ogUrl = `${SITE}/opengraph-image.jpg?v=${SHARE_IMAGE_VERSION}`;

export const OG_IMAGE = {
  url: ogUrl,
  secureUrl: ogUrl,
  type: "image/jpeg",
  width: 1200,
  height: 630,
  alt: "EasyGoSpa",
};

export const TWITTER_IMAGE = `${SITE}/twitter-image.jpg?v=${SHARE_IMAGE_VERSION}`;
