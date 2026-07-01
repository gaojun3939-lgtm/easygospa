'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Calendar, Check, CheckCircle2, Clock, Heart, Mail, MapPin, MessageSquare, Phone, Search, Share2, ShieldCheck, Sparkles, Star, User, X } from 'lucide-react';
import {
  BOOKING_FLOW_STORAGE_KEY,
  concreteTherapistsForWall,
  findBookingServiceByName,
  findDurationOption,
  findWebsiteTherapist,
  getDefaultBookingSession,
  getDefaultDurationOption,
  isValidEmail,
  servicesForTherapist
} from '../lib/therapistServiceBookingFlow.mjs';

const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'];
const areaOptions = ['BGC', 'Makati', 'Taguig', 'Pasay', 'Ortigas', 'Metro Manila'];
const wallFilters = ['Nearby / Serving my area', 'Most booked', 'Service type'];

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function money(value = 0) {
  return `PHP ${Number(value || 0).toLocaleString('en-US')}`;
}

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function serviceToCatalogName(service = {}) {
  return service?.name || '';
}

function createInitialForm(serviceName = '') {
  const matchedService = findBookingServiceByName(serviceName);
  const durationOption = matchedService ? getDefaultDurationOption(matchedService) : null;
  return {
    customerName: '',
    customerEmail: '',
    phone: '',
    requestedTechnicianId: '',
    preferredService: matchedService?.name || serviceName || '',
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

function StepPill({ active, done, children }) {
  return (
    <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${active ? 'bg-[#2db83d] text-white' : done ? 'bg-[#2db83d]/10 text-[#168823]' : 'bg-gray-100 text-gray-500'}`}>
      {done ? <Check className="h-3.5 w-3.5" /> : null}
      {children}
    </div>
  );
}

function TherapistAvatar({ therapist, large = false }) {
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-[#0F0F0F] font-bold text-white ${large ? 'h-24 w-24 text-2xl' : 'h-14 w-14 text-sm'}`}>
      {therapist.avatarInitials}
    </div>
  );
}

function TherapistWallCard({ therapist, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(therapist.id)}
      data-testid={`therapist-card-${therapist.id}`}
      className={`w-full rounded-2xl border-2 bg-white p-4 text-left transition-all ${selected ? 'border-[#2db83d] shadow-md' : 'border-gray-200 hover:border-[#2db83d]/60 hover:shadow-sm'}`}
    >
      <div className="flex gap-4">
        <TherapistAvatar therapist={therapist} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#0F0F0F]">{therapist.name}</h3>
              <p className="mt-1 text-sm text-gray-600">{therapist.distanceLabel}</p>
            </div>
            {selected ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2db83d]" /> : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-[#2db83d]/10 px-2.5 py-1 font-medium text-[#168823]">{therapist.availabilityLabel}</span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">{therapist.reviewsLabel}</span>
          </div>
          <p className="mt-3 text-sm text-gray-700">{therapist.specialtyDescription}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {therapist.specialties.map(item => <span key={item} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">{item}</span>)}
          </div>
          <p className="mt-3 text-xs text-gray-500">{therapist.serviceArea}</p>
        </div>
      </div>
    </button>
  );
}

function CompactAnyAvailableCard({ therapist, onSelect }) {
  return (
    <button type="button" onClick={() => onSelect(therapist.id)} data-testid="therapist-card-any_available" className="w-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-left transition hover:border-[#2db83d]/60">
      <div className="flex items-center gap-3">
        <TherapistAvatar therapist={therapist} />
        <div>
          <h4 className="font-semibold text-[#0F0F0F]">{therapist.name}</h4>
          <p className="mt-1 text-sm text-gray-600">{therapist.specialtyDescription}</p>
          <p className="mt-1 text-xs text-gray-500">{therapist.availabilityLabel}</p>
        </div>
      </div>
    </button>
  );
}

function ServiceCard({ service, selectedDuration, onSelect }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <h3 className="font-serif text-lg font-semibold text-[#0F0F0F]">{service.name}</h3>
      <p className="mt-1 text-sm text-gray-600">{service.description}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {service.durationOptions.map(option => {
          const selected = selectedDuration === option.durationMinutes;
          return (
            <button key={`${service.id}-${option.durationMinutes}`} type="button" onClick={() => onSelect(service, option)} className={`rounded-xl border px-3 py-3 text-left transition-all ${selected ? 'border-[#2db83d] bg-[#2db83d]/5 text-[#0F0F0F]' : 'border-gray-200 hover:border-[#2db83d]/60'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{option.durationMinutes} mins</span>
                {selected ? <Check className="h-4 w-4 text-[#2db83d]" /> : null}
              </div>
              <div className="mt-1 text-sm font-bold text-[#2db83d]">{money(option.price)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TherapistDetail({ therapist, availableServices, selectedServiceName, selectedDuration, totalAmount, onSelectService, onBack, onContinue }) {
  return (
    <div className="space-y-5 pb-28">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#168823]">
        <ArrowLeft className="h-4 w-4" /> Back to therapist wall
      </button>
      <div className="rounded-3xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <TherapistAvatar therapist={therapist} large />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#0F0F0F]">{therapist.name}</h3>
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
            <p className="mt-4 text-sm text-gray-700">{therapist.specialtyDescription}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {therapist.specialties.map(item => <span key={item} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">{item}</span>)}
            </div>
            <p className="mt-4 text-sm text-gray-600">Service area: {therapist.serviceArea}</p>
          </div>
        </div>
      </div>
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
        <h3 className="font-serif text-2xl font-bold text-[#0F0F0F]">Available services</h3>
        <p className="mt-2 text-sm text-gray-600">Select one service and duration for this booking.</p>
        <div className="mt-4 grid gap-4">
          {availableServices.map(service => <ServiceCard key={service.id} service={service} selectedDuration={selectedServiceName === service.name ? Number(selectedDuration) : 0} onSelect={onSelectService} />)}
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
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('wall');
  const [formData, setFormData] = useState(createInitialForm());
  const [emailDraft, setEmailDraft] = useState({ email: '', name: '', phone: '' });
  const [wallSearch, setWallSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(wallFilters[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [error, setError] = useState('');

  const selectedTherapist = useMemo(() => findWebsiteTherapist(formData.requestedTechnicianId), [formData.requestedTechnicianId]);
  const anyAvailableTherapist = useMemo(() => findWebsiteTherapist('any_available'), []);
  const wallTherapists = useMemo(() => {
    const query = wallSearch.trim().toLowerCase();
    return concreteTherapistsForWall(formData.preferredService).filter(therapist => {
      if (!query) return true;
      return [therapist.name, therapist.serviceArea, therapist.distanceLabel, ...therapist.specialties].join(' ').toLowerCase().includes(query);
    });
  }, [formData.preferredService, wallSearch]);
  const availableServices = useMemo(() => servicesForTherapist(formData.requestedTechnicianId || 'any_available'), [formData.requestedTechnicianId]);
  const selectedService = useMemo(() => findBookingServiceByName(formData.service), [formData.service]);
  const selectedDuration = useMemo(() => selectedService ? findDurationOption(selectedService, formData.durationMinutes) : null, [selectedService, formData.durationMinutes]);

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
        const nextForm = createInitialForm(serviceName);
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
  }, []);

  const updateField = (field, value) => {
    setFormData(current => ({ ...current, [field]: value }));
    if (error) setError('');
  };

  const chooseDefaultServiceForTherapist = (therapistId, preferredServiceName = formData.preferredService || formData.service) => {
    const nextServices = servicesForTherapist(therapistId);
    const preferred = findBookingServiceByName(preferredServiceName);
    const preferredAllowed = preferred && nextServices.some(service => service.name === preferred.name);
    const nextService = preferredAllowed ? preferred : nextServices[0];
    const option = nextService ? getDefaultDurationOption(nextService) : null;
    return { nextService, option };
  };

  const openTherapistDetail = therapistId => {
    const therapist = findWebsiteTherapist(therapistId);
    const { nextService, option } = chooseDefaultServiceForTherapist(therapist.id);
    setFormData(current => ({ ...current, requestedTechnicianId: therapist.id, service: nextService?.name || '', durationMinutes: option?.durationMinutes || '', totalAmount: option?.price || 0 }));
    setError('');
    setStep('detail');
  };

  const handleSelectService = (service, option) => {
    setFormData(current => ({ ...current, service: service.name, durationMinutes: option.durationMinutes, totalAmount: option.price }));
    if (error) setError('');
  };

  const handleEmailContinue = event => {
    event.preventDefault();
    const session = getDefaultBookingSession(emailDraft);
    if (!isValidEmail(session.customerEmail)) {
      setError('Please enter a valid email address to continue.');
      return;
    }
    saveStoredSession(session);
    setFormData(current => ({ ...current, customerEmail: session.customerEmail, customerName: session.customerName || current.customerName, phone: session.phone || current.phone }));
    setError('');
    setStep('details');
  };

  const validateDetails = () => {
    if (!formData.service || !selectedDuration) return 'Please select a service and duration.';
    if (!isValidEmail(formData.customerEmail)) return 'Please continue with a valid email first.';
    if (!formData.customerName.trim()) return 'Please enter your full name.';
    if (!formData.phone.trim()) return 'Please enter your WhatsApp or phone number.';
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

    const selectedServices = [{
      serviceName: formData.service,
      durationMinutes: Number(formData.durationMinutes),
      price: Number(formData.totalAmount),
      currency: 'PHP'
    }];

    const requestPayload = {
      source: 'website',
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      phone: formData.phone,
      requestedTechnicianId: selectedTherapist.id,
      requestedTechnicianName: selectedTherapist.name,
      therapistPreference: selectedTherapist.therapistPreference || 'any_available',
      selectedTherapistSpecialties: selectedTherapist.specialties,
      selectedServices,
      service: formData.service,
      durationMinutes: Number(formData.durationMinutes),
      totalAmount: Number(formData.totalAmount),
      currency: 'PHP',
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
        bookingFlow: 'therapist_wall_detail_service_cash'
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

      setCreatedAppointment({
        id: payload.reference || payload.bookingRequest?.id || '',
        therapist: selectedTherapist.name,
        service: formData.service,
        durationMinutes: Number(formData.durationMinutes),
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        address: `${formData.area} - ${formData.addressNote}`,
        totalAmount: Number(formData.totalAmount),
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
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 32 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 32 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white p-4 sm:p-6">
              <div className="flex min-w-0 items-center gap-3">
                {step !== 'wall' && step !== 'success' ? (
                  <button type="button" onClick={goBack} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Back"><ArrowLeft className="h-5 w-5 text-gray-600" /></button>
                ) : <Sparkles className="h-6 w-6 shrink-0 text-[#2db83d]" />}
                <div className="min-w-0">
                  <h2 className="font-serif text-xl font-bold text-[#0F0F0F] sm:text-2xl">Book EasyGoSpa</h2>
                  <p className="truncate text-sm text-gray-500">Choose therapist, service, then pay cash after service</p>
                </div>
              </div>
              <button type="button" onClick={handleClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Close booking modal"><X className="h-5 w-5 text-gray-600" /></button>
            </div>

            <div className="p-4 sm:p-6" data-testid="booking-modal">
              <div className="mb-5 flex flex-wrap gap-2">
                <StepPill active={step === 'wall'} done={['detail', 'email', 'details', 'confirm', 'success'].includes(step)}>Therapist wall</StepPill>
                <StepPill active={step === 'detail'} done={['email', 'details', 'confirm', 'success'].includes(step)}>Service</StepPill>
                <StepPill active={step === 'email'} done={['details', 'confirm', 'success'].includes(step)}>Email</StepPill>
                <StepPill active={step === 'details'} done={['confirm', 'success'].includes(step)}>Info</StepPill>
                <StepPill active={step === 'confirm'} done={step === 'success'}>Confirm</StepPill>
              </div>

              {error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

              {step === 'wall' ? (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#0F0F0F]">Choose your therapist</h3>
                    <p className="mt-2 text-sm text-gray-600">Pick a real service profile first. Availability is confirmed by our team after you submit.</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <input value={wallSearch} onChange={event => setWallSearch(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search therapist, area, or service" />
                    </div>
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                      {wallFilters.map(filter => <button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${activeFilter === filter ? 'bg-[#0F0F0F] text-white' : 'bg-white text-gray-600'}`}>{filter}</button>)}
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {wallTherapists.map(therapist => <TherapistWallCard key={therapist.id} therapist={therapist} selected={formData.requestedTechnicianId === therapist.id} onSelect={openTherapistDetail} />)}
                    {wallTherapists.length === 0 ? <div className="rounded-2xl border border-gray-200 p-5 text-sm text-gray-600">No therapist matches this search. Try service type or choose any available therapist below.</div> : null}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Need help matching?</p>
                    <CompactAnyAvailableCard therapist={anyAvailableTherapist} onSelect={openTherapistDetail} />
                  </div>
                </div>
              ) : null}

              {step === 'detail' ? <TherapistDetail therapist={selectedTherapist} availableServices={availableServices} selectedServiceName={formData.service} selectedDuration={Number(formData.durationMinutes)} totalAmount={formData.totalAmount} onSelectService={handleSelectService} onBack={() => setStep('wall')} onContinue={() => setStep('email')} /> : null}

              {step === 'email' ? (
                <form onSubmit={handleEmailContinue} className="space-y-5">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#0F0F0F]">Use this email for your booking</h3>
                    <p className="mt-2 text-sm text-gray-600">We use email to keep the booking request connected to you. Confirmation still happens on WhatsApp.</p>
                  </div>
                  <div className="rounded-2xl bg-[#2db83d]/5 p-4 text-sm text-gray-700">
                    <div className="flex justify-between gap-4"><span>Therapist</span><strong className="text-right">{selectedTherapist.name}</strong></div>
                    <div className="mt-2 flex justify-between gap-4"><span>Service</span><strong className="text-right">{formData.service} / {formData.durationMinutes} mins</strong></div>
                    <div className="mt-2 flex justify-between gap-4"><span>Total</span><strong>{money(formData.totalAmount)}</strong></div>
                  </div>
                  <label className="block text-sm font-medium text-gray-700"><Mail className="mr-2 inline h-4 w-4" />Email *</label>
                  <input className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-[#2db83d] focus:outline-none" type="email" value={emailDraft.email} onChange={event => setEmailDraft(current => ({ ...current, email: event.target.value }))} placeholder="you@example.com" data-testid="booking-email" required />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Name optional</label>
                      <input className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-[#2db83d] focus:outline-none" value={emailDraft.name} onChange={event => setEmailDraft(current => ({ ...current, name: event.target.value }))} placeholder="Your name" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Phone optional</label>
                      <input className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-[#2db83d] focus:outline-none" value={emailDraft.phone} onChange={event => setEmailDraft(current => ({ ...current, phone: event.target.value }))} placeholder="WhatsApp number" />
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
                      <label className="mb-2 block text-sm font-medium text-gray-700"><User className="mr-2 inline h-4 w-4" />Full name *</label>
                      <input className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-[#2db83d] focus:outline-none" value={formData.customerName} onChange={event => updateField('customerName', event.target.value)} placeholder="Your full name" required />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700"><Phone className="mr-2 inline h-4 w-4" />WhatsApp / Phone *</label>
                      <input className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-[#2db83d] focus:outline-none" value={formData.phone} onChange={event => updateField('phone', event.target.value)} placeholder="+63 900 000 0000" required />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700"><Calendar className="mr-2 inline h-4 w-4" />Preferred date *</label>
                      <input className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-[#2db83d] focus:outline-none" type="date" min={getTodayDate()} value={formData.preferredDate} onChange={event => updateField('preferredDate', event.target.value)} required />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700"><Clock className="mr-2 inline h-4 w-4" />Preferred time *</label>
                      <select className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-[#2db83d] focus:outline-none" value={formData.preferredTime} onChange={event => updateField('preferredTime', event.target.value)} required>
                        <option value="">Select time</option>
                        {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700"><MapPin className="mr-2 inline h-4 w-4" />Area *</label>
                    <input className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-[#2db83d] focus:outline-none" list="easygospa-area-options" value={formData.area} onChange={event => updateField('area', event.target.value)} placeholder="BGC, Makati, Taguig" required />
                    <datalist id="easygospa-area-options">{areaOptions.map(area => <option key={area} value={area} />)}</datalist>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700"><MapPin className="mr-2 inline h-4 w-4" />Building, condo, hotel, or exact address *</label>
                    <input className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-[#2db83d] focus:outline-none" value={formData.addressNote} onChange={event => updateField('addressNote', event.target.value)} placeholder="Unit, floor, building, gate instructions" required />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700"><MessageSquare className="mr-2 inline h-4 w-4" />Notes optional</label>
                    <textarea className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 focus:border-[#2db83d] focus:outline-none" rows={3} value={formData.notes} onChange={event => updateField('notes', event.target.value)} placeholder="Any special request" />
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
                  <div className="rounded-2xl border border-[#2db83d]/30 bg-[#2db83d]/5 p-5 text-sm">
                    <div className="grid gap-3">
                      <div className="flex justify-between gap-4"><strong>Therapist</strong><span className="text-right">{selectedTherapist.name}</span></div>
                      <div className="flex justify-between gap-4"><strong>Service</strong><span className="text-right">{formData.service} / {formData.durationMinutes} mins</span></div>
                      <div className="flex justify-between gap-4"><strong>Date/time</strong><span className="text-right">{formatDate(formData.preferredDate)} {formData.preferredTime}</span></div>
                      <div className="flex justify-between gap-4"><strong>Address</strong><span className="text-right">{formData.area} - {formData.addressNote}</span></div>
                      <div className="flex justify-between gap-4"><strong>Total</strong><span className="text-right font-bold text-[#168823]">{money(formData.totalAmount)}</span></div>
                      <div className="flex justify-between gap-4"><strong>Payment</strong><span className="text-right">Cash after service</span></div>
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
                  <div className="mx-auto max-w-xl rounded-2xl border border-[#2db83d]/30 bg-[#2db83d]/5 p-5 text-left text-sm">
                    <div className="grid gap-3">
                      <div className="flex justify-between gap-4"><strong>Reference</strong><span className="text-right font-mono text-[#168823]">{createdAppointment?.id || 'Pending'}</span></div>
                      <div className="flex justify-between gap-4"><strong>Selected therapist</strong><span className="text-right">{createdAppointment?.therapist}</span></div>
                      <div className="flex justify-between gap-4"><strong>Selected service</strong><span className="text-right">{createdAppointment?.service} / {createdAppointment?.durationMinutes} mins</span></div>
                      <div className="flex justify-between gap-4"><strong>Date/time</strong><span className="text-right">{formatDate(createdAppointment?.preferredDate)} {createdAppointment?.preferredTime}</span></div>
                      <div className="flex justify-between gap-4"><strong>Address</strong><span className="text-right">{createdAppointment?.address}</span></div>
                      <div className="flex justify-between gap-4"><strong>Total amount</strong><span className="text-right">{money(createdAppointment?.totalAmount)}</span></div>
                      <div className="flex justify-between gap-4"><strong>Payment</strong><span className="text-right">{createdAppointment?.paymentMethod}</span></div>
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
