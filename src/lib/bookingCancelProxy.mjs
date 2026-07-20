function cleanText(value = '') {
  return String(value || '').trim();
}

export function projectBookingCancelUpstream({ httpStatus = 502, payload = null, reference = '', retryAfter = '' } = {}) {
  if (httpStatus === 404 || payload?.reason === 'not_found') {
    return { status: 404, body: { ok: false, reason: 'not_found' }, headers: {} };
  }
  if (httpStatus === 409 && payload?.code === 'CANCEL_NOT_ALLOWED') {
    return {
      status: 409,
      body: {
        ok: false,
        code: 'CANCEL_NOT_ALLOWED',
        error: cleanText(payload.error) || 'This booking can no longer be cancelled online. Please contact us on WhatsApp.'
      },
      headers: {}
    };
  }
  if (httpStatus === 429 || payload?.code === 'RATE_LIMITED') {
    const normalizedRetryAfter = cleanText(retryAfter);
    return {
      status: 429,
      body: { ok: false, code: 'RATE_LIMITED', error: 'Too many requests, please try again later.' },
      headers: normalizedRetryAfter ? { 'retry-after': normalizedRetryAfter } : {}
    };
  }
  if (httpStatus < 200 || httpStatus >= 300 || payload?.ok !== true) {
    return {
      status: 502,
      body: {
        ok: false,
        code: 'AIOFFICE_BOOKING_CANCEL_FAILED',
        error: 'Booking cancellation is temporarily unavailable. Please try again.'
      },
      headers: {}
    };
  }
  if (payload.reference !== reference || payload.status !== 'cancelled') {
    return {
      status: 502,
      body: {
        ok: false,
        code: 'AIOFFICE_BOOKING_CANCEL_INVALID_RESPONSE',
        error: 'Booking cancellation could not be confirmed. Please contact us on WhatsApp.'
      },
      headers: {}
    };
  }
  return { status: 200, body: { ok: true, reference, status: 'cancelled' }, headers: {} };
}
