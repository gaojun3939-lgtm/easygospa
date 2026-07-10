'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { loadGoogleMaps, getGoogleMapsApiKey } from '../lib/googleMapsLoader.mjs';

// Metro Manila bias so suggestions favour the service area.
const MANILA_CENTER = { lat: 14.5547, lng: 121.0244 };

// Address field with inline Google Places suggestions rendered directly
// under the input (Grab-style). Selecting a suggestion fills the address
// text and reports coordinates. Degrades to a plain input when Maps is
// unavailable, so the booking never blocks.
export function AddressAutocompleteInput({ value, onTextChange, onLocationResolved, inputClassName, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const placesRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const onLocationResolvedRef = useRef(onLocationResolved);

  useEffect(() => {
    onLocationResolvedRef.current = onLocationResolved;
  }, [onLocationResolved]);

  useEffect(() => {
    if (!getGoogleMapsApiKey()) return;
    let cancelled = false;
    loadGoogleMaps()
      .then(async maps => {
        const places = await maps.importLibrary('places');
        if (!cancelled) placesRef.current = places;
      })
      .catch(() => { placesRef.current = null; });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function handleOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const fetchSuggestions = useCallback(async text => {
    const places = placesRef.current;
    if (!places?.AutocompleteSuggestion || !text.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      if (!sessionTokenRef.current && places.AutocompleteSessionToken) {
        sessionTokenRef.current = new places.AutocompleteSessionToken();
      }
      const request = {
        input: text,
        locationBias: { center: MANILA_CENTER, radius: 40000 },
        sessionToken: sessionTokenRef.current || undefined
      };
      const { suggestions: results } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
      const mapped = (results || [])
        .map(item => item.placePrediction)
        .filter(Boolean)
        .map(prediction => ({
          prediction,
          mainText: prediction.mainText?.text || prediction.text?.text || '',
          secondaryText: prediction.secondaryText?.text || ''
        }))
        .filter(item => item.mainText);
      setSuggestions(mapped);
      setActiveIndex(-1);
    } catch {
      setSuggestions([]);
    }
  }, []);

  function handleInput(event) {
    const text = event.target.value;
    onTextChange?.(text);
    setOpen(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchSuggestions(text), 250);
  }

  async function selectSuggestion(item) {
    onTextChange?.(item.secondaryText ? `${item.mainText}, ${item.secondaryText}` : item.mainText);
    setOpen(false);
    setSuggestions([]);
    try {
      const place = item.prediction.toPlace();
      await place.fetchFields({ fields: ['location', 'formattedAddress'] });
      const location = place.location;
      if (location) {
        const latitude = typeof location.lat === 'function' ? location.lat() : location.lat;
        const longitude = typeof location.lng === 'function' ? location.lng() : location.lng;
        onLocationResolvedRef.current?.({ latitude, longitude, source: 'places_autocomplete', formattedAddress: place.formattedAddress || '' });
      }
    } catch {
      /* selection resolved text only; map pin can still be set manually */
    }
    sessionTokenRef.current = null; // new session after a completed selection
  }

  function handleKeyDown(event) {
    if (!open || !suggestions.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(index => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(index => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        className={inputClassName}
        value={value}
        onChange={handleInput}
        onFocus={() => value && suggestions.length && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        data-readability-field="addressNote"
        data-testid="address-autocomplete-input"
        required
      />
      {open && suggestions.length ? (
        <ul
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-2xl border border-gray-200 bg-white py-1 shadow-xl"
          data-testid="address-suggestions"
        >
          {suggestions.map((item, index) => (
            <li key={`${item.mainText}-${index}`}>
              <button
                type="button"
                onMouseDown={event => { event.preventDefault(); selectSuggestion(item); }}
                className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition ${index === activeIndex ? 'bg-[#F1FBF3]' : 'hover:bg-gray-50'}`}
              >
                <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#E8F5E9] text-[#3F7838]">
                  <MapPin className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#0F0F0F]">{item.mainText}</span>
                  {item.secondaryText ? <span className="block truncate text-xs text-gray-500">{item.secondaryText}</span> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
