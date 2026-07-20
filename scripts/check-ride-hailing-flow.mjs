import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  ACTIVE_BOOKING_STORAGE_KEY,
  clearActiveBooking,
  readActiveBooking,
  resolveActiveBookingGate,
  writeActiveBooking
} from '../src/lib/activeBooking.mjs';
import { cancelPublicBooking } from '../src/lib/publicBookingCancel.mjs';
import { projectBookingCancelUpstream } from '../src/lib/bookingCancelProxy.mjs';
import { forwardedClientIpHeaders } from '../src/lib/serverForwardedIp.mjs';

function check(condition, label, actual) {
  assert.ok(condition, `${label}; actual=${JSON.stringify(actual)}`);
  console.log(`[ride-hailing-site] PASS ${label} actual=${JSON.stringify(actual)}`);
}

class MemoryStorage {
  constructor() {
    this.entries = new Map();
  }

  getItem(key) {
    return this.entries.has(key) ? this.entries.get(key) : null;
  }

  setItem(key, value) {
    this.entries.set(key, String(value));
  }

  removeItem(key) {
    this.entries.delete(key);
  }
}

const storage = new MemoryStorage();
const reference = 'mbr-brand-a-sitewaiting21';
const written = writeActiveBooking(reference, {
  storage,
  now: () => '2026-07-21T09:00:00.000Z'
});
check(
  JSON.stringify(written) === JSON.stringify({ reference, createdAt: '2026-07-21T09:00:00.000Z' })
    && JSON.stringify(readActiveBooking({ storage })) === JSON.stringify(written)
    && Object.keys(JSON.parse(storage.getItem(ACTIVE_BOOKING_STORAGE_KEY))).sort().join(',') === 'createdAt,reference',
  'active marker stores exactly reference and createdAt',
  JSON.parse(storage.getItem(ACTIVE_BOOKING_STORAGE_KEY))
);
storage.setItem(ACTIVE_BOOKING_STORAGE_KEY, JSON.stringify({ reference: 'invalid', createdAt: written.createdAt, contact: 'secret@example.test' }));
check(readActiveBooking({ storage }) === null && storage.getItem(ACTIVE_BOOKING_STORAGE_KEY) === null, 'invalid or expanded marker is rejected and cleared', storage.getItem(ACTIVE_BOOKING_STORAGE_KEY));
writeActiveBooking(reference, { storage, now: () => written.createdAt });
check(clearActiveBooking({ storage, reference: 'mbr-brand-a-other21' }) === false && readActiveBooking({ storage })?.reference === reference, 'one tracking page cannot clear another active reference', readActiveBooking({ storage }));
check(clearActiveBooking({ storage, reference }) === true && readActiveBooking({ storage }) === null, 'matching active marker clears', readActiveBooking({ storage }));

writeActiveBooking(reference, { storage, now: () => written.createdAt });
const failedLookupGate = await resolveActiveBookingGate({
  storage,
  loadStatus: async () => { throw new Error('synthetic network failure'); }
});
check(failedLookupGate === null && readActiveBooking({ storage }) === null, 'active-marker status lookup failure clears the marker and fails open', failedLookupGate);
console.log(`[ride-hailing-site] NEGATIVE active_marker_lookup_failure gate=${JSON.stringify(failedLookupGate)} marker=${JSON.stringify(readActiveBooking({ storage }))}`);
writeActiveBooking(reference, { storage, now: () => written.createdAt });
const waitingGate = await resolveActiveBookingGate({
  storage,
  loadStatus: async () => ({ ok: true, status: 'waiting_acceptance' })
});
check(waitingGate?.reference === reference && readActiveBooking({ storage })?.reference === reference, 'only a verified waiting status keeps the local booking gate closed', waitingGate);
let staleLookupCurrent = true;
let releaseStaleLookup;
const staleLookupResponse = new Promise(resolve => { releaseStaleLookup = resolve; });
const staleGatePromise = resolveActiveBookingGate({
  storage,
  isCurrent: () => staleLookupCurrent,
  loadStatus: async () => staleLookupResponse
});
staleLookupCurrent = false;
releaseStaleLookup({ ok: true, status: 'preparing' });
const staleGate = await staleGatePromise;
check(
  staleGate === null && readActiveBooking({ storage })?.reference === reference,
  'a stale modal status response cannot clear or replace the current active marker',
  { staleGate, marker: readActiveBooking({ storage }) }
);

let clientRequest = null;
const opaqueClientResult = await cancelPublicBooking({
  reference,
  contact: 'wrong@example.test',
  fetchImpl: async (url, init) => {
    clientRequest = { url, init };
    return new Response(JSON.stringify({ ok: false, reason: 'not_found', internal: 'strip-me' }), {
      status: 404,
      headers: { 'content-type': 'application/json' }
    });
  }
});
check(
  clientRequest.url === '/api/booking-cancel'
    && JSON.parse(clientRequest.init.body).reference === reference
    && JSON.parse(clientRequest.init.body).contact === 'wrong@example.test'
    && JSON.stringify(opaqueClientResult) === JSON.stringify({ ok: false, httpStatus: 404, reason: 'not_found' }),
  'cancellation client returns one opaque not-found result',
  opaqueClientResult
);
console.log(`[ride-hailing-site] NEGATIVE cancel_client_opaque status=${opaqueClientResult.httpStatus} body=${JSON.stringify(opaqueClientResult)}`);

