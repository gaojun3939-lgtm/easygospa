'use client';

import { useEffect, useState } from 'react';
import { Check, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

const duplicateReviewCodes = new Set([
  'BOOKING_REVIEW_ALREADY_SUBMITTED',
  'BOOKING_REVIEW_CONFLICT',
  'REVIEW_ALREADY_EXISTS',
  'DUPLICATE_REVIEW'
]);

// 评价送的券面额(价格数字不进文字文件,用变量塞进去)
export const REVIEW_COUPON_AMOUNT = '₱50';

// 评价接口回来的报错按代码翻;认不出的代码,接口给的英文原样显示。
export function reviewErrorText(t, payload) {
  switch (String(payload?.code || '')) {
    case 'BOOKING_NOT_COMPLETED':
    case 'BOOKING_REVIEW_STATUS_INVALID':
      return t('errors.notCompleted');
    case 'BOOKING_NOT_FOUND':
    case 'BOOKING_CUSTOMER_MISMATCH':
    case 'BOOKING_REVIEW_NOT_FOUND':
    case 'BOOKING_REVIEW_EMAIL_MISMATCH':
      return t('errors.notVerified');
    case 'BOOKING_REVIEW_ALREADY_SUBMITTED':
    case 'BOOKING_REVIEW_CONFLICT':
    case 'REVIEW_ALREADY_EXISTS':
    case 'DUPLICATE_REVIEW':
      return t('errors.alreadyReviewed');
    case 'INVALID_REVIEW':
      return t('errors.invalid');
    case 'REVIEW_SERVICE_UNAVAILABLE':
      return t('errors.unavailable');
    case 'REVIEW_SUBMISSION_FAILED':
      return t('errors.submitFailed');
    default:
      return payload?.error || t('errors.submitFailed');
  }
}

export default function BookingReviewCard({
  reference,
  therapistName = '',
  bookingEmail = '',
  reviewStatus = 'unknown',
  onReviewSuccess
}) {
  const t = useTranslations('review');
  const [expanded, setExpanded] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [state, setState] = useState('ready');
  const [error, setError] = useState('');

  useEffect(() => {
    setExpanded(false);
    setStars(0);
    setComment('');
    setState('ready');
    setError('');
  }, [reference, reviewStatus]);

  if (reviewStatus === 'reviewed' || state === 'reviewed') {
    return (
      <section className="mt-5 rounded-2xl border border-gray-200 bg-gray-100 p-4 text-center" data-testid="completed-order-review-reviewed" aria-label={t('reviewedLabel')}>
        <p className="text-sm font-bold text-gray-500">{t('reviewedBadge', { amount: REVIEW_COUPON_AMOUNT })}</p>
      </section>
    );
  }

  const canReview = reviewStatus === 'unreviewed';
  if (!canReview) return null;

  const submitReview = async event => {
    event.preventDefault();
    if (state === 'submitting' || state === 'submitted') return;
    if (stars < 1 || stars > 5) {
      setError(t('errors.chooseStars'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(bookingEmail || '').trim())) {
      setError(t('errors.signInAgain'));
      return;
    }
    setState('submitting');
    setError('');
    try {
      const response = await fetch('/api/booking-review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          reference,
          email: String(bookingEmail).trim().toLowerCase(),
          rating: stars,
          comment: comment.trim()
        })
      });
      const payload = await response.json().catch(() => null);
      if (response.status === 409 && duplicateReviewCodes.has(String(payload?.code || ''))) {
        setState('reviewed');
        await onReviewSuccess?.({ duplicate: true });
        return;
      }
      if (!response.ok || payload?.ok !== true || !payload?.coupon?.id) {
        throw new Error(reviewErrorText(t, payload));
      }
      setState('submitted');
      await onReviewSuccess?.({ review: payload.review, coupon: payload.coupon });
    } catch (submitError) {
      setState('ready');
      setError(submitError instanceof Error ? submitError.message : t('errors.submitFailed'));
    }
  };

  if (state === 'submitted') {
    return (
      <section className="mt-5 rounded-2xl border border-[#64734F]/25 bg-[#E9ECE1] p-5 text-center" data-testid="completed-order-review-success" aria-live="polite">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#E9ECE1] text-[#55633F]"><Check className="h-6 w-6" /></span>
        <p className="mt-3 text-sm font-bold text-[#55633F]">{t('successWallet', { amount: REVIEW_COUPON_AMOUNT })}</p>
      </section>
    );
  }

  if (!expanded) {
    return (
      <section className="mt-5 rounded-2xl border border-[#64734F]/35 bg-[#F7F4EE] p-4 shadow-sm" data-testid="completed-order-review-cta">
        <button type="button" onClick={() => setExpanded(true)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#64734F] px-4 text-sm font-bold text-white transition hover:bg-[#55633F]">
          <Star className="h-5 w-5 fill-[#f0a41c] text-[#f0a41c]" />{t('cta', { amount: REVIEW_COUPON_AMOUNT })}
        </button>
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-2xl border border-[#64734F]/35 bg-[#F7F4EE] p-4 shadow-sm" data-testid="completed-order-review-form">
      <form onSubmit={submitReview}>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#55633F]">{t('eyebrow', { amount: REVIEW_COUPON_AMOUNT })}</p>
        <h3 className="mt-2 text-lg font-bold text-[#171A17]">{t('heading', { name: therapistName || t('fallbackName') })}</h3>
        <div className="mt-3 flex gap-1" role="radiogroup" aria-label={t('starsLabel')}>
          {[1, 2, 3, 4, 5].map(value => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={stars === value}
              aria-label={t('starOption', { count: value })}
              onClick={() => { setStars(value); setError(''); }}
              className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-[#64734F]"
            >
              <Star className={`h-8 w-8 ${value <= stars ? 'fill-[#f0a41c] text-[#f0a41c]' : 'text-gray-300'}`} />
            </button>
          ))}
        </div>
        <label htmlFor="order-review-comment" className="mt-4 block text-sm font-semibold text-gray-700">{t.rich('commentLabel', { muted: chunks => <span className="font-normal text-gray-400">{chunks}</span> })}</label>
        <textarea id="order-review-comment" value={comment} onChange={event => setComment(event.target.value.slice(0, 1000))} rows={3} className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#171A17] outline-none focus:border-[#64734F]" placeholder={t('commentPlaceholder')} />
        {error ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { setExpanded(false); setError(''); }} className="h-11 rounded-full border border-gray-200 bg-white text-sm font-bold text-gray-600">{t('notNow')}</button>
          <button type="submit" disabled={state === 'submitting'} className="h-11 rounded-full bg-[#64734F] text-sm font-bold text-white disabled:opacity-60">{state === 'submitting' ? t('submitting') : t('submit')}</button>
        </div>
      </form>
    </section>
  );
}
