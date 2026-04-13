import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Define schemas inline for testing (mirrors src/lib/validators/index.ts)
const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  vertical_id: z.string().uuid('Invalid vertical ID'),
  target_cities: z.array(z.string()).optional(),
  target_departments: z.array(z.string().length(2).or(z.string().length(3))).optional(),
  target_postal_codes: z.array(z.string().regex(/^\d{5}$/)).optional(),
  min_price: z.number().int().positive().optional(),
  max_price: z.number().int().positive().optional(),
  min_land_area: z.number().int().positive().optional(),
  email_template_id: z.string().uuid().optional(),
}).refine(data => {
  if (data.min_price && data.max_price) return data.min_price < data.max_price
  return true
}, { message: 'min_price must be less than max_price' })

const emailSchema = z.string().email()

describe('Validators', () => {
  describe('createCampaignSchema', () => {
    const validCampaign = {
      name: 'Piscines Cote d Azur',
      vertical_id: '123e4567-e89b-12d3-a456-426614174000',
      target_postal_codes: ['06000', '06100'],
      min_price: 500000,
      max_price: 1200000,
    }

    it('should validate correct campaign data', () => {
      const result = createCampaignSchema.safeParse(validCampaign)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const result = createCampaignSchema.safeParse({ ...validCampaign, name: '' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid vertical_id (not UUID)', () => {
      const result = createCampaignSchema.safeParse({ ...validCampaign, vertical_id: 'not-a-uuid' })
      expect(result.success).toBe(false)
    })

    it('should reject when min_price > max_price', () => {
      const result = createCampaignSchema.safeParse({
        ...validCampaign,
        min_price: 1500000,
        max_price: 500000,
      })
      expect(result.success).toBe(false)
    })

    it('should accept campaign without optional fields', () => {
      const result = createCampaignSchema.safeParse({
        name: 'Test',
        vertical_id: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid postal codes', () => {
      const result = createCampaignSchema.safeParse({
        ...validCampaign,
        target_postal_codes: ['ABC', '1234'],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('emailSchema', () => {
    it('should validate correct emails', () => {
      expect(emailSchema.safeParse('test@example.com').success).toBe(true)
      expect(emailSchema.safeParse('jean.dupont@entreprise.fr').success).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(emailSchema.safeParse('notanemail').success).toBe(false)
      expect(emailSchema.safeParse('').success).toBe(false)
      expect(emailSchema.safeParse('@missing.com').success).toBe(false)
    })
  })
})
