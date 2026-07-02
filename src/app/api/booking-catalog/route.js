import { NextResponse } from 'next/server';
import { getFallbackWebsiteBookingCatalog, normalizePublicBookingCatalog } from '../../../lib/bookingCatalogNormalizer.mjs';

const DEFAULT_AIOFFICE_BOOKING_CATALOG_API_URL = 'https://staging.easygospa.com/api/public/booking-catalog';

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

export async function GET() {
  const targetUrl = process.env.AIOFFICE_BOOKING_CATALOG_API_URL || DEFAULT_AIOFFICE_BOOKING_CATALOG_API_URL;

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
