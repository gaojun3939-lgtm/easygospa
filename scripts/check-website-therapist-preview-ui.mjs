import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizePublicBookingCatalog } from '../src/lib/bookingCatalogNormalizer.mjs';

const modalSource = fs.readFileSync('src/components/BookingModal.jsx', 'utf8');
const normalizerSource = fs.readFileSync('src/lib/bookingCatalogNormalizer.mjs', 'utf8');
const globalStylesSource = fs.readFileSync('src/app/globals.css', 'utf8');
const wallCardSource = modalSource.slice(modalSource.indexOf('function TherapistWallCard'), modalSource.indexOf('function ServiceCard'));
const detailSource = modalSource.slice(modalSource.indexOf('function TherapistDetail'), modalSource.indexOf('export default function BookingModal'));
const bookingFormSource = modalSource.slice(modalSource.indexOf("{step === 'email'"), modalSource.indexOf("{step === 'success'"));

function check(condition, message) {
  assert.ok(condition, message);
  console.log(`[therapist-preview-ui] PASS ${message}`);
}

check(modalSource.includes('No specific therapist is available right now.'), 'empty state uses the owner-approved primary copy');
check(modalSource.includes('Please try again in a few minutes, or message us on WhatsApp to book.'), 'empty state uses the owner-approved follow-up copy');
check(!modalSource.includes('legacyCatalogUnavailableNotice'), 'empty state does not retain hidden legacy copy');
check(modalSource.includes('hasSpecificTherapists'), 'empty state is based on specific public-catalog therapist availability');
check(modalSource.includes('All service areas'), 'area header is honest before the customer selects an area');
check(modalSource.includes('data-testid="therapist-area-filter"'), 'area filter is addressable and functional');
check(!modalSource.includes('SlidersHorizontal'), 'decorative filter control is removed');
check(!modalSource.includes("const wallFilters = ['All therapists', 'Service match']"), 'no-op service filter chip is removed');
check(modalSource.includes('data-testid="therapist-result-count"'), 'filtered therapist result count is rendered');
check(modalSource.includes('data-testid="therapist-detail-hero"'), 'detail hero is addressable for mobile screenshot validation');
check(modalSource.includes('data-testid="therapist-care"'), 'EasyGoSpa Care section is addressable for screenshot validation');
check(modalSource.includes('data-testid="therapist-about"'), 'About section is addressable for screenshot validation');
check(modalSource.includes('data-testid="therapist-services"'), 'services section is addressable for screenshot validation');
check(modalSource.includes('data-testid="service-duration-option"'), 'duration selection is addressable for interaction validation');
check(modalSource.includes("step !== 'detail'"), 'detail view does not duplicate the global modal header over the image hero');
check(modalSource.includes('sticky bottom-0'), 'selected summary stays visible on mobile');
check(modalSource.includes('data-testid="therapist-booking-summary"'), 'sticky booking summary is addressable');
check(modalSource.includes('data-testid="detail-book"'), 'one primary detail Book button is rendered');
check(!detailSource.includes('data-testid="service-duration-book"'), 'service cards do not render separate Book buttons');
check(!detailSource.includes('|| service.durationOptions[0]'), 'unselected service cards do not display an inferred price');
check(modalSource.includes("const isFallback = imageUrl === DEFAULT_THERAPIST_IMAGE_URL"), 'default therapist image receives a restrained placeholder treatment');
check(modalSource.includes('h-[100dvh]') && modalSource.includes('sm:h-auto'), 'mobile therapist list uses a full-height app surface');
check(modalSource.includes("document.body.style.overflow = 'hidden'"), 'open booking experience locks the animated page behind it');
check(modalSource.includes("document.body.classList.add('booking-modal-open')") && globalStylesSource.includes('body.booking-modal-open *'), 'open booking experience pauses background page animation work');
check(!modalSource.includes('Heart') && !modalSource.includes('Save therapist'), 'favorite UI is absent without a real favorite system');
check(!modalSource.includes('Share2') && !modalSource.includes('Share therapist'), 'share UI is absent without a functional share action');
check(modalSource.includes('No profile introduction has been provided yet.'), 'missing biography uses the exact owner-approved copy');
check(!modalSource.includes('function therapistAboutText'), 'About does not synthesize a biography from areas or services');
check(modalSource.includes('Clear booking details') && modalSource.includes('Confirmation before dispatch') && modalSource.includes('Privacy-aware booking'), 'EasyGoSpa Care uses compact verifiable statements');
check(modalSource.includes('visibleServiceTags') && modalSource.includes('remainingServiceCount'), 'detail hero limits visible service tags');
check(modalSource.includes("useState('loading')"), 'catalog loading has an explicit state');
check(modalSource.includes('data-testid="booking-catalog-loading"'), 'catalog loading state is rendered honestly');
check(modalSource.includes('data-testid="booking-catalog-error"'), 'catalog load failure is distinguishable from a valid empty result');
check(modalSource.includes('data-testid="booking-search-no-results"'), 'search no-results state is rendered honestly');
check(modalSource.includes('Enter your details to continue.'), 'booking form header subtitle is complete and concise');
check(!bookingFormSource.includes('font-serif'), 'booking form uses the same sans-serif typography as therapist flow');
check(!modalSource.includes('#2db83d'), 'BookingModal uses one EasyGoSpa green token');
check(!wallCardSource.includes('rounded-full bg-gray-100') && wallCardSource.includes('Massage Therapist'), 'professional role is plain text rather than a redundant pill');
check(normalizerSource.includes("!['inactive', 'hidden'].includes"), 'website normalizer does not redefine technician online eligibility');
check(!/\b(?:ida|Grace|Luna|Rhea)\b/i.test(modalSource), 'BookingModal has no hardcoded runtime technician name');

