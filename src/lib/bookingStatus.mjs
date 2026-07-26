export const DEFAULT_PUBLIC_WHATSAPP = '+63 964 857 0967';

export const BOOKING_STATUS_STEPS = Object.freeze([
  { status: 'submitted', label: 'Booking received' },
  { status: 'confirmed', label: 'Confirmed, matching therapist' },
  { status: 'waiting_acceptance', label: 'Waiting for confirmation' },
  { status: 'preparing', label: 'Your therapist is getting ready' },
  { status: 'on_the_way', label: 'Therapist on the way' },
  { status: 'arrived', label: 'Therapist arrived' },
  { status: 'in_service', label: 'Service in progress' },
  { status: 'completed', label: 'Completed' }
]);

export const WAITING_ACCEPTANCE_POLL_MS = 3000;
export const DEFAULT_BOOKING_POLL_MS = 25000;

const THERAPIST_CONFIRMED_STATUSES = new Set([
  'preparing',
  'on_the_way',
  'arrived',
  'in_service',
  'completed'
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

export function getBookingPollingIntervalMs(status) {
  return status === 'waiting_acceptance' ? WAITING_ACCEPTANCE_POLL_MS : DEFAULT_BOOKING_POLL_MS;
}

export function isTherapistConfirmationTransition(previousStatus, nextStatus) {
  return previousStatus === 'waiting_acceptance' && THERAPIST_CONFIRMED_STATUSES.has(nextStatus);
}

export function isTherapistArrivalTransition(previousStatus, nextStatus) {
  return Boolean(previousStatus) && previousStatus !== 'arrived' && nextStatus === 'arrived';
}

export function shouldShowBookingUpdatesBanner(status) {
  return ['waiting_acceptance', 'confirmed', 'on_the_way'].includes(cleanString(status));
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
    // 技师专线(双号分工):这层是白名单安检,漏了这行后端给的号码会被丢掉,
    // 客人点"联系技师"照样开到客服号(2026-07-26 实测)。只留纯数字。
    therapistLine: cleanString(payload.therapistLine).replace(/\D/g, ''),
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

export function buildBookingUpdatesWhatsAppUrl(reference) {
  const message = `Hi, my booking is ${cleanString(reference)}`;
  return `https://wa.me/639648570967?text=${encodeURIComponent(message)}`;
}
