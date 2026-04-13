'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, CheckCircle, AlertCircle, Clock, Search, Satellite, Sparkles, Mail, BarChart3, ArrowRight } from 'lucide-react'

interface PipelineStep {
  id: string;
  emoji: string;
  name: string;
  description: string;
  status: 'functional' | 'missing_key' | 'unconfigured';
  count?: number;
  requirement?: string;
}

const pipelineSteps: PipelineStep[] = [
  {
    id: 'scraping',
    emoji: '🔍',
    name: 'Scraping DVF',
    description: 'Récupération des données immobilières',
    status: 'functional',
    count: 156,
  },
  {
    id: 'filtering',
    emoji: '🎯',
    name: 'Filtrage',
    description: 'Propriétés qualifiées selon critères',
    status: 'functional',
    count: 142,
  },
  {
    id: 'satellite',
    emoji: '🛰️',
    name: 'Image Satellite',
    description: 'Capture des images de localisation',
    status: 'missing_key',
    requirement: 'Clé Google Maps API',
  },
  {
    id: 'ai',
    emoji: '🎨',
    name: 'Génération IA',
    description: 'Génération d\'images avant/après',
    status: 'missing_key',
    requirement: 'Clé Stability AI',
  },
  {
    id: 'email',
    emoji: '📧',
    name: 'Email',
    description: 'Envoi des campagnes email',
    status: 'missing_key',
    requirement: 'Clé Brevo API',
  },
  {
    id: 'follow_up',
    emoji: '🔄',
    name: 'Suivi',
    description: 'Tracking et suivi des interactions',
    status: 'functional',
  },
];

const mockJobs = [
  {
    id: 'job_001',
    campaign: 'Piscines Cote d\'Azur',
    type: 'collection',
    status: 'completed',
    progress: 100,
    started: '2024-03-13 08:30',
    completed: '2024-03-13 10:15',
    itemsProcessed: 452,
  },
  {
    id: 'job_002',
    campaign: 'Piscines Cote d\'Azur',
    type: 'satellite',
    status: 'completed',
    progress: 100,
    started: '2024-03-13 10:16',
    completed: '2024-03-13 11:45',
    itemsProcessed: 445,
  },
  {
    id: 'job_003',
    campaign: 'Piscines Cote d\'Azur',
    type: 'ai',
    status: 'running',
    progress: 68,
    started: '2024-03-13 11:46',
    itemsProcessed: 305,
  },
  {
    id: 'job_004',
    campaign: 'Piscines Cote d\'Azur',
    type: 'email',
    status: 'pending',
    progress: 0,
    started: null,
    itemsProcessed: 0,
  },
  {
    id: 'job_005',
    campaign: 'Panneaux Solaires - Provence',
    type: 'collection',
    status: 'completed',
    progress: 100,
    started: '2024-03-12 15:20',
    completed: '2024-03-12 17:30',
    itemsProcessed: 389,
  },
  {
    id: 'job_006',
    campaign: 'Panneaux Solaires - Provence',
    type: 'satellite',
    status: 'completed',
    progress: 100,
    started: '2024-03-12 17:31',
    completed: '2024-03-12 19:00',
    itemsProcessed: 389,
  },
]

const typeLabels = {
  collection: 'Data Collection',
  satellite: 'Satellite Images',
  ai: 'AI Generation',
  email: 'Email Campaign',
}

const statusConfig = {
  pending: { bg: 'bg-slate-600', label: 'Pending', icon: Clock },
  running: { bg: 'bg-blue-600', label: 'Running', icon: Zap },
  completed: { bg: 'bg-green-600', label: 'Completed', icon: CheckCircle },
  failed: { bg: 'bg-red-600', label: 'Failed', icon: AlertCircle },
}

