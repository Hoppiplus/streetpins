'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { CategoryId, PovType, TimeOfDay, SearchState, PanelTab } from '@/lib/types';
import { usePlaces } from '@/hooks/usePlaces';
import { useYouTubeSearch } from '@/hooks/useYouTubeSearch';
import { useMemories } from '@/hooks/useMemories';
import SearchBar from '@/components/SearchBar';
import MainPanel from '@/components/MainPanel';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const DEFAULT_STATE: SearchState = {
  lat: -6.2088,
  lng: 106.8456,
  label: 'Jakarta, Indonesia',
  areaName: 'Jakarta',
  radiusMeters: 500,
};

function buildShareUrl(
  state: SearchState,
  tab: PanelTab,
  category: CategoryId,
  pov: PovType,
  time: TimeOfDay
): string {
  const p = new URLSearchParams({
    lat: state.lat.toString(),
    lng: state.lng.toString(),
    label: state.label,
    r: state.radiusMeters.toString(),
    tab,
    cat: category,
    pov,
    time,
  });
  return `${typeof window !== 'undefined' ? window.location.origin : ''}?${p.toString()}`;
}

export default function StreetPinsPage() {
  const [searchState, setSearchState] = useState<SearchState>(DEFAULT_STATE);
  const [tab, setTab] = useState<PanelTab>('streets');
  const [category, setCategory] = useState<CategoryId>('all');
  const [pov, setPov] = useState<PovType>('all');
  const [time, setTime] = useState<TimeOfDay>('all');
  const [shareUrl, setShareUrl] = useState('');
  const initialLoadDone = useRef(false);

  const { places, loading: placesLoading, error: placesError, fetchPlaces } = usePlaces();
  const { items: videos, loading: videosLoading, error: videosError, search: searchVideos } = useYouTubeSearch();
  const { memories } = useMemories();

  // ── URL state sync ──────────────────────────────────────────────────────
  useEffect(() => {
    const url = buildShareUrl(searchState, tab, category, pov, time);
    setShareUrl(url);
    window.history.replaceState({}, '', url);
  }, [searchState, tab, category, pov, time]);

  // ── Restore from URL on mount ─────────────────────────────────────────
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    const p = new URLSearchParams(window.location.search);
    const lat = parseFloat(p.get('lat') ?? '');
    const lng = parseFloat(p.get('lng') ?? '');
    const label = p.get('label');
    if (lat && lng && label) {
      const r = parseInt(p.get('r') ?? '500');
      const restored: SearchState = { lat, lng, label, areaName: label.split(',')[0], radiusMeters: r };
      setSearchState(restored);
      if (p.get('tab')) setTab(p.get('tab') as PanelTab);
      if (p.get('cat')) setCategory(p.get('cat') as CategoryId);
      if (p.get('pov')) setPov(p.get('pov') as PovType);
      if (p.get('time')) setTime(p.get('time') as TimeOfDay);
      triggerSearch(restored, p.get('cat') as CategoryId ?? 'all', p.get('pov') as PovType ?? 'all', p.get('time') as TimeOfDay ?? 'all');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Search triggers ───────────────────────────────────────────────────
  const triggerSearch = useCallback((state: SearchState, cat: CategoryId, p: PovType, t: TimeOfDay) => {
    fetchPlaces({ lat: state.lat, lng: state.lng, radius: state.radiusMeters, category: cat });
    searchVideos({ lat: state.lat, lng: state.lng, label: state.label, pov: p, time: t, mode: 'streets' });
  }, [fetchPlaces, searchVideos]);

  const handleSelect = useCallback((lat: number, lng: number, label: string, areaName: string) => {
    const next: SearchState = { lat, lng, label, areaName, radiusMeters: searchState.radiusMeters };
    setSearchState(next);
    triggerSearch(next, category, pov, time);
  }, [searchState.radiusMeters, category, pov, time, triggerSearch]);

  const handleMapClick = useCallback((lat: number, lng: number, label: string) => {
    const next: SearchState = { lat, lng, label, areaName: label.split(',')[0], radiusMeters: searchState.radiusMeters };
    setSearchState(next);
    triggerSearch(next, category, pov, time);
  }, [searchState.radiusMeters, category, pov, time, triggerSearch]);

  const handleCategoryChange = useCallback((cat: CategoryId) => {
    setCategory(cat);
    fetchPlaces({ lat: searchState.lat, lng: searchState.lng, radius: searchState.radiusMeters, category: cat });
  }, [searchState, fetchPlaces]);

  const handlePovChange = useCallback((p: PovType) => {
    setPov(p);
    searchVideos({ lat: searchState.lat, lng: searchState.lng, label: searchState.label, pov: p, time, mode: 'streets' });
  }, [searchState, time, searchVideos]);

  const handleTimeChange = useCallback((t: TimeOfDay) => {
    setTime(t);
    searchVideos({ lat: searchState.lat, lng: searchState.lng, label: searchState.label, pov, time: t, mode: 'streets' });
  }, [searchState, pov, searchVideos]);

  return (
    <div className="flex flex-col h-screen bg-[var(--brand-bg)] overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 z-20 flex items-center gap-3 px-4 py-3 bg-[var(--brand-bg)]/90 backdrop-blur border-b border-[var(--brand-border)]">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xl">📍</span>
          <span className="font-bold text-white text-lg leading-none">
            Street<span className="text-[var(--brand-accent)]">Pins</span>
          </span>
        </div>
        <div className="flex-1">
          <SearchBar onSelect={handleSelect} />
        </div>
        <a
          href="https://ko-fi.com/chichihere"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition-all whitespace-nowrap"
        >
          ☕ Support
        </a>
      </header>

      {/* Body: map + panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative min-w-0">
          <MapView
            lat={searchState.lat}
            lng={searchState.lng}
            radius={searchState.radiusMeters}
            places={places}
            memories={memories}
            onClick={handleMapClick}
          />

          {/* Current location badge */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full border border-white/10 max-w-xs truncate">
              📍 {searchState.label}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <aside className="w-[380px] flex-shrink-0 bg-[var(--brand-bg)] border-l border-[var(--brand-border)] overflow-hidden flex flex-col p-4">
          <MainPanel
            tab={tab}
            onTabChange={setTab}
            searchState={searchState}
            places={places}
            placesLoading={placesLoading}
            placesError={placesError}
            category={category}
            onCategoryChange={handleCategoryChange}
            videos={videos}
            videosLoading={videosLoading}
            videosError={videosError}
            pov={pov}
            time={time}
            onPovChange={handlePovChange}
            onTimeChange={handleTimeChange}
            shareUrl={shareUrl}
          />
        </aside>
      </div>
    </div>
  );
}
