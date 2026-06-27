import { NextRequest, NextResponse } from 'next/server';
import type { Place, CategoryId } from '@/lib/types';
import { CATEGORIES, inferMoodTags } from '@/lib/types';

const PLACES_BASE = 'https://places.googleapis.com/v1/places:searchNearby';

const PRICE_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

function categoryForTypes(types: string[]): CategoryId {
  const t = new Set(types);
  if (t.has('lodging') || t.has('hotel') || t.has('motel') || t.has('hostel')) return 'hotels';
  if (t.has('bar') || t.has('night_club')) return 'drinks';
  if (t.has('shopping_mall') || t.has('clothing_store') || t.has('store')) return 'shopping';
  if (t.has('movie_theater') || t.has('amusement_park') || t.has('tourist_attraction') || t.has('museum')) return 'entertainment';
  if (t.has('cafe')) return 'drinks';
  if (t.has('restaurant') || t.has('food') || t.has('bakery') || t.has('meal_takeaway')) return 'food';
  return 'all';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') ?? '500';
  const category = (searchParams.get('category') ?? 'all') as CategoryId;

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Places API key not configured' }, { status: 500 });
  }

  const cat = CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0];
  const includedTypes = category === 'all'
    ? ['restaurant', 'cafe', 'bar', 'tourist_attraction', 'shopping_mall']
    : cat.placeTypes;

  const body = {
    includedTypes,
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
        radius: Math.min(parseFloat(radius), 1500),
      },
    },
  };

  const FIELD_MASK = [
    'places.id',
    'places.displayName',
    'places.location',
    'places.rating',
    'places.userRatingCount',
    'places.priceLevel',
    'places.types',
    'places.photos',
    'places.currentOpeningHours',
    'places.shortFormattedAddress',
    'places.formattedAddress',
  ].join(',');

  try {
    const res = await fetch(PLACES_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(body),
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: 'Places API error', detail: err }, { status: res.status });
    }

    const data = await res.json();

    const places: Place[] = (data.places ?? []).map((r: any) => {
      const types: string[] = r.types ?? [];
      return {
        id: r.id,
        name: r.displayName?.text ?? 'Unknown',
        vicinity: r.shortFormattedAddress ?? r.formattedAddress ?? '',
        rating: r.rating ?? 0,
        userRatingsTotal: r.userRatingCount ?? 0,
        priceLevel: r.priceLevel ? PRICE_MAP[r.priceLevel] : undefined,
        types,
        photoRef: r.photos?.[0]?.name ?? null,
        openNow: r.currentOpeningHours?.openNow,
        lat: r.location.latitude,
        lng: r.location.longitude,
        category: categoryForTypes(types),
        moodTags: inferMoodTags(types),
      };
    }).sort((a: Place, b: Place) => {
      const score = (p: Place) => p.rating * Math.log(p.userRatingsTotal + 1);
      return score(b) - score(a);
    });

    return NextResponse.json({ places });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
