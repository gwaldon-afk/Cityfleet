'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/protected-route'
import { uploadJobAttachment, createJobAttachmentRecord } from '@/lib/supabase/storage'
import { extractVINFromImage } from '@/lib/ocr'

export default function SafetyChecklistPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [job, setJob] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // S-05: Walk-around mandatory (HARD)
  const [walkAroundFiles, setWalkAroundFiles] = useState<{ path: string; url: string }[]>([])
  const [uploadingWalkAround, setUploadingWalkAround] = useState(false)

  // S-02, S-03, S-04 controls
  const [safeEnvironment, setSafeEnvironment] = useState<boolean | null>(null)
  const [notBlockingJob, setNotBlockingJob] = useState<boolean | null>(null)
  const [vin, setVin] = useState('')
  const [devSkipWalkAround, setDevSkipWalkAround] = useState(false)
  const [vinScanning, setVinScanning] = useState(false)
  const vinPhotoRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const handleVINPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVinScanning(true)
    try {
      const parsed = await extractVINFromImage(file)
      if (parsed) setVin(parsed)
    } catch {
      // OCR failed — user can enter manually
    } finally {
      setVinScanning(false)
      e.target.value = ''
    }
  }

  useEffect(() => {
    loadJob()
  }, [params.id])

  const loadJob = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('jobs')
        .select('*, vehicle:vehicles(vin)')
        .eq('id', params.id)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        console.warn('Safety: job not found or access denied (406 avoided)')
        setJob(null)
        setLoading(false)
        return
      }
      setJob(data)
      // Pre-fill VIN from seed/vehicle data so testing doesn't require typing it
      const vehicleVin = data?.vehicle?.vin
      if (vehicleVin && String(vehicleVin).length === 17) setVin(String(vehicleVin))

      // Check if checklist already completed (.maybeSingle() avoids 406 when no row yet)
      const { data: checklistData } = await (supabase as any)
        .from('job_safety_checklists')
        .select('*')
        .eq('job_id', params.id)
        .maybeSingle()

      if (checklistData) {
        router.push(`/mechanic/job/${params.id}/diagnosis`)
        return
      }

      // Load existing walk-around attachments (S-05)
      const { data: attachments } = await (supabase as any)
        .from('job_attachments')
        .select('file_path')
        .eq('job_id', params.id)
      const walkaround = (attachments || []).filter((a: { file_path: string }) =>
        a.file_path?.includes('walkaround')
      )
      if (walkaround.length > 0) {
        setWalkAroundFiles(
          walkaround.map((a: { file_path: string }) => ({
            path: a.file_path,
            url: supabase.storage.from('job-attachments').getPublicUrl(a.file_path).data.publicUrl,
          }))
        )
      }
    } catch (err) {
      console.error('Error loading job:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleWalkAroundFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length || !user || !params.id) return
    setUploadingWalkAround(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const result = await uploadJobAttachment({
          jobId: params.id,
          userId: user.id,
          file,
          area: 'walkaround',
        })
        if (result.path) {
          await createJobAttachmentRecord({
            jobId: params.id,
            uploadedBy: user.id,
            filePath: result.path,
            fileType: file.type,
            fileSizeBytes: file.size,
          })
          setWalkAroundFiles((prev) => [...prev, { path: result.path!, url: result.url }])
        }
      }
    } catch (err) {
      console.error('Walk-around upload error:', err)
      alert('Upload failed. Try again.')
    } finally {
      setUploadingWalkAround(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    if (safeEnvironment === null) {
      alert('Please answer: Have you ensured a safe work environment?')
      return
    }

    if (notBlockingJob === null) {
      alert('Please answer: Have you ensured you are not blocking a faster job?')
      return
    }

    if (!vin || vin.length !== 17) {
      alert('Please enter a valid 17-character VIN number')
      return
    }

    // All must be YES to proceed
    if (!safeEnvironment) {
      alert('You must ensure a safe work environment before proceeding.')
      return
    }

    if (!notBlockingJob) {
      alert('Please ensure you are not blocking a faster-moving job.')
      return
    }

    setSubmitting(true)

    try {
      // Save checklist
      const { error: checklistError } = await (supabase as any)
        .from('job_safety_checklists')
        .insert({
          job_id: params.id,
          mechanic_id: user?.id,
          safe_environment: safeEnvironment,
          not_blocking_job: notBlockingJob,
          vin_entered: vin,
          completed_at: new Date().toISOString()
        })

      if (checklistError) throw checklistError

      // Update job with VIN if not already set
      if (!job.vehicle_vin) {
        await (supabase as any)
          .from('jobs')
          .update({ vehicle_vin: vin })
          .eq('id', params.id)
      }

      // Proceed to diagnosis (Step 5)
      router.push(`/mechanic/job/${params.id}/diagnosis`)
    } catch (err: any) {
      const msg = err?.message || String(err)
      const code = err?.code || err?.status
      const details = err?.details || err?.hint || ''
      console.error('Safety checklist save error:', { message: msg, code, details, full: err })
      alert(`Error saving checklist: ${msg}${code ? ` (${code})` : ''}${details ? ` — ${details}` : ''}. If 403/RLS: run migration 00008. If 401: log in again.`)
    } finally {
      setSubmitting(false)
    }
  }

  // S-05 HARD: Walk-around required before safety checklist can be completed
  const hasWalkAround = walkAroundFiles.length >= 1
  const isDev = process.env.NODE_ENV === 'development'
  const allowDemoSkip = true
  const canProceed =
    (hasWalkAround || (allowDemoSkip && devSkipWalkAround)) &&
    safeEnvironment === true &&
    notBlockingJob === true &&
    vin.length === 17

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cityfleet-gold"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['mechanic']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-cityfleet-navy text-white py-4 px-6 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-xl font-bold">Safety Checklist</h1>
            <p className="text-sm text-white/70">
              Job #{job?.job_number} - {job?.vehicle_identifier}
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          {/* Mandatory Notice */}
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-semibold text-red-900 mb-1">MANDATORY SAFETY CHECKLIST</h3>
                <p className="text-sm text-red-800">
                  You must complete ALL steps (including walk-around) before proceeding. This checklist cannot be skipped.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 0: Walk-around (S-05 HARD) */}
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-amber-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                0. Walk-around — vehicle condition before work <span className="text-red-600">(S-05 Required)</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Record a short video or take photos of the vehicle condition before any work. Required before you can continue.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                capture="environment"
                multiple
                onChange={handleWalkAroundFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingWalkAround}
                className="w-full py-3 px-4 rounded-lg border-2 border-dashed border-gray-400 hover:border-cityfleet-gold bg-gray-50 text-gray-700 font-medium disabled:opacity-50"
              >
                {uploadingWalkAround ? 'Uploading...' : '📷 Record video or take photos'}
              </button>
              {walkAroundFiles.length > 0 && (
                <p className="mt-3 text-sm text-green-700 font-medium">
                  ✓ {walkAroundFiles.length} file(s) uploaded. You can add more or continue below.
                </p>
              )}
              {!hasWalkAround && (
                <p className="mt-2 text-sm text-red-600">At least one video or photo is required (S-05).</p>
              )}
              {(isDev || allowDemoSkip) && (
                <div className="mt-4 pt-4 border-t border-amber-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={devSkipWalkAround}
                      onChange={(e) => setDevSkipWalkAround(e.target.checked)}
                      className="rounded border-amber-600"
                    />
                    <span className="text-sm font-medium text-amber-900">
                      {isDev ? 'Skip walk-around for testing (dev only)' : 'Skip walk-around (demo only)'}
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Question 1: Safe Environment (S-02) */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                1. Have you ensured a safe work environment for yourself and other staff?
              </h3>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setSafeEnvironment(true)}
                  className={`w-full p-4 rounded-lg border-2 text-left font-medium transition ${
                    safeEnvironment === true
                      ? 'border-green-500 bg-green-50 text-green-900'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  ✓ YES - Work area is safe
                </button>
                <button
                  type="button"
                  onClick={() => setSafeEnvironment(false)}
                  className={`w-full p-4 rounded-lg border-2 text-left font-medium transition ${
                    safeEnvironment === false
                      ? 'border-red-500 bg-red-50 text-red-900'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  ✗ NO - Safety concerns present
                </button>
              </div>
              {safeEnvironment === false && (
                <p className="mt-3 text-sm text-red-600">
                  Please address safety concerns before proceeding.
                </p>
              )}
            </div>

            {/* Question 2: Not Blocking Faster Job (S-03) */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                2. Have you ensured you are not blocking a faster-moving job?
              </h3>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setNotBlockingJob(true)}
                  className={`w-full p-4 rounded-lg border-2 text-left font-medium transition ${
                    notBlockingJob === true
                      ? 'border-green-500 bg-green-50 text-green-900'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  ✓ YES - Not blocking other jobs
                </button>
                <button
                  type="button"
                  onClick={() => setNotBlockingJob(false)}
                  className={`w-full p-4 rounded-lg border-2 text-left font-medium transition ${
                    notBlockingJob === false
                      ? 'border-red-500 bg-red-50 text-red-900'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  ✗ NO - May be blocking other work
                </button>
              </div>
              {notBlockingJob === false && (
                <p className="mt-3 text-sm text-red-600">
                  Please check with supervisor about job prioritization.
                </p>
              )}
            </div>

            {/* Question 3: VIN Entry (S-04) — OCR from photo or manual */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                3. Enter Vehicle VIN Number
              </h3>
              <input ref={vinPhotoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleVINPhoto} />
              <button
                type="button"
                onClick={() => vinPhotoRef.current?.click()}
                disabled={vinScanning}
                className="mb-3 w-full py-2 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-600 hover:border-cityfleet-gold disabled:opacity-50"
              >
                {vinScanning ? '⏳ Scanning photo…' : '📷 Scan VIN from photo (OCR)'}
              </button>
              <input
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                maxLength={17}
                placeholder="Or enter 17-character VIN manually"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-cityfleet-gold focus:outline-none font-mono text-lg"
              />
              <div className="mt-2 flex items-center justify-between text-sm">
                <p className={vin.length === 17 ? 'text-green-600 font-medium' : 'text-gray-600'}>
                  {vin.length} / 17 characters
                </p>
                {vin.length === 17 && (
                  <p className="text-green-600 font-medium">✓ Valid VIN</p>
                )}
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Use photo to scan VIN (OCR) or type manually if scan fails. VIN is on dashboard, door jamb, or documents.
              </p>
            </div>

            {/* Submit Button */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <button
                type="submit"
                disabled={!canProceed || submitting}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition ${
                  canProceed
                    ? 'bg-cityfleet-gold hover:bg-cityfleet-gold-light text-black'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {submitting ? 'Saving...' : 'CONTINUE TO DIAGNOSIS'}
              </button>
              {!canProceed && (
                <p className="mt-3 text-sm text-center text-gray-600">
                  {!hasWalkAround
                    ? 'Upload at least one walk-around video or photo (S-05), then complete all questions with YES and enter valid VIN.'
                    : 'Please answer all questions with YES and enter valid VIN to continue'}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}
