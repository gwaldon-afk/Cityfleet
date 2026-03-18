'use client'

// Mechanic final sign-off — requires manager approval (job.manager_approved_at)
// A-03 HARD: Manager must approve before mechanic sign-off
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export function useJobSignOff(jobId: string) {
  const { user } = useAuth()
  const [managerApprovedAt, setManagerApprovedAt] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await (supabase as any)
        .from('jobs')
        .select('manager_approved_at, status')
        .eq('id', jobId)
        .single()
      setManagerApprovedAt(data?.manager_approved_at ?? null)
      setJobStatus(data?.status ?? null)
      setLoading(false)
    }
    load()
  }, [jobId])

  const isManagerApproved = !!managerApprovedAt

  async function submitSignOff(): Promise<{ success: boolean; error?: string }> {
    if (!user) return { success: false, error: 'Not authenticated' }
    if (!isManagerApproved) {
      return { success: false, error: 'A-03 HARD: Manager approval required before mechanic sign-off' }
    }

    try {
      setError(null)
      const supabase = createClient()

      // Close any open time entries for this mechanic on this job
      await (supabase as any)
        .from('time_entries')
        .update({ end_time: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('job_id', jobId)
        .eq('mechanic_id', user.id)
        .is('end_time', null)

      await (supabase as any)
        .from('jobs')
        .update({ status: 'mechanic_closed', updated_at: new Date().toISOString() })
        .eq('id', jobId)

      setJobStatus('mechanic_closed')
      return { success: true }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  return {
    isManagerApproved,
    isSignedOff: jobStatus === 'mechanic_closed',
    loading,
    error,
    submitSignOff,
  }
}
