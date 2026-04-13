'use client'

import { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Search, Loader2, Satellite, Sparkles, Mail, MapPin,
  Euro, Maximize, ChevronDown, ChevronUp, Play, Zap, Eye, ArrowRight
} from 'lucide-react'

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
  { label: "Eaubonne (95)", value: "95210" },
  { label: "Sarcelles (95)", value: "95585" },
  { label: "Soisy-sous-Montmorency (95)", value: "95563" },
  { label: "Rueil-Malmaison (92)", value: "92062" },
  { label: "Saint-Cloud (92)", value: "92064" },
  { label: "Meudon (92)", value: "92048" },
  { label: "Noisy-le-Grand (93)", value: "93051" },
  { label: "Gagny (93)", value: "93032" },
  { label: "Livry-Gargan (93)", value: "93046" },
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

type LeadStatus = 'idle' | 'loading_satellite' | 'satellite_ok' | 'loading_ai' | 'ai_ok' | 'email_sent';

interface LeadCard extends Property {
  status: LeadStatus;
  satelliteImage?: string;
  aiImage?: string;
}

/**
 * Génère une image "APRÈS" avec piscine superposée sur l'image satellite
 * 100% côté client via Canvas — GRATUIT, instantané, sans API
 */
function generatePoolOverlay(satelliteBase64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject('Canvas not supported'); return; }

      // Dessiner l'image satellite d'origine
      ctx.drawImage(img, 0, 0);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      // Piscine 10m x 5m ≈ 110px x 60px à zoom 19
      const poolW = 110;
      const poolH = 60;
      const deckPad = 12; // margelle
      const radius = 8;
      const poolX = cx - poolW / 2;
      const poolY = cy - poolH / 2;
      const deckX = poolX - deckPad;
      const deckY = poolY - deckPad;
      const deckW = poolW + deckPad * 2;
      const deckH = poolH + deckPad * 2;

      // === OMBRE portée ===
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = 'rgba(0,0,0,0.01)';
      roundRect(ctx, deckX, deckY, deckW, deckH, radius + 4);
      ctx.fill();
      ctx.restore();

      // === TERRASSE / MARGELLE (beige pierre) ===
      ctx.save();
      const deckGrad = ctx.createLinearGradient(deckX, deckY, deckX + deckW, deckY + deckH);
      deckGrad.addColorStop(0, '#d4c5a9');
      deckGrad.addColorStop(0.5, '#c9b896');
      deckGrad.addColorStop(1, '#bfad87');
      ctx.fillStyle = deckGrad;
      roundRect(ctx, deckX, deckY, deckW, deckH, radius + 4);
      ctx.fill();
      // Texture légère de la margelle
      ctx.strokeStyle = 'rgba(160, 140, 100, 0.3)';
      ctx.lineWidth = 0.5;
      for (let i = deckY; i < deckY + deckH; i += 8) {
        ctx.beginPath();
        ctx.moveTo(deckX + 2, i);
        ctx.lineTo(deckX + deckW - 2, i);
        ctx.stroke();
      }
      ctx.restore();

      // === PISCINE (eau turquoise) ===
      ctx.save();
      const waterGrad = ctx.createRadialGradient(
        cx, cy, 5,
        cx, cy, poolW * 0.7
      );
      waterGrad.addColorStop(0, 'rgba(0, 200, 220, 0.92)');
      waterGrad.addColorStop(0.3, 'rgba(0, 170, 200, 0.90)');
      waterGrad.addColorStop(0.7, 'rgba(0, 130, 170, 0.88)');
      waterGrad.addColorStop(1, 'rgba(0, 100, 150, 0.85)');
      ctx.fillStyle = waterGrad;
      roundRect(ctx, poolX, poolY, poolW, poolH, radius);
      ctx.fill();

      // Reflets d'eau
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#ffffff';
      // Reflet principal diagonal
      ctx.beginPath();
      ctx.ellipse(cx - 15, cy - 10, 30, 6, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // Petit reflet
      ctx.beginPath();
      ctx.ellipse(cx + 20, cy + 8, 15, 3, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Bordure intérieure de la piscine
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, poolX + 2, poolY + 2, poolW - 4, poolH - 4, radius - 2);
      ctx.stroke();
      ctx.restore();

      // === TRANSATS (2 petits rectangles) ===
      ctx.save();
      // Transat 1
      ctx.fillStyle = '#e8dcc8';
      ctx.fillRect(deckX + deckW + 5, cy - 20, 6, 18);
      ctx.fillStyle = '#d4c5a9';
      ctx.fillRect(deckX + deckW + 4, cy - 22, 8, 4);
      // Transat 2
      ctx.fillStyle = '#e8dcc8';
      ctx.fillRect(deckX + deckW + 5, cy + 4, 6, 18);
      ctx.fillStyle = '#d4c5a9';
      ctx.fillRect(deckX + deckW + 4, cy + 2, 8, 4);
      ctx.restore();

      // === LABEL "PISCINE 10x5m" ===
      // (pas de label sur l'image elle-même, ça sera dans l'UI)

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject('Failed to load satellite image');
    img.src = satelliteBase64;
  });
}

