import { NextResponse } from 'next/server';
import { normalizeBookingStatusPayload } from '../../../lib/bookingStatus.mjs';
import { resolveAiOfficeApiUrl } from '../../../lib/aiofficeApiBase.mjs';

function json(payload, status = 200) {
  return NextResponse.json(payload, { status });
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
  const backend = resolveAiOfficeApiUrl('bookingStatus');
  if (!backend.ok) return json({ ok: false, code: backend.code, error: backend.error }, backend.status);

  const incomingUrl = new URL(request.url);
  const reference = incomingUrl.searchParams.get('ref')?.trim() || '';
  if (!reference) return json({ ok: false, reason: 'not_found' }, 404);

  const targetUrl = new URL(backend.url);
  targetUrl.searchParams.set('ref', reference);

  try {
    const response = await fetch(targetUrl, { cache: 'no-store' });
    const payload = parseJson(await response.text());

    if (response.status === 404 || payload?.reason === 'not_found') {
      return json({ ok: false, reason: 'not_found' }, 404);
    }
    if (!response.ok || payload?.ok !== true) {
      return json({ ok: false, reason: 'upstream_error' }, 502);
    }

    const normalized = normalizeBookingStatusPayload(payload);
    if (!normalized) return json({ ok: false, reason: 'invalid_response' }, 502);
    return json(normalized);
  } catch {
    return json({ ok: false, reason: 'network_error' }, 502);
  }
}
