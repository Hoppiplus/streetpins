'use client';
import { useState, useCallback, useEffect } from 'react';
import type { VideoResult } from '@/lib/types';

const STORAGE_KEY = 'streetpins_favorites';

function load(): VideoResult[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<VideoResult[]>([]);

  useEffect(() => {
    setFavorites(load());
  }, []);

  const toggle = useCallback((video: VideoResult) => {
    setFavorites((prev) => {
      const exists = prev.some((v) => v.id === video.id);
      const next = exists ? prev.filter((v) => v.id !== video.id) : [video, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorited = useCallback((id: string) => {
    return favorites.some((v) => v.id === id);
  }, [favorites]);

  return { favorites, toggle, isFavorited };
}
