import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { CONTACT_EMAIL, COMPANY_PHONE, FACEBOOK_URL, INSTAGRAM_URL, whatsappLink } from '@/lib/contactConfig'
import { niceName } from './serviceText'
import { APP_STORE_URL, isOnAppStore, isOnGooglePlay, playStoreUrl } from '@/lib/appStores.mjs'

// 全球站页脚：旧页脚每一样都在，只换样子。公司全名、注册号、地址、退款入口是收款审核要看的，不能少。
// 公司名、注册号、地址、电话、邮箱不翻译；给公司 WhatsApp 的预填话保持英文（客服看英文）。
const COMPANY = 'EASYGOSPA HOME MASSAGE SERVICES OPC'
const SEC_NO = '2026060255013-01'
const ADDRESS = 'Unit 706, Medical Towers Makati, 103 Rufino Street, Legazpi Village, Bel-Air, Makati City, Metro Manila 1209'
// 给公司 WhatsApp 的预填话：客服看英文，所有语言都发这句英文
const WHATSAPP_TEXT = 'Hi EasyGoSpa, I would like to ask about a home massage booking.'
const TREATMENTS = ['Deep tissue', 'Hot Stone Massage', 'Relaxing Premium Aromatherapy Body Massage', 'Shiatsu Massage(without Oil)', 'Swedish Massage', 'Thai Body Massage']

export default async function SiteFooter() {
  const t = await getTranslations('footer')
  const tn = await getTranslations('serviceNames')
  const waText = WHATSAPP_TEXT
  const tb = await getTranslations('referral.badges')
  const [onPlay, onApple] = await Promise.all([isOnGooglePlay(), isOnAppStore()])
  return (
    <footer className="ga-footer" role="contentinfo">
      <div className="ga-wrap">
        <div className="ga-foot-cols">
          <div className="ga-foot-brand">
            <b>EasyGoSpa</b>
            <p>{t('about')}</p>
            <div className="ga-foot-social">
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Instagram</a>
              <a href={FACEBOOK_URL} target="_blank" rel="noreferrer">Facebook</a>
              <a href={whatsappLink(waText)} target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
            <p className="ga-foot-app">
              <b>{t('getApp')}</b>
              {onPlay ? <a href={playStoreUrl('utm_source=website&utm_medium=footer')} target="_blank" rel="noopener">Google Play</a> : <span>Google Play · {tb('comingSoon')}</span>}
              {onApple ? <a href={APP_STORE_URL} target="_blank" rel="noopener">App Store</a> : <span>App Store · {tb('comingSoon')}</span>}
            </p>
          </div>
          <div>
            <h2>{t('popularTreatments')}</h2>
            <ul>
              {TREATMENTS.map((name) => <li key={name}><Link href="/pricing">{tn.has(name) ? tn(name) : niceName(name)}</Link></li>)}
              <li><Link href="/services">{t('homeHotel')}</Link></li>
            </ul>
          </div>
          <div>
            <h2>{t('contactTitle')}</h2>
            <ul>
              <li><a href="https://www.easygospa.com/">{t('website', { url: 'https://www.easygospa.com/' })}</a></li>
              <li>{t('serviceArea')}</li>
              <li>{t('homeService')}</li>
              <li>{t('selectedAreas')}</li>
              <li><a href={`tel:${COMPANY_PHONE.replace(/\s/g, '')}`}>{t('phone', { phone: COMPANY_PHONE })}</a></li>
              <li><a href={whatsappLink(waText)} target="_blank" rel="noreferrer">{t('whatsapp', { phone: COMPANY_PHONE })}</a></li>
              <li><a href={`mailto:${CONTACT_EMAIL}`}>{t('email', { email: CONTACT_EMAIL })}</a></li>
            </ul>
          </div>
          <div>
            <h2>{t('offersTitle')}</h2>
            <ul><li>{t('offersText')}</li></ul>
            <a className="ga-foot-follow" href={FACEBOOK_URL} target="_blank" rel="noreferrer">{t('followFacebook')}</a>
          </div>
        </div>
        <div className="ga-foot-legal">
          <div>
            {t('rights', { company: COMPANY })}<br />
            {t('secReg', { number: SEC_NO })}<br />
            {ADDRESS}<br />
            {/* 2026-11-06 老板定(窗口 8 转):链到菲律宾本地站,普通链接,不加 nofollow */}
            {t('philippines')} <a href="https://easygospa.ph/">easygospa.ph</a>
          </div>
          <nav aria-label={t('legalAria')}>
            <Link href="/privacy-policy">{t('privacy')}</Link>
            <Link href="/terms-of-service">{t('terms')}</Link>
            <Link href="/terms-of-service#refunds">{t('refund')}</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
