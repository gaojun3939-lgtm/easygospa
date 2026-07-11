'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Calendar, Check, Clock, Mail, MapPin, MessageSquare, Phone, Search, ShieldCheck, Star, User, X } from 'lucide-react';
import {
  BOOKING_FLOW_STORAGE_KEY,
  DEFAULT_THERAPIST_IMAGE_URL,
  concreteTherapistsForWall,
  findBookingServiceByName,
  findExactDurationOption,
  findWebsiteTherapist,
  getDefaultBookingSession,
  getDefaultDurationOption,
  isValidEmail,
  isValidPhone,
  servicesForTherapist
} from '../lib/therapistServiceBookingFlow.mjs';
import { getFallbackWebsiteBookingCatalog } from '../lib/bookingCatalogNormalizer.mjs';
import { LocationPicker } from './LocationPicker.jsx';
import { AddressAutocompleteInput } from './AddressAutocompleteInput.jsx';

const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'];
const areaOptions = ['BGC', 'Makati', 'Taguig', 'Pasay', 'Ortigas', 'Metro Manila'];
const allServiceAreasValue = 'all_service_areas';
const catalogUnavailableNotice = 'No specific therapist is available right now.';
const catalogUnavailableFollowUp = 'Please try again in a few minutes, or message us on WhatsApp to book.';
const missingProfileIntroduction = 'No profile introduction has been provided yet.';
const bookingInputClass = 'h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 font-medium text-[#0F0F0F] caret-[#0F0F0F] placeholder:text-gray-500 focus:border-[#4E8D43] focus:outline-none';
const bookingTextareaClass = `${bookingInputClass} min-h-28 resize-none py-3`;
const bookingLabelClass = 'mb-2 block text-sm font-semibold text-slate-800';
const summaryCardClass = 'rounded-[1.5rem] border border-[#4E8D43]/30 bg-[#F1FBF3] p-5 text-sm';
const summaryLabelClass = 'font-semibold text-slate-700';
const summaryValueClass = 'text-right font-semibold text-[#0F0F0F]';
const summaryMoneyClass = 'text-right font-bold text-[#0E6F1A]';

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
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

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
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
  const fitClass = isFallback
    ? `${mode === 'wall' ? 'p-2' : 'p-6'} object-contain`
    : 'object-cover object-center';

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

