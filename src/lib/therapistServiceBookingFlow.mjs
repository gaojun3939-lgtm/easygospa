export const BOOKING_FLOW_STORAGE_KEY = 'easygospa_booking_email_session';

export const DEFAULT_THERAPIST_IMAGE_URL = '/images/placeholders/default-therapist.svg';

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
    listImageUrl: '',
    detailImageUrl: '',
    avatarUrl: '',
    fallbackImageUrl: DEFAULT_THERAPIST_IMAGE_URL,
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
    listImageUrl: '',
    detailImageUrl: '',
    avatarUrl: '',
    fallbackImageUrl: DEFAULT_THERAPIST_IMAGE_URL,
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
    listImageUrl: '',
    detailImageUrl: '',
    avatarUrl: '',
    fallbackImageUrl: DEFAULT_THERAPIST_IMAGE_URL,
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
  return concrete.filter(therapist => (
    Array.isArray(therapist.availableServices)
    && therapist.availableServices.includes(preferred)
  ));
}

// 老板 2026-07-19:墙顶部筛选——Nearby(按距离)/ Most booked(默认推荐排名)/
// Service type(按服务项目筛选)。ALL_SERVICE_TYPES_VALUE 表示不限服务类型。
export const ALL_SERVICE_TYPES_VALUE = 'all_service_types';

// 服务半径闸门(老板 2026-07-20 拍板 10 km):超出这个距离不接单——车费和路上时间
// 吃掉利润,跑远单就是亏钱。
// ⚠️ 老板同日纠正:超距技师**照常显示、但点不动**,不许从墙上藏起来——
// 新区域本来人就少,藏掉墙就空了,客人看见光秃秃的页面直接走人。
// 距离未知(客人没给定位)不拦,由下单那一步再校验(老板选的方案 C)。
export const MAX_SERVICE_DISTANCE_KM = 10;

export function therapistDistanceKm(therapist = {}) {
  const distance = Number(therapist?.distanceKm ?? therapist?.approxDistanceKm);
  return Number.isFinite(distance) ? distance : null;
}

export function isTherapistWithinServiceRange(therapist = {}, maxKm = MAX_SERVICE_DISTANCE_KM) {
  const distance = therapistDistanceKm(therapist);
  if (distance === null) return true; // 距离未知:这一层不拦,下单时再校验
  return distance <= maxKm;
}

export function filterTherapistsForWall({
  therapists = websiteTherapists,
  query = '',
  selectedArea = 'all_service_areas',
  allAreasValue = 'all_service_areas',
  selectedService = '',
  matchSelectedService = false,
  serviceType = ALL_SERVICE_TYPES_VALUE,
  sortBy = 'recommended'
} = {}) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  const normalizedArea = String(selectedArea || '');
  const normalizedType = String(serviceType || ALL_SERVICE_TYPES_VALUE);
  const rows = concreteTherapistsForWall('', therapists).filter(therapist => {
    const therapistAreas = Array.isArray(therapist.serviceAreas) ? therapist.serviceAreas : [];
    const therapistServices = Array.isArray(therapist.availableServices) ? therapist.availableServices : [];
    const therapistSpecialties = Array.isArray(therapist.specialties) ? therapist.specialties : [];
    // 注意:这里**不做**距离过滤——超距技师要留在墙上撑场面,只是卡片上点不动。
    const areaMatches = normalizedArea === allAreasValue
      || therapistAreas.some(area => area.toLowerCase() === normalizedArea.toLowerCase());
    if (!areaMatches) return false;
    if (matchSelectedService && selectedService && !therapistServices.includes(selectedService)) return false;
    if (normalizedType !== ALL_SERVICE_TYPES_VALUE) {
      const pool = [...therapistServices, ...therapistSpecialties].map(name => String(name || '').toLowerCase());
      if (!pool.includes(normalizedType.toLowerCase())) return false;
    }
    if (!normalizedQuery) return true;
    return [therapist.name, ...therapistAreas, therapist.serviceArea, ...therapistSpecialties]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery);
  });
  // Nearby = 距离升序(无距离排后);默认保持 API 推荐排名(= Most booked)。
  if (sortBy === 'nearby') {
    return [...rows].sort((a, b) => {
      const da = Number.isFinite(Number(a.distanceKm)) ? Number(a.distanceKm) : Infinity;
      const db = Number.isFinite(Number(b.distanceKm)) ? Number(b.distanceKm) : Infinity;
      return da - db;
    });
  }
  return rows;
}

// 墙上可选的服务类型(所有技师的服务/展示服务并集)。
export function serviceTypeOptionsForWall(therapists = websiteTherapists) {
  const set = new Set();
  for (const therapist of concreteTherapistsForWall('', therapists)) {
    for (const name of [...(therapist.availableServices || []), ...(therapist.specialties || [])]) {
      const clean = String(name || '').trim();
      if (clean) set.add(clean);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function servicesForTherapist(therapistId = '', therapists = websiteTherapists, services = websiteBookingServices) {
  const therapist = findWebsiteTherapist(therapistId, therapists);
  if (!therapist) return [];
  const allowed = new Set(therapist.availableServices || []);
  if (!allowed.size || therapist.id === 'any_available') return services;
  const serviceByName = new Map(services.map(service => [service.name, service]));
  return therapist.availableServices.map(serviceName => serviceByName.get(serviceName)).filter(Boolean);
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
