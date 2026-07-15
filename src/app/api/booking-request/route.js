import { NextResponse } from 'next/server';
import { BookingRequestValidationError, normalizeWebsiteBookingRequest } from '../../../lib/bookingRequestPayload.mjs';

const DEFAULT_AIOFFICE_BOOKING_API_URL = 'https://staging.easygospa.com/api/bookings/public-request';

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

function extractBookingReference(payload = {}) {
  const bookingRequest = payload?.bookingRequest || {};
  return String(
    bookingRequest.id
      || bookingRequest.reference
      || bookingRequest.bookingRequestId
      || payload?.reference
      || payload?.bookingRequestId
      || ''
  ).trim();
}

function isValidBookingReference(value = '') {
  return /^mbr-brand-a-[a-z0-9]+$/i.test(String(value || '').trim());
}

export async function POST(request) {
  let aiOfficePayload;
  try {
    const body = await request.json().catch(() => ({}));
    aiOfficePayload = normalizeWebsiteBookingRequest(body);
  } catch (error) {
    if (error instanceof BookingRequestValidationError) {
      return json({ ok: false, code: error.code, error: error.message }, 400);
    }
    return json({ ok: false, code: 'INVALID_BOOKING_REQUEST', error: 'Invalid booking request.' }, 400);
  }

  const targetUrl = process.env.AIOFFICE_BOOKING_API_URL || DEFAULT_AIOFFICE_BOOKING_API_URL;

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(aiOfficePayload),
      cache: 'no-store'
    });
    const text = await response.text();
    const payload = parseJson(text);

    if (!response.ok || payload?.ok === false) {
      return json({
        ok: false,
        code: payload?.code || 'AIOFFICE_BOOKING_REQUEST_FAILED',
        error: payload?.error || 'Booking request could not be submitted.'
      }, response.ok ? 502 : response.status);
    }

    const bookingRequest = payload?.bookingRequest || null;
    const reference = extractBookingReference(payload);
    if (!isValidBookingReference(reference)) {
      return json({
        ok: false,
        code: 'AIOFFICE_BOOKING_REFERENCE_MISSING',
        error: 'Booking request was not confirmed by the intake service. Please try again or contact us on WhatsApp.'
      }, 502);
    }

    return json({
      ok: true,
      mode: 'website_booking_request_proxy',
      providerMode: 'ai_office_public_booking_request',
      reference,
      bookingRequest,
      customer: payload?.customer || null,
      thread: payload?.thread || null,
      summary: {
        customerEmail: aiOfficePayload.customerEmail,
        requestedTechnicianId: aiOfficePayload.requestedTechnicianId,
        requestedTechnicianName: aiOfficePayload.requestedTechnicianName,
        requestedTechnicianProfileId: aiOfficePayload.requestedTechnicianProfileId,
        requestedTechnicianProfileName: aiOfficePayload.requestedTechnicianProfileName,
        requestedTechnicianAccountId: aiOfficePayload.requestedTechnicianAccountId,
        requestedTechnicianAccountName: aiOfficePayload.requestedTechnicianAccountName,
        serviceId: aiOfficePayload.serviceId,
        service: aiOfficePayload.service,
        selectedServices: aiOfficePayload.selectedServices,
        durationMinutes: aiOfficePayload.durationMinutes,
        totalAmount: aiOfficePayload.totalAmount,
        currency: aiOfficePayload.currency,
        preferredDate: aiOfficePayload.preferredDate,
        preferredTime: aiOfficePayload.preferredTime,
        area: aiOfficePayload.area,
        paymentMethod: aiOfficePayload.paymentMethod,
        paymentStatus: aiOfficePayload.paymentStatus,
        paymentTiming: aiOfficePayload.paymentTiming
      },
      externalSend: false,
      customerMessageSent: false,
      financeWrite: false,
      autoDispatch: false,
      autoPaid: false
    });
  } catch {
    return json({
      ok: false,
      code: 'AIOFFICE_BOOKING_API_UNAVAILABLE',
      error: 'Booking service is temporarily unavailable. Please try again or contact us on WhatsApp.'
    }, 502);
  }
}

export function GET() {
  return json({ ok: false, code: 'METHOD_NOT_ALLOWED', error: 'Method not allowed' }, 405);
}

// CORS preflight for cross-address booking submits (easygospa.com <-> www.easygospa.com).
// The JSON POST triggers a preflight OPTIONS that must succeed with a 2xx before the
// browser sends the real request. CORS response headers are applied by next.config.
export function OPTIONS() {
  return new Response(null, { status: 204 });
}
