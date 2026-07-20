function firstString(...values) {
  for (const value of values) {
    const normalized = String(value || '').trim();
    if (normalized) return normalized;
  }
  return '';
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

  return Object.fromEntries(Object.entries(response).filter(([, value]) => value !== ''));
}

export function projectPublicBookingError(payload = {}) {
  const source = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const code = firstString(source.code, 'AIOFFICE_BOOKING_REQUEST_FAILED');
  const response = {
    ok: false,
    code,
    error: firstString(source.error, 'Booking request could not be submitted.')
  };
  const activeReference = firstString(source.activeReference);
  if (code === 'ACTIVE_BOOKING_EXISTS' && /^mbr-brand-a-[a-z0-9]+$/i.test(activeReference)) {
    response.activeReference = activeReference;
  }
  return response;
}