/** Utilitaire : rectangle arrondi */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
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
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [aiMode, setAiMode] = useState<'local' | 'api'>('local'); // local = gratuit Canvas, api = fal.ai/Stability

  const handleCommuneChange = (v: string) => {
    setCodeInsee(v);
    if (v === "60395") { setPrixMin("200000"); setPrixMax("600000"); }
    else { setPrixMin("500000"); setPrixMax("1200000"); }
  };

  // ─── STEP 1: Scanner DVF ──────────────────────────
  const handleScan = async () => {
    setLoading(true); setError(null); setLeads([]);
    try {
      const resp = await fetch(`/api/dvf/search?code_insee=${codeInsee}&prix_min=${prixMin}&prix_max=${prixMax}&limit=30`);
      if (!resp.ok) throw new Error("Erreur DVF");
      const data = await resp.json();
      const newLeads: LeadCard[] = (data.data || [])
        .filter((p: Property) => p.latitude && p.longitude && p.latitude !== 0)
        .map((p: Property) => ({ ...p, status: 'idle' as const }));
      setLeads(newLeads);
      if (newLeads.length > 0) setExpandedLead(newLeads[0].id);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  // ─── STEP 2+3: Pipeline complet (satellite + piscine) ──
  const processLead = async (leadId: string, lat: number, lon: number) => {
    setProcessingId(leadId);
    setExpandedLead(leadId);

    // SATELLITE
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'loading_satellite' } : l));
    try {
      const satResp = await fetch(`/api/satellite?lat=${lat}&lon=${lon}&zoom=19`);
      if (!satResp.ok) {
        const errData = await satResp.json().catch(() => ({}));
        throw new Error(errData.error || `Erreur satellite ${satResp.status}`);
      }
      const satData = await satResp.json();
      const satUrl = `data:${satData.content_type};base64,${satData.image_base64}`;

      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'loading_ai', satelliteImage: satUrl } : l));

      // GÉNÉRATION PISCINE
      let aiImageUrl: string;

      if (aiMode === 'local') {
        // MODE GRATUIT: overlay Canvas côté client
        aiImageUrl = await generatePoolOverlay(satUrl);
      } else {
        // MODE API: fal.ai ou Stability AI (côté serveur)
        const aiResp = await fetch('/api/generate-pool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: satData.image_base64 }),
        });
        if (!aiResp.ok) {
          const errData = await aiResp.json().catch(() => ({}));
          console.error('AI Error:', errData);
          throw new Error(errData.error || `Erreur IA ${aiResp.status}`);
        }
        const aiData = await aiResp.json();
        aiImageUrl = `data:${aiData.content_type};base64,${aiData.image_base64}`;
      }

      setLeads(prev => prev.map(l => l.id === leadId
        ? { ...l, status: 'ai_ok', aiImage: aiImageUrl }
        : l
      ));
    } catch (err: any) {
      console.error('Pipeline error:', err);
      setLeads(prev => prev.map(l => l.id === leadId
        ? { ...l, status: l.satelliteImage ? 'satellite_ok' : 'idle' }
        : l
      ));
      setError(err.message || 'Erreur pipeline');
    } finally {
      setProcessingId(null);
    }
  };

  // ─── BATCH: Traiter les 3 premiers ────────────────
  const processBatch = async () => {
    setBatchProcessing(true);
    const toProcess = leads.filter(l => l.status === 'idle' && l.latitude && l.longitude).slice(0, 3);
    for (const lead of toProcess) {
      await processLead(lead.id, lead.latitude, lead.longitude);
    }
    setBatchProcessing(false);
  };

  const fmt = (p: number) => p >= 1000000 ? `${(p/1e6).toFixed(2)}M€` : `${(p/1000).toFixed(0)}k€`;

  const statusConfig: Record<LeadStatus, { color: string; icon: string; label: string }> = {
    idle: { color: 'bg-slate-700 text-slate-300', icon: '⬜', label: 'Non traité' },
    loading_satellite: { color: 'bg-yellow-900 text-yellow-300', icon: '🛰️', label: 'Satellite...' },
    satellite_ok: { color: 'bg-blue-900 text-blue-300', icon: '🛰️', label: 'Satellite OK' },
    loading_ai: { color: 'bg-purple-900 text-purple-300', icon: '🎨', label: 'Piscine en cours...' },
    ai_ok: { color: 'bg-green-900 text-green-300', icon: '✅', label: 'Prêt à envoyer' },
    email_sent: { color: 'bg-emerald-900 text-emerald-300', icon: '📧', label: 'Email envoyé' },
  };

  const stats = {
    total: leads.length,
    withGps: leads.filter(l => l.latitude && l.longitude).length,
    satellite: leads.filter(l => l.satelliteImage).length,
    aiDone: leads.filter(l => l.aiImage).length,
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Machine à Leads Piscine
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            DVF → Satellite → Projection Piscine → Email personnalisé
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Mode toggle */}
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setAiMode('local')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                aiMode === 'local' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Gratuit
            </button>
            <button
              onClick={() => setAiMode('api')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                aiMode === 'api' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              IA Pro
            </button>
          </div>

          {leads.length > 0 && !batchProcessing && leads.some(l => l.status === 'idle') && (
            <button onClick={processBatch}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20">
              <Zap className="w-4 h-4" /> Traiter les 3 premiers
            </button>
          )}
          {batchProcessing && (
            <div className="px-4 py-2 bg-purple-900/50 border border-purple-700 rounded-lg text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> Pipeline en cours...
            </div>
          )}
        </div>
      </div>

      {/* ── PIPELINE VISUEL ── */}
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 rounded-lg p-3">
        <span className="flex items-center gap-1 text-blue-400"><Search className="w-3.5 h-3.5" /> 1. Scanner DVF</span>
        <ArrowRight className="w-3 h-3" />
        <span className="flex items-center gap-1 text-yellow-400"><Satellite className="w-3.5 h-3.5" /> 2. Image satellite</span>
        <ArrowRight className="w-3 h-3" />
        <span className="flex items-center gap-1 text-purple-400">
          <Sparkles className="w-3.5 h-3.5" /> 3. Piscine {aiMode === 'local' ? '(gratuit)' : '(IA Pro)'}
        </span>
        <ArrowRight className="w-3 h-3" />
        <span className="flex items-center gap-1 text-green-400"><Mail className="w-3.5 h-3.5" /> 4. Email perso</span>
      </div>

      {/* ── SCANNER ── */}
      <Card className="border-blue-900/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1">Commune</label>
              <select value={codeInsee} onChange={(e) => handleCommuneChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:border-blue-500 focus:outline-none">
                {IDF_COMMUNES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-slate-400 mb-1">Prix min</label>
              <input type="text" value={prixMin} onChange={(e) => setPrixMin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-slate-400 mb-1">Prix max</label>
              <input type="text" value={prixMax} onChange={(e) => setPrixMax(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <button onClick={handleScan} disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Scanner DVF
            </button>
          </div>
          {error && <p className="mt-2 text-red-400 text-xs">{error}</p>}
        </CardContent>
      </Card>

      {/* ── STATS ── */}
      {leads.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { n: stats.total, label: 'Propriétés', color: 'text-blue-400' },
            { n: stats.withGps, label: 'Avec GPS', color: 'text-yellow-400' },
            { n: stats.satellite, label: 'Satellites', color: 'text-cyan-400' },
            { n: stats.aiDone, label: 'Piscines', color: 'text-green-400' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-800/80 rounded-lg p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.n}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── LEAD CARDS ── */}
      <div className="space-y-3">
        {leads.map((lead, idx) => {
          const isExpanded = expandedLead === lead.id;
          const isProcessing = processingId === lead.id;
          const sc = statusConfig[lead.status];
          const hasCoords = lead.latitude && lead.longitude;

          return (
            <div key={lead.id} className={`rounded-xl border transition-all ${isExpanded ? 'border-blue-700 bg-slate-900' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}>
              {/* ── ROW ── */}
              <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setExpandedLead(isExpanded ? null : lead.id)}>
                {/* Numéro */}
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">
                  {idx + 1}
                </div>

                {/* Miniature satellite */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                  {lead.satelliteImage
                    ? <img src={lead.satelliteImage} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Satellite className="w-5 h-5 text-slate-600" /></div>
                  }
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{lead.adresse || 'Adresse NC'}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span>{lead.ville}</span>
                    <span className="font-semibold text-white">{fmt(lead.prix)}</span>
                    <span>{lead.surface_terrain}m²</span>
                  </div>
                </div>

                {/* Status */}
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${sc.color}`}>
                  {sc.icon} {sc.label}
                </span>

                {/* CTA */}
                {lead.status === 'idle' && hasCoords && !isProcessing && (
                  <button onClick={(e) => { e.stopPropagation(); processLead(lead.id, lead.latitude, lead.longitude); }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap">
                    <Play className="w-3 h-3" /> Traiter
                  </button>
                )}
                {(lead.status === 'loading_satellite' || lead.status === 'loading_ai') && (
                  <Loader2 className="w-5 h-5 animate-spin text-purple-400 flex-shrink-0" />
                )}

                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </div>

              {/* ── EXPANDED: AVANT / APRÈS ── */}
              {isExpanded && (
                <div className="border-t border-slate-800 p-4">
                  {/* Images side by side */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* AVANT */}
                    <div>
                      <p className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-1">
                        <Satellite className="w-3.5 h-3.5" /> AVANT — Vue satellite
                      </p>
                      <div className="aspect-square rounded-xl overflow-hidden bg-slate-800 border border-slate-700 relative">
                        {lead.satelliteImage ? (
                          <img src={lead.satelliteImage} alt="Satellite" className="w-full h-full object-cover" />
                        ) : lead.status === 'loading_satellite' ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-400 mb-2" />
                            <p className="text-xs text-blue-300">Chargement satellite...</p>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                            <Satellite className="w-10 h-10 mb-2" />
                            <p className="text-xs">
                              {hasCoords ? 'Cliquez "Traiter" ci-dessus' : 'Pas de coordonnées GPS'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* APRÈS */}
                    <div>
                      <p className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> APRÈS — Projection piscine
                      </p>
                      <div className="aspect-square rounded-xl overflow-hidden bg-slate-800 border border-slate-700 relative">
                        {lead.aiImage ? (
                          <>
                            <img src={lead.aiImage} alt="Piscine" className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2 px-2 py-1 bg-green-600/90 rounded text-[10px] font-bold">
                              + PISCINE 10×5m
                            </div>
                          </>
                        ) : lead.status === 'loading_ai' ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/90">
                            <Loader2 className="w-10 h-10 animate-spin text-purple-400 mb-2" />
                            <p className="text-xs text-purple-300">Génération piscine...</p>
                            <p className="text-[10px] text-slate-500 mt-1">
                              {aiMode === 'local' ? 'Mode gratuit (Canvas)' : 'IA Pro (fal.ai)'}
                            </p>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                            <Sparkles className="w-10 h-10 mb-2" />
                            <p className="text-xs">En attente du satellite</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Infos property */}
                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <div className="bg-slate-800 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-slate-500">Prix</p>
                      <p className="font-bold text-sm">{fmt(lead.prix)}</p>
                    </div>
                    <div className="bg-slate-800 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-slate-500">Terrain</p>
                      <p className="font-bold text-sm">{lead.surface_terrain}m²</p>
                    </div>
                    <div className="bg-slate-800 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-slate-500">Commune</p>
                      <p className="font-bold text-sm">{lead.ville}</p>
                    </div>
                    <div className="bg-slate-800 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-slate-500">GPS</p>
                      <p className="font-bold text-sm text-slate-400">{lead.latitude?.toFixed(4)}, {lead.longitude?.toFixed(4)}</p>
                    </div>

                    {/* Action buttons */}
                    <div className="ml-auto flex gap-2">
                      {lead.status === 'idle' && hasCoords && (
                        <button onClick={() => processLead(lead.id, lead.latitude, lead.longitude)} disabled={!!processingId}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20">
                          <Zap className="w-4 h-4" /> Lancer le pipeline
                        </button>
                      )}
                      {lead.status === 'ai_ok' && (
                        <button className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4" /> Envoyer l'email
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── EMPTY STATE ── */}
      {leads.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800 mb-4">
            <Satellite className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Lancez votre premier scan</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            Sélectionnez une commune d'Île-de-France ci-dessus et cliquez "Scanner DVF" pour trouver les propriétés avec grand terrain, idéales pour une piscine.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Données DVF publiques</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Google Maps satellite</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Projection piscine</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Email Brevo</span>
          </div>
        </div>
      )}
    </div>
  );
}
