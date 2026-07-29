import { NextResponse } from 'next/server';
import { resolveAiOfficeApiUrl } from '../../../lib/aiofficeApiBase.mjs';

// A therapist can edit her shift or take a job at any second, so a stale answer here
// means offering the customer a slot that is already gone. Never cached.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

function json(payload, status = 200) {
  return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function GET(request) {
  const backend = resolveAiOfficeApiUrl('bookingAvailability');
  if (!backend.ok) return json({ ok: false, code: backend.code, error: backend.error }, backend.status);

  let targetUrl;
  try {
    const incoming = new URL(request.url);
    const upstream = new URL(backend.url);
    // Only these four ever reach the backend — nothing the customer typed about
    // themselves belongs in an availability lookup.
    const therapistId = String(incoming.searchParams.get('therapistId') || '').trim();
    const date = String(incoming.searchParams.get('date') || '').trim();
    const time = String(incoming.searchParams.get('time') || '').trim();
    const durationMinutes = Number(incoming.searchParams.get('durationMinutes'));
    if (therapistId) upstream.searchParams.set('therapistId', therapistId.slice(0, 120));
    if (DATE_PATTERN.test(date)) upstream.searchParams.set('date', date);
    if (TIME_PATTERN.test(time)) upstream.searchParams.set('time', time);
    if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
      upstream.searchParams.set('durationMinutes', String(Math.round(durationMinutes)));
    }
    if (!upstream.searchParams.get('therapistId') && !(upstream.searchParams.get('date') && upstream.searchParams.get('time'))) {
      return json({ ok: false, code: 'AVAILABILITY_QUERY_REQUIRED', error: 'Provide a therapist, or a date and time.' }, 400);
    }
    targetUrl = upstream.toString();
  } catch {
    return json({ ok: false, code: 'AVAILABILITY_QUERY_INVALID', error: 'Could not read the availability request.' }, 400);
  }

  try {
    const response = await fetch(targetUrl, { cache: 'no-store' });
    const payload = parseJson(await response.text());
    if (!response.ok || !payload || payload.ok === false) {
      // Fail closed: an unknown answer must never look like "everything is open".
      return json({
        ok: false,
        code: payload?.code || 'AVAILABILITY_UNAVAILABLE',
        error: payload?.error || 'We could not check availability just now.'
      }, response.status === 429 ? 429 : 503);
    }
    return json(payload);
  } catch {
    return json({ ok: false, code: 'AVAILABILITY_FETCH_FAILED', error: 'We could not check availability just now.' }, 503);
  }
}
