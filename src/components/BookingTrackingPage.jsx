'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Clock3,
  Copy,
  MapPin,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Star
} from 'lucide-react';
import {
  BOOKING_STATUS_STEPS,
  DEFAULT_BOOKING_POLL_MS,
  WAITING_ACCEPTANCE_POLL_MS,
  buildBookingUpdatesWhatsAppUrl,
  buildBookingWhatsAppUrl,
  formatManilaBookingDateTime,
  getBookingPollingIntervalMs,
  getBookingStatusStepIndex,
  isTherapistArrivalTransition,
  isTherapistConfirmationTransition,
  shouldShowBookingUpdatesBanner
} from '../lib/bookingStatus.mjs';
import { apiUrl } from '../lib/apiUrl.js';
import { clearActiveBooking } from '../lib/activeBooking.mjs';
import { cancelPublicBooking } from '../lib/publicBookingCancel.mjs';
import { BOOKING_FLOW_STORAGE_KEY } from '../lib/therapistServiceBookingFlow.mjs';

function readStoredBookingEmail() {
  if (typeof window === 'undefined') return '';
  try {
    const session = JSON.parse(window.sessionStorage.getItem(BOOKING_FLOW_STORAGE_KEY) || 'null');
    return String(session?.customerEmail || '').trim().toLowerCase();
  } catch {
    return '';
  }
}

function reviewStorageKey(reference) {
  return `egCompletedReview.v1.${String(reference || '').trim()}`;
}

function CompletedBookingReview({ reference, therapistName }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('ready');
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail(readStoredBookingEmail());
    try {
      const stored = JSON.parse(window.localStorage.getItem(reviewStorageKey(reference)) || 'null');
      if (stored?.submitted === true) {
        setStars(Math.max(1, Math.min(5, Math.round(Number(stored.stars) || 5))));
        setState('submitted');
      }
    } catch {}
  }, [reference]);

  const submitReview = async event => {
    event.preventDefault();
    if (state === 'submitting' || state === 'submitted') return;
    if (stars < 1 || stars > 5) {
      setError('Choose a star rating first.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter the email used for this booking.');
      return;
    }
    setState('submitting');
    setError('');
    try {
      const response = await fetch(apiUrl('/api/booking-review'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reference, email: email.trim().toLowerCase(), rating: stars, comment: comment.trim() })
      });
      const payload = await response.json().catch(() => null);
      const duplicateReviewCodes = new Set(['BOOKING_REVIEW_ALREADY_SUBMITTED', 'BOOKING_REVIEW_CONFLICT', 'REVIEW_ALREADY_EXISTS', 'DUPLICATE_REVIEW']);
      if (response.status === 409 && duplicateReviewCodes.has(String(payload?.code || ''))) {
        window.localStorage.setItem(reviewStorageKey(reference), JSON.stringify({ submitted: true, stars }));
        setState('submitted');
        return;
      }
      if (!response.ok || payload?.ok !== true || !payload?.coupon?.id) {
        throw new Error(payload?.error || 'Your review could not be submitted. Please try again.');
      }
      window.localStorage.setItem(reviewStorageKey(reference), JSON.stringify({ submitted: true, stars }));
      setState('submitted');
    } catch (submitError) {
      setState('ready');
      setError(submitError instanceof Error ? submitError.message : 'Your review could not be submitted. Please try again.');
    }
  };

  return (
    <section className="rounded-[2rem] border border-[#e0a52b]/35 bg-[linear-gradient(135deg,#fffaf0,#ffffff)] p-5 shadow-sm sm:p-7" data-testid="completed-booking-review">
      {state === 'submitted' ? (
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-7 w-7" /></span>
          <h2 className="mt-4 text-2xl font-bold text-[#17142f]">Thanks! {'★'.repeat(stars)}</h2>
          <p className="mt-2 text-sm font-semibold text-emerald-700">A ₱50 coupon is now in your wallet.</p>
          <p className="mt-2 text-xs text-slate-500">Each completed booking can be reviewed once.</p>
        </div>
      ) : (
        <form onSubmit={submitReview}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a6518]">Review &amp; get a ₱50 coupon</p>
          <h2 className="mt-2 text-2xl font-bold text-[#17142f]">How was {therapistName}?</h2>
          <div className="mt-4 flex flex-wrap gap-1" role="radiogroup" aria-label="Star rating">
            {[1, 2, 3, 4, 5].map(value => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={stars === value}
                aria-label={`${value} star${value === 1 ? '' : 's'}`}
                onClick={() => { setStars(value); setError(''); }}
                className="flex h-11 w-11 items-center justify-center rounded-xl transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-[#e0a52b]"
              >
                <Star className={`h-9 w-9 ${value <= stars ? 'fill-[#f0a41c] text-[#f0a41c]' : 'text-slate-300'}`} />
              </button>
            ))}
          </div>
          <div className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ${stars ? 'mt-4 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="min-h-0 space-y-4">
              <div>
                <label htmlFor="review-comment" className="mb-2 block text-sm font-semibold text-slate-800">Tell us more <span className="font-normal text-slate-400">(optional)</span></label>
                <textarea id="review-comment" value={comment} onChange={event => setComment(event.target.value.slice(0, 1000))} rows={4} className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#17142f] outline-none focus:border-[#e0a52b]" placeholder="What stood out about your massage?" />
              </div>
              <div>
                <label htmlFor="review-email" className="mb-2 block text-sm font-semibold text-slate-800">Booking email</label>
                <input id="review-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-[#17142f] outline-none focus:border-[#e0a52b]" placeholder="you@example.com" required />
                <p className="mt-1 text-xs text-slate-500">Used only to verify that this completed booking is yours.</p>
              </div>
              {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
              <button type="submit" disabled={state === 'submitting'} className="h-12 w-full rounded-2xl bg-[#211c46] px-6 font-bold text-white hover:bg-[#17142f] disabled:opacity-60">{state === 'submitting' ? 'Submitting…' : 'Submit review'}</button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}

function notifyTherapistConfirmed(therapistName) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(200);
  } catch {}
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const notification = new Notification('EasyGoSpa', { body: `${therapistName} confirmed your booking` });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {}
}