const forwardedHeaders = forwardedClientIpHeaders(new Request('https://www.easygospa.com/api/booking-cancel', {
  headers: { 'x-forwarded-for': '203.0.113.44, 10.0.0.7' }
}));
check(
  JSON.stringify(forwardedHeaders) === JSON.stringify({ 'x-forwarded-for': '203.0.113.44' }),
  'proxy IP helper forwards one validated address rather than the chain',
  forwardedHeaders
);
const opaqueProjection = projectBookingCancelUpstream({
  httpStatus: 404,
  payload: { ok: false, reason: 'not_found', secret: 'strip-me' },
  reference
});
check(
  JSON.stringify(opaqueProjection) === JSON.stringify({ status: 404, body: { ok: false, reason: 'not_found' }, headers: {} }),
  'cancel proxy keeps wrong-contact and missing-reference responses opaque',
  opaqueProjection
);
console.log(`[ride-hailing-site] NEGATIVE cancel_proxy_opaque status=${opaqueProjection.status} body=${JSON.stringify(opaqueProjection.body)} forwarded_ip=${forwardedHeaders['x-forwarded-for']}`);

const limitedProjection = projectBookingCancelUpstream({
  httpStatus: 429,
  payload: { ok: false, code: 'RATE_LIMITED', error: 'upstream detail', retryAfterSeconds: 999, secret: 'strip-me' },
  reference,
  retryAfter: '47'
});
check(
  JSON.stringify(limitedProjection) === JSON.stringify({
    status: 429,
    body: { ok: false, code: 'RATE_LIMITED', error: 'Too many requests, please try again later.' },
    headers: { 'retry-after': '47' }
  }),
  'cancel proxy strictly projects 429 and forwards Retry-After',
  limitedProjection
);
console.log(`[ride-hailing-site] NEGATIVE cancel_proxy_rate_limit status=${limitedProjection.status} body=${JSON.stringify(limitedProjection.body)} retry_after=${limitedProjection.headers['retry-after']}`);

const modalSource = fs.readFileSync('src/components/BookingModal.jsx', 'utf8');
const trackerSource = fs.readFileSync('src/components/BookingTrackingPage.jsx', 'utf8');
const requestProxySource = fs.readFileSync('src/app/api/booking-request/route.js', 'utf8');
const cancelProxySource = fs.readFileSync('src/app/api/booking-cancel/route.js', 'utf8');
const customerOrdersSource = fs.readFileSync('src/components/CustomerOrders.jsx', 'utf8');
const nextConfigSource = fs.readFileSync('next.config.ts', 'utf8');

for (const marker of [
  'data-testid="active-booking-dialog"',
  'You already have a booking waiting for confirmation',
  'resolveActiveBookingGate',
  'activeBookingInspectionSequenceRef',
  "payload?.code === 'ACTIVE_BOOKING_EXISTS'",
  'writeActiveBooking(reference)',
  "router.push(`/track/${encodeURIComponent(reference)}`)"
]) {
  check(modalSource.includes(marker), `modal includes ${marker}`, marker);
}
for (const marker of [
  'WAITING_ACCEPTANCE_POLL_MS',
  'DEFAULT_BOOKING_POLL_MS',
  'Notification.requestPermission()',
  "new Notification('EasyGoSpa'",
  'navigator.vibrate(200)',
  'confirmationNotifiedRef',
  'requestSequenceRef',
  'requestSequence !== requestSequenceRef.current',
  'Usually confirmed within a few minutes',
  'Confirm cancellation'
]) {
  check(trackerSource.includes(marker), `tracker includes ${marker}`, marker);
}
check(!/(countdown|autoCancel|auto_cancel)/i.test(trackerSource), 'tracker has no countdown or auto-cancel implementation', null);
check(!trackerSource.includes('writeActiveBooking'), 'opening a shared tracking link never creates a local active-booking marker', null);
check(requestProxySource.includes('projectPublicBookingError') && requestProxySource.includes('forwardedClientIpHeaders'), 'booking request proxy strictly projects activeReference and forwards client IP', null);
check(cancelProxySource.includes('forwardedClientIpHeaders') && cancelProxySource.includes('retry-after'), 'cancel proxy forwards validated client IP and Retry-After', null);
check(customerOrdersSource.includes('BOOKING_STATUS_STEPS.map'), 'customer orders reuses the one public status timeline', null);
check(nextConfigSource.includes('Access-Control-Expose-Headers') && nextConfigSource.includes('Retry-After'), 'cross-origin API responses expose Retry-After', null);

console.log('[ride-hailing-site] ALL_LOCAL_ASSERTIONS_PASS');
