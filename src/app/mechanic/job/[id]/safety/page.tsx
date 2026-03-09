'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/protected-route'

export default function SafetyChecklistPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [job, setJob] = useState<any>(null)
  
  // S-02, S-03, S-04 controls
  const [safeEnvironment, setSafeEnvironment] = useState<boolean | null>(null)
  const [notBlockingJob, setNotBlockingJob] = useState<boolean | null>(null)
  const [vin, setVin] = useState('')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadJob()
  }, [params.id])

  const loadJob = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setJob(data)

      // Check if checklist already completed
      const { data: checklistData } = await supabase
        .from('job_safety_checklists')
        .select('*')
        .eq('job_id', params.id)
        .single()

      if (checklistData) {
        // Already completed - redirect to diagnosis
        router.push(`/mechanic/job/${params.id}/diagnosis`)
      }
    } catch (err) {
      console.error('Error loading job:', err)
    } finally {
      setLoading(false)
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
      const { error: checklistError } = await supabase
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
        await supabase
          .from('jobs')
          .update({ vehicle_vin: vin })
          .eq('id', params.id)
      }

      // Proceed to diagnosis (Step 5)
      router.push(`/mechanic/job/${params.id}/diagnosis`)
    } catch (err: any) {
      alert(`Error saving checklist: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const canProceed = safeEnvironment === true && notBlockingJob === true && vin.length === 17

  if (isLoading) {
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
                  You must complete ALL questions before proceeding. This checklist cannot be skipped.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Question 3: VIN Entry (S-04) */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                3. Enter Vehicle VIN Number
              </h3>
              <input
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                maxLength={17}
                placeholder="Enter 17-character VIN"
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
                VIN can be found on the vehicle dashboard, driver's door jamb, or vehicle documents.
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
                  Please answer all questions with YES and enter valid VIN to continue
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}
