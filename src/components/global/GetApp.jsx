import QRCode from 'qrcode'
import { getTranslations } from 'next-intl/server'
import { Check } from 'lucide-react'
import { APP_STORE_URL, isOnAppStore, isOnGooglePlay, playStoreUrl } from '@/lib/appStores.mjs'
import { AppleLogo, PlayLogo } from './StoreLogos'

// 首页「下载 App」（老板 2026-11-10「为什么官网没有 app 下载的介绍呢？全球网」）。
// 哪家商店上架了就给能点的按钮，没上架的写「即将上架」、不能点；状态现查（src/lib/appStores.mjs）。
// 电脑上多一个二维码：扫了按手机系统跳对应商店（/app）。手机样机里是 App 的欢迎页（不放带价格的截图，免得价格过期）。
const SITE = 'https://www.easygospa.com'

function StoreBadge({ live, href, logo, small, smallSoon, big, soonLabel }) {
  const inner = (
    <>
      {logo}
      <span><small>{live ? small : smallSoon}</small><b>{big}</b></span>
    </>
  )
  return live
    ? <a className="ga-store" href={href} target="_blank" rel="noopener">{inner}</a>
    : <span className="ga-store is-soon" aria-disabled="true" title={soonLabel}>{inner}</span>
}

export default async function GetApp({ locale }) {
  const t = await getTranslations({ locale, namespace: 'home.app' })
  const tb = await getTranslations({ locale, namespace: 'referral.badges' })
  const [onPlay, onApple] = await Promise.all([isOnGooglePlay(), isOnAppStore()])
  const storeLine = onPlay && onApple ? t('storeBoth') : onPlay ? t('storePlay') : onApple ? t('storeApple') : t('storeNone')
  const scan = onPlay && onApple ? t('scanAny') : onPlay ? t('scanAndroid') : t('scanIphone')
  const qr = onPlay || onApple
    ? await QRCode.toString(`${SITE}/app?from=qr`, { type: 'svg', margin: 0, color: { dark: '#14120d', light: '#ffffff' } })
    : ''

  return (
    <section className="ga-app" id="app">
      <div className="ga-wrap ga-app-in">
        <div className="ga-app-text">
          <p className="ga-eyebrow">{t('eyebrow')}</p>
          <h2>{t('title')}</h2>
          <p className="ga-lead">{t('lead')}</p>
          <ul className="ga-app-points">
            {['pick', 'later', 'eta', 'chat'].map((key) => (
              <li key={key}><Check size={18} aria-hidden="true" />{t(`points.${key}`)}</li>
            ))}
          </ul>
          <p className="ga-app-store">{storeLine}</p>
          <div className="ga-app-badges">
            <StoreBadge live={onPlay} href={playStoreUrl()} logo={<PlayLogo />} small={tb('googlePlay.get')} smallSoon={tb('googlePlay.soon')} big="Google Play" soonLabel={tb('comingSoon')} />
            <StoreBadge live={onApple} href={APP_STORE_URL} logo={<AppleLogo />} small={tb('appStore.get')} smallSoon={tb('appStore.soon')} big="App Store" soonLabel={tb('comingSoon')} />
          </div>
          {qr ? (
            <div className="ga-app-qr">
              <span className="ga-app-qr-code" dangerouslySetInnerHTML={{ __html: qr }} />
              <span>{scan}</span>
            </div>
          ) : null}
        </div>
        <div className="ga-app-visual">
          <figure className="ga-phone"><img src="/global/app/app-welcome.webp" alt={t('phoneAlt')} loading="lazy" /></figure>
          <img className="ga-app-icon" src="/global/app/icon.webp" alt="" loading="lazy" />
        </div>
      </div>
    </section>
  )
}
