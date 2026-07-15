import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizePublicBookingCatalog } from '../src/lib/bookingCatalogNormalizer.mjs';
import * as therapistFlow from '../src/lib/therapistServiceBookingFlow.mjs';

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

const normalized = normalizePublicBookingCatalog({
  ok: true,
  brand: 'EasyGoSpa',
  currency: 'PHP',
  therapists: [
    {
      therapistId: 'recommended-new',
      displayName: 'Recommended New Therapist',
      recommendationScore: 91,
      isNew: true,
      status: 'active',
      isVisibleOnWebsite: true,
      serviceAreas: ['Makati']
    },
    {
      therapistId: 'recommended-established',
      displayName: 'Recommended Established Therapist',
      recommendationScore: 78,
      isNew: false,
      status: 'active',
      isVisibleOnWebsite: true,
      serviceAreas: ['BGC']
    }
  ],
  services: [
    {
      serviceId: 'swedish-massage',
      serviceName: 'Swedish Massage',
      status: 'active',
      isVisibleOnWebsite: true
    }
  ],
  options: [
    {
      optionId: 'swedish-60',
      serviceId: 'swedish-massage',
      durationMinutes: 60,
      price: 2500,
      currency: 'PHP',
      status: 'active',
      isVisibleOnWebsite: true
    }
  ],
  relations: [
    { therapistId: 'recommended-new', serviceId: 'swedish-massage', status: 'active', isVisibleOnWebsite: true },
    { therapistId: 'recommended-established', serviceId: 'swedish-massage', status: 'active', isVisibleOnWebsite: true }
  ]
});

test('catalog normalization preserves backend recommendation order and strict isNew flags', () => {
  assert.deepEqual(normalized.therapists.map(therapist => therapist.id), [
    'recommended-new',
    'recommended-established'
  ]);
  assert.equal(normalized.therapists[0]?.isNew, true);
  assert.equal(normalized.therapists[1]?.isNew, false);
});

test('wall filtering returns an in-order subsequence without service or distance reordering', () => {
  assert.equal(typeof therapistFlow.filterTherapistsForWall, 'function');

  const backendOrderedTherapists = [
    {
      id: 'score-high-other-service',
      name: 'High Score Other Service',
      serviceAreas: ['Makati'],
      serviceArea: 'Makati',
      specialties: [],
      availableServices: ['Deep Tissue Massage'],
      distanceKm: 8
    },
    {
      id: 'score-mid-match-farther',
      name: 'Mid Score Match',
      serviceAreas: ['Makati'],
      serviceArea: 'Makati',
      specialties: [],
      availableServices: ['Swedish Massage'],
      distanceKm: 5
    },
    {
      id: 'score-low-match-nearest',
      name: 'Low Score Match',
      serviceAreas: ['Makati'],
      serviceArea: 'Makati',
      specialties: [],
      availableServices: ['Swedish Massage'],
      distanceKm: 1
    }
  ];

  const filtered = therapistFlow.filterTherapistsForWall({
    therapists: backendOrderedTherapists,
    query: '',
    selectedArea: 'all_service_areas',
    allAreasValue: 'all_service_areas',
    selectedService: 'Swedish Massage',
    matchSelectedService: true
  });

  assert.deepEqual(filtered.map(therapist => therapist.id), [
    'score-mid-match-farther',
    'score-low-match-nearest'
  ]);

  const serviceFiltered = therapistFlow.concreteTherapistsForWall(
    'Swedish Massage',
    backendOrderedTherapists
  );
  assert.deepEqual(serviceFiltered.map(therapist => therapist.id), [
    'score-mid-match-farther',
    'score-low-match-nearest'
  ]);
});

const bookingModalSource = fs.readFileSync('src/components/BookingModal.jsx', 'utf8');
const wallCardSource = bookingModalSource.slice(
  bookingModalSource.indexOf('function TherapistWallCard'),
  bookingModalSource.indexOf('function ServiceCard')
);
const wallOrderingSource = bookingModalSource.slice(
  bookingModalSource.indexOf('const wallTherapists = useMemo'),
  bookingModalSource.indexOf('const availableServices = useMemo')
);

test('therapist wall filters without reordering the backend recommendation list', () => {
  assert.ok(wallOrderingSource.includes('filterTherapistsForWall({'));
  assert.ok(!wallOrderingSource.includes('.sort('));
  assert.ok(!wallOrderingSource.includes('distanceKm'));
  assert.ok(!wallOrderingSource.includes('recommendationScore'));
});

test('only isNew cards render the restrained top-left NEW badge', () => {
  assert.ok(wallCardSource.includes('therapist.isNew === true'));
  assert.ok(wallCardSource.includes('data-testid="therapist-new-badge"'));
  assert.ok(wallCardSource.includes('absolute left-3 top-3'));
  assert.ok(wallCardSource.includes('>NEW</span>'));
});

test('site-batch-04 earliest availability and resting warning contracts remain intact', () => {
  assert.ok(wallCardSource.includes('therapist.onShift === true && therapist.earliestAvailable'));
  assert.ok(bookingModalSource.includes('therapist.onShift !== true'));
  assert.ok(bookingModalSource.includes('Therapist is currently resting, low chance of accepting orders, do you still want to continue?'));
  assert.ok(bookingModalSource.includes('Continue anyway'));
});
