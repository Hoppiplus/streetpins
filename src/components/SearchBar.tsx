'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const LIBRARIES: ('places')[] = ['places'];

// Lift meaningful area name from a geocoder label
function extractAreaName(label: string): string {
  const parts = label.split(',').map((s) => s.trim()).filter(Boolean);
  const SKIP = new Set(['indonesia', 'dki jakarta', 'jawa barat', 'jawa tengah', 'jawa timur']);
  const POSTAL = /^\d{4,6}$/;
  const meaningful = parts.filter((p) => !SKIP.has(p.toLowerCase()) && !POSTAL.test(p));
  return meaningful.slice(0, 2).join(', ') || label.split(',')[0] || 'Unknown';
}

interface Props {
  onSelect: (lat: number, lng: number, label: string, areaName: string) => void;
}

export default function SearchBar({ onSelect }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '',
    libraries: LIBRARIES,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [value, setValue] = useState('');

  const initAutocomplete = useCallback(() => {
    if (!isLoaded || !inputRef.current || acRef.current) return;
    acRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['geometry', 'name', 'formatted_address'],
    });
    acRef.current.addListener('place_changed', () => {
      const place = acRef.current!.getPlace();
      if (!place.geometry?.location) return;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const label = place.formatted_address ?? place.name ?? 'Selected location';
      const areaName = extractAreaName(label);
      setValue(label);
      onSelect(lat, lng, label, areaName);
    });
  }, [isLoaded, onSelect]);

  useEffect(() => { initAutocomplete(); }, [initAutocomplete]);

  return (
    <div className="relative w-full">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none text-[var(--brand-muted)]">
        🔍
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search a street, place, or landmark…"
        className="w-full pl-9 pr-4 py-2 bg-[var(--brand-card)] border border-[var(--brand-border)] rounded-xl text-[var(--brand-text)] text-sm placeholder:text-[var(--brand-muted)] focus:outline-none focus:border-[var(--brand-accent)] transition-colors"
        disabled={!isLoaded}
      />
    </div>
  );
}
