import assert from 'node:assert/strict';
import fs from 'node:fs';

import { normalizePublicBookingCatalog } from '../src/lib/bookingCatalogNormalizer.mjs';
import { normalizeWebsiteBookingRequest } from '../src/lib/bookingRequestPayload.mjs';
import {
  normalizeCouponWalletPayload,
  projectPublicReviewResponse
} from '../src/lib/reviewCouponNormalizer.mjs';

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

const bookingModalSource = fs.readFileSync('src/components/BookingModal.jsx', 'utf8');
const trackingSource = fs.readFileSync('src/components/BookingTrackingPage.jsx', 'utf8');
const ordersSource = fs.readFileSync('src/components/CustomerOrders.jsx', 'utf8');
const reviewProxySource = fs.readFileSync('src/app/api/booking-review/route.js', 'utf8');
const couponProxySource = fs.readFileSync('src/app/api/my-coupons/route.js', 'utf8');
const bookingProxySource = fs.readFileSync('src/app/api/booking-request/route.js', 'utf8');

test('booking request carries only the selected coupon id while retaining full catalog total', () => {
  const payload = normalizeWebsiteBookingRequest({
    customerName: 'Coupon Guest',
    customerEmail: 'coupon@example.test',
    phone: '+639000000001',
    requestedTechnicianId: 'therapist-real',
    requestedTechnicianName: 'Grace',
    therapistPreference: 'specific_therapist',
    selectedServices: [{ serviceId: 'swedish', serviceName: 'Swedish Massage', durationMinutes: 60, price: 1000, currency: 'PHP' }],
    preferredDate: '2026-07-25',
    preferredTime: '10:00',
    area: 'Makati',
    addressNote: 'Test building',
    totalAmount: 1,
    couponId: 'coupon-safe-001',
    metadata: { couponId: 'coupon-forged', couponDiscount: 999 }
  });

  assert.equal(payload.totalAmount, 1000);
  assert.equal(payload.quotedPrice, 1000);
  assert.equal(payload.couponId, 'coupon-safe-001');
  assert.equal(payload.metadata.couponId, undefined);
  assert.equal(payload.metadata.couponDiscount, undefined);
});

test('catalog preserves only safe aggregate and masked review fields', () => {
  const catalog = normalizePublicBookingCatalog({
    ok: true,
    therapists: [{
      therapistId: 'therapist-real',
      displayName: 'Profile name',
      technicianAccountName: 'Grace',
      specialties: ['Swedish'],
      serviceAreas: ['Makati'],
      rating: 4.25,
      reviewCount: 4,
      ratingDistribution: { 5: 2, 4: 1, 3: 0, 2: 1, 1: 0 },
      verifiedReviews: [{
        id: 'review-1',
        maskedCustomerName: 'G••••35',
        stars: 2,
        text: 'The therapist was late.',
        createdAt: '2026-07-20T10:00:00.000Z',
        reply: { text: 'Thank you for telling us.', createdAt: '2026-07-20T11:00:00.000Z' },
        customerEmail: 'must-not-leak@example.test',
        customerKey: 'must-not-leak'
      }]
    }],
    services: [{ serviceId: 'swedish', serviceName: 'Swedish Massage', status: 'active' }],
    options: [{ optionId: 'swedish-60', serviceId: 'swedish', durationMinutes: 60, price: 1000, currency: 'PHP' }],
    relations: [{ therapistId: 'therapist-real', serviceId: 'swedish', status: 'active' }]
  });
  const therapist = catalog.therapists[0];
  assert.equal(therapist.rating, 4.25);
  assert.equal(therapist.reviewCount, 4);
  assert.deepEqual(therapist.ratingDistribution, { 1: 0, 2: 1, 3: 0, 4: 1, 5: 2 });
  assert.deepEqual(therapist.verifiedReviews[0], {
    id: 'review-1',
    maskedCustomerName: 'G••••35',
    stars: 2,
    text: 'The therapist was late.',
    createdAt: '2026-07-20T10:00:00.000Z',
    reply: { text: 'Thank you for telling us.', createdAt: '2026-07-20T11:00:00.000Z' }
  });
  assert.equal(JSON.stringify(therapist).includes('must-not-leak'), false);

});

