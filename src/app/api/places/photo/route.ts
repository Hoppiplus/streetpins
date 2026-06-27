import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for Google Places (New) photo references.
 * New Places API photo names look like: places/ChIJ.../photos/AUacShh...
 * Endpoint: https://places.googleapis.com/v1/{photoName}/media
 */
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref');
  const maxwidth = req.nextUrl.searchParams.get('maxwidth') ?? '400';

  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Key not configured' }, { status: 500 });

  const url = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${maxwidth}&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return NextResponse.json({ error: 'Photo fetch failed' }, { status: res.status });

  const blob = await res.blob();
  return new NextResponse(blob, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
