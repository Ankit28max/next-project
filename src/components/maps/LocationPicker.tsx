'use client';

import { useEffect, useRef, useState } from 'react';
import { LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { L, addTileLayer } from './leaflet-setup';

export interface LatLng {
  lat: number;
  lng: number;
}

// Where the map is centred before anything is chosen. This is only a camera
// position: no coordinates are selected until the user clicks or uses GPS.
const INDIA_VIEW: [number, number] = [22.6, 79.0];

export default function LocationPicker({ value, onChange }: { value: LatLng | null; onChange: (point: LatLng) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    if (!container.current || map.current) return;
    const m = L.map(container.current).setView(value ? [value.lat, value.lng] : INDIA_VIEW, value ? 16 : 5);
    addTileLayer(m);
    m.on('click', (event: L.LeafletMouseEvent) => onChangeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng }));
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
      marker.current = null;
    };
    // Runs once: the map is created on mount and later updates go through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the marker in sync with the selected point.
  useEffect(() => {
    if (!map.current || !value) return;
    if (!marker.current) {
      marker.current = L.marker([value.lat, value.lng], { draggable: true, alt: 'Selected location' }).addTo(map.current);
      marker.current.on('dragend', () => {
        const position = marker.current!.getLatLng();
        onChangeRef.current({ lat: position.lat, lng: position.lng });
      });
    } else {
      marker.current.setLatLng([value.lat, value.lng]);
    }
  }, [value]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGpsError('Your browser does not support location. Please click the map instead.');
      return;
    }
    setLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        map.current?.setView([point.lat, point.lng], 17);
        onChange(point);
      },
      () => {
        setLocating(false);
        setGpsError('Could not get your location. Please allow location access, or click the map instead.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="space-y-3">
      <Button type="button" variant="secondary" onClick={useMyLocation} loading={locating}>
        {!locating && <LocateFixed className="h-4 w-4" aria-hidden />}
        Use my location
      </Button>
      {gpsError && (
        <p role="alert" className="text-sm font-medium text-red-700">
          {gpsError}
        </p>
      )}
      <div
        ref={container}
        role="application"
        aria-label="Map. Click to place the pin on the problem location."
        className="h-72 w-full overflow-hidden rounded-lg border border-slate-300 sm:h-80"
      />
    </div>
  );
}
