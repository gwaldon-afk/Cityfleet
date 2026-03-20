'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useDefects } from '@/hooks/useDefects'
import { uploadBase64JobAttachment, createJobAttachmentRecord } from '@/lib/supabase/storage'

const DEFECT_CATEGORIES = [
  'Brakes', 'Steering', 'Suspension', 'Lights / Electrical', 'Tyres',
  'Body Damage', 'Interior', 'Fluids / Leaks', 'Exhaust / Emissions', 'Other',
]

export default function DefectCaptureScreen() {
  const params = useParams()
  const jobId = params.id as string
  const { user } = useAuth()
  const {
    defects,
    loading: defectsLoading,
    error: defectsError,
    addDefect: addDefectToApi,
    submitDefects,
    loadDefects,
  } = useDefects(jobId)

  const [jobNumber, setJobNumber] = useState<string>('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<'RED' | 'ORANGE' | ''>('')
  const [category, setCategory] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addingDefect, setAddingDefect] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showForm, setShowForm] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (ev.target?.result) setPhotos((prev) => [...prev, ev.target!.result as string])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const addDefect = async () => {
    if (!description.trim() || !severity || !category || photos.length === 0 || !user) return
    setAddingDefect(true)
    try {
      const evidenceUrls: string[] = []
      for (let i = 0; i < photos.length; i++) {
        const result = await uploadBase64JobAttachment({
          jobId,
          userId: user.id,
          dataUrl: photos[i],
          area: 'defects',
          category: `defect-${Date.now()}`,
        })
        if (result.path) {
          await createJobAttachmentRecord({
            jobId,
            uploadedBy: user.id,
            filePath: result.path,
            fileType: 'image/jpeg',
          })
          evidenceUrls.push(result.url)
        }
      }
      if (evidenceUrls.length === 0) {
        alert('Upload failed. Try again.')
        return
      }
      const { success, error } = await addDefectToApi({
        description: description.trim(),
        severity: severity as 'RED' | 'ORANGE',
        category,
        evidenceUrls,
      })
      if (success) {
        setDescription('')
        setSeverity('')
        setCategory('')
        setPhotos([])
        setShowForm(false)
      } else {
        alert(error || 'Failed to add defect')
      }
    } catch (err) {
      alert('Failed to upload evidence or add defect.')
    } finally {
      setAddingDefect(false)
    }
  }

  const handleSubmit = async () => {
    if (defects.length === 0) return
    setIsSubmitting(true)
    try {
      const { success, error } = await submitDefects()
      if (success) setSubmitted(true)
      else alert(error || 'Submit failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const redCount = defects.filter((d) => d.severity === 'RED').length
  const orangeCount = defects.filter((d) => d.severity === 'ORANGE').length

  // Load job number for header
  useEffect(() => {
    if (!jobId) return
    const { createClient } = require('@/lib/supabase/client')
    const supabase = createClient()
    supabase
      .from('jobs')
      .select('job_number')
      .eq('id', jobId)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.job_number) setJobNumber(data.job_number)
      })
  }, [jobId])

  // ─── SUBMITTED STATE ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-cityfleet-navy to-cityfleet-navy-light text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">CITY FLEET</p>
              <p className="font-bold text-sm">{jobNumber || `Job ${jobId.slice(0, 8)}`}</p>
            </div>
            <span className="text-xs bg-blue-900/50 px-2 py-1 rounded">STEP 6 — DEFECTS</span>
          </div>
        </div>
        <div className="max-w-md mx-auto p-6 text-center mt-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Defects Submitted</h2>
          <p className="text-gray-600 mb-1">
            {defects.length} defect(s) logged
          </p>
          {redCount > 0 && (
            <p className="text-sm text-red-600 font-semibold">🔴 {redCount} safety defect(s) — manager must review</p>
          )}
          {orangeCount > 0 && (
            <p className="text-sm text-orange-600 font-semibold">🟠 {orangeCount} non-safety defect(s)</p>
          )}
          <p className="text-sm text-gray-500 mt-3 mb-6">
            Workshop Manager has been notified. Awaiting customer approval before additional work.
          </p>
          <a
            href={`/mechanic/job/${jobId}/work`}
            className="block w-full py-3 rounded-lg text-white font-bold text-lg text-center bg-cityfleet-gold"
          >
            CONTINUE TO JOB →
          </a>
        </div>
      </div>
    )
  }

  // ─── MAIN SCREEN ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-cityfleet-navy to-cityfleet-navy-light text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">CITY FLEET</p>
            <p className="font-bold text-sm">{jobNumber || `Job ${jobId?.slice(0, 8)}...`}</p>
          </div>
          <span className="text-xs bg-blue-900/50 px-2 py-1 rounded">STEP 6 — DEFECTS</span>
        </div>
      </div>

      {/* Hard Gate Banner */}
      <div className="bg-red-50 border-b border-red-200 px-4 py-2">
        <p className="text-xs text-red-700 font-semibold">
          ⛔ D-02/D-03/D-04 HARD GATE: All defects must be logged with evidence + severity before continuing
        </p>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Defect Summary Bar */}
        {defects.length > 0 && (
          <div className="flex gap-3">
            <div className="flex-1 bg-white rounded-lg shadow p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">{defects.length}</p>
              <p className="text-xs text-gray-500">Total Defects</p>
            </div>
            <div className="flex-1 bg-red-50 rounded-lg shadow p-3 text-center border border-red-200">
              <p className="text-2xl font-bold text-red-600">{redCount}</p>
              <p className="text-xs text-red-600">🔴 Safety</p>
            </div>
            <div className="flex-1 bg-orange-50 rounded-lg shadow p-3 text-center border border-orange-200">
              <p className="text-2xl font-bold text-orange-600">{orangeCount}</p>
              <p className="text-xs text-orange-600">🟠 Non-Safety</p>
            </div>
          </div>
        )}

        {/* Defects List */}
        {defects.map((d) => (
          <div
            key={d.id}
            className={`bg-white rounded-lg shadow p-3 border-l-4 ${
              d.severity === 'RED' ? 'border-red-500' : 'border-orange-400'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    d.severity === 'RED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {d.severity === 'RED' ? '🔴 SAFETY' : '🟠 NON-SAFETY'}
                  </span>
                </div>
                <p className="text-sm text-gray-800">{d.description}</p>
                <p className="text-xs text-gray-400 mt-1">{(d.evidence_urls?.length ?? 0)} photo(s) attached</p>
              </div>
            </div>
          </div>
        ))}

        {/* Add Defect Form */}
        {showForm ? (
          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <h3 className="font-bold text-gray-800">
              {defects.length === 0 ? 'Log Defect' : 'Add Another Defect'}
            </h3>

            {/* Severity Selection — prominent per whiteboard */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity Rating <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSeverity('RED')}
                  className={`py-3 rounded-lg font-bold text-sm border-2 transition-all ${
                    severity === 'RED'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-red-50 text-red-700 border-red-300 hover:border-red-500'
                  }`}
                >
                  🔴 SAFETY ISSUE
                </button>
                <button
                  onClick={() => setSeverity('ORANGE')}
                  className={`py-3 rounded-lg font-bold text-sm border-2 transition-all ${
                    severity === 'ORANGE'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-orange-50 text-orange-700 border-orange-300 hover:border-orange-500'
                  }`}
                >
                  🟠 NON-SAFETY
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select category...</option>
                {DEFECT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the defect..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Photo Evidence — MANDATORY (D-03) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo Evidence <span className="text-red-500">* Required</span>
              </label>
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
                📷 Tap to take photo (required per defect)
              </button>
              {photos.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative flex-shrink-0">
                      <img src={photo} alt={`Evidence ${idx + 1}`} className="w-16 h-16 object-cover rounded" />
                      <button
                        onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {photos.length === 0 && severity && (
                <p className="text-xs text-red-500 mt-1">⚠ At least one photo is required per defect (D-03)</p>
              )}
            </div>

            <button
              onClick={addDefect}
              disabled={addingDefect || !description.trim() || !severity || !category || photos.length === 0}
              className="w-full py-2 rounded-lg text-white font-semibold text-sm disabled:opacity-40 transition-colors bg-cityfleet-navy disabled:bg-gray-400"
            >
              {addingDefect ? 'UPLOADING & ADDING...' : '+ ADD DEFECT'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 font-semibold text-sm hover:border-blue-400"
          >
            + ADD ANOTHER DEFECT
          </button>
        )}

        {/* No Defects Path */}
        {defects.length === 0 && (
          <a
            href={`/mechanic/job/${jobId}/work`}
            className="block text-center text-blue-600 text-sm py-2"
          >
            No defects found — skip to job →
          </a>
        )}
      </div>

      {/* Fixed Bottom Submit Bar */}
      {defects.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg text-white font-bold text-lg transition-colors bg-cityfleet-gold"
            >
              {isSubmitting
                ? 'SUBMITTING...'
                : `SUBMIT ${defects.length} DEFECT(S) TO MANAGER`}
            </button>
            <p className="text-center text-xs text-gray-400 mt-1">
              Manager will be notified for customer approval (Step 7)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
