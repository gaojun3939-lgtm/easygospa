export const ACTIVE_BOOKING_STORAGE_KEY = 'egActiveBooking.v1';

const PUBLIC_BOOKING_REFERENCE_PATTERN = /^mbr-brand-a-[a-z0-9]+$/i;
const PUBLIC_BOOKING_CANCEL_TOKEN_PATTERN = /^egc1_[A-Za-z0-9_-]{43}$/;
const ACTIVE_BOOKING_FIELDS = Object.freeze(['cancelToken', 'createdAt', 'reference']);

export function isActiveBookingReference(value = '') {
  return PUBLIC_BOOKING_REFERENCE_PATTERN.test(String(value || '').trim());
}

export function isPublicBookingCancelToken(value = '') {
  return PUBLIC_BOOKING_CANCEL_TOKEN_PATTERN.test(String(value || '').trim());
}

function browserLocalStorage() {
  return typeof window !== 'undefined' ? window.localStorage : null;
}

function validCreatedAt(value = '') {
  const text = String(value || '').trim();
  return text && Number.isFinite(Date.parse(text)) ? text : '';
}

export function readActiveBooking({ storage = browserLocalStorage() } = {}) {
  if (!storage) return null;
  try {
    const parsed = JSON.parse(storage.getItem(ACTIVE_BOOKING_STORAGE_KEY) || 'null');
    const keys = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? Object.keys(parsed).sort()
      : [];
    const reference = String(parsed?.reference || '').trim();
    const cancelToken = String(parsed?.cancelToken || '').trim();
    const createdAt = validCreatedAt(parsed?.createdAt);
    if (
      keys.length !== ACTIVE_BOOKING_FIELDS.length
      || keys.some((key, index) => key !== ACTIVE_BOOKING_FIELDS[index])
      || !isActiveBookingReference(reference)
      || !isPublicBookingCancelToken(cancelToken)
      || !createdAt
    ) {
      storage.removeItem(ACTIVE_BOOKING_STORAGE_KEY);
      return null;
    }
    return { reference, cancelToken, createdAt };
  } catch {
    try {
      storage.removeItem(ACTIVE_BOOKING_STORAGE_KEY);
    } catch {}
    return null;
  }
}

export function writeActiveBooking(reference, { cancelToken = '', storage = browserLocalStorage(), now = () => new Date().toISOString() } = {}) {
  const normalizedReference = String(reference || '').trim();
  const normalizedCancelToken = String(cancelToken || '').trim();
  const createdAt = validCreatedAt(now());
  if (!storage || !isActiveBookingReference(normalizedReference) || !isPublicBookingCancelToken(normalizedCancelToken) || !createdAt) return null;
  const marker = { reference: normalizedReference, cancelToken: normalizedCancelToken, createdAt };
  try {
    storage.setItem(ACTIVE_BOOKING_STORAGE_KEY, JSON.stringify(marker));
    return marker;
  } catch {
    return null;
  }
}

export function clearActiveBooking({ storage = browserLocalStorage(), reference = '' } = {}) {
  if (!storage) return false;
  try {
    if (reference) {
      const current = readActiveBooking({ storage });
      if (!current || current.reference !== String(reference).trim()) return false;
    }
    storage.removeItem(ACTIVE_BOOKING_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export async function resolveActiveBookingGate({ storage = browserLocalStorage(), loadStatus, isCurrent = () => true } = {}) {
  const marker = readActiveBooking({ storage });
  if (!marker) return null;
  let payload = null;
  try {
    payload = typeof loadStatus === 'function' ? await loadStatus(marker.reference) : null;
    if (!isCurrent()) return null;
  } catch {
    if (!isCurrent()) return null;
    return marker;
  }
  if (!isCurrent()) return null;
  const status = String(payload?.status || '').trim();
  if (payload?.ok !== true || !status || status === 'waiting_acceptance') return marker;
  clearActiveBooking({ storage, reference: marker.reference });
  return null;
}
