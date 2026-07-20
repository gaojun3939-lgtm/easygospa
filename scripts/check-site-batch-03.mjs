import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  BOOKING_STATUS_STEPS,
  DEFAULT_BOOKING_POLL_MS,
  WAITING_ACCEPTANCE_POLL_MS,
  buildBookingWhatsAppUrl,
  formatManilaBookingDateTime,
  getBookingPollingIntervalMs,
  getBookingStatusStepIndex,
  isTherapistConfirmationTransition,
  normalizeBookingStatusPayload
} from '../src/lib/bookingStatus.mjs';

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test('eight booking statuses map to the taxi-style timeline order', () => {
  assert.deepEqual(
    BOOKING_STATUS_STEPS.map(step => [step.status, step.label]),
    [
      ['submitted', 'Booking received'],
      ['confirmed', 'Confirmed, matching therapist'],
      ['waiting_acceptance', 'Waiting for confirmation'],
      ['preparing', 'Your therapist is getting ready'],
      ['on_the_way', 'Therapist on the way'],
      ['arrived', 'Therapist arrived'],
      ['in_service', 'Service in progress'],
      ['completed', 'Completed']
    ]
  );
  BOOKING_STATUS_STEPS.forEach((step, index) => {
    assert.equal(getBookingStatusStepIndex(step.status), index);
  });
  assert.equal(getBookingStatusStepIndex('cancelled'), -1);
});

test('waiting acceptance uses three-second polling and only real confirmation transitions notify', () => {
  assert.equal(WAITING_ACCEPTANCE_POLL_MS, 3000);
  assert.equal(DEFAULT_BOOKING_POLL_MS, 25000);
  assert.equal(getBookingPollingIntervalMs('waiting_acceptance'), 3000);
  assert.equal(getBookingPollingIntervalMs('preparing'), 25000);
  assert.equal(isTherapistConfirmationTransition('waiting_acceptance', 'preparing'), true);
  assert.equal(isTherapistConfirmationTransition('waiting_acceptance', 'on_the_way'), true);
  assert.equal(isTherapistConfirmationTransition('waiting_acceptance', 'cancelled'), false);
  assert.equal(isTherapistConfirmationTransition('preparing', 'on_the_way'), false);
});

test('booking status normalization keeps only the public contract whitelist', () => {
  const normalized = normalizeBookingStatusPayload({
    ok: true,
    reference: 'mbr-brand-a-test123',
    status: 'on_the_way',
    statusLabel: 'Therapist on the way',
    placedAt: '2026-07-15T00:00:00.000Z',
    scheduledAt: '2026-07-15T08:30:00.000Z',
    serviceName: 'Swedish Massage',
    durationMinutes: 90,
    areaName: 'BGC',
    therapist: { name: 'Luna', avatarUrl: 'https://example.com/luna.jpg', phone: 'secret' },
    etaMinutes: 18,
    whatsapp: '+63 917 109 8079',
    updatedAt: '2026-07-15T07:45:00.000Z',
    customerName: 'Must not leak',
    customerPhone: '+639000000000',
    addressNote: 'Must not leak'
  });

  assert.deepEqual(normalized, {
    ok: true,
    reference: 'mbr-brand-a-test123',
    status: 'on_the_way',
    statusLabel: 'Therapist on the way',
    placedAt: '2026-07-15T00:00:00.000Z',
    scheduledAt: '2026-07-15T08:30:00.000Z',
    serviceName: 'Swedish Massage',
    durationMinutes: 90,
    areaName: 'BGC',
    therapist: { name: 'Luna', avatarUrl: 'https://example.com/luna.jpg' },
    etaMinutes: 18,
    whatsapp: '+63 917 109 8079',
    updatedAt: '2026-07-15T07:45:00.000Z'
  });
  assert.equal(normalizeBookingStatusPayload({ ok: true, reference: 'ref', status: 'unknown' }), null);
  const nullable = normalizeBookingStatusPayload({
    ok: true,
    reference: 'mbr-brand-a-nullable',
    status: 'confirmed',
    durationMinutes: null,
    etaMinutes: null
  });
  assert.equal(nullable.durationMinutes, null);
  assert.equal(nullable.etaMinutes, null);
  const waiting = normalizeBookingStatusPayload({
    ok: true,
    reference: 'mbr-brand-a-waiting123',
    status: 'waiting_acceptance'
  });
  assert.equal(waiting.status, 'waiting_acceptance');
  assert.equal(waiting.statusLabel, 'Waiting for confirmation');
});

test('booking tracker formats Manila time and creates the public WhatsApp link', () => {
  const formatted = formatManilaBookingDateTime('2026-07-14T20:30:00.000Z');
  assert.match(formatted, /Jul 15, 2026/);
  assert.match(formatted, /4:30 AM/);

  const url = new URL(buildBookingWhatsAppUrl('+63 917 109 8079', 'mbr-brand-a-test123'));
  assert.equal(url.origin + url.pathname, 'https://wa.me/639171098079');
  assert.equal(url.searchParams.get('text'), "Hi, I'd like to check my booking mbr-brand-a-test123");
});

const proxySource = fs.readFileSync('src/app/api/booking-status/route.js', 'utf8');
const apiBaseSource = fs.readFileSync('src/lib/aiofficeApiBase.mjs', 'utf8');
const envExampleSource = fs.readFileSync('.env.example', 'utf8');

