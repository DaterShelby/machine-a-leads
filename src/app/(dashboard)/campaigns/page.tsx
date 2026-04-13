'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Play, Pause, Droplets, Sun, Trees, Home, Palette, Wrench, ParkingCircle, Shield } from 'lucide-react'

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

const mockCampaigns = [
  {
    id: '1',
    name: 'Piscines Cote d\'Azur',
    vertical: 'Piscine',
    status: 'active',
    stats: {
      sent: 245,
      opened: 89,
      clicked: 34,
    },
    progress: 68,
    createdAt: '2024-03-01',
  },
  {
    id: '2',
    name: 'Panneaux Solaires - Provence',
    vertical: 'Solaire',
    status: 'active',
    stats: {
      sent: 189,
      opened: 72,
      clicked: 28,
    },
    progress: 54,
    createdAt: '2024-03-05',
  },
  {
    id: '3',
    name: 'Terrasses Mediterranee',
    vertical: 'Terrasse',
    status: 'paused',
    stats: {
      sent: 156,
      opened: 45,
      clicked: 12,
    },
    progress: 40,
    createdAt: '2024-02-28',
  },
  {
    id: '4',
    name: 'Verandas et Extensions - Q1',
    vertical: 'Veranda',
    status: 'draft',
    stats: {
      sent: 0,
      opened: 0,
      clicked: 0,
    },
    progress: 15,
    createdAt: '2024-03-10',
  },
  {
    id: '5',
    name: 'Amenagement Paysager',
    vertical: 'Paysager',
    status: 'active',
    stats: {
      sent: 134,
      opened: 58,
      clicked: 22,
    },
    progress: 62,
    createdAt: '2024-03-02',
  },
  {
    id: '6',
    name: 'Extensions Maison - Sud',
    vertical: 'Extension',
    status: 'completed',
    stats: {
      sent: 287,
      opened: 112,
      clicked: 48,
    },
    progress: 100,
    createdAt: '2024-02-20',
  },
]

const statusConfig = {
  active: { bg: 'bg-green-500/20', text: 'text-green-300', label: 'Active' },
  paused: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Paused' },
  draft: { bg: 'bg-slate-500/20', text: 'text-slate-300', label: 'Draft' },
  completed: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Completed' },
}

export default function CampaignsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [verticalFilter, setVerticalFilter] = useState('all')

  const filteredCampaigns = mockCampaigns.filter((campaign) => {
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    const matchesVertical = verticalFilter === 'all' || campaign.vertical === verticalFilter
    return matchesStatus && matchesVertical
  })

  const verticals = ['all', ...Array.from(new Set(mockCampaigns.map((c) => c.vertical)))]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Campagnes</h1>
          <p className="text-slate-400 mt-2">Manage and monitor your campaigns</p>
        </div>
        <Link
          href="/campaigns/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors w-fit"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Campagne
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Vertical</label>
          <select
            value={verticalFilter}
            onChange={(e) => setVerticalFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {verticals.map((v) => (
              <option key={v} value={v}>
                {v === 'all' ? 'All Verticals' : v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Campaign Cards Grid */}
      {filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => {
            const VerticalIcon = verticalIcons[campaign.vertical] || Droplets
            const config = statusConfig[campaign.status as keyof typeof statusConfig]

            return (
              <Card key={campaign.id} className="hover:border-slate-600 transition-colors">
                <CardContent className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="text-lg font-semibold hover:text-blue-400 transition-colors"
                      >
                        {campaign.name}
                      </Link>
                      <p className="text-sm text-slate-400 mt-1">
                        Created {new Date(campaign.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {campaign.status === 'active' && (
                        <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded transition-colors">
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      {campaign.status === 'paused' && (
                        <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded transition-colors">
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-slate-200 text-xs font-medium">
                      <VerticalIcon className="w-3 h-3" />
                      {campaign.vertical}
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}
                    >
                      {config.label}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-700">
                    <div>
                      <p className="text-xs text-slate-400">Sent</p>
                      <p className="text-lg font-semibold">{campaign.stats.sent}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Opened</p>
                      <p className="text-lg font-semibold">{campaign.stats.opened}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Clicked</p>
                      <p className="text-lg font-semibold">{campaign.stats.clicked}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-slate-400 font-medium">Progress</p>
                      <p className="text-sm font-semibold">{campaign.progress}%</p>
                    </div>
                    <div className="w-full bg-slate-800 rounded h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded transition-all"
                        style={{ width: `${campaign.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* View Button */}
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="w-full py-2 text-center bg-slate-800 hover:bg-slate-700 rounded text-sm font-medium transition-colors"
                  >
                    View Details
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <p className="text-slate-400">No campaigns found with the selected filters</p>
            <Link
              href="/campaigns/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Campaign
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
