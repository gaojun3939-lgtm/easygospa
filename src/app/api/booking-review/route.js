import { NextResponse } from 'next/server';
import { resolveAiOfficeApiUrl } from '../../../lib/aiofficeApiBase.mjs';
import { projectPublicReviewError, projectPublicReviewResponse } from '../../../lib/reviewCouponNormalizer.mjs';
import { forwardedClientIpHeaders } from '../../../lib/serverForwardedIp.mjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function json(payload, status = 200) {
  return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
}

function cleanText(value = '', maxLength = 1000) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

export async function POST(request) {
  const backend = resolveAiOfficeApiUrl('bookingReview');
  if (!backend.ok) return json({ ok: false, code: backend.code, error: backend.error }, backend.status);

  const body = await request.json().catch(() => ({}));
  const reference = cleanText(body.reference, 120);
  const email = cleanText(body.email, 254).toLowerCase();
  const rating = Number(body.rating ?? body.stars);
  const comment = cleanText(body.comment ?? body.text, 1000);
  if (!/^mbr-brand-a-[a-z0-9]+$/i.test(reference) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json({ ok: false, code: 'INVALID_REVIEW', error: 'Enter the booking email and choose a star rating.' }, 400);
  }

  try {
    const response = await fetch(backend.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...forwardedClientIpHeaders(request) },
      body: JSON.stringify({ reference, email, rating, comment }),
      cache: 'no-store'
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.ok !== true) {
      return json(projectPublicReviewError(payload), response.ok ? 502 : response.status);
    }
    return json(projectPublicReviewResponse(payload));
  } catch {
    return json({ ok: false, code: 'REVIEW_SERVICE_UNAVAILABLE', error: 'Review service is temporarily unavailable. Please try again.' }, 502);
  }
}

export function GET() {
  return json({ ok: false, code: 'METHOD_NOT_ALLOWED', error: 'Method not allowed' }, 405);
}
