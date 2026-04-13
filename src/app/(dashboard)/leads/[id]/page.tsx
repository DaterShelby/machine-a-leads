'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Send,
  CheckCircle,
  FileText,
  Edit2,
} from 'lucide-react'
import Image from 'next/image'

const mockLead = {
  id: '1',
  name: 'Jean Dupont',
  email: 'jean.dupont@email.com',
  phone: '+33 6 12 34 56 78',
  status: 'opened',
  address: '123 Rue de la Paix',
  city: 'Cannes',
  postalCode: '06400',
  vertical: 'Piscine',
  campaign: 'Piscines Cote d\'Azur',
  property: {
    price: 850000,
    surface: 280,
    landArea: 1200,
    propertyType: 'Villa',
    description: 'Spacious villa with potential for pool addition',
  },
  images: {
    satellite: 'https://images.unsplash.com/photo-1523217582562-430f63602f14?w=800&q=80',
    generated: 'https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?w=800&q=80',
  },
  timeline: [
    {
      type: 'created',
      title: 'Lead Created',
      description: 'Lead was collected from DVF database',
      timestamp: '2024-03-13 10:30',
    },
    {
      type: 'satellite',
      title: 'Satellite Image Retrieved',
      description: 'Property satellite image downloaded',
      timestamp: '2024-03-13 10:35',
    },
    {
      type: 'generated',
      title: 'AI Image Generated',
      description: 'Before/after visualization created',
      timestamp: '2024-03-13 10:40',
    },
    {
      type: 'sent',
      title: 'Email Sent',
      description: 'Campaign email delivered to prospect',
      timestamp: '2024-03-13 11:00',
    },
    {
      type: 'opened',
      title: 'Email Opened',
      description: 'Prospect opened the email',
      timestamp: '2024-03-13 14:22',
    },
  ],
  notes: [
    {
      id: '1',
      author: 'System',
      content: 'Automatic lead score: 8.5/10',
      timestamp: '2024-03-13 10:30',
    },
  ],
}

const timelineIconColor = {
  created: 'bg-slate-500',
  satellite: 'bg-blue-500',
  generated: 'bg-purple-500',
  sent: 'bg-cyan-500',
  opened: 'bg-green-500',
  clicked: 'bg-emerald-500',
}

export default function LeadDetailPage({ params: _params }: { params: { id: string } }) {
  const [lead, setLead] = useState(mockLead)
  const [noteText, setNoteText] = useState('')
  const [newStatus, setNewStatus] = useState(lead.status)

  const handleAddNote = () => {
    if (noteText.trim()) {
      setLead((prev) => ({
        ...prev,
        notes: [
          ...prev.notes,
          {
            id: Date.now().toString(),
            author: 'You',
            content: noteText,
            timestamp: new Date().toLocaleString('fr-FR'),
          },
        ],
      }))
      setNoteText('')
    }
  }

  const handleStatusChange = (status: string) => {
    setNewStatus(status)
    setLead((prev) => ({
      ...prev,
      status: status,
    }))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{lead.name}</h1>
          <p className="text-slate-400 mt-1">{lead.address}, {lead.city}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded text-sm font-medium ${
              lead.status === 'opened'
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-blue-500/20 text-blue-300'
            }`}
          >
            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
          </span>
          <span className="px-3 py-1 rounded text-sm font-medium bg-slate-800 text-slate-200">
            {lead.vertical}
          </span>
        </div>
      </div>

      {/* Lead Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="font-medium">{lead.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-xs text-slate-400">Phone</p>
                <p className="font-medium">{lead.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-xs text-slate-400">Location</p>
                <p className="font-medium">
                  {lead.city}, {lead.postalCode}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-xs text-slate-400">Campaign</p>
                <p className="font-medium">{lead.campaign}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Property Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-slate-400">Type</p>
              <p className="font-medium">{lead.property.propertyType}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Price</p>
              <p className="font-medium">
                {lead.property.price.toLocaleString('fr-FR')} EUR
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Surface Area</p>
              <p className="font-medium">{lead.property.surface} m²</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Land Area</p>
              <p className="font-medium">{lead.property.landArea} m²</p>
            </div>
            <div className="pt-2 border-t border-slate-700">
              <p className="text-sm text-slate-300">{lead.property.description}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Before/After Images */}
      <Card>
        <CardHeader>
          <CardTitle>Visualization</CardTitle>
          <CardDescription>Satellite vs AI-generated visualization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Satellite Image */}
            <div className="relative overflow-hidden rounded-lg bg-slate-800">
              <div className="relative h-64 w-full">
                <Image
                  src={lead.images.satellite}
                  alt="Satellite Image"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-end justify-center pb-3">
                  <span className="px-3 py-1 rounded text-sm font-medium bg-black/50 text-white">
                    Image Satellite
                  </span>
                </div>
              </div>
            </div>

            {/* Generated Image */}
            <div className="relative overflow-hidden rounded-lg bg-slate-800">
              <div className="relative h-64 w-full">
                <Image
                  src={lead.images.generated}
                  alt="Generated Image"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-end justify-center pb-3">
                  <span className="px-3 py-1 rounded text-sm font-medium bg-black/50 text-white">
                    Image Generee IA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>Lead journey through the campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {lead.timeline.map((event, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      timelineIconColor[event.type as keyof typeof timelineIconColor]
                    }`}
                  />
                  {idx < lead.timeline.length - 1 && (
                    <div className="w-0.5 h-12 bg-slate-700 mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-semibold">{event.title}</p>
                  <p className="text-sm text-slate-400">{event.description}</p>
                  <p className="text-xs text-slate-500 mt-1">{event.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Change Status</label>
              <select
                value={newStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="opened">Opened</option>
                <option value="clicked">Clicked</option>
                <option value="converted">Converted</option>
              </select>
            </div>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
              <Send className="w-4 h-4" />
              Resend Email
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors">
              <CheckCircle className="w-4 h-4" />
              Mark Converted
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors">
              <Edit2 className="w-4 h-4" />
              Edit Lead
            </button>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Notes List */}
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {lead.notes.map((note) => (
                <div key={note.id} className="bg-slate-800/50 rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm">{note.author}</p>
                    <p className="text-xs text-slate-500">{note.timestamp}</p>
                  </div>
                  <p className="text-sm text-slate-300">{note.content}</p>
                </div>
              ))}
            </div>

            {/* Add Note */}
            <div className="border-t border-slate-700 pt-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                rows={2}
              />
              <button
                onClick={handleAddNote}
                className="mt-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-sm"
              >
                Add Note
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
