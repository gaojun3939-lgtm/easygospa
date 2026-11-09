export const DEFAULT_PUBLIC_WHATSAPP = '+63 964 857 0967';

// label 是接口回给客人的英文底稿(statusLabel 兜底用),页面上显示的字按状态代码去 track 文字文件里查。
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

// 状态代码 → 文字文件 track.json 里的键(页面用 useTranslations('track') 翻)。代码本身不变,接口照旧用英文代码比对。
const BOOKING_STATUS_MESSAGE_KEYS = Object.freeze({
  submitted: 'status.submitted',
  confirmed: 'status.confirmed',
  waiting_acceptance: 'status.waitingAcceptance',
  preparing: 'status.preparing',
  on_the_way: 'status.onTheWay',
  arrived: 'status.arrived',
  in_service: 'status.inService',
  completed: 'status.completed',
  cancelled: 'status.cancelled'
});

export function bookingStatusMessageKey(status) {
  const key = typeof status === 'string' ? status.trim() : '';
  return Object.prototype.hasOwnProperty.call(BOOKING_STATUS_MESSAGE_KEYS, key) ? BOOKING_STATUS_MESSAGE_KEYS[key] : null;
}

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
    // 'scheduled' = the customer picked this time on purpose; the page shows it back.
    scheduleMode: cleanString(payload.scheduleMode) === 'scheduled' ? 'scheduled' : 'asap',
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

// 没有时间或时间读不出来时回空字符串,页面自己显示翻好的「Schedule pending」。
// locale 传 intlLocale(当前语言);不传按英文。
export function formatManilaBookingDateTime(value, locale = 'en-US') {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
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
