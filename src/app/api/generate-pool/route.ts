import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Génère un masque PNG rectangulaire arrondi au centre de l'image.
 * Le masque indique à Stability AI OÙ placer la piscine.
 * Blanc = zone à modifier, Noir = zone à conserver.
 */
function generatePoolMask(width: number, height: number): Buffer {
  // Créer un PNG minimaliste avec un rectangle blanc au centre
  // On utilise une approche canvas-free: on génère les pixels directement

  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const pw = 70; // demi-largeur du masque
  const ph = 45; // demi-hauteur du masque
  const radius = 10;

  // Créer un buffer de pixels RGBA
  const pixels = Buffer.alloc(width * height * 4, 0); // tout noir, alpha 255

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Vérifier si le pixel est dans le rectangle arrondi
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);

      let inside = false;
      if (dx <= pw - radius && dy <= ph) inside = true;
      else if (dx <= pw && dy <= ph - radius) inside = true;
      else {
        // Vérifier les coins arrondis
        const cornerX = dx - (pw - radius);
        const cornerY = dy - (ph - radius);
        if (cornerX > 0 && cornerY > 0 && cornerX * cornerX + cornerY * cornerY <= radius * radius) {
          inside = true;
        }
      }

      if (inside) {
        pixels[idx] = 255;     // R
        pixels[idx + 1] = 255; // G
        pixels[idx + 2] = 255; // B
      }
      pixels[idx + 3] = 255;   // Alpha toujours opaque
    }
  }

  // Encoder en PNG brut (on utilise un format BMP simple que Stability accepte)
  // En fait, utilisons un PNG minimal via construction manuelle
  return createMinimalPNG(width, height, pixels);
}

/**
 * Crée un PNG minimal à partir de pixels RGBA bruts.
 */
function createMinimalPNG(width: number, height: number, rgba: Buffer): Buffer {
  // Pour simplifier, on va créer une image en mémoire via un approach plus simple:
  // Utiliser un canvas virtuel avec les raw bytes
  // Stability AI accepte aussi les BMP, mais PNG est plus fiable

  // Approche: créer le masque comme une image grayscale simple
  // En fait, le plus simple est de générer le masque côté client en base64 canvas
  // Mais pour le backend, utilisons un format bitmap brut

  // Alternative plus robuste: générer un fichier PNG valide
  const { deflateSync } = require('zlib');

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // IDAT chunk - raw image data
  // Each row has a filter byte (0 = none) followed by RGB pixels
  const rawData = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 3);
    rawData[rowOffset] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = rowOffset + 1 + x * 3;
      rawData[dstIdx] = rgba[srcIdx];     // R
      rawData[dstIdx + 1] = rgba[srcIdx + 1]; // G
      rawData[dstIdx + 2] = rgba[srcIdx + 2]; // B
    }
  }
  const compressed = deflateSync(rawData);
  const idat = createChunk('IDAT', compressed);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const combined = Buffer.concat([typeBuffer, data]);

  // CRC32
  const crc = crc32(combined);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, combined, crcBuffer]);
}

function crc32(data: Buffer): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xEDB88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * POST /api/generate-pool
 * Body: { image_base64: string }
 * Génère un masque automatiquement et envoie à Stability AI pour inpainting
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

    // Générer le masque (rectangle au centre, taille réaliste de piscine)
    const maskBuffer = generatePoolMask(640, 640);

    // Construire le FormData
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
      return NextResponse.json({
        error: `Stability AI error: ${response.status}`,
        details: errorText
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
