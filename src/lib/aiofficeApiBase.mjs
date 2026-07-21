const ENDPOINTS = Object.freeze({
  bookingCatalog: {
    envName: 'AIOFFICE_BOOKING_CATALOG_API_URL',
    developmentUrl: 'https://staging.easygospa.com/api/public/booking-catalog'
  },
  bookingRequest: {
    envName: 'AIOFFICE_BOOKING_API_URL',
    developmentUrl: 'https://staging.easygospa.com/api/bookings/public-request'
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
