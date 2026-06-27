'use client';
import { useState, useCallback } from 'react';
import type { VideoResult, PovType, TimeOfDay } from '@/lib/types';

interface SearchOptions {
  lat: number;
  lng: number;
  label: string;
  pov?: PovType;
  time?: TimeOfDay;
  mode?: 'streets' | 'memory';
  yearFrom?: number;
  yearTo?: number;
}

interface YouTubeState {
  items: VideoResult[];
  loading: boolean;
  error: string | null;
  currentIndex: number;
}

export function useYouTubeSearch() {
  const [state, setState] = useState<YouTubeState>({
    items: [],
    loading: false,
    error: null,
    currentIndex: 0,
  });

  const search = useCallback(async (opts: SearchOptions) => {
    const {
      lat, lng, label,
      pov = 'all',
      time = 'all',
      mode = 'streets',
      yearFrom,
      yearTo,
    } = opts;

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        label,
        pov,
        time,
        mode,
      });
      if (yearFrom) params.set('yearFrom', yearFrom.toString());
      if (yearTo) params.set('yearTo', yearTo.toString());

      const res = await fetch(`/api/youtube?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch videos');
      setState({ items: data.items ?? [], loading: false, error: null, currentIndex: 0 });
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, []);

  const setIndex = useCallback((i: number) => {
    setState((s) => ({ ...s, currentIndex: Math.max(0, Math.min(i, s.items.length - 1)) }));
  }, []);

  const next = useCallback(() => {
    setState((s) => ({
      ...s,
      currentIndex: s.items.length === 0 ? 0 : (s.currentIndex + 1) % s.items.length,
    }));
  }, []);

  const clear = useCallback(() => {
    setState({ items: [], loading: false, error: null, currentIndex: 0 });
  }, []);

  return { ...state, search, setIndex, next, clear };
}
