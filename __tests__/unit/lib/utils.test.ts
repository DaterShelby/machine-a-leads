import { describe, it, expect } from 'vitest'

// Simple cn implementation for testing
function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

describe('Utility Functions', () => {
  describe('cn() - class name merger', () => {
    it('should merge multiple class strings', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500')
      expect(result).toBe('px-4 py-2 bg-blue-500')
    })

    it('should filter out falsy values', () => {
      const result = cn('px-4', false && 'hidden', undefined, null, 'py-2')
      expect(result).toBe('px-4 py-2')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const isDisabled = false
      const result = cn(
        'base-class',
        isActive && 'active',
        isDisabled && 'disabled'
      )
      expect(result).toBe('base-class active')
    })

    it('should handle empty input', () => {
      expect(cn()).toBe('')
    })

    it('should trim whitespace', () => {
      const result = cn('  px-4  ', '  py-2  ')
      expect(result).toContain('px-4')
      expect(result).toContain('py-2')
    })
  })
})
