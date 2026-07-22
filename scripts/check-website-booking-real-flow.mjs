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
const apiBaseSource = fs.readFileSync('src/lib/aiofficeApiBase.mjs', 'utf8');
const publicResponseSource = fs.readFileSync('src/lib/publicBookingResponse.mjs', 'utf8');

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

test('success requires proxy ok, stores the opaque reference with its cancellation token, and redirects immediately', () => {
  assert.ok(modalSource.includes("fetch(apiUrl('/api/booking-request')"));
  assert.ok(modalSource.includes("payload?.ok !== true"));
  assert.ok(modalSource.includes('mbr-brand-a-'));
  assert.ok(modalSource.includes('writeActiveBooking(reference, { cancelToken: payload.cancelToken })'));
  assert.ok(modalSource.includes('if (!activeBookingMarker)'));
  assert.ok(modalSource.includes('showActiveBookingDialog(reference'));
  assert.ok(modalSource.includes('persisted: false'));
  assert.ok(modalSource.includes('activeBookingDialog.persisted ?'));
  assert.ok(modalSource.includes("router.push(`/track/${encodeURIComponent(reference)}`)"));
  assert.ok(!modalSource.includes("setStep('success')"));
  assert.ok(!modalSource.includes('Booking request submitted'));
  assert.ok(!modalSource.includes("createdAppointment?.id || 'Pending'"));
});

test('unauthenticated duplicate response never exposes or persists an active booking reference', () => {
  assert.ok(proxySource.includes('projectPublicBookingError(payload)'));
  assert.ok(!publicResponseSource.includes('response.activeReference'));
  assert.ok(modalSource.includes("payload?.code === 'ACTIVE_BOOKING_EXISTS'"));
  assert.ok(!modalSource.includes('payload.activeReference'));
  assert.ok(modalSource.includes('data-testid="active-booking-dialog"'));
});

test('server proxy rejects successful upstream responses without a real reference', () => {
  assert.ok(proxySource.includes('extractBookingReference'));
  assert.ok(proxySource.includes('AIOFFICE_BOOKING_REFERENCE_MISSING'));
  assert.ok(proxySource.includes('isPublicBookingCancelToken'));
  assert.ok(proxySource.includes('AIOFFICE_BOOKING_CANCEL_TOKEN_MISSING'));
  assert.ok(proxySource.includes('mbr-brand-a-'));
  assert.ok(proxySource.includes("resolveAiOfficeApiUrl('bookingRequest')"));
  assert.ok(apiBaseSource.includes('AIOFFICE_BOOKING_API_URL'));
});

test('post-create schedule failure preserves the token without changing the non-success response', () => {
  assert.ok(proxySource.includes('PUBLIC_BOOKING_CREATED_RECOVERY_CODE'));
  assert.ok(proxySource.includes('projectPublicBookingCreatedRecovery(payload, reference)'));
  assert.ok(modalSource.includes("payload?.code === 'BOOKING_CREATED_RECONCILE_PENDING'"));
  assert.ok(modalSource.includes('payload?.created === true'));
  assert.ok(modalSource.includes('showActiveBookingDialog(recoveryReference'));
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
