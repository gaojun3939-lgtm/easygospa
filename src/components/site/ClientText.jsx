import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { CLIENT_NAMESPACES } from '@/i18n/namespaces'

// 页面里的动效块是浏览器端组件，要用到只在这一页出现的文字（例如 home）时，用它把那几份文字也交给浏览器。
// 全站共用的几份（菜单、下单窗口等）照旧由 layout 交，这里一起带上，免得里层把外层盖掉。
/** @param {{ namespaces?: string[], children?: import('react').ReactNode }} props */
export default async function ClientText({ namespaces = [], children }) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()])
  const picked = Object.fromEntries([...CLIENT_NAMESPACES, ...namespaces].map((name) => [name, messages[name] || {}]))
  return (
    <NextIntlClientProvider locale={locale} messages={picked} timeZone="Asia/Manila">
      {children}
    </NextIntlClientProvider>
  )
}
