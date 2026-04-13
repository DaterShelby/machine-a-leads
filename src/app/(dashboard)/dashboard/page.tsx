"use client";

import { useState, useEffect } from "react";
import { BarChart3, Users, Megaphone, TrendingUp, Search, Loader2 } from "lucide-react";
import { StatsCard } from "@/components/shared/stats-card";
import { DataTable } from "@/components/shared/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Property {
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

interface Stats {
  total_properties: number;
  average_price: number;
  min_price: number;
  max_price: number;
}

// Communes IDF par défaut — Val-d'Oise prioritaire
const IDF_DEFAULT_COMMUNES = [
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
  { label: "Sarcelles (95)", value: "95585" },
  { label: "L'Isle-Adam (95)", value: "95351" },
  { label: "Montmorency (95)", value: "95394" },
  { label: "Rueil-Malmaison (92)", value: "92062" },
  { label: "Nanterre (92)", value: "92049" },
  { label: "Saint-Cloud (92)", value: "92064" },
  { label: "Noisy-le-Grand (93)", value: "93051" },
  { label: "Livry-Gargan (93)", value: "93046" },
  { label: "Gagny (93)", value: "93032" },
  { label: "Méru (60)", value: "60395" },
];

export default function DashboardPage() {
  const [codeInsee, setCodeInsee] = useState("95203");
  const [prixMin, setPrixMin] = useState("500000");
  const [prixMax, setPrixMax] = useState("1200000");
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_properties: 0,
    average_price: 0,
    min_price: 0,
    max_price: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ajuster les prix automatiquement pour Méru
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

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/dvf/search?code_insee=${codeInsee}&prix_min=${prixMin}&prix_max=${prixMax}&limit=50`
      );

      if (!response.ok) throw new Error("Failed to fetch properties");

      const data = await response.json();
      setProperties(data.data || []);

      // Calculer les stats
      if (data.data && data.data.length > 0) {
        const prices = data.data.map((p: Property) => p.prix).filter((p: number) => p > 0);
        setStats({
          total_properties: data.data.length,
          average_price: prices.length > 0 ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length) : 0,
          min_price: Math.min(...prices),
          max_price: Math.max(...prices),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching data");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  const statCards = [
    {
      icon: <Users className="w-6 h-6" />,
      label: "Propriétés trouvées",
      value: stats.total_properties.toString(),
      change: { percentage: 0, isPositive: true },
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      label: "Prix moyen",
      value: `${(stats.average_price / 1000).toFixed(0)}k€`,
      change: { percentage: 0, isPositive: true },
    },
    {
      icon: <Megaphone className="w-6 h-6" />,
      label: "Prix min",
      value: `${(stats.min_price / 1000).toFixed(0)}k€`,
      change: { percentage: 0, isPositive: true },
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      label: "Prix max",
      value: `${(stats.max_price / 1000).toFixed(0)}k€`,
      change: { percentage: 0, isPositive: true },
    },
  ];

  const columns = [
    { key: "adresse", label: "Adresse" },
    { key: "ville", label: "Ville" },
    { key: "code_postal", label: "CP" },
    { key: "prix", label: "Prix", render: (value: number) => `${(value / 1000).toFixed(0)}k€` },
    { key: "surface_terrain", label: "Surface" },
    {
      key: "date_mutation",
      label: "Date",
      render: (value: string) => {
        try {
          return new Date(value).toLocaleDateString("fr-FR");
        } catch {
          return value;
        }
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Recherche DVF</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Commune (Île-de-France)</label>
              <select
                value={codeInsee}
                onChange={(e) => handleCommuneChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {IDF_DEFAULT_COMMUNES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
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
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Scanner
              </button>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <StatsCard key={idx} {...stat} />
        ))}
      </div>

      {/* Results Table */}
      {properties.length > 0 ? (
        <DataTable columns={columns} data={properties} emptyMessage="Aucun résultat" />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-slate-400">
            {loading ? "Chargement..." : "Aucune propriété trouvée. Ajustez vos critères de recherche."}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
