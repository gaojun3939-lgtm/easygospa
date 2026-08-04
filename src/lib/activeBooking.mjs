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

// 纸条最多留 24 小时。等了一天一夜还没技师接的单基本就是黄了,
// 不该再拦着客人下第二单——这条也兜住所有没预料到的死法。
export const ACTIVE_BOOKING_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function isActiveBookingExpired(marker, { now = Date.now() } = {}) {
  const createdAt = Date.parse(String(marker?.createdAt || ''));
  if (!Number.isFinite(createdAt)) return true;
  return now - createdAt >= ACTIVE_BOOKING_MAX_AGE_MS;
}

// ⚠ 2026-08-04 修:原来"这单真没了(404)"和"服务器答不上来(502/断网)"
// 被 BookingModal 那句 `if (!response.ok) return null` 抹成同一个 null,
// 于是单被删掉的客人被永久拦住——下不了单、看不了单、也取消不掉。
// 现在两者必须分开:404 撕纸条放行,答不上来照旧拦。
// 放宽是安全的:真正的防重复下单在服务端(public-request 回 ACTIVE_BOOKING_EXISTS),
// 浏览器这张纸条只是"别白填一遍表"的提醒,客人本来就能自己清掉。
export async function resolveActiveBookingGate({ storage = browserLocalStorage(), loadStatus, isCurrent = () => true, now = Date.now() } = {}) {
  const marker = readActiveBooking({ storage });
  if (!marker) return null;
  if (isActiveBookingExpired(marker, { now })) {
    clearActiveBooking({ storage, reference: marker.reference });
    return null;
  }
  let payload = null;
  try {
    payload = typeof loadStatus === 'function' ? await loadStatus(marker.reference) : null;
    if (!isCurrent()) return null;
  } catch {
    if (!isCurrent()) return null;
    return marker;
  }
  if (!isCurrent()) return null;
  // 服务器明确说"这单不存在" → 纸条是死的,撕掉
  if (payload?.missing === true) {
    clearActiveBooking({ storage, reference: marker.reference });
    return null;
  }
  const status = String(payload?.status || '').trim();
  if (payload?.ok !== true || !status || status === 'waiting_acceptance') return marker;
  clearActiveBooking({ storage, reference: marker.reference });
  return null;
}
