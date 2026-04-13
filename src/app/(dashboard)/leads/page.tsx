'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, ChevronRight, Search, Loader2 } from 'lucide-react'

interface DVFProperty {
  id: string;
  adresse: string;
  ville: string;
  code_postal: string;
  prix: number;
  surface_terrain: number;
  surface_bati: number;
  pieces: number;
  type_local: string;
  date_mutation: string;
}

interface Lead extends DVFProperty {
  status: 'non_traite' | 'image_satellite' | 'ia_genere' | 'email_envoye';
  vertical?: string;
}

const mockLeads = [
  {
    id: '1',
    name: 'Jean Dupont',
    email: 'jean.dupont@email.com',
    address: '123 Rue de la Paix',
    city: 'Cannes',
    vertical: 'Piscine',
    status: 'opened',
    date: '2024-03-13',
    campaign: 'Piscines Cote d\'Azur',
  },
  {
    id: '2',
    name: 'Marie Laurent',
    email: 'marie.laurent@email.com',
    address: '456 Avenue des Champs',
    city: 'Nice',
    vertical: 'Solaire',
    status: 'clicked',
    date: '2024-03-12',
    campaign: 'Panneaux Solaires - Provence',
  },
  {
    id: '3',
    name: 'Pierre Martin',
    email: 'pierre.martin@email.com',
    address: '789 Boulevard Saint-Michel',
    city: 'Antibes',
    vertical: 'Terrasse',
    status: 'sent',
    date: '2024-03-11',
    campaign: 'Terrasses Mediterranee',
  },
  {
    id: '4',
    name: 'Sophie Bernard',
    email: 'sophie.bernard@email.com',
    address: '321 Route de la Cote',
    city: 'Menton',
    vertical: 'Veranda',
    status: 'opened',
    date: '2024-03-10',
    campaign: 'Verandas et Extensions',
  },
  {
    id: '5',
    name: 'Luc Rousseau',
    email: 'luc.rousseau@email.com',
    address: '654 Chemin des Collines',
    city: 'Grasse',
    vertical: 'Paysager',
    status: 'pending',
    date: '2024-03-09',
    campaign: 'Amenagement Paysager',
  },
  {
    id: '6',
    name: 'Anne Moreau',
    email: 'anne.moreau@email.com',
    address: '987 Rue de la Riviera',
    city: 'Villefranche',
    vertical: 'Extension',
    status: 'clicked',
    date: '2024-03-08',
    campaign: 'Extensions Maison',
  },
  {
    id: '7',
    name: 'Thomas Blanc',
    email: 'thomas.blanc@email.com',
    address: '147 Impasse du Soleil',
    city: 'Vence',
    vertical: 'Piscine',
    status: 'opened',
    date: '2024-03-07',
    campaign: 'Piscines Cote d\'Azur',
  },
  {
    id: '8',
    name: 'Isabelle Guerin',
    email: 'isabelle.guerin@email.com',
    address: '258 Montee des Cedres',
    city: 'Saint-Paul',
    vertical: 'Solaire',
    status: 'sent',
    date: '2024-03-06',
    campaign: 'Panneaux Solaires',
  },
  {
    id: '9',
    name: 'Nicolas Delorme',
    email: 'nicolas.delorme@email.com',
    address: '369 Rue du Port',
    city: 'Golfe-Juan',
    vertical: 'Terrasse',
    status: 'clicked',
    date: '2024-03-05',
    campaign: 'Terrasses Mediterranee',
  },
  {
    id: '10',
    name: 'Catherine Durand',
    email: 'catherine.durand@email.com',
    address: '741 Chemin du Littoral',
    city: 'Vallauris',
    vertical: 'Veranda',
    status: 'opened',
    date: '2024-03-04',
    campaign: 'Verandas et Extensions',
  },
  {
    id: '11',
    name: 'Robert Fournier',
    email: 'robert.fournier@email.com',
    address: '852 Boulevard de la Cote',
    city: 'Mandelieu',
    vertical: 'Paysager',
    status: 'pending',
    date: '2024-03-03',
    campaign: 'Amenagement Paysager',
  },
  {
    id: '12',
    name: 'Francoise Lefevre',
    email: 'francoise.lefevre@email.com',
    address: '963 Rue du Parc',
    city: 'Mougins',
    vertical: 'Extension',
    status: 'sent',
    date: '2024-03-02',
    campaign: 'Extensions Maison',
  },
  {
    id: '13',
    name: 'Michel Dupuis',
    email: 'michel.dupuis@email.com',
    address: '147 Avenue Mont-Blanc',
    city: 'Theoule',
    vertical: 'Piscine',
    status: 'opened',
    date: '2024-03-01',
    campaign: 'Piscines Cote d\'Azur',
  },
  {
    id: '14',
    name: 'Jacqueline Noel',
    email: 'jacqueline.noel@email.com',
    address: '258 Rue des Fleurs',
    city: 'Esterel',
    vertical: 'Solaire',
    status: 'clicked',
    date: '2024-02-29',
    campaign: 'Panneaux Solaires',
  },
  {
    id: '15',
    name: 'Bernard Ledue',
    email: 'bernard.ledue@email.com',
    address: '369 Chemin de la Paix',
    city: 'Auribeau',
    vertical: 'Terrasse',
    status: 'sent',
    date: '2024-02-28',
    campaign: 'Terrasses Mediterranee',
  },
]

