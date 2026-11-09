import { defineRouting } from 'next-intl/routing';

// 全球站的语言（老板 2026-11-09「全球站 之前你不是说有语言切换的么」）：跟 App 一样七种。
// 英文是默认，网址不带前缀（原来的网址一个都不变）；其它语言网址前面加 /zh-hans、/ja 这样的一段。
// 不按浏览器语言自动跳（谷歌不建议），客人自己在菜单里换。
export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN', hreflang: 'en', intl: 'en-PH', og: 'en_PH' },
  { code: 'zh-Hans', label: '简体中文', short: '简', hreflang: 'zh-Hans', intl: 'zh-CN', og: 'zh_CN' },
  { code: 'zh-Hant', label: '繁體中文', short: '繁', hreflang: 'zh-Hant', intl: 'zh-TW', og: 'zh_TW' },
  { code: 'ja', label: '日本語', short: 'JA', hreflang: 'ja', intl: 'ja-JP', og: 'ja_JP' },
  { code: 'ko', label: '한국어', short: 'KO', hreflang: 'ko', intl: 'ko-KR', og: 'ko_KR' },
  { code: 'vi', label: 'Tiếng Việt', short: 'VI', hreflang: 'vi', intl: 'vi-VN', og: 'vi_VN' },
  // 泰文默认用佛历年份，日期要指定公历
  { code: 'th', label: 'ไทย', short: 'TH', hreflang: 'th', intl: 'th-TH-u-ca-gregory', og: 'th_TH' },
];

export const routing = defineRouting({
  locales: LANGUAGES.map((lang) => lang.code),
  defaultLocale: 'en',
  localePrefix: { mode: 'as-needed', prefixes: { 'zh-Hans': '/zh-hans', 'zh-Hant': '/zh-hant' } },
  localeDetection: false,
  // 不按浏览器语言自动跳，也就不用记语言的饼干
  localeCookie: false,
});

export const SITE = 'https://www.easygospa.com';

export function languageOf(locale) {
  return LANGUAGES.find((lang) => lang.code === locale) || LANGUAGES[0];
}

// 日期、数字用的地区写法
export function intlLocale(locale) {
  return languageOf(locale).intl;
}

// 某种语言下某一页的网址（不带域名）。path 用英文版的写法，例如 '/services'
export function localePath(locale, path = '/') {
  const prefix = locale === routing.defaultLocale ? '' : (routing.localePrefix.prefixes?.[locale] || `/${locale}`);
  if (path === '/' || path === '') return prefix || '/';
  return `${prefix}${path}`;
}

// 给每页的网页头：本页的正式网址 + 七种语言各自的网址（搜索引擎靠这个认出是同一页的不同语言）
export function alternatesFor(locale, path = '/') {
  const languages = Object.fromEntries(LANGUAGES.map((lang) => [lang.hreflang, `${SITE}${localePath(lang.code, path)}`]));
  languages['x-default'] = `${SITE}${localePath('en', path)}`;
  return { canonical: `${SITE}${localePath(locale, path)}`, languages };
}
