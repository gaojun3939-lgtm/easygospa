'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Calendar, Check, CheckCircle2, Clock, Heart, Mail, MapPin, MessageSquare, Phone, Search, Share2, ShieldCheck, SlidersHorizontal, Star, User, X } from 'lucide-react';
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

const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'];
const areaOptions = ['BGC', 'Makati', 'Taguig', 'Pasay', 'Ortigas', 'Metro Manila'];
const wallFilters = ['Nearby', 'Most booked', 'Service type'];
const bookingInputClass = 'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-[#0F0F0F] caret-[#0F0F0F] placeholder:text-gray-500 focus:border-[#2db83d] focus:outline-none';
const bookingTextareaClass = `${bookingInputClass} resize-none`;
const bookingLabelClass = 'mb-2 block text-sm font-semibold text-slate-800';
const summaryCardClass = 'rounded-2xl border border-[#2db83d]/30 bg-[#F1FBF3] p-5 text-sm';
const summaryLabelClass = 'font-semibold text-slate-700';
const summaryValueClass = 'text-right font-semibold text-[#0F0F0F]';
const summaryMoneyClass = 'text-right font-bold text-[#0E6F1A]';

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function money(value = 0) {
  return `PHP ${Number(value || 0).toLocaleString('en-US')}`;
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
  const isWall = mode === 'wall';
  const sizeClass = isWall ? 'h-[84px] w-[84px]' : 'h-24 w-24';

  return (
    <img
      src={imageUrl}
      alt={`${therapist.name} therapist`}
      loading="lazy"
      decoding="async"
      className={`${sizeClass} shrink-0 rounded-xl bg-[#EAF8ED] object-cover object-center ring-1 ring-gray-200`}
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
      className={`h-[96px] w-full cursor-pointer overflow-hidden rounded-xl border bg-white p-1.5 text-left shadow-sm transition-all ${selected ? 'border-[#2db83d] shadow-md' : 'border-gray-100 hover:border-[#2db83d]/60 hover:shadow-md'}`}
    >
      <div className="flex h-full gap-2">
        <TherapistAvatar therapist={therapist} mode="wall" />
        <div className="min-w-0 flex-1 self-stretch">
          <div className="flex min-h-full flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-bold leading-5 text-[#0F0F0F]">{therapist.name}</h3>
                <p className="mt-0.5 truncate text-xs font-semibold text-gray-700">{therapist.reviewsLabel}</p>
              </div>
              <div className="flex max-w-[5.6rem] shrink-0 flex-col items-end gap-0.5">
                <span className="line-clamp-2 text-right text-[11px] font-bold leading-tight text-[#168823]">Available after confirmation</span>
                {selected ? <CheckCircle2 className="h-4 w-4 text-[#2db83d]" /> : null}
              </div>
            </div>
            <div className="mt-auto flex items-end justify-between gap-2 pt-1">
              <p className="min-w-0 truncate text-xs text-gray-600">{therapist.distanceLabel}</p>
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation();
                  openDetail();
                }}
                data-testid={`therapist-card-book-${therapist.id}`}
                className="inline-flex h-8 min-w-14 shrink-0 items-center justify-center rounded-full bg-[#4E8D43] px-3 text-xs font-bold text-white transition hover:bg-[#168823]"
              >
                Book
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function ServiceCard({ service, selectedDuration, onSelect, onBook }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <h3 className="font-serif text-lg font-semibold text-[#0F0F0F]">{service.name}</h3>
      <p className="mt-1 text-sm text-gray-600">{service.description}</p>
      <div className="mt-4 grid gap-2">
        {service.durationOptions.map(option => {
          const selected = selectedDuration === option.durationMinutes;
          return (
            <div key={`${service.id}-${option.durationMinutes}`} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 transition-all ${selected ? 'border-[#2db83d] bg-[#2db83d]/5 text-[#0F0F0F]' : 'border-gray-200'}`}>
              <button type="button" onClick={() => onSelect(service, option)} className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{option.durationMinutes} mins</span>
                  {selected ? <Check className="h-4 w-4 text-[#2db83d]" /> : null}
                </div>
                <div className="mt-1 text-sm font-bold text-[#2db83d]">{money(option.price)}</div>
              </button>
              <button
                type="button"
                onClick={() => onBook(service, option)}
                data-testid="service-duration-book"
                className="shrink-0 rounded-full bg-[#4E8D43] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#168823]"
              >
                Book
              </button>
              </div>
          );
        })}
      </div>
    </div>
  );
}

function TherapistDetail({ therapist, availableServices, selectedServiceName, selectedDuration, totalAmount, onSelectService, onBookService, onBack, onContinue }) {
  return (
    <div className="space-y-5 pb-28">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#168823]">
        <ArrowLeft className="h-4 w-4" /> Back to therapist wall
      </button>
      <div className="rounded-3xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <TherapistAvatar therapist={therapist} mode="detail" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#0F0F0F]">{therapist.name}</h3>
                <p className="mt-1 text-sm font-semibold text-gray-800">Massage Therapist</p>
                <p className="mt-1 text-sm text-gray-600">{therapist.distanceLabel}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600" aria-label="Save therapist"><Heart className="h-4 w-4" /></button>
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600" aria-label="Share therapist"><Share2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-[#2db83d]/10 px-2.5 py-1 font-medium text-[#168823]">{therapist.availabilityLabel}</span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">{therapist.reviewsLabel}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {therapist.specialties.map(item => <span key={item} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">{item}</span>)}
            </div>
            <p className="mt-4 text-sm text-gray-600">Service area: {therapist.serviceArea}</p>
          </div>
        </div>
      </div>
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h3 className="font-serif text-xl font-bold text-[#0F0F0F]">About {therapist.name}</h3>
        <p className="mt-2 text-sm leading-6 text-gray-700">{therapist.specialtyDescription}</p>
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#2db83d]/20 bg-[#2db83d]/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-[#168823]" />
            <div>
              <h4 className="font-semibold text-[#0F0F0F]">Safe care information</h4>
              <p className="mt-1 text-sm text-gray-600">No hidden travel fee unless confirmed. We do not show sensitive customer information to therapists before confirmation.</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-gray-400" />
            <h4 className="font-semibold text-[#0F0F0F]">Verified reviews</h4>
          </div>
          {therapist.verifiedReviews?.length ? (
            <div className="mt-3 space-y-2">{therapist.verifiedReviews.map(review => <p key={review.id} className="text-sm text-gray-600">{review.text}</p>)}</div>
          ) : <p className="mt-3 text-sm text-gray-600">No verified reviews yet</p>}
        </div>
      </div>
      <div>
        <h3 className="font-serif text-2xl font-bold text-[#0F0F0F]">My Services</h3>
        <p className="mt-2 text-sm text-gray-600">Select one service and duration for this booking.</p>
        <div className="mt-4 grid gap-4">
          {availableServices.map(service => <ServiceCard key={service.id} service={service} selectedDuration={selectedServiceName === service.name ? Number(selectedDuration) : 0} onSelect={onSelectService} onBook={onBookService} />)}
        </div>
      </div>
      <div className="sticky bottom-0 z-20 -mx-4 border-t border-gray-200 bg-white/95 p-4 backdrop-blur sm:-mx-6 sm:rounded-t-2xl">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Selected summary</p>
            <p className="font-semibold text-[#0F0F0F]">{therapist.name}</p>
            <p className="text-sm text-gray-600">{selectedServiceName || 'Choose a service'} {selectedDuration ? `/ ${selectedDuration} mins` : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-[#2db83d]">{money(totalAmount)}</span>
            <button type="button" onClick={onContinue} disabled={!selectedServiceName || !selectedDuration} data-testid="detail-continue" className="rounded-xl bg-[#2db83d] px-5 py-3 font-semibold text-white hover:bg-[#168823] disabled:cursor-not-allowed disabled:opacity-60">Continue</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingModal() {
  const [bookingCatalog, setBookingCatalog] = useState(() => getFallbackWebsiteBookingCatalog());
  const [catalogNotice, setCatalogNotice] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('wall');
  const [formData, setFormData] = useState(createInitialForm());
  const [emailDraft, setEmailDraft] = useState({ email: '', name: '', phone: '' });
  const [wallSearch, setWallSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(wallFilters[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [error, setError] = useState('');

  const catalogServices = Array.isArray(bookingCatalog.services) ? bookingCatalog.services : [];
  const catalogTherapists = Array.isArray(bookingCatalog.therapists) ? bookingCatalog.therapists : [];
  const catalogUnavailable = Boolean(bookingCatalog.catalogUnavailable || !catalogServices.length || !catalogTherapists.length);
  const selectedTherapist = useMemo(() => findWebsiteTherapist(formData.requestedTechnicianId, catalogTherapists), [catalogTherapists, formData.requestedTechnicianId]);
  const wallTherapists = useMemo(() => {
    const query = wallSearch.trim().toLowerCase();
    return concreteTherapistsForWall(formData.preferredService, catalogTherapists).filter(therapist => {
      if (!query) return true;
      return [therapist.name, therapist.serviceArea, therapist.distanceLabel, ...therapist.specialties].join(' ').toLowerCase().includes(query);
    });
  }, [catalogTherapists, formData.preferredService, wallSearch]);
  const availableServices = useMemo(() => servicesForTherapist(formData.requestedTechnicianId || 'any_available', catalogTherapists, catalogServices), [catalogServices, catalogTherapists, formData.requestedTechnicianId]);
  const selectedService = useMemo(() => findBookingServiceByName(formData.service, catalogServices), [catalogServices, formData.service]);
  const selectedDuration = useMemo(() => selectedService ? findExactDurationOption(selectedService, formData.durationMinutes) : null, [selectedService, formData.durationMinutes]);
  const selectedServiceOption = useMemo(() => resolveSelectedServiceOption(formData, catalogServices), [catalogServices, formData]);
  const selectedTotalAmount = selectedServiceOption?.price ?? 0;

  useEffect(() => {
    let active = true;
    async function loadBookingCatalog() {
      try {
        const response = await fetch('/api/booking-catalog', { cache: 'no-store' });
        const payload = await response.json().catch(() => null);
        if (!active || !response.ok || payload?.ok !== true) throw new Error('BOOKING_CATALOG_LOAD_FAILED');
        setBookingCatalog(payload);
        if (payload.catalogUnavailable) setCatalogNotice('Current service catalog is temporarily unavailable. Please try again later.');
        else if (payload.fallback) setCatalogNotice('Using our backup service menu while the live catalog reloads.');
        else setCatalogNotice('');
      } catch {
        if (!active) return;
        setBookingCatalog(getFallbackWebsiteBookingCatalog('website_catalog_proxy_unavailable'));
        setCatalogNotice('Using our backup service menu while the live catalog reloads.');
      }
    }
    loadBookingCatalog();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const openModal = event => {
      const serviceName = serviceToCatalogName(event?.detail?.service);
      const stored = readStoredSession();
      setCreatedAppointment(null);
      setError('');
      setWallSearch('');
      setActiveFilter(wallFilters[0]);
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

  const chooseDefaultServiceForTherapist = (therapistId, preferredServiceName = formData.preferredService || formData.service) => {
    const nextServices = servicesForTherapist(therapistId, catalogTherapists, catalogServices);
    const preferred = findBookingServiceByName(preferredServiceName, catalogServices);
    const preferredAllowed = preferred && nextServices.some(service => service.name === preferred.name);
    const nextService = preferredAllowed ? preferred : nextServices[0];
    const option = nextService ? getDefaultDurationOption(nextService) : null;
    return { nextService, option };
  };

  const openTherapistDetail = therapistId => {
    const therapist = findWebsiteTherapist(therapistId, catalogTherapists);
    if (!therapist) {
      setError('Current service profiles are temporarily unavailable. Please try again later.');
      return;
    }
    const { nextService, option } = chooseDefaultServiceForTherapist(therapist.id);
    setFormData(current => ({ ...current, requestedTechnicianId: therapist.id, serviceId: nextService?.id || '', service: nextService?.name || '', durationMinutes: option?.durationMinutes || '', totalAmount: option?.price || 0 }));
    setError('');
    setStep('detail');
  };

  const handleSelectService = (service, option) => {
    setFormData(current => ({ ...current, serviceId: service.id, service: service.name, durationMinutes: option.durationMinutes, totalAmount: option.price }));
    if (error) setError('');
  };

  const handleBookService = (service, option) => {
    setFormData(current => ({ ...current, serviceId: service.id, service: service.name, durationMinutes: option.durationMinutes, totalAmount: option.price }));
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
        catalogSource: bookingCatalog.catalogSource || 'local_seed_fallback',
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4" onClick={handleClose}>
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 32 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 32 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={event => event.stopPropagation()}>
            {step === 'wall' ? (
              <div className="border-b border-gray-100 bg-white p-2 sm:p-3" data-testid="booking-wall-toolbar">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Close booking modal"><ArrowLeft className="h-4 w-4 text-gray-600" /></button>
                  <button type="button" className="hidden h-8 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-semibold text-[#0F0F0F] sm:inline-flex">
                    <MapPin className="h-3.5 w-3.5 text-gray-500" />
                    Select area
                  </button>
                  <div className="flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-full bg-gray-100 px-2.5">
                    <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <input value={wallSearch} onChange={event => setWallSearch(event.target.value)} className="w-full bg-transparent text-xs outline-none" placeholder="Search therapist..." />
                  </div>
                  <button type="button" onClick={handleClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white hover:bg-gray-100" aria-label="Close booking modal"><X className="h-4 w-4 text-gray-700" /></button>
                </div>
                <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-0.5" data-testid="booking-wall-filters">
                  <button type="button" className="flex h-8 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700" aria-label="Filters"><SlidersHorizontal className="h-3.5 w-3.5" /></button>
                  {wallFilters.map(filter => <button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={`h-8 shrink-0 whitespace-nowrap rounded-full border px-3 text-xs font-semibold ${activeFilter === filter ? 'border-[#4E8D43] bg-[#4E8D43] text-white' : 'border-gray-200 bg-white text-gray-700'}`}>{filter}</button>)}
                </div>
              </div>
            ) : (
              <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white p-4 sm:p-6">
                <div className="flex min-w-0 items-center gap-3">
                  {step !== 'success' ? (
                    <button type="button" onClick={goBack} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Back"><ArrowLeft className="h-5 w-5 text-gray-600" /></button>
                  ) : null}
                  <div className="min-w-0">
                    <h2 className="font-serif text-xl font-bold text-[#0F0F0F] sm:text-2xl">Book EasyGoSpa</h2>
                    <p className="truncate text-sm text-gray-500">Choose therapist, service, then pay cash after service</p>
                  </div>
                </div>
                <button type="button" onClick={handleClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Close booking modal"><X className="h-5 w-5 text-gray-600" /></button>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3" data-testid="booking-modal">

              {error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

              {step === 'wall' ? (
                <div className="space-y-2">
                  {catalogNotice ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{catalogNotice}</div> : null}
                  <div className="grid max-h-[calc(94vh-86px)] gap-2 overflow-y-auto pr-1 sm:grid-cols-2" data-testid="booking-therapist-list">
                    {!catalogUnavailable ? wallTherapists.map(therapist => <TherapistWallCard key={therapist.id} therapist={therapist} selected={formData.requestedTechnicianId === therapist.id} onSelect={openTherapistDetail} />) : null}
                    {catalogUnavailable ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">Current service profiles are temporarily unavailable. Please try again later.</div> : null}
                    {!catalogUnavailable && wallTherapists.length === 0 ? <div className="rounded-2xl border border-gray-200 p-5 text-sm text-gray-600">No therapist matches this search.</div> : null}
                  </div>
                </div>
              ) : null}

              {step === 'detail' && selectedTherapist ? <TherapistDetail therapist={selectedTherapist} availableServices={availableServices} selectedServiceName={formData.service} selectedDuration={Number(formData.durationMinutes)} totalAmount={selectedTotalAmount} onSelectService={handleSelectService} onBookService={handleBookService} onBack={() => setStep('wall')} onContinue={() => setStep('email')} /> : null}

              {step === 'email' ? (
                <form onSubmit={handleEmailContinue} className="space-y-5">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#0F0F0F]">Use this email for your booking</h3>
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
                  <button type="submit" className="w-full rounded-xl bg-[#2db83d] px-6 py-3 font-semibold text-white hover:bg-[#168823]">Continue with email</button>
                </form>
              ) : null}

              {step === 'details' ? (
                <form onSubmit={handleDetailsContinue} className="space-y-5">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#0F0F0F]">Customer and address details</h3>
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
                    <input className={bookingInputClass} value={formData.addressNote} onChange={event => updateField('addressNote', event.target.value)} placeholder="Unit, floor, building, gate instructions" data-readability-field="addressNote" required />
                  </div>
                  <div>
                    <label className={bookingLabelClass}><MessageSquare className="mr-2 inline h-4 w-4" />Notes optional</label>
                    <textarea className={bookingTextareaClass} rows={3} value={formData.notes} onChange={event => updateField('notes', event.target.value)} placeholder="Any special request" data-readability-field="notes" />
                  </div>
                  <button type="submit" data-testid="review-cash-booking" className="w-full rounded-xl bg-[#2db83d] px-6 py-3 font-semibold text-white hover:bg-[#168823]">Review cash booking</button>
                </form>
              ) : null}

              {step === 'confirm' ? (
                <form onSubmit={handleSubmit} className="space-y-5" data-testid="confirm-step">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#0F0F0F]">Confirm cash after service</h3>
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
                  <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2db83d] px-6 py-3 font-semibold text-white hover:bg-[#168823] disabled:cursor-not-allowed disabled:opacity-60">
                    {isSubmitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Submitting...</> : 'Submit booking request'}
                  </button>
                </form>
              ) : null}

              {step === 'success' ? (
                <div className="space-y-5 py-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100"><Check className="h-8 w-8 text-green-600" /></div>
                  <div>
                    <h3 className="font-serif text-3xl font-bold text-[#0F0F0F]">Booking request submitted</h3>
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
                  <button type="button" onClick={handleClose} className="w-full max-w-xl rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-700 hover:bg-gray-200">Close</button>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
