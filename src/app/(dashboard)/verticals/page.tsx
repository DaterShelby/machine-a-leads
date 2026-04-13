'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Droplets,
  Sun,
  Trees,
  Home,
  Palette,
  Wrench,
  ParkingCircle,
  Shield,
  Edit2,
  Power,
} from 'lucide-react'

const verticalIcons: Record<string, any> = {
  'Piscine': Droplets,
  'Solaire': Sun,
  'Terrasse': Palette,
  'Veranda': Home,
  'Paysager': Trees,
  'Extension': Wrench,
  'Carport': ParkingCircle,
  'Cloture': Shield,
}

const mockVerticals = [
  {
    id: 'piscine',
    name: 'Piscine',
    description: 'Custom pool installations and renovations',
    active: true,
    stats: {
      totalLeads: 452,
      conversionRate: 12.5,
    },
    prompt: 'Generate beautiful before/after images for residential pool installations in Mediterranean style...',
  },
  {
    id: 'solaire',
    name: 'Solaire',
    description: 'Solar panel systems and renewable energy',
    active: true,
    stats: {
      totalLeads: 389,
      conversionRate: 18.3,
    },
    prompt: 'Create visualizations showing solar panel installations on residential roofs...',
  },
  {
    id: 'terrasse',
    name: 'Terrasse',
    description: 'Outdoor terrace design and construction',
    active: true,
    stats: {
      totalLeads: 267,
      conversionRate: 15.7,
    },
    prompt: 'Generate AI images of beautiful outdoor terrace designs for residential properties...',
  },
  {
    id: 'veranda',
    name: 'Veranda',
    description: 'Veranda and conservatory installations',
    active: true,
    stats: {
      totalLeads: 345,
      conversionRate: 22.1,
    },
    prompt: 'Create visualizations of modern veranda additions to residential homes...',
  },
  {
    id: 'paysager',
    name: 'Paysager',
    description: 'Landscape design and outdoor beautification',
    active: true,
    stats: {
      totalLeads: 278,
      conversionRate: 14.2,
    },
    prompt: 'Generate landscape design visualizations for residential gardens and outdoor spaces...',
  },
  {
    id: 'extension',
    name: 'Extension',
    description: 'Home extensions and additions',
    active: true,
    stats: {
      totalLeads: 312,
      conversionRate: 19.8,
    },
    prompt: 'Create before/after visualizations of residential home extensions...',
  },
  {
    id: 'carport',
    name: 'Carport',
    description: 'Carport and covered parking solutions',
    active: false,
    stats: {
      totalLeads: 89,
      conversionRate: 11.2,
    },
    prompt: 'Generate visualizations of modern carport installations...',
  },
  {
    id: 'cloture',
    name: 'Cloture',
    description: 'Fencing and perimeter solutions',
    active: false,
    stats: {
      totalLeads: 123,
      conversionRate: 13.5,
    },
    prompt: 'Create visualizations of modern fence designs for residential properties...',
  },
]

export default function VerticalsPage() {
  const [verticals, setVerticals] = useState(mockVerticals)
  const [expandedVertical, setExpandedVertical] = useState<string | null>(null)

  const handleToggleActive = (id: string) => {
    setVerticals((prev) =>
      prev.map((v) => (v.id === id ? { ...v, active: !v.active } : v))
    )
  }

  const activeVerticals = verticals.filter((v) => v.active)
  const inactiveVerticals = verticals.filter((v) => !v.active)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Verticals</h1>
        <p className="text-slate-400 mt-2">Configure and manage service verticals</p>
      </div>

      {/* Active Verticals */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Active Verticals ({activeVerticals.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeVerticals.map((vertical) => {
            const Icon = verticalIcons[vertical.name] || Droplets

            return (
              <Card
                key={vertical.id}
                className="hover:border-slate-600 transition-colors"
              >
                <CardContent className="p-6 space-y-4">
                  {/* Icon and Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{vertical.name}</h3>
                        <p className="text-sm text-slate-400">{vertical.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setExpandedVertical(
                          expandedVertical === vertical.id ? null : vertical.id
                        )
                      }
                      className="p-2 hover:bg-slate-800 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-700">
                    <div>
                      <p className="text-xs text-slate-400">Total Leads</p>
                      <p className="text-lg font-semibold">
                        {vertical.stats.totalLeads}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Conv. Rate</p>
                      <p className="text-lg font-semibold text-green-400">
                        {vertical.stats.conversionRate}%
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded text-xs font-medium bg-green-500/20 text-green-300">
                      Active
                    </span>
                    <button
                      onClick={() => handleToggleActive(vertical.id)}
                      className="p-2 hover:bg-slate-800 rounded transition-colors"
                    >
                      <Power className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  {/* Expanded Prompt */}
                  {expandedVertical === vertical.id && (
                    <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          AI Prompt
                        </label>
                        <textarea
                          value={vertical.prompt}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                          rows={3}
                        />
                      </div>
                      <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-sm">
                        Save Changes
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Inactive Verticals */}
      {inactiveVerticals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Inactive Verticals ({inactiveVerticals.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inactiveVerticals.map((vertical) => {
              const Icon = verticalIcons[vertical.name] || Droplets

              return (
                <Card
                  key={vertical.id}
                  className="opacity-60 hover:opacity-100 hover:border-slate-600 transition-all"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{vertical.name}</h3>
                          <p className="text-sm text-slate-400">{vertical.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-700">
                      <div>
                        <p className="text-xs text-slate-400">Total Leads</p>
                        <p className="text-lg font-semibold">
                          {vertical.stats.totalLeads}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Conv. Rate</p>
                        <p className="text-lg font-semibold text-slate-400">
                          {vertical.stats.conversionRate}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded text-xs font-medium bg-slate-700/50 text-slate-400">
                        Inactive
                      </span>
                      <button
                        onClick={() => handleToggleActive(vertical.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                      >
                        Activate
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Configuration Guide */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold">Vertical Configuration</h3>
          <p className="text-sm text-slate-400">
            Each vertical has its own AI prompt that determines how before/after images are
            generated. Customize prompts to match your service offerings and create more
            relevant visualizations for prospects.
          </p>
          <div className="bg-slate-800/50 rounded p-4 space-y-2">
            <p className="text-sm font-semibold">Pro Tips:</p>
            <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
              <li>Use descriptive language in prompts for better AI outputs</li>
              <li>Include style preferences (modern, classical, contemporary)</li>
              <li>Specify materials and colors relevant to your service</li>
              <li>Test prompts with a few leads before large campaigns</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
