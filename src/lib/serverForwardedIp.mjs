import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

function firstValidatedIp(value = '') {
  const candidate = String(value || '').split(',')[0].trim();
  return isIP(candidate) ? candidate : '';
}

export function forwardedClientIpHeaders(request, { env = process.env, now = new Date() } = {}) {
  const clientIp = firstValidatedIp(request?.headers?.get?.('x-vercel-forwarded-for'));
  const secret = String(env?.AIOFFICE_PROXY_IP_SECRET || '').trim();
  if (!clientIp || secret.length < 32) return {};

  const current = typeof now === 'function' ? now() : now;
  const currentMs = current instanceof Date ? current.getTime() : new Date(current).getTime();
  if (!Number.isFinite(currentMs)) return {};
  const timestamp = String(Math.floor(currentMs / 1000));
  const signature = createHmac('sha256', secret)
    .update(`${timestamp}\n${clientIp}`)
    .digest('hex');

  return {
    'x-forwarded-for': clientIp,
    'x-easygospa-client-ip': clientIp,
    'x-easygospa-client-ip-timestamp': timestamp,
    'x-easygospa-client-ip-signature': signature
  };
}
