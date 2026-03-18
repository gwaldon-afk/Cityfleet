'use client'

// Mechanic awaiting manager approval — watches job.status === 'manager_approved'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAwaitingApproval(jobId: string) {
  const [jobStatus, setJobStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data } = await (supabase as any)
        .from('jobs')
        .select('status')
        .eq('id', jobId)
        .single()
      setJobStatus(data?.status ?? null)
      setLoading(false)
    }
    load()

    const channel = (supabase as any)
      .channel(`job-status-${jobId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'jobs',
        filter: `id=eq.${jobId}`,
      }, (payload: any) => {
        setJobStatus(payload.new?.status ?? null)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [jobId])

  const isApproved = jobStatus === 'manager_approved'

  return { jobStatus, isApproved, loading }
}
