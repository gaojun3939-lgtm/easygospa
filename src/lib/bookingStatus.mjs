export const DEFAULT_PUBLIC_WHATSAPP = '+63 917 109 8079';

export const BOOKING_STATUS_STEPS = Object.freeze([
  { status: 'submitted', label: 'Booking received' },
  { status: 'confirmed', label: 'Confirmed, matching therapist' },
  { status: 'on_the_way', label: 'Therapist on the way' },
  { status: 'arrived', label: 'Therapist arrived' },
  { status: 'in_service', label: 'Service in progress' },
  { status: 'completed', label: 'Completed' }
]);

const allowedStatuses = new Set([
  ...BOOKING_STATUS_STEPS.map(step => step.status),
  'cancelled'
]);

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanNullableString(value) {
  const cleaned = cleanString(value);
  return cleaned || null;
}

function cleanNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function getBookingStatusStepIndex(status) {
  return BOOKING_STATUS_STEPS.findIndex(step => step.status === status);
}

export function normalizeBookingStatusPayload(payload = {}) {
  const reference = cleanString(payload.reference);
  const status = cleanString(payload.status);
  if (payload.ok !== true || !reference || !allowedStatuses.has(status)) return null;

  const therapistName = cleanString(payload.therapist?.name);
  const therapistAvatarUrl = cleanString(payload.therapist?.avatarUrl);
  const therapist = therapistName || therapistAvatarUrl
    ? { name: therapistName, avatarUrl: therapistAvatarUrl }
    : null;

  const fallbackStatusLabel = status === 'cancelled'
    ? 'Cancelled'
    : BOOKING_STATUS_STEPS[getBookingStatusStepIndex(status)]?.label || '';

  return {
    ok: true,
    reference,
    status,
    statusLabel: cleanString(payload.statusLabel) || fallbackStatusLabel,
    placedAt: cleanNullableString(payload.placedAt),
    scheduledAt: cleanNullableString(payload.scheduledAt),
    serviceName: cleanString(payload.serviceName),
    durationMinutes: cleanNullableNumber(payload.durationMinutes),
    areaName: cleanString(payload.areaName),
    therapist,
    etaMinutes: cleanNullableNumber(payload.etaMinutes),
    whatsapp: cleanString(payload.whatsapp),
    updatedAt: cleanNullableString(payload.updatedAt)
  };
}

export function formatManilaBookingDateTime(value) {
  if (!value) return 'Schedule pending';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Schedule pending';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export function buildBookingWhatsAppUrl(whatsapp, reference) {
  const digits = (cleanString(whatsapp) || DEFAULT_PUBLIC_WHATSAPP).replace(/\D/g, '');
  const message = `Hi, I'd like to check my booking ${cleanString(reference)}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
