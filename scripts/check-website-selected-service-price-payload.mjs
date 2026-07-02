import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeWebsiteBookingRequest } from '../src/lib/bookingRequestPayload.mjs';
import {
  findBookingServiceByName,
  findExactDurationOption,
  servicesForTherapist
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

function buildPayload({ serviceName, durationMinutes, price, technicianId = 'therapist-makati-relaxation', technicianName = 'Makati Relaxation Therapist' }) {
  return normalizeWebsiteBookingRequest({
    customerName: 'Selected Price Fix Smoke',
    customerEmail: 'selected-price-fix-smoke@example.com',
    phone: '+639000008898',
    requestedTechnicianId: technicianId,
    requestedTechnicianName: technicianName,
    therapistPreference: 'specific_therapist',
    selectedServices: [{
      serviceName,
      durationMinutes,
      price,
      currency: 'PHP'
    }],
    service: serviceName,
    durationMinutes,
    totalAmount: price,
    currency: 'PHP',
    preferredDate: '2026-07-04',
    preferredTime: '20:00',
    area: 'Makati',
    addressNote: 'Selected price fix smoke condo / building only',
    peopleCount: 1,
    paymentMethod: 'cash_after_service',
    paymentStatus: 'pending_collection',
    paymentTiming: 'after_service',
    notes: 'Selected price fix smoke - safe to delete',
    source: 'website',
    metadata: {
      website: 'www.easygospa.com',
      form: 'BookingModal',
      submittedFrom: 'public_website',
      bookingFlow: 'therapist_wall_detail_service_cash',
      testRun: 'selected-price-fix-smoke'
    }
  });
}

function assertSelectedPrice(payload, { serviceName, durationMinutes, price }) {
  assert.equal(payload.service, serviceName);
  assert.equal(payload.serviceName, serviceName);
  assert.equal(payload.durationMinutes, durationMinutes);
  assert.equal(payload.serviceDurationMinutes, durationMinutes);
  assert.equal(payload.totalAmount, price);
  assert.equal(payload.quotedPrice, price);
  assert.equal(payload.currency, 'PHP');
  assert.equal(payload.selectedServices[0].serviceName, serviceName);
  assert.equal(payload.selectedServices[0].durationMinutes, durationMinutes);
  assert.equal(payload.selectedServices[0].price, price);
  assert.equal(payload.selectedServices[0].currency, 'PHP');
  assert.equal(payload.metadata.selectedServices[0].durationMinutes, durationMinutes);
  assert.equal(payload.metadata.selectedServices[0].price, price);
  assert.equal(payload.metadata.durationMinutes, durationMinutes);
  assert.equal(payload.metadata.totalAmount, price);
}

test('Makati Thai Dry Massage 120 mins stays PHP 4900 in payload', () => {
  const service = findBookingServiceByName('Thai Dry Massage');
  const option = findExactDurationOption(service, 120);
  assert.equal(option.price, 4900);
  const payload = buildPayload({ serviceName: 'Thai Dry Massage', durationMinutes: 120, price: 4900 });
  assertSelectedPrice(payload, { serviceName: 'Thai Dry Massage', durationMinutes: 120, price: 4900 });
});

test('Makati Thai Dry Massage 60 mins stays PHP 3000 in payload', () => {
  const service = findBookingServiceByName('Thai Dry Massage');
  const option = findExactDurationOption(service, 60);
  assert.equal(option.price, 3000);
  const payload = buildPayload({ serviceName: 'Thai Dry Massage', durationMinutes: 60, price: 3000 });
  assertSelectedPrice(payload, { serviceName: 'Thai Dry Massage', durationMinutes: 60, price: 3000 });
});

test('BGC Deep Tissue Massage 90 mins stays PHP 4200 in payload', () => {
  const service = findBookingServiceByName('Deep Tissue Massage');
  const option = findExactDurationOption(service, 90);
  assert.equal(option.price, 4200);
  const payload = buildPayload({
    serviceName: 'Deep Tissue Massage',
    durationMinutes: 90,
    price: 4200,
    technicianId: 'therapist-bgc-deep-tissue',
    technicianName: 'BGC Deep Tissue Therapist'
  });
  assertSelectedPrice(payload, { serviceName: 'Deep Tissue Massage', durationMinutes: 90, price: 4200 });
});

test('selectedServices wins over stale top-level duration and total', () => {
  const payload = normalizeWebsiteBookingRequest({
    customerName: 'Selected Price Fix Smoke',
    customerEmail: 'selected-price-fix-smoke@example.com',
    phone: '+639000008898',
    requestedTechnicianId: 'therapist-makati-relaxation',
    requestedTechnicianName: 'Makati Relaxation Therapist',
    therapistPreference: 'specific_therapist',
    selectedServices: [{ serviceName: 'Thai Dry Massage', durationMinutes: 120, price: 4900, currency: 'PHP' }],
    service: 'Thai Dry Massage',
    durationMinutes: 60,
    totalAmount: 3000,
    preferredDate: '2026-07-04',
    preferredTime: '20:00',
    area: 'Makati',
    addressNote: 'Selected price fix smoke condo / building only'
  });
  assertSelectedPrice(payload, { serviceName: 'Thai Dry Massage', durationMinutes: 120, price: 4900 });
});

test('Makati therapist exposes Thai Dry Massage 120 min option', () => {
  const services = servicesForTherapist('therapist-makati-relaxation');
  const thaiDry = services.find(service => service.name === 'Thai Dry Massage');
  assert.ok(thaiDry);
  assert.deepEqual(
    thaiDry.durationOptions.map(option => [option.durationMinutes, option.price]),
    [[60, 3000], [90, 3900], [120, 4900]]
  );
});

test('BookingModal uses exact selected option for submit and success summary', () => {
  const modalSource = fs.readFileSync('src/components/BookingModal.jsx', 'utf8');
  assert.ok(modalSource.includes('resolveSelectedServiceOption'));
  assert.ok(modalSource.includes('findExactDurationOption'));
  assert.ok(modalSource.includes('const selectedOption = selectedServiceOption'));
  assert.ok(modalSource.includes('price: selectedOption.price'));
  assert.ok(modalSource.includes('totalAmount: selectedOption.price'));
  assert.ok(modalSource.includes('durationMinutes: selectedOption.durationMinutes'));
  assert.ok(!modalSource.includes('price: Number(formData.totalAmount)'));
});
