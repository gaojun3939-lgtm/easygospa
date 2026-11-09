import QRCode from 'qrcode'

// 首页「下载 App」横幅里给电脑用的二维码：扫了去 /app，按手机系统跳对应商店（src/app/app/route.js）
export function appQrSvg(site) {
  return QRCode.toString(`${site}/app?from=qr`, { type: 'svg', margin: 0, color: { dark: '#14120d', light: '#ffffff' } })
}
