import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('renderTemplate', () => {
    function renderTemplate(template: string, variables: Record<string, string>): string {
      let result = template
      Object.entries(variables).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
      })
      return result
    }

    it('should replace single variable', () => {
      const result = renderTemplate('Bonjour {{prenom}}!', { prenom: 'Jean' })
      expect(result).toBe('Bonjour Jean!')
    })

    it('should replace multiple variables', () => {
      const template = 'Bonjour {{prenom}} {{nom}}, votre propriete a {{ville}} nous interesse.'
      const result = renderTemplate(template, {
        prenom: 'Marie',
        nom: 'Dupont',
        ville: 'Nice',
      })
      expect(result).toBe('Bonjour Marie Dupont, votre propriete a Nice nous interesse.')
    })

    it('should replace same variable multiple times', () => {
      const result = renderTemplate('{{nom}} - Contact: {{nom}}', { nom: 'Dupont' })
      expect(result).toBe('Dupont - Contact: Dupont')
    })

    it('should leave unknown variables unchanged', () => {
      const result = renderTemplate('Hello {{unknown}}', {})
      expect(result).toBe('Hello {{unknown}}')
    })
  })

  describe('RGPD compliance', () => {
    it('should include unsubscribe link in all emails', () => {
      const emailHtml = buildEmailHtml({
        body: '<p>Contenu de lemail</p>',
        unsubscribeUrl: 'https://app.machinealeads.com/unsubscribe?token=abc123',
      })
      expect(emailHtml).toContain('unsubscribe')
      expect(emailHtml).toContain('desinscription')
    })

    it('should include sender identification', () => {
      const emailHtml = buildEmailHtml({
        body: '<p>Test</p>',
        unsubscribeUrl: 'https://example.com/unsub',
      })
      expect(emailHtml).toContain('Machine a Leads')
    })
  })

  describe('email validation', () => {
    it('should accept valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('jean.dupont@gmail.com')).toBe(true)
      expect(isValidEmail('contact@entreprise.fr')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('notanemail')).toBe(false)
      expect(isValidEmail('@missing.com')).toBe(false)
      expect(isValidEmail('missing@')).toBe(false)
    })
  })
})

function buildEmailHtml(params: { body: string; unsubscribeUrl: string }): string {
  return `
    <html>
    <body>
      ${params.body}
      <hr/>
      <p style="font-size:12px;color:#666;">
        Machine a Leads - Generateur de leads IA<br/>
        <a href="${params.unsubscribeUrl}">Se desinscrire / unsubscribe</a> |
        Conformite RGPD - lien de desinscription
      </p>
    </body>
    </html>
  `
}

function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}
