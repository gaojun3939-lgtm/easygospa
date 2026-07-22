const PUBLIC_REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanText(value = '') {
  return String(value || '').trim();
}

export function isPublicRequestId(value = '') {
  return PUBLIC_REQUEST_ID_PATTERN.test(cleanText(value));
}

export function validatedPublicRequestId(value = '') {
  const candidate = cleanText(value);
  return isPublicRequestId(candidate) ? candidate.toLowerCase() : '';
}

export function ensurePublicRequestId(value = '', { randomUUID } = {}) {
  const existing = validatedPublicRequestId(value);
  if (existing) return existing;
  const create = typeof randomUUID === 'function'
    ? randomUUID
    : () => globalThis.crypto.randomUUID();
  const generated = validatedPublicRequestId(create());
  if (!generated) throw new Error('Secure UUID generation failed');
  return generated;
}
