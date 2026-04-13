"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sectors = [
    { value: "pisciniste", label: "Pisciniste" },
    { value: "solaire", label: "Énergie Solaire" },
    { value: "paysagiste", label: "Paysagiste" },
    { value: "general", label: "Général" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!sector) {
      setError("Veuillez sélectionner un secteur");
      setLoading(false);
      return;
    }

    try {
      // TODO: Implement Supabase signUp
      console.log("Register attempt:", {
        name,
        email,
        password,
        companyName,
        sector,
      });
      // const { error } = await supabase.auth.signUp({
      //   email,
      //   password,
      //   options: {
      //     data: { name, companyName, sector }
      //   }
      // });
      // if (error) throw error;
      // Router push to dashboard or email verification page
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Créer un compte</CardTitle>
        <CardDescription>
          Inscrivez-vous à Machine a Leads
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Nom complet
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Jean Dupont"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="vous@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Mot de passe
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="company" className="text-sm font-medium">
              Nom de l'entreprise
            </label>
            <Input
              id="company"
              type="text"
              placeholder="Votre entreprise"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="sector" className="text-sm font-medium">
              Secteur d'activité
            </label>
            <Select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              disabled={loading}
              required
            >
              <option value="">Sélectionnez un secteur</option>
              {sectors.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Inscription..." : "S'inscrire"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-slate-400">Déjà inscrit? </span>
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Se connecter
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
