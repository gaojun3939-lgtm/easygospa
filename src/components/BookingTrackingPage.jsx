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
import { useLocale, useTranslations } from 'next-intl';
import {
  BOOKING_STATUS_STEPS,
  DEFAULT_BOOKING_POLL_MS,
  WAITING_ACCEPTANCE_POLL_MS,
  buildBookingUpdatesWhatsAppUrl,
  bookingStatusMessageKey,
  buildBookingWhatsAppUrl,
  formatManilaBookingDateTime,
  getBookingPollingIntervalMs,
  getBookingStatusStepIndex,
  isTherapistArrivalTransition,
  isTherapistConfirmationTransition,
  shouldShowBookingUpdatesBanner
} from '../lib/bookingStatus.mjs';
import { apiUrl } from '../lib/apiUrl.js';
import { clearActiveBooking, readActiveBooking } from '../lib/activeBooking.mjs';
import { cancelPublicBooking } from '../lib/publicBookingCancel.mjs';
import { BOOKING_FLOW_STORAGE_KEY } from '../lib/therapistServiceBookingFlow.mjs';
import { intlLocale } from '@/i18n/routing';
import { REVIEW_COUPON_AMOUNT, reviewErrorText } from './BookingReviewCard.jsx';

// 2026-08-01 去邮箱:身份主键改手机号。优先取 session 里的手机号,老 session 只有邮箱的也认。
function readStoredBookingContact() {
  if (typeof window === 'undefined') return '';
  try {
    const session = JSON.parse(window.sessionStorage.getItem(BOOKING_FLOW_STORAGE_KEY) || 'null');
    return String(session?.phone || session?.customerEmail || '').trim();
  } catch {
    return '';
  }
}

function reviewStorageKey(reference) {
  return `egCompletedReview.v1.${String(reference || '').trim()}`;
}

