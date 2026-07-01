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

test('maps website booking form fields to AI Office public booking payload', () => {
  const payload = normalizeWebsiteBookingRequest({
    customerName: 'Website API Smoke',
    phone: '+639000001234',
    email: 'guest@example.com',
    service: 'Deep Tissue Massage',
    preferredDate: '2026-07-02',
    preferredTime: '8:00 PM',
    area: 'BGC',
    addressNote: 'Test Condo',
    peopleCount: '2',
    therapistPreference: 'female_preferred',
    paymentMethod: 'cash_after_service',
    notes: 'Please confirm by WhatsApp.'
  });

  assert.equal(payload.source, 'web');
  assert.equal(payload.tenantId, 'brand-a');
  assert.equal(payload.customerName, 'Website API Smoke');
  assert.equal(payload.phone, '+639000001234');
  assert.equal(payload.email, 'guest@example.com');
  assert.equal(payload.service, 'Deep Tissue Massage');
  assert.equal(payload.preferredDate, '2026-07-02');
  assert.equal(payload.scheduledDate, '2026-07-02');
  assert.equal(payload.preferredTime, '8:00 PM');
  assert.equal(payload.scheduledTime, '20:00');
  assert.equal(payload.area, 'BGC');
  assert.equal(payload.addressNote, 'Test Condo');
  assert.equal(payload.peopleCount, 2);
  assert.equal(payload.therapistGenderPreference, 'female');
  assert.equal(payload.metadata.website, 'www.easygospa.com');
  assert.equal(payload.metadata.form, 'BookingModal');
  assert.equal(payload.metadata.submittedFrom, 'public_website');
  assert.equal(payload.metadata.paymentMethod, 'cash_after_service');
  assert.match(payload.notes, /Payment method: cash_after_service/);
});

test('rejects missing required website booking fields before proxying', () => {
  assert.throws(
    () => normalizeWebsiteBookingRequest({ customerName: 'Guest' }),
    /phone is required/
  );
});

test('keeps payment link and card as intake metadata without paid confirmation', () => {
  const payload = normalizeWebsiteBookingRequest({
    customerName: 'Guest',
    phone: '+639000009999',
    service: 'Swedish Massage',
    preferredDate: '2026-07-03',
    preferredTime: '9:30 PM',
    area: 'Makati',
    addressNote: 'Hotel lobby',
    peopleCount: 1,
    therapistPreference: 'any_available',
    paymentMethod: 'payment_link'
  });

  assert.equal(payload.paymentMethod, 'payment_link');
  assert.equal(payload.metadata.paymentMethod, 'payment_link');
  assert.equal(payload.metadata.autoPaid, false);
  assert.equal(payload.metadata.financeWrite, false);
  assert.equal(payload.metadata.externalSend, false);
});
