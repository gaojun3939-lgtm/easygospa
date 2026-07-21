const PAYMENT_METHOD = 'cash_after_service';
const THERAPIST_PREFERENCES = new Set(['any_available', 'female_preferred', 'male_preferred', 'specific_therapist']);

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

function normalizePhone(value) {
  const phone = requiredText(value, 'phone');
  if (/[a-z]/i.test(phone) || !/^[+()\d\s.-]+$/.test(phone)) {
    throw new BookingRequestValidationError('phone must be a valid WhatsApp or phone number', 'PHONE_INVALID');
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    throw new BookingRequestValidationError('phone must be a valid WhatsApp or phone number', 'PHONE_INVALID');
  }
  return phone;
}

function normalizePeopleCount(value) {
  const parsed = Number(value ?? 1);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.round(parsed));
}

function normalizeTherapistGenderPreference(value) {
  const direct = cleanText(value, 40).toLowerCase();
  if (direct === 'female' || direct === 'male') return direct;
  const preference = THERAPIST_PREFERENCES.has(value) ? value : 'any_available';
  if (preference === 'female_preferred') return 'female';
  if (preference === 'male_preferred') return 'male';
  return '';
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

function normalizeSelectedServices(input = {}) {
  const selected = Array.isArray(input.selectedServices) ? input.selectedServices : [];
  if (selected.length) {
    return selected.map(service => ({
      serviceId: cleanText(service.serviceId || service.id || input.serviceId, 120),
      serviceName: requiredText(service.serviceName || service.name || input.service, 'service'),
      durationMinutes: Math.max(30, Math.round(Number(service.durationMinutes || input.durationMinutes || 60))),
      price: Math.max(0, Number(service.price || service.totalAmount || input.totalAmount || 0)),
      currency: cleanText(service.currency || input.currency || 'PHP', 8).toUpperCase()
    }));
  }
  return [{
    serviceId: cleanText(input.serviceId || input.service_id, 120),
    serviceName: requiredText(input.service || input.serviceName, 'service'),
    durationMinutes: Math.max(30, Math.round(Number(input.durationMinutes || input.serviceDurationMinutes || 60))),
    price: Math.max(0, Number(input.totalAmount || input.quotedPrice || input.servicePrice || input.price || 0)),
    currency: cleanText(input.currency || 'PHP', 8).toUpperCase()
  }];
}

function normalizeCustomerLocation(value) {
  if (!value || typeof value !== 'object') return null;
  const latitude = value.latitude ?? value.lat;
  const longitude = value.longitude ?? value.lng ?? value.lon;
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) return null;
  if (typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;
  const accuracyMeters = Math.max(0, Number(value.accuracyMeters ?? value.accuracy ?? 0) || 0);
  return { latitude, longitude, accuracyMeters };
}

export function normalizeWebsiteBookingRequest(input = {}) {
  const customerName = requiredText(input.customerName || input.client_name || input.name, 'customerName');
  const customerEmail = requiredText(input.customerEmail || input.email, 'customerEmail').toLowerCase();
  const phone = normalizePhone(input.phone || input.whatsapp);
  const selectedServices = normalizeSelectedServices(input);
  const primaryService = selectedServices[0];
  const serviceId = cleanText(primaryService.serviceId || input.serviceId || input.service_id, 120);
  const service = requiredText(primaryService.serviceName || input.service, 'service');
  const preferredDate = requiredText(input.preferredDate || input.preferred_date || input.scheduledDate, 'preferredDate');
  const preferredTime = requiredText(input.preferredTime || input.preferred_time || input.scheduledTime, 'preferredTime');
  const area = requiredText(input.area, 'area');
  const addressNote = requiredText(input.addressNote || input.addressText || input.building || input.condo || input.hotel, 'addressNote');
  const peopleCount = normalizePeopleCount(input.peopleCount || 1);
  const requestedTechnicianId = cleanText(input.requestedTechnicianId || 'any_available', 120);
  const requestedTechnicianName = cleanText(input.requestedTechnicianName || 'Any available therapist', 120);
  const requestedTechnicianProfileId = cleanText(input.requestedTechnicianProfileId || requestedTechnicianId, 120);
  const requestedTechnicianProfileName = cleanText(input.requestedTechnicianProfileName || requestedTechnicianName, 120);
  const requestedTechnicianAccountId = requestedTechnicianProfileId === 'any_available' ? '' : cleanText(input.requestedTechnicianAccountId, 120);
  const requestedTechnicianAccountName = requestedTechnicianProfileId === 'any_available' ? '' : cleanText(input.requestedTechnicianAccountName, 120);
  const therapistPreference = THERAPIST_PREFERENCES.has(input.therapistPreference) ? input.therapistPreference : 'any_available';
  const therapistGenderPreference = normalizeTherapistGenderPreference(input.therapistGenderPreference || therapistPreference);
  const selectedTherapistSpecialties = Array.isArray(input.selectedTherapistSpecialties)
    ? input.selectedTherapistSpecialties.map(item => cleanText(item, 80)).filter(Boolean)
    : [];
  const durationMinutes = Math.max(30, Math.round(Number(primaryService.durationMinutes || input.durationMinutes || 60)));
  const totalAmount = Math.max(0, Number(selectedServices.reduce((sum, item) => sum + Number(item.price || 0), 0) || input.totalAmount || 0));
  const notes = cleanText(input.notes || input.message || input.customerNote, 500);
  const paymentMethod = PAYMENT_METHOD;
  const paymentStatus = 'pending_collection';
  const paymentTiming = 'after_service';
  const inputMetadata = input.metadata && typeof input.metadata === 'object' ? input.metadata : {};
  const catalogSource = cleanText(inputMetadata.catalogSource || input.catalogSource, 80);
  const customerLocation = normalizeCustomerLocation(input.customerLocation || inputMetadata.customerLocation);
  const couponCandidate = cleanText(input.couponId, 160);
  const couponId = /^[a-z0-9][a-z0-9_-]*$/i.test(couponCandidate) ? couponCandidate : '';

  const metadata = {
    website: 'www.easygospa.com',
    form: 'BookingModal',
    submittedFrom: 'public_website',
    bookingFlow: 'therapist_wall_detail_service_cash',
    customerEmail,
    requestedTechnicianId,
    requestedTechnicianName,
    requestedTechnicianProfileId,
    requestedTechnicianProfileName,
    ...(requestedTechnicianAccountId ? { requestedTechnicianAccountId } : {}),
    ...(requestedTechnicianAccountName ? { requestedTechnicianAccountName } : {}),
    selectedTherapistSpecialties,
    selectedServices,
    serviceId,
    durationMinutes,
    totalAmount,
    paymentMethod,
    paymentStatus,
    paymentTiming,
    therapistPreference,
    preferredDate,
    ...(catalogSource ? { catalogSource } : {}),
    source: 'website',
    autoPaid: false,
    financeWrite: false,
    externalSend: false,
    autoDispatch: false
  };

  const noteParts = [];
  if (notes) noteParts.push(notes);
  noteParts.push(`Selected therapist: ${requestedTechnicianName}`);
  noteParts.push(`Payment: Cash before service`);
  noteParts.push(`Preferred date: ${preferredDate}`);

  return {
    tenantId: cleanText(input.tenantId || 'brand-a', 80),
    source: 'website',
    customerName,
    customerEmail,
    phone,
    email: customerEmail,
    requestedTechnicianId,
    requestedTechnicianName,
    requestedTechnicianProfileId,
    requestedTechnicianProfileName,
    requestedTechnicianAccountId,
    requestedTechnicianAccountName,
    therapistPreference,
    therapistGenderPreference,
    selectedTherapistSpecialties,
    selectedServices,
    serviceId,
    service,
    serviceName: service,
    durationMinutes,
    serviceDurationMinutes: durationMinutes,
    preferredDate,
    preferredTime,
    scheduledDate: preferredDate,
    scheduledTime: toScheduledTime(preferredTime),
    area,
    addressNote,
    ...(customerLocation ? { customerLocation } : {}),
    peopleCount,
    paymentMethod,
    paymentStatus,
    paymentTiming,
    notes: noteParts.join(' | '),
    totalAmount,
    quotedPrice: totalAmount,
    currency: 'PHP',
    ...(couponId ? { couponId } : {}),
    metadata
  };
}