function notifyTherapistArrived() {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const notification = new Notification('EasyGoSpa', { body: 'Your therapist has arrived' });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {}
}

function WhatsAppButton({ reference, whatsapp, compact = false }) {
  return (
    <a
      href={buildBookingWhatsAppUrl(whatsapp, reference)}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1F9D55] font-bold text-white shadow-sm transition hover:bg-[#188548] ${compact ? 'h-11 px-5 text-sm' : 'h-12 w-full px-6'}`}
    >
      <MessageCircle className="h-5 w-5" />
      Contact us on WhatsApp
    </a>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl animate-pulse space-y-5" data-testid="booking-tracker-loading">
      <div className="h-40 rounded-[2rem] bg-white/70" />
      <div className="space-y-4 rounded-[2rem] bg-white p-6 shadow-sm">
        {[0, 1, 2, 3].map(item => <div key={item} className="h-14 rounded-2xl bg-slate-100" />)}
      </div>
    </div>
  );
}

function StateCard({ icon, title, body, action }) {
  return (
    <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">{icon}</div>
      <h1 className="mt-5 text-2xl font-bold text-[#17142f]">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
      <div className="mt-6">{action}</div>
    </div>
  );
}

function TherapistBadge({ therapist }) {
  if (!therapist) return null;
  const initial = therapist.name?.charAt(0)?.toUpperCase() || 'T';

  return (
    <div className="mt-3 flex min-w-0 items-center gap-3 rounded-2xl border border-[#e0a52b]/25 bg-[#fffaf0] p-3">
      {therapist.avatarUrl ? (
        <img src={therapist.avatarUrl} alt={`${therapist.name || 'Therapist'} profile`} className="h-11 w-11 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#211c46] font-bold text-[#f6d27a]">{initial}</span>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Your therapist</p>
        <p className="truncate font-bold text-[#17142f]">{therapist.name || 'Assigned therapist'}</p>
      </div>
    </div>
  );
}

function BookingStatusTimeline({ booking }) {
  const currentIndex = getBookingStatusStepIndex(booking.status);

  if (booking.status === 'cancelled') {
    return (
      <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6" data-testid="booking-status-cancelled">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-600 text-white"><AlertTriangle className="h-5 w-5" /></div>
          <div>
            <h2 className="text-xl font-bold text-red-900">Booking cancelled</h2>
            <p className="mt-2 text-sm leading-6 text-red-800">This booking is no longer active. Message us on WhatsApp if you need help.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ol className="space-y-0" aria-label="Booking progress" data-testid="booking-status-timeline">
      {BOOKING_STATUS_STEPS.map((step, index) => {
        const isPast = index < currentIndex;
        const isCurrent = index === currentIndex;
        const showTherapist = step.status === 'on_the_way' && booking.therapist;
        const showEta = step.status === 'on_the_way' && booking.status === 'on_the_way' && Number.isFinite(booking.etaMinutes);

        return (
          <li key={step.status} className="relative flex gap-4 pb-7 last:pb-0" aria-current={isCurrent ? 'step' : undefined}>
            {index < BOOKING_STATUS_STEPS.length - 1 ? (
              <span className={`absolute left-[19px] top-10 h-[calc(100%-2.1rem)] w-0.5 ${index < currentIndex ? 'bg-[#e0a52b]' : 'bg-slate-200'}`} aria-hidden="true" />
            ) : null}
            <span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${isPast ? 'border-[#e0a52b] bg-[#e0a52b] text-[#17142f]' : isCurrent ? 'animate-pulse border-[#f6d27a] bg-[#211c46] text-[#f6d27a] shadow-[0_0_0_6px_rgba(224,165,43,0.16)]' : 'border-slate-200 bg-white text-slate-400'}`}>
              {isPast ? <Check className="h-5 w-5" /> : isCurrent ? <Clock3 className="h-5 w-5" /> : <span className="h-2.5 w-2.5 rounded-full bg-current" />}
            </span>
            <div className={`min-w-0 flex-1 pt-1.5 ${isCurrent ? 'text-[#17142f]' : isPast ? 'text-slate-700' : 'text-slate-400'}`}>
              <p className="font-bold">{step.label}</p>
              {showEta ? <p className="mt-1 text-sm font-semibold text-[#8a6518]">Estimated arrival: {Math.round(booking.etaMinutes)} minutes</p> : null}
              {showTherapist ? <TherapistBadge therapist={booking.therapist} /> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function BookingTrackingPage({ reference }) {
  const [viewState, setViewState] = useState('loading');
  const [booking, setBooking] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmationNotice, setConfirmationNotice] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelContact, setCancelContact] = useState('');
  const [cancelPending, setCancelPending] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const previousStatusRef = useRef(null);
  const lastTherapistNameRef = useRef('');
  const notificationPermissionRequestedRef = useRef(false);
  const confirmationNotifiedRef = useRef(false);
  const arrivalNotifiedRef = useRef(false);
  const requestSequenceRef = useRef(0);

  const loadBooking = useCallback(async ({ silent = false } = {}) => {
    const requestSequence = ++requestSequenceRef.current;
    if (!reference) {
      setViewState('not_found');
      setIsRefreshing(false);
      return;
    }
    if (silent) setIsRefreshing(true);
    else setViewState('loading');

    try {
      const response = await fetch(apiUrl(`/api/booking-status?ref=${encodeURIComponent(reference)}`), { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (requestSequence !== requestSequenceRef.current) return;
      if (response.status === 404 || payload?.reason === 'not_found') {
        setBooking(null);
        setViewState('not_found');
        return;
      }
      if (!response.ok || payload?.ok !== true) throw new Error('BOOKING_STATUS_LOAD_FAILED');
      const previousStatus = previousStatusRef.current;
      const nextStatus = payload.status;
      const therapistName = payload.therapist?.name || lastTherapistNameRef.current || 'Your Therapist';
      if (payload.therapist?.name) lastTherapistNameRef.current = payload.therapist.name;
      if (isTherapistConfirmationTransition(previousStatus, nextStatus) && !confirmationNotifiedRef.current) {
        confirmationNotifiedRef.current = true;
        setConfirmationNotice(`✅ ${therapistName} confirmed your booking!`);
        notifyTherapistConfirmed(therapistName);
      }
      if (isTherapistArrivalTransition(previousStatus, nextStatus) && !arrivalNotifiedRef.current) {
        arrivalNotifiedRef.current = true;
        notifyTherapistArrived();
      }
      previousStatusRef.current = nextStatus;
      if (nextStatus !== 'waiting_acceptance') {
        clearActiveBooking({ reference });
      }
      setBooking(payload);
      setViewState('ready');
    } catch {
      if (requestSequence === requestSequenceRef.current) setViewState('error');
    } finally {
      if (requestSequence === requestSequenceRef.current) setIsRefreshing(false);
    }
  }, [reference]);

  useEffect(() => {
    previousStatusRef.current = null;
    lastTherapistNameRef.current = '';
    confirmationNotifiedRef.current = false;
    arrivalNotifiedRef.current = false;
    notificationPermissionRequestedRef.current = false;
    setConfirmationNotice('');
    loadBooking();
  }, [loadBooking]);

  const pollIntervalMs = getBookingPollingIntervalMs(booking?.status);
  const pollingSeconds = pollIntervalMs === WAITING_ACCEPTANCE_POLL_MS
    ? WAITING_ACCEPTANCE_POLL_MS / 1000
    : DEFAULT_BOOKING_POLL_MS / 1000;

  useEffect(() => {
    let intervalId;
    const stopPolling = () => {
      if (intervalId) window.clearInterval(intervalId);
      intervalId = undefined;
    };
    const startPolling = () => {
      stopPolling();
      if (document.visibilityState === 'visible') {
        intervalId = window.setInterval(() => loadBooking({ silent: true }), pollIntervalMs);
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadBooking({ silent: true });
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadBooking, pollIntervalMs]);

  useEffect(() => {
    if (booking?.status !== 'waiting_acceptance' || notificationPermissionRequestedRef.current) return;
    notificationPermissionRequestedRef.current = true;
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        void Notification.requestPermission().catch(() => {});
      }
    } catch {}
  }, [booking?.status]);

  const openCancellationDialog = () => {
    setCancelContact('');
    setCancelError('');
    setCancelPending(false);
    setCancelDialogOpen(true);
  };

  const handleCancellation = async event => {
    event.preventDefault();
    if (cancelPending) return;
    if (!cancelContact.trim()) {
      setCancelError('Enter the booking email or phone to continue.');
      return;
    }
    setCancelPending(true);
    setCancelError('');
    const result = await cancelPublicBooking({ reference, contact: cancelContact });
    setCancelPending(false);
    if (result.ok) {
      clearActiveBooking({ reference });
      setCancelDialogOpen(false);
      await loadBooking({ silent: true });
      return;
    }
    if (result.httpStatus === 404) {
      setCancelError("We couldn't verify that booking with those details.");
      return;
    }
    setCancelError(result.error || 'Booking cancellation is temporarily unavailable. Please try again.');
  };

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const whatsappButton = <WhatsAppButton reference={reference} whatsapp={booking?.whatsapp} />;
  const therapistDisplayName = booking?.therapist?.name || 'your Therapist';

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f5f0e7_0%,#fbfaf7_42%,#f3f5f4_100%)] px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
      {viewState === 'loading' ? <LoadingSkeleton /> : null}

      {viewState === 'not_found' ? (
        <StateCard
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Booking not found"
          body="We couldn't find this booking. Please check the link or message us on WhatsApp."
          action={whatsappButton}
        />
      ) : null}

      {viewState === 'error' ? (
        <StateCard
          icon={<RefreshCw className="h-6 w-6" />}
          title="We couldn't refresh your booking"
          body="Please check your connection and try again."
          action={(
            <div className="grid gap-3">
              <button type="button" onClick={() => loadBooking()} className="h-12 rounded-2xl bg-[#211c46] px-6 font-bold text-white hover:bg-[#17142f]">Try again</button>
              {whatsappButton}
            </div>
          )}
        />
      ) : null}

      {viewState === 'ready' && booking ? (
        <div className="mx-auto w-full max-w-3xl space-y-5" data-testid="booking-tracker-ready">
          <section data-booking-primary-status className="overflow-hidden rounded-[2rem] border border-[#e0a52b]/30 bg-[#211c46] p-6 text-white shadow-xl shadow-[#211c46]/10 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#f6d27a]">My booking</p>
                <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                  {confirmationNotice || (booking.status === 'waiting_acceptance'
                    ? `Waiting for ${therapistDisplayName} to confirm...`
                    : 'Track your massage')}
                </h1>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  {booking.status === 'waiting_acceptance'
                    ? 'Usually confirmed within a few minutes'
                    : `Live status updates refresh automatically every ${pollingSeconds} seconds.`}
                </p>
              </div>
              <span className="w-fit rounded-full border border-[#f6d27a]/35 bg-[#f6d27a]/10 px-4 py-2 text-sm font-bold text-[#f6d27a]">{booking.statusLabel}</span>
            </div>
          </section>

          {shouldShowBookingUpdatesBanner(booking.status) ? (
            <a
              data-booking-updates-banner
              href={buildBookingUpdatesWhatsAppUrl(reference)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-center text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
            >
              📲 Get booking updates on WhatsApp
            </a>
          ) : null}

          {booking.status === 'completed' ? (
            <CompletedBookingReview reference={reference} therapistName={booking.therapist?.name || 'your therapist'} />
          ) : null}

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-label="Booking summary">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Service</p>
                <p className="mt-1 font-bold text-[#17142f]">{booking.serviceName || 'Service pending'}</p>
                <p className="mt-1 text-sm text-slate-600">{Number.isFinite(booking.durationMinutes) ? `${booking.durationMinutes} minutes` : 'Duration pending'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500"><CalendarClock className="mr-1 inline h-4 w-4" />Scheduled in Manila</p>
                <p className="mt-1 font-bold text-[#17142f]">{formatManilaBookingDateTime(booking.scheduledAt)}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500"><MapPin className="mr-1 inline h-4 w-4" />Area</p>
                <p className="mt-1 font-bold text-[#17142f]">{booking.areaName || 'Area pending'}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Booking reference</p>
                <div className="mt-1 flex min-w-0 items-center gap-2">
                  <code className="min-w-0 flex-1 break-all text-sm font-bold text-[#17142f]">{booking.reference}</code>
                  <button type="button" onClick={copyReference} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 hover:bg-slate-200" aria-label="Copy booking reference">
                    <Copy className="h-3.5 w-3.5" />{copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#17142f]">Booking progress</h2>
                <p className="mt-1 text-xs text-slate-500">Last updated {formatManilaBookingDateTime(booking.updatedAt)}</p>
              </div>
              <button type="button" onClick={() => loadBooking({ silent: true })} disabled={isRefreshing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />Refresh
              </button>
            </div>
            <BookingStatusTimeline booking={booking} />
            {booking.status === 'waiting_acceptance' ? (
              <button type="button" onClick={openCancellationDialog} className="mt-7 h-12 w-full rounded-2xl border border-red-200 bg-white px-5 font-bold text-red-700 transition hover:bg-red-50">
                Cancel booking
              </button>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-[#e0a52b]/25 bg-[#fffaf0] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8a6518]" />
              <div>
                <h2 className="font-bold text-[#17142f]">Need an update?</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">Message our team and include your booking reference.</p>
              </div>
            </div>
            <div className="mt-5"><WhatsAppButton reference={reference} whatsapp={booking.whatsapp} /></div>
          </section>
        </div>
      ) : null}

      {cancelDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => !cancelPending && setCancelDialogOpen(false)}>
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-cancel-dialog-title"
            data-testid="booking-cancel-dialog"
            className="w-full max-w-md rounded-[1.75rem] border border-red-100 bg-white p-5 shadow-2xl sm:p-6"
            onSubmit={handleCancellation}
            onClick={event => event.stopPropagation()}
          >
            <h2 id="booking-cancel-dialog-title" className="text-2xl font-bold text-[#17142f]">Cancel this booking?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Only a booking still waiting for Therapist confirmation can be cancelled here.</p>
            <div className="mt-5">
              <label htmlFor="booking-cancel-contact" className="mb-2 block text-sm font-semibold text-slate-800">Booking email or phone</label>
              <input
                id="booking-cancel-contact"
                value={cancelContact}
                onChange={event => {
                  setCancelContact(event.target.value);
                  setCancelError('');
                }}
                className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 font-medium text-[#17142f] outline-none focus:border-[#4E8D43]"
                autoComplete="email"
                required
              />
            </div>
            {cancelError ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{cancelError}</p> : null}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" disabled={cancelPending} onClick={() => setCancelDialogOpen(false)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Keep booking</button>
              <button type="submit" disabled={cancelPending} className="h-12 rounded-2xl bg-red-600 px-4 font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                {cancelPending ? 'Cancelling...' : 'Confirm cancellation'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
