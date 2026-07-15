import { DEFAULT_THERAPIST_IMAGE_URL, websiteBookingServices, websiteTherapists } from './therapistServiceBookingFlow.mjs';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function cleanText(value = '', fallback = '') {
  const next = String(value ?? '').trim();
  return next || fallback;
}

function visibleActive(item = {}) {
  return item.isVisibleOnWebsite !== false && !['inactive', 'hidden'].includes(String(item.status || 'active').toLowerCase());
}

function numberValue(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function listText(value = []) {
  if (Array.isArray(value)) return value.map(item => cleanText(item)).filter(Boolean);
  return String(value || '').split(',').map(item => cleanText(item)).filter(Boolean);
}

function serviceAreaLabel(serviceAreas = []) {
  const areas = listText(serviceAreas);
  return areas.length ? `Serving ${areas.slice(0, 3).join(' / ')} area` : 'Serving Metro Manila by schedule';
}

function safeFallbackTherapist() {
  const anyAvailable = websiteTherapists.find(therapist => therapist.id === 'any_available');
  if (!anyAvailable) return null;
  return {
    ...anyAvailable,
    serviceAreas: [],
    profileIntroduction: '',
    catalogSource: 'catalog_unavailable_safe_fallback'
  };
}

export function getFallbackWebsiteBookingCatalog(reason = 'catalog_unavailable_safe_fallback') {
  const therapist = safeFallbackTherapist();
  return {
    ok: true,
    catalogSource: 'catalog_unavailable_safe_fallback',
    fallback: true,
    fallbackReason: reason,
    brand: 'EasyGoSpa',
    business: 'Home Massage',
    currency: 'PHP',
    therapists: therapist ? [therapist] : [],
    services: websiteBookingServices,
    catalogUnavailable: true
  };
}

export function normalizePublicBookingCatalog(payload = {}) {
  const therapists = asArray(payload.therapists).filter(visibleActive);
  const services = asArray(payload.services).filter(visibleActive);
  const options = asArray(payload.options).filter(visibleActive);
  const relations = asArray(payload.relations).filter(visibleActive);
  const serviceById = new Map(services.map(service => [service.serviceId, service]));
  const optionsByServiceId = new Map();

  for (const option of options) {
    if (!serviceById.has(option.serviceId)) continue;
    const durationMinutes = numberValue(option.durationMinutes);
    const price = numberValue(option.price);
    if (!durationMinutes || !price) continue;
    const current = optionsByServiceId.get(option.serviceId) || [];
    current.push({
      durationMinutes,
      price,
      currency: cleanText(option.currency, payload.currency || 'PHP').toUpperCase(),
      optionId: option.optionId
    });
    optionsByServiceId.set(option.serviceId, current);
  }

  const normalizedServices = services
    .map(service => ({
      id: cleanText(service.serviceId),
      name: cleanText(service.serviceName),
      category: cleanText(service.category, 'Massage'),
      description: cleanText(service.description),
      durationOptions: (optionsByServiceId.get(service.serviceId) || []).sort((a, b) => a.durationMinutes - b.durationMinutes)
    }))
    .filter(service => service.id && service.name && service.durationOptions.length);

  const normalizedServiceById = new Map(normalizedServices.map(service => [service.id, service]));
  const serviceNamesByTherapistId = new Map();
  for (const relation of relations) {
    const service = normalizedServiceById.get(relation.serviceId);
    if (!service) continue;
    const names = serviceNamesByTherapistId.get(relation.therapistId) || [];
    names.push(service.name);
    serviceNamesByTherapistId.set(relation.therapistId, names);
  }

  const normalizedTherapists = therapists
    .map(therapist => {
      const specialties = listText(therapist.specialties);
      const serviceAreas = listText(therapist.serviceAreas);
      const availableServices = serviceNamesByTherapistId.get(therapist.therapistId) || [];
      const metadata = therapist.metadata && typeof therapist.metadata === 'object' ? therapist.metadata : {};
      const profileId = cleanText(therapist.therapistId);
      const profileName = cleanText(therapist.displayName);
      const technicianAccountId = profileId === 'any_available' ? '' : cleanText(therapist.technicianAccountId || therapist.technician_account_id || metadata.technicianAccountId || metadata.technician_account_id);
      const technicianAccountName = profileId === 'any_available' ? '' : cleanText(therapist.technicianAccountName || therapist.technician_account_name || metadata.technicianAccountName || metadata.technician_account_name);
      const displayName = profileId === 'any_available' ? profileName : cleanText(technicianAccountName, profileName);
      return {
        id: profileId,
        profileId,
        name: displayName,
        profileName,
        technicianAccountId,
        technicianAccountName,
        role: 'Massage Therapist',
        avatarInitials: '',
        listImageUrl: cleanText(therapist.listImageUrl || therapist.list_image_url || metadata.listImageUrl || metadata.list_image_url),
        detailImageUrl: cleanText(therapist.detailImageUrl || therapist.detail_image_url || metadata.detailImageUrl || metadata.detail_image_url),
        avatarUrl: cleanText(therapist.avatarUrl || therapist.avatar_url || metadata.avatarUrl || metadata.avatar_url),
        photoUrl: cleanText(therapist.photoUrl),
        imageUrl: cleanText(therapist.imageUrl || therapist.image_url || metadata.imageUrl || metadata.image_url),
        fallbackImageUrl: DEFAULT_THERAPIST_IMAGE_URL,
        distanceKm: Number.isFinite(Number(therapist.approxDistanceKm)) && Number(therapist.approxDistanceKm) >= 0
          ? Number(therapist.approxDistanceKm)
          : null,
        distanceLabel: serviceAreaLabel(serviceAreas),
        availabilityLabel: therapist.therapistId === 'any_available' ? 'Matched after request review' : 'Available after schedule confirmation',
        onShift: therapist.onShift === true,
        earliestAvailable: cleanText(therapist.earliestAvailable),
        isNew: therapist.isNew === true,
        serviceAreas,
        serviceArea: serviceAreas.join(', ') || 'Metro Manila coverage depends on schedule',
        specialties,
        profileIntroduction: cleanText(therapist.description),
        specialtyDescription: cleanText(therapist.description),
        rating: null,
        reviewCount: 0,
        reviewsLabel: 'No verified reviews yet',
        verifiedReviews: [],
        availableServices,
        therapistPreference: therapist.therapistId === 'any_available' ? 'any_available' : 'specific_therapist',
        catalogSource: 'ai_office_public_catalog'
      };
    })
    .filter(therapist => therapist.id && therapist.name && therapist.availableServices.length);

  return {
    ok: true,
    catalogSource: 'ai_office_public_catalog',
    fallback: false,
    brand: cleanText(payload.brand, 'EasyGoSpa'),
    business: cleanText(payload.business, 'Home Massage'),
    currency: cleanText(payload.currency, 'PHP').toUpperCase(),
    therapists: normalizedTherapists,
    services: normalizedServices,
    catalogUnavailable: !normalizedTherapists.length || !normalizedServices.length
  };
}
