import { isPublicBookingCancelToken } from './activeBooking.mjs';

export const PUBLIC_BOOKING_CREATED_RECOVERY_CODE = 'BOOKING_CREATED_RECONCILE_PENDING';

function firstString(...values) {
  for (const value of values) {
    const normalized = String(value || '').trim();
    if (normalized) return normalized;
  }
  return '';
}

function finiteAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : null;
}

export function projectPublicBookingSuccess(payload = {}, reference = '') {
  const response = {
    ok: true,
    reference: firstString(reference, payload.reference),
    status: firstString(payload.status, payload.bookingRequest?.status),
    scheduledDate: firstString(payload.scheduledDate, payload.bookingRequest?.scheduledDate),
    scheduledTime: firstString(payload.scheduledTime, payload.bookingRequest?.scheduledTime),
    serviceName: firstString(payload.serviceName, payload.bookingRequest?.serviceName, payload.bookingRequest?.service),
    queued: payload.queued === true,
    queueMessage: firstString(payload.queueMessage)
  };

  const cancelToken = firstString(payload.cancelToken);
  if (isPublicBookingCancelToken(cancelToken)) response.cancelToken = cancelToken;

  if (typeof payload.couponApplied === 'boolean') response.couponApplied = payload.couponApplied;
  for (const key of ['grossServiceAmount', 'couponDiscount', 'cashToCollect']) {
    const amount = finiteAmount(payload[key]);
    if (amount !== null) response[key] = amount;
  }

  return Object.fromEntries(Object.entries(response).filter(([, value]) => value !== ''));
}

export function projectPublicBookingCreatedRecovery(payload = {}, reference = '') {
  const cancelToken = firstString(payload.cancelToken);
  return {
    ok: false,
    created: true,
    code: PUBLIC_BOOKING_CREATED_RECOVERY_CODE,
    error: 'Your booking was received, but its schedule needs assistance. Do not submit again; contact us on WhatsApp.',
    reference: firstString(reference, payload.reference),
    ...(isPublicBookingCancelToken(cancelToken) ? { cancelToken } : {})
  };
}

export function projectPublicBookingPreview(payload = {}) {
  const response = {
    ok: payload?.ok === true,
    preview: payload?.preview === true,
    couponApplied: payload?.couponApplied === true,
    customerIdentityVerified: payload?.customerIdentityVerified === true
  };
  for (const key of ['grossServiceAmount', 'couponDiscount', 'cashToCollect']) {
    const amount = finiteAmount(payload?.[key]);
    if (amount !== null) response[key] = amount;
  }
  return response;
}

export function projectPublicBookingError(payload = {}) {
  const source = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const code = firstString(source.code, 'AIOFFICE_BOOKING_REQUEST_FAILED');
  const response = {
    ok: false,
    code,
    error: firstString(source.error, 'Booking request could not be submitted.')
  };
  return response;
}
