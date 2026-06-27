import { NextRequest, NextResponse } from 'next/server';
import type { PovType, TimeOfDay, VideoResult } from '@/lib/types';
import { POV_OPTIONS, TIME_OPTIONS } from '@/lib/types';

const YT_BASE = 'https://www.googleapis.com/youtube/v3';

// ─── POV inference ────────────────────────────────────────────────────────

function inferPov(title: string, description: string): PovType {
  const text = (title + ' ' + description).toLowerCase();
  if (/dashcam|driving|drive through|car pov|berkendara/.test(text)) return 'car';
  if (/motorbike|motorcycle|scooter|ojek|naik motor/.test(text)) return 'motorbike';
  if (/walking|walk through|jalan-jalan|pedestrian|street walk|berjalan/.test(text)) return 'walking';
  if (/krl|commuter line|kereta/.test(text)) return 'train';
  if (/\bmrt\b|lrt jakarta|metro|subway/.test(text)) return 'mrt';
  return 'walking';
}

// ─── Area name extraction ─────────────────────────────────────────────────

function extractAreaName(label: string): string {
  if (!label) return 'Jakarta';
  const parts = label.split(',').map((s) => s.trim()).filter((s) => s.length > 1);
  const SKIP_EXACT = new Set([
    'indonesia', 'dki jakarta', 'jawa barat', 'jawa tengah', 'jawa timur',
    'banten', 'bali', 'sumatera utara', 'sulawesi selatan',
  ]);
  const STANDALONE_POSTAL = /^\d{5}$/;
  const RT_RW = /^rt\.?\s*\d+\s*\/\s*rw\.?\s*\d+/i;
  const EMBEDDED_POSTAL = /\b\d{5}\b/;
  const PROVINCE_PREFIX = /^(daerah|provinsi|prov\.|d\.i\.)/i;
  const STREET_PREFIX = /^(jl\.|jalan\s|no\.|gang\s|gg\.)/i;

  const meaningful = parts
    .filter((p) => {
      const low = p.toLowerCase();
      return (
        !SKIP_EXACT.has(low) &&
        !STANDALONE_POSTAL.test(p) &&
        !RT_RW.test(p) &&
        !EMBEDDED_POSTAL.test(p) &&
        !PROVINCE_PREFIX.test(p) &&
        p.length < 60
      );
    })
    .map((p) => p.replace(/^kota\s+/i, '').trim());

  const start = meaningful[0] && STREET_PREFIX.test(meaningful[0]) ? 1 : 0;
  return meaningful.slice(start, start + 3).join(' ') || 'Jakarta';
}

// ─── Query builder ─────────────────────────────────────────────────────────

function buildQuery(
  areaName: string,
  povOption: typeof POV_OPTIONS[0],
  timeOption: typeof TIME_OPTIONS[0],
  mode: string
): string {
  if (mode === 'memory') {
    // Memory Walk: nostalgia footage, not strict POV
    return `${areaName} street footage tour`;
  }
  const povSignal = povOption.id === 'all'
    ? 'POV street walking tour OR dashcam'
    : (povOption.keywords[0] ?? 'street');
  const timePart = timeOption.keywords[0] ?? '';
  return [areaName, povSignal, timePart].filter(Boolean).join(' ');
}

// ─── Main handler ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const label = searchParams.get('label') ?? '';
  const pov = (searchParams.get('pov') ?? 'all') as PovType;
  const time = (searchParams.get('time') ?? 'all') as TimeOfDay;
  const mode = searchParams.get('mode') ?? 'streets'; // 'streets' | 'memory'

  // Year range for Memory Walk (maps to publishedAfter / publishedBefore)
  const yearFrom = searchParams.get('yearFrom');
  const yearTo = searchParams.get('yearTo');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
  }

  const povOption = POV_OPTIONS.find((p) => p.id === pov) ?? POV_OPTIONS[0];
  const timeOption = TIME_OPTIONS.find((t) => t.id === time) ?? TIME_OPTIONS[0];

  const areaName = extractAreaName(label);
  const query = buildQuery(areaName, povOption, timeOption, mode);

  console.log('[youtube] mode:', mode, '| query:', query, '| years:', yearFrom, '-', yearTo);

  const params: Record<string, string> = {
    part: 'snippet',
    type: 'video',
    q: query,
    maxResults: '20',
    order: mode === 'memory' ? 'date' : 'relevance',
    videoEmbeddable: 'true',
    videoDuration: 'any',
    relevanceLanguage: 'id',
    key: apiKey,
  };

  // Add year-range filters for Memory Walk
  if (yearFrom) {
    params.publishedAfter = `${yearFrom}-01-01T00:00:00Z`;
  }
  if (yearTo) {
    params.publishedBefore = `${yearTo}-12-31T23:59:59Z`;
  }

  const searchUrl = `${YT_BASE}/search?${new URLSearchParams(params)}`;

  try {
    const searchRes = await fetch(searchUrl, { next: { revalidate: 300 } });
    if (!searchRes.ok) {
      const err = await searchRes.json();
      console.error('YouTube API error:', err);
      return NextResponse.json({ error: 'YouTube search failed', detail: err }, { status: searchRes.status });
    }

    const searchData = await searchRes.json();

    const POV_MUST_MATCH =
      /pov|walking|walk|dashcam|drive|driving|motorbike|motorcycle|ojek|scooter|krl|mrt|lrt|jalan-jalan|tour|street|riding|naik|berkendara|first.?person/i;

    const mapItem = (item: any): VideoResult => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnail:
        item.snippet.thumbnails?.medium?.url ??
        item.snippet.thumbnails?.default?.url ??
        '',
      description: item.snippet.description ?? '',
      povType: inferPov(item.snippet.title, item.snippet.description ?? ''),
      publishedYear: item.snippet.publishedAt
        ? new Date(item.snippet.publishedAt).getFullYear()
        : undefined,
    });

    let items: VideoResult[];

    if (mode === 'memory') {
      // Memory Walk: no strict POV filter, include all relevant footage
      items = (searchData.items ?? []).map(mapItem);
    } else {
      // Streets mode: filter for POV / street content
      items = (searchData.items ?? [])
        .filter((item: any) => {
          const title = item.snippet.title ?? '';
          const desc = item.snippet.description ?? '';
          return POV_MUST_MATCH.test(title) || POV_MUST_MATCH.test(desc);
        })
        .map(mapItem);

      // Fall back to unfiltered if strict filter removed everything
      if (items.length === 0) {
        items = (searchData.items ?? []).map(mapItem);
      }
    }

    return NextResponse.json({ items, totalResults: items.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
