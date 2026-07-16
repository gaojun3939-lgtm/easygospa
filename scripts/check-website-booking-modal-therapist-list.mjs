import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeWebsiteBookingRequest } from '../src/lib/bookingRequestPayload.mjs';
import { getFallbackWebsiteBookingCatalog, normalizePublicBookingCatalog } from '../src/lib/bookingCatalogNormalizer.mjs';
import {
  concreteTherapistsForWall,
  findBookingServiceByName,
  findExactDurationOption,
  findWebsiteTherapist,
  servicesForTherapist,
  websiteTherapists
} from '../src/lib/therapistServiceBookingFlow.mjs';

function check(condition, message) {
  assert.ok(condition, message);
  console.log(`[booking-modal-therapist-list] PASS ${message}`);
}

const modalSource = fs.readFileSync('src/components/BookingModal.jsx', 'utf8');
const therapistFlowSource = fs.readFileSync('src/lib/therapistServiceBookingFlow.mjs', 'utf8');
const normalizerSource = fs.readFileSync('src/lib/bookingCatalogNormalizer.mjs', 'utf8');
const defaultTherapistImageUrl = '/images/placeholders/default-therapist.svg';
const defaultTherapistImagePath = 'public/images/placeholders/default-therapist.svg';
const wallCardSource = modalSource.slice(
  modalSource.indexOf('function TherapistWallCard'),
  modalSource.indexOf('function ServiceCard')
);
const avatarSource = modalSource.slice(
  modalSource.indexOf('function TherapistAvatar'),
  modalSource.indexOf('function TherapistWallCard')
);

