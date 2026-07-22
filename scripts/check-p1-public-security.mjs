import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { projectPublicBookingError } from '../src/lib/publicBookingResponse.mjs';
import { forwardedClientIpHeaders } from '../src/lib/serverForwardedIp.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');
const requestId = '018f0000-0000-4000-8000-000000000001';

assert.deepEqual(projectPublicBookingError({
  ok: false,
  code: 'ACTIVE_BOOKING_EXISTS',
  error: 'postgres secret@example.test at /srv/private.js:42',
  debug: 'stack',
  requestId
}), {
  ok: false,
  code: 'ACTIVE_BOOKING_EXISTS',
  error: 'A booking is already waiting for confirmation.',
  requestId
});

const unknownFailure = projectPublicBookingError({
  ok: false,
  code: 'PGRST999',
  error: 'relation private_table does not exist',
  debug: 'postgres://secret',
  requestId: 'secret@example.test raw request id'
});
assert.equal(unknownFailure.ok, false);
assert.equal(unknownFailure.code, 'AIOFFICE_BOOKING_REQUEST_FAILED');
assert.equal(unknownFailure.error, 'Booking request could not be submitted.');
assert.match(unknownFailure.requestId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
assert.notEqual(unknownFailure.requestId, 'secret@example.test raw request id');

const missingRequestId = projectPublicBookingError({
  ok: false,
  code: 'PGRST999',
  error: 'raw upstream failure'
});
assert.match(missingRequestId.requestId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

const unsignedTrusted = new Request('https://www.easygospa.com/api/booking-request', {
  headers: { 'x-vercel-forwarded-for': '203.0.113.3', 'x-forwarded-for': '198.51.100.4' }
});
assert.deepEqual(forwardedClientIpHeaders(unsignedTrusted), {});
assert.deepEqual(forwardedClientIpHeaders(unsignedTrusted, {
  env: { AIOFFICE_PROXY_IP_SECRET: 'too-short' }
}), {});
const proxySecret = 'p1-proxy-secret-at-least-32-characters';
const proxyNow = new Date('2026-07-22T00:00:00.000Z');
const signedHeaders = forwardedClientIpHeaders(unsignedTrusted, { env: { AIOFFICE_PROXY_IP_SECRET: proxySecret }, now: proxyNow });
assert.equal(signedHeaders['x-easygospa-client-ip'], '203.0.113.3');
assert.equal(signedHeaders['x-easygospa-client-ip-timestamp'], String(Math.floor(proxyNow.getTime() / 1000)));
assert.equal(
  signedHeaders['x-easygospa-client-ip-signature'],
  crypto.createHmac('sha256', proxySecret)
    .update(`${signedHeaders['x-easygospa-client-ip-timestamp']}\n203.0.113.3`)
    .digest('hex')
);

assert.deepEqual({
  ok: false,
  code: 'AIOFFICE_BOOKING_REQUEST_FAILED',
  error: 'Booking request could not be submitted.',
  requestId: unknownFailure.requestId
}, unknownFailure);

const spoofOnly = new Request('https://www.easygospa.com/api/booking-request', {
  headers: { 'x-forwarded-for': '203.0.113.1', 'x-real-ip': '203.0.113.2' }
});
assert.deepEqual(forwardedClientIpHeaders(spoofOnly), {});
const myBookingsRoute = read('src/app/api/my-bookings/route.js');
assert.doesNotMatch(myBookingsRoute, /return json\(payload, response\.status\)/);
assert.doesNotMatch(myBookingsRoute, /payload\.debug|debug\s*:/);
assert.doesNotMatch(myBookingsRoute, /backend\.error|payload\.error/);
assert.match(myBookingsRoute, /requestId/);
assert.match(myBookingsRoute, /ensurePublicRequestId/);

const customerOrders = read('src/components/CustomerOrders.jsx');
assert.doesNotMatch(customerOrders, /payload\.debug/);
assert.match(customerOrders, /requestId/);

const forwarder = read('src/lib/serverForwardedIp.mjs');
assert.doesNotMatch(forwarder, /'x-real-ip'/);
assert.doesNotMatch(forwarder, /\['x-vercel-forwarded-for',\s*'x-forwarded-for'/);
assert.match(forwarder, /createHmac/);

const cancelProxy = read('src/lib/bookingCancelProxy.mjs');
const publicCancel = read('src/lib/publicBookingCancel.mjs');
assert.doesNotMatch(cancelProxy, /payload\.error/);
assert.doesNotMatch(publicCancel, /payload\.error/);
assert.match(cancelProxy, /requestId/);
assert.match(publicCancel, /requestId/);

console.log('[p1-public-security-site] PASS opaque_errors request_id trusted_proxy_header');
