/**
 * Zod Validation Schemas
 *
 * Comprehensive validation schemas for all API inputs and business logic
 */

import { z } from 'zod';

// Campaign Schemas
export const createCampaignSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(1000).optional(),
  vertical: z.enum([
    'piscine',
    'solaire',
    'terrasse',
    'veranda',
    'paysager',
    'extension',
    'carport',
    'cloture',
  ]),
  communes: z.array(z.string().min(1)).min(1),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  minSurface: z.number().positive().optional(),
  maxSurface: z.number().positive().optional(),
});

export const updateCampaignSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3).max(255).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
  communes: z.array(z.string().min(1)).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
});

// Lead Schemas
export const createLeadSchema = z.object({
  campaignId: z.string().uuid(),
  address: z.string().min(5),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  price: z.number().positive().optional(),
  surface: z.number().positive().optional(),
  propertyType: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const updateLeadSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  email_status: z.enum(['pending', 'sent', 'bounced', 'opened', 'clicked']).optional(),
  satellite_image_url: z.string().url().optional(),
  generated_image_url: z.string().url().optional(),
});

// DVF Search Schemas
export const dvfSearchSchema = z.object({
  communes: z.array(z.string().min(1)).optional(),
  codePostal: z.string().regex(/^\d{5}$/).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  minSurface: z.number().positive().optional(),
  maxSurface: z.number().positive().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

// Email Schemas
export const emailAddressSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export const emailParamsSchema = z.object({
  to: emailAddressSchema,
  subject: z.string().min(1).max(255),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  sender: emailAddressSchema,
  tags: z.array(z.string()).optional(),
  replyTo: emailAddressSchema.optional(),
  templateId: z.string().optional(),
  templateParams: z.record(z.string()).optional(),
});

export const emailTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  variables: z.array(z.string()),
});

// Satellite Image Schemas
export const satelliteOptionsSchema = z.object({
  zoom: z.number().min(10).max(20).optional(),
  size: z.string().optional(),
  maptype: z.enum(['satellite', 'terrain', 'roadmap', 'hybrid']).optional(),
});

export const fetchSatelliteImageSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  propertyId: z.string().uuid(),
  options: satelliteOptionsSchema.optional(),
});

// AI Generation Schemas
export const imageGenerationOptionsSchema = z.object({
  prompt: z.string().optional(),
  strength: z.number().min(0).max(1).optional(),
  seedId: z.number().optional(),
});

export const generateImageSchema = z.object({
  originalImageUrl: z.string().url(),
  vertical: z.string(),
  options: imageGenerationOptionsSchema.optional(),
});

// Pipeline Schemas
export const executePipelineStepSchema = z.object({
  jobId: z.string(),
  step: z.enum([
    'collect_data',
    'fetch_satellites',
    'generate_images',
    'send_emails',
    'track_analytics',
  ]),
});

export const startPipelineSchema = z.object({
  campaignId: z.string().uuid(),
});

// Batch Processing Schemas
export const processBatchSchema = z.object({
  items: z.array(z.unknown()),
  batchSize: z.number().min(1).max(1000),
});

// Type exports for convenience
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type DVFSearchInput = z.infer<typeof dvfSearchSchema>;
export type EmailAddressInput = z.infer<typeof emailAddressSchema>;
export type EmailParamsInput = z.infer<typeof emailParamsSchema>;
export type EmailTemplateInput = z.infer<typeof emailTemplateSchema>;
export type SatelliteOptionsInput = z.infer<typeof satelliteOptionsSchema>;
export type FetchSatelliteImageInput = z.infer<typeof fetchSatelliteImageSchema>;
export type ImageGenerationOptionsInput = z.infer<typeof imageGenerationOptionsSchema>;
export type GenerateImageInput = z.infer<typeof generateImageSchema>;
export type ExecutePipelineStepInput = z.infer<typeof executePipelineStepSchema>;
export type StartPipelineInput = z.infer<typeof startPipelineSchema>;
export type ProcessBatchInput = z.infer<typeof processBatchSchema>;

/**
 * Validation helper function
 * Validates input against a schema and returns typed result or error
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError['errors'] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data as T };
  }

  return {
    success: false,
    errors: result.error.errors,
  };
}

/**
 * Formats validation errors into a readable message
 */
export function formatValidationError(errors: z.ZodError['errors']): string {
  return errors
    .map((error) => {
      const path = error.path.join('.');
      return `${path}: ${error.message}`;
    })
    .join('; ');
}

/**
 * Validates price range (max >= min)
 */
export function validatePriceRange(
  minPrice?: number,
  maxPrice?: number
): { valid: boolean; error?: string } {
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    return {
      valid: false,
      error: 'minPrice must be less than or equal to maxPrice',
    };
  }

  return { valid: true };
}

/**
 * Validates surface range (max >= min)
 */
export function validateSurfaceRange(
  minSurface?: number,
  maxSurface?: number
): { valid: boolean; error?: string } {
  if (minSurface !== undefined && maxSurface !== undefined && minSurface > maxSurface) {
    return {
      valid: false,
      error: 'minSurface must be less than or equal to maxSurface',
    };
  }

  return { valid: true };
}

/**
 * Validates geographic coordinates
 */
export const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export function validateCoordinates(
  lat: number,
  lng: number
): { valid: boolean; error?: string } {
  const result = coordinateSchema.safeParse({
    latitude: lat,
    longitude: lng,
  });

  if (!result.success) {
    return {
      valid: false,
      error: formatValidationError(result.error.errors),
    };
  }

  return { valid: true };
}

/**
 * Validates French postal code (5 digits)
 */
export function validatePostalCode(code: string): { valid: boolean; error?: string } {
  if (!/^\d{5}$/.test(code)) {
    return {
      valid: false,
      error: 'Postal code must be 5 digits',
    };
  }

  return { valid: true };
}

/**
 * Validates email address
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailSchema = z.string().email();
  const result = emailSchema.safeParse(email);

  if (!result.success) {
    return {
      valid: false,
      error: 'Invalid email address',
    };
  }

  return { valid: true };
}

/**
 * Validates French phone number
 */
export function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  const phoneRegex = /^(?:(?:\+|00)33|0)[1-9](?:[0-9]{8})$/;

  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return {
      valid: false,
      error: 'Invalid French phone number',
    };
  }

  return { valid: true };
}
