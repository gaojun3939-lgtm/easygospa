import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeWebsiteBookingRequest } from '../src/lib/bookingRequestPayload.mjs';
import {
  BOOKING_FLOW_STORAGE_KEY,
  getDefaultBookingSession,
  isValidEmail,
  websiteBookingServices,
  websiteTherapists
} from '../src/lib/therapistServiceBookingFlow.mjs';

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

const modalSource = fs.readFileSync('src/components/BookingModal.jsx', 'utf8');
const payloadSource = fs.readFileSync('src/lib/bookingRequestPayload.mjs', 'utf8');

test('email account gate validates email and supplies customerEmail', () => {
  assert.equal(BOOKING_FLOW_STORAGE_KEY, 'easygospa_booking_email_session');
  assert.equal(isValidEmail('guest@example.com'), true);
  assert.equal(isValidEmail('not-an-email'), false);
  const session = getDefaultBookingSession({ email: 'guest@example.com', name: 'Guest', phone: '+639000001234' });
  assert.equal(session.customerEmail, 'guest@example.com');
  assert.equal(session.customerName, 'Guest');
  assert.equal(session.phone, '+639000001234');
  assert.ok(modalSource.includes('Continue with email'));
  assert.ok(!modalSource.includes('verified email'));
  const emailInputIndex = modalSource.indexOf('data-testid="booking-email"');
  const loginHintIndex = modalSource.indexOf('Use this email to log in and track your booking anytime after you order.');
  const optionalNameIndex = modalSource.indexOf('Name optional');
  assert.ok(emailInputIndex >= 0 && loginHintIndex > emailInputIndex && optionalNameIndex > loginHintIndex, 'login tracking hint must sit directly after the booking email input');
});

test('therapist cards support a concrete therapist and any available without fake reviews or GPS distance', () => {
  assert.ok(websiteTherapists.some(therapist => therapist.id === 'any_available'));
  const concreteTherapist = websiteTherapists.find(therapist => therapist.id !== 'any_available');
  assert.ok(concreteTherapist, 'must include at least one selectable therapist');
  assert.ok(concreteTherapist.name);
  assert.ok(Array.isArray(concreteTherapist.specialties) && concreteTherapist.specialties.length > 0);
  assert.ok(concreteTherapist.specialtyDescription);
  assert.ok(concreteTherapist.distanceLabel.includes('Serving') || concreteTherapist.distanceLabel.includes('Nearby'));
  assert.equal(concreteTherapist.reviewCount, 0);
  assert.equal(concreteTherapist.rating, null);
  assert.equal(concreteTherapist.reviewsLabel, 'No verified reviews yet');
  assert.ok(!/\d+\.\d\s*km/i.test(concreteTherapist.distanceLabel));
});

test('service selection exposes duration choices and calculates total amount', () => {
  const deepTissue = websiteBookingServices.find(service => service.name === 'Deep Tissue Massage');
  assert.ok(deepTissue);
  assert.ok(deepTissue.durationOptions.some(option => option.durationMinutes === 90 && option.price === 4200));
  const option = deepTissue.durationOptions.find(item => item.durationMinutes === 90);
  assert.equal(option.price, 4200);
});

test('payload contains therapist-first cash booking fields', () => {
  const payload = normalizeWebsiteBookingRequest({
    customerName: 'Booking Flow Guest',
    customerEmail: 'guest@example.com',
    phone: '+639000001234',
    requestedTechnicianId: 'therapist-bgc-deep-tissue',
    requestedTechnicianName: 'BGC Deep Tissue Therapist',
    therapistPreference: 'female_preferred',
    selectedTherapistSpecialties: ['Deep Tissue', 'Swedish Massage'],
    selectedServices: [{ serviceName: 'Deep Tissue Massage', durationMinutes: 90, price: 4200 }],
    service: 'Deep Tissue Massage',
    durationMinutes: 90,
    totalAmount: 4200,
    preferredDate: '2026-07-05',
    preferredTime: '20:30',
    area: 'BGC',
    addressNote: 'Unit, floor, building',
    notes: 'Quiet room please'
  });

  assert.equal(payload.customerEmail, 'guest@example.com');
  assert.equal(payload.email, 'guest@example.com');
  assert.equal(payload.requestedTechnicianId, 'therapist-bgc-deep-tissue');
  assert.equal(payload.requestedTechnicianName, 'BGC Deep Tissue Therapist');
  assert.equal(payload.durationMinutes, 90);
  assert.equal(payload.serviceDurationMinutes, 90);
  assert.equal(payload.totalAmount, 4200);
  assert.equal(payload.quotedPrice, 4200);
  assert.equal(payload.paymentMethod, 'cash_after_service');
  assert.equal(payload.paymentStatus, 'pending_collection');
  assert.equal(payload.paymentTiming, 'after_service');
  assert.equal(payload.metadata.bookingFlow, 'therapist_wall_detail_service_cash');
  assert.equal(payload.metadata.customerEmail, 'guest@example.com');
  assert.equal(payload.metadata.requestedTechnicianId, 'therapist-bgc-deep-tissue');
  assert.equal(payload.metadata.totalAmount, 4200);
  assert.equal(payload.metadata.paymentStatus, 'pending_collection');
  assert.equal(payload.metadata.paymentTiming, 'after_service');
  assert.equal(payload.selectedServices[0].currency, 'PHP');
});

test('payment UI and payload are cash-only and avoid external sends', () => {
  assert.ok(modalSource.includes('Cash before service'));
  for (const forbidden of ['GCash', 'Maya', 'QR PH', 'Bank transfer', 'Payment link']) {
    assert.ok(!modalSource.includes(forbidden), `modal must not show ${forbidden}`);
  }
  assert.ok(!modalSource.includes('>Card<') && !modalSource.includes('Card option'), 'modal must not show Card as a payment option');
  for (const forbidden of ['gcash', 'maya', 'qrph', 'bank_transfer', 'card', 'payment_link']) {
    assert.ok(!payloadSource.includes(`'${forbidden}'`), `payload must not accept ${forbidden}`);
  }
  for (const forbidden of ['sendWhatsApp', 'sendMessage', 'graph.facebook.com', 'openai', 'gemini']) {
    assert.ok(!modalSource.includes(forbidden), `modal must not call ${forbidden}`);
    assert.ok(!payloadSource.includes(forbidden), `payload must not call ${forbidden}`);
  }
});

test('successful proxy response stores the active reference and redirects to tracking', () => {
  assert.ok(modalSource.includes("fetch(apiUrl('/api/booking-request')"));
  assert.ok(modalSource.includes("payload?.ok !== true"));
  assert.ok(modalSource.includes('writeActiveBooking(reference, { cancelToken: payload.cancelToken })'));
  assert.ok(modalSource.includes("router.push(`/track/${encodeURIComponent(reference)}`)"));
  assert.ok(!modalSource.includes("setStep('success')"));
  assert.ok(!modalSource.includes('window.location.href = \'https://staging.easygospa.com'));
});
