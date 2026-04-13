import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Masque PNG 640x640 pré-généré : rectangle blanc au centre (zone piscine)
// Blanc = zone à modifier par l'IA, Noir = zone à conserver
const POOL_MASK_BASE64 = "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";

const PROMPT = 'aerial satellite view of a luxury rectangular swimming pool 10m by 5m with crystal clear turquoise blue water, beige stone pool deck surround, two sun loungers, perfectly integrated in residential garden, photorealistic satellite imagery style, high resolution';
const NEGATIVE_PROMPT = 'distorted blurry cartoon unrealistic ground level view indoor people text watermark huge pool olympic pool';

/**
 * POST /api/generate-pool
 * Body: { image_base64: string }
 *
 * Strategy:
 * 1. Try fal.ai (FAL_KEY) - cheapest, free credits
 * 2. Fallback to Stability AI (STABILITY_API_KEY) if fal.ai unavailable
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image_base64 } = body;

    if (!image_base64) {
      return NextResponse.json({ error: 'image_base64 is required' }, { status: 400 });
    }

    // Try fal.ai first
    const falKey = process.env.FAL_KEY;
    if (falKey) {
      console.log('Using fal.ai for inpainting...');
      const result = await generateWithFal(image_base64, falKey);
      if (result.success) return NextResponse.json(result);
      console.error('fal.ai failed, trying fallback...', result.error);
    }

    // Fallback: Stability AI
    const stabilityKey = process.env.STABILITY_API_KEY;
    if (stabilityKey) {
      console.log('Using Stability AI for inpainting...');
      const result = await generateWithStability(image_base64, stabilityKey);
      if (result.success) return NextResponse.json(result);
      return NextResponse.json({ error: result.error, details: result.details }, { status: 502 });
    }

    return NextResponse.json({
      error: 'No AI API key configured. Set FAL_KEY or STABILITY_API_KEY in environment variables.'
    }, { status: 500 });

  } catch (error) {
    console.error('Generate Pool Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Génération via fal.ai (SDXL Inpainting)
 * Endpoint: https://fal.run/fal-ai/inpaint
 * Accepte data URIs pour image_url et mask_url
 */
async function generateWithFal(imageBase64: string, apiKey: string) {
  try {
    const imageDataUri = `data:image/png;base64,${imageBase64}`;
    const maskDataUri = `data:image/png;base64,${POOL_MASK_BASE64}`;

    const response = await fetch('https://fal.run/fal-ai/inpaint', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_name: 'diffusers/stable-diffusion-xl-1.0-inpainting-0.1',
        prompt: PROMPT,
        negative_prompt: NEGATIVE_PROMPT,
        image_url: imageDataUri,
        mask_url: maskDataUri,
        num_inference_steps: 30,
        guidance_scale: 7.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('fal.ai error:', response.status, errorText);
      return { success: false, error: `fal.ai error: ${response.status}`, details: errorText };
    }

    const data = await response.json();

    // fal.ai retourne une URL d'image - on la télécharge et convertit en base64
    if (data.image?.url) {
      const imgResponse = await fetch(data.image.url);
      if (!imgResponse.ok) {
        return { success: false, error: 'Failed to download fal.ai result image' };
      }
      const imgBuffer = await imgResponse.arrayBuffer();
      const imgBase64 = Buffer.from(imgBuffer).toString('base64');

      return {
        success: true,
        image_base64: imgBase64,
        content_type: data.image.content_type || 'image/png',
        size_bytes: imgBuffer.byteLength,
        provider: 'fal.ai',
      };
    }

    return { success: false, error: 'fal.ai returned no image', details: JSON.stringify(data) };
  } catch (err) {
    return { success: false, error: `fal.ai exception: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/**
 * Génération via Stability AI (fallback)
 */
async function generateWithStability(imageBase64: string, apiKey: string) {
  try {
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const maskBuffer = Buffer.from(POOL_MASK_BASE64, 'base64');

    const formData = new FormData();
    formData.append('image', new Blob([imageBuffer], { type: 'image/png' }), 'satellite.png');
    formData.append('mask', new Blob([maskBuffer], { type: 'image/png' }), 'mask.png');
    formData.append('prompt', PROMPT);
    formData.append('negative_prompt', NEGATIVE_PROMPT);
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
      return { success: false, error: `Stability AI error: ${response.status}`, details: errorText };
    }

    const resultBuffer = await response.arrayBuffer();
    const resultBase64 = Buffer.from(resultBuffer).toString('base64');

    return {
      success: true,
      image_base64: resultBase64,
      content_type: 'image/png',
      size_bytes: resultBuffer.byteLength,
      provider: 'stability-ai',
    };
  } catch (err) {
    return { success: false, error: `Stability exception: ${err instanceof Error ? err.message : String(err)}` };
  }
}
