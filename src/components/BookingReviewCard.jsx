'use client';

import { useEffect, useState } from 'react';
import { Check, Star } from 'lucide-react';

const duplicateReviewCodes = new Set([
  'BOOKING_REVIEW_ALREADY_SUBMITTED',
  'BOOKING_REVIEW_CONFLICT',
  'REVIEW_ALREADY_EXISTS',
  'DUPLICATE_REVIEW'
]);

export default function BookingReviewCard({
  reference,
  therapistName = 'your therapist',
  bookingEmail = '',
  reviewStatus = 'unknown',
  onReviewSuccess
}) {
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
      <section className="mt-5 rounded-2xl border border-gray-200 bg-gray-100 p-4 text-center" data-testid="completed-order-review-reviewed" aria-label="Booking reviewed">
        <p className="text-sm font-bold text-gray-500">★★★★★ Reviewed · ₱50 coupon sent</p>
      </section>
    );
  }

  const canReview = reviewStatus === 'unreviewed';
  if (!canReview) return null;

  const submitReview = async event => {
    event.preventDefault();
    if (state === 'submitting' || state === 'submitted') return;
    if (stars < 1 || stars > 5) {
      setError('Choose a star rating first.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(bookingEmail || '').trim())) {
      setError('Your signed-in booking email could not be verified. Please sign in again.');
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
        throw new Error(payload?.error || 'Your review could not be submitted. Please try again.');
      }
      setState('submitted');
      await onReviewSuccess?.({ review: payload.review, coupon: payload.coupon });
    } catch (submitError) {
      setState('ready');
      setError(submitError instanceof Error ? submitError.message : 'Your review could not be submitted. Please try again.');
    }
  };

  if (state === 'submitted') {
    return (
      <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center" data-testid="completed-order-review-success" aria-live="polite">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-6 w-6" /></span>
        <p className="mt-3 text-sm font-bold text-emerald-800">Thanks! ₱50 coupon added to your wallet</p>
      </section>
    );
  }

  if (!expanded) {
    return (
      <section className="mt-5 rounded-2xl border border-[#e0a52b]/35 bg-[#fffaf0] p-4 shadow-sm" data-testid="completed-order-review-cta">
        <button type="button" onClick={() => setExpanded(true)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#4E8D43] px-4 text-sm font-bold text-white transition hover:bg-[#3F7838]">
          <Star className="h-5 w-5 fill-[#f6d27a] text-[#f6d27a]" />Rate your massage · Get ₱50 coupon
        </button>
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-2xl border border-[#e0a52b]/35 bg-[#fffaf0] p-4 shadow-sm" data-testid="completed-order-review-form">
      <form onSubmit={submitReview}>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6518]">Review &amp; get a ₱50 coupon</p>
        <h3 className="mt-2 text-lg font-bold text-[#0F0F0F]">How was {therapistName}?</h3>
        <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map(value => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={stars === value}
              aria-label={`${value} star${value === 1 ? '' : 's'}`}
              onClick={() => { setStars(value); setError(''); }}
              className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-[#e0a52b]"
            >
              <Star className={`h-8 w-8 ${value <= stars ? 'fill-[#f0a41c] text-[#f0a41c]' : 'text-gray-300'}`} />
            </button>
          ))}
        </div>
        <label htmlFor="order-review-comment" className="mt-4 block text-sm font-semibold text-gray-700">Tell us more <span className="font-normal text-gray-400">(optional)</span></label>
        <textarea id="order-review-comment" value={comment} onChange={event => setComment(event.target.value.slice(0, 1000))} rows={3} className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#0F0F0F] outline-none focus:border-[#e0a52b]" placeholder="What stood out about your massage?" />
        {error ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { setExpanded(false); setError(''); }} className="h-11 rounded-full border border-gray-200 bg-white text-sm font-bold text-gray-600">Not now</button>
          <button type="submit" disabled={state === 'submitting'} className="h-11 rounded-full bg-[#4E8D43] text-sm font-bold text-white disabled:opacity-60">{state === 'submitting' ? 'Submitting…' : 'Submit review'}</button>
        </div>
      </form>
    </section>
  );
}
