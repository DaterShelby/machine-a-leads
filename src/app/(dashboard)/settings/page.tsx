'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Copy, Check } from 'lucide-react'

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
    stabilityAI: 'sk-stability_abc123def456ghi789jkl...',
    googleMaps: 'AIzaSyBK3abCdEfGhIjKlMnOpQrStUvWxYz123abc...',
    brevo: 'xkeysib-1234567890abcdefghijklmnopq...',
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

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'api', label: 'API Keys' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'billing', label: 'Billing' },
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
          {Object.entries(apiKeys).map(([key, value]) => {
            const labels: Record<string, string> = {
              stabilityAI: 'Stability AI API Key',
              googleMaps: 'Google Maps API Key',
              brevo: 'Brevo (Sendinblue) API Key',
            }

            const descriptions: Record<string, string> = {
              stabilityAI: 'Used for AI image generation',
              googleMaps: 'Used for satellite imagery and location services',
              brevo: 'Used for email sending and campaign management',
            }

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
                      readOnly
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none font-mono text-sm pr-20"
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
                  </div>
                  <button className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors text-sm">
                    Regenerate Key
                  </button>
                </CardContent>
              </Card>
            )
          })}
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