function CompletedBookingReview({ reference, therapistName }) {
  const tReview = useTranslations('review');
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('ready');
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail(readStoredBookingContact());
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
      setError(tReview('errors.chooseStars'));
      return;
    }
    // 2026-08-01 去邮箱:一个框收"手机号或邮箱"——含 @ 当邮箱发,否则当手机号发。
    // 后端两条路都验(bookingReview 邮箱/手机号任一匹配即放行),新老客人都评得了。
    const contact = email.trim();
    const isEmailContact = contact.includes('@');
    if (isEmailContact ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) : contact.replace(/\D/g, '').length < 7) {
      setError(tReview('errors.enterContact'));
      return;
    }
    setState('submitting');
    setError('');
    try {
      const response = await fetch(apiUrl('/api/booking-review'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          reference,
          ...(isEmailContact ? { email: contact.toLowerCase() } : { phone: contact }),
          rating: stars,
          comment: comment.trim()
        })
      });
      const payload = await response.json().catch(() => null);
      const duplicateReviewCodes = new Set(['BOOKING_REVIEW_ALREADY_SUBMITTED', 'BOOKING_REVIEW_CONFLICT', 'REVIEW_ALREADY_EXISTS', 'DUPLICATE_REVIEW']);
      if (response.status === 409 && duplicateReviewCodes.has(String(payload?.code || ''))) {
        window.localStorage.setItem(reviewStorageKey(reference), JSON.stringify({ submitted: true, stars }));
        setState('submitted');
        return;
      }
      if (!response.ok || payload?.ok !== true || !payload?.coupon?.id) {
        throw new Error(reviewErrorText(tReview, payload));
      }
      window.localStorage.setItem(reviewStorageKey(reference), JSON.stringify({ submitted: true, stars }));
      setState('submitted');
    } catch (submitError) {
      setState('ready');
      setError(submitError instanceof Error ? submitError.message : tReview('errors.submitFailed'));
    }
  };

  return (
    <section className="rounded-[2rem] border border-[#64734F]/35 bg-[linear-gradient(135deg,#F7F4EE,#ffffff)] p-5 shadow-sm sm:p-7" data-testid="completed-booking-review">
      {state === 'submitted' ? (
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E9ECE1] text-[#55633F]"><Check className="h-7 w-7" /></span>
          <h2 className="mt-4 text-2xl font-bold text-[#171A17]">{tReview('trackPage.thanks', { stars: '★'.repeat(stars) })}</h2>
          <p className="mt-2 text-sm font-semibold text-[#55633F]">{tReview('trackPage.couponInWallet', { amount: REVIEW_COUPON_AMOUNT })}</p>
          <p className="mt-2 text-xs text-slate-500">{tReview('trackPage.onceOnly')}</p>
        </div>
      ) : (
        <form onSubmit={submitReview}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#55633F]">{tReview('eyebrow', { amount: REVIEW_COUPON_AMOUNT })}</p>
          <h2 className="mt-2 text-2xl font-bold text-[#171A17]">{tReview('heading', { name: therapistName || tReview('fallbackName') })}</h2>
          <div className="mt-4 flex flex-wrap gap-1" role="radiogroup" aria-label={tReview('starsLabel')}>
            {[1, 2, 3, 4, 5].map(value => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={stars === value}
                aria-label={tReview('starOption', { count: value })}
                onClick={() => { setStars(value); setError(''); }}
                className="flex h-11 w-11 items-center justify-center rounded-xl transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-[#64734F]"
              >
                <Star className={`h-9 w-9 ${value <= stars ? 'fill-[#f0a41c] text-[#f0a41c]' : 'text-slate-300'}`} />
              </button>
            ))}
          </div>
          <div className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ${stars ? 'mt-4 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="min-h-0 space-y-4">
              <div>
                <label htmlFor="review-comment" className="mb-2 block text-sm font-semibold text-slate-800">{tReview.rich('commentLabel', { muted: chunks => <span className="font-normal text-slate-400">{chunks}</span> })}</label>
                <textarea id="review-comment" value={comment} onChange={event => setComment(event.target.value.slice(0, 1000))} rows={4} className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#171A17] outline-none focus:border-[#64734F]" placeholder={tReview('commentPlaceholder')} />
              </div>
              <div>
                <label htmlFor="review-email" className="mb-2 block text-sm font-semibold text-slate-800">{tReview('trackPage.contactLabel')}</label>
                <input id="review-email" type="text" autoComplete="tel" value={email} onChange={event => setEmail(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-[#171A17] outline-none focus:border-[#64734F]" placeholder="09XX XXX XXXX" required />
                <p className="mt-1 text-xs text-slate-500">{tReview('trackPage.contactHint')}</p>
              </div>
              {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
              <button type="submit" disabled={state === 'submitting'} className="h-12 w-full rounded-2xl bg-[#171A17] px-6 font-bold text-white hover:bg-[#171A17] disabled:opacity-60">{state === 'submitting' ? tReview('submitting') : tReview('submit')}</button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}

function notifyTherapistConfirmed(message) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(200);
  } catch {}
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const notification = new Notification('EasyGoSpa', { body: message });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {}
}

function notifyTherapistArrived(message) {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const notification = new Notification('EasyGoSpa', { body: message });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {}
}

function WhatsAppButton({ reference, whatsapp, compact = false }) {
  const t = useTranslations('track');
  return (
    <a
      href={buildBookingWhatsAppUrl(whatsapp, reference)}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1F9D55] font-bold text-white shadow-sm transition hover:bg-[#188548] ${compact ? 'h-11 px-5 text-sm' : 'h-12 w-full px-6'}`}
    >
      <MessageCircle className="h-5 w-5" />
      {t('whatsappButton')}
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
      <h1 className="mt-5 text-2xl font-bold text-[#171A17]">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
      <div className="mt-6">{action}</div>
    </div>
  );
}

// 订单页是给客人看的:他只想知道"人什么时候到",不想看我们内部的排班档位。
// 大字说人在哪一步,小字说下一步会发生什么。技师有名字就直呼其名,更像真人服务。
function therapistArrivalHeadline(t, booking = {}) {
  const name = booking.therapist?.name?.trim();
  const who = name || t('headline.fallbackName');
  switch (booking.status) {
    case 'submitted':
    case 'confirmed':
      return t('headline.matching');
    case 'waiting_acceptance':
      return t('headline.confirming', { name: who });
    case 'preparing':
      return t('headline.gettingReady', { name: who });
    case 'on_the_way':
      return Number.isFinite(booking.etaMinutes) ? t('headline.onTheWayEta', { name: who, minutes: String(booking.etaMinutes) }) : t('headline.onTheWay', { name: who });
    case 'arrived':
      return t('headline.arrived', { name: who });
    case 'in_service':
      return t('headline.inService');
    case 'completed':
      return t('headline.completed');
    case 'cancelled':
      return t('bookingCancelled');
    default:
      return t('headline.onTheWay', { name: who });
  }
}

function therapistArrivalNote(t, booking = {}) {
  switch (booking.status) {
    case 'submitted':
    case 'confirmed':
      return t('note.matching');
    case 'waiting_acceptance':
      return t('note.confirming');
    case 'preparing':
      // 预约单:技师接了单,但要等约的时间才出发,别让客人以为马上有人敲门。
      return booking.scheduleMode === 'scheduled'
        ? t('note.headingScheduled')
        : t('note.headingSoon');
    case 'on_the_way':
      return t('note.keepPhone');
    case 'arrived':
      return t('note.payAtDoor');
    case 'in_service':
      return t('note.enjoy');
    case 'completed':
      return t('note.review', { amount: REVIEW_COUPON_AMOUNT });
    case 'cancelled':
      return t('note.needHelp');
    default:
      return t('note.keepPhone');
  }
}

// 取消接口(publicBookingCancel)回来的报错按代码翻;认不出的代码,原样显示它给的英文。
function cancelErrorText(t, result) {
  switch (String(result?.code || '')) {
    case 'INVALID_CANCELLATION':
      return t('cancel.errors.enterContact');
    case 'CANCEL_AUTH_REQUIRED':
      return t('cancel.errors.authRequired');
    case 'CANCEL_NOT_ALLOWED':
      return t('cancel.errors.notAllowed');
    case 'RATE_LIMITED':
      return t('cancel.errors.rateLimited');
    case 'BOOKING_CANCEL_FAILED':
      return t('cancel.errors.failed');
    case 'BOOKING_CANCEL_UNAVAILABLE':
      return t('cancel.errors.unreachable');
    default:
      // 兜底文案也要给出路(老板 2026-07-28:客人不该对着一句'暂时不可用'干瞪眼)
      return result?.error || t('cancel.errors.failed');
  }
}

function TherapistBadge({ therapist }) {
  const t = useTranslations('track');
  if (!therapist) return null;
  const initial = therapist.name?.charAt(0)?.toUpperCase() || 'T';

  return (
    <div className="mt-3 flex min-w-0 items-center gap-3 rounded-2xl border border-[#64734F]/25 bg-[#F7F4EE] p-3">
      {therapist.avatarUrl ? (
        <img src={therapist.avatarUrl} alt={t('badge.photoAlt', { name: therapist.name || t('badge.therapist') })} className="h-11 w-11 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#171A17] font-bold text-[#DDE3CF]">{initial}</span>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t('yourTherapist')}</p>
        <p className="truncate font-bold text-[#171A17]">{therapist.name || t('badge.assignedTherapist')}</p>
      </div>
    </div>
  );
}

function BookingStatusTimeline({ booking }) {
  const t = useTranslations('track');
  const currentIndex = getBookingStatusStepIndex(booking.status);

  if (booking.status === 'cancelled') {
    return (
      <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6" data-testid="booking-status-cancelled">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-600 text-white"><AlertTriangle className="h-5 w-5" /></div>
          <div>
            <h2 className="text-xl font-bold text-red-900">{t('bookingCancelled')}</h2>
            <p className="mt-2 text-sm leading-6 text-red-800">{t('timeline.cancelledBody')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ol className="space-y-0" aria-label={t('progress.title')} data-testid="booking-status-timeline">
      {BOOKING_STATUS_STEPS.map((step, index) => {
        const isPast = index < currentIndex;
        const isCurrent = index === currentIndex;
        const showTherapist = step.status === 'on_the_way' && booking.therapist;
        const showEta = step.status === 'on_the_way' && booking.status === 'on_the_way' && Number.isFinite(booking.etaMinutes);

        return (
          <li key={step.status} className="relative flex gap-4 pb-7 last:pb-0" aria-current={isCurrent ? 'step' : undefined}>
            {index < BOOKING_STATUS_STEPS.length - 1 ? (
              <span className={`absolute left-[19px] top-10 h-[calc(100%-2.1rem)] w-0.5 ${index < currentIndex ? 'bg-[#64734F]' : 'bg-slate-200'}`} aria-hidden="true" />
            ) : null}
            <span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${isPast ? 'border-[#64734F] bg-[#64734F] text-[#171A17]' : isCurrent ? 'animate-pulse border-[#DDE3CF] bg-[#171A17] text-[#DDE3CF] shadow-[0_0_0_6px_rgba(224,165,43,0.16)]' : 'border-slate-200 bg-white text-slate-400'}`}>
              {isPast ? <Check className="h-5 w-5" /> : isCurrent ? <Clock3 className="h-5 w-5" /> : <span className="h-2.5 w-2.5 rounded-full bg-current" />}
            </span>
            <div className={`min-w-0 flex-1 pt-1.5 ${isCurrent ? 'text-[#171A17]' : isPast ? 'text-slate-700' : 'text-slate-400'}`}>
              <p className="font-bold">{t(bookingStatusMessageKey(step.status))}</p>
              {showEta ? <p className="mt-1 text-sm font-semibold text-[#55633F]">{t('timeline.eta', { minutes: Math.round(booking.etaMinutes) })}</p> : null}
              {showTherapist ? <TherapistBadge therapist={booking.therapist} /> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function BookingTrackingPage({ reference }) {
  const t = useTranslations('track');
  const tn = useTranslations('serviceNames');
  const dateLocale = intlLocale(useLocale());
  // 轮询回调里要用当前语言的文字,但不能让它变成 loadBooking 的依赖(会多拉一次接口)
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);
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
      const therapistName = payload.therapist?.name || lastTherapistNameRef.current || tRef.current('notify.fallbackName');
      if (payload.therapist?.name) lastTherapistNameRef.current = payload.therapist.name;
      if (isTherapistConfirmationTransition(previousStatus, nextStatus) && !confirmationNotifiedRef.current) {
        confirmationNotifiedRef.current = true;
        setConfirmationNotice(tRef.current('notify.confirmedBanner', { name: therapistName }));
        notifyTherapistConfirmed(tRef.current('notify.confirmedPush', { name: therapistName }));
      }
      if (isTherapistArrivalTransition(previousStatus, nextStatus) && !arrivalNotifiedRef.current) {
        arrivalNotifiedRef.current = true;
        notifyTherapistArrived(tRef.current('notify.arrivedPush'));
      }
      previousStatusRef.current = nextStatus;
      // ⚠ 2026-07-29 改:原来只要不是"等接单"就把指针删掉,结果客人一关标签页,
      // 就再也回不到这一页——而评价卡只在这一页上。这是我们只有 1 条评价的原因之一。
      // 现在保留到服务完成为止:做完了正是要他评价的时候,路不能断。
      // 已经评过了才清(评过就没必要再回来)。
      const alreadyReviewed = Boolean(payload?.review || payload?.hasReview);
      if (nextStatus !== 'waiting_acceptance' && (nextStatus !== 'completed' || alreadyReviewed)) {
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
      setCancelError(t('cancel.errors.enterContact'));
      return;
    }
    setCancelPending(true);
    setCancelError('');
    const localMarker = readActiveBooking();
    const activeMarker = localMarker?.reference === reference ? localMarker : null;
    const result = await cancelPublicBooking({
      reference,
      contact: cancelContact,
      cancelToken: activeMarker?.cancelToken
    });
    setCancelPending(false);
    if (result.ok) {
      clearActiveBooking({ reference });
      setCancelDialogOpen(false);
      await loadBooking({ silent: true });
      return;
    }
    if (result.httpStatus === 404) {
      setCancelError(t('cancel.errors.notVerified'));
      return;
    }
    setCancelError(cancelErrorText(t, result));
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
  const therapistDisplayName = booking?.therapist?.name || t('hero.waitingFallbackName');
  const statusText = status => {
    const key = bookingStatusMessageKey(status);
    return key ? t(key) : '';
  };
  const serviceText = name => (tn.has(name) ? tn(name) : name);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f5f0e7_0%,#fbfaf7_42%,#f3f5f4_100%)] px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
      {viewState === 'loading' ? <LoadingSkeleton /> : null}

      {viewState === 'not_found' ? (
        <StateCard
          icon={<AlertTriangle className="h-6 w-6" />}
          title={t('notFound.title')}
          body={t('notFound.body')}
          action={whatsappButton}
        />
      ) : null}

      {viewState === 'error' ? (
        <StateCard
          icon={<RefreshCw className="h-6 w-6" />}
          title={t('loadError.title')}
          body={t('loadError.body')}
          action={(
            <div className="grid gap-3">
              <button type="button" onClick={() => loadBooking()} className="h-12 rounded-2xl bg-[#171A17] px-6 font-bold text-white hover:bg-[#171A17]">{t('loadError.retry')}</button>
              {whatsappButton}
            </div>
          )}
        />
      ) : null}

      {viewState === 'ready' && booking ? (
        <div className="mx-auto w-full max-w-3xl space-y-5" data-testid="booking-tracker-ready">
          <section data-booking-primary-status className="overflow-hidden rounded-[2rem] border border-[#64734F]/30 bg-[#171A17] p-6 text-white shadow-xl shadow-[#171A17]/10 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#DDE3CF]">{t('hero.eyebrow')}</p>
                <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                  {confirmationNotice || (booking.status === 'waiting_acceptance'
                    ? t('hero.waitingFor', { name: therapistDisplayName })
                    : t('hero.title'))}
                </h1>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  {booking.status === 'waiting_acceptance'
                    ? t('hero.waitingHint')
                    : t('hero.liveHint', { seconds: pollingSeconds })}
                </p>
              </div>
              <span className="w-fit rounded-full border border-[#DDE3CF]/35 bg-[#DDE3CF]/10 px-4 py-2 text-sm font-bold text-[#DDE3CF]">{statusText(booking.status) || booking.statusLabel}</span>
            </div>
          </section>

          {/* 页面顶部只留一个绿按钮(老板 2026-07-26:三个入口太多余)。
              派了技师 → 直通技师专线(路上沟通、拍门牌);还没派 → 客服号问进度。
              底部「Need an update?」卡片始终有客服号入口,不必在这里再放一个。 */}
          {booking.therapistLine ? (
            <a
              data-therapist-line
              href={`https://wa.me/${booking.therapistLine}?text=${encodeURIComponent(`Hi! Booking ${reference} — I'd like to chat with my therapist${booking.therapist?.name ? ` ${booking.therapist.name}` : ''}.`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 text-center shadow-lg shadow-emerald-500/30 ring-2 ring-[#64734F]/40 transition hover:bg-[#1fbd5a] active:scale-[0.99]"
            >
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
              </span>
              <span className="text-base font-extrabold text-white sm:text-lg">{booking.therapist?.name ? t('therapistLine.named', { name: booking.therapist.name }) : t('therapistLine.unnamed')}</span>
            </a>
          ) : shouldShowBookingUpdatesBanner(booking.status) ? (
            <a
              data-booking-updates-banner
              href={buildBookingUpdatesWhatsAppUrl(reference)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 text-center shadow-lg shadow-emerald-500/30 ring-2 ring-[#64734F]/40 transition hover:bg-[#1fbd5a] active:scale-[0.99]"
            >
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
              </span>
              <span className="text-base font-extrabold text-white sm:text-lg">{t('updatesBanner')}</span>
            </a>
          ) : null}

          {booking.status === 'completed' ? (
            <CompletedBookingReview reference={reference} therapistName={booking.therapist?.name || ''} />
          ) : null}

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-label={t('summary.label')}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{t('summary.service')}</p>
                <p className="mt-1 font-bold text-[#171A17]">{booking.serviceName ? serviceText(booking.serviceName) : t('summary.servicePending')}</p>
                <p className="mt-1 text-sm text-slate-600">{Number.isFinite(booking.durationMinutes) ? t('summary.duration', { minutes: booking.durationMinutes }) : t('summary.durationPending')}</p>
              </div>
              {/* 客人只关心"技师什么时候到",不关心内部排班(2026-07-28 老板拍板)。
                  原来这里印内部排期时间戳,技师 20 分钟就到门口了,页面却写着明天凌晨,把客人看懵。
                  例外(2026-07-30 老板拍板):客人自己约的时间(Book for later)必须显示——
                  那是他亲手选的,不是内部排班。scheduleMode 区分这两种单。 */}
              {booking.scheduleMode === 'scheduled' && booking.scheduledAt ? (
                <div data-booking-appointment-time>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500"><CalendarClock className="mr-1 inline h-4 w-4" />{t('summary.appointment')}</p>
                  <p className="mt-1 font-bold text-[#171A17]">{formatManilaBookingDateTime(booking.scheduledAt, dateLocale) || t('schedulePending')}</p>
                  <p className="mt-1 text-sm text-slate-600">{t('summary.bookedForLater')}</p>
                </div>
              ) : null}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500"><CalendarClock className="mr-1 inline h-4 w-4" />{t('yourTherapist')}</p>
                <p className="mt-1 font-bold text-[#171A17]">{therapistArrivalHeadline(t, booking)}</p>
                <p className="mt-1 text-sm text-slate-600">{therapistArrivalNote(t, booking)}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500"><MapPin className="mr-1 inline h-4 w-4" />{t('summary.area')}</p>
                <p className="mt-1 font-bold text-[#171A17]">{booking.areaName || t('summary.areaPending')}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{t('summary.reference')}</p>
                <div className="mt-1 flex min-w-0 items-center gap-2">
                  <code className="min-w-0 flex-1 break-all text-sm font-bold text-[#171A17]">{booking.reference}</code>
                  <button type="button" onClick={copyReference} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 hover:bg-slate-200" aria-label={t('summary.copyLabel')}>
                    <Copy className="h-3.5 w-3.5" />{copied ? t('summary.copied') : t('summary.copy')}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#171A17]">{t('progress.title')}</h2>
                <p className="mt-1 text-xs text-slate-500">{t('progress.lastUpdated', { time: formatManilaBookingDateTime(booking.updatedAt, dateLocale) || t('schedulePending') })}</p>
              </div>
              <button type="button" onClick={() => loadBooking({ silent: true })} disabled={isRefreshing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />{t('progress.refresh')}
              </button>
            </div>
            <BookingStatusTimeline booking={booking} />
            {booking.status === 'waiting_acceptance' ? (
              <button type="button" onClick={openCancellationDialog} className="mt-7 h-12 w-full rounded-2xl border border-red-200 bg-white px-5 font-bold text-red-700 transition hover:bg-red-50">
                {t('progress.cancel')}
              </button>
            ) : booking.status !== 'cancelled' && booking.status !== 'completed' ? (
              // 老板 2026-07-28:客人找不到取消入口会以为是 bug。接单后不能自助取消是规矩
              // (技师可能已在路上),但必须说清楚 + 给出口,不能空着。
              <p className="mt-7 rounded-2xl bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-500">
                {t('progress.cannotCancel')}
              </p>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-[#64734F]/25 bg-[#F7F4EE] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#55633F]" />
              <div>
                <h2 className="font-bold text-[#171A17]">{t('help.title')}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">{t('help.body')}</p>
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
            <h2 id="booking-cancel-dialog-title" className="text-2xl font-bold text-[#171A17]">{t('cancel.title')}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{t('cancel.body')}</p>
            <div className="mt-5">
              <label htmlFor="booking-cancel-contact" className="mb-2 block text-sm font-semibold text-slate-800">{t('cancel.contactLabel')}</label>
              <input
                id="booking-cancel-contact"
                value={cancelContact}
                onChange={event => {
                  setCancelContact(event.target.value);
                  setCancelError('');
                }}
                className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 font-medium text-[#171A17] outline-none focus:border-[#64734F]"
                autoComplete="email"
                required
              />
            </div>
            {cancelError ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{cancelError}</p> : null}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" disabled={cancelPending} onClick={() => setCancelDialogOpen(false)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">{t('cancel.keep')}</button>
              <button type="submit" disabled={cancelPending} className="h-12 rounded-2xl bg-red-600 px-4 font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                {cancelPending ? t('cancel.cancelling') : t('cancel.confirm')}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