const statusColor = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  sent: 'bg-blue-500/20 text-blue-300',
  opened: 'bg-purple-500/20 text-purple-300',
  clicked: 'bg-green-500/20 text-green-300',
  converted: 'bg-emerald-500/20 text-emerald-300',
}

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [verticalFilter, setVerticalFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [codePostal, setCodePostal] = useState('06000')
  const [prixMin, setPrixMin] = useState('500000')
  const [prixMax, setPrixMax] = useState('1200000')
  const [dvfLeads, setDvfLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [loadedCount, setLoadedCount] = useState(0)

  // Fusionner les mock leads avec les DVF leads
  const [allLeads, setAllLeads] = useState<Lead[]>(mockLeads)

  useEffect(() => {
    setAllLeads([...dvfLeads, ...mockLeads])
  }, [dvfLeads])

  const handleLoadDVFLeads = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/dvf/search?code_postal=${codePostal}&prix_min=${prixMin}&prix_max=${prixMax}&limit=50`
      )

      if (!response.ok) throw new Error('Failed to fetch properties')

      const data = await response.json()
      const transformedLeads: Lead[] = (data.data || []).map((prop: DVFProperty, idx: number) => ({
        ...prop,
        status: 'non_traite' as const,
        vertical: 'Propriété DVF',
      }))

      setDvfLeads(transformedLeads)
      setLoadedCount(transformedLeads.length)
    } catch (error) {
      console.error('Error loading DVF leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const verticals = ['all', 'Propriété DVF', ...Array.from(new Set(mockLeads.map((l) => l.vertical)))]
  const statuses = ['all', ...Array.from(new Set(allLeads.map((l) => l.status)))]
  const itemsPerPage = 10

  const filteredLeads = allLeads.filter((lead) => {
    const leadName = (lead as any).name || lead.adresse || ''
    const leadEmail = (lead as any).email || lead.code_postal || ''
    const leadCity = (lead as any).city || lead.ville || ''
    const matchesSearch =
      leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leadEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leadCity.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesVertical = verticalFilter === 'all' || lead.vertical === verticalFilter
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    return matchesSearch && matchesVertical && matchesStatus
  })

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage)
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const toggleLead = (id: string) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((lid) => lid !== id) : [...prev, id]
    )
  }

  const toggleAllLeads = () => {
    if (selectedLeads.length === paginatedLeads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(paginatedLeads.map((l) => l.id))
    }
  }

  const handleExport = () => {
    const leadsToExport = selectedLeads.length > 0 ? filteredLeads.filter((l) => selectedLeads.includes(l.id)) : filteredLeads
    console.log('Exporting:', leadsToExport)
    // In a real app, this would export to CSV
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Leads</h1>
        <p className="text-slate-400 mt-2">Manage and view all your leads</p>
      </div>

      {/* DVF Import Card */}
      <Card>
        <CardHeader>
          <CardTitle>Charger les données DVF</CardTitle>
          <CardDescription>Importez les propriétés en vente depuis l'API DVF gratuite</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Code Postal</label>
              <input
                type="text"
                value={codePostal}
                onChange={(e) => setCodePostal(e.target.value)}
                placeholder="06000"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Prix min (€)</label>
              <input
                type="text"
                value={prixMin}
                onChange={(e) => setPrixMin(e.target.value)}
                placeholder="500000"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Prix max (€)</label>
              <input
                type="text"
                value={prixMax}
                onChange={(e) => setPrixMax(e.target.value)}
                placeholder="1200000"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleLoadDVFLeads}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loadedCount > 0 ? `Charger DVF (${loadedCount})` : 'Charger depuis DVF'}
          </button>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par adresse, email ou ville..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
          className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div>
            <label className="block text-sm font-medium mb-1">Vertical</label>
            <select
              value={verticalFilter}
              onChange={(e) => {
                setVerticalFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              {verticals.map((v) => (
                <option key={v} value={v}>
                  {v === 'all' ? 'All Verticals' : v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedLeads.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Export {selectedLeads.length} Lead{selectedLeads.length !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0}
              onChange={toggleAllLeads}
              className="w-4 h-4 rounded border-slate-700"
            />
            All Leads ({filteredLeads.length} total)
          </CardTitle>
          <CardDescription>
            Showing {paginatedLeads.length} leads on page {currentPage} of {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 font-medium text-slate-300 w-12">
                    <input
                      type="checkbox"
                      checked={selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0}
                      onChange={toggleAllLeads}
                      className="w-4 h-4 rounded border-slate-700"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Lead</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Property</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Vertical</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Date</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeads.map((lead) => {
                  const isFromDVF = (lead as any).type_local;
                  const leadName = isFromDVF ? lead.adresse : (lead as any).name || '';
                  const leadEmail = isFromDVF ? lead.prix.toString() : (lead as any).email || '';
                  const leadCity = isFromDVF ? lead.ville : (lead as any).city || '';
                  const leadDate = lead.date_mutation || (lead as any).date || '';

                  return (
                    <tr key={lead.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => toggleLead(lead.id)}
                          className="w-4 h-4 rounded border-slate-700"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-sm">{leadName}</p>
                          <p className="text-xs text-slate-400">{isFromDVF ? `${lead.surface_terrain} m²` : leadEmail}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-slate-300 text-sm">{leadCity}</p>
                          <p className="text-xs text-slate-400">{lead.code_postal}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-slate-800 text-slate-200">
                          {lead.vertical}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                            statusColor[lead.status as keyof typeof statusColor] || 'bg-slate-800 text-slate-200'
                          }`}
                        >
                          {lead.status === 'non_traite' && 'Non traité'}
                          {lead.status === 'image_satellite' && 'Image satellite'}
                          {lead.status === 'ia_genere' && 'IA généré'}
                          {lead.status === 'email_envoye' && 'Email envoyé'}
                          {!(lead.status as any).includes('_') && lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {new Date(leadDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="inline-flex text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-700">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
