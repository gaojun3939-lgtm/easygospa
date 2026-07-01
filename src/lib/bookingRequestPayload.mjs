const PAYMENT_METHODS = new Set([
  'cash_after_service',
  'gcash',
  'maya',
  'qrph',
  'bank_transfer',
  'card',
  'payment_link'
]);

const THERAPIST_PREFERENCES = new Set(['any_available', 'female_preferred', 'male_preferred']);

export class BookingRequestValidationError extends Error {
  constructor(message, code = 'INVALID_BOOKING_REQUEST') {
    super(message);
    this.name = 'BookingRequestValidationError';
    this.code = code;
  }
}

function cleanText(value = '', maxLength = 500) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function requiredText(value, field) {
  const text = cleanText(value);
  if (!text) throw new BookingRequestValidationError(`${field} is required`, `${field.toUpperCase()}_REQUIRED`);
  return text;
}

function normalizePeopleCount(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.round(parsed));
}

function normalizeTherapistGenderPreference(value) {
  const preference = THERAPIST_PREFERENCES.has(value) ? value : 'any_available';
  if (preference === 'female_preferred') return 'female';
  if (preference === 'male_preferred') return 'male';
  return '';
}

function normalizePaymentMethod(value) {
  const method = cleanText(value, 40);
  return PAYMENT_METHODS.has(method) ? method : 'cash_after_service';
}

function toScheduledTime(value) {
  const text = cleanText(value, 40);
  const match12 = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (match12) {
    let hour = Number(match12[1]);
    const minute = match12[2] || '00';
    const meridiem = match12[3].toLowerCase();
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${minute}`;
  }
  const match24 = text.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) return `${String(Number(match24[1])).padStart(2, '0')}:${match24[2]}`;
  return '20:00';
}

export function normalizeWebsiteBookingRequest(input = {}) {
  const customerName = requiredText(input.customerName || input.client_name || input.name, 'customerName');
  const phone = requiredText(input.phone || input.whatsapp, 'phone');
  const service = requiredText(input.service || input.serviceName, 'service');
  const preferredDate = requiredText(input.preferredDate || input.preferred_date || input.scheduledDate, 'preferredDate');
  const preferredTime = requiredText(input.preferredTime || input.preferred_time || input.scheduledTime, 'preferredTime');
  const area = requiredText(input.area, 'area');
  const addressNote = requiredText(input.addressNote || input.building || input.condo || input.hotel, 'addressNote');
  const peopleCount = normalizePeopleCount(input.peopleCount);
  const therapistPreference = THERAPIST_PREFERENCES.has(input.therapistPreference) ? input.therapistPreference : 'any_available';
  const therapistGenderPreference = normalizeTherapistGenderPreference(therapistPreference);
  const paymentMethod = normalizePaymentMethod(input.paymentMethod);
  const notes = cleanText(input.notes || input.message || input.customerNote, 500);
  const serviceDurationMinutes = Math.max(30, Math.round(Number(input.serviceDurationMinutes || input.durationMinutes || 90)));
  const quotedPrice = Math.max(0, Number(input.quotedPrice || input.servicePrice || input.price || 0));

  const metadata = {
    website: 'www.easygospa.com',
    form: 'BookingModal',
    submittedFrom: 'public_website',
    paymentMethod,
    therapistPreference,
    preferredDate,
    source: 'website',
    autoPaid: false,
    financeWrite: false,
    externalSend: false,
    autoDispatch: false
  };

  const noteParts = [];
  if (notes) noteParts.push(notes);
  noteParts.push(`Payment method: ${paymentMethod}`);
  noteParts.push(`Therapist preference: ${therapistPreference}`);
  noteParts.push(`Preferred date: ${preferredDate}`);

  return {
    tenantId: cleanText(input.tenantId || 'brand-a', 80),
    source: 'web',
    customerName,
    phone,
    email: cleanText(input.email, 120),
    service,
    serviceName: service,
    serviceDurationMinutes,
    preferredDate,
    preferredTime,
    scheduledDate: preferredDate,
    scheduledTime: toScheduledTime(preferredTime),
    area,
    addressNote,
    peopleCount,
    therapistPreference,
    therapistGenderPreference,
    paymentMethod,
    notes: noteParts.join(' | '),
    quotedPrice,
    currency: 'PHP',
    metadata
  };
}
