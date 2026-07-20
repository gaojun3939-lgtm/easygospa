'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Calendar, Check, Clock, Mail, MapPin, MessageSquare, Phone, Search, ShieldCheck, Star, User, X } from 'lucide-react';
import {
  BOOKING_FLOW_STORAGE_KEY,
  ALL_SERVICE_TYPES_VALUE,
  DEFAULT_THERAPIST_IMAGE_URL,
  concreteTherapistsForWall,
  filterTherapistsForWall,
  findBookingServiceByName,
  findExactDurationOption,
  findWebsiteTherapist,
  getDefaultBookingSession,
  getDefaultDurationOption,
  isValidEmail,
  isValidPhone,
  serviceTypeOptionsForWall,
  servicesForTherapist,
  MAX_SERVICE_DISTANCE_KM,
  SERVICE_RADIUS_LOCATION_REQUIRED_MESSAGE,
  SERVICE_RADIUS_TOO_FAR_MESSAGE,
  getTherapistServiceRadiusBlockMessage,
  isUsableCustomerLocation,
  submitBookingWithinServiceRadius,
  therapistDistanceKm
} from '../lib/therapistServiceBookingFlow.mjs';
import { getFallbackWebsiteBookingCatalog } from '../lib/bookingCatalogNormalizer.mjs';
import { manilaNowMinutes, manilaToday } from '../lib/manilaTime.js';
import { apiUrl } from '../lib/apiUrl.js';
import {
  clearActiveBooking,
  isActiveBookingReference,
  resolveActiveBookingGate,
  writeActiveBooking
} from '../lib/activeBooking.mjs';
import { cancelPublicBooking } from '../lib/publicBookingCancel.mjs';
import { LocationPicker } from './LocationPicker.jsx';
import { AddressAutocompleteInput } from './AddressAutocompleteInput.jsx';

// 名单会话缓存(60 秒):整页刷新后先把上次名单端上墙,真名单在背后静默刷新。
// 技师上下班仍然实时反映——每次都照常重新拉取,缓存只负责"先有得看"。
const CATALOG_SESSION_CACHE_KEY = 'egBookingCatalogCache.v1';
const CATALOG_SESSION_CACHE_MS = 60_000;

function catalogStatusForPayload(payload) {
  if (!payload || payload.ok !== true || payload.fallback) return 'error';
  const services = Array.isArray(payload.services) ? payload.services : [];
  const therapists = Array.isArray(payload.therapists) ? payload.therapists.filter(therapist => therapist.id !== 'any_available') : [];
  return services.length && therapists.length ? 'ready' : 'empty';
}

function readCatalogSessionCache() {
  if (typeof window === 'undefined') return null;
  try {
    const entry = JSON.parse(window.sessionStorage.getItem(CATALOG_SESSION_CACHE_KEY) || 'null');
    if (!entry || !Number.isFinite(entry.at) || Date.now() - entry.at > CATALOG_SESSION_CACHE_MS) return null;
    return catalogStatusForPayload(entry.payload) === 'ready' ? entry.payload : null;
  } catch {
    return null;
  }
}

function writeCatalogSessionCache(payload) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(CATALOG_SESSION_CACHE_KEY, JSON.stringify({ at: Date.now(), payload }));
  } catch {}
}

// 24/7 service: offer every 30-minute slot across the full day (00:00–23:30).
// Same-day past slots are filtered out later against Manila time.
const timeSlots = Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 === 0 ? '00' : '30'}`);
// Minimum lead time (minutes) before the earliest same-day bookable slot.
// Matches the backend bookingBufferMinutes so the "Earliest HH:MM" a therapist
// advertises is actually pickable in the time dropdown.
const BOOKING_LEAD_MINUTES = 30;
const areaOptions = ['BGC', 'Makati', 'Taguig', 'Pasay', 'Ortigas', 'Metro Manila'];
const allServiceAreasValue = 'all_service_areas';
const catalogUnavailableNotice = 'No specific therapist is available right now.';
const catalogUnavailableFollowUp = 'Please try again in a few minutes, or message us on WhatsApp to book.';
const missingProfileIntroduction = 'No profile introduction has been provided yet.';
const phPhoneErrorMessage = 'Please enter a valid PH mobile number, e.g. 0917 123 4567.';
const bookingInputClass = 'h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 font-medium text-[#0F0F0F] caret-[#0F0F0F] placeholder:text-gray-500 focus:border-[#4E8D43] focus:outline-none';
const bookingTextareaClass = `${bookingInputClass} min-h-28 resize-none py-3`;
const bookingLabelClass = 'mb-2 block text-sm font-semibold text-slate-800';
const summaryCardClass = 'rounded-[1.5rem] border border-[#4E8D43]/30 bg-[#F1FBF3] p-5 text-sm';
const summaryLabelClass = 'font-semibold text-slate-700';
const summaryValueClass = 'text-right font-semibold text-[#0F0F0F]';
const summaryMoneyClass = 'text-right font-bold text-[#0E6F1A]';

function timeSlotMinutes(value = '') {
  const [hour, minute] = String(value).split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return -1;
  return (hour * 60) + minute;
}

function isSelectableManilaTime(preferredDate, preferredTime) {
  if (!preferredTime || preferredDate !== manilaToday()) return Boolean(preferredTime);
  return timeSlotMinutes(preferredTime) >= manilaNowMinutes() + BOOKING_LEAD_MINUTES;
}

// On-demand booking: no schedule picker — the therapist departs right after
// accepting. We still stamp a Manila date/time (now + lead buffer) because the
// intake service and technician app expect one.
function manilaAsapTime() {
  const total = Math.min(23 * 60 + 55, manilaNowMinutes() + BOOKING_LEAD_MINUTES);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// Area is inferred from the typed address / map pin instead of a manual dropdown.
function inferAreaFromAddress(text = '') {
  const value = String(text || '').toLowerCase();
  if (/bgc|bonifacio|high street/.test(value)) return 'BGC';
  if (/makati|马卡蒂/.test(value)) return 'Makati';
  if (/taguig|塔吉格/.test(value)) return 'Taguig';
  if (/pasay|帕赛/.test(value)) return 'Pasay';
  if (/ortigas/.test(value)) return 'Ortigas';
  if (/mandaluyong/.test(value)) return 'Mandaluyong';
  if (/quezon/.test(value)) return 'Quezon City';
  if (/paranaque|parañaque/.test(value)) return 'Paranaque';
  if (/san juan/.test(value)) return 'San Juan';
  if (/pasig/.test(value)) return 'Pasig';
  if (/manila|马尼拉/.test(value)) return 'Manila';
  return 'Metro Manila';
}

function isValidPhilippineMobile(value = '') {
  const compact = String(value).replace(/[\s\-()]/g, '');
  return /^(?:09\d{9}|\+?639\d{9})$/.test(compact);
}

function cleanPhoneForPayload(value = '') {
  return String(value).trim().replace(/[\s-]/g, '');
}

function money(value = 0) {
  return `PHP ${Number(value || 0).toLocaleString('en-US')}`;
}

function TherapistRating({ therapist = {} }) {
  const rating = Number(therapist.rating);
  const reviewCount = Number(therapist.reviewCount);

  if (!Number.isFinite(rating) || rating <= 0 || !Number.isFinite(reviewCount) || reviewCount <= 0) {
    return <span>No verified reviews yet</span>;
  }

  const displayedRating = Math.min(5, Math.max(0, Math.round(rating * 2) / 2));

  return (
    <span
      className="inline-flex items-center gap-1.5"
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars from ${reviewCount} verified reviews`}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map(index => {
          const fillPercent = displayedRating >= index + 1 ? 100 : displayedRating >= index + 0.5 ? 50 : 0;

          return (
            <span key={index} className="relative h-3.5 w-3.5 shrink-0">
              <Star className="absolute inset-0 h-3.5 w-3.5 text-[#f0b429]" />
              {fillPercent > 0 ? (
                <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                  <Star className="h-3.5 w-3.5 fill-[#f0b429] text-[#f0b429]" />
                </span>
              ) : null}
            </span>
          );
        })}
      </span>
      <span className="font-semibold text-gray-700">{rating.toFixed(1)} ({reviewCount})</span>
    </span>
  );
}

function therapistAreaText(therapist = {}) {
  const areas = Array.isArray(therapist.serviceAreas) ? therapist.serviceAreas.filter(Boolean) : [];
  if (areas.length) return areas.join(', ');
  const area = String(therapist.serviceArea || '').trim();
  if (area) return area;
  const label = String(therapist.distanceLabel || '').trim();
  return label || 'Metro Manila coverage depends on schedule';
}

