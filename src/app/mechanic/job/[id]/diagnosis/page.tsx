'use client'

import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'

const MOCK_JOB = {
  id: 'job-4822',
  job_number: 'JOB-4822',
  vehicle_id: 'VIN: 6T1BF3EK5CU123456',
  vehicle_name: 'Volvo FH16 — Fleet #V-114',
  work_type: 'Scheduled 500hr Service',
  po_number: 'PO-2026-0418',
}

interface DiagnosisEntry {
  id: string
  finding: string
  category: string
  photos: string[]
  timestamp: Date
}

const DIAGNOSIS_CATEGORIES = [
  'Engine & Drivetrain',
  'Brakes & Suspension',
  'Electrical & Lighting',
  'Steering',
  'Tyres & Wheels',
  'Body & Chassis',
  'Fluids & Filters',
  'Exhaust & Emissions',
  'Other',
]

export default function DiagnosisScreen() {
  const params = useParams()
  const jobId = params.id as string

  const [findings, setFindings] = useState<DiagnosisEntry[]>([])
  const [currentFinding, setCurrentFinding] = useState('')
  const [currentCategory, setCurrentCategory] = useState('')
  const [currentPhotos, setCurrentPhotos] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setCurrentPhotos((prev) => [...prev, ev.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const addFinding = () => {
    if (!currentFinding.trim() || !currentCategory) return
    const entry: DiagnosisEntry = {
      id: `diag-${Date.now()}`,
      finding: currentFinding.trim(),
      category: currentCategory,
      photos: [...currentPhotos],
      timestamp: new Date(),
    }
    setFindings((prev) => [...prev, entry])
    setCurrentFinding('')
    setCurrentCategory('')
    setCurrentPhotos([])
  }

  const removeFinding = (id: string) => {
    setFindings((prev) => prev.filter((f) => f.id !== id))
  }

  const handleSubmitDiagnosis = () => {
    if (findings.length === 0) return
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
    }, 1000)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-cityfleet-navy to-cityfleet-navy-light text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">CITY FLEET</p>
              <p className="font-bold text-sm">{MOCK_JOB.job_number}</p>
            </div>
            <span className="text-xs bg-blue-900/50 px-2 py-1 rounded">STEP 5 — DIAGNOSIS</span>
          </div>
        </div>
        <div className="max-w-md mx-auto p-6 text-center mt-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Diagnosis Submitted</h2>
          <p className="text-gray-600 mb-2">{findings.length} finding(s) recorded</p>
          <p className="text-sm text-gray-500 mb-6">Proceed to log any defects found.</p>
          <a
            href={`/mechanic/job/${jobId}/defects`}
            className="block w-full py-3 rounded-lg text-white font-bold text-lg text-center bg-cityfleet-gold hover:brightness-110"
          >
            CONTINUE TO DEFECT CAPTURE →
          </a>
          <a href={`/mechanic/job/${jobId}/work`} className="block mt-3 text-blue-600 text-sm">
            Skip defects — no defects found
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-cityfleet-navy to-cityfleet-navy-light text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">CITY FLEET</p>
            <p className="font-bold text-sm">{MOCK_JOB.job_number}</p>
          </div>
          <span className="text-xs bg-blue-900/50 px-2 py-1 rounded">STEP 5 — DIAGNOSIS</span>
        </div>
        <div className="mt-2 text-xs opacity-80">
          {MOCK_JOB.vehicle_name} • {MOCK_JOB.vehicle_id}
        </div>
      </div>

      <div className="bg-red-50 border-b border-red-200 px-4 py-2">
        <p className="text-xs text-red-700 font-semibold">
          ⛔ D-01 HARD GATE: Diagnosis required before any repair work
        </p>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 font-semibold mb-1">Test &amp; Diagnose Vehicle</p>
          <p className="text-xs text-blue-700">
            Test the vehicle and record your initial findings. Capture photo evidence for each finding.
            All findings are saved against this job for audit purposes.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <h3 className="font-bold text-gray-800">Add Diagnosis Finding</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={currentCategory}
              onChange={(e) => setCurrentCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select category...</option>
              {DIAGNOSIS_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Finding Description</label>
            <textarea
              value={currentFinding}
              onChange={(e) => setCurrentFinding(e.target.value)}
              placeholder="Describe what you found..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Evidence Photos</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              📷 Tap to take photo or select from gallery
            </button>
            {currentPhotos.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {currentPhotos.map((photo, idx) => (
                  <div key={idx} className="relative flex-shrink-0">
                    <img src={photo} alt={`Evidence ${idx + 1}`} className="w-16 h-16 object-cover rounded" />
                    <button
                      onClick={() => setCurrentPhotos((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={addFinding}
            disabled={!currentFinding.trim() || !currentCategory}
            className="w-full py-2 rounded-lg text-white font-semibold text-sm disabled:opacity-40 transition-colors bg-cityfleet-navy hover:bg-cityfleet-navy-light disabled:bg-gray-400"
          >
            + ADD FINDING
          </button>
        </div>

        {findings.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-bold text-gray-800 text-sm">{findings.length} Finding(s) Recorded</h3>
            {findings.map((f) => (
              <div key={f.id} className="bg-white rounded-lg shadow p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {f.category}
                    </span>
                    <p className="text-sm text-gray-800 mt-1">{f.finding}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {f.photos.length} photo(s) • {f.timestamp.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button onClick={() => removeFinding(f.id)} className="text-red-400 text-sm ml-2">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSubmitDiagnosis}
          disabled={findings.length === 0 || isSubmitting}
          className="w-full py-3 rounded-lg text-white font-bold text-lg disabled:opacity-40 transition-colors bg-cityfleet-gold hover:brightness-110 disabled:bg-gray-400"
        >
          {isSubmitting ? 'SUBMITTING...' : `SUBMIT DIAGNOSIS (${findings.length} findings)`}
        </button>

        <p className="text-center text-xs text-gray-400">
          Control D-01 • Evidence retained for audit (I-01)
        </p>
      </div>
    </div>
  )
}
