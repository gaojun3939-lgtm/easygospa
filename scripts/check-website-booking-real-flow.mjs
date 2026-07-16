import assert from 'node:assert/strict';
import fs from 'node:fs';
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

const modalSource = fs.readFileSync('src/components/BookingModal.jsx', 'utf8');
const proxySource = fs.readFileSync('src/app/api/booking-request/route.js', 'utf8');

test('booking modal no longer contains old in-spa confirmation copy', () => {
  for (const forbidden of [
    'Booking Confirmed!',
    'Booking Reference: #',
    'Invalid Date',
    'present this at reception',
    'Book Your Appointment'
  ]) {
    assert.ok(!modalSource.includes(forbidden), `modal must not contain "${forbidden}"`);
  }
});

test('success state requires proxy ok and a real mbr reference', () => {
  assert.ok(modalSource.includes("fetch(apiUrl('/api/booking-request')"));
  assert.ok(modalSource.includes("payload?.ok !== true"));
  assert.ok(modalSource.includes('mbr-brand-a-'));
  assert.ok(modalSource.includes('Booking request submitted'));
  assert.ok(modalSource.includes('Our team will contact you on WhatsApp to confirm therapist availability.'));
  assert.ok(!modalSource.includes("createdAppointment?.id || 'Pending'"));
});

test('server proxy rejects successful upstream responses without a real reference', () => {
  assert.ok(proxySource.includes('extractBookingReference'));
  assert.ok(proxySource.includes('AIOFFICE_BOOKING_REFERENCE_MISSING'));
  assert.ok(proxySource.includes('mbr-brand-a-'));
  assert.ok(proxySource.includes('process.env.AIOFFICE_BOOKING_API_URL'));
});

test('therapist wall payload preserves specific therapist booking fields', () => {
  const payload = normalizeWebsiteBookingRequest({
    customerName: 'Website Real Flow Smoke',
    customerEmail: 'website-real-flow-smoke@example.com',
    phone: '+639000008891',
    requestedTechnicianId: 'therapist-bgc-deep-tissue',
    requestedTechnicianName: 'BGC Deep Tissue Therapist',
    therapistPreference: 'specific_therapist',
    therapistGenderPreference: 'female',
    selectedTherapistSpecialties: ['Deep Tissue Massage', 'Swedish Massage'],
    selectedServices: [{ serviceName: 'Deep Tissue Massage', durationMinutes: 90, price: 4200, currency: 'PHP' }],
    service: 'Deep Tissue Massage',
    durationMinutes: 90,
    totalAmount: 4200,
    preferredDate: '2026-07-04',
    preferredTime: '20:00',
    area: 'BGC',
    addressNote: 'Website real flow condo / building only',
    notes: 'Website booking real flow smoke - safe to delete'
  });

  assert.equal(payload.source, 'website');
  assert.equal(payload.customerEmail, 'website-real-flow-smoke@example.com');
  assert.equal(payload.requestedTechnicianId, 'therapist-bgc-deep-tissue');
  assert.equal(payload.requestedTechnicianName, 'BGC Deep Tissue Therapist');
  assert.equal(payload.therapistPreference, 'specific_therapist');
  assert.equal(payload.therapistGenderPreference, 'female');
  assert.equal(payload.selectedServices[0].serviceName, 'Deep Tissue Massage');
  assert.equal(payload.selectedServices[0].durationMinutes, 90);
  assert.equal(payload.durationMinutes, 90);
  assert.equal(payload.totalAmount, 4200);
  assert.equal(payload.paymentMethod, 'cash_after_service');
  assert.equal(payload.paymentStatus, 'pending_collection');
  assert.equal(payload.paymentTiming, 'after_service');
  assert.equal(payload.metadata.bookingFlow, 'therapist_wall_detail_service_cash');
  assert.equal(payload.metadata.therapistPreference, 'specific_therapist');
});

test('booking flow does not include external sends, finance, dispatch, or online payment', () => {
  for (const forbidden of ['sendWhatsApp', 'graph.facebook.com', 'openai', 'gemini', 'createPayment', 'financeWrite: true', 'autoDispatch: true', 'autoPaid: true']) {
    assert.ok(!modalSource.includes(forbidden), `modal must not contain ${forbidden}`);
    assert.ok(!proxySource.includes(forbidden), `proxy must not contain ${forbidden}`);
  }
});
