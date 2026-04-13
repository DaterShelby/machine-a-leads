import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/generate-pool
 * Body: { image_base64: string }
 * Envoie l'image satellite à Stability AI pour ajouter une piscine via inpainting
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image_base64 } = body;

    if (!image_base64) {
      return NextResponse.json({ error: 'image_base64 is required' }, { status: 400 });
    }

    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Stability AI API key not configured' }, { status: 500 });
    }

    // Convertir base64 en buffer
    const imageBuffer = Buffer.from(image_base64, 'base64');

    // Construire le FormData pour Stability AI
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('image', blob, 'satellite.png');
    formData.append('prompt',
      'Aerial satellite view of a backyard with a modern rectangular swimming pool with turquoise water, stone decking around the pool, realistic shadows, photorealistic, 4K, same perspective and lighting as original'
    );
    formData.append('negative_prompt', 'distorted, unrealistic, cartoon, blurry, low quality, different angle');
    formData.append('output_format', 'png');

    const response = await fetch('https://api.stability.ai/v2beta/stable-image/edit/inpaint', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'image/*',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stability AI Error:', errorText);
      return NextResponse.json({ error: `Stability AI error: ${response.status}` }, { status: 502 });
    }

    const resultBuffer = await response.arrayBuffer();
    const resultBase64 = Buffer.from(resultBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      image_base64: resultBase64,
      content_type: 'image/png',
      size_bytes: resultBuffer.byteLength,
    });
  } catch (error) {
    console.error('Generate Pool Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
