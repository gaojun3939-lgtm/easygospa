const COUPON_STATUSES = new Set(['active', 'used', 'expired']);

function cleanText(value = '', maxLength = 500) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function cleanId(value = '') {
  const id = cleanText(value, 160);
  return /^[a-z0-9][a-z0-9_-]*$/i.test(id) ? id : '';
}

function cleanTimestamp(value) {
  const text = cleanText(value, 64);
  if (!text) return '';
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

function cleanAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : 0;
}

function cleanCouponStatus(value, expiresAt, nowMs = Date.now()) {
  const status = COUPON_STATUSES.has(String(value || '').toLowerCase())
    ? String(value).toLowerCase()
    : 'expired';
  const expiresMs = Date.parse(expiresAt);
  if (status === 'active' && Number.isFinite(expiresMs) && expiresMs <= nowMs) return 'expired';
  return status;
}

export function normalizeCouponWalletPayload(payload = {}, { nowMs = Date.now() } = {}) {
  const source = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const coupons = Array.isArray(source.coupons) ? source.coupons : [];
  return {
    ok: source.ok === true,
    coupons: coupons.map(coupon => {
      const expiresAt = cleanTimestamp(coupon?.expiresAt || coupon?.expires_at);
      return {
        id: cleanId(coupon?.id),
        amount: cleanAmount(coupon?.amount),
        status: cleanCouponStatus(coupon?.status, expiresAt, nowMs),
        expiresAt,
        createdAt: cleanTimestamp(coupon?.createdAt || coupon?.created_at),
        usedAt: cleanTimestamp(coupon?.usedAt || coupon?.used_at),
        usedBookingReference: cleanText(coupon?.usedBookingReference || coupon?.used_booking_reference, 120)
      };
    }).filter(coupon => coupon.id && coupon.amount > 0)
  };
}

export function projectPublicReviewResponse(payload = {}) {
  const source = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const reviewSource = source.review && typeof source.review === 'object' ? source.review : {};
  const couponSource = source.coupon && typeof source.coupon === 'object' ? source.coupon : {};
  const reviewId = cleanId(reviewSource.id);
  const couponId = cleanId(couponSource.id);
  const stars = Math.round(Number(reviewSource.stars ?? reviewSource.rating));
  const response = { ok: source.ok === true };

  if (reviewId && stars >= 1 && stars <= 5) {
    response.review = {
      id: reviewId,
      stars,
      text: cleanText(reviewSource.text || reviewSource.comment, 1000),
      createdAt: cleanTimestamp(reviewSource.createdAt || reviewSource.created_at)
    };
  }
  if (couponId) {
    response.coupon = {
      id: couponId,
      amount: cleanAmount(couponSource.amount),
      status: cleanCouponStatus(couponSource.status, cleanTimestamp(couponSource.expiresAt || couponSource.expires_at)),
      expiresAt: cleanTimestamp(couponSource.expiresAt || couponSource.expires_at)
    };
  }
  return response;
}

export function projectPublicReviewError(payload = {}) {
  const source = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const code = cleanText(source.code, 80) || 'REVIEW_SUBMISSION_FAILED';
  const safeMessages = {
    BOOKING_NOT_COMPLETED: 'This booking can be reviewed after it is completed.',
    BOOKING_NOT_FOUND: 'We could not verify that booking with this email.',
    BOOKING_CUSTOMER_MISMATCH: 'We could not verify that booking with this email.',
    BOOKING_REVIEW_NOT_FOUND: 'We could not verify that booking with this email.',
    BOOKING_REVIEW_EMAIL_MISMATCH: 'We could not verify that booking with this email.',
    BOOKING_REVIEW_STATUS_INVALID: 'This booking can be reviewed after it is completed.',
    BOOKING_REVIEW_ALREADY_SUBMITTED: 'This booking has already been reviewed.',
    BOOKING_REVIEW_CONFLICT: 'This booking has already been reviewed.',
    REVIEW_ALREADY_EXISTS: 'This booking has already been reviewed.',
    DUPLICATE_REVIEW: 'This booking has already been reviewed.'
  };
  return {
    ok: false,
    code,
    error: safeMessages[code] || 'Your review could not be submitted. Please try again.'
  };
}
