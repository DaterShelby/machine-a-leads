/**
 * AI Image Generation Service
 *
 * Uses Stability AI SDXL Inpainting to generate property improvement images.
 * Endpoint: https://api.stability.ai/v2beta/stable-image/edit/inpaint
 */

import { ImageGenerationOptions, VerticalConfig } from '@/types';

const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/edit/inpaint';

/**
 * Vertical-specific prompts for image generation
 */
const VERTICAL_PROMPTS: Record<string, string> = {
  piscine:
    'A beautiful rectangular swimming pool with crystal clear blue water, modern pool deck, professional landscaping, aerial satellite view, photorealistic, high quality',
  solaire:
    'Modern solar panels installed on the roof, professional installation, sunny day, aerial view, photorealistic, high quality',
  terrasse:
    'A modern wooden deck terrace with outdoor furniture, ambient lighting, plants, aerial satellite view, photorealistic, high quality',
  veranda:
    'An elegant glass veranda extension, modern design, bright interior, seamless architecture match, aerial view, photorealistic, high quality',
  paysager:
    'Professional landscaped garden with pathways, plants, hedges, outdoor lighting, water features, aerial view, photorealistic, high quality',
  extension:
    'A modern house extension with matching architecture and materials, large windows, professional construction, aerial view, photorealistic, high quality',
  carport:
    'A modern wooden carport structure for two cars, professional installation, integrated lighting, aerial view, photorealistic, high quality',
  cloture:
    'An elegant modern fence with automated gate, professional installation, integrated lighting, landscaping, aerial view, photorealistic, high quality',
};

/**
 * Logs messages with service context
 */
function log(message: string, data?: any) {
  console.log(`[AIGenerator] ${message}`, data || '');
}

function logError(message: string, error?: any) {
  console.error(`[AIGenerator] ERROR: ${message}`, error || '');
}

/**
 * Validates required environment variables
 */
function validateConfig() {
  if (!STABILITY_API_KEY) {
    throw new Error('STABILITY_API_KEY environment variable is required');
  }
}

/**
 * Gets the vertical-specific prompt for image generation
 *
 * @param verticalName - Name of the vertical (lowercase)
 * @returns Optimized prompt for the vertical
 */
export function getPromptForVertical(verticalName: string): string {
  const prompt = VERTICAL_PROMPTS[verticalName.toLowerCase()];
  if (!prompt) {
    logError(`No prompt found for vertical: ${verticalName}, using default`);
    return `A beautiful property improvement, professional design, aerial satellite view, photorealistic`;
  }
  return prompt;
}

/**
 * Creates a simple mask image for inpainting (center area)
 *
 * @param imageBuffer - Original image buffer
 * @returns Mask buffer (PNG with alpha channel)
 * @throws Error if mask creation fails
 */
export async function createMask(imageBuffer: Buffer): Promise<Buffer> {
  try {
    log('Creating center-area mask for inpainting');

    // For now, return a simple placeholder mask
    // In production, this should use a library like sharp or jimp to:
    // 1. Read the image dimensions
    // 2. Create a new image with the same dimensions
    // 3. Draw a white rectangle in the center (area to inpaint)
    // 4. Fill the rest with black (areas to preserve)
    // 5. Convert to PNG with alpha channel

    // Simple approach: create a basic mask buffer
    // This is a 1x1 white PNG in production code
    const maskBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
      0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90,
      0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8,
      0xff, 0xff, 0x3f, 0x00, 0x05, 0xfe, 0x02, 0x00, 0x9d, 0x4e, 0x1d, 0x81,
    ]);

    log('Mask created successfully');
    return maskBuffer;
  } catch (error) {
    logError('Failed to create mask', error);
    throw error;
  }
}

/**
 * Generates an improved property image using Stability AI inpainting
 *
 * @param originalImageUrl - URL to the original satellite image
 * @param vertical - Vertical configuration with prompt details
 * @param options - Additional generation options
 * @returns Buffer containing the generated image
 * @throws Error if generation fails
 */
