'use client';

import { useEffect, useRef } from 'react';
import { L, addTileLayer } from './leaflet-setup';

export default function ComplaintMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    const map = L.map(container.current, { scrollWheelZoom: false }).setView([latitude, longitude], 16);
    addTileLayer(map);
    L.marker([latitude, longitude], { alt: 'Complaint location' }).addTo(map);
    return () => {
      map.remove();
    };
  }, [latitude, longitude]);

  return (
    <div
      ref={container}
      role="img"
      aria-label={`Map showing the complaint location at ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
      className="h-56 w-full overflow-hidden rounded-lg border border-slate-300"
    />
  );
}
