import { NextResponse } from 'next/server';
import { resolveAiOfficeApiUrl } from '../../../lib/aiofficeApiBase.mjs';
import { forwardedClientIpHeaders } from '../../../lib/serverForwardedIp.mjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function json(payload, status = 200) {
  return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
}

// 只把手机号里的数字留下,别的一概不转发。
function cleanPhone(value = '') {
  return String(value ?? '').replace(/\D/g, '').slice(0, 20);
}

// 新客活动券:领券(POST)/ 查还剩多久(GET)。转发到后台,前端拿不到任何后台地址。
export async function POST(request) {
  const backend = resolveAiOfficeApiUrl('promoClaim');
  if (!backend.ok) return json({ ok: false, code: backend.code, error: backend.error }, backend.status);
  const body = await request.json().catch(() => ({}));
  const phone = cleanPhone(body.phone);
  if (phone.length < 10) {
    return json({ ok: false, code: 'PHONE_INVALID', error: 'Please enter a valid Philippine mobile number.' }, 400);
  }
  try {
    const response = await fetch(backend.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...forwardedClientIpHeaders(request) },
      body: JSON.stringify({ phone, source: 'welcome-page' }),
      cache: 'no-store'
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.ok !== true) {
      return json({
        ok: false,
        code: payload?.code || 'PROMO_UNAVAILABLE',
        error: payload?.error || 'This offer is not available right now.'
      }, response.ok ? 502 : response.status);
    }
    return json({ ok: true, coupon: payload.coupon || null });
  } catch {
    return json({ ok: false, code: 'PROMO_UNAVAILABLE', error: 'This offer is not available right now.' }, 502);
  }
}

// 带 phone = 查这个号的券还剩多久;不带 phone = 问"现在有没有活动、减多少"
// (技师墙要用它显示 First booking ₱850,金额不写死在前端)。
export async function GET(request) {
  const backend = resolveAiOfficeApiUrl('promoClaim');
  const off = { ok: true, enabled: false, amount: 0, coupon: null };
  if (!backend.ok) return json(off);
  const phone = cleanPhone(new URL(request.url).searchParams.get('phone') || '');
  try {
    const target = phone.length >= 10 ? `${backend.url}?phone=${encodeURIComponent(phone)}` : backend.url;
    const response = await fetch(target, {
      headers: forwardedClientIpHeaders(request),
      cache: 'no-store'
    });
    const payload = await response.json().catch(() => null);
    return json({
      ok: true,
      enabled: payload?.enabled === true,
      amount: Number(payload?.amount) || 0,
      coupon: payload?.coupon || null
    });
  } catch {
    return json(off);
  }
}
