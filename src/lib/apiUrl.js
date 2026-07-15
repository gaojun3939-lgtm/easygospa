// The site resolves on both easygospa.com (apex) and www.easygospa.com. The
// platform 308-redirects apex /api/* requests to the www host. A cross-origin
// redirect strips the CORS headers, so a page that stays on the apex domain
// (some networks/clients don't follow the apex->www page redirect) cannot read
// the booking APIs and shows "catalog could not be loaded".
//
// Fix: when the page is on the apex host, call the canonical www host directly.
// That is a plain cross-origin request (no redirect to strip CORS), and the www
// API responses carry Access-Control-Allow-Origin, so the browser allows it.
// On www or localhost the path stays relative (same-origin, no CORS needed).
const CANONICAL_API_ORIGIN = 'https://www.easygospa.com';

export function apiUrl(path) {
  if (typeof window !== 'undefined' && window.location.hostname === 'easygospa.com') {
    return `${CANONICAL_API_ORIGIN}${path}`;
  }
  return path;
}