test('coupon wallet and public review response are explicit safe projections', () => {
  const wallet = normalizeCouponWalletPayload({
    ok: true,
    coupons: [{
      id: 'coupon-1', amount: 50, status: 'active', expiresAt: '2026-08-20T10:00:00.000Z',
      createdAt: '2026-07-20T10:00:00.000Z', usedAt: null, usedBookingReference: '',
      customerKey: 'private-key', customerEmail: 'private@example.test', issuedFromReviewId: 'private-review'
    }]
  });
  assert.deepEqual(wallet, {
    ok: true,
    coupons: [{
      id: 'coupon-1', amount: 50, status: 'active', expiresAt: '2026-08-20T10:00:00.000Z',
      createdAt: '2026-07-20T10:00:00.000Z', usedAt: '', usedBookingReference: ''
    }]
  });
  assert.equal(JSON.stringify(wallet).includes('private'), false);

  const review = projectPublicReviewResponse({
    ok: true,
    review: { id: 'review-1', stars: 5, text: 'Excellent', createdAt: '2026-07-20T10:00:00.000Z', customerKey: 'private' },
    coupon: { id: 'coupon-1', amount: 50, status: 'active', expiresAt: '2026-08-20T10:00:00.000Z', customerKey: 'private' }
  });
  assert.deepEqual(review, {
    ok: true,
    review: { id: 'review-1', stars: 5, text: 'Excellent', createdAt: '2026-07-20T10:00:00.000Z' },
    coupon: { id: 'coupon-1', amount: 50, status: 'active', expiresAt: '2026-08-20T10:00:00.000Z' }
  });
  assert.equal(JSON.stringify(review).includes('customerKey'), false);
});

test('website renders completed review card, coupon wallet, and pending-verification coupon selection', () => {
  assert.match(trackingSource, /data-testid="completed-booking-review"/);
  assert.match(trackingSource, /How was \{therapistName\}\?/);
  assert.match(trackingSource, /A ₱50 coupon is now in your wallet/);
  assert.match(trackingSource, /duplicateReviewCodes\.has/);
  assert.doesNotMatch(trackingSource, /if \(response\.status === 409\) \{/);
  assert.match(ordersSource, /data-testid="coupon-wallet"/);
  assert.match(ordersSource, /Available|Expired|Used/);
  assert.match(bookingModalSource, /data-testid="booking-coupon-selector"/);
  assert.match(bookingModalSource, /Estimated cash after coupon/);
  assert.match(bookingModalSource, /checked by our booking service/);
  assert.match(bookingModalSource, /couponId:/);
  assert.match(bookingModalSource, /selectedCoupon && couponAccessToken/);
  assert.match(bookingModalSource, /Authorization: `Bearer \$\{couponAccessToken\}`/);
  assert.match(bookingModalSource, /Confirm Cash before service/);
  assert.match(bookingModalSource, /Payment will be collected when the therapist arrives, before the massage starts\./);
  assert.doesNotMatch(bookingModalSource, /Cash after service|after the massage service/);
  assert.match(bookingModalSource, /hasReviews \? Math\.min\(5, ratingRaw\) : 5/);
});

test('same-origin proxies forward minimal inputs and never pass upstream JSON through', () => {
  assert.match(reviewProxySource, /reference, email, rating, comment/);
  assert.match(reviewProxySource, /Number\.isInteger\(rating\)/);
  assert.match(reviewProxySource, /projectPublicReviewResponse/);
  assert.doesNotMatch(reviewProxySource, /return json\(payload/);
  assert.match(couponProxySource, /normalizeCouponWalletPayload/);
  assert.doesNotMatch(couponProxySource, /return json\(payload/);
  assert.match(bookingProxySource, /\^Bearer\\s\+\[\^\\s\]\+\$/);
  assert.match(bookingProxySource, /authorization\.length <= 4096/);
  assert.match(bookingProxySource, /Authorization: forwardAuthorization/);
  assert.doesNotMatch(bookingProxySource, /body[\s\S]*access_token|body[\s\S]*couponAccessToken/);
});

console.log('WEBSITE_REVIEW_COUPON_LOOP_CHECK_PASS');
