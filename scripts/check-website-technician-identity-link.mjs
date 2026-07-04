import assert from 'assert/strict';
import { normalizePublicBookingCatalog } from '../src/lib/bookingCatalogNormalizer.mjs';
import { normalizeWebsiteBookingRequest } from '../src/lib/bookingRequestPayload.mjs';

function check(condition, message) {
  assert.ok(condition, message);
  console.log(`[website-technician-identity-link] PASS ${message}`);
}

const catalog = normalizePublicBookingCatalog({
  ok: true,
  brand: 'EasyGoSpa',
  business: 'Home Massage',
  currency: 'PHP',
  therapists: [
    {
      therapistId: 'therapist-bgc-deep-tissue',
      displayName: 'BGC Deep Tissue Therapist',
      technicianAccountId: 'th-a-001',
      technicianAccountName: 'Grace',
      initialsAvatar: 'BD',
      description: 'Best suited for deeper pressure and post-work tension relief.',
      serviceAreas: ['BGC', 'Taguig'],
      specialties: ['Deep Tissue Massage', 'Swedish Massage'],
      status: 'active',
      isVisibleOnWebsite: true,
      sortOrder: 10
    },
    {
      therapistId: 'any_available',
      displayName: 'Any available therapist',
      initialsAvatar: 'EA',
      description: 'Let our team match your request with an available therapist.',
      serviceAreas: ['Metro Manila coverage depends on schedule'],
      specialties: ['Deep Tissue Massage'],
      status: 'active',
      isVisibleOnWebsite: true,
      sortOrder: 20
    }
  ],
  services: [
    {
      serviceId: 'deep-tissue-massage',
      serviceName: 'Deep Tissue Massage',
      category: 'Massage',
      status: 'active',
      isVisibleOnWebsite: true
    }
  ],
  options: [
    {
      optionId: 'deep-tissue-massage-90',
      serviceId: 'deep-tissue-massage',
      durationMinutes: 90,
      price: 4200,
      currency: 'PHP',
      status: 'active',
      isVisibleOnWebsite: true
    }
  ],
  relations: [
    {
      therapistId: 'therapist-bgc-deep-tissue',
      serviceId: 'deep-tissue-massage',
      isVisibleOnWebsite: true
    },
    {
      therapistId: 'any_available',
      serviceId: 'deep-tissue-massage',
      isVisibleOnWebsite: true
    }
  ]
});

const bgc = catalog.therapists.find(therapist => therapist.id === 'therapist-bgc-deep-tissue');
check(Boolean(bgc), 'BGC Deep Tissue Therapist is available on therapist wall');
check(bgc.profileId === 'therapist-bgc-deep-tissue', 'website therapist keeps catalog profile id');
check(bgc.profileName === 'BGC Deep Tissue Therapist', 'website therapist keeps catalog profile name');
check(bgc.technicianAccountId === 'th-a-001', 'website therapist exposes mapped technicianAccountId');
check(bgc.technicianAccountName === 'Grace', 'website therapist exposes mapped technicianAccountName');

const booking = normalizeWebsiteBookingRequest({
  customerName: 'Website Technician Identity Link',
  customerEmail: 'website-tech-identity@example.com',
  phone: '+639000008910',
  requestedTechnicianId: bgc.id,
  requestedTechnicianName: bgc.name,
  requestedTechnicianProfileId: bgc.profileId,
  requestedTechnicianProfileName: bgc.profileName,
  requestedTechnicianAccountId: bgc.technicianAccountId,
  requestedTechnicianAccountName: bgc.technicianAccountName,
  therapistPreference: 'specific_therapist',
  selectedServices: [{ serviceName: 'Deep Tissue Massage', durationMinutes: 90, price: 4200, currency: 'PHP' }],
  service: 'Deep Tissue Massage',
  durationMinutes: 90,
  totalAmount: 4200,
  preferredDate: '2026-07-04',
  preferredTime: '20:00',
  area: 'BGC',
  addressNote: 'Website identity link smoke condo / building only',
  notes: 'Website technician identity link smoke - safe to delete',
  metadata: {
    catalogSource: 'ai_office_public_catalog'
  }
});

check(booking.requestedTechnicianId === 'therapist-bgc-deep-tissue', 'booking payload keeps requested profile id in requestedTechnicianId for compatibility');
check(booking.requestedTechnicianName === 'BGC Deep Tissue Therapist', 'booking payload keeps requested profile name in requestedTechnicianName for compatibility');
check(booking.requestedTechnicianProfileId === 'therapist-bgc-deep-tissue', 'booking payload includes requestedTechnicianProfileId');
check(booking.requestedTechnicianProfileName === 'BGC Deep Tissue Therapist', 'booking payload includes requestedTechnicianProfileName');
check(booking.requestedTechnicianAccountId === 'th-a-001', 'booking payload includes requestedTechnicianAccountId');
check(booking.requestedTechnicianAccountName === 'Grace', 'booking payload includes requestedTechnicianAccountName');
check(booking.metadata.requestedTechnicianProfileId === 'therapist-bgc-deep-tissue', 'booking metadata includes requestedTechnicianProfileId');
check(booking.metadata.requestedTechnicianAccountId === 'th-a-001', 'booking metadata includes requestedTechnicianAccountId');

const anyAvailable = normalizeWebsiteBookingRequest({
  customerName: 'Website Any Available Identity Link',
  customerEmail: 'website-any-available@example.com',
  phone: '+639000008911',
  requestedTechnicianId: 'any_available',
  requestedTechnicianName: 'Any available therapist',
  requestedTechnicianProfileId: 'any_available',
  requestedTechnicianProfileName: 'Any available therapist',
  therapistPreference: 'any_available',
  selectedServices: [{ serviceName: 'Deep Tissue Massage', durationMinutes: 90, price: 4200, currency: 'PHP' }],
  service: 'Deep Tissue Massage',
  durationMinutes: 90,
  totalAmount: 4200,
  preferredDate: '2026-07-04',
  preferredTime: '20:00',
  area: 'BGC',
  addressNote: 'Website any available smoke condo / building only'
});

check(anyAvailable.therapistPreference === 'any_available', 'any_available stays a preference, not a specific technician');
check(!anyAvailable.requestedTechnicianAccountId, 'any_available does not set requestedTechnicianAccountId');
check(!anyAvailable.metadata.requestedTechnicianAccountId, 'any_available metadata does not set requestedTechnicianAccountId');
