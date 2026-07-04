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
      therapistId: 'therapist-makati-relaxation',
      displayName: 'Makati Relaxation Therapist',
      technicianAccountId: 'th-a-002',
      technicianAccountName: 'Luna',
      initialsAvatar: 'MR',
      description: 'Focused on relaxation, stretching, and hotel or condo service.',
      serviceAreas: ['Makati', 'BGC'],
      specialties: ['Swedish Massage', 'Thai Dry Massage', 'Foot Massage'],
      status: 'active',
      isVisibleOnWebsite: true,
      sortOrder: 15
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
    },
    {
      serviceId: 'thai-dry-massage',
      serviceName: 'Thai Dry Massage',
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
    },
    {
      optionId: 'thai-dry-massage-120',
      serviceId: 'thai-dry-massage',
      durationMinutes: 120,
      price: 4900,
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
    },
    {
      therapistId: 'therapist-makati-relaxation',
      serviceId: 'thai-dry-massage',
      isVisibleOnWebsite: true
    }
  ]
});

const bgc = catalog.therapists.find(therapist => therapist.id === 'therapist-bgc-deep-tissue');
check(Boolean(bgc), 'Grace profile is available on therapist wall');
check(bgc.name === 'Grace', 'website therapist wall displays Grace as the main name');
check(bgc.profileId === 'therapist-bgc-deep-tissue', 'website therapist keeps catalog profile id');
check(bgc.profileName === 'BGC Deep Tissue Therapist', 'website therapist keeps catalog profile name');
check(bgc.technicianAccountId === 'th-a-001', 'website therapist exposes mapped technicianAccountId');
check(bgc.technicianAccountName === 'Grace', 'website therapist exposes mapped technicianAccountName');
check(!['BD', 'MR'].includes(bgc.avatarInitials), 'Grace does not use BD/MR initials avatar fallback');

const makati = catalog.therapists.find(therapist => therapist.id === 'therapist-makati-relaxation');
check(Boolean(makati), 'Luna profile is available on therapist wall');
check(makati.name === 'Luna', 'website therapist wall displays Luna as the main name');
check(makati.profileName === 'Makati Relaxation Therapist', 'Luna keeps Makati catalog profile name');
check(makati.technicianAccountId === 'th-a-002', 'Luna exposes mapped technicianAccountId');
check(makati.technicianAccountName === 'Luna', 'Luna exposes mapped technicianAccountName');
check(!['BD', 'MR'].includes(makati.avatarInitials), 'Luna does not use BD/MR initials avatar fallback');

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
  selectedServices: [{ serviceId: 'deep-tissue-massage', serviceName: 'Deep Tissue Massage', durationMinutes: 90, price: 4200, currency: 'PHP' }],
  serviceId: 'deep-tissue-massage',
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
check(booking.requestedTechnicianName === 'Grace', 'booking payload keeps real technician display name in requestedTechnicianName');
check(booking.requestedTechnicianProfileId === 'therapist-bgc-deep-tissue', 'booking payload includes requestedTechnicianProfileId');
check(booking.requestedTechnicianProfileName === 'BGC Deep Tissue Therapist', 'booking payload includes requestedTechnicianProfileName');
check(booking.requestedTechnicianAccountId === 'th-a-001', 'booking payload includes requestedTechnicianAccountId');
check(booking.requestedTechnicianAccountName === 'Grace', 'booking payload includes requestedTechnicianAccountName');
check(booking.serviceId === 'deep-tissue-massage', 'booking payload includes serviceId');
check(booking.selectedServices[0].serviceId === 'deep-tissue-massage', 'selectedServices includes serviceId');
check(booking.metadata.requestedTechnicianProfileId === 'therapist-bgc-deep-tissue', 'booking metadata includes requestedTechnicianProfileId');
check(booking.metadata.requestedTechnicianAccountId === 'th-a-001', 'booking metadata includes requestedTechnicianAccountId');
check(booking.metadata.serviceId === 'deep-tissue-massage', 'booking metadata includes serviceId');

const lunaBooking = normalizeWebsiteBookingRequest({
  customerName: 'Website Luna Identity Link',
  customerEmail: 'website-luna-identity@example.com',
  phone: '+639000008912',
  requestedTechnicianId: makati.id,
  requestedTechnicianName: makati.name,
  requestedTechnicianProfileId: makati.profileId,
  requestedTechnicianProfileName: makati.profileName,
  requestedTechnicianAccountId: makati.technicianAccountId,
  requestedTechnicianAccountName: makati.technicianAccountName,
  therapistPreference: 'specific_therapist',
  selectedServices: [{ serviceId: 'thai-dry-massage', serviceName: 'Thai Dry Massage', durationMinutes: 120, price: 4900, currency: 'PHP' }],
  serviceId: 'thai-dry-massage',
  service: 'Thai Dry Massage',
  durationMinutes: 120,
  totalAmount: 4900,
  preferredDate: '2026-07-04',
  preferredTime: '20:00',
  area: 'Makati',
  addressNote: 'Website Luna identity link smoke condo / building only'
});

check(lunaBooking.requestedTechnicianAccountId === 'th-a-002', 'Luna booking payload includes th-a-002');
check(lunaBooking.requestedTechnicianAccountName === 'Luna', 'Luna booking payload includes technician account name');

const anyAvailable = normalizeWebsiteBookingRequest({
  customerName: 'Website Any Available Identity Link',
  customerEmail: 'website-any-available@example.com',
  phone: '+639000008911',
  requestedTechnicianId: 'any_available',
  requestedTechnicianName: 'Any available therapist',
  requestedTechnicianProfileId: 'any_available',
  requestedTechnicianProfileName: 'Any available therapist',
  therapistPreference: 'any_available',
  selectedServices: [{ serviceId: 'deep-tissue-massage', serviceName: 'Deep Tissue Massage', durationMinutes: 90, price: 4200, currency: 'PHP' }],
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

assert.throws(() => normalizeWebsiteBookingRequest({
  customerName: 'Invalid Phone Guest',
  customerEmail: 'invalid-phone@example.com',
  phone: 'letters-only',
  selectedServices: [{ serviceId: 'deep-tissue-massage', serviceName: 'Deep Tissue Massage', durationMinutes: 90, price: 4200, currency: 'PHP' }],
  service: 'Deep Tissue Massage',
  durationMinutes: 90,
  totalAmount: 4200,
  preferredDate: '2026-07-04',
  preferredTime: '20:00',
  area: 'BGC',
  addressNote: 'Invalid phone smoke condo / building only'
}), /phone must be a valid WhatsApp or phone number/i);
console.log('[website-technician-identity-link] PASS phone validation rejects pure letters');