function serviceToCatalogName(service = {}) {
  return service?.name || '';
}

function createInitialForm(serviceName = '', services = undefined) {
  const matchedService = findBookingServiceByName(serviceName, services);
  const durationOption = matchedService ? getDefaultDurationOption(matchedService) : null;
  return {
    customerName: '',
    customerEmail: '',
    phone: '',
    requestedTechnicianId: '',
    preferredService: matchedService?.name || serviceName || '',
    serviceId: matchedService?.id || '',
    service: matchedService?.name || '',
    durationMinutes: durationOption?.durationMinutes || '',
    totalAmount: durationOption?.price || 0,
    preferredDate: '',
    preferredTime: '',
    area: '',
    addressNote: '',
    customerLocation: null,
    notes: ''
  };
}

function resolveSelectedServiceOption(formData, services = undefined) {
  const service = findBookingServiceByName(formData.service, services);
  if (!service) return null;
  const option = findExactDurationOption(service, formData.durationMinutes);
  if (!option) return null;
  return {
    service,
    serviceId: service.id,
    durationMinutes: option.durationMinutes,
    price: option.price,
    currency: 'PHP'
  };
}

function readStoredSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(BOOKING_FLOW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidEmail(parsed.customerEmail) ? parsed : null;
  } catch {
    return null;
  }
}

function saveStoredSession(session) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(BOOKING_FLOW_STORAGE_KEY, JSON.stringify(session));
}

function isApprovedTherapistImage(url = '') {
  const value = String(url || '').trim();
  if (value.startsWith('/images/') && !value.startsWith('//')) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:'
      && /\.supabase\.co$/i.test(parsed.hostname)
      && parsed.pathname.startsWith('/storage/v1/object/public/therapist-images/');
  } catch {
    return false;
  }
}

function resolveTherapistImageUrl(therapist = {}, mode = 'wall') {
  const candidates = mode === 'detail'
    ? [therapist.detailImageUrl, therapist.avatarUrl, therapist.photoUrl, therapist.imageUrl, therapist.listImageUrl]
    : [therapist.listImageUrl, therapist.avatarUrl, therapist.photoUrl, therapist.imageUrl];
  return candidates.find(isApprovedTherapistImage)
    || (isApprovedTherapistImage(therapist.fallbackImageUrl) ? therapist.fallbackImageUrl : DEFAULT_THERAPIST_IMAGE_URL);
}

function TherapistAvatar({ therapist, mode = 'wall' }) {
  const imageUrl = resolveTherapistImageUrl(therapist, mode);
  const isFallback = imageUrl === DEFAULT_THERAPIST_IMAGE_URL;
  const sizeClass = mode === 'wall' ? 'h-[88px] w-[88px]' : 'h-full w-full';
  const radiusClass = mode === 'wall' ? 'rounded-[1.25rem]' : 'rounded-none';
  // Owner report (2026-07-19): full-body detail photos were cropped to the torso —
  // anchor the crop to the TOP so the face always stays in frame.
  const fitClass = isFallback
    ? `${mode === 'wall' ? 'p-2' : 'p-6'} object-contain`
    : mode === 'detail' ? 'object-cover object-top' : 'object-cover object-center';

  return (
    <img
      src={imageUrl}
      alt={`${therapist.name} therapist`}
      loading="lazy"
      decoding="async"
      data-testid={mode === 'detail' ? 'therapist-detail-image' : 'therapist-list-image'}
      className={`${sizeClass} ${radiusClass} ${fitClass} shrink-0 bg-[#EAF8ED] ring-1 ring-gray-200`}
    />
  );
}

