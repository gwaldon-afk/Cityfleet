'use client'

// Workshop Manager dashboard: mechanics (clocked on, current job), job pipeline, outstanding
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { ManagerJobRow } from './useManagerJobs'
import type { SiteMechanic } from './useSiteMechanics'

export type { ManagerJobRow }

export interface MechanicStatus {
  mechanic: SiteMechanic
  clockedOn: boolean
  clockedOnAt: string | null
  currentJobId: string | null
  currentJobNumber: string | null
  jobStatusLabel: string
  jobVehicleDisplay: string
}

export interface JobSummary {
  unassigned: number
  assigned: number
  inProgress: number
  paused: number
  awaitingParts: number
  blocked: number
  awaitingApproval: number
  needsManager: number
  defectsPendingApproval: number
  completed: number
  total: number
}

const JOB_STATUS_LABELS: Record<string, string> = {
  quoted: 'Not started',
  approved: 'Assigned',
  in_progress: 'In workshop',
  paused: 'Paused',
  awaiting_parts: 'Awaiting parts',
  awaiting_approval: 'Awaiting approval',
  defects_logged: 'Defects logged',
  ready_for_review: 'Ready for review',
  manager_approved: 'Manager approved',
  mechanic_closed: 'Mechanic closed',
  ops_review: 'Ops review',
  closed_released: 'Closed',
}

function jobStatusLabel(status: string): string {
  return JOB_STATUS_LABELS[status] ?? status.replace(/_/g, ' ')
}

function vehicleDisplay(job: ManagerJobRow): string {
  const v = job.vehicle
  if (!v) return '—'
  if (v.registration_number) return v.registration_number
  return [v.make, v.model].filter(Boolean).join(' ') || v.vin || '—'
}