function TherapistWallCard({ therapist, selected, onSelect }) {
  const openDetail = () => onSelect(therapist.id);
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
      className={`w-full cursor-pointer overflow-hidden rounded-[1.5rem] border bg-white p-3 text-left shadow-sm transition-all ${selected ? 'border-[#4E8D43] shadow-md' : 'border-gray-100 hover:border-[#4E8D43]/60 hover:shadow-md'}`}
    >
      <div className="flex min-h-[112px] gap-3">
        <TherapistAvatar therapist={therapist} mode="wall" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="min-w-0 flex-1 truncate text-[17px] font-bold leading-6 text-[#0F0F0F]">{therapist.name}</h3>
            {selected ? <Check className="h-4 w-4 shrink-0 text-[#4E8D43]" /> : null}
          </div>
          <p className="text-sm font-medium text-gray-700">Massage Therapist</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{therapistAreaText(therapist)}</p>
          {Number.isFinite(therapist.distanceKm) ? (
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#3F7838]" data-testid="therapist-distance">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {therapist.distanceKm < 10 ? therapist.distanceKm.toFixed(1) : Math.round(therapist.distanceKm)} km
            </p>
          ) : null}
          <div className="mt-1 text-xs font-medium text-gray-600"><TherapistRating therapist={therapist} /></div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="flex min-w-0 items-center gap-1.5 text-xs font-semibold leading-5 text-[#3F7838]">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Available after confirmation</span>
            </p>
            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                openDetail();
              }}
              data-testid={`therapist-card-book-${therapist.id}`}
              className="inline-flex h-11 min-w-20 shrink-0 items-center justify-center rounded-full bg-[#4E8D43] px-4 text-sm font-bold text-white transition hover:bg-[#3F7838]"
            >
              Book
            </button>
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
  const aboutText = String(therapist.profileIntroduction || '').trim() || missingProfileIntroduction;
  const shouldClampAbout = aboutText.length > 170;
  const visibleServiceTags = availableServices.slice(0, 3).map(service => service.name);
  const remainingServiceCount = Math.max(0, availableServices.length - visibleServiceTags.length);
  const detailImageUrl = resolveTherapistImageUrl(therapist, 'detail');
  const usesFallbackImage = detailImageUrl === DEFAULT_THERAPIST_IMAGE_URL;
  const canBook = Boolean(selectedServiceName && selectedDuration && Number(totalAmount) > 0);

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-32 sm:pb-8" data-testid="therapist-detail-view">
      <section className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm" data-testid="therapist-detail-hero">
        <div className={`relative bg-[#EAF8ED] ${usesFallbackImage ? 'h-[152px] sm:h-[180px]' : 'h-[280px] sm:h-[360px]'}`}>
          <TherapistAvatar therapist={therapist} mode="detail" />
          <button type="button" onClick={onBack} className="absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-sm" aria-label="Back to therapist list"><ArrowLeft className="h-5 w-5" /></button>
          {usesFallbackImage ? <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#3F7838]">EasyGoSpa therapist profile</span> : null}
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
  const [bookingCatalog, setBookingCatalog] = useState(() => getFallbackWebsiteBookingCatalog());
  const [catalogStatus, setCatalogStatus] = useState('loading');
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('wall');
  const [formData, setFormData] = useState(createInitialForm());
  const [emailDraft, setEmailDraft] = useState({ email: '', name: '', phone: '' });
  const [wallSearch, setWallSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState(allServiceAreasValue);
  const [matchSelectedService, setMatchSelectedService] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [error, setError] = useState('');
  const [customerCoords, setCustomerCoords] = useState(null);

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
  const availableAreaFilters = useMemo(() => Array.from(new Set(specificTherapists.flatMap(therapist => Array.isArray(therapist.serviceAreas) ? therapist.serviceAreas : []).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [specificTherapists]);
  const serviceFilterName = formData.preferredService || formData.service;
  const wallTherapists = useMemo(() => {
    const query = wallSearch.trim().toLowerCase();
    const filtered = concreteTherapistsForWall(matchSelectedService ? serviceFilterName : '', catalogTherapists).filter(therapist => {
      const therapistAreas = Array.isArray(therapist.serviceAreas) ? therapist.serviceAreas : [];
      const areaMatches = selectedArea === allServiceAreasValue || therapistAreas.some(area => area.toLowerCase() === selectedArea.toLowerCase());
      if (!areaMatches) return false;
      if (!query) return true;
      return [therapist.name, ...therapistAreas, therapist.serviceArea, ...therapist.specialties].join(' ').toLowerCase().includes(query);
    });
    // Nearest first when distances are available; therapists without a
    // distance keep their original order after the located ones.
    if (filtered.some(therapist => Number.isFinite(therapist.distanceKm))) {
      return filtered
        .map((therapist, index) => ({ therapist, index }))
        .sort((a, b) => {
          const aKm = Number.isFinite(a.therapist.distanceKm) ? a.therapist.distanceKm : Infinity;
          const bKm = Number.isFinite(b.therapist.distanceKm) ? b.therapist.distanceKm : Infinity;
          if (aKm !== bKm) return aKm - bKm;
          return a.index - b.index;
        })
        .map(item => item.therapist);
    }
    return filtered;
  }, [catalogTherapists, matchSelectedService, selectedArea, serviceFilterName, wallSearch]);
  const availableServices = useMemo(() => servicesForTherapist(formData.requestedTechnicianId || 'any_available', bookingTherapists, catalogServices), [bookingTherapists, catalogServices, formData.requestedTechnicianId]);
  const selectedService = useMemo(() => findBookingServiceByName(formData.service, catalogServices), [catalogServices, formData.service]);
  const selectedDuration = useMemo(() => selectedService ? findExactDurationOption(selectedService, formData.durationMinutes) : null, [selectedService, formData.durationMinutes]);
  const selectedServiceOption = useMemo(() => resolveSelectedServiceOption(formData, catalogServices), [catalogServices, formData]);
  const selectedTotalAmount = selectedServiceOption?.price ?? 0;

  useEffect(() => {
    let active = true;
    async function loadBookingCatalog() {
      setCatalogStatus('loading');
      try {
        const catalogUrl = customerCoords
          ? `/api/booking-catalog?lat=${encodeURIComponent(customerCoords.latitude)}&lng=${encodeURIComponent(customerCoords.longitude)}`
          : '/api/booking-catalog';
        const response = await fetch(catalogUrl, { cache: 'no-store' });
        const payload = await response.json().catch(() => null);
        if (!active || !response.ok || payload?.ok !== true) throw new Error('BOOKING_CATALOG_LOAD_FAILED');
        setBookingCatalog(payload);
        if (payload.fallback) {
          setCatalogStatus('error');
          return;
        }
        const payloadServices = Array.isArray(payload.services) ? payload.services : [];
        const payloadTherapists = Array.isArray(payload.therapists) ? payload.therapists.filter(therapist => therapist.id !== 'any_available') : [];
        setCatalogStatus(payloadServices.length && payloadTherapists.length ? 'ready' : 'empty');
      } catch {
        if (!active) return;
        setBookingCatalog(getFallbackWebsiteBookingCatalog('website_catalog_proxy_unavailable'));
        setCatalogStatus('error');
      }
    }
    loadBookingCatalog();
    return () => {
      active = false;
    };
  }, [customerCoords]);

  // 打开弹窗时轻声定位一次:拿到坐标 → 技师列表按距离显示,并预填下单定位。
  // 客人拒绝或不支持时静默跳过,一切照常。
  useEffect(() => {
    if (!isOpen || customerCoords || typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      position => {
        const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
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

  useEffect(() => {
    const openModal = event => {
      const serviceName = serviceToCatalogName(event?.detail?.service);
      const stored = readStoredSession();
      setCreatedAppointment(null);
      setError('');
      setWallSearch('');
      setSelectedArea(allServiceAreasValue);
      setMatchSelectedService(false);
      setIsSubmitting(false);
      setEmailDraft(stored ? { email: stored.customerEmail, name: stored.customerName || '', phone: stored.phone || '' } : { email: '', name: '', phone: '' });
      setFormData(current => {
        const nextForm = createInitialForm(serviceName, catalogServices);
        return stored ? { ...nextForm, customerEmail: stored.customerEmail, customerName: stored.customerName || current.customerName, phone: stored.phone || current.phone } : nextForm;
      });
      setStep('wall');
      setIsOpen(true);
    };

    window.addEventListener('open-booking-modal', openModal);
    window.addEventListener('open-booking-modal-with-service', openModal);
    return () => {
      window.removeEventListener('open-booking-modal', openModal);
      window.removeEventListener('open-booking-modal-with-service', openModal);
    };
  }, [catalogServices]);

  const updateField = (field, value) => {
    setFormData(current => ({ ...current, [field]: value }));
    if (error) setError('');
  };

  const openTherapistDetail = therapistId => {
    const therapist = findWebsiteTherapist(therapistId, bookingTherapists);
    if (!therapist) {
      setError('Current service profiles are temporarily unavailable. Please try again later.');
      return;
    }
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
    if (!formData.phone.trim()) return 'Please enter your WhatsApp or phone number.';
    if (!isValidPhone(formData.phone)) return 'Please enter a valid WhatsApp or phone number.';
    if (!formData.preferredDate) return 'Please select your preferred date.';
    if (formData.preferredDate < getTodayDate()) return 'Please select today or a future date.';
    if (!formData.preferredTime) return 'Please select your preferred time.';
    if (!formData.area.trim()) return 'Please enter your area.';
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

    const requestPayload = {
      source: 'website',
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      phone: formData.phone,
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
      preferredDate: formData.preferredDate,
      preferredTime: formData.preferredTime,
      area: formData.area,
      addressNote: formData.addressNote,
      ...(formData.customerLocation?.latitude ? {
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
      const response = await fetch('/api/booking-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error || 'Booking request could not be submitted.');
      const reference = String(payload.reference || payload.bookingRequest?.id || '').trim();
      if (!/^mbr-brand-a-[a-z0-9]+$/i.test(reference)) {
        throw new Error('Booking request was not confirmed by the intake service. Please try again or contact us on WhatsApp.');
      }

      setCreatedAppointment({
        id: reference,
        therapist: selectedTherapist.name,
        service: selectedOption.service.name,
        durationMinutes: selectedOption.durationMinutes,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        address: `${formData.area} - ${formData.addressNote}`,
        totalAmount: selectedOption.price,
        paymentMethod: 'Cash after service'
      });
      setStep('success');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Booking request could not be submitted.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setError('');
    if (step === 'success') {
      setCreatedAppointment(null);
      setFormData(createInitialForm());
      setStep('wall');
    }
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
                      <span className="truncate">{selectedArea === allServiceAreasValue ? 'All service areas' : selectedArea}</span>
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
                <div className="mt-3 flex flex-wrap items-center gap-2" data-testid="booking-wall-filters">
                  <label className="sr-only" htmlFor="therapist-area-filter">Filter therapists by service area</label>
                  <select
                    id="therapist-area-filter"
                    value={selectedArea}
                    onChange={event => setSelectedArea(event.target.value)}
                    data-testid="therapist-area-filter"
                    className="h-11 max-w-full rounded-full border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 outline-none focus:border-[#4E8D43]"
                  >
                    <option value={allServiceAreasValue}>All service areas</option>
                    {availableAreaFilters.map(area => <option key={area} value={area}>{area}</option>)}
                  </select>
                  {serviceFilterName ? (
                    <button type="button" onClick={() => setMatchSelectedService(current => !current)} aria-pressed={matchSelectedService} className={`h-11 rounded-full border px-4 text-sm font-bold ${matchSelectedService ? 'border-[#4E8D43] bg-[#4E8D43] text-white' : 'border-gray-200 bg-white text-gray-700'}`}>
                      {matchSelectedService ? 'All therapists' : 'Matches selected service'}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : step !== 'detail' ? (
              <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white p-4 sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                  {step !== 'success' ? (
                    <button type="button" onClick={goBack} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Back"><ArrowLeft className="h-5 w-5 text-gray-600" /></button>
                  ) : null}
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
                  {catalogStatus === 'ready' ? <p className="px-1 text-sm font-semibold text-gray-600" data-testid="therapist-result-count">{wallTherapists.length} {wallTherapists.length === 1 ? 'therapist' : 'therapists'} available</p> : null}
                  <div className="grid gap-3 px-1 pb-6 sm:grid-cols-2" data-testid="booking-therapist-list">
                    {catalogStatus === 'loading' ? (
                      <div className="rounded-[1.5rem] border border-gray-200 bg-white p-5 text-sm text-gray-700" data-testid="booking-catalog-loading">
                        <p className="font-bold text-[#0F0F0F]">Loading therapists…</p>
                        <p className="mt-1">Checking the current public booking catalog.</p>
                      </div>
                    ) : null}
                    {catalogStatus === 'ready' ? wallTherapists.map(therapist => <TherapistWallCard key={therapist.id} therapist={therapist} selected={formData.requestedTechnicianId === therapist.id} onSelect={openTherapistDetail} />) : null}
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
                      <input className={bookingInputClass} value={formData.phone} onChange={event => updateField('phone', event.target.value)} placeholder="+63 900 000 0000" data-readability-field="phone" required />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={bookingLabelClass}><Calendar className="mr-2 inline h-4 w-4" />Preferred date *</label>
                      <input className={bookingInputClass} type="date" min={getTodayDate()} value={formData.preferredDate} onChange={event => updateField('preferredDate', event.target.value)} data-readability-field="preferredDate" required />
                    </div>
                    <div>
                      <label className={bookingLabelClass}><Clock className="mr-2 inline h-4 w-4" />Preferred time *</label>
                      <select className={bookingInputClass} value={formData.preferredTime} onChange={event => updateField('preferredTime', event.target.value)} data-readability-field="preferredTime" required>
                        <option value="">Select time</option>
                        {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={bookingLabelClass}><MapPin className="mr-2 inline h-4 w-4" />Area *</label>
                    <input className={bookingInputClass} list="easygospa-area-options" value={formData.area} onChange={event => updateField('area', event.target.value)} placeholder="BGC, Makati, Taguig" data-readability-field="area" required />
                    <datalist id="easygospa-area-options">{areaOptions.map(area => <option key={area} value={area} />)}</datalist>
                  </div>
                  <div>
                    <label className={bookingLabelClass}><MapPin className="mr-2 inline h-4 w-4" />Building, condo, hotel, or exact address *</label>
                    <AddressAutocompleteInput
                      value={formData.addressNote}
                      inputClassName={bookingInputClass}
                      placeholder="Start typing your building, condo, or hotel"
                      onTextChange={text => updateField('addressNote', text)}
                      onLocationResolved={location => updateField('customerLocation', { latitude: location.latitude, longitude: location.longitude })}
                    />
                  </div>
                  <div>
                    <label className={bookingLabelClass}><MapPin className="mr-2 inline h-4 w-4" />Pin your location on the map <span className="font-normal text-gray-500">(helps us send the nearest therapist)</span></label>
                    <LocationPicker value={formData.customerLocation} onChange={location => updateField('customerLocation', location)} />
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
                    <h3 className="text-2xl font-bold text-[#0F0F0F]">Confirm cash after service</h3>
                    <p className="mt-2 text-sm text-gray-600">Payment will be collected after the massage service. No online payment is collected on this website.</p>
                  </div>
                  <div className={summaryCardClass}>
                    <div className="grid gap-3">
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Therapist</strong><span className={summaryValueClass}>{selectedTherapist.name}</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Service</strong><span className={summaryValueClass}>{formData.service} / {formData.durationMinutes} mins</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Date/time</strong><span className={summaryValueClass}>{formatDate(formData.preferredDate)} {formData.preferredTime}</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Address</strong><span className={summaryValueClass}>{formData.area} - {formData.addressNote}</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Total</strong><span className={summaryMoneyClass}>{money(selectedTotalAmount)}</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Payment</strong><span className={summaryValueClass}>Cash after service</span></div>
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#4E8D43] px-6 font-bold text-white hover:bg-[#3F7838] disabled:cursor-not-allowed disabled:opacity-60">
                    {isSubmitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Submitting...</> : 'Submit booking request'}
                  </button>
                </form>
              ) : null}

              {step === 'success' ? (
                <div className="space-y-5 py-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100"><Check className="h-8 w-8 text-green-600" /></div>
                  <div>
                    <h3 className="text-3xl font-bold text-[#0F0F0F]">Booking request submitted</h3>
                    <p className="mt-2 text-gray-600">Our team will contact you on WhatsApp to confirm therapist availability.</p>
                  </div>
                  <div className={`${summaryCardClass} mx-auto max-w-xl text-left`}>
                    <div className="grid gap-3">
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Booking reference</strong><span className="text-right font-mono text-[#0F0F0F] font-bold">{createdAppointment?.id}</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Selected therapist</strong><span className={summaryValueClass}>{createdAppointment?.therapist}</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Selected service</strong><span className={summaryValueClass}>{createdAppointment?.service} / {createdAppointment?.durationMinutes} mins</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Date/time</strong><span className={summaryValueClass}>{formatDate(createdAppointment?.preferredDate)} {createdAppointment?.preferredTime}</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Address</strong><span className={summaryValueClass}>{createdAppointment?.address}</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Total amount</strong><span className={summaryMoneyClass}>{money(createdAppointment?.totalAmount)}</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Payment</strong><span className={summaryValueClass}>{createdAppointment?.paymentMethod}</span></div>
                    </div>
                  </div>
                  <button type="button" onClick={handleClose} className="h-12 w-full max-w-xl rounded-2xl bg-gray-100 px-6 font-bold text-gray-700 hover:bg-gray-200">Close</button>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
