import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveAiOfficeApiUrl } from '../src/lib/aiofficeApiBase.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const endpointRoutes = {
  bookingCatalog: 'src/app/api/booking-catalog/route.js',
  bookingRequest: 'src/app/api/booking-request/route.js',
  bookingStatus: 'src/app/api/booking-status/route.js',
  bookingCancel: 'src/app/api/booking-cancel/route.js',
  myBookings: 'src/app/api/my-bookings/route.js',
  bookingReview: 'src/app/api/booking-review/route.js',
  myCoupons: 'src/app/api/my-coupons/route.js'
};

for (const endpoint of Object.keys(endpointRoutes)) {
  for (const productionEnv of [{ NODE_ENV: 'production' }, { VERCEL_ENV: 'production' }]) {
    const resolved = resolveAiOfficeApiUrl(endpoint, { env: productionEnv, warn: () => {} });
    assert.deepEqual(resolved, {
      ok: false,
      status: 503,
      code: 'BACKEND_URL_NOT_CONFIGURED',
      error: 'Booking backend URL is not configured.'
    });
  }

  const warnings = [];
  const development = resolveAiOfficeApiUrl(endpoint, {
    env: { NODE_ENV: 'development' },
    warn: message => warnings.push(message)
  });
  assert.equal(development.ok, true);
  assert.match(development.url, /^https:\/\/staging\.easygospa\.com\/api\//);
  assert.equal(warnings.length, 1);

  const routeSource = fs.readFileSync(path.join(root, endpointRoutes[endpoint]), 'utf8');
  assert.match(routeSource, new RegExp(`resolveAiOfficeApiUrl\\('${endpoint}'\\)`));
  assert.match(routeSource, /BACKEND_URL_NOT_CONFIGURED|backend\.code/);
}

const configured = resolveAiOfficeApiUrl('bookingRequest', {
  env: { NODE_ENV: 'production', AIOFFICE_BOOKING_API_URL: 'https://backend.example.test/public-request' },
  warn: () => assert.fail('configured production must not warn')
});
assert.deepEqual(configured, { ok: true, url: 'https://backend.example.test/public-request' });

const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
for (const variable of [
  'AIOFFICE_BOOKING_API_URL',
  'AIOFFICE_BOOKING_CATALOG_API_URL',
  'AIOFFICE_BOOKING_STATUS_API_URL',
  'AIOFFICE_BOOKING_CANCEL_API_URL',
  'AIOFFICE_MY_BOOKINGS_API_URL',
  'AIOFFICE_BOOKING_REVIEW_API_URL',
  'AIOFFICE_MY_COUPONS_API_URL'
]) {
  assert.match(envExample, new RegExp(`^${variable}=`, 'm'));
}

console.log('P0_AIOFFICE_API_BASE_CHECK_PASS');
