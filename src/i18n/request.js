import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
import { NAMESPACES } from './namespaces';

async function load(locale) {
  const parts = await Promise.all(NAMESPACES.map(async (name) => {
    try {
      return [name, (await import(`../messages/${locale}/${name}.json`)).default];
    } catch {
      return [name, {}];
    }
  }));
  return Object.fromEntries(parts);
}

// 某种语言漏翻的句子先用英文顶上，页面不会出现一串代号
function mergeDeep(base, over) {
  if (!over || typeof over !== 'object') return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(over)) {
    out[key] = value && typeof value === 'object' && !Array.isArray(value) && base?.[key] && typeof base[key] === 'object'
      ? mergeDeep(base[key], value)
      : value;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const english = await load('en');
  const messages = locale === 'en' ? english : mergeDeep(english, await load(locale));
  return {
    locale,
    messages,
    timeZone: 'Asia/Manila',
    onError(error) {
      if (process.env.NODE_ENV !== 'production') console.error('[文字缺失]', error.message);
    },
    getMessageFallback({ namespace, key }) {
      return process.env.NODE_ENV !== 'production' ? `【缺：${namespace}.${key}】` : '';
    },
  };
});
