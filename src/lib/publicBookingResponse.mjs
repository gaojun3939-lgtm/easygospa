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
