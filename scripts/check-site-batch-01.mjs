import assert from 'node:assert/strict';
import fs from 'node:fs';

const bookingModalSource = fs.readFileSync('src/components/BookingModal.jsx', 'utf8');

function check(condition, message) {
  assert.ok(condition, message);
  console.log(`[site-batch-01] PASS ${message}`);
}

check(bookingModalSource.includes('function TherapistRating'), 'booking modal defines a reusable TherapistRating component');
check((bookingModalSource.match(/<TherapistRating therapist=\{therapist\} \/>/g) || []).length === 2, 'wall card and therapist detail both reuse TherapistRating');
check(bookingModalSource.includes('Math.round(rating * 2) / 2'), 'ratings are displayed at half-star precision');
check(bookingModalSource.includes('#f0b429'), 'rating stars use the approved gold color');
check(bookingModalSource.includes('No verified reviews yet'), 'therapists without reviews keep the honest empty-state copy');
check(!bookingModalSource.includes('function realReviewsLabel'), 'legacy text-only rating formatter is removed');