export default function PipelinePage() {
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  const activeJobs = mockJobs.filter((j) => j.status !== 'completed')
  const completedJobs = mockJobs.filter((j) => j.status === 'completed')

  const getStatusIcon = (status: PipelineStep['status']) => {
    switch (status) {
      case 'functional':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'missing_key':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'unconfigured':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const getStatusLabel = (status: PipelineStep['status']) => {
    switch (status) {
      case 'functional':
        return 'Fonctionnel';
      case 'missing_key':
        return 'Clé manquante';
      case 'unconfigured':
        return 'Non configuré';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Pipeline de Traitement</h1>
        <p className="text-slate-400 mt-2">Pipeline de transformation des données immobilières en prospects qualifiés</p>
      </div>

      {/* Pipeline Steps Visual */}
      <Card>
        <CardHeader>
          <CardTitle>Étapes du Pipeline</CardTitle>
          <CardDescription>Statut de chaque étape du processus de traitement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pipelineSteps.map((step, index) => (
              <div key={step.id}>
                <div
                  className="p-4 border border-slate-700 rounded-lg hover:border-slate-600 cursor-pointer transition-colors"
                  onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-3xl">{step.emoji}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{step.name}</h3>
                        <p className="text-sm text-slate-400">{step.description}</p>
                      </div>
                      {step.count !== undefined && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-400">{step.count}</p>
                          <p className="text-xs text-slate-400">éléments</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(step.status)}
                      <span className="text-sm font-medium text-slate-400">{getStatusLabel(step.status)}</span>
                    </div>
                  </div>

                  {expandedStep === step.id && step.requirement && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <p className="text-sm text-yellow-400">
                        {step.requirement}
                      </p>
                      <button className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">
                        Configurer la clé API
                      </button>
                    </div>
                  )}
                </div>

                {index < pipelineSteps.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowRight className="w-4 h-4 text-slate-600 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Jobs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Active Jobs</h2>
        {activeJobs.length > 0 ? (
          <div className="space-y-4">
            {activeJobs.map((job) => {
              const config = statusConfig[job.status as keyof typeof statusConfig]
              const StatusIcon = config.icon

              return (
                <Card key={job.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    {/* Job Header */}
                    <div
                      className="cursor-pointer"
                      onClick={() =>
                        setExpandedJob(expandedJob === job.id ? null : job.id)
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className={`w-3 h-3 rounded-full animate-pulse ${config.bg}`}
                            />
                            <h3 className="font-semibold">{job.campaign}</h3>
                          </div>
                          <p className="text-sm text-slate-400">
                            {typeLabels[job.type as keyof typeof typeLabels]}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {job.itemsProcessed} / {job.status === 'pending' ? '...' : job.itemsProcessed + (job.status === 'running' ? '+' : '')}
                            </p>
                            <p className="text-xs text-slate-400">{config.label}</p>
                          </div>
                          <StatusIcon className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium">Progress</span>
                          <span className="text-sm font-semibold">{job.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${config.bg}`}
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Timing */}
                      <div className="mt-3 text-xs text-slate-400">
                        <p>
                          Started:{' '}
                          {job.started ? new Date(job.started).toLocaleString('fr-FR') : 'Not started'}
                        </p>
                        {job.completed && (
                          <p>
                            Completed:{' '}
                            {new Date(job.completed).toLocaleString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedJob === job.id && (
                      <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
                        <div>
                          <p className="text-xs text-slate-400">Job ID</p>
                          <p className="text-sm font-mono">{job.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Status Details</p>
                          <p className="text-sm">
                            {job.status === 'pending' && 'Waiting to start'}
                            {job.status === 'running' && 'Processing items...'}
                            {job.status === 'completed' && 'Successfully completed'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-slate-400">
              No active jobs at the moment
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completed Jobs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Completed Jobs</h2>
        {completedJobs.length > 0 ? (
          <div className="space-y-3">
            {completedJobs.map((job) => {
              const config = statusConfig[job.status as keyof typeof statusConfig]

              return (
                <Card
                  key={job.id}
                  className="overflow-hidden hover:border-slate-600 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <h3 className="font-medium">{job.campaign}</h3>
                        </div>
                        <p className="text-sm text-slate-400">
                          {typeLabels[job.type as keyof typeof typeLabels]}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{job.itemsProcessed} items</p>
                        <p className="text-xs text-green-400">
                          {job.completed
                            ? new Date(job.completed).toLocaleDateString('fr-FR')
                            : ''}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-slate-400">
              No completed jobs yet
            </CardContent>
          </Card>
        )}
      </div>

      {/* Job Queue Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-400">Total Jobs</p>
              <p className="text-2xl font-bold">{mockJobs.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Active</p>
              <p className="text-2xl font-bold text-blue-400">{activeJobs.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Completed</p>
              <p className="text-2xl font-bold text-green-400">{completedJobs.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Success Rate</p>
              <p className="text-2xl font-bold text-emerald-400">100%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
