'use client';
import { useState, useMemo } from 'react';
import type { Place, CategoryId, MoodTag } from '@/lib/types';
import { CATEGORIES, MOOD_TAGS } from '@/lib/types';

interface Props {
  places: Place[];
  loading: boolean;
  error: string | null;
  category: CategoryId;
  onCategoryChange: (c: CategoryId) => void;
}

const PRICE_ICONS = ['', '$', '$$', '$$$', '$$$$'];

function heatScore(p: Place) {
  return p.rating * Math.log(p.userRatingsTotal + 1);
}

function StarBar({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="text-yellow-400 text-xs">
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(Math.max(0, 5 - full - (half ? 1 : 0)))}
    </span>
  );
}

export default function PlacesTab({ places, loading, error, category, onCategoryChange }: Props) {
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'heat' | 'reviews' | 'price'>('heat');
  const [activeMood, setActiveMood] = useState<MoodTag | null>(null);

  const displayedPlaces = useMemo(() => {
    return places
      .filter((p) => !openNowOnly || p.openNow === true)
      .filter((p) => minRating === 0 || p.rating >= minRating)
      .filter((p) => !activeMood || (p.moodTags ?? []).includes(activeMood))
      .sort((a, b) => {
        if (sortBy === 'reviews') return b.userRatingsTotal - a.userRatingsTotal;
        if (sortBy === 'price') return (a.priceLevel ?? 99) - (b.priceLevel ?? 99);
        return heatScore(b) - heatScore(a);
      });
  }, [places, openNowOnly, minRating, sortBy, activeMood]);

  const moodCounts = useMemo(() => {
    const counts: Partial<Record<MoodTag, number>> = {};
    places.forEach((p) => (p.moodTags ?? []).forEach((t) => { counts[t] = (counts[t] ?? 0) + 1; }));
    return counts;
  }, [places]);

  return (
    <div className="flex flex-col gap-3">
      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => onCategoryChange(c.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              category === c.id
                ? 'text-white shadow-lg scale-105'
                : 'bg-[var(--brand-card)] text-[var(--brand-muted)] hover:bg-white/10'
            }`}
            style={category === c.id ? { backgroundColor: c.color } : undefined}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Mood tag row */}
      {Object.keys(moodCounts).length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(Object.entries(moodCounts) as [MoodTag, number][]).map(([tag, count]) => (
            <button
              key={tag}
              onClick={() => setActiveMood(activeMood === tag ? null : tag)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs transition-all border ${
                activeMood === tag
                  ? 'bg-[var(--brand-accent)] text-white border-[var(--brand-accent)]'
                  : 'bg-transparent text-[var(--brand-muted)] border-white/20 hover:border-white/40'
              }`}
            >
              {MOOD_TAGS[tag].emoji} {MOOD_TAGS[tag].label}
              <span className="ml-1 opacity-60">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <button
          onClick={() => setOpenNowOnly((v) => !v)}
          className={`px-3 py-1.5 rounded-full font-medium transition-all ${
            openNowOnly ? 'bg-green-500 text-white' : 'bg-[var(--brand-card)] text-[var(--brand-muted)]'
          }`}
        >
          🟢 Open now
        </button>
        <button
          onClick={() => setMinRating(minRating === 0 ? 4.0 : 0)}
          className={`px-3 py-1.5 rounded-full font-medium transition-all ${
            minRating > 0
              ? 'bg-yellow-500 text-black'
              : 'bg-[var(--brand-card)] text-[var(--brand-muted)]'
          }`}
        >
          ★ 4.0+
        </button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="ml-auto bg-[var(--brand-card)] text-[var(--brand-muted)] rounded-full px-3 py-1.5 text-xs outline-none cursor-pointer"
        >
          <option value="heat">🔥 Trending</option>
          <option value="reviews">📊 Most reviewed</option>
          <option value="price">💰 Cheapest first</option>
        </select>
      </div>

      {/* Result count */}
      <p className="text-[var(--brand-muted)] text-xs">
        {loading ? 'Finding places…' : `${displayedPlaces.length} place${displayedPlaces.length !== 1 ? 's' : ''}`}
      </p>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Skeleton loader */}
      {loading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-[var(--brand-card)] rounded-xl p-3 animate-pulse flex gap-3">
              <div className="w-16 h-16 rounded-lg bg-white/10 flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-white/10 rounded w-3/4" />
                <div className="h-2 bg-white/10 rounded w-1/2" />
                <div className="h-2 bg-white/10 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Place cards */}
      {!loading && (
        <div className="flex flex-col gap-3">
          {displayedPlaces.length === 0 && !error && (
            <div className="text-center text-[var(--brand-muted)] text-sm py-8">
              <div className="text-3xl mb-2">🏙️</div>
              No places found
              {(openNowOnly || minRating > 0 || activeMood) && (
                <div className="mt-2 flex gap-2 justify-center flex-wrap">
                  {openNowOnly && (
                    <button onClick={() => setOpenNowOnly(false)} className="text-xs text-blue-400 underline">
                      Remove "Open now"
                    </button>
                  )}
                  {minRating > 0 && (
                    <button onClick={() => setMinRating(0)} className="text-xs text-blue-400 underline">
                      Remove rating filter
                    </button>
                  )}
                  {activeMood && (
                    <button onClick={() => setActiveMood(null)} className="text-xs text-blue-400 underline">
                      Remove mood filter
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {displayedPlaces.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlaceCard({ place }: { place: Place }) {
  return (
    <div className="bg-[var(--brand-card)] border border-[var(--brand-border)] rounded-xl p-3 flex gap-3 hover:border-[var(--brand-accent)]/50 transition-all">
      {/* Photo */}
      {place.photoRef ? (
        <img
          src={`/api/places/photo?ref=${encodeURIComponent(place.photoRef)}&maxwidth=128`}
          alt={place.name}
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-white/10"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-white/10 flex-shrink-0 flex items-center justify-center text-2xl">
          🏢
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className="font-semibold text-sm text-white truncate">{place.name}</p>
          {place.openNow !== undefined && (
            <span className={`text-[10px] font-medium flex-shrink-0 px-1.5 py-0.5 rounded-full ${
              place.openNow ? 'bg-green-900/50 text-green-400' : 'bg-red-900/30 text-red-400'
            }`}>
              {place.openNow ? 'Open' : 'Closed'}
            </span>
          )}
        </div>

        <p className="text-[var(--brand-muted)] text-xs truncate mt-0.5">{place.vicinity}</p>

        <div className="flex items-center gap-2 mt-1.5">
          <StarBar rating={place.rating} />
          <span className="text-[var(--brand-muted)] text-[11px]">
            {place.rating.toFixed(1)} ({place.userRatingsTotal.toLocaleString()})
          </span>
          {place.priceLevel !== undefined && (
            <span className="text-[var(--brand-gold)] text-xs ml-auto">
              {PRICE_ICONS[place.priceLevel] || ''}
            </span>
          )}
        </div>

        {/* Mood tags */}
        {(place.moodTags ?? []).length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {(place.moodTags ?? []).map((tag) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-[var(--brand-muted)]">
                {MOOD_TAGS[tag].emoji} {MOOD_TAGS[tag].label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
