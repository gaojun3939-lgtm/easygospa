import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  BOOKING_STATUS_STEPS,
  buildBookingWhatsAppUrl,
  formatManilaBookingDateTime,
  getBookingStatusStepIndex,
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

test('seven booking statuses map to the taxi-style timeline order', () => {
  assert.deepEqual(
    BOOKING_STATUS_STEPS.map(step => [step.status, step.label]),
    [
      ['submitted', 'Booking received'],
      ['confirmed', 'Confirmed, matching therapist'],
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
const envExampleSource = fs.readFileSync('.env.example', 'utf8');

test('booking status proxy forwards only the opaque reference to the configured backend', () => {
  assert.ok(proxySource.includes('process.env.AIOFFICE_BOOKING_STATUS_API_URL'));
  assert.ok(proxySource.includes('https://staging.easygospa.com/api/public/booking-status'));
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

test('tracking client implements polling, visibility pause, seven steps, and read-only actions', () => {
  for (const marker of [
    'BOOKING_STATUS_STEPS',
    'getBookingStatusStepIndex',
    "status === 'cancelled'",
    '25000',
    'visibilitychange',
    "document.visibilityState === 'visible'",
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
});

const bookingModalSource = fs.readFileSync('src/components/BookingModal.jsx', 'utf8');
const homePageSource = fs.readFileSync('src/app/page.tsx', 'utf8');
const navbarSource = fs.readFileSync('src/components/navbar.jsx', 'utf8');
const successSource = bookingModalSource.slice(bookingModalSource.indexOf("{step === 'success'"));

test('only the booking success state links to the opaque tracking route', () => {
  assert.ok(bookingModalSource.includes("import Link from 'next/link'"));
  assert.ok(successSource.includes('Track my booking'));
  assert.ok(successSource.includes('Save this link to check your booking anytime.'));
  assert.ok(successSource.includes('`/track/${encodeURIComponent(createdAppointment.id)}`'));
  assert.ok(successSource.includes('createdAppointment?.id ?'));
  assert.ok(!homePageSource.includes('/track/'));
  assert.ok(!homePageSource.includes('Track my booking'));
  assert.ok(!navbarSource.includes('/track/'));
  assert.ok(!navbarSource.includes('Track my booking'));
});
