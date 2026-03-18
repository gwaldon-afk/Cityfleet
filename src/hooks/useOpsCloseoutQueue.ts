'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const CLOSEOUT_STATUSES = ['mechanic_closed', 'manager_approved', 'ops_review', 'closed_released'] as const

export interface OpsCloseoutJobRow {
  id: string
  job_number: string
  status: string
  updated_at: string
  vehicle: { registration_number: string | null; vin: string | null; make: string | null; model: string | null } | null
  customer: { name: string } | null
}

export type InvoiceSummary = 'none' | 'unpaid' | 'cleared'

export function useOpsCloseoutQueue() {
  const [jobs, setJobs] = useState<OpsCloseoutJobRow[]>([])
  const [invoiceSummaryByJobId, setInvoiceSummaryByJobId] = useState<Record<string, InvoiceSummary>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      const { data: jobsData, error: jobsErr } = await (supabase as any)
        .from('jobs')
        .select(`
          id, job_number, status, updated_at,
          vehicle:vehicles(registration_number, vin, make, model),
          customer:customers(name)
        `)
        .in('status', [...CLOSEOUT_STATUSES])
        .order('updated_at', { ascending: false })

      if (jobsErr) throw jobsErr
      const jobList = jobsData || []
      setJobs(jobList)

      const jobIds = jobList.map((j: OpsCloseoutJobRow) => j.id)
      const summary: Record<string, InvoiceSummary> = {}
      jobIds.forEach((jid: string) => { summary[jid] = 'none' })

      if (jobIds.length > 0) {
        const { data: invData } = await (supabase as any)
          .from('invoices')
          .select('job_id, payment_cleared_at')
          .in('job_id', jobIds)

        const byJob: Record<string, { cleared: number; total: number }> = {}
        jobIds.forEach((jid: string) => { byJob[jid] = { cleared: 0, total: 0 } })
        ;(invData || []).forEach((inv: { job_id: string; payment_cleared_at: string | null }) => {
          byJob[inv.job_id].total += 1
          if (inv.payment_cleared_at) byJob[inv.job_id].cleared += 1
        })
        Object.keys(byJob).forEach((jid) => {
          const { total, cleared } = byJob[jid]
          if (total === 0) summary[jid] = 'none'
          else if (cleared < total) summary[jid] = 'unpaid'
          else summary[jid] = 'cleared'
        })
      }
      setInvoiceSummaryByJobId(summary)
    } catch (err: any) {
      setError(err.message)
      setJobs([])
      setInvoiceSummaryByJobId({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  function vehicleDisplay(job: OpsCloseoutJobRow): string {
    const v = job.vehicle
    if (!v) return '—'
    if (v.registration_number) return v.registration_number
    return [v.make, v.model].filter(Boolean).join(' ') || v.vin || '—'
  }

  function statusLabel(status: string): string {
    return status.replace(/_/g, ' ')
  }

  return {
    jobs,
    invoiceSummaryByJobId,
    loading,
    error,
    fetchAll,
    vehicleDisplay,
    statusLabel,
  }
}
