'use client';
import { useState, useCallback } from 'react';
import type { Place, CategoryId } from '@/lib/types';

interface PlacesState {
  places: Place[];
  loading: boolean;
  error: string | null;
}

interface FetchOptions {
  lat: number;
  lng: number;
  radius?: number;
  category?: CategoryId;
}

export function usePlaces() {
  const [state, setState] = useState<PlacesState>({
    places: [],
    loading: false,
    error: null,
  });

  const fetchPlaces = useCallback(async (opts: FetchOptions) => {
    const { lat, lng, radius = 500, category = 'all' } = opts;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: radius.toString(),
        category,
      });
      const res = await fetch(`/api/places?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch places');
      setState({ places: data.places ?? [], loading: false, error: null });
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, []);

  const clear = useCallback(() => {
    setState({ places: [], loading: false, error: null });
  }, []);

  return { ...state, fetchPlaces, clear };
}
