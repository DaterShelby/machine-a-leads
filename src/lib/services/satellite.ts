/**
 * Satellite Image Service
 *
 * Fetches satellite/aerial images from Google Maps Static API
 * and manages image caching and storage.
 */

import { SatelliteOptions } from '@/types';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const STATIC_MAP_URL = 'https://maps.googleapis.com/maps/api/staticmap';

/**
 * Logs messages with service context
 */
function log(message: string, data?: any) {
  console.log(`[Satellite] ${message}`, data || '');
}

function logError(message: string, error?: any) {
  console.error(`[Satellite] ERROR: ${message}`, error || '');
}

/**
 * Validates required environment variables
 */
function validateConfig() {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('GOOGLE_MAPS_API_KEY environment variable is required');
  }
}

/**
 * Fetches a satellite image for the given coordinates
 *
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @param options - Image options (zoom level, size, map type)
 * @returns Buffer containing the satellite image
 * @throws Error if the request fails
 */
export async function fetchSatelliteImage(
  lat: number,
  lng: number,
  options: SatelliteOptions = {}
): Promise<Buffer> {
  try {
    validateConfig();

    const zoom = options.zoom || 19;
    const size = options.size || '640x640';
    const maptype = options.maptype || 'satellite';

    log(`Fetching satellite image for [${lat}, ${lng}] at zoom ${zoom}`);

    const params = new URLSearchParams({
      center: `${lat},${lng}`,
      zoom: zoom.toString(),
      size: size,
      maptype: maptype,
      key: GOOGLE_MAPS_API_KEY!,
      scale: '2',
    });

    const url = `${STATIC_MAP_URL}?${params.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    log(`Successfully fetched image (${buffer.byteLength} bytes)`);

    return Buffer.from(buffer);
  } catch (error) {
    logError(`Failed to fetch satellite image at [${lat}, ${lng}]`, error);
    throw error;
  }
}

/**
 * In-memory cache for satellite images
 * In production, this should be replaced with a proper cache (Redis, S3, etc.)
 */
const imageCache = new Map<string, { buffer: Buffer; timestamp: number }>();

/**
 * Generates a cache key for a property
 */
function getCacheKey(propertyId: string): string {
  return `satellite_${propertyId}`;
}

/**
 * Retrieves a cached image if available and fresh (< 30 days)
 *
 * @param propertyId - ID of the property
 * @returns Cached image buffer or null if not found/expired
 */
export async function getCachedImage(propertyId: string): Promise<Buffer | null> {
  try {
    const cacheKey = getCacheKey(propertyId);
    const cached = imageCache.get(cacheKey);

    if (!cached) {
      return null;
    }

    const ageMs = Date.now() - cached.timestamp;
    const maxAgeMs = 30 * 24 * 60 * 60 * 1000; // 30 days

    if (ageMs > maxAgeMs) {
      log(`Cache expired for ${propertyId}`);
      imageCache.delete(cacheKey);
      return null;
    }

    log(`Retrieved cached image for ${propertyId}`);
    return cached.buffer;
  } catch (error) {
    logError(`Error retrieving cached image for ${propertyId}`, error);
    return null;
  }
}

/**
 * Stores an image buffer in cache
 */
function cacheImage(propertyId: string, buffer: Buffer): void {
  const cacheKey = getCacheKey(propertyId);
  imageCache.set(cacheKey, {
    buffer,
    timestamp: Date.now(),
  });
  log(`Cached image for ${propertyId}`);
}

/**
 * Uploads an image buffer to cloud storage (stub for S3/GCS implementation)
 *
 * @param imageBuffer - Image data to upload
 * @param propertyId - ID of the property
 * @returns URL to the uploaded image
 * @throws Error if upload fails
 */
export async function uploadToStorage(
  imageBuffer: Buffer,
  propertyId: string
): Promise<string> {
  try {
    log(`Uploading satellite image for property ${propertyId}`);

    // TODO: Implement actual S3/GCS upload
    // For now, generate a URL that assumes images are stored locally
    // or in a CDN with a predictable URL pattern

    const timestamp = Date.now();
    const filename = `satellite_${propertyId}_${timestamp}.jpg`;

    // Cache locally for retrieval
    cacheImage(propertyId, imageBuffer);

    // In production, this would return:
    // - S3 URL: https://bucket.s3.amazonaws.com/satellite_${propertyId}.jpg
    // - GCS URL: https://storage.googleapis.com/bucket/satellite_${propertyId}.jpg
    // - CDN URL: https://cdn.example.com/images/${filename}

    const url = `/images/satellite/${filename}`;
    log(`Image uploaded to: ${url}`);

    return url;
  } catch (error) {
    logError(`Failed to upload image for property ${propertyId}`, error);
    throw error;
  }
}

/**
 * Fetches and caches a satellite image for a property
 *
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @param propertyId - ID of the property
 * @param options - Image options
 * @returns URL to the satellite image
 */
export async function getSatelliteImage(
  lat: number,
  lng: number,
  propertyId: string,
  options: SatelliteOptions = {}
): Promise<string> {
  try {
    // Check cache first
    const cached = await getCachedImage(propertyId);
    if (cached) {
      return `/images/satellite/cached_${propertyId}.jpg`;
    }

    // Fetch from Google Maps
    const imageBuffer = await fetchSatelliteImage(lat, lng, options);

    // Upload to storage
    const url = await uploadToStorage(imageBuffer, propertyId);

    return url;
  } catch (error) {
    logError(`Failed to get satellite image for property ${propertyId}`, error);
    throw error;
  }
}

/**
 * Clears expired images from cache
 */
export function clearExpiredCache(): void {
  const now = Date.now();
  const maxAgeMs = 30 * 24 * 60 * 60 * 1000; // 30 days

  let cleared = 0;
  for (const [key, value] of imageCache.entries()) {
    if (now - value.timestamp > maxAgeMs) {
      imageCache.delete(key);
      cleared++;
    }
  }

  if (cleared > 0) {
    log(`Cleared ${cleared} expired cache entries`);
  }
}

export type { SatelliteOptions };
