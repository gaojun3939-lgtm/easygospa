import { isIP } from 'node:net';

function firstValidatedIp(value = '') {
  const candidate = String(value || '').split(',')[0].trim();
  return isIP(candidate) ? candidate : '';
}

export function forwardedClientIpHeaders(request) {
  const headerNames = ['x-vercel-forwarded-for', 'x-forwarded-for', 'x-real-ip'];
  for (const headerName of headerNames) {
    const clientIp = firstValidatedIp(request?.headers?.get?.(headerName));
    if (clientIp) return { 'x-forwarded-for': clientIp };
  }
  return {};
}
