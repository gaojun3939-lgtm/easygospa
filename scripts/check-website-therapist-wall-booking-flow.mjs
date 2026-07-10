import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeWebsiteBookingRequest } from '../src/lib/bookingRequestPayload.mjs';
import {
  findWebsiteTherapist,
  servicesForTherapist,
  websiteTherapists
} from '../src/lib/therapistServiceBookingFlow.mjs';

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

const modalSource = fs.readFileSync('src/components/BookingModal.jsx', 'utf8');
const payloadSource = fs.readFileSync('src/lib/bookingRequestPayload.mjs', 'utf8');

test('Book Now opens therapist wall before email or form details', () => {
  assert.ok(modalSource.includes("useState('wall')"), 'initial step must be therapist wall');
  assert.ok(modalSource.includes("setStep('wall')"), 'open modal must set wall step');
  assert.ok(modalSource.includes('Search therapist...'), 'wall must have search input');
  assert.ok(modalSource.includes('data-testid="booking-therapist-list"'), 'wall must render compact therapist list');
  assert.ok(!modalSource.includes('Pick a real service profile first'), 'wall must not show explanatory copy above the list');
  assert.ok(!modalSource.includes("setStep('email');\n        return nextForm"), 'opening modal must not force email first');
});

test('therapist wall shows concrete therapist cards and any available is not the only option', () => {
  const concrete = websiteTherapists.filter(therapist => therapist.id !== 'any_available');
  assert.ok(concrete.length >= 2, 'need at least two concrete therapist choices');
  assert.ok(websiteTherapists.some(therapist => therapist.id === 'any_available'), 'Any available option missing');
  assert.notEqual(websiteTherapists[0].id, 'any_available', 'Any available must not dominate first position');
  assert.deepEqual(concrete.map(therapist => therapist.name), ['Grace', 'Luna'], 'wall must display real technician names');
  assert.ok(!concrete.some(therapist => ['BGC Deep Tissue Therapist', 'Makati Relaxation Therapist'].includes(therapist.name)), 'wall must not display catalog profile names as people');
  for (const therapist of concrete) {
    assert.ok(therapist.name);
    assert.ok(!['BD', 'MR'].includes(therapist.avatarInitials), 'must not use BD/MR initials avatar fallback');
    assert.equal(therapist.role, 'Massage Therapist');
    assert.equal(therapist.availabilityLabel, 'Available after schedule confirmation');
    assert.ok(therapist.distanceLabel.includes('Serving') || therapist.distanceLabel.includes('Nearby'));
    assert.ok(Array.isArray(therapist.specialties) && therapist.specialties.length > 0);
    assert.ok(!/\d+\.\d\s*km/i.test(therapist.distanceLabel), 'must not fake GPS km distance');
    assert.equal(therapist.rating, null);
    assert.equal(therapist.reviewCount, 0);
    assert.equal(therapist.reviewsLabel, 'No verified reviews yet');
  }
});

test('clicking therapist enters detail page with services and safe review copy', () => {
  assert.ok(modalSource.includes("setStep('detail')"), 'therapist selection must enter detail page');
  assert.ok(modalSource.includes('TherapistDetail'), 'detail component missing');
  assert.ok(modalSource.includes('Massage Therapist'), 'detail must show therapist role');
  assert.ok(modalSource.includes('About Grace') || modalSource.includes('About {therapist.name}'), 'detail must include about section');
  assert.ok(modalSource.includes('No verified reviews yet'), 'detail must show no verified reviews copy');
  assert.ok(modalSource.includes('Clear booking details') && modalSource.includes('Confirmation before dispatch'), 'verifiable care info missing');
  assert.ok(modalSource.includes('Privacy-aware booking'), 'privacy-aware booking copy missing');
  assert.ok(modalSource.includes('My Services'), 'detail services section missing');
  assert.ok(!modalSource.includes('Need help matching?'), 'therapist wall must not show matching helper section');
  assert.ok(!modalSource.includes('{therapist.avatarInitials}'), 'modal must not render initials as avatar fallback');
});

test('service selection on detail precedes email gate and computes total amount', () => {
  const therapist = findWebsiteTherapist('therapist-bgc-deep-tissue');
  const services = servicesForTherapist(therapist.id);
  assert.deepEqual(services.map(service => service.name), ['Deep Tissue Massage', 'Swedish Massage']);
  const service = services.find(item => item.name === 'Deep Tissue Massage');
  assert.ok(service);
  const option = service.durationOptions.find(item => item.durationMinutes === 90);
  assert.equal(option.price, 4200);
  assert.ok(modalSource.includes("setStep('email')"), 'service continue should go to email gate');
  assert.ok(modalSource.includes('sticky') || modalSource.includes('bottom-0'), 'detail must include sticky summary');
  assert.ok(modalSource.includes('data-testid="detail-book"'), 'detail must use one primary Book action');
  assert.ok(!modalSource.includes('data-testid="service-duration-book"'), 'service cards must not have conflicting Book actions');
});

