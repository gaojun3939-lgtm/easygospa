import { NextResponse } from 'next/server';
import { resolveAiOfficeApiUrl } from '../../../lib/aiofficeApiBase.mjs';

// Always fresh; a customer's order status must never be cached.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function json(payload, status = 200) {
  return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
}

// Forwards the signed-in customer's Supabase token to the backend, which
// verifies it and returns only that customer's own bookings. Same-origin
// proxy so the browser never needs a cross-origin auth request.
export async function GET(request) {
  const backend = resolveAiOfficeApiUrl('myBookings');
  if (!backend.ok) return json({ ok: false, code: backend.code, error: backend.error }, backend.status);

  const authorization = String(request.headers.get('authorization') || '').trim();
  if (!authorization) {
    return json({ ok: false, code: 'UNAUTHORIZED', error: 'Sign in to view your bookings' }, 401);
  }
  try {
    const response = await fetch(backend.url, { headers: { Authorization: authorization }, cache: 'no-store' });
    const text = await response.text();
    let payload = null;
    try { payload = JSON.parse(text); } catch { payload = null; }
    if (!payload) {
      return json({ ok: false, code: 'MY_BOOKINGS_UNAVAILABLE', error: 'Could not load your bookings' }, 502);
    }
    return json(payload, response.status);
  } catch {
    return json({ ok: false, code: 'MY_BOOKINGS_UNAVAILABLE', error: 'Could not load your bookings' }, 502);
  }
}
