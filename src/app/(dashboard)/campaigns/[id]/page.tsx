'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Droplets, Play, Pause, Edit2, ChevronRight } from 'lucide-react'
import {
  FunnelChart,
  Funnel,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const mockCampaignDetail = {
  id: 'cmp_001',
  name: 'Piscines Cote d\'Azur',
  description: 'Targeted lead generation for premium pool installations in French Riviera',
  vertical: 'Piscine',
  status: 'active',
  stats: {
    properties: 452,
    sent: 245,
    opened: 89,
    clicked: 34,
    converted: 8,
  },
  pipelineSteps: [
    { step: 'Collection', status: 'completed', processed: 452 },
    { step: 'Satellite', status: 'completed', processed: 445 },
    { step: 'AI Generation', status: 'in_progress', processed: 423 },
    { step: 'Email', status: 'pending', processed: 245 },
  ],
  leads: [
    {
      id: 'lead_001',
      name: 'Jean Dupont',
      email: 'jean@example.com',
      address: '123 Rue de la Paix',
      city: 'Cannes',
      status: 'opened',
    },
    {
      id: 'lead_002',
      name: 'Marie Laurent',
      email: 'marie@example.com',
      address: '456 Avenue des Champs',
      city: 'Nice',
      status: 'clicked',
    },
    {
      id: 'lead_003',
      name: 'Pierre Martin',
      email: 'pierre@example.com',
      address: '789 Boulevard Saint-Michel',
      city: 'Antibes',
      status: 'sent',
    },
    {
      id: 'lead_004',
      name: 'Sophie Bernard',
      email: 'sophie@example.com',
      address: '321 Route de la Cote',
      city: 'Menton',
      status: 'opened',
    },
    {
      id: 'lead_005',
      name: 'Luc Rousseau',
      email: 'luc@example.com',
      address: '654 Chemin des Collines',
      city: 'Grasse',
      status: 'pending',
    },
  ],
}

const funnelData = [
  { name: 'Properties Found', value: 452 },
  { name: 'Emails Sent', value: 245 },
  { name: 'Opened', value: 89 },
  { name: 'Clicked', value: 34 },
  { name: 'Converted', value: 8 },
]

const statusColor = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  sent: 'bg-blue-500/20 text-blue-300',
  opened: 'bg-purple-500/20 text-purple-300',
  clicked: 'bg-green-500/20 text-green-300',
  converted: 'bg-emerald-500/20 text-emerald-300',
}

const pipelineStatusColor = {
  pending: 'bg-slate-700',
  in_progress: 'bg-blue-600',
  completed: 'bg-green-600',
}

export default function CampaignDetailPage({ params: _params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState(mockCampaignDetail)

  const handleToggleStatus = () => {
    setCampaign((prev) => ({
      ...prev,
      status: prev.status === 'active' ? 'paused' : 'active',
    }))
  }

  const conversionRate = ((campaign.stats.converted / campaign.stats.properties) * 100).toFixed(2)
  const openRate = ((campaign.stats.opened / campaign.stats.sent) * 100).toFixed(2)
  const clickRate = ((campaign.stats.clicked / campaign.stats.opened) * 100).toFixed(2)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Droplets className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <p className="text-slate-400 mt-1">{campaign.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleStatus}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              campaign.status === 'active'
                ? 'bg-red-600/20 text-red-300 hover:bg-red-600/30'
                : 'bg-green-600/20 text-green-300 hover:bg-green-600/30'
            }`}
          >
            {campaign.status === 'active' ? (
              <>
                <Pause className="w-4 h-4" />
                Pause Campaign
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Resume Campaign
              </>
            )}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors">
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>

      {/* Status and Badges */}
      <div className="flex items-center gap-3">
        <span
          className={`px-3 py-1 rounded text-sm font-medium ${
            campaign.status === 'active'
              ? 'bg-green-500/20 text-green-300'
              : 'bg-yellow-500/20 text-yellow-300'
          }`}
        >
          {campaign.status === 'active' ? 'Active' : 'Paused'}
        </span>
        <span className="px-3 py-1 rounded text-sm font-medium bg-slate-800 text-slate-200">
          Piscine
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Properties', value: campaign.stats.properties },
          { label: 'Sent', value: campaign.stats.sent },
          { label: 'Opened', value: campaign.stats.opened, secondary: `${openRate}%` },
          { label: 'Clicked', value: campaign.stats.clicked, secondary: `${clickRate}%` },
          { label: 'Converted', value: campaign.stats.converted, secondary: `${conversionRate}%` },
        ].map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-2xl font-bold">{stat.value}</p>
                {stat.secondary && <span className="text-sm text-slate-400">{stat.secondary}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Progress</CardTitle>
          <CardDescription>Data flow through the processing pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaign.pipelineSteps.map((pipelineStep, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        pipelineStatusColor[pipelineStep.status as keyof typeof pipelineStatusColor]
                      }`}
                    />
                    <p className="font-medium">{pipelineStep.step}</p>
                  </div>
                  <p className="text-sm text-slate-400">{pipelineStep.processed} processed</p>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      pipelineStatusColor[pipelineStep.status as keyof typeof pipelineStatusColor]
                    }`}
                    style={{
                      width: `${(pipelineStep.processed / campaign.stats.properties) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Funnel Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>Lead journey through your campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <FunnelChart
              data={funnelData}
              margin={{ top: 20, right: 160, bottom: 20, left: 100 }}
            >
              <XAxis dataKey="name" stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Funnel dataKey="value" fill="#3b82f6" />
            </FunnelChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Leads</CardTitle>
          <CardDescription>Latest leads from this campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Address</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">City</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {campaign.leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-medium">{lead.name}</td>
                    <td className="py-3 px-4 text-slate-400">{lead.email}</td>
                    <td className="py-3 px-4 text-slate-400">{lead.address}</td>
                    <td className="py-3 px-4 text-slate-400">{lead.city}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          statusColor[lead.status as keyof typeof statusColor]
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button className="text-blue-400 hover:text-blue-300 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
