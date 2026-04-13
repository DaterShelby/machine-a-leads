import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Masque PNG 640x640 pré-généré : rectangle blanc au centre (zone piscine)
// Blanc = zone à modifier par l'IA, Noir = zone à conserver
const POOL_MASK_BASE64 = "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";

/**
 * POST /api/generate-pool
 * Body: { image_base64: string }
 * Envoie image satellite + masque pré-généré à Stability AI pour inpainting piscine
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

    // Décoder les buffers
    const imageBuffer = Buffer.from(image_base64, 'base64');
    const maskBuffer = Buffer.from(POOL_MASK_BASE64, 'base64');

    // Construire le FormData pour Stability AI
    const formData = new FormData();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    const maskBlob = new Blob([maskBuffer], { type: 'image/png' });

    formData.append('image', imageBlob, 'satellite.png');
    formData.append('mask', maskBlob, 'mask.png');
    formData.append('prompt',
      'aerial satellite view of a luxury rectangular swimming pool 10m by 5m with crystal clear turquoise blue water, beige stone pool deck surround, two sun loungers, perfectly integrated in residential garden, photorealistic satellite imagery style, high resolution'
    );
    formData.append('negative_prompt',
      'distorted blurry cartoon unrealistic ground level view indoor people text watermark huge pool olympic pool'
    );
    formData.append('output_format', 'png');

    // Appel Stability AI
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
      console.error('Stability AI Error:', response.status, errorText);
      return NextResponse.json({
        error: `Stability AI error: ${response.status}`,
        details: errorText,
      }, { status: 502 });
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
