'use client';
import type { PanelTab, CategoryId, PovType, TimeOfDay, SearchState, Place } from '@/lib/types';
import PlacesTab from './PlacesTab';
import StreetsTab from './StreetsTab';
import MemoriesTab from './MemoriesTab';
import AmbientMixer from './AmbientMixer';
import type { VideoResult } from '@/lib/types';

interface Props {
  tab: PanelTab;
  onTabChange: (t: PanelTab) => void;
  searchState: SearchState | null;
  // Places
  places: Place[];
  placesLoading: boolean;
  placesError: string | null;
  category: CategoryId;
  onCategoryChange: (c: CategoryId) => void;
  // Streets / Videos
  videos: VideoResult[];
  videosLoading: boolean;
  videosError: string | null;
  pov: PovType;
  time: TimeOfDay;
  onPovChange: (p: PovType) => void;
  onTimeChange: (t: TimeOfDay) => void;
  shareUrl?: string;
}

const TABS: { id: PanelTab; label: string; emoji: string }[] = [
  { id: 'places', label: 'Places', emoji: '📍' },
  { id: 'streets', label: 'Streets', emoji: '🎥' },
  { id: 'memories', label: 'Memories', emoji: '🗺️' },
];

export default function MainPanel({
  tab,
  onTabChange,
  searchState,
  places, placesLoading, placesError, category, onCategoryChange,
  videos, videosLoading, videosError, pov, time, onPovChange, onTimeChange,
  shareUrl,
}: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex gap-1 bg-[var(--brand-card)] rounded-2xl p-1 mb-4 border border-[var(--brand-border)]">
        {TABS.map((t) => {
          const count = t.id === 'places' ? places.length : t.id === 'streets' ? videos.length : undefined;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-[var(--brand-accent)] text-white shadow-md'
                  : 'text-[var(--brand-muted)] hover:text-white'
              }`}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
              {count !== undefined && count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab === t.id ? 'bg-white/20' : 'bg-white/10'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-1">
        {tab === 'places' && (
          <PlacesTab
            places={places}
            loading={placesLoading}
            error={placesError}
            category={category}
            onCategoryChange={onCategoryChange}
          />
        )}

        {tab === 'streets' && (
          <>
            <StreetsTab
              items={videos}
              loading={videosLoading}
              error={videosError}
              pov={pov}
              time={time}
              onPovChange={onPovChange}
              onTimeChange={onTimeChange}
              shareUrl={shareUrl}
            />
            <div className="mt-4">
              <AmbientMixer />
            </div>
          </>
        )}

        {tab === 'memories' && (
          <MemoriesTab searchState={searchState} />
        )}
      </div>
    </div>
  );
}
