import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PUBLIC_BOOKING_CREATED_RECOVERY_CODE,
  projectPublicBookingCreatedRecovery,
  projectPublicBookingError,
  projectPublicBookingSuccess
} from '../src/lib/publicBookingResponse.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routeSource = fs.readFileSync(path.join(root, 'src/app/api/booking-request/route.js'), 'utf8');

const forbiddenKeys = new Set([
  'address',
  'customer',
  'email',
  'metadata',
  'phone',
  'profile',
  'remittance',
  'thread',
  'transportfare',
  'workflowevents'
]);

function assertNoForbiddenKeys(value, trail = '$') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoForbiddenKeys(entry, `${trail}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    assert.equal(forbiddenKeys.has(key.toLowerCase()), false, `forbidden key ${trail}.${key}`);
    assertNoForbiddenKeys(child, `${trail}.${key}`);
  }
}

const projected = projectPublicBookingSuccess({
  ok: true,
  reference: 'mbr-brand-a-test123',
  cancelToken: 'egc1_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  status: 'assigned',
  scheduledDate: '2026-07-21',
  scheduledTime: '10:00',
  serviceName: 'Swedish Massage',
  queued: true,
  queueMessage: 'Your booking is queued.',
  couponApplied: true,
  grossServiceAmount: 1000,
  couponDiscount: 50,
  cashToCollect: 950,
  customer: { phone: '+639000000000', email: 'secret@example.test', address: 'Secret address' },
  thread: { metadata: { remittance: { amount: 1 } } },
  workflowEvents: [{ type: 'internal' }],
  bookingRequest: {
    id: 'mbr-brand-a-hidden',
    cancelToken: 'egc1_BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    customer: { phone: '+639000000001' },
    metadata: { transportFare: 100 }
  }
}, 'mbr-brand-a-test123');

assert.deepEqual(projected, {
  ok: true,
  reference: 'mbr-brand-a-test123',
  cancelToken: 'egc1_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  status: 'assigned',
  scheduledDate: '2026-07-21',
  scheduledTime: '10:00',
  serviceName: 'Swedish Massage',
  queued: true,
  queueMessage: 'Your booking is queued.',
  couponApplied: true,
  grossServiceAmount: 1000,
  couponDiscount: 50,
  cashToCollect: 950
});
assertNoForbiddenKeys(projected);
assert.match(routeSource, /projectPublicBookingSuccess\(payload, reference\)/);
assert.doesNotMatch(routeSource, /customer:\s*payload/);
assert.doesNotMatch(routeSource, /thread:\s*payload/);

const recovery = projectPublicBookingCreatedRecovery({
  ok: false,
  created: true,
  code: PUBLIC_BOOKING_CREATED_RECOVERY_CODE,
  error: 'untrusted upstream details',
  reference: 'mbr-brand-a-recovery123',
  cancelToken: 'egc1_CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
  customerEmail: 'secret@example.test',
  metadata: { secret: true }
}, 'mbr-brand-a-recovery123');
assert.deepEqual(recovery, {
  ok: false,
  created: true,
  code: PUBLIC_BOOKING_CREATED_RECOVERY_CODE,
  error: 'Your booking was received, but its schedule needs assistance. Do not submit again; contact us on WhatsApp.',
  reference: 'mbr-brand-a-recovery123',
  cancelToken: 'egc1_CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'
});
assertNoForbiddenKeys(recovery);
assert.match(routeSource, /projectPublicBookingCreatedRecovery\(payload, reference\)/);

assert.deepEqual(projectPublicBookingError({
  ok: false,
  code: 'ACTIVE_BOOKING_EXISTS',
  error: 'A booking is already waiting for confirmation.',
  activeReference: 'mbr-brand-a-active123',
  customerEmail: 'secret@example.test',
  metadata: { secret: true }
}), {
  ok: false,
  code: 'ACTIVE_BOOKING_EXISTS',
  error: 'A booking is already waiting for confirmation.'
});
assert.deepEqual(projectPublicBookingError({
  code: 'ACTIVE_BOOKING_EXISTS',
  error: 'A booking is already waiting for confirmation.',
  activeReference: 'invalid-reference'
}), {
  ok: false,
  code: 'ACTIVE_BOOKING_EXISTS',
  error: 'A booking is already waiting for confirmation.'
});
assert.deepEqual(projectPublicBookingError(null), {
  ok: false,
  code: 'AIOFFICE_BOOKING_REQUEST_FAILED',
  error: 'Booking request could not be submitted.'
});
assert.match(routeSource, /projectPublicBookingError\(payload\)/);
assert.match(routeSource, /isPublicBookingCancelToken/);
assert.match(routeSource, /AIOFFICE_BOOKING_CANCEL_TOKEN_MISSING/);

assert.equal(
  Object.hasOwn(projectPublicBookingSuccess({
    ok: true,
    reference: 'mbr-brand-a-test123',
    cancelToken: 'invalid-token'
  }), 'cancelToken'),
  false,
  'invalid cancellation tokens must not cross the website response boundary'
);

console.log('P0_PUBLIC_BOOKING_RESPONSE_CHECK_PASS');
