import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizePublicBookingCatalog } from '../src/lib/bookingCatalogNormalizer.mjs';

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
      therapistId: 'on-shift-therapist',
      displayName: 'On Shift Therapist',
      onShift: true,
      earliestAvailable: '14:30',
      status: 'active',
      isVisibleOnWebsite: true,
      serviceAreas: ['BGC']
    },
    {
      therapistId: 'resting-therapist',
      displayName: 'Resting Therapist',
      onShift: false,
      earliestAvailable: '16:00',
      status: 'active',
      isVisibleOnWebsite: true,
      serviceAreas: ['Makati']
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
    { therapistId: 'on-shift-therapist', serviceId: 'swedish-massage', status: 'active', isVisibleOnWebsite: true },
    { therapistId: 'resting-therapist', serviceId: 'swedish-massage', status: 'active', isVisibleOnWebsite: true }
  ]
});

test('batch-23 shift availability fields survive catalog normalization', () => {
  const onShift = normalized.therapists.find(therapist => therapist.id === 'on-shift-therapist');
  const resting = normalized.therapists.find(therapist => therapist.id === 'resting-therapist');

  assert.equal(onShift?.onShift, true);
  assert.equal(onShift?.earliestAvailable, '14:30');
  assert.equal(resting?.onShift, false);
  assert.equal(resting?.earliestAvailable, '16:00');
});

const bookingModalSource = fs.readFileSync('src/components/BookingModal.jsx', 'utf8');
const wallCardSource = bookingModalSource.slice(
  bookingModalSource.indexOf('function TherapistWallCard'),
  bookingModalSource.indexOf('function ServiceCard')
);

test('therapist wall card shows the green earliest time only for on-shift therapists', () => {
  assert.ok(wallCardSource.includes('therapist.onShift === true && therapist.earliestAvailable'));
  assert.ok(wallCardSource.includes('Earliest {therapist.earliestAvailable}'));
  assert.ok(wallCardSource.includes('data-testid="therapist-earliest-availability"'));
  assert.ok(wallCardSource.includes('text-[#3F7838]'));
  assert.ok(!wallCardSource.includes('Available after confirmation'));
  assert.ok(!wallCardSource.toLowerCase().includes('resting'));
});

const therapistSelectionSource = bookingModalSource.slice(
  bookingModalSource.indexOf('const enterTherapistDetail'),
  bookingModalSource.indexOf('const handleSelectService')
);

test('resting therapist selection warns before reusing the normal booking path', () => {
  for (const copy of [
    'Warning',
    'Therapist is currently resting, low chance of accepting orders, do you still want to continue?',
    'Cancel',
    'Continue anyway'
  ]) {
    assert.ok(bookingModalSource.includes(copy), `warning must include: ${copy}`);
  }

  assert.ok(bookingModalSource.includes("const [pendingRestingTherapistId, setPendingRestingTherapistId] = useState('')"));
  assert.ok(bookingModalSource.includes('data-testid="resting-therapist-warning"'));
  assert.ok(bookingModalSource.includes('role="dialog"'));
  assert.ok(therapistSelectionSource.includes('therapist.onShift !== true'));
  assert.ok(therapistSelectionSource.includes('setPendingRestingTherapistId(therapist.id)'));
  assert.ok(therapistSelectionSource.includes('cancelRestingTherapistSelection'));
  assert.ok(therapistSelectionSource.includes('continueRestingTherapistSelection'));
  assert.ok(therapistSelectionSource.match(/enterTherapistDetail\(therapist\)/g)?.length >= 2);
});
