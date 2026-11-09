import { getTranslations } from 'next-intl/server'
import { Facebook, Globe, Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import BrandMark from '@/components/BrandMark'
import { CONTACT_EMAIL, COMPANY_PHONE, FACEBOOK_URL, INSTAGRAM_URL, whatsappLink } from '@/lib/contactConfig'
import { APP_STORE_URL, isOnAppStore, isOnGooglePlay, playStoreUrl } from '@/lib/appStores.mjs'
import { niceName } from './serviceText'

// 页脚（2026-11-10 换回建站模版 serinity 的黑底四列：品牌 / 项目 / 联系 / 第四列）。
// 模版第四列是「订阅优惠」，我们不搞促销，换成「下载 App」+ 脸书。
// 公司名、注册号、地址、给客服的 WhatsApp 预填话不翻译（客服看英文）。
const COMPANY = 'EASYGOSPA HOME MASSAGE SERVICES OPC'
const SEC_NO = '2026060255013-01'
const ADDRESS = 'Unit 706, Medical Towers Makati, 103 Rufino Street, Legazpi Village, Bel-Air, Makati City, Metro Manila 1209'
const WHATSAPP_TEXT = 'Hi EasyGoSpa, I would like to ask about a home massage booking.'
const TREATMENTS = ['Deep tissue', 'Hot Stone Massage', 'Relaxing Premium Aromatherapy Body Massage', 'Shiatsu Massage(without Oil)', 'Swedish Massage', 'Thai Body Massage']

const linkCls = 'text-gray-300 hover:text-[#C9D4B4] transition-colors duration-300'
const iconCls = 'w-5 h-5 text-[#9DAE82] mt-0.5 flex-shrink-0'

export default async function Footer() {
  const t = await getTranslations('footer')
  const tn = await getTranslations('serviceNames')
  const tb = await getTranslations('referral.badges')
  const [onPlay, onApple] = await Promise.all([isOnGooglePlay(), isOnAppStore()])
  const social = [
    { href: INSTAGRAM_URL, label: 'Instagram', icon: Instagram },
    { href: FACEBOOK_URL, label: 'Facebook', icon: Facebook },
    { href: whatsappLink(WHATSAPP_TEXT), label: 'WhatsApp', icon: MessageCircle },
  ]
  const store = (live, href, name) => live
    ? <a href={href} target="_blank" rel="noopener" className="inline-flex items-center justify-center rounded-full bg-[#64734F] px-4 py-2 text-sm text-white hover:bg-[#7B8A63] transition-colors duration-300">{name}</a>
    : <span className="inline-flex items-center justify-center rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-400">{name} · {tb('comingSoon')}</span>

  return (
    <footer className="bg-[#0F0F0F] text-white relative overflow-hidden" role="contentinfo">
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F] via-[#1a1a1a] to-[#0F0F0F]" aria-hidden="true" />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3 mb-6">
              <BrandMark size={40} tone="light" />
              <div>
                <p className="font-serif text-2xl">EasyGo Spa</p>
                <p className="text-xs text-[#9DAE82] tracking-widest uppercase">{t('tagline')}</p>
              </div>
            </div>
            <p className="text-sm leading-[1.618] text-gray-300 mb-6">{t('about')}</p>
            <div className="flex gap-4">
              {social.map((item) => (
                <a key={item.label} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label} className="w-10 h-10 bg-[#64734F] rounded-full flex items-center justify-center hover:bg-[#7B8A63] transition-colors duration-300">
                  <item.icon className="w-5 h-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-serif text-lg mb-6 text-[#C9D4B4]">{t('popularTreatments')}</h2>
            <ul className="space-y-3 text-sm">
              {TREATMENTS.map((name) => <li key={name}><Link href="/pricing" className={linkCls}>{tn.has(name) ? tn(name) : niceName(name)}</Link></li>)}
              <li><Link href="/services" className={linkCls}>{t('homeHotel')}</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-lg mb-6 text-[#C9D4B4]">{t('contactTitle')}</h2>
            <address className="space-y-4 text-sm flex flex-col items-center md:items-start not-italic">
              <div className="flex items-start gap-3"><Globe className={iconCls} aria-hidden="true" /><a href="https://www.easygospa.com/" className={linkCls}>www.easygospa.com</a></div>
              <div className="flex items-start gap-3"><MapPin className={iconCls} aria-hidden="true" /><span className="text-gray-300 leading-[1.618]">{t('serviceArea')}<br />{t('selectedAreas')}</span></div>
              <div className="flex items-start gap-3"><Phone className={iconCls} aria-hidden="true" /><a href={`tel:${COMPANY_PHONE.replace(/\s/g, '')}`} className={linkCls}>{t('phone', { phone: COMPANY_PHONE })}</a></div>
              <div className="flex items-start gap-3"><MessageCircle className={iconCls} aria-hidden="true" /><a href={whatsappLink(WHATSAPP_TEXT)} target="_blank" rel="noreferrer" className={linkCls}>{t('whatsapp', { phone: COMPANY_PHONE })}</a></div>
              <div className="flex items-start gap-3"><Mail className={iconCls} aria-hidden="true" /><a href={`mailto:${CONTACT_EMAIL}`} className={linkCls}>{CONTACT_EMAIL}</a></div>
            </address>
          </div>

          <div>
            <h2 className="font-serif text-lg mb-6 text-[#C9D4B4]">{t('getApp')}</h2>
            <p className="text-sm text-gray-300 mb-4 leading-[1.618]">{t('appText')}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
              {store(onPlay, playStoreUrl('utm_source=website&utm_medium=footer'), 'Google Play')}
              {store(onApple, APP_STORE_URL, 'App Store')}
            </div>
            <p className="text-sm text-gray-300 mb-3 leading-[1.618]">{t('updates')}</p>
            <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#64734F] px-4 py-2 text-sm text-[#C9D4B4] hover:bg-[#64734F] hover:text-white transition-colors duration-300">
              <Facebook className="w-4 h-4" aria-hidden="true" />
              {t('followFacebook')}
            </a>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center md:items-end gap-6 text-center md:text-left">
          <p className="text-sm text-gray-400 leading-relaxed">
            {t('rights', { company: COMPANY })}<br />
            {t('secReg', { number: SEC_NO })}<br />
            {ADDRESS}<br />
            {/* 2026-11-06 老板定(窗口 8 转):链到菲律宾本地站,普通链接,不加 nofollow */}
            {t('philippines')} <a href="https://easygospa.ph/" className="underline hover:text-[#C9D4B4]">easygospa.ph</a>
          </p>
          <nav aria-label={t('legalAria')} className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/sitemap" className="text-gray-400 hover:text-[#C9D4B4] transition-colors duration-300">{t('sitemap')}</Link>
            <Link href="/privacy-policy" className="text-gray-400 hover:text-[#C9D4B4] transition-colors duration-300">{t('privacy')}</Link>
            <Link href="/terms-of-service" className="text-gray-400 hover:text-[#C9D4B4] transition-colors duration-300">{t('terms')}</Link>
            <Link href="/terms-of-service#refunds" className="text-gray-400 hover:text-[#C9D4B4] transition-colors duration-300">{t('refund')}</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
