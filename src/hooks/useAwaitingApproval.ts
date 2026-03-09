'use client'

// ═══════════════════════════════════════════════════════════════════════════
// useAwaitingApproval — Real-time manager approval monitoring
// Location: src/hooks/useAwaitingApproval.ts
// Screen: M-10 | Controls: A-03 (HARD)
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Job, JobApproval } from '@/lib/supabase/database.types'

export function useAwaitingApproval(jobId: string) {
  const [job, setJob] = useState<Job | null>(null)
  const [approval, setApproval] = useState<JobApproval | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: jobData } = await supabase.from('jobs').select('*').eq('id', jobId).single()
      setJob(jobData)

      const { data: approvalData } = await supabase
        .from('job_approvals').select('*')
        .eq('job_id', jobId).eq('approval_type', 'manager_two_hand_touch').maybeSingle()
      setApproval(approvalData)
      setLoading(false)
    }
    load()

    // Real-time: mechanic sees instant update when manager approves
    const channel = supabase
      .channel(`job-approval-${jobId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'job_approvals',
        filter: `job_id=eq.${jobId}`,
      }, (payload) => {
        if (payload.new?.approval_type === 'manager_two_hand_touch') {
          setApproval(payload.new as JobApproval)
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'jobs',
        filter: `id=eq.${jobId}`,
      }, (payload) => {
        setJob(payload.new as Job)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [jobId])

  return { job, approval, isApproved: !!approval, jobStatus: job?.status || null, loading }
}
