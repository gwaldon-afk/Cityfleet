'use client'

// ═══════════════════════════════════════════════════════════════════════════
// useTestConfirmation — Test drive / step-out + odometer
// Location: src/hooks/useTestConfirmation.ts
// Screen: M-08 | Controls: Q-01 (HARD)
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { JobTestConfirmation, JobOdometerReading } from '@/lib/supabase/database.types'

export function useTestConfirmation(jobId: string) {
  const { user } = useAuth()
  const [testConfirmation, setTestConfirmation] = useState<JobTestConfirmation | null>(null)
  const [odometerReadings, setOdometerReadings] = useState<JobOdometerReading[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!user) return
      const supabase = createClient()

      const { data: testData } = await supabase
        .from('job_test_confirmations').select('*').eq('job_id', jobId).maybeSingle()
      setTestConfirmation(testData)

      const { data: odomData } = await supabase
        .from('job_odometer_readings').select('*').eq('job_id', jobId).order('created_at', { ascending: true })
      setOdometerReadings(odomData || [])
      setLoading(false)
    }
    load()
  }, [jobId, user])

  async function recordOdometer(params: {
    readingType: 'pre_work' | 'post_work'
    value: number
    photoUrl?: string
  }): Promise<{ success: boolean; error?: string }> {
    if (!user) return { success: false, error: 'Not authenticated' }
    try {
      const supabase = createClient()
      const { error: insertError } = await supabase
        .from('job_odometer_readings')
        .insert({
          job_id: jobId, mechanic_id: user.id, reading_type: params.readingType,
          value: params.value, photo_url: params.photoUrl || null,
        })
      if (insertError) throw insertError

      const { data } = await supabase
        .from('job_odometer_readings').select('*').eq('job_id', jobId).order('created_at', { ascending: true })
      setOdometerReadings(data || [])
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  async function submitTestConfirmation(params: {
    testType: 'step_out' | 'test_drive' | 'both'
    notes?: string
  }): Promise<{ success: boolean; error?: string }> {
    if (!user) return { success: false, error: 'Not authenticated' }
    try {
      setError(null)
      const supabase = createClient()

      const { data, error: insertError } = await supabase
        .from('job_test_confirmations')
        .insert({
          job_id: jobId, mechanic_id: user.id, test_completed: true,
          test_type: params.testType, notes: params.notes || null,
        })
        .select().single()
      if (insertError) throw insertError

      await supabase
        .from('jobs')
        .update({ status: 'testing', updated_at: new Date().toISOString() })
        .eq('id', jobId)

      setTestConfirmation(data)
      return { success: true }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  const preWorkReading = odometerReadings.find((r) => r.reading_type === 'pre_work')
  const postWorkReading = odometerReadings.find((r) => r.reading_type === 'post_work')
  const kmDriven = preWorkReading?.value && postWorkReading?.value
    ? postWorkReading.value - preWorkReading.value : null

  return {
    testConfirmation, isTestCompleted: !!testConfirmation,
    odometerReadings, preWorkReading, postWorkReading, kmDriven,
    loading, error, recordOdometer, submitTestConfirmation,
  }
}