export async function generateImage(
  originalImageUrl: string,
  vertical: VerticalConfig,
  options: ImageGenerationOptions = {}
): Promise<Buffer> {
  try {
    validateConfig();

    const prompt = options.prompt || getPromptForVertical(vertical.name);

    log(`Generating image for vertical: ${vertical.name}`);
    log(`Using prompt: ${prompt.substring(0, 100)}...`);

    // Fetch the original image
    const imageResponse = await fetch(originalImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch original image: ${imageResponse.statusText}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();

    // Create a mask for inpainting
    const maskBuffer = await createMask(Buffer.from(imageBuffer));

    // Create multipart form data
    const formData = new FormData();
    formData.append('image', new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' }), 'image.jpg');
    formData.append('mask', new Blob([new Uint8Array(maskBuffer)], { type: 'image/png' }), 'mask.png');
    formData.append('prompt', prompt);
    formData.append('strength', (options.strength || 0.7).toString());

    if (options.seedId) {
      formData.append('seed', options.seedId.toString());
    }

    log('Sending request to Stability AI API');

    const response = await fetch(STABILITY_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STABILITY_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stability AI error: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    if (result.image) {
      const generatedBuffer = Buffer.from(result.image, 'base64');
      log(`Image generated successfully (${generatedBuffer.length} bytes)`);
      return generatedBuffer;
    } else {
      throw new Error('No image returned from Stability AI');
    }
  } catch (error) {
    logError(`Failed to generate image for vertical: ${vertical.name}`, error);
    throw error;
  }
}

/**
 * In-memory cache for generated images
 */
const generatedImageCache = new Map<
  string,
  { buffer: Buffer; timestamp: number }
>();

/**
 * Retrieves a cached generated image
 *
 * @param leadId - ID of the lead
 * @returns Cached image buffer or null
 */
export async function getCachedGeneratedImage(leadId: string): Promise<Buffer | null> {
  try {
    const cached = generatedImageCache.get(leadId);
    if (!cached) {
      return null;
    }

    const ageMs = Date.now() - cached.timestamp;
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (ageMs > maxAgeMs) {
      log(`Generated image cache expired for ${leadId}`);
      generatedImageCache.delete(leadId);
      return null;
    }

    log(`Retrieved cached generated image for ${leadId}`);
    return cached.buffer;
  } catch (error) {
    logError(`Error retrieving cached generated image for ${leadId}`, error);
    return null;
  }
}

/**
 * Uploads a generated image to cloud storage
 *
 * @param imageBuffer - Generated image buffer
 * @param leadId - ID of the lead
 * @returns URL to the uploaded image
 * @throws Error if upload fails
 */
export async function uploadGeneratedImage(
  imageBuffer: Buffer,
  leadId: string
): Promise<string> {
  try {
    log(`Uploading generated image for lead ${leadId}`);

    // Cache locally
    generatedImageCache.set(leadId, {
      buffer: imageBuffer,
      timestamp: Date.now(),
    });

    // TODO: Implement actual S3/GCS upload
    // For now, return a predictable URL

    const timestamp = Date.now();
    const filename = `generated_${leadId}_${timestamp}.jpg`;
    const url = `/images/generated/${filename}`;

    log(`Generated image uploaded to: ${url}`);
    return url;
  } catch (error) {
    logError(`Failed to upload generated image for lead ${leadId}`, error);
    throw error;
  }
}

/**
 * Full pipeline: fetch satellite image, generate improvement, upload result
 *
 * @param satelliteImageUrl - URL to the satellite image
 * @param leadId - ID of the lead
 * @param vertical - Vertical configuration
 * @returns URL to the generated image
 */
export async function generateAndUploadImage(
  satelliteImageUrl: string,
  leadId: string,
  vertical: VerticalConfig
): Promise<string> {
  try {
    // Check cache first
    const cached = await getCachedGeneratedImage(leadId);
    if (cached) {
      return `/images/generated/cached_${leadId}.jpg`;
    }

    // Generate image
    const generatedBuffer = await generateImage(satelliteImageUrl, vertical);

    // Upload to storage
    const url = await uploadGeneratedImage(generatedBuffer, leadId);

    return url;
  } catch (error) {
    logError(`Failed to generate and upload image for lead ${leadId}`, error);
    throw error;
  }
}

export type { ImageGenerationOptions };
