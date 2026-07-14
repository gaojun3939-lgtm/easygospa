'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Clock3,
  Copy,
  MapPin,
  MessageCircle,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import {
  BOOKING_STATUS_STEPS,
  buildBookingWhatsAppUrl,
  formatManilaBookingDateTime,
  getBookingStatusStepIndex
} from '../lib/bookingStatus.mjs';

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

  const loadBooking = useCallback(async ({ silent = false } = {}) => {
    if (!reference) {
      setViewState('not_found');
      return;
    }
    if (silent) setIsRefreshing(true);
    else setViewState('loading');

    try {
      const response = await fetch(`/api/booking-status?ref=${encodeURIComponent(reference)}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (response.status === 404 || payload?.reason === 'not_found') {
        setBooking(null);
        setViewState('not_found');
        return;
      }
      if (!response.ok || payload?.ok !== true) throw new Error('BOOKING_STATUS_LOAD_FAILED');
      setBooking(payload);
      setViewState('ready');
    } catch {
      setViewState('error');
    } finally {
      setIsRefreshing(false);
    }
  }, [reference]);

  useEffect(() => {
    let intervalId;
    const stopPolling = () => {
      if (intervalId) window.clearInterval(intervalId);
      intervalId = undefined;
    };
    const startPolling = () => {
      stopPolling();
      if (document.visibilityState === 'visible') {
        intervalId = window.setInterval(() => loadBooking({ silent: true }), 25000);
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

    loadBooking();
    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadBooking]);

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
          <section className="overflow-hidden rounded-[2rem] border border-[#e0a52b]/30 bg-[#211c46] p-6 text-white shadow-xl shadow-[#211c46]/10 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#f6d27a]">My booking</p>
                <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Track your massage</h1>
                <p className="mt-3 text-sm leading-6 text-white/70">Live status updates refresh automatically every 25 seconds.</p>
              </div>
              <span className="w-fit rounded-full border border-[#f6d27a]/35 bg-[#f6d27a]/10 px-4 py-2 text-sm font-bold text-[#f6d27a]">{booking.statusLabel}</span>
            </div>
          </section>

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
    </main>
  );
}
