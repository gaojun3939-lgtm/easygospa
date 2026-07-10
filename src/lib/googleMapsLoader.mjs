// Google Maps JS loader (official inline bootstrap, idempotent).
// Usage: await loadGoogleMaps(); then google.maps.importLibrary('maps') etc.

let loaderPromise = null;

export function getGoogleMapsApiKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
}

export function loadGoogleMaps() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Google Maps can only load in the browser.'));
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps);
  if (loaderPromise) return loaderPromise;

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return Promise.reject(new Error('Google Maps API key is not configured.'));

  loaderPromise = new Promise((resolve, reject) => {
    // Official dynamic-import bootstrap from Google Maps documentation.
    ((g) => {
      let h, a, k;
      const p = 'The Google Maps JavaScript API';
      const c = 'google';
      const l = 'importLibrary';
      const q = '__ib__';
      const m = document;
      let b = window;
      b = b[c] || (b[c] = {});
      const d = b.maps || (b.maps = {});
      const r = new Set();
      const e = new URLSearchParams();
      const u = () => h || (h = new Promise(async (f, n) => {
        a = m.createElement('script');
        e.set('libraries', [...r] + '');
        for (k in g) e.set(k.replace(/[A-Z]/g, t => '_' + t[0].toLowerCase()), g[k]);
        e.set('callback', c + '.maps.' + q);
        a.src = 'https://maps.' + c + 'apis.com/maps/api/js?' + e;
        d[q] = f;
        a.onerror = () => (h = n(Error(p + ' could not load.')));
        a.nonce = m.querySelector('script[nonce]')?.nonce || '';
        m.head.append(a);
      }));
      d[l] ? console.warn(p + ' only loads once. Ignoring:', g) : (d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)));
    })({ key: apiKey, v: 'weekly' });

    window.google.maps.importLibrary('maps')
      .then(() => resolve(window.google.maps))
      .catch(reject);
  });

  return loaderPromise;
}