const realProfileFixture = {
  ok: true,
  brand: 'EasyGoSpa',
  currency: 'PHP',
  therapists: [
    {
      therapistId: 'fixture-public-profile',
      displayName: 'Catalog Profile',
      technicianAccountId: 'fixture-account',
      technicianAccountName: 'Public Professional',
      serviceAreas: ['Makati'],
      specialties: ['Swedish Massage'],
      description: 'A real public catalog introduction.',
      status: 'active',
      isVisibleOnWebsite: true
    }
  ],
  services: [
    {
      serviceId: 'swedish-massage',
      serviceName: 'Swedish Massage',
      category: 'Massage',
      status: 'active',
      isVisibleOnWebsite: true
    }
  ],
  options: [
    {
      optionId: 'swedish-massage-60',
      serviceId: 'swedish-massage',
      durationMinutes: 60,
      price: 2500,
      currency: 'PHP',
      status: 'active',
      isVisibleOnWebsite: true
    }
  ],
  relations: [
    {
      therapistId: 'fixture-public-profile',
      serviceId: 'swedish-massage',
      isVisibleOnWebsite: true
    }
  ]
};

const catalogWithRealProfile = normalizePublicBookingCatalog(realProfileFixture);

const realProfile = catalogWithRealProfile.therapists[0];
check(realProfile?.profileIntroduction === 'A real public catalog introduction.', 'About preserves only the real public catalog biography');
check(Array.isArray(realProfile?.serviceAreas) && realProfile.serviceAreas[0] === 'Makati', 'normalizer preserves real service-area values for filtering');

const catalogWithoutBiography = normalizePublicBookingCatalog({
  ...realProfileFixture,
  therapists: [{
    therapistId: 'fixture-no-bio',
    displayName: 'Catalog Profile',
    technicianAccountId: 'fixture-no-bio-account',
    technicianAccountName: 'Public Professional',
    serviceAreas: ['BGC'],
    specialties: ['Swedish Massage'],
    description: '',
    status: 'active',
    isVisibleOnWebsite: true
  }],
  relations: [{ therapistId: 'fixture-no-bio', serviceId: 'swedish-massage', isVisibleOnWebsite: true }]
});
check(catalogWithoutBiography.therapists[0]?.profileIntroduction === '', 'missing biography stays empty for exact UI fallback copy');
