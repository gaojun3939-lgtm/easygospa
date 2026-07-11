import assert from 'node:assert/strict';
import fs from 'node:fs';

const bookingModalSource = fs.readFileSync('src/components/BookingModal.jsx', 'utf8');
const homePageSource = fs.readFileSync('src/app/page.tsx', 'utf8');
const statsSectionSource = fs.readFileSync('src/components/StatsSection.jsx', 'utf8');

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

check(!homePageSource.includes('import CategoriesSection'), 'homepage no longer imports the duplicate CategoriesSection carousel');
check(!homePageSource.includes('<CategoriesSection />'), 'homepage no longer renders the duplicate CategoriesSection carousel');
check(homePageSource.includes('import ServicesSection') && homePageSource.includes('<ServicesSection />'), 'homepage keeps the detailed ServicesSection');
check(fs.existsSync('src/components/CategoriesSection.jsx'), 'CategoriesSection component remains available for future reuse');

check(!statsSectionSource.includes('Verified Reviews'), 'stats section removes the zero-review metric');
check(statsSectionSource.includes('label: "Happy Customers", value: 5000, suffix: "+"'), 'stats section preserves Happy Customers 5000+');
check(statsSectionSource.includes('label: "Verified Therapists", value: 50, suffix: "+"'), 'stats section preserves Verified Therapists 50+');
check(statsSectionSource.includes('label: "Service Hours", value: 24, suffix: "/7"'), 'stats section preserves Service Hours 24/7');
check((statsSectionSource.match(/\{ icon:/g) || []).length === 3, 'stats section contains exactly three metrics');
check(statsSectionSource.includes('md:grid-cols-3') && !statsSectionSource.includes('lg:grid-cols-4'), 'three remaining metrics share the grid evenly');