check(modalSource.includes("useState('wall')"), 'BookingModal opens on therapist list state');
check(modalSource.includes("setStep('wall')"), 'open booking event resets to therapist list');
check(modalSource.includes('Search therapist...'), 'therapist list search placeholder is concise');
check(modalSource.includes('All service areas') && modalSource.includes('data-testid="therapist-area-filter"'), 'therapist list exposes an honest functional area filter');
check(modalSource.includes('data-testid={`therapist-card-book-${therapist.id}`}'), 'Book button is directly addressable on each therapist card');
check(modalSource.includes('data-testid="booking-therapist-list"'), 'therapist list has a dedicated compact list container');
check(modalSource.includes('data-testid="booking-catalog-unavailable"'), 'catalog unavailable state is rendered inline on therapist wall');
check(!modalSource.includes('data-testid="booking-any-available-fallback"'), 'Any available is no longer offered as a selectable fallback card');
check(modalSource.includes("getFallbackWebsiteBookingCatalog('specific_therapist_unavailable')"), 'Any available survives only as internal fallback resolution');
check(modalSource.includes('No specific therapist is available right now.') && modalSource.includes('Please try again in a few minutes, or message us on WhatsApp to book.'), 'catalog unavailable state uses owner-approved safe copy');
check(modalSource.includes('data-testid="booking-wall-toolbar"'), 'wall uses compact app-style toolbar');
check(modalSource.includes('data-testid="booking-wall-filters"'), 'wall uses compact filter row');
check(!modalSource.includes('Step 1 of 5'), 'wall hides step copy on the dense therapist-list screen');
check(modalSource.includes('sm:grid-cols-2'), 'desktop therapist list supports compact two-column layout');
check(modalSource.includes('overflow-y-auto'), 'therapist list area scrolls internally');
check(wallCardSource.includes('min-h-[112px]'), 'therapist list cards leave room for readable metadata and status');
check(avatarSource.includes("mode === 'wall'") && avatarSource.includes('h-[88px] w-[88px]'), 'therapist list uses compact image sizing');
check(!wallCardSource.includes('h-24 w-24'), 'therapist list does not use large detail avatar sizing');
check(wallCardSource.includes('h-11') && wallCardSource.includes('px-4'), 'therapist list Book button has a mobile touch target');
check(!wallCardSource.includes('w-full rounded') && !wallCardSource.includes('w-full items-center'), 'therapist list Book button is not full-width');
check(!wallCardSource.includes('min-h-[118px]'), 'therapist list cards are not tall marketing cards');
check(!wallCardSource.includes('h-10 min-w-20'), 'therapist list Book button is not a large pill');
check(fs.existsSync(defaultTherapistImagePath), 'default therapist placeholder svg exists locally');
const placeholderSource = fs.existsSync(defaultTherapistImagePath) ? fs.readFileSync(defaultTherapistImagePath, 'utf8') : '';
check(!/(?:href|src)=["']https?:\/\//i.test(placeholderSource), 'default therapist placeholder has no external image references');
check(!/\bBD\b|\bMR\b/.test(placeholderSource), 'default therapist placeholder is not a BD/MR letter avatar');
check(therapistFlowSource.includes(`DEFAULT_THERAPIST_IMAGE_URL = '${defaultTherapistImageUrl}'`), 'therapist flow defines local default therapist image URL');
check(therapistFlowSource.includes('fallbackImageUrl'), 'therapist flow exposes fallback image metadata');
check(normalizerSource.includes('listImageUrl') && normalizerSource.includes('detailImageUrl') && normalizerSource.includes('fallbackImageUrl'), 'catalog normalizer preserves therapist image metadata fields');
check(avatarSource.includes('resolveTherapistImageUrl'), 'BookingModal resolves therapist image through approved helper');
check(modalSource.includes('supabase') && modalSource.includes('/storage/v1/object/public/therapist-images/'), 'BookingModal allows controlled Supabase therapist upload URLs');
check(avatarSource.includes('loading="lazy"'), 'BookingModal therapist image uses lazy loading');
check(avatarSource.includes('object-cover'), 'BookingModal therapist image uses object-cover');
check(avatarSource.includes('src={imageUrl}'), 'BookingModal therapist avatar renders an image element');
check(!avatarSource.includes('backgroundImage'), 'BookingModal therapist avatar does not use CSS background-image');
check(!modalSource.includes('Pick a real service profile first'), 'therapist wall removes explanatory copy');
check(!modalSource.includes('Need help matching?'), 'therapist wall does not spend space on matching helper copy');
check(!modalSource.includes('CompactAnyAvailableCard'), 'Any available is not rendered as a therapist-list card');
check(!wallCardSource.includes('therapist.specialties.map'), 'therapist list cards do not render service tags');
check(!wallCardSource.includes('therapist.serviceArea'), 'therapist list cards do not render long service-area copy');
check(!wallCardSource.includes('therapist.specialtyDescription'), 'therapist list cards do not render therapist descriptions');
check(modalSource.includes("setStep('detail')"), 'clicking therapist enters detail state');
check(!modalSource.includes('data-testid="service-duration-book"'), 'service cards do not render conflicting Book actions');
check(modalSource.includes('data-testid="detail-book"'), 'sticky detail summary owns the single Book action');
check(modalSource.includes("setStep('email')"), 'the primary Book action advances to the existing email/info flow');

const wallTherapists = concreteTherapistsForWall('', websiteTherapists);
check(wallTherapists.length >= 2, 'therapist wall has concrete therapist cards');
check(wallTherapists.every(therapist => therapist.id !== 'any_available'), 'Any available therapist is not a real therapist card');
check(wallTherapists.some(therapist => therapist.name === 'Grace'), 'Grace appears as a real therapist');
check(wallTherapists.some(therapist => therapist.name === 'Luna'), 'Luna appears as a real therapist');
check(!wallTherapists.some(therapist => ['BGC Deep Tissue Therapist', 'Makati Relaxation Therapist'].includes(therapist.name)), 'catalog profile names are not displayed as people');
check(!wallTherapists.some(therapist => ['BD', 'MR'].includes(therapist.avatarInitials)), 'BD/MR initials are not used for fallback avatars');
check(wallTherapists.every(therapist => therapist.fallbackImageUrl === defaultTherapistImageUrl), 'missing therapist photos use local default therapist placeholder metadata');
check(wallTherapists.every(therapist => !/^https?:\/\//i.test(therapist.fallbackImageUrl || '')), 'therapist fallback image metadata does not use external URLs');
check(wallTherapists.every(therapist => therapist.reviewsLabel === 'No verified reviews yet'), 'missing real reviews show safe review copy');
check(wallTherapists.every(therapist => !/\b\d+(\.\d+)?\s*km\b/i.test(therapist.distanceLabel)), 'therapist cards do not fake GPS distance');
check(wallTherapists.every(therapist => therapist.availabilityLabel === 'Available after schedule confirmation'), 'therapist cards do not fake earliest appointment time');

const fallbackCatalog = getFallbackWebsiteBookingCatalog('unit_test_catalog_unavailable');
const fallbackNames = fallbackCatalog.therapists.map(therapist => therapist.name);
check(fallbackCatalog.catalogUnavailable === true, 'fallback catalog is marked unavailable');
check(fallbackCatalog.catalogSource === 'catalog_unavailable_safe_fallback', 'fallback catalog source cannot be mistaken for public catalog');
check(fallbackNames.length === 1 && fallbackNames[0] === 'Any available therapist', 'fallback catalog only exposes safe any available therapist');
check(!fallbackNames.includes('Grace') && !fallbackNames.includes('Luna'), 'fallback catalog does not expose named local seed therapists');

const uploadedAvatarUrl = 'https://demo.supabase.co/storage/v1/object/public/therapist-images/brand-a/therapist-bgc-deep-tissue/avatar-123.webp';
const uploadedDetailUrl = 'https://demo.supabase.co/storage/v1/object/public/therapist-images/brand-a/therapist-bgc-deep-tissue/detail-123.webp';
const uploadedCatalog = normalizePublicBookingCatalog({
  brand: 'EasyGoSpa',
  business: 'Home Massage',
  currency: 'PHP',
  therapists: [{ therapistId: 'therapist-bgc-deep-tissue', displayName: 'BGC Deep Tissue Therapist', technicianAccountId: 'th-a-001', technicianAccountName: 'Grace', avatarUrl: uploadedAvatarUrl, listImageUrl: uploadedAvatarUrl, detailImageUrl: uploadedDetailUrl, serviceAreas: ['BGC'], specialties: ['Deep Tissue Massage'], status: 'active', isVisibleOnWebsite: true }],
  services: [{ serviceId: 'deep-tissue-massage', serviceName: 'Deep Tissue Massage', description: 'Deep tissue', category: 'Massage', status: 'active', isVisibleOnWebsite: true }],
  options: [{ optionId: 'deep-tissue-massage-120', serviceId: 'deep-tissue-massage', durationMinutes: 120, price: 5200, currency: 'PHP', status: 'active', isVisibleOnWebsite: true }],
  relations: [{ therapistId: 'therapist-bgc-deep-tissue', serviceId: 'deep-tissue-massage', isVisibleOnWebsite: true }]
});
const uploadedGrace = uploadedCatalog.therapists.find(therapist => therapist.name === 'Grace');
check(uploadedGrace?.avatarUrl === uploadedAvatarUrl && uploadedGrace?.detailImageUrl === uploadedDetailUrl, 'uploaded therapist image fields survive website normalization');
check(uploadedGrace?.fallbackImageUrl === defaultTherapistImageUrl, 'uploaded therapist still keeps local fallback image metadata');

const grace = findWebsiteTherapist('therapist-bgc-deep-tissue');
check(grace.name === 'Grace', 'Grace is selected by profile id');
check(grace.profileName === 'BGC Deep Tissue Therapist', 'Grace keeps profile name for payload compatibility');
check(grace.technicianAccountId === 'th-a-001', 'Grace keeps technician account id');
check(grace.technicianAccountName === 'Grace', 'Grace keeps technician account name');

const graceServices = servicesForTherapist(grace.id);
check(
  JSON.stringify(graceServices.map(service => service.name)) === JSON.stringify(['Deep Tissue Massage', 'Swedish Massage']),
  'Grace detail lists her services in therapist service order'
);

const deepTissue = findBookingServiceByName('Deep Tissue Massage', graceServices);
const deepTissue120 = findExactDurationOption(deepTissue, 120);
check(deepTissue120?.price === 5200, 'Grace Deep Tissue Massage 120 mins is PHP 5200');

const payload = normalizeWebsiteBookingRequest({
  customerName: 'Booking Modal Therapist List Smoke',
  customerEmail: 'booking-modal-therapist-list@example.com',
  phone: '+639000001200',
  requestedTechnicianId: grace.id,
  requestedTechnicianName: grace.name,
  requestedTechnicianProfileId: grace.profileId,
  requestedTechnicianProfileName: grace.profileName,
  requestedTechnicianAccountId: grace.technicianAccountId,
  requestedTechnicianAccountName: grace.technicianAccountName,
  therapistPreference: 'specific_therapist',
  selectedServices: [{
    serviceId: deepTissue.id,
    serviceName: deepTissue.name,
    durationMinutes: deepTissue120.durationMinutes,
    price: deepTissue120.price,
    currency: 'PHP'
  }],
  serviceId: deepTissue.id,
  service: deepTissue.name,
  durationMinutes: deepTissue120.durationMinutes,
  totalAmount: deepTissue120.price,
  preferredDate: '2026-07-05',
  preferredTime: '20:00',
  area: 'BGC',
  addressNote: 'Booking modal therapist list smoke condo / building only',
  paymentMethod: 'cash_after_service'
});

check(payload.requestedTechnicianProfileId === 'therapist-bgc-deep-tissue', 'payload keeps requestedTechnicianProfileId');
check(payload.requestedTechnicianAccountId === 'th-a-001', 'payload keeps requestedTechnicianAccountId');
check(payload.requestedTechnicianAccountName === 'Grace', 'payload keeps requestedTechnicianAccountName');
check(payload.serviceName === 'Deep Tissue Massage', 'payload keeps serviceName');
check(payload.durationMinutes === 120, 'payload keeps durationMinutes');
check(payload.totalAmount === 5200 && payload.selectedServices[0].price === 5200, 'payload keeps selected price');
check(payload.paymentMethod === 'cash_after_service', 'payload remains cash after service');

const anyAvailable = normalizeWebsiteBookingRequest({
  customerName: 'Any Available Smoke',
  customerEmail: 'any-available-smoke@example.com',
  phone: '+639000001201',
  requestedTechnicianId: 'any_available',
  requestedTechnicianName: 'Any available therapist',
  requestedTechnicianProfileId: 'any_available',
  requestedTechnicianProfileName: 'Any available therapist',
  therapistPreference: 'any_available',
  selectedServices: [{ serviceId: deepTissue.id, serviceName: deepTissue.name, durationMinutes: 120, price: 5200, currency: 'PHP' }],
  serviceId: deepTissue.id,
  service: deepTissue.name,
  durationMinutes: 120,
  totalAmount: 5200,
  preferredDate: '2026-07-05',
  preferredTime: '20:00',
  area: 'BGC',
  addressNote: 'Any available smoke condo / building only'
});

check(!anyAvailable.requestedTechnicianAccountId, 'Any available does not become a technician account');
check(!anyAvailable.metadata.requestedTechnicianAccountId, 'Any available metadata does not contain technician account id');
