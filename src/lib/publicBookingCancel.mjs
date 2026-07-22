import { apiUrl } from './apiUrl.js';
import { isActiveBookingReference, isPublicBookingCancelToken } from './activeBooking.mjs';

function cleanText(value = '') {
  return String(value || '').trim();
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

const CANCEL_AUTH_REQUIRED_ERROR = 'For security, log in to view your booking or contact us on WhatsApp for help.';

export async function cancelPublicBooking({ reference = '', contact = '', cancelToken = '', fetchImpl = fetch } = {}) {
  const normalizedReference = cleanText(reference);
  const normalizedContact = cleanText(contact);
  const normalizedCancelToken = cleanText(cancelToken);
  if (!isActiveBookingReference(normalizedReference) || !normalizedContact) {
    return { ok: false, httpStatus: 400, code: 'INVALID_CANCELLATION', error: 'Enter the booking email or phone to continue.' };
  }
  if (!isPublicBookingCancelToken(normalizedCancelToken)) {
    return { ok: false, httpStatus: 401, code: 'CANCEL_AUTH_REQUIRED', error: CANCEL_AUTH_REQUIRED_ERROR };
  }

  try {
    const response = await fetchImpl(apiUrl('/api/booking-cancel'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reference: normalizedReference, contact: normalizedContact, cancelToken: normalizedCancelToken }),
      cache: 'no-store'
    });
    const payload = await readJson(response);
    if (response.ok && payload?.ok === true && payload.reference === normalizedReference && payload.status === 'cancelled') {
      return { ok: true, reference: normalizedReference, status: 'cancelled' };
    }
    if (response.status === 404 || payload?.reason === 'not_found') {
      return { ok: false, httpStatus: 404, reason: 'not_found' };
    }
    if ((response.status === 401 || response.status === 403) && payload?.code === 'CANCEL_AUTH_REQUIRED') {
      return { ok: false, httpStatus: response.status, code: 'CANCEL_AUTH_REQUIRED', error: CANCEL_AUTH_REQUIRED_ERROR };
    }
    if (response.status === 409 && payload?.code === 'CANCEL_NOT_ALLOWED') {
      return {
        ok: false,
        httpStatus: 409,
        code: 'CANCEL_NOT_ALLOWED',
        error: cleanText(payload.error) || 'This booking can no longer be cancelled online. Please contact us on WhatsApp.'
      };
    }
    if (response.status === 429 || payload?.code === 'RATE_LIMITED') {
      const retryAfterSeconds = Math.max(0, Number(response.headers.get('retry-after')) || 0);
      return {
        ok: false,
        httpStatus: 429,
        code: 'RATE_LIMITED',
        error: 'Too many requests, please try again later.',
        ...(retryAfterSeconds ? { retryAfterSeconds } : {})
      };
    }
    return {
      ok: false,
      httpStatus: response.status || 502,
      code: 'BOOKING_CANCEL_FAILED',
      error: 'Booking cancellation is temporarily unavailable. Please try again.'
    };
  } catch {
    return {
      ok: false,
      httpStatus: 0,
      code: 'BOOKING_CANCEL_UNAVAILABLE',
      error: 'Booking cancellation is temporarily unavailable. Please check your connection and try again.'
    };
  }
}
