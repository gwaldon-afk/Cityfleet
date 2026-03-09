'use client'

// ═══════════════════════════════════════════════════════════════════════════
// useJobSignOff — Mechanic final sign-off
// Location: src/hooks/useJobSignOff.ts
// Screen: M-11 | Controls: A-03 (HARD), L-04 (AUTO)
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { JobApproval } from '@/lib/supabase/database.types'

export function useJobSignOff(jobId: string) {
  const { user } = useAuth()
  const [managerApproval, setManagerApproval] = useState<JobApproval | null>(null)
  const [mechanicSignOff, setMechanicSignOff] = useState<JobApproval | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: managerData } = await supabase
        .from('job_approvals').select('*')
        .eq('job_id', jobId).eq('approval_type', 'manager_two_hand_touch').maybeSingle()
      setManagerApproval(managerData)

      const { data: mechanicData } = await supabase
        .from('job_approvals').select('*')
        .eq('job_id', jobId).eq('approval_type', 'mechanic_final').maybeSingle()
      setMechanicSignOff(mechanicData)
      setLoading(false)
    }
    load()
  }, [jobId])

  async function submitSignOff(): Promise<{ success: boolean; error?: string }> {
    if (!user) return { success: false, error: 'Not authenticated' }
    if (!managerApproval) {
      return { success: false, error: 'A-03 HARD: Manager approval required before mechanic sign-off' }
    }

    try {
      setError(null)
      const supabase = createClient()

      const { data, error: insertError } = await supabase
        .from('job_approvals')
        .insert({
          job_id: jobId, approval_type: 'mechanic_final',
          approved_by: user.id, notes: 'Mechanic final sign-off confirmed',
        })
        .select().single()
      if (insertError) throw insertError

      // L-04 AUTO: Close all remaining time entries
      await supabase
        .from('time_entries')
        .update({ status: 'completed', end_time: new Date().toISOString() })
        .eq('job_id', jobId).eq('mechanic_id', user.id).in('status', ['active', 'paused'])

      // Move to mechanic_closed (Step 14 → Step 15)
      await supabase
        .from('jobs')
        .update({ status: 'mechanic_closed', updated_at: new Date().toISOString() })
        .eq('id', jobId)

      setMechanicSignOff(data)
      return { success: true }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  return {
    managerApproval, mechanicSignOff,
    isManagerApproved: !!managerApproval, isSignedOff: !!mechanicSignOff,
    loading, error, submitSignOff,
  }
}
