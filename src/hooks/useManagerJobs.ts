'use client'

// Workshop Manager: Job board (site jobs) + create job + assign mechanic
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export interface ManagerJobRow {
  id: string
  job_number: string
  status: string
  po_number: string
  po_date: string
  work_type: string | null
  description: string
  created_at: string
  assigned_mechanic_id: string | null
  vehicle: { id: string; registration_number: string | null; vin: string | null; make: string | null; model: string | null } | null
  customer: { id: string; name: string } | null
}

export function useManagerJobs() {
  const { user, site } = useAuth()
  const [jobs, setJobs] = useState<ManagerJobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    if (!site?.id) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      const { data, error: fetchError } = await (supabase as any)
        .from('jobs')
        .select(`
          id,
          job_number,
          status,
          po_number,
          po_date,
          work_type,
          description,
          created_at,
          assigned_mechanic_id,
          vehicle:vehicles(id, registration_number, vin, make, model),
          customer:customers(id, name)
        `)
        .eq('site_id', site.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setJobs(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load jobs')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [site?.id])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  async function assignMechanic(jobId: string, mechanicId: string | null): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()
      const { error: updateError } = await (supabase as any)
        .from('jobs')
        .update({
          assigned_mechanic_id: mechanicId,
          updated_at: new Date().toISOString(),
          ...(mechanicId ? { status: 'approved' } : {}),
        })
        .eq('id', jobId)

      if (updateError) throw updateError
      await fetchJobs()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  return { jobs, loading, error, fetchJobs, assignMechanic }
}
