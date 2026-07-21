import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { projectPublicBookingError, projectPublicBookingSuccess } from '../src/lib/publicBookingResponse.mjs';

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
    customer: { phone: '+639000000001' },
    metadata: { transportFare: 100 }
  }
}, 'mbr-brand-a-test123');

assert.deepEqual(projected, {
  ok: true,
  reference: 'mbr-brand-a-test123',
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
  error: 'A booking is already waiting for confirmation.',
  activeReference: 'mbr-brand-a-active123'
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

console.log('P0_PUBLIC_BOOKING_RESPONSE_CHECK_PASS');
