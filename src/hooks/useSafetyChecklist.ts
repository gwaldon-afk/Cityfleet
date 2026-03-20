'use client'

// ═══════════════════════════════════════════════════════════════════════════
// useSafetyChecklist — Safety & Readiness Questions
// Location: src/hooks/useSafetyChecklist.ts
// Screen: M-04 | Controls: S-01 to S-04 (all HARD)
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { JobSafetyChecklist } from '@/lib/supabase/database.types'

export function useSafetyChecklist(jobId: string) {
  const { user } = useAuth()
  const [existing, setExisting] = useState<JobSafetyChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!user) return
      const supabase = createClient()
      const { data } = await supabase
        .from('job_safety_checklists')
        .select('*')
        .eq('job_id', jobId)
        .eq('mechanic_id', user.id)
        .maybeSingle()

      setExisting(data)
      setLoading(false)
    }
    load()
  }, [jobId, user])

  async function submitChecklist(params: {
    safeEnvironment: boolean
    notBlockingFasterJob: boolean
    vinEntered: string
  }): Promise<{ success: boolean; error?: string }> {
    if (!user) return { success: false, error: 'Not authenticated' }
    if (!params.safeEnvironment) return { success: false, error: 'S-02 HARD: Must confirm safe work environment' }
    if (!params.notBlockingFasterJob) return { success: false, error: 'S-03 HARD: Must confirm not blocking faster job' }
    if (!params.vinEntered?.trim()) return { success: false, error: 'S-04 HARD: VIN entry is mandatory' }

    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      const { data, error: insertError } = await supabase
        .from('job_safety_checklists')
        .insert({
          job_id: jobId,
          mechanic_id: user.id,
          safe_environment: params.safeEnvironment,
          not_blocking_job: params.notBlockingFasterJob,
          vin_entered: params.vinEntered.trim(),
          completed_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) throw insertError
      setExisting(data)
      return { success: true }
    } catch (err: any) {
      const msg = err.message || 'Failed to save checklist'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  return { existing, isCompleted: !!existing, loading, error, submitChecklist }
}
