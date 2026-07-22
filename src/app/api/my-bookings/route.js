import { NextResponse } from 'next/server';
import { resolveAiOfficeApiUrl } from '../../../lib/aiofficeApiBase.mjs';
import { ensurePublicRequestId } from '../../../lib/publicRequestId.mjs';

// Always fresh; a customer's order status must never be cached.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function json(payload, status = 200) {
  return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
}

function errorPayload(code, error, requestId = '') {
  return { ok: false, code, error, requestId: ensurePublicRequestId(requestId) };
}

// Forwards the signed-in customer's Supabase token to the backend, which
// verifies it and returns only that customer's own bookings. Same-origin
// proxy so the browser never needs a cross-origin auth request.
export async function GET(request) {
  const backend = resolveAiOfficeApiUrl('myBookings');
  if (!backend.ok) {
    return json(errorPayload('MY_BOOKINGS_UNAVAILABLE', 'Could not load your bookings.'), backend.status);
  }

  const authorization = String(request.headers.get('authorization') || '').trim();
  if (!authorization) {
    return json(errorPayload('UNAUTHORIZED', 'Sign in to view your bookings.'), 401);
  }
  try {
    const response = await fetch(backend.url, { headers: { Authorization: authorization }, cache: 'no-store' });
    const text = await response.text();
    let payload = null;
    try { payload = JSON.parse(text); } catch { payload = null; }
    if (!payload) {
      return json(errorPayload('MY_BOOKINGS_UNAVAILABLE', 'Could not load your bookings.'), 502);
    }
    if (!response.ok || payload.ok !== true) {
      const unauthorized = response.status === 401;
      return json(errorPayload(
        unauthorized ? 'UNAUTHORIZED' : 'MY_BOOKINGS_UNAVAILABLE',
        unauthorized ? 'Sign in to view your bookings.' : 'Could not load your bookings.',
        payload.requestId
      ), response.ok ? 502 : response.status);
    }
    if (!Array.isArray(payload.bookings)) {
      return json(errorPayload('MY_BOOKINGS_UNAVAILABLE', 'Could not load your bookings.', payload.requestId), 502);
    }
    return json({ ok: true, bookings: payload.bookings }, 200);
  } catch {
    return json(errorPayload('MY_BOOKINGS_UNAVAILABLE', 'Could not load your bookings.'), 502);
  }
}
