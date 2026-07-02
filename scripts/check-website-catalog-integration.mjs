import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeWebsiteBookingRequest } from '../src/lib/bookingRequestPayload.mjs';
import { getFallbackWebsiteBookingCatalog, normalizePublicBookingCatalog } from '../src/lib/bookingCatalogNormalizer.mjs';
import {
  findBookingServiceByName,
  findExactDurationOption,
  findWebsiteTherapist,
  servicesForTherapist
} from '../src/lib/therapistServiceBookingFlow.mjs';

const DEFAULT_CATALOG_URL = 'https://staging.easygospa.com/api/public/booking-catalog';

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

async function fetchCatalog() {
  const response = await fetch(process.env.AIOFFICE_BOOKING_CATALOG_API_URL || DEFAULT_CATALOG_URL, { cache: 'no-store' });
  const payload = await response.json();
  assert.equal(response.ok, true);
  assert.equal(payload.ok, true);
  return payload;
}

const rawCatalog = await fetchCatalog();
const normalized = normalizePublicBookingCatalog(rawCatalog);

test('AI Office public catalog normalizes for website booking flow', () => {
  assert.equal(normalized.catalogSource, 'ai_office_public_catalog');
  assert.equal(normalized.fallback, false);
  assert.equal(normalized.catalogUnavailable, false);
  assert.ok(normalized.therapists.some(therapist => therapist.name === 'Makati Relaxation Therapist'));
  assert.ok(normalized.services.some(service => service.name === 'Thai Dry Massage'));
});

test('Makati therapist exposes Thai Dry Massage from catalog relation', () => {
  const therapist = findWebsiteTherapist('therapist-makati-relaxation', normalized.therapists);
  assert.equal(therapist.name, 'Makati Relaxation Therapist');
  const services = servicesForTherapist(therapist.id, normalized.therapists, normalized.services);
  assert.ok(services.some(service => service.name === 'Thai Dry Massage'));
});

test('Thai Dry Massage 120 mins is PHP 4900 from catalog API', () => {
  const service = findBookingServiceByName('Thai Dry Massage', normalized.services);
  assert.ok(service);
  const option = findExactDurationOption(service, 120);
  assert.equal(option.durationMinutes, 120);
  assert.equal(option.price, 4900);
  assert.equal(option.currency, 'PHP');
});

test('hidden or inactive catalog rows are not normalized for website display', () => {
  const hiddenCatalog = normalizePublicBookingCatalog({
    ok: true,
    brand: 'EasyGoSpa',
    currency: 'PHP',
    therapists: [
      { therapistId: 'hidden-therapist', displayName: 'Hidden Therapist', status: 'inactive', isVisibleOnWebsite: true, serviceAreas: ['BGC'], specialties: ['Thai Dry Massage'] },
      { therapistId: 'visible-therapist', displayName: 'Visible Therapist', status: 'active', isVisibleOnWebsite: true, serviceAreas: ['Makati'], specialties: ['Thai Dry Massage'] }
    ],
    services: [
      { serviceId: 'thai-dry-massage', serviceName: 'Thai Dry Massage', status: 'active', isVisibleOnWebsite: true },
      { serviceId: 'hidden-service', serviceName: 'Hidden Service', status: 'hidden', isVisibleOnWebsite: true }
    ],
    options: [
      { optionId: 'thai-120', serviceId: 'thai-dry-massage', durationMinutes: 120, price: 4900, currency: 'PHP', status: 'active', isVisibleOnWebsite: true },
      { optionId: 'hidden-60', serviceId: 'hidden-service', durationMinutes: 60, price: 1, currency: 'PHP', status: 'active', isVisibleOnWebsite: true }
    ],
    relations: [
      { therapistId: 'hidden-therapist', serviceId: 'thai-dry-massage', status: 'active', isVisibleOnWebsite: true },
      { therapistId: 'visible-therapist', serviceId: 'thai-dry-massage', status: 'active', isVisibleOnWebsite: true }
    ]
  });
  assert.ok(!hiddenCatalog.therapists.some(therapist => therapist.id === 'hidden-therapist'));
  assert.ok(!hiddenCatalog.services.some(service => service.id === 'hidden-service'));
  assert.ok(hiddenCatalog.therapists.some(therapist => therapist.id === 'visible-therapist'));
});

test('fallback seed remains usable when public catalog is unavailable', () => {
  const fallback = getFallbackWebsiteBookingCatalog('unit_test');
  assert.equal(fallback.catalogSource, 'local_seed_fallback');
  assert.ok(fallback.therapists.some(therapist => therapist.id === 'therapist-makati-relaxation'));
  const service = findBookingServiceByName('Thai Dry Massage', fallback.services);
  assert.equal(findExactDurationOption(service, 120).price, 4900);
});

test('catalog-backed booking payload preserves selected duration, price, and source', () => {
  const service = findBookingServiceByName('Thai Dry Massage', normalized.services);
  const option = findExactDurationOption(service, 120);
  const therapist = findWebsiteTherapist('therapist-makati-relaxation', normalized.therapists);
  const payload = normalizeWebsiteBookingRequest({
    customerName: 'Website Catalog Integration Smoke',
    customerEmail: 'website-catalog-integration-smoke@example.com',
    phone: '+639000008900',
    requestedTechnicianId: therapist.id,
    requestedTechnicianName: therapist.name,
    therapistPreference: 'specific_therapist',
    selectedServices: [{ serviceName: service.name, durationMinutes: option.durationMinutes, price: option.price, currency: option.currency }],
    service: service.name,
    durationMinutes: option.durationMinutes,
    totalAmount: option.price,
    currency: option.currency,
    preferredDate: '2026-07-04',
    preferredTime: '20:00',
    area: 'Makati',
    addressNote: 'Website catalog integration smoke condo / building only',
    paymentMethod: 'cash_after_service',
    paymentStatus: 'pending_collection',
    paymentTiming: 'after_service',
    metadata: {
      catalogSource: normalized.catalogSource,
      bookingFlow: 'therapist_wall_detail_service_cash'
    }
  });
  assert.equal(payload.requestedTechnicianName, 'Makati Relaxation Therapist');
  assert.equal(payload.service, 'Thai Dry Massage');
  assert.equal(payload.durationMinutes, 120);
  assert.equal(payload.totalAmount, 4900);
  assert.equal(payload.selectedServices[0].durationMinutes, 120);
  assert.equal(payload.selectedServices[0].price, 4900);
  assert.equal(payload.metadata.catalogSource, 'ai_office_public_catalog');
});

test('BookingModal fetches website catalog proxy and includes catalog source', () => {
  const source = fs.readFileSync('src/components/BookingModal.jsx', 'utf8');
  assert.ok(source.includes("fetch('/api/booking-catalog'"));
  assert.ok(source.includes('catalogSource: bookingCatalog.catalogSource'));
  assert.ok(source.includes('getFallbackWebsiteBookingCatalog'));
});
