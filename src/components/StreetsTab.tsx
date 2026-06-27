'use client';
import { useState, useCallback, useEffect } from 'react';
import type { VideoResult, PovType, TimeOfDay } from '@/lib/types';
import { POV_OPTIONS, TIME_OPTIONS } from '@/lib/types';
import { useFavorites } from '@/hooks/useFavorites';

interface Props {
  items: VideoResult[];
  loading: boolean;
  error: string | null;
  pov: PovType;
  time: TimeOfDay;
  onPovChange: (p: PovType) => void;
  onTimeChange: (t: TimeOfDay) => void;
  shareUrl?: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export default function StreetsTab({ items, loading, error, pov, time, onPovChange, onTimeChange, shareUrl }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'videos' | 'saved'>('videos');
  const { favorites, toggle, isFavorited } = useFavorites();

  const current = tab === 'videos' ? items[currentIndex] : favorites[currentIndex];
  const displayList = tab === 'videos' ? items : favorites;

  useEffect(() => {
    setCurrentIndex(0);
  }, [items, tab]);

  const advance = useCallback(() => {
    setCurrentIndex((i) => (displayList.length === 0 ? 0 : (i + 1) % displayList.length));
  }, [displayList.length]);

  useEffect(() => {
    if (!autoAdvance || displayList.length === 0) return;
    const timer = setInterval(advance, 60000);
    return () => clearInterval(timer);
  }, [autoAdvance, advance, displayList.length]);

  const handleShare = useCallback(async () => {
    const url = shareUrl ?? window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const videoUrl = current ? `https://www.youtube.com/embed/${current.id}?autoplay=1&rel=0` : null;

  return (
    <div className="flex flex-col gap-4">
      {/* POV filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {POV_OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => onPovChange(o.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              pov === o.id
                ? 'text-white shadow-md scale-105'
                : 'bg-[var(--brand-card)] text-[var(--brand-muted)] hover:bg-white/10'
            }`}
            style={pov === o.id ? { backgroundColor: o.color } : undefined}
          >
            {o.emoji} {o.label}
          </button>
        ))}
      </div>

      {/* Time filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {TIME_OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => onTimeChange(o.id)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs transition-all border ${
              time === o.id
                ? 'bg-[var(--brand-accent)] text-white border-[var(--brand-accent)]'
                : 'bg-transparent text-[var(--brand-muted)] border-white/20 hover:border-white/40'
            }`}
          >
            {o.emoji} {o.label}
          </button>
        ))}
      </div>

      {/* Tabs + controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-[var(--brand-card)] rounded-full p-1">
          <button
            onClick={() => setTab('videos')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              tab === 'videos' ? 'bg-[var(--brand-accent)] text-white' : 'text-[var(--brand-muted)]'
            }`}
          >
            🎥 Streets {items.length > 0 && <span className="ml-1 opacity-70">{items.length}</span>}
          </button>
          <button
            onClick={() => setTab('saved')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              tab === 'saved' ? 'bg-[var(--brand-accent)] text-white' : 'text-[var(--brand-muted)]'
            }`}
          >
            ❤️ Saved {favorites.length > 0 && <span className="ml-1 opacity-70">{favorites.length}</span>}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoAdvance((v) => !v)}
            title="Auto-advance every minute"
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              autoAdvance
                ? 'border-[var(--brand-accent)] text-[var(--brand-accent)]'
                : 'border-white/20 text-[var(--brand-muted)]'
            }`}
          >
            {autoAdvance ? '⏸' : '▶'} Auto
          </button>
          <button onClick={advance} className="text-xs px-2.5 py-1 rounded-full border border-white/20 text-[var(--brand-muted)] hover:border-white/40">
            ⏭ Next
          </button>
          <button onClick={handleShare} className="text-xs px-2.5 py-1 rounded-full border border-white/20 text-[var(--brand-muted)] hover:border-white/40">
            {copied ? '✅' : '🔗'}
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="animate-pulse space-y-3">
          <div className="aspect-video bg-white/10 rounded-xl" />
          <div className="h-3 bg-white/10 rounded w-3/4" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">{error}</div>
      )}

      {/* Video player */}
      {!loading && videoUrl && (
        <div className="rounded-xl overflow-hidden border border-[var(--brand-border)] bg-black aspect-video">
          <iframe
            key={videoUrl}
            src={videoUrl}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media"
            title={current?.title}
          />
        </div>
      )}

      {/* Empty state */}
      {!loading && displayList.length === 0 && !error && (
        <div className="text-center text-[var(--brand-muted)] text-sm py-8">
          <div className="text-3xl mb-2">{tab === 'saved' ? '🎞️' : '📹'}</div>
          {tab === 'saved' ? 'No saved videos yet — heart videos to save them' : 'No street footage found for this location'}
        </div>
      )}

      {/* Video list */}
      {!loading && displayList.length > 0 && (
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
          {displayList.map((v, i) => (
            <button
              key={v.id}
              onClick={() => setCurrentIndex(i)}
              className={`flex gap-3 p-2 rounded-xl text-left transition-all ${
                i === currentIndex
                  ? 'bg-[var(--brand-accent)]/20 border border-[var(--brand-accent)]/50'
                  : 'bg-[var(--brand-card)] border border-transparent hover:border-white/20'
              }`}
            >
              <img src={v.thumbnail} alt={v.title} className="w-20 h-12 object-cover rounded-lg flex-shrink-0 bg-white/10" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white line-clamp-2">{v.title}</p>
                <p className="text-[10px] text-[var(--brand-muted)] mt-0.5">{v.channelTitle} · {timeAgo(v.publishedAt)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggle(v); }}
                className={`text-base flex-shrink-0 self-center ${isFavorited(v.id) ? 'text-red-400' : 'text-[var(--brand-muted)] hover:text-red-400'}`}
              >
                {isFavorited(v.id) ? '❤️' : '🤍'}
              </button>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