test('booking status proxy forwards only the opaque reference to the configured backend', () => {
  assert.ok(proxySource.includes("resolveAiOfficeApiUrl('bookingStatus')"));
  assert.ok(apiBaseSource.includes('AIOFFICE_BOOKING_STATUS_API_URL'));
  assert.ok(apiBaseSource.includes('https://staging.easygospa.com/api/public/booking-status'));
  assert.ok(proxySource.includes("targetUrl.searchParams.set('ref', reference)"));
  assert.ok(proxySource.includes("cache: 'no-store'"));
  assert.ok(proxySource.includes('normalizeBookingStatusPayload'));
  assert.ok(proxySource.includes("reason: 'not_found'"));
  assert.ok(proxySource.includes('response.status === 404'));
  assert.ok(envExampleSource.includes('AIOFFICE_BOOKING_STATUS_API_URL=https://staging.easygospa.com/api/public/booking-status'));
  for (const forbidden of ['customerName', 'customerPhone', 'customerEmail', 'addressNote', 'notes']) {
    assert.ok(!proxySource.includes(forbidden), `proxy must not expose ${forbidden}`);
  }
});

const trackingPageSource = fs.readFileSync('src/app/track/[ref]/page.jsx', 'utf8');
const trackingClientSource = fs.readFileSync('src/components/BookingTrackingPage.jsx', 'utf8');

test('tracking route is noindex and passes only the opaque route reference to the client', () => {
  assert.ok(trackingPageSource.includes('BookingTrackingPage'));
  assert.ok(trackingPageSource.includes('await params'));
  assert.ok(trackingPageSource.includes('index: false'));
  assert.ok(trackingPageSource.includes('follow: false'));
  assert.ok(trackingPageSource.includes('noimageindex: true'));
});

test('tracking client implements 3s/25s polling, visibility pause, confirmation alerts, and waiting cancellation', () => {
  for (const marker of [
    'BOOKING_STATUS_STEPS',
    'getBookingStatusStepIndex',
    "status === 'cancelled'",
    'WAITING_ACCEPTANCE_POLL_MS',
    'DEFAULT_BOOKING_POLL_MS',
    'getBookingPollingIntervalMs',
    'visibilitychange',
    "document.visibilityState === 'visible'",
    'Notification.requestPermission()',
    "new Notification('EasyGoSpa'",
    'navigator.vibrate(200)',
    'confirmationNotifiedRef',
    'requestSequenceRef',
    'Usually confirmed within a few minutes',
    'confirmed your booking!',
    'Cancel booking',
    'Confirm cancellation',
    'Refresh',
    'Copy',
    'buildBookingWhatsAppUrl',
    "We couldn't find this booking. Please check the link or message us on WhatsApp.",
    'Try again',
    'overflow-x-hidden',
    'break-all'
  ]) {
    assert.ok(trackingClientSource.includes(marker), `tracking client must include ${marker}`);
  }
  for (const forbidden of ['customerName', 'customerPhone', 'customerEmail', 'addressNote', 'notes']) {
    assert.ok(!trackingClientSource.includes(forbidden), `tracking UI must not display ${forbidden}`);
  }
  for (const forbidden of ['countdown', 'autoCancel', 'auto_cancel']) {
    assert.ok(!trackingClientSource.includes(forbidden), `tracking UI must not include ${forbidden}`);
  }
});

const bookingModalSource = fs.readFileSync('src/components/BookingModal.jsx', 'utf8');
const activeBookingSource = fs.readFileSync('src/lib/activeBooking.mjs', 'utf8');
const customerOrdersSource = fs.readFileSync('src/components/CustomerOrders.jsx', 'utf8');
const homePageSource = fs.readFileSync('src/app/page.tsx', 'utf8');
const navbarSource = fs.readFileSync('src/components/navbar.jsx', 'utf8');
test('successful booking redirects immediately and the modal blocks only a confirmed local waiting marker', () => {
  assert.ok(bookingModalSource.includes("import { useRouter } from 'next/navigation'"));
  assert.ok(bookingModalSource.includes('writeActiveBooking(reference)'));
  assert.ok(bookingModalSource.includes("router.push(`/track/${encodeURIComponent(reference)}`)"));
  assert.ok(!bookingModalSource.includes("setStep('success')"));
  assert.ok(!bookingModalSource.includes("step === 'success'"));
  assert.ok(bookingModalSource.includes('data-testid="active-booking-dialog"'));
  assert.ok(bookingModalSource.includes('You already have a booking waiting for confirmation'));
  assert.ok(bookingModalSource.includes('View my booking'));
  assert.ok(bookingModalSource.includes('Cancel that booking'));
  assert.ok(bookingModalSource.includes('resolveActiveBookingGate'));
  assert.ok(bookingModalSource.includes('activeBookingInspectionSequenceRef'));
  assert.ok(activeBookingSource.includes("payload?.status === 'waiting_acceptance'"));
  assert.ok(activeBookingSource.includes('clearActiveBooking'));
  assert.ok(bookingModalSource.includes("payload?.code === 'ACTIVE_BOOKING_EXISTS'"));
  assert.ok(bookingModalSource.includes('clearActiveBooking'));
  assert.ok(!homePageSource.includes('/track/'));
  assert.ok(!homePageSource.includes('Track my booking'));
  assert.ok(!navbarSource.includes('/track/'));
  assert.ok(!navbarSource.includes('Track my booking'));
});

test('customer orders reuses the same expanded public status timeline', () => {
  assert.ok(customerOrdersSource.includes("import { BOOKING_STATUS_STEPS } from '../lib/bookingStatus.mjs'"));
  assert.ok(customerOrdersSource.includes('BOOKING_STATUS_STEPS.map'));
  assert.ok(!customerOrdersSource.includes("{ key: 'preparing', label: 'Your therapist is getting ready' }"));
});