function TherapistWallCard({ therapist, selected, onSelect, onRequireLocation }) {
  // 超出 10km 或距离未知:卡片照常显示(墙不能空),但点不动。
  const distanceKm = therapistDistanceKm(therapist);
  const rangeBlockMessage = getTherapistServiceRadiusBlockMessage(therapist);
  const rangeBlocked = Boolean(rangeBlockMessage);
  const outOfRange = distanceKm !== null && distanceKm > MAX_SERVICE_DISTANCE_KM;
  const [showRangeHint, setShowRangeHint] = useState(false);

  useEffect(() => {
    if (!showRangeHint) return undefined;
    const timer = setTimeout(() => setShowRangeHint(false), 2600);
    return () => clearTimeout(timer);
  }, [showRangeHint]);

  // 工具人只展示不可下单:点卡片不进详情(老板 2026-07-19)。
  const openDetail = () => {
    if (therapist.isMannequin) return;
    if (rangeBlocked) {
      // 距离未知=客人还没给位置。老板 2026-07-20 拍板:不能让拒绝过浏览器定位的
      // 客人无路可走,点卡片时顺手把墙上的定位入口打开让他补位置。
      if (distanceKm === null && typeof onRequireLocation === 'function') onRequireLocation();
      setShowRangeHint(true);
      return;
    }
    onSelect(therapist.id);
  };
  const handleKeyDown = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDetail();
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={handleKeyDown}
      data-testid={`therapist-card-${therapist.id}`}
      className={`relative w-full cursor-pointer overflow-hidden rounded-[1.5rem] border bg-white p-3 text-left shadow-sm transition-all ${selected ? 'border-[#4E8D43] shadow-md' : 'border-gray-100 hover:border-[#4E8D43]/60 hover:shadow-md'}`}
    >
      {therapist.isNew === true ? <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-sky-600 px-2 py-1 text-[10px] font-extrabold leading-none tracking-[0.12em] text-white shadow-sm" data-testid="therapist-new-badge">NEW</span> : null}
      {showRangeHint ? (
        <span
          role="status"
          data-testid={`therapist-card-out-of-range-hint-${therapist.id}`}
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-black/85 px-4 py-3 text-center text-sm font-semibold leading-5 text-white shadow-lg"
        >
          {distanceKm === null ? SERVICE_RADIUS_LOCATION_REQUIRED_MESSAGE : SERVICE_RADIUS_TOO_FAR_MESSAGE}
        </span>
      ) : null}
      <div className="flex min-h-[112px] gap-3">
        <TherapistAvatar therapist={therapist} mode="wall" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="min-w-0 flex-1 truncate text-[17px] font-bold leading-6 text-[#0F0F0F]">{therapist.name}</h3>
            {/* Owner call (2026-07-18): show the earliest slot even off-shift —
                the backend now sends cross-day values like "Tomorrow 09:00". */}
            {therapist.earliestAvailable ? (
              <span className="flex shrink-0 items-center gap-1 text-xs font-semibold leading-5 text-[#3F7838]" data-testid="therapist-earliest-availability">
                <Clock className="h-3.5 w-3.5 shrink-0" />Earliest {therapist.earliestAvailable}
              </span>
            ) : null}
            {selected ? <Check className="h-4 w-4 shrink-0 text-[#4E8D43]" /> : null}
          </div>
          <p className="text-sm font-medium text-gray-700">Massage Therapist</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{therapistAreaText(therapist)}</p>
          {distanceKm !== null && distanceKm <= 100 ? (
            <p className={`mt-1 flex items-center gap-1 text-xs font-semibold ${outOfRange ? 'text-gray-400' : 'text-[#3F7838]'}`} data-testid="therapist-distance">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)} km
              {outOfRange ? <span data-testid="therapist-out-of-range-tag"> · Too far</span> : null}
            </p>
          ) : null}
          <div className="mt-1 text-xs font-medium text-gray-600"><TherapistRating therapist={therapist} /></div>
          <div className="mt-3 flex min-h-11 items-center justify-end gap-3">
            {therapist.isMannequin ? (
              <span className="ml-auto inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-gray-100 px-4 text-sm font-bold text-gray-500" data-testid={`therapist-card-resting-${therapist.id}`}>Resting</span>
            ) : (
            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                openDetail();
              }}
              data-testid={`therapist-card-book-${therapist.id}`}
              aria-disabled={rangeBlocked || undefined}
              className={`ml-auto inline-flex h-11 min-w-20 shrink-0 items-center justify-center rounded-full px-4 text-sm font-bold transition ${rangeBlocked ? 'cursor-not-allowed bg-gray-200 text-gray-500' : 'bg-[#4E8D43] text-white hover:bg-[#3F7838]'}`}
            >
              Book
            </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function ServiceCard({ service, selected, selectedDuration, onSelectService, onSelectDuration }) {
  const selectedOption = selected
    ? service.durationOptions.find(option => option.durationMinutes === selectedDuration) || null
    : null;

  return (
    <section className={`overflow-hidden rounded-[1.5rem] border bg-white shadow-sm transition-all ${selected ? 'border-[#4E8D43] ring-1 ring-[#4E8D43]/20' : 'border-gray-200'}`} data-testid={`therapist-service-${service.id}`}>
      <button
        type="button"
        onClick={() => onSelectService(service)}
        data-testid={`service-select-${service.id}`}
        aria-pressed={selected}
        className={`flex min-h-24 w-full items-start justify-between gap-4 p-4 text-left transition ${selected ? 'bg-[#F1FBF3]' : 'bg-white hover:bg-gray-50'}`}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold text-[#0F0F0F]">{service.name}</span>
          <span className="mt-1 block text-sm leading-6 text-gray-600">{service.description}</span>
        </span>
        <span className={`mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-[#4E8D43] bg-[#4E8D43] text-white' : 'border-gray-300 bg-white text-transparent'}`}>
          <Check className="h-4 w-4" />
        </span>
      </button>
      {selected ? (
        <div className="border-t border-[#4E8D43]/20 p-4">
          <p className="text-sm font-bold text-[#0F0F0F]">Choose a duration</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {service.durationOptions.map(option => {
              const durationSelected = selectedDuration === option.durationMinutes;
              return (
                <button
                  key={`${service.id}-${option.durationMinutes}`}
                  type="button"
                  onClick={() => onSelectDuration(service, option)}
                  data-testid="service-duration-option"
                  aria-pressed={durationSelected}
                  className={`inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition-all ${durationSelected ? 'border-[#4E8D43] bg-[#E8F5E9] text-[#3F7838]' : 'border-gray-200 bg-white text-gray-700 hover:border-[#4E8D43]/60'}`}
                >
                  {option.durationMinutes} mins
                  {durationSelected ? <Check className="h-4 w-4" /> : null}
                </button>
              );
            })}
          </div>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500">Selected price</p>
            <p className="mt-1 text-xl font-bold text-[#0F0F0F]">{selectedOption ? money(selectedOption.price) : 'Select a duration'}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function TherapistDetail({ therapist, availableServices, selectedServiceName, selectedDuration, totalAmount, onSelectService, onSelectDuration, onBack, onBook }) {
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState('');
  const aboutText = String(therapist.profileIntroduction || '').trim() || missingProfileIntroduction;
  const shouldClampAbout = aboutText.length > 170;
  const visibleServiceTags = availableServices.slice(0, 3).map(service => service.name);
  const remainingServiceCount = Math.max(0, availableServices.length - visibleServiceTags.length);
  const detailImageUrl = resolveTherapistImageUrl(therapist, 'detail');
  const usesFallbackImage = detailImageUrl === DEFAULT_THERAPIST_IMAGE_URL;
  const canBook = Boolean(selectedServiceName && selectedDuration && Number(totalAmount) > 0);
  // 老板 2026-07-19:主图 + 已批准生活照 合成一个可左右滑的相册放最顶部(不再分两块)。
  const heroPhotos = Array.from(new Set([
    ...(usesFallbackImage ? [] : [detailImageUrl]),
    ...((Array.isArray(therapist.lifePhotos) ? therapist.lifePhotos : []))
  ].filter(url => /^https?:\/\//i.test(String(url || '')))));
  const [photoIndex, setPhotoIndex] = useState(0);
  const heroScrollRef = React.useRef(null);
  const onHeroScroll = () => {
    const el = heroScrollRef.current;
    if (!el || !el.clientWidth) return;
    setPhotoIndex(Math.round(el.scrollLeft / el.clientWidth));
  };
  // 桌面没有触摸滑动 → 用箭头/圆点按页翻(老板 2026-07-19)。
  const goToPhoto = (index) => {
    const el = heroScrollRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(heroPhotos.length - 1, index));
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    setPhotoIndex(next);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-32 sm:pb-8" data-testid="therapist-detail-view">
      <section className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm" data-testid="therapist-detail-hero">
        <div className={`relative bg-[#11150f] ${usesFallbackImage && heroPhotos.length === 0 ? 'h-[152px] sm:h-[180px]' : 'h-[320px] sm:h-[440px]'}`}>
          {heroPhotos.length > 1 ? (
            <>
              <div ref={heroScrollRef} onScroll={onHeroScroll} className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth" data-testid="therapist-hero-carousel" style={{ scrollbarWidth: 'none' }}>
                {heroPhotos.map((url, index) => (
                  <button key={url} type="button" onClick={() => setLightboxUrl(url)} className="flex h-full w-full shrink-0 snap-center items-center justify-center">
                    <img src={url} alt={`${therapist.name} photo ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" className="max-h-full max-w-full object-contain" />
                  </button>
                ))}
              </div>
              {photoIndex > 0 ? <button type="button" onClick={() => goToPhoto(photoIndex - 1)} aria-label="Previous photo" data-testid="hero-prev" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow"><ArrowLeft className="h-5 w-5" /></button> : null}
              {photoIndex < heroPhotos.length - 1 ? <button type="button" onClick={() => goToPhoto(photoIndex + 1)} aria-label="Next photo" data-testid="hero-next" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow"><ArrowLeft className="h-5 w-5 rotate-180" /></button> : null}
              <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white" data-testid="therapist-hero-counter">{photoIndex + 1}/{heroPhotos.length}</span>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {heroPhotos.map((url, index) => <button key={url} type="button" aria-label={`Go to photo ${index + 1}`} onClick={() => goToPhoto(index)} className={`h-1.5 rounded-full transition-all ${index === photoIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`} />)}
              </div>
            </>
          ) : (
            <TherapistAvatar therapist={therapist} mode="detail" />
          )}
          <button type="button" onClick={onBack} className="absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-sm" aria-label="Back to therapist list"><ArrowLeft className="h-5 w-5" /></button>
          {usesFallbackImage && heroPhotos.length === 0 ? <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#3F7838]">EasyGoSpa therapist profile</span> : null}
        </div>
        <div className="p-5">
          <h3 className="text-3xl font-bold tracking-normal text-[#0F0F0F]">{therapist.name}</h3>
          <p className="mt-1 text-sm font-semibold text-gray-700">Massage Therapist</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">{therapistAreaText(therapist)}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-[#E8F5E9] px-3 py-1.5 font-bold text-[#3F7838]">Available after confirmation</span>
            <span className="rounded-full bg-gray-100 px-3 py-1.5 font-semibold text-gray-700"><TherapistRating therapist={therapist} /></span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleServiceTags.map(item => <span key={item} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">{item}</span>)}
            {remainingServiceCount ? <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-[#3F7838]">+{remainingServiceCount} more</span> : null}
          </div>
        </div>
      </section>
      {/* 老板 2026-07-19:原单独的"Photos"块已合进顶部相册,这里不再重复展示。 */}
      {lightboxUrl ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/85 p-4" role="dialog" aria-modal="true" onClick={() => setLightboxUrl('')}>
          <button type="button" aria-label="Close" onClick={() => setLightboxUrl('')} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"><X className="h-5 w-5" /></button>
          <img src={lightboxUrl} alt={`${therapist.name} photo`} className="max-h-[85vh] max-w-full rounded-2xl object-contain" onClick={event => event.stopPropagation()} />
        </div>
      ) : null}
      <section className="rounded-[1.5rem] border border-[#4E8D43]/20 bg-[#F1FBF3] p-5" data-testid="therapist-care">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#3F7838]" />
          <h3 className="text-lg font-bold text-[#0F0F0F]">EasyGoSpa Care</h3>
        </div>
        <ul className="mt-4 grid gap-3 text-sm text-gray-700 sm:grid-cols-3">
          <li><strong className="block text-[#0F0F0F]">Clear booking details</strong><span className="mt-1 block leading-5">Service, duration, and price are shown before you continue.</span></li>
          <li><strong className="block text-[#0F0F0F]">Confirmation before dispatch</strong><span className="mt-1 block leading-5">A therapist is dispatched only after the booking is confirmed.</span></li>
          <li><strong className="block text-[#0F0F0F]">Privacy-aware booking</strong><span className="mt-1 block leading-5">Only the details needed to arrange the booking are requested.</span></li>
        </ul>
      </section>
      <section className="rounded-[1.5rem] border border-gray-200 bg-white p-5 shadow-sm" data-testid="therapist-about">
        <h3 className="text-xl font-bold text-[#0F0F0F]">About {therapist.name}</h3>
        <p className={`mt-2 text-sm leading-6 text-gray-700 ${shouldClampAbout && !showFullAbout ? 'line-clamp-4' : ''}`}>{aboutText}</p>
        {shouldClampAbout ? (
          <button type="button" onClick={() => setShowFullAbout(current => !current)} className="mt-2 text-sm font-bold text-[#3F7838]">
            {showFullAbout ? 'Show less' : 'Show more'}
          </button>
        ) : null}
      </section>
      <div data-testid="therapist-services">
        <h3 className="text-2xl font-bold text-[#0F0F0F]">My Services</h3>
        <p className="mt-1 text-sm text-gray-600">Real bookable services and prices from the public catalog.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {availableServices.map(service => <ServiceCard key={service.id} service={service} selected={selectedServiceName === service.name} selectedDuration={selectedServiceName === service.name ? Number(selectedDuration) : 0} onSelectService={onSelectService} onSelectDuration={onSelectDuration} />)}
        </div>
      </div>
      <section className="rounded-[1.5rem] border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-gray-400" />
          <h4 className="font-bold text-[#0F0F0F]">Reviews</h4>
        </div>
        {therapist.verifiedReviews?.length ? (
          <div className="mt-3 space-y-2">{therapist.verifiedReviews.map(review => <p key={review.id} className="text-sm text-gray-600">{review.text}</p>)}</div>
        ) : <p className="mt-3 text-sm text-gray-600">Reviews will appear after completed bookings.</p>}
      </section>
      <div className="sticky bottom-0 z-20 -mx-2 border-t border-gray-200 bg-white/95 px-4 pt-4 shadow-[0_-8px_24px_rgba(15,15,15,0.08)] backdrop-blur [padding-bottom:calc(1rem+env(safe-area-inset-bottom))] sm:-mx-3 sm:rounded-t-2xl" data-testid="therapist-booking-summary">
        <div className="mx-auto flex max-w-3xl items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Selected summary</p>
            <p className="font-semibold text-[#0F0F0F]">{therapist.name}</p>
            <p className="text-sm text-gray-600">{selectedServiceName || 'Select a service'} {selectedServiceName ? (selectedDuration ? `/ ${selectedDuration} mins` : '/ Select a duration') : ''}</p>
            <p className="mt-1 text-lg font-bold text-[#3F7838]">{canBook ? money(totalAmount) : '—'}</p>
          </div>
          <button type="button" onClick={onBook} disabled={!canBook} data-testid="detail-book" className="inline-flex h-12 min-w-28 items-center justify-center rounded-2xl bg-[#4E8D43] px-6 font-bold text-white transition hover:bg-[#3F7838] disabled:cursor-not-allowed disabled:opacity-45">Book</button>
        </div>
      </div>
    </div>
  );
}

export default function BookingModal() {
  const router = useRouter();
  const [bookingCatalog, setBookingCatalog] = useState(() => getFallbackWebsiteBookingCatalog());
  const [catalogStatus, setCatalogStatus] = useState('loading');
  const catalogStatusRef = useRef('loading');
  const catalogHydratedRef = useRef(false);
  const bookingOpenRef = useRef(false);
  const activeBookingInspectionSequenceRef = useRef(0);

  useEffect(() => {
    catalogStatusRef.current = catalogStatus;
  }, [catalogStatus]);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('wall');
  const [formData, setFormData] = useState(createInitialForm());
  const [emailDraft, setEmailDraft] = useState({ email: '', name: '', phone: '' });
  const [wallSearch, setWallSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState(allServiceAreasValue);
  const [matchSelectedService, setMatchSelectedService] = useState(false);
  // 老板 2026-07-19:墙顶部筛选——Nearby / Most booked(默认)/ Service type。
  const [wallSort, setWallSort] = useState('recommended');
  const [serviceTypeFilter, setServiceTypeFilter] = useState(ALL_SERVICE_TYPES_VALUE);
  const [pendingRestingTherapistId, setPendingRestingTherapistId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dateError, setDateError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [customerCoords, setCustomerCoords] = useState(null);
  // 定位死锁修复(老板 2026-07-20 拍板通过):拒绝浏览器定位的客人从墙上补位置。
  const [showWallLocationPicker, setShowWallLocationPicker] = useState(false);
  const [activeBookingDialog, setActiveBookingDialog] = useState(null);
  const [activeCancelContact, setActiveCancelContact] = useState('');
  const [activeCancelConfirming, setActiveCancelConfirming] = useState(false);
  const [activeCancelPending, setActiveCancelPending] = useState(false);
  const [activeCancelError, setActiveCancelError] = useState('');

  const catalogServices = Array.isArray(bookingCatalog.services) ? bookingCatalog.services : [];
  const catalogTherapists = Array.isArray(bookingCatalog.therapists) ? bookingCatalog.therapists : [];
  const specificTherapists = useMemo(() => concreteTherapistsForWall('', catalogTherapists), [catalogTherapists]);
  const hasSpecificTherapists = specificTherapists.length > 0;
  const catalogUnavailable = catalogStatus === 'empty' || (catalogStatus === 'ready' && !hasSpecificTherapists);
  const safeFallbackTherapist = useMemo(() => (
    catalogTherapists.find(therapist => therapist.id === 'any_available')
    || getFallbackWebsiteBookingCatalog('specific_therapist_unavailable').therapists.find(therapist => therapist.id === 'any_available')
    || null
  ), [catalogTherapists]);
  const bookingTherapists = useMemo(() => (
    safeFallbackTherapist && !catalogTherapists.some(therapist => therapist.id === 'any_available')
      ? [...catalogTherapists, safeFallbackTherapist]
      : catalogTherapists
  ), [catalogTherapists, safeFallbackTherapist]);
  // 2026-07-11 老板拍板:下单必选具体技师,"任意技师"入口已移除;
  // safeFallbackTherapist 仅保留给历史链接兜底解析,不再作为可选项展示。
  const selectedTherapist = useMemo(() => findWebsiteTherapist(formData.requestedTechnicianId, bookingTherapists), [bookingTherapists, formData.requestedTechnicianId]);
  const serviceFilterName = formData.preferredService || formData.service;
  const serviceTypeOptions = useMemo(() => serviceTypeOptionsForWall(catalogTherapists), [catalogTherapists]);
  const wallTherapists = useMemo(() => filterTherapistsForWall({
    therapists: catalogTherapists,
    query: wallSearch,
    selectedArea,
    allAreasValue: allServiceAreasValue,
    selectedService: serviceFilterName,
    matchSelectedService,
    serviceType: serviceTypeFilter,
    sortBy: wallSort
  }), [catalogTherapists, matchSelectedService, selectedArea, serviceFilterName, serviceTypeFilter, wallSearch, wallSort]);
  const availableServices = useMemo(() => servicesForTherapist(formData.requestedTechnicianId || 'any_available', bookingTherapists, catalogServices), [bookingTherapists, catalogServices, formData.requestedTechnicianId]);
  const selectedService = useMemo(() => findBookingServiceByName(formData.service, catalogServices), [catalogServices, formData.service]);
  const selectedDuration = useMemo(() => selectedService ? findExactDurationOption(selectedService, formData.durationMinutes) : null, [selectedService, formData.durationMinutes]);
  const selectedServiceOption = useMemo(() => resolveSelectedServiceOption(formData, catalogServices), [catalogServices, formData]);
  const selectedTotalAmount = selectedServiceOption?.price ?? 0;
  const availableTimeSlots = useMemo(() => (
    formData.preferredDate === manilaToday()
      ? timeSlots.filter(time => timeSlotMinutes(time) >= manilaNowMinutes() + BOOKING_LEAD_MINUTES)
      : timeSlots
  ), [formData.preferredDate]);

  useEffect(() => {
    let active = true;
    async function loadBookingCatalog() {
      // 整页刷新后:60 秒内的上次名单先上墙,本次拉取转为背后静默刷新。
      if (!catalogHydratedRef.current) {
        catalogHydratedRef.current = true;
        const cached = readCatalogSessionCache();
        if (cached) {
          setBookingCatalog(cached);
          setCatalogStatus('ready');
          catalogStatusRef.current = 'ready';
        }
      }
      // 墙上已有名单(定位到达的补距离刷新、缓存命中)就保持显示,不再闪回 Loading。
      const hasWall = catalogStatusRef.current === 'ready';
      if (!hasWall) setCatalogStatus('loading');
      try {
        const catalogCoords = isUsableCustomerLocation(customerCoords) ? customerCoords : null;
        const catalogUrl = catalogCoords
          ? apiUrl(`/api/booking-catalog?lat=${encodeURIComponent(catalogCoords.latitude)}&lng=${encodeURIComponent(catalogCoords.longitude)}`)
          : apiUrl('/api/booking-catalog');
        const response = await fetch(catalogUrl, { cache: 'no-store' });
        const payload = await response.json().catch(() => null);
        if (!active || !response.ok || payload?.ok !== true) throw new Error('BOOKING_CATALOG_LOAD_FAILED');
        if (payload.fallback) {
          // 静默刷新撞上兜底名单:保住墙上的真名单,不用假名单顶掉。
          if (catalogStatusRef.current === 'ready') return;
          setBookingCatalog(payload);
          setCatalogStatus('error');
          return;
        }
        setBookingCatalog(payload);
        const payloadServices = Array.isArray(payload.services) ? payload.services : [];
        const payloadTherapists = Array.isArray(payload.therapists) ? payload.therapists.filter(therapist => therapist.id !== 'any_available') : [];
        const nextStatus = payloadServices.length && payloadTherapists.length ? 'ready' : 'empty';
        if (nextStatus === 'ready') writeCatalogSessionCache(payload);
        setCatalogStatus(nextStatus);
      } catch {
        if (!active) return;
        // 静默刷新失败同样保住墙上的名单;只有首拉失败才亮错误卡。
        if (catalogStatusRef.current === 'ready') return;
        setBookingCatalog(getFallbackWebsiteBookingCatalog('website_catalog_proxy_unavailable'));
        setCatalogStatus('error');
      }
    }
    loadBookingCatalog();
    // 老板 2026-07-18:技师墙开着也要实时反映技师端动态(接单→最早可约往后跳,
    // 完成/退单→往前跳)。每 12 秒静默重拉,只在弹窗打开且页面可见时跑,不闪
    // Loading、不顶掉已选技师。
    const liveTimer = window.setInterval(() => {
      if (bookingOpenRef.current && document.visibilityState === 'visible') loadBookingCatalog();
    }, 12000);
    const onVisible = () => {
      if (bookingOpenRef.current && document.visibilityState === 'visible') loadBookingCatalog();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      window.clearInterval(liveTimer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [customerCoords]);

  useEffect(() => {
    bookingOpenRef.current = isOpen;
  }, [isOpen]);

  // 打开弹窗时轻声定位一次:拿到坐标 → 技师列表按距离显示,并预填下单定位。
  // 客人拒绝或不支持时静默跳过,一切照常。
  useEffect(() => {
    if (!isOpen || customerCoords || typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      position => {
        const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        if (!isUsableCustomerLocation(coords)) return;
        setCustomerCoords(coords);
        setFormData(current => (current.customerLocation ? current : { ...current, customerLocation: coords }));
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, [isOpen, customerCoords]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('booking-modal-open');
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('booking-modal-open');
    };
  }, [isOpen]);

  const showActiveBookingDialog = useCallback((reference, { contactHint = '', persist = false } = {}) => {
    if (!isActiveBookingReference(reference)) return false;
    activeBookingInspectionSequenceRef.current += 1;
    if (persist) writeActiveBooking(reference);
    const stored = readStoredSession();
    setActiveBookingDialog({ reference });
    setActiveCancelContact(String(contactHint || stored?.customerEmail || stored?.phone || '').trim());
    setActiveCancelConfirming(false);
    setActiveCancelPending(false);
    setActiveCancelError('');
    return true;
  }, []);

  const inspectStoredActiveBooking = useCallback(async () => {
    const inspectionSequence = ++activeBookingInspectionSequenceRef.current;
    const marker = await resolveActiveBookingGate({
      isCurrent: () => inspectionSequence === activeBookingInspectionSequenceRef.current,
      loadStatus: async reference => {
        const response = await fetch(apiUrl(`/api/booking-status?ref=${encodeURIComponent(reference)}`), { cache: 'no-store' });
        if (!response.ok) return null;
        return response.json().catch(() => null);
      }
    });
    if (inspectionSequence !== activeBookingInspectionSequenceRef.current) return;
    if (!marker) {
      setActiveBookingDialog(null);
      return;
    }
    showActiveBookingDialog(marker.reference);
  }, [showActiveBookingDialog]);

  useEffect(() => {
    const openModal = event => {
      const serviceName = serviceToCatalogName(event?.detail?.service);
      const stored = readStoredSession();
      setError('');
      setDateError('');
      setPhoneError('');
      setWallSearch('');
      setSelectedArea(allServiceAreasValue);
      setMatchSelectedService(false);
      setWallSort('recommended');
      setServiceTypeFilter(ALL_SERVICE_TYPES_VALUE);
      setPendingRestingTherapistId('');
      setIsSubmitting(false);
      setActiveBookingDialog(null);
      setActiveCancelConfirming(false);
      setActiveCancelError('');
      setEmailDraft(stored ? { email: stored.customerEmail, name: stored.customerName || '', phone: stored.phone || '' } : { email: '', name: '', phone: '' });
      setFormData(current => {
        const nextForm = createInitialForm(serviceName, catalogServices);
        return stored ? { ...nextForm, customerEmail: stored.customerEmail, customerName: stored.customerName || current.customerName, phone: stored.phone || current.phone } : nextForm;
      });
      setStep('wall');
      setIsOpen(true);
      void inspectStoredActiveBooking();
    };

    window.addEventListener('open-booking-modal', openModal);
    window.addEventListener('open-booking-modal-with-service', openModal);
    return () => {
      window.removeEventListener('open-booking-modal', openModal);
      window.removeEventListener('open-booking-modal-with-service', openModal);
    };
  }, [catalogServices, inspectStoredActiveBooking]);

  const updateField = (field, value) => {
    setFormData(current => ({ ...current, [field]: value }));
    if (error) setError('');
  };

  const updateCustomerLocation = location => {
    setFormData(current => ({
      ...current,
      customerLocation: isUsableCustomerLocation(location)
        ? { latitude: location.latitude, longitude: location.longitude }
        : null
    }));
    if (error) setError('');
  };

  // 墙上定位入口:选点即刷新技师距离(customerCoords 触发目录重拉),并预填下单定位。
  const handleWallLocationChange = location => {
    if (!isUsableCustomerLocation(location)) return;
    const coords = { latitude: location.latitude, longitude: location.longitude };
    setCustomerCoords(coords);
    updateCustomerLocation(coords);
    setShowWallLocationPicker(false);
  };

  const handlePhoneChange = value => {
    updateField('phone', value);
    if (phoneError) setPhoneError('');
  };

  const validatePhoneField = () => {
    const valid = isValidPhilippineMobile(formData.phone);
    setPhoneError(valid ? '' : phPhoneErrorMessage);
    return valid;
  };

  const handlePreferredDateChange = value => {
    const today = manilaToday();
    const preferredDate = value && value < today ? today : value;
    setDateError(value && value < today ? 'Please pick today or a future date.' : '');
    setFormData(current => ({
      ...current,
      preferredDate,
      preferredTime: isSelectableManilaTime(preferredDate, current.preferredTime) ? current.preferredTime : ''
    }));
    if (error) setError('');
  };

  const enterTherapistDetail = therapist => {
    setFormData(current => {
      const therapistServices = servicesForTherapist(therapist.id, bookingTherapists, catalogServices);
      const currentService = findBookingServiceByName(current.service, catalogServices);
      const selectedServiceAllowed = currentService && therapistServices.some(service => service.id === currentService.id);
      const selectedOption = selectedServiceAllowed ? findExactDurationOption(currentService, current.durationMinutes) : null;
      return {
        ...current,
        requestedTechnicianId: therapist.id,
        serviceId: selectedServiceAllowed ? currentService.id : '',
        service: selectedServiceAllowed ? currentService.name : '',
        durationMinutes: selectedOption?.durationMinutes || '',
        totalAmount: selectedOption?.price || 0
      };
    });
    setError('');
    setStep('detail');
  };

  const openTherapistDetail = therapistId => {
    const therapist = findWebsiteTherapist(therapistId, bookingTherapists);
    if (!therapist) {
      setError('Current service profiles are temporarily unavailable. Please try again later.');
      return;
    }
    if (therapist.onShift !== true) {
      setPendingRestingTherapistId(therapist.id);
      return;
    }
    enterTherapistDetail(therapist);
  };

  const cancelRestingTherapistSelection = () => {
    setPendingRestingTherapistId('');
  };

  const continueRestingTherapistSelection = () => {
    const therapist = findWebsiteTherapist(pendingRestingTherapistId, bookingTherapists);
    setPendingRestingTherapistId('');
    if (!therapist) {
      setError('Current service profiles are temporarily unavailable. Please try again later.');
      return;
    }
    enterTherapistDetail(therapist);
  };

  const handleSelectService = service => {
    setFormData(current => current.serviceId === service.id
      ? current
      : { ...current, serviceId: service.id, service: service.name, durationMinutes: '', totalAmount: 0 });
    if (error) setError('');
  };

  const handleSelectDuration = (service, option) => {
    setFormData(current => ({ ...current, serviceId: service.id, service: service.name, durationMinutes: option.durationMinutes, totalAmount: option.price }));
    if (error) setError('');
  };

  const handleBookSelection = () => {
    if (!selectedServiceOption) return;
    setError('');
    setStep('email');
  };

  const handleEmailContinue = event => {
    event.preventDefault();
    const session = getDefaultBookingSession(emailDraft);
    if (!isValidEmail(session.customerEmail)) {
      setError('Please enter a valid email address to continue.');
      return;
    }
    if (session.phone && !isValidPhone(session.phone)) {
      setError('Please enter a valid WhatsApp or phone number.');
      return;
    }
    saveStoredSession(session);
    setFormData(current => ({ ...current, customerEmail: session.customerEmail, customerName: session.customerName || current.customerName, phone: session.phone || current.phone }));
    setError('');
    setStep('details');
  };

  const validateDetails = () => {
    if (!selectedTherapist) return 'Current service profiles are temporarily unavailable. Please try again later.';
    if (!formData.service || !selectedServiceOption) return 'Please select a valid service duration and price before continuing.';
    if (!isValidEmail(formData.customerEmail)) return 'Please continue with a valid email first.';
    if (!formData.customerName.trim()) return 'Please enter your full name.';
    if (!formData.phone.trim()) {
      setPhoneError(phPhoneErrorMessage);
      return 'Please enter your WhatsApp or phone number.';
    }
    if (!isValidPhilippineMobile(formData.phone)) {
      setPhoneError(phPhoneErrorMessage);
      return phPhoneErrorMessage;
    }
    setPhoneError('');
    // On-demand: no date/time/area pickers — schedule stamps and area are auto-derived.
    if (!formData.addressNote.trim()) return 'Please enter your building, condo, hotel, or exact address details.';
    return null;
  };

  const goBack = () => {
    setError('');
    if (step === 'detail') setStep('wall');
    else if (step === 'email') setStep('detail');
    else if (step === 'details') setStep('email');
    else if (step === 'confirm') setStep('details');
  };

  const handleDetailsContinue = event => {
    event.preventDefault();
    const validationError = validateDetails();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleActiveBookingCancellation = async event => {
    event.preventDefault();
    if (!activeBookingDialog || activeCancelPending) return;
    if (!activeCancelConfirming) {
      setActiveCancelConfirming(true);
      setActiveCancelError('');
      return;
    }
    if (!activeCancelContact.trim()) {
      setActiveCancelError('Enter the booking email or phone to continue.');
      return;
    }
    setActiveCancelPending(true);
    setActiveCancelError('');
    const result = await cancelPublicBooking({
      reference: activeBookingDialog.reference,
      contact: activeCancelContact
    });
    setActiveCancelPending(false);
    if (result.ok) {
      clearActiveBooking({ reference: activeBookingDialog.reference });
      setActiveBookingDialog(null);
      setActiveCancelConfirming(false);
      setActiveCancelContact('');
      return;
    }
    if (result.httpStatus === 404) {
      setActiveCancelError("We couldn't verify that booking with those details.");
      return;
    }
    setActiveCancelError(result.error || 'Booking cancellation is temporarily unavailable. Please try again.');
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const validationError = validateDetails();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');

    const selectedOption = selectedServiceOption;
    if (!selectedOption) {
      setIsSubmitting(false);
      setError('Please select a valid service duration and price before submitting.');
      return;
    }

    const selectedServices = [{
      serviceId: selectedOption.service.id,
      serviceName: selectedOption.service.name,
      durationMinutes: selectedOption.durationMinutes,
      price: selectedOption.price,
      currency: selectedOption.currency || bookingCatalog.currency || 'PHP'
    }];

    // On-demand: schedule + area are derived automatically (no pickers in the form).
    const dispatchDate = manilaToday();
    const dispatchTime = manilaAsapTime();
    const derivedArea = inferAreaFromAddress(formData.addressNote);

    const requestPayload = {
      source: 'website',
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      phone: cleanPhoneForPayload(formData.phone),
      requestedTechnicianId: selectedTherapist.id,
      requestedTechnicianName: selectedTherapist.name,
      requestedTechnicianProfileId: selectedTherapist.profileId || selectedTherapist.id,
      requestedTechnicianProfileName: selectedTherapist.profileName || selectedTherapist.name,
      requestedTechnicianAccountId: selectedTherapist.id === 'any_available' ? '' : (selectedTherapist.technicianAccountId || ''),
      requestedTechnicianAccountName: selectedTherapist.id === 'any_available' ? '' : (selectedTherapist.technicianAccountName || ''),
      therapistPreference: selectedTherapist.id === 'any_available' ? 'any_available' : 'specific_therapist',
      therapistGenderPreference: selectedTherapist.therapistPreference === 'female_preferred' ? 'female' : selectedTherapist.therapistPreference === 'male_preferred' ? 'male' : '',
      selectedTherapistSpecialties: selectedTherapist.specialties,
      selectedServices,
      serviceId: selectedOption.service.id,
      service: selectedOption.service.name,
      durationMinutes: selectedOption.durationMinutes,
      totalAmount: selectedOption.price,
      currency: selectedOption.currency || bookingCatalog.currency || 'PHP',
      preferredDate: dispatchDate,
      preferredTime: dispatchTime,
      area: derivedArea,
      addressNote: formData.addressNote,
      ...(isUsableCustomerLocation(formData.customerLocation) ? {
        customerLocation: {
          latitude: formData.customerLocation.latitude,
          longitude: formData.customerLocation.longitude
        }
      } : {}),
      peopleCount: 1,
      paymentMethod: 'cash_after_service',
      paymentStatus: 'pending_collection',
      paymentTiming: 'after_service',
      notes: formData.notes,
      metadata: {
        website: 'www.easygospa.com',
        form: 'BookingModal',
        submittedFrom: 'public_website',
        bookingFlow: 'therapist_wall_detail_service_cash',
        catalogSource: bookingCatalog.catalogSource || 'catalog_unavailable_safe_fallback',
        requestedTechnicianProfileId: selectedTherapist.profileId || selectedTherapist.id,
        requestedTechnicianProfileName: selectedTherapist.profileName || selectedTherapist.name,
        serviceId: selectedOption.service.id,
        ...(selectedTherapist.id !== 'any_available' && selectedTherapist.technicianAccountId ? { requestedTechnicianAccountId: selectedTherapist.technicianAccountId } : {}),
        ...(selectedTherapist.id !== 'any_available' && selectedTherapist.technicianAccountName ? { requestedTechnicianAccountName: selectedTherapist.technicianAccountName } : {})
      }
    };

    try {
      // 提交紧贴网络请求再校验一次:缺坐标、距离未知、或 >10 km 都不会调用 fetch。
      const guardedSubmission = await submitBookingWithinServiceRadius({
        therapist: selectedTherapist,
        customerLocation: formData.customerLocation,
        submit: () => fetch(apiUrl('/api/booking-request'), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(requestPayload)
        })
      });
      if (!guardedSubmission.ok) throw new Error(guardedSubmission.error);
      const response = guardedSubmission.response;
      const payload = await response.json().catch(() => null);
      if (
        response.status === 409
        && payload?.code === 'ACTIVE_BOOKING_EXISTS'
        && isActiveBookingReference(payload?.activeReference)
      ) {
        setError('');
        showActiveBookingDialog(payload.activeReference, {
          contactHint: formData.customerEmail || formData.phone,
          persist: true
        });
        return;
      }
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error || 'Booking request could not be submitted.');
      const reference = String(payload.reference || payload.bookingRequest?.id || '').trim();
      if (!/^mbr-brand-a-[a-z0-9]+$/i.test(reference)) {
        throw new Error('Booking request was not confirmed by the intake service. Please try again or contact us on WhatsApp.');
      }

      writeActiveBooking(reference);
      activeBookingInspectionSequenceRef.current += 1;
      setIsOpen(false);
      router.push(`/track/${encodeURIComponent(reference)}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Booking request could not be submitted.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    activeBookingInspectionSequenceRef.current += 1;
    setIsOpen(false);
    setError('');
    setPendingRestingTherapistId('');
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={handleClose}>
          <motion.div initial={{ opacity: 0, scale: 0.98, y: 32 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 32 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="flex h-[100dvh] max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-[#F6F7F5] shadow-2xl sm:h-auto sm:max-h-[94vh] sm:rounded-[2rem]" onClick={event => event.stopPropagation()}>
            {step === 'wall' ? (
              <div className="border-b border-gray-100 bg-white p-4 sm:p-5" data-testid="booking-wall-toolbar">
                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={handleClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Close booking modal"><ArrowLeft className="h-5 w-5 text-gray-600" /></button>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-xl font-bold text-[#0F0F0F]">Choose therapist</h2>
                    <p className="mt-1 inline-flex max-w-full items-center gap-1 text-xs font-bold text-[#3F7838]" data-testid="therapist-area-label">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Serving within {MAX_SERVICE_DISTANCE_KM} km</span>
                    </p>
                  </div>
                  <button type="button" onClick={handleClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Close booking modal"><X className="h-5 w-5 text-gray-700" /></button>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-2xl bg-gray-100 px-3">
                    <Search className="h-4 w-4 shrink-0 text-gray-400" />
                    <input value={wallSearch} onChange={event => setWallSearch(event.target.value)} className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-gray-500" placeholder="Search therapist..." />
                  </div>
                </div>
                {/* 老板 2026-07-20:删掉区域下拉——我们只服务 10km 内,按区域名筛选没意义还会误导;
                    Service type 顶上原来的位置,排序保留 Nearby / Most booked。 */}
                <div className="mt-3 flex flex-wrap items-center gap-2" data-testid="booking-wall-filters">
                  <label className="sr-only" htmlFor="therapist-servicetype-filter">Filter therapists by service type</label>
                  <select
                    id="therapist-servicetype-filter"
                    value={serviceTypeFilter}
                    onChange={event => setServiceTypeFilter(event.target.value)}
                    data-testid="therapist-servicetype-filter"
                    className="h-11 max-w-full rounded-full border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 outline-none focus:border-[#4E8D43]"
                  >
                    <option value={ALL_SERVICE_TYPES_VALUE}>Service type</option>
                    {serviceTypeOptions.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <button type="button" onClick={() => setWallSort('nearby')} aria-pressed={wallSort === 'nearby'} data-testid="wall-sort-nearby" className={`h-11 rounded-full border px-4 text-sm font-bold ${wallSort === 'nearby' ? 'border-[#4E8D43] bg-[#4E8D43] text-white' : 'border-gray-200 bg-white text-gray-700'}`}>Nearby</button>
                  <button type="button" onClick={() => setWallSort('recommended')} aria-pressed={wallSort === 'recommended'} data-testid="wall-sort-popular" className={`h-11 rounded-full border px-4 text-sm font-bold ${wallSort === 'recommended' ? 'border-[#4E8D43] bg-[#4E8D43] text-white' : 'border-gray-200 bg-white text-gray-700'}`}>Most booked</button>
                </div>
              </div>
            ) : step !== 'detail' ? (
              <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white p-4 sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <button type="button" onClick={goBack} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Back"><ArrowLeft className="h-5 w-5 text-gray-600" /></button>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-[#0F0F0F] sm:text-2xl">Book EasyGoSpa</h2>
                    <p className="text-sm text-gray-500">Enter your details to continue.</p>
                  </div>
                </div>
                <button type="button" onClick={handleClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Close booking modal"><X className="h-5 w-5 text-gray-600" /></button>
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5" data-testid="booking-modal">

              {error ? <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

              {step === 'wall' ? (
                <div className="space-y-2">
                  {!isUsableCustomerLocation(customerCoords) ? (
                    <div className="mx-1 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4" data-testid="wall-location-entry">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="min-w-0 flex-1 text-sm font-semibold text-amber-900">Share your location to see distances and book a nearby therapist.</p>
                        <button
                          type="button"
                          onClick={() => setShowWallLocationPicker(current => !current)}
                          data-testid="wall-location-entry-toggle"
                          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-[#4E8D43] px-4 text-sm font-bold text-white transition hover:bg-[#3F7838]"
                        >
                          <MapPin className="h-4 w-4" />Confirm my location
                        </button>
                      </div>
                      {showWallLocationPicker ? (
                        <div className="mt-3" data-testid="wall-location-picker">
                          <LocationPicker value={formData.customerLocation} onChange={handleWallLocationChange} />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {catalogStatus === 'ready' ? <p className="px-1 text-sm font-semibold text-gray-600" data-testid="therapist-result-count">{wallTherapists.length} {wallTherapists.length === 1 ? 'therapist' : 'therapists'} available</p> : null}
                  <div className="grid gap-3 px-1 pb-6 sm:grid-cols-2" data-testid="booking-therapist-list">
                    {catalogStatus === 'loading' ? (
                      <div className="rounded-[1.5rem] border border-gray-200 bg-white p-5 text-sm text-gray-700" data-testid="booking-catalog-loading">
                        <p className="font-bold text-[#0F0F0F]">Loading therapists…</p>
                        <p className="mt-1">Checking the current public booking catalog.</p>
                      </div>
                    ) : null}
                    {catalogStatus === 'ready' ? wallTherapists.map(therapist => <TherapistWallCard key={therapist.id} therapist={therapist} selected={formData.requestedTechnicianId === therapist.id} onSelect={openTherapistDetail} onRequireLocation={() => setShowWallLocationPicker(true)} />) : null}
                    {catalogUnavailable ? (
                      <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900" data-testid="booking-catalog-unavailable">
                        <p className="text-base font-bold">{catalogUnavailableNotice}</p>
                        <p className="mt-2 text-sm">{catalogUnavailableFollowUp}</p>
                      </div>
                    ) : null}
                    {catalogStatus === 'error' ? (
                      <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-sm text-red-900" data-testid="booking-catalog-error">
                        <p className="text-base font-bold">Therapist catalog could not be loaded.</p>
                        <p className="mt-2">Live therapist results are unavailable. Please try again in a few minutes, or message us on WhatsApp to book.</p>
                        
                      </div>
                    ) : null}
                    {catalogStatus === 'ready' && hasSpecificTherapists && wallTherapists.length === 0 ? <div className="rounded-[1.5rem] border border-gray-200 bg-white p-5 text-sm text-gray-600" data-testid="booking-search-no-results"><p className="font-bold text-[#0F0F0F]">No therapists match your search.</p><p className="mt-1">Try a different name, area, or service filter.</p></div> : null}
                  </div>
                </div>
              ) : null}

              {step === 'detail' && selectedTherapist ? <TherapistDetail therapist={selectedTherapist} availableServices={availableServices} selectedServiceName={formData.service} selectedDuration={Number(formData.durationMinutes)} totalAmount={selectedTotalAmount} onSelectService={handleSelectService} onSelectDuration={handleSelectDuration} onBack={() => setStep('wall')} onBook={handleBookSelection} /> : null}

              {step === 'email' ? (
                <form onSubmit={handleEmailContinue} className="space-y-5">
                  <div>
                    <h3 className="text-2xl font-bold text-[#0F0F0F]">Use this email for your booking</h3>
                    <p className="mt-2 text-sm text-gray-600">We use email to keep the booking request connected to you. Confirmation still happens on WhatsApp.</p>
                  </div>
                  <div className={summaryCardClass}>
                    <div className="flex justify-between gap-4"><span className={summaryLabelClass}>Therapist</span><strong className={summaryValueClass}>{selectedTherapist.name}</strong></div>
                    <div className="mt-2 flex justify-between gap-4"><span className={summaryLabelClass}>Service</span><strong className={summaryValueClass}>{formData.service} / {formData.durationMinutes} mins</strong></div>
                    <div className="mt-2 flex justify-between gap-4"><span className={summaryLabelClass}>Total</span><strong className={summaryMoneyClass}>{money(selectedTotalAmount)}</strong></div>
                  </div>
                  <label className={bookingLabelClass}><Mail className="mr-2 inline h-4 w-4" />Email *</label>
                  <input className={bookingInputClass} type="email" value={emailDraft.email} onChange={event => setEmailDraft(current => ({ ...current, email: event.target.value }))} placeholder="you@example.com" data-testid="booking-email" data-readability-field="booking-email" required />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={bookingLabelClass}>Name optional</label>
                      <input className={bookingInputClass} value={emailDraft.name} onChange={event => setEmailDraft(current => ({ ...current, name: event.target.value }))} placeholder="Your name" data-readability-field="customerName" />
                    </div>
                    <div>
                      <label className={bookingLabelClass}>Phone optional</label>
                      <input className={bookingInputClass} value={emailDraft.phone} onChange={event => setEmailDraft(current => ({ ...current, phone: event.target.value }))} placeholder="WhatsApp number" data-readability-field="phone" />
                    </div>
                  </div>
                  <button type="submit" className="h-12 w-full rounded-2xl bg-[#4E8D43] px-6 font-bold text-white hover:bg-[#3F7838]">Continue with email</button>
                </form>
              ) : null}

              {step === 'details' ? (
                <form onSubmit={handleDetailsContinue} className="space-y-5">
                  <div>
                    <h3 className="text-2xl font-bold text-[#0F0F0F]">Customer and address details</h3>
                    <p className="mt-2 text-sm text-gray-600">We only need your contact details, schedule, and exact service location.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={bookingLabelClass}><User className="mr-2 inline h-4 w-4" />Full name *</label>
                      <input className={bookingInputClass} value={formData.customerName} onChange={event => updateField('customerName', event.target.value)} placeholder="Your full name" data-readability-field="customerName" required />
                    </div>
                    <div>
                      <label className={bookingLabelClass}><Phone className="mr-2 inline h-4 w-4" />WhatsApp / Phone *</label>
                      <input className={bookingInputClass} value={formData.phone} onChange={event => handlePhoneChange(event.target.value)} onBlur={validatePhoneField} placeholder="+63 900 000 0000" data-readability-field="phone" required />
                      {phoneError ? <p className="mt-2 text-sm font-medium text-red-600">{phoneError}</p> : null}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#eaf1e7] px-4 py-3 text-sm font-medium text-[#3F7838]">
                    <Clock className="mr-2 inline h-4 w-4" />Your therapist departs as soon as the booking is accepted — no scheduling needed.
                  </div>
                  <div>
                    <label className={bookingLabelClass}><MapPin className="mr-2 inline h-4 w-4" />Building, condo, hotel, or exact address *</label>
                    <AddressAutocompleteInput
                      value={formData.addressNote}
                      inputClassName={bookingInputClass}
                      placeholder="Start typing your building, condo, or hotel"
                      onTextChange={text => updateField('addressNote', text)}
                      onLocationResolved={updateCustomerLocation}
                    />
                  </div>
                  <div>
                    <label className={bookingLabelClass}><MapPin className="mr-2 inline h-4 w-4" />Pin your location on the map <span className="font-normal text-gray-500">(helps us send the nearest therapist)</span></label>
                    <LocationPicker value={formData.customerLocation} onChange={updateCustomerLocation} />
                  </div>
                  <div>
                    <label className={bookingLabelClass}><MessageSquare className="mr-2 inline h-4 w-4" />Notes optional</label>
                    <textarea className={bookingTextareaClass} rows={3} value={formData.notes} onChange={event => updateField('notes', event.target.value)} placeholder="Any special request" data-readability-field="notes" />
                  </div>
                  <button type="submit" data-testid="review-cash-booking" className="h-12 w-full rounded-2xl bg-[#4E8D43] px-6 font-bold text-white hover:bg-[#3F7838]">Review cash booking</button>
                </form>
              ) : null}

              {step === 'confirm' ? (
                <form onSubmit={handleSubmit} className="space-y-5" data-testid="confirm-step">
                  <div>
                    <h3 className="text-2xl font-bold text-[#0F0F0F]">Confirm Cash before service</h3>
                    <p className="mt-2 text-sm text-gray-600">Payment will be collected after the massage service. No online payment is collected on this website.</p>
                  </div>
                  <div className={summaryCardClass}>
                    <div className="grid gap-3">
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Therapist</strong><span className={summaryValueClass}>{selectedTherapist.name}</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Service</strong><span className={summaryValueClass}>{formData.service} / {formData.durationMinutes} mins</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Schedule</strong><span className={summaryValueClass}>ASAP — therapist departs after accepting</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Address</strong><span className={summaryValueClass}>{inferAreaFromAddress(formData.addressNote)} - {formData.addressNote}</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Total</strong><span className={summaryMoneyClass}>{money(selectedTotalAmount)}</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Payment</strong><span className={summaryValueClass}>Cash before service</span></div>
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#4E8D43] px-6 font-bold text-white hover:bg-[#3F7838] disabled:cursor-not-allowed disabled:opacity-60">
                    {isSubmitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Submitting...</> : 'Submit booking request'}
                  </button>
                </form>
              ) : null}

            </div>
          </motion.div>
          {activeBookingDialog ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              onClick={event => event.stopPropagation()}
            >
              <motion.form
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="active-booking-dialog-title"
                data-testid="active-booking-dialog"
                className="w-full max-w-md rounded-[1.75rem] border border-amber-200 bg-white p-5 shadow-2xl sm:p-6"
                onSubmit={handleActiveBookingCancellation}
                onClick={event => event.stopPropagation()}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Clock className="h-6 w-6" />
                </div>
                <h2 id="active-booking-dialog-title" className="mt-4 text-2xl font-bold text-[#0F0F0F]">You already have a booking waiting for confirmation</h2>
                <p className="mt-3 break-all font-mono text-xs text-gray-500">{activeBookingDialog.reference}</p>
                {!activeCancelConfirming ? (
                  <div className="mt-6 grid gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        activeBookingInspectionSequenceRef.current += 1;
                        setActiveBookingDialog(null);
                        setIsOpen(false);
                        router.push(`/track/${encodeURIComponent(activeBookingDialog.reference)}`);
                      }}
                      className="h-12 rounded-2xl bg-[#4E8D43] px-4 font-bold text-white transition hover:bg-[#3F7838]"
                    >
                      View my booking
                    </button>
                    <button type="submit" className="h-12 rounded-2xl border border-red-200 bg-white px-4 font-bold text-red-700 transition hover:bg-red-50">
                      Cancel that booking
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    <p className="text-sm leading-6 text-gray-600">Enter the email or phone used for this booking, then confirm cancellation.</p>
                    <div>
                      <label htmlFor="active-booking-contact" className={bookingLabelClass}>Booking email or phone</label>
                      <input
                        id="active-booking-contact"
                        value={activeCancelContact}
                        onChange={event => {
                          setActiveCancelContact(event.target.value);
                          setActiveCancelError('');
                        }}
                        className={bookingInputClass}
                        autoComplete="email"
                        required
                      />
                    </div>
                    {activeCancelError ? <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{activeCancelError}</p> : null}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCancelConfirming(false);
                          setActiveCancelError('');
                        }}
                        className="h-12 rounded-2xl border border-gray-200 bg-white px-4 font-bold text-gray-700 transition hover:bg-gray-50"
                      >
                        Keep booking
                      </button>
                      <button type="submit" disabled={activeCancelPending} className="h-12 rounded-2xl bg-red-600 px-4 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                        {activeCancelPending ? 'Cancelling...' : 'Confirm cancellation'}
                      </button>
                    </div>
                  </div>
                )}
              </motion.form>
            </motion.div>
          ) : null}
          {pendingRestingTherapistId ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
              onClick={event => {
                event.stopPropagation();
                cancelRestingTherapistSelection();
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="resting-therapist-warning-title"
                data-testid="resting-therapist-warning"
                className="w-full max-w-md rounded-[1.75rem] border border-amber-200 bg-white p-5 shadow-2xl sm:p-6"
                onClick={event => event.stopPropagation()}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h2 id="resting-therapist-warning-title" className="mt-4 text-2xl font-bold text-[#0F0F0F]">Warning</h2>
                {findWebsiteTherapist(pendingRestingTherapistId, bookingTherapists)?.technicianAccountId ? (
                  <>
                    <p className="mt-3 text-sm leading-6 text-gray-600">Therapist is currently resting, low chance of accepting orders, do you still want to continue?</p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <button type="button" onClick={cancelRestingTherapistSelection} className="h-12 rounded-2xl border border-gray-200 bg-white px-4 font-bold text-gray-700 transition hover:bg-gray-50">
                        Cancel
                      </button>
                      <button type="button" onClick={continueRestingTherapistSelection} className="h-12 rounded-2xl bg-[#4E8D43] px-4 font-bold text-white transition hover:bg-[#3F7838]">
                        Continue anyway
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-sm leading-6 text-gray-600">This therapist is currently resting and not accepting bookings. Please choose another therapist.</p>
                    <div className="mt-6">
                      <button type="button" onClick={cancelRestingTherapistSelection} className="h-12 w-full rounded-2xl bg-[#4E8D43] px-4 font-bold text-white transition hover:bg-[#3F7838]">
                        Choose another therapist
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
