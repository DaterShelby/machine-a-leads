import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/satellite?lat=49.058&lon=2.163&zoom=19
 * Proxy vers Google Maps Static API — retourne l'URL de l'image satellite
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const zoom = searchParams.get('zoom') || '19';
    const size = searchParams.get('size') || '640x640';

    if (!lat || !lon) {
      return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    // Construire l'URL Google Maps Static
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=${zoom}&size=${size}&maptype=satellite&key=${apiKey}`;

    // Fetch l'image
    const response = await fetch(mapUrl);
    if (!response.ok) {
      return NextResponse.json({ error: `Google Maps error: ${response.status}` }, { status: 502 });
    }

    const imageBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      image_base64: base64,
      content_type: response.headers.get('content-type') || 'image/png',
      size_bytes: imageBuffer.byteLength,
      params: { lat, lon, zoom, size },
    });
  } catch (error) {
    console.error('Satellite API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
