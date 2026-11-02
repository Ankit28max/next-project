'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Locate, MapPin } from 'lucide-react';

interface LocationPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
}

export default function LeafletLocationPicker({
  initialLat = 28.6139,
  initialLng = 77.2090,
  onLocationSelect,
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat || 28.6139,
    lng: initialLng || 77.2090,
  });
  const [isLocating, setIsLocating] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  // Initialize Leaflet only in browser
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = (await import('leaflet')).default;
      // Inject Leaflet CSS dynamically if not present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Fix Leaflet default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current).setView([coords.lat, coords.lng], 14);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const marker = L.marker([coords.lat, coords.lng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', async function (e: any) {
        const position = e.target.getLatLng();
        setCoords({ lat: position.lat, lng: position.lng });
        handleReverseGeocode(position.lat, position.lng);
      });

      map.on('click', async function (e: any) {
        marker.setLatLng(e.latlng);
        setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        handleReverseGeocode(e.latlng.lat, e.latlng.lng);
      });
    }

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleReverseGeocode = async (lat: number, lng: number) => {
    setAddressLoading(true);
    let resolvedAddress = `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    try {
      // Nominatim public geocoding with user-agent
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: { 'User-Agent': 'SmartGrievancePortal/1.0' },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          resolvedAddress = data.display_name;
        }
      }
    } catch (err) {
      // Fallback
    } finally {
      setAddressLoading(false);
      onLocationSelect(lat, lng, resolvedAddress);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }

        handleReverseGeocode(lat, lng);
      },
      (error) => {
        setIsLocating(false);
        alert('Could not retrieve current location. Please pick location manually on the map.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <MapPin className="h-4 w-4 text-gov-700" />
          <span>Click on map or drag pin to mark the incident location</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGetCurrentLocation}
          isLoading={isLocating}
          className="text-xs"
        >
          <Locate className="h-3.5 w-3.5 mr-1" />
          Use GPS Location
        </Button>
      </div>

      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        className="h-64 w-full rounded-xl border border-slate-300 shadow-inner z-0 overflow-hidden"
      />

      <div className="flex items-center justify-between text-xs text-slate-500 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200">
        <span>
          Selected: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </span>
        {addressLoading && <span className="text-gov-700 animate-pulse">Resolving address...</span>}
      </div>
    </div>
  );
}
