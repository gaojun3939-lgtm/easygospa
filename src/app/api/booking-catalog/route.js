import { NextResponse } from 'next/server';
import { getFallbackWebsiteBookingCatalog, normalizePublicBookingCatalog } from '../../../lib/bookingCatalogNormalizer.mjs';
import { resolveAiOfficeApiUrl } from '../../../lib/aiofficeApiBase.mjs';

// Always fresh: a therapist toggling their work shift must reflect on the wall
// immediately, so never let Next/CDN cache this proxy response.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  const backend = resolveAiOfficeApiUrl('bookingCatalog');
  if (!backend.ok) return json({ ok: false, code: backend.code, error: backend.error }, backend.status);
  const baseUrl = backend.url;

  // Forward optional customer coordinates so the backend can attach an
  // approximate distance per therapist. Coordinates are not stored.
  let targetUrl = baseUrl;
  try {
    const incoming = new URL(request.url);
    const lat = Number(incoming.searchParams.get('lat'));
    const lng = Number(incoming.searchParams.get('lng'));
    if (Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lng) && lng >= -180 && lng <= 180) {
      // Coarsen to ~1km (2 decimals) so the exact customer location never lands
      // in this proxy's or the backend's access logs; still precise enough for
      // per-therapist distance banding.
      const upstream = new URL(baseUrl);
      upstream.searchParams.set('lat', lat.toFixed(2));
      upstream.searchParams.set('lng', lng.toFixed(2));
      targetUrl = upstream.toString();
    }
  } catch {
    targetUrl = baseUrl;
  }

  try {
    const response = await fetch(targetUrl, { cache: 'no-store' });
    const text = await response.text();
    const payload = parseJson(text);
    if (!response.ok || payload?.ok === false || !payload) {
      return json(getFallbackWebsiteBookingCatalog('ai_office_public_catalog_unavailable'));
    }
    return json(normalizePublicBookingCatalog(payload));
  } catch {
    return json(getFallbackWebsiteBookingCatalog('ai_office_public_catalog_fetch_failed'));
  }
}
