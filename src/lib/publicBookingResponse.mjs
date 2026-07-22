import { isPublicBookingCancelToken } from './activeBooking.mjs';
import { ensurePublicRequestId } from './publicRequestId.mjs';

export const PUBLIC_BOOKING_CREATED_RECOVERY_CODE = 'BOOKING_CREATED_RECONCILE_PENDING';

const PUBLIC_BOOKING_ERROR_MESSAGES = Object.freeze({
  ACTIVE_BOOKING_EXISTS: 'A booking is already waiting for confirmation.',
  OUTSIDE_SERVICE_AREA: 'The selected location is outside our service area.',
  AREA_REQUIRED: 'Please select a service area.',
  SERVICE_REQUIRED: 'Please select a service.',
  PHONE_REQUIRED: 'Please enter a phone number.',
  CUSTOMER_NAME_REQUIRED: 'Please enter your name.',
  PREFERRED_TIME_REQUIRED: 'Please select a preferred time.',
  PEOPLE_COUNT_INVALID: 'Please enter a valid number of people.',
  THERAPIST_PREFERENCE_INVALID: 'Please select a valid therapist preference.',
  PUBLIC_BOOKING_CURRENCY_CONFLICT: 'The selected service currency is unavailable.',
  PUBLIC_BOOKING_OPTION_NOT_AVAILABLE: 'The selected booking option is unavailable.',
  PUBLIC_BOOKING_PRICE_INVALID: 'The selected service price could not be confirmed.',
  PUBLIC_BOOKING_SERVICE_NOT_AVAILABLE: 'The selected service is unavailable.',
  COUPON_PREVIEW_REQUIRED: 'Please confirm the updated coupon and cash total.',
  COUPON_PREVIEW_CHANGED: 'Your coupon or cash total changed. Please review it again.',
  RATE_LIMITED: 'Too many requests, please try again later.',
  RATE_LIMITER_UNAVAILABLE: 'Request protection is temporarily unavailable. Please try again.'
});

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
  const upstreamCode = firstString(source.code);
  const allowedMessage = PUBLIC_BOOKING_ERROR_MESSAGES[upstreamCode];
  const code = allowedMessage ? upstreamCode : 'AIOFFICE_BOOKING_REQUEST_FAILED';
  const response = {
    ok: false,
    code,
    error: allowedMessage || 'Booking request could not be submitted.',
    requestId: ensurePublicRequestId(source.requestId)
  };
  return response;
}
