'use client';
import { useCallback, useEffect, useRef } from 'react';
import { GoogleMap, Marker, Circle, useJsApiLoader } from '@react-google-maps/api';
import type { Place, MemoryPin } from '@/lib/types';

interface Props {
  lat: number;
  lng: number;
  radius?: number;
  places?: Place[];
  memories?: MemoryPin[];
  onClick?: (lat: number, lng: number, label: string) => void;
}

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: 'greedy',
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#a0a0b0' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d44' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212136' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f0f1e' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#222236' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3d4a' }] },
  ],
};

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍜',
  drinks: '🧋',
  entertainment: '🎭',
  shopping: '🛍️',
  hotels: '🏨',
  all: '📍',
};

export default function MapView({ lat, lng, radius = 500, places = [], memories = [], onClick }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '',
    libraries: ['places'],
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
    }
  }, [lat, lng]);

  const handleMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng || !onClick) return;
      const clickLat = e.latLng.lat();
      const clickLng = e.latLng.lng();
      try {
        const geocoder = new google.maps.Geocoder();
        const result = await geocoder.geocode({ location: { lat: clickLat, lng: clickLng } });
        const label = result.results[0]?.formatted_address ?? `${clickLat.toFixed(5)}, ${clickLng.toFixed(5)}`;
        onClick(clickLat, clickLng, label);
      } catch {
        onClick(clickLat, clickLng, `${clickLat.toFixed(5)}, ${clickLng.toFixed(5)}`);
      }
    },
    [onClick]
  );

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#1a1a2e] text-[var(--brand-muted)] text-sm">
        Loading map…
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerClassName="w-full h-full"
      center={{ lat, lng }}
      zoom={16}
      options={MAP_OPTIONS}
      onLoad={onLoad}
      onClick={handleMapClick}
    >
      {/* Search radius circle */}
      <Circle
        center={{ lat, lng }}
        radius={radius}
        options={{
          strokeColor: '#7c6aff',
          strokeOpacity: 0.4,
          strokeWeight: 1.5,
          fillColor: '#7c6aff',
          fillOpacity: 0.06,
        }}
      />

      {/* Center pin */}
      <Marker
        position={{ lat, lng }}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#7c6aff',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        }}
      />

      {/* Place markers */}
      {places.map((place) => (
        <Marker
          key={place.id}
          position={{ lat: place.lat, lng: place.lng }}
          label={{
            text: CATEGORY_ICONS[place.category] ?? '📍',
            fontSize: '16px',
          }}
          title={`${place.name}\n★ ${place.rating}`}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 0,
          }}
        />
      ))}

      {/* Memory markers */}
      {memories.map((pin) => (
        <Marker
          key={pin.id}
          position={{ lat: pin.lat, lng: pin.lng }}
          label={{
            text: '🗺️',
            fontSize: '18px',
          }}
          title={`Memory: ${pin.areaName} (${pin.visitedYear})`}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 0,
          }}
        />
      ))}
    </GoogleMap>
  );
}
