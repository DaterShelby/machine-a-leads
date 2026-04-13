'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Search, Loader2, Satellite, Sparkles, Mail, MapPin,
  Euro, Maximize, Calendar, ChevronDown, ChevronUp, Eye
} from 'lucide-react'

// Communes IDF
const IDF_COMMUNES = [
  { label: "Domont (95)", value: "95203" },
  { label: "Herblay (95)", value: "95306" },
  { label: "Argenteuil (95)", value: "95018" },
  { label: "Enghien-les-Bains (95)", value: "95219" },
  { label: "Deuil-la-Barre (95)", value: "95197" },
  { label: "Méry-sur-Oise (95)", value: "95424" },
  { label: "Taverny (95)", value: "95607" },
  { label: "Pontoise (95)", value: "95488" },
  { label: "Cergy (95)", value: "95127" },
  { label: "Franconville (95)", value: "95252" },
  { label: "L'Isle-Adam (95)", value: "95351" },
  { label: "Montmorency (95)", value: "95394" },
  { label: "Rueil-Malmaison (92)", value: "92062" },
  { label: "Saint-Cloud (92)", value: "92064" },
  { label: "Noisy-le-Grand (93)", value: "93051" },
  { label: "Gagny (93)", value: "93032" },
  { label: "Méru (60)", value: "60395" },
];

interface Property {
  id: string;
  adresse: string;
  ville: string;
  code_postal: string;
  prix: number;
  surface_terrain: number;
  date_mutation: string;
  latitude: number;
  longitude: number;
}

interface LeadCard extends Property {
  status: 'scanning' | 'satellite_ready' | 'ai_generating' | 'ai_ready' | 'email_sent' | 'idle';
  satelliteImage?: string;
  aiImage?: string;
}

