const ENDPOINTS = Object.freeze({
  bookingCatalog: {
    envName: 'AIOFFICE_BOOKING_CATALOG_API_URL',
    developmentUrl: 'https://staging.easygospa.com/api/public/booking-catalog'
  },
  bookingRequest: {
    envName: 'AIOFFICE_BOOKING_API_URL',
    developmentUrl: 'https://staging.easygospa.com/api/bookings/public-request'
  },
  // 「约稍后」查空档 / 按时间筛技师(2026-07-29)。跟券接口一个道理走 deriveFrom:
  // 后台本来就在同一个域名下,不必为它再让老板多填一个环境变量。
  bookingAvailability: {
    envName: 'AIOFFICE_BOOKING_AVAILABILITY_API_URL',
    developmentUrl: 'https://staging.easygospa.com/api/public/booking-availability',
    deriveFrom: { endpoint: 'bookingCatalog', path: '/api/public/booking-availability' }
  },
  bookingStatus: {
    envName: 'AIOFFICE_BOOKING_STATUS_API_URL',
    developmentUrl: 'https://staging.easygospa.com/api/public/booking-status'
  },
  bookingCancel: {
    envName: 'AIOFFICE_BOOKING_CANCEL_API_URL',
    developmentUrl: 'https://staging.easygospa.com/api/public/booking-cancel'
  },
  myBookings: {
    envName: 'AIOFFICE_MY_BOOKINGS_API_URL',
    developmentUrl: 'https://staging.easygospa.com/api/public/my-bookings'
  },
  bookingReview: {
    envName: 'AIOFFICE_BOOKING_REVIEW_API_URL',
    developmentUrl: 'https://staging.easygospa.com/api/public/booking-review'
  },
  myCoupons: {
    envName: 'AIOFFICE_MY_COUPONS_API_URL',
    developmentUrl: 'https://staging.easygospa.com/api/public/my-coupons'
  },
  // 新客活动券(2026-07-29):/welcome 落地页用手机号领 ₱150,24 小时有效、免登录
  // deriveFrom:自己那个环境变量没配时,从**已经配好的兄弟接口**同源推算出来。
  // 后台这些接口本来就在同一个域名下,没必要为每加一个接口就让老板再填一个变量
  // (少一次手工配置,少一次填错的机会)。
  promoClaim: {
    envName: 'AIOFFICE_PROMO_CLAIM_API_URL',
    developmentUrl: 'https://staging.easygospa.com/api/public/promo-claim',
    deriveFrom: { endpoint: 'bookingRequest', path: '/api/public/promo-claim' }
  }
});

function isProductionEnvironment(env) {
  return env.VERCEL_ENV === 'production' || env.NODE_ENV === 'production';
}

export function resolveAiOfficeApiUrl(endpoint, { env = process.env, warn = console.warn } = {}) {
  const config = ENDPOINTS[endpoint];
  if (!config) throw new Error(`Unknown AI Office API endpoint: ${endpoint}`);

  const configuredUrl = String(env[config.envName] || '').trim();
  if (configuredUrl) return { ok: true, url: configuredUrl };

  // 自己没配,但兄弟接口配了 —— 后台都在同一个域名下,同源换个路径就是。
  if (config.deriveFrom) {
    const sibling = ENDPOINTS[config.deriveFrom.endpoint];
    const siblingUrl = sibling ? String(env[sibling.envName] || '').trim() : '';
    if (siblingUrl) {
      try {
        return { ok: true, url: new URL(config.deriveFrom.path, siblingUrl).toString() };
      } catch {
        // 兄弟那个地址本身就不是合法网址,退回下面的报错,别硬拼
      }
    }
  }

  if (isProductionEnvironment(env)) {
    return {
      ok: false,
      status: 503,
      code: 'BACKEND_URL_NOT_CONFIGURED',
      error: 'Booking backend URL is not configured.'
    };
  }

  warn(`[EasyGoSpa] ${config.envName} is not configured; using staging in development.`);
  return { ok: true, url: config.developmentUrl };
}
