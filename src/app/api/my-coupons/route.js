import { NextResponse } from 'next/server';
import { resolveAiOfficeApiUrl } from '../../../lib/aiofficeApiBase.mjs';
import { normalizeCouponWalletPayload } from '../../../lib/reviewCouponNormalizer.mjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function json(payload, status = 200) {
  return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
}

export async function GET(request) {
  const backend = resolveAiOfficeApiUrl('myCoupons');
  if (!backend.ok) return json({ ok: false, code: backend.code, error: backend.error }, backend.status);

  const authorization = String(request.headers.get('authorization') || '').trim();
  if (!authorization) return json({ ok: false, code: 'UNAUTHORIZED', error: 'Sign in to view your coupons' }, 401);

  try {
    const response = await fetch(backend.url, {
      headers: { Authorization: authorization },
      cache: 'no-store'
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.ok !== true) {
      return json({ ok: false, code: 'COUPON_WALLET_UNAVAILABLE', error: 'Could not load your coupons', coupons: [] }, response.ok ? 502 : response.status);
    }
    return json(normalizeCouponWalletPayload(payload));
  } catch {
    return json({ ok: false, code: 'COUPON_WALLET_UNAVAILABLE', error: 'Could not load your coupons', coupons: [] }, 502);
  }
}
