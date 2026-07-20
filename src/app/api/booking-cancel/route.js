import { NextResponse } from 'next/server';
import { resolveAiOfficeApiUrl } from '../../../lib/aiofficeApiBase.mjs';
import { isActiveBookingReference } from '../../../lib/activeBooking.mjs';
import { projectBookingCancelUpstream } from '../../../lib/bookingCancelProxy.mjs';
import { forwardedClientIpHeaders } from '../../../lib/serverForwardedIp.mjs';

function json(payload, status = 200, headers = {}) {
  return NextResponse.json(payload, { status, headers });
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function opaqueNotFound() {
  return json({ ok: false, reason: 'not_found' }, 404);
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const reference = String(body?.reference || '').trim();
  const contact = String(body?.contact || '').trim();
  if (!isActiveBookingReference(reference) || !contact) return opaqueNotFound();

  const backend = resolveAiOfficeApiUrl('bookingCancel');
  if (!backend.ok) return json({ ok: false, code: backend.code, error: backend.error }, backend.status);

  try {
    const response = await fetch(backend.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...forwardedClientIpHeaders(request) },
      body: JSON.stringify({ reference, contact }),
      cache: 'no-store'
    });
    const payload = parseJson(await response.text());
    const retryAfter = response.headers.get('retry-after');
    const projected = projectBookingCancelUpstream({
      httpStatus: response.status,
      payload,
      reference,
      retryAfter
    });
    return json(projected.body, projected.status, projected.headers);
  } catch {
    return json({
      ok: false,
      code: 'AIOFFICE_BOOKING_CANCEL_UNAVAILABLE',
      error: 'Booking cancellation is temporarily unavailable. Please try again.'
    }, 502);
  }
}

export function GET() {
  return json({ ok: false, code: 'METHOD_NOT_ALLOWED', error: 'Method not allowed' }, 405);
}

export function OPTIONS() {
  return new Response(null, { status: 204 });
}
