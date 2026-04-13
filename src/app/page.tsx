"use client";

import Link from "next/link";
import { ArrowRight, Zap, Palette, Cpu, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  const features = [
    {
      icon: Cpu,
      title: "Multi-Vertical",
      description: "Identifiez les propriétaires dans 8 secteurs différents",
      stat: "8 secteurs couverts",
    },
    {
      icon: Palette,
      title: "IA Generative",
      description: "Générez des visuels avant/après automatiquement",
      stat: "Visuels instantanés",
    },
    {
      icon: Zap,
      title: "Automatisé",
      description: "Pipeline complet d'identification à conversion",
      stat: "100% automatisé",
    },
  ];

  const stats = [
    { label: "Propriétés/jour", value: "2000+" },
    { label: "Verticaux", value: "8" },
    { label: "Taux d'ouverture", value: "25%+" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            ML
          </div>
          <div className="space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="default">
                Connexion
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="default" className="bg-blue-600 hover:bg-blue-700">
                Accès Démo
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center space-y-8">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Générez des leads
            </span>
            <br />
            qualifiés par IA
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            La plateforme qui identifie les propriétaires, génère des visuels
            avant/après par IA, et vous connecte avec des prospects qualifiés
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6"
              >
                Accéder au Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="border-slate-600 hover:border-slate-400 text-lg px-8 py-6"
              >
                Voir la démo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-slate-800/50 bg-gradient-to-r from-slate-900/50 to-blue-900/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">Pourquoi Machine a Leads?</h2>
        <p className="text-center text-slate-400 mb-16 max-w-2xl mx-auto">
          Trois piliers pour transformer votre prospection
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card
                key={idx}
                className="bg-slate-900/50 border-slate-800 hover:border-blue-600/50 transition-colors"
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-blue-600/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-slate-400">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-semibold text-blue-400">
                    {feature.stat}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 p-12 md:p-20">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/10 rounded-full -mr-40 -mt-40" />
          <div className="relative z-10 text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Prêt à transformer votre prospection?
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Rejoignez les entreprises qui génèrent des leads qualifiés en
              automatique
            </p>
            <div className="pt-4">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-slate-100 text-lg px-8 py-6"
                >
                  Accéder au Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-4 md:mb-0">
              ML
            </div>
            <p className="text-slate-400 text-sm">
              © 2024 Machine a Leads. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
