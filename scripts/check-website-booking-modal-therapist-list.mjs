import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeWebsiteBookingRequest } from '../src/lib/bookingRequestPayload.mjs';
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
check(modalSource.includes("'Nearby'") && modalSource.includes("'Most booked'") && modalSource.includes("'Service type'"), 'therapist list exposes the requested filter labels');
check(modalSource.includes('data-testid={`therapist-card-book-${therapist.id}`}'), 'Book button is directly addressable on each therapist card');
check(modalSource.includes('data-testid="booking-therapist-list"'), 'therapist list has a dedicated compact list container');
check(modalSource.includes('data-testid="booking-wall-toolbar"'), 'wall uses compact app-style toolbar');
check(modalSource.includes('data-testid="booking-wall-filters"'), 'wall uses compact filter row');
check(!modalSource.includes('Step 1 of 5'), 'wall hides step copy on the dense therapist-list screen');
check(modalSource.includes('sm:grid-cols-2'), 'desktop therapist list supports compact two-column layout');
check(modalSource.includes('overflow-y-auto'), 'therapist list area scrolls internally');
check(wallCardSource.includes('h-[92px]') || wallCardSource.includes('min-h-[92px]') || wallCardSource.includes('h-[96px]') || wallCardSource.includes('min-h-[96px]'), 'therapist list cards use compact row height');
check(avatarSource.includes("mode === 'wall'") && avatarSource.includes('h-[84px] w-[84px]'), 'therapist list uses compact image sizing');
check(!wallCardSource.includes('h-24 w-24'), 'therapist list does not use large detail avatar sizing');
check(wallCardSource.includes('h-8') && wallCardSource.includes('px-3'), 'therapist list Book button is compact');
check(!wallCardSource.includes('w-full rounded') && !wallCardSource.includes('w-full items-center'), 'therapist list Book button is not full-width');
check(!wallCardSource.includes('min-h-[118px]'), 'therapist list cards are not tall marketing cards');
check(!wallCardSource.includes('h-10 min-w-20'), 'therapist list Book button is not a large pill');
check(!modalSource.includes('Pick a real service profile first'), 'therapist wall removes explanatory copy');
check(!modalSource.includes('Need help matching?'), 'therapist wall does not spend space on matching helper copy');
check(!modalSource.includes('CompactAnyAvailableCard'), 'Any available is not rendered as a therapist-list card');
check(!wallCardSource.includes('therapist.specialties.map'), 'therapist list cards do not render service tags');
check(!wallCardSource.includes('therapist.serviceArea'), 'therapist list cards do not render long service-area copy');
check(!wallCardSource.includes('therapist.specialtyDescription'), 'therapist list cards do not render therapist descriptions');
check(modalSource.includes("setStep('detail')"), 'clicking therapist enters detail state');
check(modalSource.includes('data-testid="service-duration-book"'), 'service duration has a Book action inside detail');
check(modalSource.includes("setStep('email')"), 'booking a service duration advances to email/info flow');

const wallTherapists = concreteTherapistsForWall('', websiteTherapists);
check(wallTherapists.length >= 2, 'therapist wall has concrete therapist cards');
check(wallTherapists.every(therapist => therapist.id !== 'any_available'), 'Any available therapist is not a real therapist card');
check(wallTherapists.some(therapist => therapist.name === 'Grace'), 'Grace appears as a real therapist');
check(wallTherapists.some(therapist => therapist.name === 'Luna'), 'Luna appears as a real therapist');
check(!wallTherapists.some(therapist => ['BGC Deep Tissue Therapist', 'Makati Relaxation Therapist'].includes(therapist.name)), 'catalog profile names are not displayed as people');
check(!wallTherapists.some(therapist => ['BD', 'MR'].includes(therapist.avatarInitials)), 'BD/MR initials are not used for fallback avatars');
check(wallTherapists.every(therapist => therapist.reviewsLabel === 'No verified reviews yet'), 'missing real reviews show safe review copy');
check(wallTherapists.every(therapist => !/\b\d+(\.\d+)?\s*km\b/i.test(therapist.distanceLabel)), 'therapist cards do not fake GPS distance');
check(wallTherapists.every(therapist => therapist.availabilityLabel === 'Available after schedule confirmation'), 'therapist cards do not fake earliest appointment time');

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
