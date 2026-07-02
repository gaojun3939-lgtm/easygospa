import { websiteBookingServices, websiteTherapists } from './therapistServiceBookingFlow.mjs';

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

export function getFallbackWebsiteBookingCatalog(reason = 'local_seed_fallback') {
  return {
    ok: true,
    catalogSource: 'local_seed_fallback',
    fallback: true,
    fallbackReason: reason,
    brand: 'EasyGoSpa',
    business: 'Home Massage',
    currency: 'PHP',
    therapists: websiteTherapists,
    services: websiteBookingServices,
    catalogUnavailable: false
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
      return {
        id: cleanText(therapist.therapistId),
        name: cleanText(therapist.displayName),
        avatarInitials: cleanText(therapist.initialsAvatar, cleanText(therapist.displayName).slice(0, 2).toUpperCase() || 'EG'),
        photoUrl: cleanText(therapist.photoUrl),
        distanceLabel: serviceAreaLabel(serviceAreas),
        availabilityLabel: therapist.therapistId === 'any_available' ? 'Matched after request review' : 'Earliest after schedule confirmation',
        serviceArea: serviceAreas.join(', ') || 'Metro Manila coverage depends on schedule',
        specialties,
        specialtyDescription: cleanText(therapist.description, 'Let our team confirm the right therapist for your request.'),
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
