'use client';
import { useState, useCallback } from 'react';
import type { MemoryPin, VideoResult, SearchState } from '@/lib/types';
import { useMemories } from '@/hooks/useMemories';
import { useYouTubeSearch } from '@/hooks/useYouTubeSearch';

interface Props {
  searchState: SearchState | null;
}

type MemoryMode = 'list' | 'add' | 'walk';

const CURRENT_YEAR = new Date().getFullYear();

function YearsAgo({ year }: { year: number }) {
  const diff = CURRENT_YEAR - year;
  if (diff === 0) return <span className="text-green-400 text-xs">This year</span>;
  if (diff === 1) return <span className="text-yellow-400 text-xs">Last year</span>;
  return <span className="text-[var(--brand-muted)] text-xs">{diff} years ago</span>;
}

export default function MemoriesTab({ searchState }: Props) {
  const { memories, addMemory, removeMemory } = useMemories();
  const { items: memoryVideos, loading: walkLoading, search: searchWalk } = useYouTubeSearch();

  const [mode, setMode] = useState<MemoryMode>('list');
  const [formYear, setFormYear] = useState(CURRENT_YEAR - 2);
  const [formNote, setFormNote] = useState('');
  const [walkYear, setWalkYear] = useState<number>(CURRENT_YEAR - 5);
  const [walkYearTo, setWalkYearTo] = useState<number>(CURRENT_YEAR - 3);
  const [activeWalkVideo, setActiveWalkVideo] = useState<VideoResult | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<MemoryPin | null>(null);

  // ── Add Memory ─────────────────────────────────────────────────────────
  const handleAdd = useCallback(() => {
    if (!searchState) return;
    addMemory({
      lat: searchState.lat,
      lng: searchState.lng,
      label: searchState.label,
      areaName: searchState.areaName,
      visitedYear: formYear,
      note: formNote,
    });
    setFormNote('');
    setMode('list');
  }, [searchState, formYear, formNote, addMemory]);

  // ── Memory Walk ────────────────────────────────────────────────────────
  const handleStartWalk = useCallback((pin: MemoryPin) => {
    setSelectedMemory(pin);
    setWalkYear(pin.visitedYear - 1 < 2005 ? 2005 : pin.visitedYear - 1);
    setWalkYearTo(pin.visitedYear + 1 > CURRENT_YEAR ? CURRENT_YEAR : pin.visitedYear + 1);
    setMode('walk');
    setActiveWalkVideo(null);
    searchWalk({
      lat: pin.lat,
      lng: pin.lng,
      label: pin.label,
      mode: 'memory',
      yearFrom: pin.visitedYear - 1,
      yearTo: pin.visitedYear + 1,
    });
  }, [searchWalk]);

  const handleWalkSearch = useCallback(() => {
    if (!selectedMemory) return;
    setActiveWalkVideo(null);
    searchWalk({
      lat: selectedMemory.lat,
      lng: selectedMemory.lng,
      label: selectedMemory.label,
      mode: 'memory',
      yearFrom: walkYear,
      yearTo: walkYearTo,
    });
  }, [selectedMemory, walkYear, walkYearTo, searchWalk]);

  // ─────────────────────────────────────────────────────────────────────

  const locationMemories = searchState
    ? memories.filter((m) => {
        const dx = (m.lat - searchState.lat) * 111;
        const dy = (m.lng - searchState.lng) * 111 * Math.cos((searchState.lat * Math.PI) / 180);
        return Math.sqrt(dx * dx + dy * dy) < 1;
      })
    : [];

  // ── Memory Walk view ──────────────────────────────────────────────────
  if (mode === 'walk' && selectedMemory) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setMode('list')} className="text-[var(--brand-muted)] hover:text-white text-sm">
            ← Back
          </button>
          <div>
            <p className="text-sm font-semibold text-white">Memory Walk</p>
            <p className="text-xs text-[var(--brand-muted)] truncate">{selectedMemory.areaName}</p>
          </div>
        </div>

        {/* Year range slider */}
        <div className="bg-[var(--brand-card)] border border-[var(--brand-border)] rounded-xl p-4 flex flex-col gap-3">
          <p className="text-xs text-[var(--brand-muted)] font-medium">
            Travel back to footage from this era
          </p>
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] text-[var(--brand-muted)]">From year</label>
              <input
                type="number"
                min={2005}
                max={CURRENT_YEAR}
                value={walkYear}
                onChange={(e) => setWalkYear(Number(e.target.value))}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white w-full"
              />
            </div>
            <span className="text-[var(--brand-muted)] text-xs mt-4">→</span>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] text-[var(--brand-muted)]">To year</label>
              <input
                type="number"
                min={2005}
                max={CURRENT_YEAR}
                value={walkYearTo}
                onChange={(e) => setWalkYearTo(Number(e.target.value))}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white w-full"
              />
            </div>
          </div>
          <button
            onClick={handleWalkSearch}
            className="w-full py-2 rounded-xl bg-[var(--brand-accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            🕰️ Find footage from this era
          </button>
        </div>

        {/* Active video */}
        {activeWalkVideo && (
          <div className="rounded-xl overflow-hidden border border-[var(--brand-border)] bg-black aspect-video">
            <iframe
              key={activeWalkVideo.id}
              src={`https://www.youtube.com/embed/${activeWalkVideo.id}?autoplay=1&rel=0`}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; encrypted-media"
              title={activeWalkVideo.title}
            />
          </div>
        )}

        {/* Walk results */}
        {walkLoading && (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-white/10 rounded-xl" />
            ))}
          </div>
        )}

        {!walkLoading && memoryVideos.length === 0 && (
          <div className="text-center text-[var(--brand-muted)] text-sm py-6">
            <div className="text-3xl mb-2">📽️</div>
            No footage found for this era
            <p className="text-xs mt-1">Try a wider year range</p>
          </div>
        )}

        {!walkLoading && memoryVideos.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-[var(--brand-muted)]">
              {memoryVideos.length} clip{memoryVideos.length !== 1 ? 's' : ''} found
            </p>
            {memoryVideos.map((v) => (
              <button
                key={v.id}
                onClick={() => setActiveWalkVideo(v)}
                className={`flex gap-3 p-2 rounded-xl text-left border transition-all ${
                  activeWalkVideo?.id === v.id
                    ? 'bg-[var(--brand-accent)]/20 border-[var(--brand-accent)]/50'
                    : 'bg-[var(--brand-card)] border-transparent hover:border-white/20'
                }`}
              >
                <img src={v.thumbnail} alt={v.title} className="w-20 h-12 object-cover rounded-lg flex-shrink-0 bg-white/10" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white line-clamp-2">{v.title}</p>
                  <p className="text-[10px] text-[var(--brand-muted)] mt-0.5">
                    {v.channelTitle}
                    {v.publishedYear && <span className="ml-2 text-[var(--brand-accent)]">📅 {v.publishedYear}</span>}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Ko-fi support prompt */}
        <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/20 border border-amber-500/20 rounded-xl p-4 text-center">
          <p className="text-sm text-amber-200 font-medium">Enjoying Memory Walk?</p>
          <p className="text-xs text-amber-300/70 mt-1 mb-3">Help keep StreetPins free ☕</p>
          <a
            href="https://ko-fi.com/chichihere"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            ☕ Buy me a coffee
          </a>
        </div>
      </div>
    );
  }

  // ── Add Memory form ───────────────────────────────────────────────────
  if (mode === 'add') {
    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => setMode('list')} className="text-[var(--brand-muted)] hover:text-white text-sm self-start">
          ← Back
        </button>

        <div className="bg-[var(--brand-card)] border border-[var(--brand-border)] rounded-xl p-4 flex flex-col gap-4">
          <div>
            <p className="text-white font-semibold text-sm">📍 I was here</p>
            <p className="text-[var(--brand-muted)] text-xs mt-0.5 truncate">{searchState?.label ?? 'Unknown location'}</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--brand-muted)]">Year I visited</label>
            <input
              type="number"
              min={1990}
              max={CURRENT_YEAR}
              value={formYear}
              onChange={(e) => setFormYear(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--brand-muted)]">A note (optional)</label>
            <textarea
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder="What do you remember about this place?"
              rows={3}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm resize-none placeholder:text-white/20"
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={!searchState}
            className="w-full py-2.5 rounded-xl bg-[var(--brand-accent)] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all"
          >
            📌 Pin this memory
          </button>
        </div>
      </div>
    );
  }

  // ── Memory list ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-semibold text-sm">Your memories</p>
          <p className="text-xs text-[var(--brand-muted)]">{memories.length} place{memories.length !== 1 ? 's' : ''} you've been</p>
        </div>
        <button
          onClick={() => setMode('add')}
          disabled={!searchState}
          title={!searchState ? 'Search a location first' : 'Mark this location as visited'}
          className="px-3 py-1.5 rounded-xl bg-[var(--brand-accent)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
        >
          + I was here
        </button>
      </div>

      {/* Nearby memories callout */}
      {locationMemories.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-3">
          <p className="text-amber-300 text-xs font-medium">
            📍 You have {locationMemories.length} memory near here
          </p>
        </div>
      )}

      {memories.length === 0 && (
        <div className="text-center py-10">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-white font-medium text-sm">No memories yet</p>
          <p className="text-[var(--brand-muted)] text-xs mt-1">
            Search a place you've visited and tap "I was here"
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {memories.map((pin) => (
          <div
            key={pin.id}
            className="bg-[var(--brand-card)] border border-[var(--brand-border)] rounded-xl p-4 hover:border-[var(--brand-accent)]/40 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{pin.areaName}</p>
                <p className="text-[var(--brand-muted)] text-xs truncate mt-0.5">{pin.label}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[var(--brand-accent)] text-xs font-medium">🗓 {pin.visitedYear}</span>
                  <YearsAgo year={pin.visitedYear} />
                </div>
                {pin.note && (
                  <p className="text-[var(--brand-muted)] text-xs mt-2 italic line-clamp-2">"{pin.note}"</p>
                )}
              </div>
              <button
                onClick={() => removeMemory(pin.id)}
                className="text-white/20 hover:text-red-400 text-xs transition-colors flex-shrink-0"
                title="Remove memory"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleStartWalk(pin)}
                className="flex-1 py-2 rounded-xl bg-[var(--brand-accent)]/20 border border-[var(--brand-accent)]/30 text-[var(--brand-accent)] text-xs font-semibold hover:bg-[var(--brand-accent)]/30 transition-all"
              >
                🕰️ Memory Walk
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