export function useManagerDashboard() {
  const { site } = useAuth()
  const [jobs, setJobs] = useState<ManagerJobRow[]>([])
  const [mechanics, setMechanics] = useState<SiteMechanic[]>([])
  const [activeShifts, setActiveShifts] = useState<{ mechanic_id: string; clock_on_at: string }[]>([])
  const [activeTimeEntries, setActiveTimeEntries] = useState<{ mechanic_id: string; job_id: string }[]>([])
  const [jobIdsWithPendingDefects, setJobIdsWithPendingDefects] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!site?.id) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      const [jobsRes, rolesRes, shiftsRes, timeRes] = await Promise.all([
        (supabase as any)
          .from('jobs')
          .select(`
            id, job_number, status, po_number, po_date, work_type, description, created_at, assigned_mechanic_id,
            vehicle:vehicles(id, registration_number, vin, make, model),
            customer:customers(id, name)
          `)
          .eq('site_id', site.id)
          .order('created_at', { ascending: false }),
        (supabase as any)
          .from('user_roles')
          .select('user_id')
          .eq('role', 'mechanic')
          .eq('site_id', site.id),
        (supabase as any)
          .from('shifts')
          .select('mechanic_id, clock_on_at')
          .eq('site_id', site.id)
          .is('clock_off_at', null),
        (supabase as any)
          .from('time_entries')
          .select('mechanic_id, job_id')
          .is('end_time', null),
      ])

      if (jobsRes.error) throw jobsRes.error
      const jobsData = jobsRes.data || []
      setJobs(jobsData)

      // Jobs with defects pending customer/manager approval (Batch A: defects notification)
      const jobIds = jobsData.map((j: ManagerJobRow) => j.id)
      let jobIdsWithPendingDefects = new Set<string>()
      if (jobIds.length > 0) {
        const { data: defectsData } = await (supabase as any)
          .from('defects')
          .select('job_id')
          .eq('customer_approval_status', 'pending')
          .in('job_id', jobIds)
        jobIdsWithPendingDefects = new Set((defectsData || []).map((d: { job_id: string }) => d.job_id))
      }
      setJobIdsWithPendingDefects(jobIdsWithPendingDefects)

      const userIds = (rolesRes.data || []).map((r: { user_id: string }) => r.user_id)
      if (userIds.length > 0) {
        const { data: users } = await (supabase as any)
          .from('users')
          .select('id, first_name, last_name')
          .in('id', userIds)
          .eq('status', 'active')
        setMechanics(
          (users || []).map((u: { id: string; first_name: string; last_name: string }) => ({
            ...u,
            name: `${u.first_name} ${u.last_name}`,
          }))
        )
      } else {
        setMechanics([])
      }

      setActiveShifts(shiftsRes.data || [])
      setActiveTimeEntries(timeRes.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard')
      setJobs([])
      setMechanics([])
      setActiveShifts([])
      setActiveTimeEntries([])
      setJobIdsWithPendingDefects(new Set())
    } finally {
      setLoading(false)
    }
  }, [site?.id])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const jobMap = new Map(jobs.map((j) => [j.id, j]))
  const clockedOnSet = new Set(activeShifts.map((s) => s.mechanic_id))
  const clockedOnAtMap = new Map(activeShifts.map((s) => [s.mechanic_id, s.clock_on_at]))
  const activeJobByMechanic = new Map(activeTimeEntries.map((t) => [t.mechanic_id, t.job_id]))

  const mechanicsWithStatus: MechanicStatus[] = mechanics.map((mechanic) => {
    const currentJobId = activeJobByMechanic.get(mechanic.id) ?? null
    const currentJob = currentJobId ? jobMap.get(currentJobId) : null
    return {
      mechanic,
      clockedOn: clockedOnSet.has(mechanic.id),
      clockedOnAt: clockedOnAtMap.get(mechanic.id) ?? null,
      currentJobId,
      currentJobNumber: currentJob?.job_number ?? null,
      jobStatusLabel: currentJob ? jobStatusLabel(currentJob.status) : clockedOnSet.has(mechanic.id) ? 'Idle' : '—',
      jobVehicleDisplay: currentJob ? vehicleDisplay(currentJob) : '—',
    }
  })

  const pausedJobs = jobs.filter((j) => j.status === 'paused')
  const awaitingPartsJobs = jobs.filter((j) => j.status === 'awaiting_parts')
  const blockedJobs = [...pausedJobs, ...awaitingPartsJobs]

  const summary: JobSummary = {
    unassigned: jobs.filter((j) => j.status === 'quoted' && !j.assigned_mechanic_id).length,
    assigned: jobs.filter((j) => j.status === 'approved').length,
    inProgress: jobs.filter((j) => j.status === 'in_progress').length,
    paused: pausedJobs.length,
    awaitingParts: awaitingPartsJobs.length,
    blocked: blockedJobs.length,
    awaitingApproval: jobs.filter((j) => j.status === 'awaiting_approval').length,
    needsManager: jobs.filter((j) => j.status === 'ready_for_review').length,
    defectsPendingApproval: jobIdsWithPendingDefects.size,
    completed: jobs.filter((j) => ['manager_approved', 'mechanic_closed', 'ops_review', 'closed_released'].includes(j.status)).length,
    total: jobs.length,
  }

  const needsAttentionJobs = jobs.filter((j) => j.status === 'ready_for_review')
  const jobsWithPendingDefects = jobs.filter((j) => jobIdsWithPendingDefects.has(j.id))
  const unassignedJobs = jobs.filter((j) => j.status === 'quoted' && !j.assigned_mechanic_id)

  const todayStr = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  const jobsForToday = jobs.filter((j) => {
    const createdLocal = j.created_at
      ? `${new Date(j.created_at).getFullYear()}-${String(new Date(j.created_at).getMonth() + 1).padStart(2, '0')}-${String(new Date(j.created_at).getDate()).padStart(2, '0')}`
      : ''
    const poDate = j.po_date || ''
    return createdLocal === todayStr || poDate === todayStr
  })

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
      await fetchAll()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  return {
    jobs,
    mechanics,
    mechanicsWithStatus,
    summary,
    needsAttentionJobs,
    jobsWithPendingDefects,
    jobsForToday,
    unassignedJobs,
    pausedJobs,
    awaitingPartsJobs,
    blockedJobs,
    loading,
    error,
    fetchAll,
    assignMechanic,
    jobStatusLabel,
    vehicleDisplay,
  }
}
