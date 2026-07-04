export const BOOKING_FLOW_STORAGE_KEY = 'easygospa_booking_email_session';

export const websiteBookingServices = [
  {
    id: 'swedish-massage',
    name: 'Swedish Massage',
    category: 'Massage',
    description: 'Relaxing full-body massage for stress relief and circulation support.',
    durationOptions: [
      { durationMinutes: 60, price: 2500 },
      { durationMinutes: 90, price: 3500 },
      { durationMinutes: 120, price: 4500 }
    ]
  },
  {
    id: 'deep-tissue-massage',
    name: 'Deep Tissue Massage',
    category: 'Massage',
    description: 'Focused pressure for tight muscles, knots, and deeper body tension.',
    durationOptions: [
      { durationMinutes: 60, price: 3500 },
      { durationMinutes: 90, price: 4200 },
      { durationMinutes: 120, price: 5200 }
    ]
  },
  {
    id: 'thai-dry-massage',
    name: 'Thai Dry Massage',
    category: 'Massage',
    description: 'Oil-free assisted stretching and pressure-point work.',
    durationOptions: [
      { durationMinutes: 60, price: 3000 },
      { durationMinutes: 90, price: 3900 },
      { durationMinutes: 120, price: 4900 }
    ]
  },
  {
    id: 'foot-massage',
    name: 'Foot Massage',
    category: 'Massage',
    description: 'Foot-focused massage for tired legs and general relaxation.',
    durationOptions: [
      { durationMinutes: 60, price: 1500 },
      { durationMinutes: 90, price: 2200 }
    ]
  }
];

const allServiceNames = websiteBookingServices.map(service => service.name);

export const websiteTherapists = [
  {
    id: 'therapist-bgc-deep-tissue',
    profileId: 'therapist-bgc-deep-tissue',
    name: 'Grace',
    profileName: 'BGC Deep Tissue Therapist',
    technicianAccountId: 'th-a-001',
    technicianAccountName: 'Grace',
    role: 'Massage Therapist',
    avatarInitials: '',
    distanceLabel: 'Serving BGC / Taguig area',
    availabilityLabel: 'Available after schedule confirmation',
    serviceArea: 'BGC, Taguig, nearby Makati hotels and condos',
    specialties: ['Deep Tissue Massage', 'Swedish Massage'],
    specialtyDescription: 'Best suited for deeper pressure and post-work tension relief.',
    rating: null,
    reviewCount: 0,
    reviewsLabel: 'No verified reviews yet',
    verifiedReviews: [],
    availableServices: ['Deep Tissue Massage', 'Swedish Massage'],
    therapistPreference: 'specific_therapist',
    internalConfig: true
  },
  {
    id: 'therapist-makati-relaxation',
    profileId: 'therapist-makati-relaxation',
    name: 'Luna',
    profileName: 'Makati Relaxation Therapist',
    technicianAccountId: 'th-a-002',
    technicianAccountName: 'Luna',
    role: 'Massage Therapist',
    avatarInitials: '',
    distanceLabel: 'Serving Makati / BGC area',
    availabilityLabel: 'Available after schedule confirmation',
    serviceArea: 'Makati, BGC, Taguig, Pasay by schedule',
    specialties: ['Swedish Massage', 'Thai Dry Massage', 'Foot Massage'],
    specialtyDescription: 'Focused on relaxation, stretching, and hotel or condo service.',
    rating: null,
    reviewCount: 0,
    reviewsLabel: 'No verified reviews yet',
    verifiedReviews: [],
    availableServices: ['Swedish Massage', 'Thai Dry Massage', 'Foot Massage'],
    therapistPreference: 'specific_therapist',
    internalConfig: true
  },
  {
    id: 'any_available',
    profileId: 'any_available',
    name: 'Any available therapist',
    profileName: 'Any available therapist',
    role: 'Massage Therapist',
    avatarInitials: '',
    distanceLabel: 'Nearby after you enter your area',
    availabilityLabel: 'Matched after request review',
    serviceArea: 'Metro Manila coverage depends on schedule',
    specialties: ['Swedish Massage', 'Deep Tissue Massage', 'Thai Dry Massage', 'Foot Massage'],
    specialtyDescription: 'Let our team match your request with an available therapist.',
    rating: null,
    reviewCount: 0,
    reviewsLabel: 'No verified reviews yet',
    verifiedReviews: [],
    availableServices: allServiceNames,
    therapistPreference: 'any_available',
    internalConfig: true
  }
];

export function isValidEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export function isValidPhone(value = '') {
  const text = String(value || '').trim();
  if (!text) return false;
  if (/[a-z]/i.test(text)) return false;
  if (!/^[+()\d\s.-]+$/.test(text)) return false;
  const digits = text.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export function getDefaultBookingSession(input = {}) {
  return {
    customerEmail: String(input.email || input.customerEmail || '').trim().toLowerCase(),
    customerName: String(input.name || input.customerName || '').trim(),
    phone: String(input.phone || '').trim()
  };
}

export function findBookingServiceByName(name = '', services = websiteBookingServices) {
  const normalized = String(name || '').trim().toLowerCase();
  return services.find(service => service.name.toLowerCase() === normalized) || null;
}

export function findWebsiteTherapist(id = '', therapists = websiteTherapists) {
  return therapists.find(therapist => therapist.id === id) || therapists.find(therapist => therapist.id === 'any_available') || therapists[0] || null;
}

export function concreteTherapistsForWall(preferredService = '', therapists = websiteTherapists) {
  const preferred = String(preferredService || '').trim();
  const concrete = therapists.filter(therapist => therapist.id !== 'any_available');
  if (!preferred) return concrete;
  return [...concrete].sort((a, b) => {
    const aMatch = Array.isArray(a.availableServices) && a.availableServices.includes(preferred) ? 0 : 1;
    const bMatch = Array.isArray(b.availableServices) && b.availableServices.includes(preferred) ? 0 : 1;
    return aMatch - bMatch;
  });
}

export function servicesForTherapist(therapistId = '', therapists = websiteTherapists, services = websiteBookingServices) {
  const therapist = findWebsiteTherapist(therapistId, therapists);
  if (!therapist) return [];
  const allowed = new Set(therapist.availableServices || []);
  if (!allowed.size || therapist.id === 'any_available') return services;
  return services.filter(service => allowed.has(service.name));
}

export function getDefaultDurationOption(service) {
  return service?.durationOptions?.[0] || { durationMinutes: 60, price: 0 };
}

export function findDurationOption(service, durationMinutes) {
  const parsed = Number(durationMinutes);
  return service?.durationOptions?.find(option => option.durationMinutes === parsed) || getDefaultDurationOption(service);
}

export function findExactDurationOption(service, durationMinutes) {
  const parsed = Number(durationMinutes);
  if (!Number.isFinite(parsed)) return null;
  return service?.durationOptions?.find(option => option.durationMinutes === parsed) || null;
}
