import assert from 'node:assert/strict';
import { normalizeWebsiteBookingRequest } from '../src/lib/bookingRequestPayload.mjs';

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test('maps therapist-first website booking fields to AI Office public booking payload', () => {
  const payload = normalizeWebsiteBookingRequest({
    customerName: 'Website API Smoke',
    customerEmail: 'guest@example.com',
    phone: '+639000001234',
    requestedTechnicianId: 'therapist-bgc-deep-tissue',
    requestedTechnicianName: 'BGC Deep Tissue Therapist',
    therapistPreference: 'female_preferred',
    selectedTherapistSpecialties: ['Deep Tissue Massage', 'Swedish Massage'],
    selectedServices: [{ serviceName: 'Deep Tissue Massage', durationMinutes: 90, price: 4200 }],
    service: 'Deep Tissue Massage',
    durationMinutes: 90,
    totalAmount: 4200,
    preferredDate: '2026-07-02',
    preferredTime: '8:00 PM',
    area: 'BGC',
    addressNote: 'Test Condo',
    notes: 'Please confirm by WhatsApp.'
  });

  assert.equal(payload.source, 'website');
  assert.equal(payload.tenantId, 'brand-a');
  assert.equal(payload.customerName, 'Website API Smoke');
  assert.equal(payload.customerEmail, 'guest@example.com');
  assert.equal(payload.email, 'guest@example.com');
  assert.equal(payload.phone, '+639000001234');
  assert.equal(payload.requestedTechnicianId, 'therapist-bgc-deep-tissue');
  assert.equal(payload.requestedTechnicianName, 'BGC Deep Tissue Therapist');
  assert.equal(payload.service, 'Deep Tissue Massage');
  assert.equal(payload.selectedServices[0].durationMinutes, 90);
  assert.equal(payload.durationMinutes, 90);
  assert.equal(payload.serviceDurationMinutes, 90);
  assert.equal(payload.totalAmount, 4200);
  assert.equal(payload.quotedPrice, 4200);
  assert.equal(payload.preferredDate, '2026-07-02');
  assert.equal(payload.scheduledDate, '2026-07-02');
  assert.equal(payload.preferredTime, '8:00 PM');
  assert.equal(payload.scheduledTime, '20:00');
  assert.equal(payload.area, 'BGC');
  assert.equal(payload.addressNote, 'Test Condo');
  assert.equal(payload.peopleCount, 1);
  assert.equal(payload.paymentMethod, 'cash_after_service');
  assert.equal(payload.paymentStatus, 'pending_collection');
  assert.equal(payload.paymentTiming, 'after_service');
  assert.equal(payload.therapistGenderPreference, 'female');
  assert.equal(payload.metadata.website, 'www.easygospa.com');
  assert.equal(payload.metadata.form, 'BookingModal');
  assert.equal(payload.metadata.submittedFrom, 'public_website');
  assert.equal(payload.metadata.bookingFlow, 'therapist_wall_detail_service_cash');
  assert.equal(payload.metadata.customerEmail, 'guest@example.com');
  assert.equal(payload.metadata.paymentMethod, 'cash_after_service');
  assert.equal(payload.selectedServices[0].currency, 'PHP');
  assert.match(payload.notes, /Payment: Cash after service/);
});

test('rejects missing required website booking fields before proxying', () => {
  assert.throws(
    () => normalizeWebsiteBookingRequest({ customerName: 'Guest' }),
    /customerEmail is required|phone is required/
  );
});

test('forces cash after service without paid confirmation or external send', () => {
  const payload = normalizeWebsiteBookingRequest({
    customerName: 'Guest',
    customerEmail: 'guest@example.com',
    phone: '+639000009999',
    service: 'Swedish Massage',
    durationMinutes: 60,
    totalAmount: 2500,
    preferredDate: '2026-07-03',
    preferredTime: '9:30 PM',
    area: 'Makati',
    addressNote: 'Hotel lobby',
    paymentMethod: 'payment_link'
  });

  assert.equal(payload.paymentMethod, 'cash_after_service');
  assert.equal(payload.paymentStatus, 'pending_collection');
  assert.equal(payload.paymentTiming, 'after_service');
  assert.equal(payload.metadata.paymentMethod, 'cash_after_service');
  assert.equal(payload.metadata.autoPaid, false);
  assert.equal(payload.metadata.financeWrite, false);
  assert.equal(payload.metadata.externalSend, false);
});

test('does not forward string customer coordinates as trusted numeric coordinates', () => {
  const payload = normalizeWebsiteBookingRequest({
    customerName: 'String Coordinate Guest',
    customerEmail: 'string-coordinates@example.com',
    phone: '+639171234567',
    service: 'Swedish Massage',
    durationMinutes: 60,
    totalAmount: 2500,
    preferredDate: '2026-07-21',
    preferredTime: '20:00',
    area: 'Makati',
    addressNote: 'Test Condo',
    requestedTechnicianId: 'therapist-test',
    requestedTechnicianProfileId: 'therapist-test',
    customerLocation: { latitude: '14.5547', longitude: '121.0244' }
  });

  assert.equal(Object.hasOwn(payload, 'customerLocation'), false, 'string coordinates must not enter the forwarded payload');
});