export default function LeadsPage() {
  const [codeInsee, setCodeInsee] = useState("95203");
  const [prixMin, setPrixMin] = useState("500000");
  const [prixMax, setPrixMax] = useState("1200000");
  const [leads, setLeads] = useState<LeadCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Ajuster les prix pour Méru
  const handleCommuneChange = (newCode: string) => {
    setCodeInsee(newCode);
    if (newCode === "60395") {
      setPrixMin("200000");
      setPrixMax("600000");
    } else {
      setPrixMin("500000");
      setPrixMax("1200000");
    }
  };

  // 1) Scanner les propriétés DVF
  const handleScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/dvf/search?code_insee=${codeInsee}&prix_min=${prixMin}&prix_max=${prixMax}&limit=20`
      );
      if (!response.ok) throw new Error("Erreur API DVF");
      const data = await response.json();

      const newLeads: LeadCard[] = (data.data || [])
        .filter((p: Property) => p.latitude && p.longitude && p.latitude !== 0)
        .map((p: Property) => ({
          ...p,
          status: 'idle' as const,
        }));

      setLeads(newLeads);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  // 2) Récupérer l'image satellite
  const fetchSatellite = useCallback(async (lead: LeadCard) => {
    setProcessingId(lead.id);
    setLeads(prev => prev.map(l =>
      l.id === lead.id ? { ...l, status: 'scanning' } : l
    ));

    try {
      const response = await fetch(
        `/api/satellite?lat=${lead.latitude}&lon=${lead.longitude}&zoom=19`
      );
      if (!response.ok) throw new Error("Erreur satellite");
      const data = await response.json();

      setLeads(prev => prev.map(l =>
        l.id === lead.id
          ? { ...l, status: 'satellite_ready', satelliteImage: `data:${data.content_type};base64,${data.image_base64}` }
          : l
      ));
      setExpandedLead(lead.id);
    } catch (err) {
      console.error(err);
      setLeads(prev => prev.map(l =>
        l.id === lead.id ? { ...l, status: 'idle' } : l
      ));
    } finally {
      setProcessingId(null);
    }
  }, []);

  // 3) Générer l'image IA avec piscine
  const generatePool = useCallback(async (lead: LeadCard) => {
    if (!lead.satelliteImage) return;
    setProcessingId(lead.id);
    setLeads(prev => prev.map(l =>
      l.id === lead.id ? { ...l, status: 'ai_generating' } : l
    ));

    try {
      // Extraire le base64 depuis le data URL
      const base64 = lead.satelliteImage.split(',')[1];

      const response = await fetch('/api/generate-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64 }),
      });

      if (!response.ok) throw new Error("Erreur génération IA");
      const data = await response.json();

      setLeads(prev => prev.map(l =>
        l.id === lead.id
          ? { ...l, status: 'ai_ready', aiImage: `data:${data.content_type};base64,${data.image_base64}` }
          : l
      ));
    } catch (err) {
      console.error(err);
      setLeads(prev => prev.map(l =>
        l.id === lead.id ? { ...l, status: 'satellite_ready' } : l
      ));
    } finally {
      setProcessingId(null);
    }
  }, []);

  // Traiter tout le pipeline pour un lead
  const processLead = useCallback(async (lead: LeadCard) => {
    // Step 1: Satellite
    setProcessingId(lead.id);
    setLeads(prev => prev.map(l =>
      l.id === lead.id ? { ...l, status: 'scanning' } : l
    ));

    try {
      const satResponse = await fetch(
        `/api/satellite?lat=${lead.latitude}&lon=${lead.longitude}&zoom=19`
      );
      if (!satResponse.ok) throw new Error("Erreur satellite");
      const satData = await satResponse.json();
      const satelliteUrl = `data:${satData.content_type};base64,${satData.image_base64}`;

      setLeads(prev => prev.map(l =>
        l.id === lead.id ? { ...l, status: 'ai_generating', satelliteImage: satelliteUrl } : l
      ));
      setExpandedLead(lead.id);

      // Step 2: AI Generation
      const aiResponse = await fetch('/api/generate-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: satData.image_base64 }),
      });

      if (!aiResponse.ok) throw new Error("Erreur génération IA");
      const aiData = await aiResponse.json();

      setLeads(prev => prev.map(l =>
        l.id === lead.id
          ? { ...l, status: 'ai_ready', aiImage: `data:${aiData.content_type};base64,${aiData.image_base64}` }
          : l
      ));
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  }, []);

  const formatPrice = (p: number) => {
    if (p >= 1000000) return `${(p / 1000000).toFixed(2)}M€`;
    return `${(p / 1000).toFixed(0)}k€`;
  };

  const statusBadge = (status: LeadCard['status']) => {
    const map: Record<string, { bg: string; label: string }> = {
      idle: { bg: 'bg-slate-600', label: 'Non traité' },
      scanning: { bg: 'bg-yellow-600 animate-pulse', label: '🛰️ Satellite...' },
      satellite_ready: { bg: 'bg-blue-600', label: '🛰️ Satellite ✓' },
      ai_generating: { bg: 'bg-purple-600 animate-pulse', label: '🎨 IA en cours...' },
      ai_ready: { bg: 'bg-green-600', label: '✅ Avant/Après prêt' },
      email_sent: { bg: 'bg-emerald-600', label: '📧 Email envoyé' },
    };
    const s = map[status] || map.idle;
    return <span className={`px-2 py-1 rounded text-xs font-medium ${s.bg}`}>{s.label}</span>;
  };

  const leadsWithCoords = leads.filter(l => l.latitude && l.longitude);
  const leadsWithSatellite = leads.filter(l => l.satelliteImage);
  const leadsWithAI = leads.filter(l => l.aiImage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🏠 Machine à Leads — Pipeline Visuel</h1>
        <p className="text-slate-400 mt-1">
          Scanner → Image satellite → IA piscine → Email personnalisé
        </p>
      </div>

      {/* Scanner Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" /> Scanner les propriétés DVF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Commune IDF</label>
              <select
                value={codeInsee}
                onChange={(e) => handleCommuneChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {IDF_COMMUNES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Prix min</label>
              <input type="text" value={prixMin} onChange={(e) => setPrixMin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Prix max</label>
              <input type="text" value={prixMax} onChange={(e) => setPrixMax(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex items-end">
              <button onClick={handleScan} disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg font-medium flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Scanner
              </button>
            </div>
          </div>
          {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
        </CardContent>
      </Card>

      {/* Stats */}
      {leads.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">{leads.length}</p>
            <p className="text-xs text-slate-400 mt-1">Propriétés trouvées</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">{leadsWithCoords.length}</p>
            <p className="text-xs text-slate-400 mt-1">Avec coordonnées GPS</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-purple-400">{leadsWithSatellite.length}</p>
            <p className="text-xs text-slate-400 mt-1">Images satellite</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{leadsWithAI.length}</p>
            <p className="text-xs text-slate-400 mt-1">IA avant/après</p>
          </div>
        </div>
      )}

      {/* Lead Cards */}
      <div className="space-y-4">
        {leads.map((lead) => {
          const isExpanded = expandedLead === lead.id;
          const isProcessing = processingId === lead.id;

          return (
            <Card key={lead.id} className={`overflow-hidden transition-all ${isExpanded ? 'ring-1 ring-blue-500' : ''}`}>
              <CardContent className="p-0">
                {/* Lead Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                  onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Mini satellite preview */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                        {lead.satelliteImage ? (
                          <img src={lead.satelliteImage} alt="Satellite" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Satellite className="w-6 h-6 text-slate-500" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {lead.adresse || 'Adresse non renseignée'}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {lead.ville} ({lead.code_postal})
                          </span>
                          <span className="flex items-center gap-1">
                            <Euro className="w-3 h-3" /> {formatPrice(lead.prix)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Maximize className="w-3 h-3" /> {lead.surface_terrain}m²
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {statusBadge(lead.status)}

                      {/* Action buttons */}
                      {lead.status === 'idle' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); processLead(lead); }}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" /> Traiter
                        </button>
                      )}
                      {lead.status === 'satellite_ready' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); generatePool(lead); }}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" /> Générer IA
                        </button>
                      )}
                      {lead.status === 'ai_ready' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); }}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-xs font-medium flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" /> Envoyer
                        </button>
                      )}

                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded: AVANT / APRÈS Side by Side */}
                {isExpanded && (
                  <div className="border-t border-slate-700 p-4 bg-slate-900/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* AVANT — Image Satellite */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Satellite className="w-4 h-4 text-blue-400" />
                          <h4 className="font-semibold text-sm text-blue-400">AVANT — Vue satellite</h4>
                        </div>
                        <div className="aspect-square rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                          {lead.satelliteImage ? (
                            <img src={lead.satelliteImage} alt="Vue satellite" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                              <Satellite className="w-12 h-12 mb-2" />
                              <p className="text-sm">Cliquer "Traiter" pour charger</p>
                              {lead.latitude ? (
                                <p className="text-xs mt-1 text-slate-600">GPS: {lead.latitude.toFixed(4)}, {lead.longitude.toFixed(4)}</p>
                              ) : (
                                <p className="text-xs mt-1 text-red-400">Pas de coordonnées GPS</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* APRÈS — IA Piscine */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-green-400" />
                          <h4 className="font-semibold text-sm text-green-400">APRÈS — IA Piscine</h4>
                        </div>
                        <div className="aspect-square rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                          {lead.aiImage ? (
                            <img src={lead.aiImage} alt="IA Piscine" className="w-full h-full object-cover" />
                          ) : lead.status === 'ai_generating' ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-purple-400">
                              <Loader2 className="w-12 h-12 mb-2 animate-spin" />
                              <p className="text-sm">Génération IA en cours...</p>
                              <p className="text-xs mt-1 text-slate-500">Stability AI SDXL Inpainting</p>
                            </div>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                              <Sparkles className="w-12 h-12 mb-2" />
                              <p className="text-sm">{lead.satelliteImage ? 'Prêt pour génération IA' : 'En attente de satellite'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Property Details */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-slate-800 rounded p-3">
                        <p className="text-xs text-slate-400">Prix</p>
                        <p className="font-bold text-lg">{formatPrice(lead.prix)}</p>
                      </div>
                      <div className="bg-slate-800 rounded p-3">
                        <p className="text-xs text-slate-400">Terrain</p>
                        <p className="font-bold text-lg">{lead.surface_terrain}m²</p>
                      </div>
                      <div className="bg-slate-800 rounded p-3">
                        <p className="text-xs text-slate-400">Ville</p>
                        <p className="font-bold text-sm">{lead.ville}</p>
                      </div>
                      <div className="bg-slate-800 rounded p-3">
                        <p className="text-xs text-slate-400">Date vente</p>
                        <p className="font-bold text-sm">
                          {lead.date_mutation ? new Date(lead.date_mutation).toLocaleDateString('fr-FR') : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Full pipeline action */}
                    {lead.status === 'idle' && (
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => fetchSatellite(lead)}
                          disabled={isProcessing}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg font-medium flex items-center justify-center gap-2"
                        >
                          <Satellite className="w-4 h-4" /> Satellite seul
                        </button>
                        <button
                          onClick={() => processLead(lead)}
                          disabled={isProcessing}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" /> Pipeline complet (Satellite + IA)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {leads.length === 0 && !loading && (
        <Card>
          <CardContent className="py-16 text-center">
            <Satellite className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun lead scanné</h3>
            <p className="text-slate-400 mb-6">
              Sélectionnez une commune et lancez le scan pour trouver des propriétés sans piscine
            </p>
            <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1"><Search className="w-4 h-4" /> Scanner DVF</span>
              <span>→</span>
              <span className="flex items-center gap-1"><Satellite className="w-4 h-4" /> Image satellite</span>
              <span>→</span>
              <span className="flex items-center gap-1"><Sparkles className="w-4 h-4" /> IA piscine</span>
              <span>→</span>
              <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> Email perso</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