test('Luna service selection is limited to her configured services', () => {
  const therapist = findWebsiteTherapist('therapist-makati-relaxation');
  const services = servicesForTherapist(therapist.id);
  assert.deepEqual(services.map(service => service.name), ['Swedish Massage', 'Thai Dry Massage', 'Foot Massage']);
  const thai = services.find(item => item.name === 'Thai Dry Massage');
  assert.ok(thai);
  assert.equal(thai.durationOptions.find(option => option.durationMinutes === 120)?.price, 4900);
});

test('email gate is after service and customer info is simplified', () => {
  assert.ok(modalSource.includes('Use this email for your booking'));
  assert.ok(!modalSource.includes('verified email'));
  assert.ok(modalSource.includes("setStep('details')"), 'email gate should continue to customer info');
  assert.ok(modalSource.includes('Full name *'));
  assert.ok(modalSource.includes('WhatsApp / Phone *'));
  assert.ok(modalSource.includes('Building, condo, hotel, or exact address *'));
  assert.ok(modalSource.includes('Notes optional'));
});

test('cash confirmation is its own step and payment options stay cash-only', () => {
  assert.ok(modalSource.includes("step === 'confirm'"), 'confirm step missing');
  assert.ok(modalSource.includes('Payment will be collected after the massage service.'));
  assert.ok(modalSource.includes('Cash after service'));
  for (const forbidden of ['GCash', 'Maya', 'QR PH', 'Bank transfer', 'Payment link']) {
    assert.ok(!modalSource.includes(forbidden), `modal must not show ${forbidden}`);
  }
  for (const forbidden of ['gcash', 'maya', 'qrph', 'bank_transfer', 'card', 'payment_link']) {
    assert.ok(!payloadSource.includes(`'${forbidden}'`), `payload must not accept ${forbidden}`);
  }
});

test('payload carries therapist wall flow fields and does not redirect staging', () => {
  const payload = normalizeWebsiteBookingRequest({
    customerName: 'Wall Flow Guest',
    customerEmail: 'wall@example.com',
    phone: '+639000001234',
    requestedTechnicianId: 'therapist-bgc-deep-tissue',
    requestedTechnicianName: 'Grace',
    requestedTechnicianProfileId: 'therapist-bgc-deep-tissue',
    requestedTechnicianProfileName: 'BGC Deep Tissue Therapist',
    requestedTechnicianAccountId: 'th-a-001',
    requestedTechnicianAccountName: 'Grace',
    therapistPreference: 'specific_therapist',
    selectedServices: [{ serviceId: 'deep-tissue-massage', serviceName: 'Deep Tissue Massage', durationMinutes: 90, price: 4200, currency: 'PHP' }],
    serviceId: 'deep-tissue-massage',
    service: 'Deep Tissue Massage',
    durationMinutes: 90,
    totalAmount: 4200,
    preferredDate: '2026-07-05',
    preferredTime: '20:30',
    area: 'BGC',
    addressNote: 'Unit 1, Test Building',
    notes: 'Quiet room please'
  });
  assert.equal(payload.paymentMethod, 'cash_after_service');
  assert.equal(payload.paymentStatus, 'pending_collection');
  assert.equal(payload.paymentTiming, 'after_service');
  assert.equal(payload.requestedTechnicianId, 'therapist-bgc-deep-tissue');
  assert.equal(payload.requestedTechnicianName, 'Grace');
  assert.equal(payload.requestedTechnicianAccountId, 'th-a-001');
  assert.equal(payload.serviceId, 'deep-tissue-massage');
  assert.equal(payload.selectedServices[0].serviceId, 'deep-tissue-massage');
  assert.equal(payload.selectedServices[0].currency, 'PHP');
  assert.equal(payload.durationMinutes, 90);
  assert.equal(payload.totalAmount, 4200);
  assert.equal(payload.metadata.bookingFlow, 'therapist_wall_detail_service_cash');
  assert.ok(modalSource.includes("fetch('/api/booking-request'"));
  assert.ok(modalSource.includes('payload?.ok !== true'));
  assert.ok(!modalSource.includes('staging.easygospa.com'));
});

test('success and validation text are readable and no bad placeholder values are visible', () => {
  assert.ok(modalSource.includes('Booking reference'), 'success page must label booking reference clearly');
  assert.ok(modalSource.includes('font-mono text-[#0F0F0F]'), 'booking reference must use readable dark text');
  assert.ok(modalSource.includes('Please enter a valid WhatsApp or phone number.'), 'phone validation copy missing');
  for (const forbidden of ['Invalid Date', 'undefined', 'null', 'NaN']) {
    assert.ok(!modalSource.includes(`>${forbidden}<`), `modal must not visibly render ${forbidden}`);
  }
});

test('security boundaries remain local UI and booking proxy only', () => {
  for (const forbidden of ['sendWhatsApp', 'sendMessage', 'graph.facebook.com', 'openai', 'gemini', 'createPayment', 'confirmPaid', 'financeLedger', 'assignTechnician']) {
    assert.ok(!modalSource.includes(forbidden), `modal must not contain ${forbidden}`);
    assert.ok(!payloadSource.includes(forbidden), `payload must not contain ${forbidden}`);
  }
});
