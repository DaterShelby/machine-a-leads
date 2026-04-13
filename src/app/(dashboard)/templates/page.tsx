'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Eye, Edit2, Trash2, Star } from 'lucide-react'

const mockTemplates = [
  {
    id: '1',
    name: 'Professional Pool Offer',
    vertical: 'Piscine',
    subject: 'Your Personalized Pool Solution - {{property_address}}',
    preview: 'Dear {{name}}, we\'ve designed a custom pool installation proposal for your beautiful property...',
    isDefault: true,
  },
  {
    id: '2',
    name: 'Solar Panels - Limited Offer',
    vertical: 'Solaire',
    subject: 'Special Solar Promotion for {{city}} - Save Up to 40%',
    preview: 'Hi {{name}}, we noticed your property would benefit from solar panels. This month only...',
    isDefault: true,
  },
  {
    id: '3',
    name: 'Terrasse - Premium Solution',
    vertical: 'Terrasse',
    subject: 'Transform Your Outdoor Space - {{property_type}}',
    preview: 'Dear {{name}}, imagine your perfect outdoor living space. We can make it a reality...',
    isDefault: false,
  },
  {
    id: '4',
    name: 'Veranda - Casual Inquiry',
    vertical: 'Veranda',
    subject: 'Interested in a Veranda for {{property_address}}?',
    preview: 'Hi {{name}}, we noticed your property might be perfect for a veranda addition...',
    isDefault: true,
  },
  {
    id: '5',
    name: 'Paysager - Consultation',
    vertical: 'Paysager',
    subject: 'Free Landscape Consultation for {{city}}',
    preview: 'Dear {{name}}, our landscape experts would love to discuss your outdoor space...',
    isDefault: false,
  },
  {
    id: '6',
    name: 'Extension - Value Proposition',
    vertical: 'Extension',
    subject: 'Expand Your Home - {{property_type}} Extension Solutions',
    preview: 'Hi {{name}}, add valuable space to your home with our expert extension services...',
    isDefault: false,
  },
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState(mockTemplates)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  const handleToggleDefault = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isDefault: !t.isDefault } : t))
    )
  }

  const verticals = Array.from(new Set(templates.map((t) => t.vertical)))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-slate-400 mt-2">Manage email templates for your campaigns</p>
        </div>
        <Link
          href="#"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors w-fit"
        >
          <Plus className="w-5 h-5" />
          New Template
        </Link>
      </div>

      {/* Templates by Vertical */}
      {verticals.map((vertical) => {
        const verticalTemplates = templates.filter((t) => t.vertical === vertical)

        return (
          <div key={vertical}>
            <h2 className="text-lg font-semibold mb-4">{vertical}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verticalTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:border-slate-600 ${
                    selectedTemplate === template.id ? 'border-blue-500 ring-1 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{template.name}</h3>
                          {template.isDefault && (
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{template.vertical}</p>
                      </div>
                    </div>

                    {/* Subject Line */}
                    <div>
                      <p className="text-xs text-slate-400 font-medium mb-1">Subject</p>
                      <p className="text-sm text-slate-300">{template.subject}</p>
                    </div>

                    {/* Preview */}
                    <div>
                      <p className="text-xs text-slate-400 font-medium mb-1">Preview</p>
                      <p className="text-sm text-slate-400 line-clamp-2">
                        {template.preview}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                      <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors">
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors">
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(template.id)
                        }}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600/10 hover:bg-red-600/20 rounded text-sm text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Default Badge */}
                    {template.isDefault && (
                      <div className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-center">
                        Default template for {template.vertical}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}

      {/* Template Variables Guide */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold">Available Template Variables</h3>
          <p className="text-sm text-slate-400">
            Use these variables in your template subject and body to personalize emails:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { var: '{{name}}', desc: 'Prospect name' },
              { var: '{{email}}', desc: 'Prospect email' },
              { var: '{{city}}', desc: 'Property city' },
              { var: '{{address}}', desc: 'Property address' },
              { var: '{{property_type}}', desc: 'Type of property' },
              { var: '{{vertical}}', desc: 'Service vertical' },
              { var: '{{price}}', desc: 'Property price' },
              { var: '{{surface}}', desc: 'Property surface area' },
              { var: '{{campaign_name}}', desc: 'Campaign name' },
            ].map((item) => (
              <div key={item.var} className="bg-slate-800/50 rounded p-3">
                <p className="font-mono text-xs text-blue-400">{item.var}</p>
                <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
