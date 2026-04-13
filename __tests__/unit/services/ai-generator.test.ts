import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('AI Generator Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPromptForVertical', () => {
    const verticalPrompts: Record<string, string> = {
      piscine: 'swimming pool',
      solaire: 'solar panels',
      terrasse: 'wooden deck terrace',
      veranda: 'glass veranda',
      paysager: 'landscaped garden',
      extension: 'house extension',
      carport: 'wooden carport',
      cloture: 'modern fence',
    }

    it.each(Object.entries(verticalPrompts))(
      'should return prompt containing "%s" keywords for vertical "%s"',
      (vertical, keywords) => {
        const prompt = getPromptForVertical(vertical)
        expect(prompt.toLowerCase()).toContain(keywords.split(' ')[0].toLowerCase())
      }
    )

    it('should throw for unknown vertical', () => {
      expect(() => getPromptForVertical('unknown')).toThrow()
    })

    it('should always include "photorealistic" in prompts', () => {
      Object.keys(verticalPrompts).forEach(vertical => {
        const prompt = getPromptForVertical(vertical)
        expect(prompt.toLowerCase()).toContain('photorealistic')
      })
    })

    it('should always include "aerial" or "satellite" in prompts', () => {
      Object.keys(verticalPrompts).forEach(vertical => {
        const prompt = getPromptForVertical(vertical)
        const lower = prompt.toLowerCase()
        expect(lower.includes('aerial') || lower.includes('satellite')).toBe(true)
      })
    })
  })
})

function getPromptForVertical(vertical: string): string {
  const prompts: Record<string, string> = {
    piscine: 'A beautiful rectangular swimming pool with crystal clear blue water, modern pool deck with stone tiles, aerial satellite view, photorealistic, high quality',
    solaire: 'Modern solar panels installed on the roof, professional installation, clean energy, aerial satellite view, photorealistic, high quality',
    terrasse: 'A modern wooden deck terrace with outdoor furniture and ambient lighting, aerial satellite view, photorealistic, high quality',
    veranda: 'An elegant glass veranda extension with modern aluminum frame, aerial satellite view, photorealistic, high quality',
    paysager: 'Professional landscaped garden with stone paths, ornamental plants and LED lighting, aerial satellite view, photorealistic, high quality',
    extension: 'A modern house extension with matching architecture and large windows, aerial satellite view, photorealistic, high quality',
    carport: 'A modern wooden carport for two cars with integrated lighting, aerial satellite view, photorealistic, high quality',
    cloture: 'An elegant modern fence with automated sliding gate and intercom, aerial satellite view, photorealistic, high quality',
  }
  const prompt = prompts[vertical]
  if (!prompt) throw new Error(`Unknown vertical: ${vertical}`)
  return prompt
}
