'use client'

// ═══════════════════════════════════════════════════════════════════════════
// useJobs — Job List + Job Detail
// Location: src/hooks/useJobs.ts
// Screens: M-02, M-03 | Controls: C-02, L-02
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { Job, Vehicle, Customer, JobStatus } from '@/lib/supabase/database.types'

interface JobWithDetails extends Job {
  vehicle: Vehicle | null
  customer: Customer | null
}

export function useJobs() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<JobWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select(`*, vehicle:vehicles(*), customer:customers(*)`)
        .eq('assigned_mechanic_id', user.id)
        .not('status', 'eq', 'closed_released')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setJobs(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  async function getJob(jobId: string): Promise<JobWithDetails | null> {
    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select(`*, vehicle:vehicles(*), customer:customers(*)`)
        .eq('id', jobId)
        .single()

      if (fetchError) throw fetchError
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }

  async function updateJobStatus(jobId: string, status: JobStatus): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', jobId)

      if (updateError) throw updateError
      await fetchJobs()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  async function hasActiveJob(): Promise<boolean> {
    if (!user) return false
    const supabase = createClient()
    const { data } = await supabase
      .from('time_entries')
      .select('id')
      .eq('mechanic_id', user.id)
      .eq('status', 'active')
      .limit(1)

    return (data?.length ?? 0) > 0
  }

  const activeJobs = jobs.filter((j) => j.status === 'in_progress')
  const pausedJobs = jobs.filter((j) => j.status === 'paused' || j.status === 'awaiting_parts')
  const pendingJobs = jobs.filter((j) => j.status === 'approved' || j.status === 'quoted')
  const completedJobs = jobs.filter((j) =>
    ['ready_for_review', 'manager_approved', 'mechanic_closed'].includes(j.status)
  )

  return {
    jobs, activeJobs, pausedJobs, pendingJobs, completedJobs,
    loading, error, fetchJobs, getJob, updateJobStatus, hasActiveJob,
  }
}
