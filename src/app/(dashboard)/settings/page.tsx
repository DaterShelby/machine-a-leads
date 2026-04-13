'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Copy, Check, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: 'Company Name',
    email: 'contact@company.fr',
    company: 'Machine a Leads SARL',
    phone: '+33 1 23 45 67 89',
  })
  const [apiKeys, setApiKeys] = useState({
    stabilityAI: '',
    googleMaps: '',
    brevo: '',
  })
  const [targetingParams, setTargetingParams] = useState({
    prixMin: 300000,
    prixMax: 2000000,
    surfaceMin: 200,
    departments: '06,13,83,84',
  })
  const [emailSettings, setEmailSettings] = useState({
    senderName: 'Machine à Leads',
    senderEmail: 'contact@machinealeads.fr',
    defaultSubject: 'Transformez votre propriété avec nos experts',
  })
  const [testingStatus, setTestingStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({
    googleMaps: 'idle',
    stabilityAI: 'idle',
    brevo: 'idle',
  })
  const [notifications, setNotifications] = useState({
    emailCampaignStarted: true,
    emailCampaignCompleted: true,
    emailErrorNotifications: true,
    emailDailyDigest: false,
    emailWeeklyReport: true,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const togglePasswordVisibility = (key: string) => {
    setShowPassword((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleTestConnection = async (provider: string) => {
    setTestingStatus(prev => ({ ...prev, [provider]: 'testing' }))
    // Simuler un test de connexion
    await new Promise(resolve => setTimeout(resolve, 1500))
    const hasKey = apiKeys[provider as keyof typeof apiKeys]
    setTestingStatus(prev => ({ ...prev, [provider]: hasKey ? 'success' : 'error' }))
  }

  const handleSaveSettings = () => {
    // Sauvegarder dans localStorage pour la démo
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys))
    localStorage.setItem('targetingParams', JSON.stringify(targetingParams))
    localStorage.setItem('emailSettings', JSON.stringify(emailSettings))
    alert('Paramètres sauvegardés!')
  }

  const tabs = [
    { id: 'profile', label: 'Profil' },
    { id: 'api', label: 'Clés API' },
    { id: 'targeting', label: 'Ciblage' },
    { id: 'email', label: 'Email' },
    { id: 'notifications', label: 'Notifications' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-slate-400 mt-2">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your personal and company details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
                Save Changes
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-300">
              Les clés API sont stockées localement pour cette démo. En production, elles seraient chiffrées et stockées de manière sécurisée.
            </p>
          </div>

          {Object.entries(apiKeys).map(([key, value]) => {
            const labels: Record<string, string> = {
              stabilityAI: 'Clé Stability AI',
              googleMaps: 'Clé Google Maps API',
              brevo: 'Clé API Brevo',
            }

            const descriptions: Record<string, string> = {
              stabilityAI: 'Utilisée pour la génération d\'images IA',
              googleMaps: 'Utilisée pour les images satellites et services de localisation',
              brevo: 'Utilisée pour l\'envoi d\'emails et gestion des campagnes',
            }

            const testStatus = testingStatus[key];

            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="text-lg">{labels[key]}</CardTitle>
                  <CardDescription>{descriptions[key]}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <input
                      type={showPassword[key] ? 'text' : 'password'}
                      value={value}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={`Entrez votre ${labels[key]}`}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm pr-20"
                    />
                    <button
                      onClick={() => togglePasswordVisibility(key)}
                      className="absolute right-12 top-2.5 p-1 text-slate-400 hover:text-white"
                    >
                      {showPassword[key] ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                    {value && (
                      <button
                        onClick={() => copyToClipboard(key, value)}
                        className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-white"
                      >
                        {copiedKey === key ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleTestConnection(key)}
                    disabled={!value || testStatus === 'testing'}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 ${
                      testStatus === 'success' ? 'bg-green-600 hover:bg-green-700' :
                      testStatus === 'error' ? 'bg-red-600 hover:bg-red-700' :
                      'bg-slate-800 hover:bg-slate-700 disabled:bg-slate-700 disabled:opacity-50'
                    }`}
                  >
                    {testStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {testStatus === 'success' && <CheckCircle className="w-4 h-4" />}
                    {testStatus === 'error' && <AlertCircle className="w-4 h-4" />}
                    {testStatus === 'testing' ? 'Test en cours...' :
                     testStatus === 'success' ? 'Connexion OK' :
                     testStatus === 'error' ? 'Erreur' :
                     'Tester la connexion'}
                  </button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Targeting Tab */}
      {activeTab === 'targeting' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de ciblage</CardTitle>
              <CardDescription>Configurez les critères de sélection des propriétés</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Prix minimum (€)</label>
                  <input
                    type="number"
                    value={targetingParams.prixMin}
                    onChange={(e) => setTargetingParams(prev => ({ ...prev, prixMin: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Prix maximum (€)</label>
                  <input
                    type="number"
                    value={targetingParams.prixMax}
                    onChange={(e) => setTargetingParams(prev => ({ ...prev, prixMax: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Surface terrain minimum (m²)</label>
                <input
                  type="number"
                  value={targetingParams.surfaceMin}
                  onChange={(e) => setTargetingParams(prev => ({ ...prev, surfaceMin: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Départements (codes séparés par des virgules)</label>
                <input
                  type="text"
                  value={targetingParams.departments}
                  onChange={(e) => setTargetingParams(prev => ({ ...prev, departments: e.target.value }))}
                  placeholder="06,13,83,84"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                Enregistrer les paramètres
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres d\'email</CardTitle>
              <CardDescription>Configuration des emails de campagne</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom de l\'expéditeur</label>
                <input
                  type="text"
                  value={emailSettings.senderName}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, senderName: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email de l\'expéditeur</label>
                <input
                  type="email"
                  value={emailSettings.senderEmail}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, senderEmail: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Objet par défaut</label>
                <input
                  type="text"
                  value={emailSettings.defaultSubject}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, defaultSubject: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                Enregistrer les paramètres
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Control which emails you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: 'emailCampaignStarted',
                  label: 'Campaign Started',
                  description: 'Notify me when a campaign starts',
                },
                {
                  key: 'emailCampaignCompleted',
                  label: 'Campaign Completed',
                  description: 'Notify me when a campaign completes',
                },
                {
                  key: 'emailErrorNotifications',
                  label: 'Error Notifications',
                  description: 'Alert me of processing errors',
                },
                {
                  key: 'emailDailyDigest',
                  label: 'Daily Digest',
                  description: 'Receive a daily summary of activity',
                },
                {
                  key: 'emailWeeklyReport',
                  label: 'Weekly Report',
                  description: 'Receive a weekly performance report',
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-3 border-b border-slate-700 last:border-b-0"
                >
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-slate-400">{item.description}</p>
                  </div>
                  <button
                    onClick={() =>
                      toggleNotification(
                        item.key as keyof typeof notifications
                      )
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications[item.key as keyof typeof notifications]
                        ? 'bg-blue-600'
                        : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications[item.key as keyof typeof notifications]
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>Manage your billing and subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border border-blue-500/30 rounded-lg bg-blue-500/5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-400">Current Plan</p>
                    <p className="text-2xl font-bold">Professional</p>
                  </div>
                  <span className="px-3 py-1 rounded text-sm font-medium bg-blue-500/20 text-blue-300">
                    Active
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-300">
                    <span className="text-slate-400">Monthly Cost:</span> 299 EUR
                  </p>
                  <p className="text-slate-300">
                    <span className="text-slate-400">Renewal Date:</span> April 13, 2024
                  </p>
                  <p className="text-slate-300">
                    <span className="text-slate-400">Status:</span> Paid
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Plan Features</h3>
                <div className="space-y-2">
                  {[
                    'Unlimited campaigns',
                    '100,000 leads per month',
                    'All verticals included',
                    'Priority support',
                    'Custom templates',
                    'Advanced analytics',
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button className="px-6 py-2 border border-slate-700 hover:border-slate-600 rounded-lg font-medium transition-colors">
                  Change Plan
                </button>
                <button className="px-6 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 rounded-lg font-medium transition-colors text-red-400">
                  Cancel Subscription
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>Your recent invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: 'Mar 13, 2024', amount: '299 EUR', status: 'Paid' },
                  { date: 'Feb 13, 2024', amount: '299 EUR', status: 'Paid' },
                  { date: 'Jan 13, 2024', amount: '299 EUR', status: 'Paid' },
                ].map((invoice, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-3 border-b border-slate-700 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium">{invoice.date}</p>
                      <p className="text-sm text-slate-400">Invoice</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{invoice.amount}</p>
                      <p className="text-sm text-green-400">{invoice.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
