import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('DVF Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('searchProperties', () => {
    it('should call DVF API with correct base URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ resultats: [] }),
      })

      const { searchProperties } = await import('@/lib/services/dvf')
      await searchProperties({ codePostal: '06000', minPrice: 500000, maxPrice: 1200000 })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('api.cquest.org/dvf')
      expect(url).toContain('code_postal=06000')
    })

    it('should return empty array when no results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ resultats: [] }),
      })

      const { searchProperties } = await import('@/lib/services/dvf')
      const results = await searchProperties({ codePostal: '99999' })
      expect(results).toEqual([])
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { searchProperties } = await import('@/lib/services/dvf')
      await expect(searchProperties({ codePostal: '06000' })).rejects.toThrow()
    })

    it('should include price filters in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ resultats: [] }),
      })

      const { searchProperties } = await import('@/lib/services/dvf')
      await searchProperties({ minPrice: 500000, maxPrice: 1200000 })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('prix_min=500000')
      expect(url).toContain('prix_max=1200000')
    })
  })

  describe('filterEligibleProperties', () => {
    it('should filter by price range', () => {
      const properties = [
        { price: 300000, land_area: 500, property_type: 'Maison' },
        { price: 700000, land_area: 500, property_type: 'Maison' },
        { price: 1500000, land_area: 500, property_type: 'Maison' },
      ]
      const filtered = properties.filter(p => p.price >= 500000 && p.price <= 1200000)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].price).toBe(700000)
    })

    it('should filter by minimum land area', () => {
      const properties = [
        { price: 700000, land_area: 100, property_type: 'Maison' },
        { price: 700000, land_area: 500, property_type: 'Maison' },
      ]
      const filtered = properties.filter(p => p.land_area >= 300)
      expect(filtered).toHaveLength(1)
    })

    it('should only include houses (Maison)', () => {
      const properties = [
        { price: 700000, land_area: 500, property_type: 'Maison' },
        { price: 700000, land_area: 500, property_type: 'Appartement' },
      ]
      const filtered = properties.filter(p => p.property_type === 'Maison')
      expect(filtered).toHaveLength(1)
    })
  })
})
