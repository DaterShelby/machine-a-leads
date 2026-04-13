'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronRight, ChevronLeft, Droplets, Sun, Palette, Home, Trees, Wrench, ParkingCircle, Shield } from 'lucide-react'

const verticals = [
  { id: 'piscine', name: 'Piscine', icon: Droplets },
  { id: 'solaire', name: 'Solaire', icon: Sun },
  { id: 'terrasse', name: 'Terrasse', icon: Palette },
  { id: 'veranda', name: 'Veranda', icon: Home },
  { id: 'paysager', name: 'Paysager', icon: Trees },
  { id: 'extension', name: 'Extension', icon: Wrench },
  { id: 'carport', name: 'Carport', icon: ParkingCircle },
  { id: 'cloture', name: 'Cloture', icon: Shield },
]

const emailTemplates = [
  {
    id: '1',
    name: 'Professional Offer',
    subject: 'Your Personalized {{vertical}} Solution',
    preview: 'Dear {{name}}, we\'ve crafted a custom {{vertical}} proposal for your property...',
  },
  {
    id: '2',
    name: 'Casual Inquiry',
    subject: 'Interested in {{vertical}} for your home?',
    preview: 'Hi {{name}}, we noticed your property might benefit from {{vertical}}...',
  },
  {
    id: '3',
    name: 'Limited Offer',
    subject: 'Special {{vertical}} Promotion - Limited Time',
    preview: 'Exclusive offer for {{name}}: Get 20% off your {{vertical}} installation this month...',
  },
]

export default function NewCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1
    name: '',
    description: '',
    vertical: '',
    // Step 2
    targetCities: '',
    minPrice: 100000,
    maxPrice: 1000000,
    minLandArea: 500,
    // Step 3
    template: '1',
    // Step 4 (review)
  })

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleVerticalSelect = (verticalId: string) => {
    setFormData((prev) => ({
      ...prev,
      vertical: verticalId,
    }))
  }

  const handleSliderChange = (name: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async () => {
    // In a real app, this would submit to an API
    console.log('Submitting campaign:', formData)
    router.push('/campaigns')
  }

  const selectedVertical = verticals.find((v) => v.id === formData.vertical)
  const selectedTemplate = emailTemplates.find((t) => t.id === formData.template)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Nouvelle Campagne</h1>
        <p className="text-slate-400 mt-2">Create a new lead generation campaign</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                s === step
                  ? 'bg-blue-600 text-white'
                  : s < step
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-slate-400'
              }`}
            >
              {s < step ? '✓' : s}
            </div>
            {s < 4 && (
              <div
                className={`w-12 h-1 mx-2 transition-colors ${
                  s < step ? 'bg-green-600' : 'bg-slate-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-between text-xs font-medium text-slate-400">
        <span>Basics</span>
        <span>Targeting</span>
        <span>Template</span>
        <span>Review</span>
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && 'Campaign Basics'}
            {step === 2 && 'Target Criteria'}
            {step === 3 && 'Select Template'}
            {step === 4 && 'Review & Launch'}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Provide basic information about your campaign'}
            {step === 2 && 'Define your target audience and criteria'}
            {step === 3 && 'Choose or create an email template'}
            {step === 4 && 'Review everything and launch your campaign'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Piscines Cote d'Azur"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your campaign objectives..."
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-4">Select Vertical</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {verticals.map((v) => {
                    const Icon = v.icon
                    return (
                      <button
                        key={v.id}
                        onClick={() => handleVerticalSelect(v.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-center ${
                          formData.vertical === v.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <Icon className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-sm font-medium">{v.name}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Targeting */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Target Cities/Departments</label>
                <input
                  type="text"
                  name="targetCities"
                  value={formData.targetCities}
                  onChange={handleInputChange}
                  placeholder="e.g., Cannes, Antibes, 06"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">Separate multiple values with commas</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Price Range: {formData.minPrice.toLocaleString()} - {formData.maxPrice.toLocaleString()} EUR
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400">Min Price</label>
                    <input
                      type="range"
                      min="0"
                      max="2000000"
                      step="50000"
                      value={formData.minPrice}
                      onChange={(e) => handleSliderChange('minPrice', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Max Price</label>
                    <input
                      type="range"
                      min="100000"
                      max="2000000"
                      step="50000"
                      value={formData.maxPrice}
                      onChange={(e) => handleSliderChange('maxPrice', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Minimum Land Area (m²): {formData.minLandArea}
                </label>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={formData.minLandArea}
                  onChange={(e) => handleSliderChange('minLandArea', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Step 3: Template */}
          {step === 3 && (
            <div className="space-y-4">
              {emailTemplates.map((template) => (
                <label
                  key={template.id}
                  className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.template === template.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="template"
                      value={template.id}
                      checked={formData.template === template.id}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{template.name}</p>
                      <p className="text-sm text-slate-400 mt-1">Subject: {template.subject}</p>
                      <p className="text-sm text-slate-400 mt-1">Preview: {template.preview}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-4 space-y-4">
                <div>
                  <p className="text-xs text-slate-400">Campaign Name</p>
                  <p className="font-semibold">{formData.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Description</p>
                  <p className="text-sm">{formData.description}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Vertical</p>
                  <p className="font-semibold">{selectedVertical?.name}</p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4 space-y-4">
                <div>
                  <p className="text-xs text-slate-400">Target Cities</p>
                  <p className="font-semibold">{formData.targetCities || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Price Range</p>
                  <p className="font-semibold">
                    {formData.minPrice.toLocaleString()} - {formData.maxPrice.toLocaleString()} EUR
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Minimum Land Area</p>
                  <p className="font-semibold">{formData.minLandArea} m²</p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4 space-y-4">
                <div>
                  <p className="text-xs text-slate-400">Email Template</p>
                  <p className="font-semibold">{selectedTemplate?.name}</p>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  Ready to launch? Your campaign will start collecting and processing leads immediately upon
                  launch.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2 border border-slate-700 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        {step < 4 ? (
          <button
            onClick={handleNext}
            disabled={
              (step === 1 && (!formData.name || !formData.vertical)) ||
              (step === 2 && !formData.targetCities)
            }
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
          >
            Lancer la Campagne
          </button>
        )}
      </div>
    </div>
  )
}
