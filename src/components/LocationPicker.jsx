'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Crosshair, MapPin } from 'lucide-react';
import { loadGoogleMaps, getGoogleMapsApiKey } from '../lib/googleMapsLoader.mjs';

// Metro Manila fallback center (used before the customer picks a point).
const DEFAULT_CENTER = { lat: 14.5547, lng: 121.0244 };

// Customer pin location picker for the booking flow.
// Sources (all optional, all set the same value): GPS locate button,
// dragging the pin, tapping the map, or Places autocomplete.
// Degrades gracefully: if Maps fails to load, booking continues without a pin.
export function LocationPicker({ value, onChange }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [mapState, setMapState] = useState('loading'); // loading | ready | unavailable
  const [locateState, setLocateState] = useState('idle'); // idle | locating | done | denied | unsupported

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // When the address field (or GPS) resolves a location elsewhere, move the pin here too.
  useEffect(() => {
    if (!value?.latitude || !mapRef.current || !markerRef.current) return;
    const position = { lat: value.latitude, lng: value.longitude };
    markerRef.current.setPosition(position);
    mapRef.current.panTo(position);
    if (mapRef.current.getZoom() < 15) mapRef.current.setZoom(16);
  }, [value?.latitude, value?.longitude]);

  const applyLocation = useCallback((latitude, longitude, source) => {
    const position = { lat: latitude, lng: longitude };
    if (markerRef.current) markerRef.current.setPosition(position);
    if (mapRef.current) {
      mapRef.current.panTo(position);
      if (mapRef.current.getZoom() < 15) mapRef.current.setZoom(16);
    }
    onChangeRef.current?.({ latitude, longitude, source });
  }, []);

  useEffect(() => {
    if (!getGoogleMapsApiKey()) {
      setMapState('unavailable');
      return;
    }
    let cancelled = false;
    loadGoogleMaps()
      .then(async maps => {
        if (cancelled || !mapContainerRef.current) return;
        await maps.importLibrary('maps');
        await maps.importLibrary('marker');
        const center = value?.latitude ? { lat: value.latitude, lng: value.longitude } : DEFAULT_CENTER;
        const map = new maps.Map(mapContainerRef.current, {
          center,
          zoom: value?.latitude ? 16 : 12,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: 'greedy'
        });
        const marker = new maps.Marker({ map, position: center, draggable: true });
        marker.addListener('dragend', () => {
          const position = marker.getPosition();
          if (position) applyLocation(position.lat(), position.lng(), 'pin_drag');
        });
        map.addListener('click', event => {
          if (event.latLng) applyLocation(event.latLng.lat(), event.latLng.lng(), 'map_tap');
        });
        mapRef.current = map;
        markerRef.current = marker;
        setMapState('ready');
      })
      .catch(() => {
        if (!cancelled) setMapState('unavailable');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function locateMe() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocateState('unsupported');
      return;
    }
    setLocateState('locating');
    navigator.geolocation.getCurrentPosition(
      position => {
        applyLocation(position.coords.latitude, position.coords.longitude, 'gps');
        setLocateState('done');
      },
      () => setLocateState('denied'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  if (mapState === 'unavailable') {
    return (
      <p className="rounded-2xl bg-gray-50 px-4 py-3 text-xs leading-5 text-gray-500" data-testid="location-picker-unavailable">
        Map is temporarily unavailable. Your booking still works - just describe your exact address above.
      </p>
    );
  }

  return (
    <div className="space-y-3" data-testid="location-picker">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={locateMe}
          disabled={locateState === 'locating'}
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#4E8D43] px-4 text-sm font-bold text-white hover:bg-[#3F7838] disabled:opacity-60"
          data-testid="locate-me-button"
        >
          <Crosshair className="h-4 w-4" />
          {locateState === 'locating' ? 'Locating...' : 'Use my location'}
        </button>
        {value?.latitude ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-3 py-1.5 text-xs font-semibold text-[#3F7838]" data-testid="location-set-chip">
            <MapPin className="h-3.5 w-3.5" />
            Location pinned
          </span>
        ) : (
          <span className="text-xs text-gray-500">Tap the map or drag the pin to your exact spot.</span>
        )}
      </div>
      {locateState === 'denied' ? (
        <p className="text-xs leading-5 text-amber-700">Location permission was blocked. You can still tap the map or search your building below.</p>
      ) : null}
      {locateState === 'unsupported' ? (
        <p className="text-xs leading-5 text-amber-700">This browser does not support location. Tap the map or search your building below.</p>
      ) : null}
      <div
        ref={mapContainerRef}
        style={{ height: '13rem' }}
        className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
        data-testid="location-picker-map"
      />
    </div>
  );
}
