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

// The seed service 'Thai Dry Massage' was retired when the real business catalog
// replaced test data, so live-catalog assertions are data-driven instead of
// hard-coding a service name or price.
test('AI Office public catalog normalizes for website booking flow', () => {
  assert.equal(normalized.catalogSource, 'ai_office_public_catalog');
  assert.equal(normalized.fallback, false);
  assert.equal(normalized.catalogUnavailable, false);
  assert.ok(normalized.therapists.some(therapist => therapist.catalogSource === 'ai_office_public_catalog' && therapist.id !== 'any_available'));
  assert.ok(normalized.services.length > 0);
  assert.ok(normalized.services.every(service => service.name));
});

test('valid public catalog therapist exposes real services from catalog relations', () => {
  const therapist = normalized.therapists.find(item => item.id !== 'any_available');
  assert.ok(therapist);
  assert.ok(therapist.name);
  assert.ok(therapist.profileName);
  assert.ok(therapist.technicianAccountId);
  const services = servicesForTherapist(therapist.id, normalized.therapists, normalized.services);
  assert.ok(services.length > 0);
  const catalogServiceNames = new Set(normalized.services.map(service => service.name));
  assert.ok(services.every(service => catalogServiceNames.has(service.name)));
});

test('a live catalog service resolves a priced PHP duration option', () => {
  const service = normalized.services.find(item => Array.isArray(item.durationOptions) && item.durationOptions.length > 0);
  assert.ok(service);
  const byName = findBookingServiceByName(service.name, normalized.services);
  assert.equal(byName?.id, service.id);
  const option = findExactDurationOption(service, service.durationOptions[0].durationMinutes);
  assert.ok(option);
  assert.ok(Number.isFinite(option.durationMinutes) && option.durationMinutes > 0);
  assert.ok(Number.isFinite(option.price) && option.price > 0);
  assert.equal(option.currency || 'PHP', 'PHP');
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

test('fallback catalog keeps booking usable without exposing named seed therapists', () => {
  const fallback = getFallbackWebsiteBookingCatalog('unit_test');
  assert.equal(fallback.catalogSource, 'catalog_unavailable_safe_fallback');
  assert.equal(fallback.catalogUnavailable, true);
  assert.deepEqual(fallback.therapists.map(therapist => therapist.name), ['Any available therapist']);
  assert.ok(!fallback.therapists.some(therapist => ['Grace', 'Luna'].includes(therapist.name)));
  const service = findBookingServiceByName('Thai Dry Massage', fallback.services);
  assert.equal(findExactDurationOption(service, 120).price, 4900);
});

test('catalog-backed booking payload preserves selected duration, price, and source', () => {
  const service = normalized.services.find(item => Array.isArray(item.durationOptions) && item.durationOptions.length > 0);
  assert.ok(service);
  const option = findExactDurationOption(service, service.durationOptions[0].durationMinutes);
  assert.ok(option);
  const therapist = normalized.therapists.find(item => item.id !== 'any_available');
  assert.ok(therapist);
  const payload = normalizeWebsiteBookingRequest({
    customerName: 'Website Catalog Integration Smoke',
    customerEmail: 'website-catalog-integration-smoke@example.com',
    phone: '+639000008900',
    requestedTechnicianId: therapist.id,
    requestedTechnicianName: therapist.name,
    requestedTechnicianProfileId: therapist.profileId,
    requestedTechnicianProfileName: therapist.profileName,
    requestedTechnicianAccountId: therapist.technicianAccountId,
    requestedTechnicianAccountName: therapist.technicianAccountName,
    therapistPreference: 'specific_therapist',
    selectedServices: [{ serviceId: service.id, serviceName: service.name, durationMinutes: option.durationMinutes, price: option.price, currency: option.currency }],
    serviceId: service.id,
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
  assert.equal(payload.requestedTechnicianName, therapist.name);
  assert.equal(payload.requestedTechnicianProfileName, therapist.profileName);
  assert.equal(payload.requestedTechnicianAccountId, therapist.technicianAccountId);
  assert.equal(payload.serviceId, service.id);
  assert.equal(payload.service, service.name);
  assert.equal(payload.durationMinutes, option.durationMinutes);
  assert.equal(payload.totalAmount, option.price);
  assert.equal(payload.selectedServices[0].durationMinutes, option.durationMinutes);
  assert.equal(payload.selectedServices[0].price, option.price);
  assert.equal(payload.metadata.catalogSource, 'ai_office_public_catalog');
});

test('BookingModal fetches website catalog proxy and includes catalog source', () => {
  const source = fs.readFileSync('src/components/BookingModal.jsx', 'utf8');
  assert.ok(source.includes("apiUrl('/api/booking-catalog')"));
  assert.ok(source.includes('await fetch(catalogUrl'));
  assert.ok(source.includes('catalogSource: bookingCatalog.catalogSource'));
  assert.ok(source.includes('getFallbackWebsiteBookingCatalog'));
});
