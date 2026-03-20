'use client'

/**
 * EXEC-01 Real-Time Operational Dashboard — aggregates for WM (single site) or Ops (all sites).
 * Billable hours: excludes time_entries rows with non-empty pause_reason_code (job on hold).
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getDashboardRefreshIntervalMs } from '@/lib/dashboard-constants'

export interface ExecJobRow {
  id: string
  job_number: string
  status: string
  site_id: string
  started_at: string | null
  completed_at: string | null
  released_at: string | null
  assigned_mechanic_id: string | null
  vehicle: { registration_number: string | null; vin: string | null; make: string | null; model: string | null } | null
  customer: { name: string } | null
  site: { id: string; name: string } | null
}

export interface ExecMechanicRow {
  mechanicId: string
  name: string
  siteId: string
  siteName: string
  clockedOn: boolean
  clockedOnAt: string | null
  currentJobId: string | null
  currentJobNumber: string | null
  jobStatusLabel: string
  vehicleDisplay: string
  billableHoursToday: number
}

const STATUS_LABEL: Record<string, string> = {
  quoted: 'Quoted',
  approved: 'Approved',
  in_progress: 'In progress',
  paused: 'Paused',
  awaiting_parts: 'Awaiting parts',
  awaiting_approval: 'Awaiting approval',
  ready_for_review: 'Ready for review',
  manager_approved: 'Manager approved',
  mechanic_closed: 'Mechanic closed',
  ops_review: 'Ops review',
  closed_released: 'Closed',
}

function vehicleDisplay(job: ExecJobRow): string {
  const v = job.vehicle
  if (!v) return '—'
  if (v.registration_number) return v.registration_number
  return [v.make, v.model].filter(Boolean).join(' ') || v.vin || '—'
}

function jobStatusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status.replace(/_/g, ' ')
}

function startOfTodayISO(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function endOfTodayISO(): string {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

function todayDateStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Billable segment: pause_reason_code set => on hold, not billable */
function entryBillableSeconds(entry: {
  start_time: string
  end_time: string | null
  duration_seconds: number | null
  pause_reason_code: string | null
}): number {
  const pr = entry.pause_reason_code
  if (pr != null && String(pr).trim() !== '') return 0
  if (entry.duration_seconds != null && entry.duration_seconds > 0) return entry.duration_seconds
  const end = entry.end_time ? new Date(entry.end_time).getTime() : Date.now()
  const start = new Date(entry.start_time).getTime()
  return Math.max(0, Math.floor((end - start) / 1000))
}

function overlapsToday(startIso: string, endIso: string | null): boolean {
  const s = new Date(startIso).getTime()
  const e = endIso ? new Date(endIso).getTime() : Date.now()
  const a = new Date(startOfTodayISO()).getTime()
  const b = new Date(endOfTodayISO()).getTime()
  return s <= b && e >= a
}

export interface ExecRealtimeKpis {
  activeInProgress: number
  mechanicsClockedOn: number
  mechanicsTotal: number
  completedJobsToday: number
  avgTurnaroundMechanicHours: number | null
  avgTurnaroundFullHours: number | null
}

export interface StatusSlice {
  status: string
  label: string
  count: number
}

export function useExecRealtimeDashboard(opts: { siteId: string | null; isOps: boolean }) {
  const { siteId, isOps } = opts
  const [jobs, setJobs] = useState<ExecJobRow[]>([])
  const [mechanics, setMechanics] = useState<ExecMechanicRow[]>([])
  const [statusSlices, setStatusSlices] = useState<StatusSlice[]>([])
  const [kpis, setKpis] = useState<ExecRealtimeKpis>({
    activeInProgress: 0,
    mechanicsClockedOn: 0,
    mechanicsTotal: 0,
    completedJobsToday: 0,
    avgTurnaroundMechanicHours: null,
    avgTurnaroundFullHours: null,
  })
  const [completionsByHour, setCompletionsByHour] = useState<number[]>(() => Array(24).fill(0))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAll = useCallback(async () => {
    if (!isOps && !siteId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      let jobsQuery = (supabase as any)
        .from('jobs')
        .select(
          `
          id, job_number, status, site_id, started_at, completed_at, released_at, assigned_mechanic_id,
          vehicle:vehicles(registration_number, vin, make, model),
          customer:customers(name),
          site:sites(id, name)
        `
        )
        .order('updated_at', { ascending: false })

      if (!isOps && siteId) {
        jobsQuery = jobsQuery.eq('site_id', siteId)
      }

      const { data: jobsData, error: jobsErr } = await jobsQuery
      if (jobsErr) throw jobsErr
      const jobList: ExecJobRow[] = jobsData || []
      setJobs(jobList)

      const statusMap = new Map<string, number>()
      for (const j of jobList) {
        statusMap.set(j.status, (statusMap.get(j.status) ?? 0) + 1)
      }
      setStatusSlices(
        Array.from(statusMap.entries())
          .map(([status, count]) => ({
            status,
            label: jobStatusLabel(status),
            count,
          }))
          .sort((a, b) => b.count - a.count)
      )

      const today = todayDateStr()
      const inProgress = jobList.filter((j) => j.status === 'in_progress').length

      const completedToday = jobList.filter((j) => {
        if (j.released_at && j.released_at.slice(0, 10) === today) return true
        if (j.completed_at && j.completed_at.slice(0, 10) === today && j.status === 'mechanic_closed') return true
        return false
      }).length

      const mechFinish: number[] = []
      const fullFinish: number[] = []
      for (const j of jobList) {
        if (!j.started_at) continue
        const start = new Date(j.started_at).getTime()
        if (j.completed_at && j.completed_at.slice(0, 10) === today) {
          const ms = new Date(j.completed_at).getTime() - start
          if (ms > 0) mechFinish.push(ms / 3600000)
        }
        if (j.released_at && j.released_at.slice(0, 10) === today) {
          const ms = new Date(j.released_at).getTime() - start
          if (ms > 0) fullFinish.push(ms / 3600000)
        }
      }
      const avgM = mechFinish.length ? mechFinish.reduce((a, b) => a + b, 0) / mechFinish.length : null
      const avgF = fullFinish.length ? fullFinish.reduce((a, b) => a + b, 0) / fullFinish.length : null

      const hourly = Array(24).fill(0)
      for (const j of jobList) {
        const ts = j.released_at || j.completed_at
        if (!ts) continue
        if (ts.slice(0, 10) !== today) continue
        const h = new Date(ts).getHours()
        hourly[h] += 1
      }
      setCompletionsByHour(hourly)

      let rolesQuery = (supabase as any).from('user_roles').select('user_id, site_id').eq('role', 'mechanic')
      if (!isOps && siteId) {
        rolesQuery = rolesQuery.eq('site_id', siteId)
      }
      const { data: roleRows, error: rolesErr } = await rolesQuery
      if (rolesErr) throw rolesErr

      const siteIds = Array.from(
        new Set((roleRows || []).map((r: { site_id: string }) => r.site_id).filter(Boolean))
      ) as string[]
      let sitesData: { id: string; name: string }[] = []
      if (siteIds.length > 0) {
        const { data: sd } = await (supabase as any).from('sites').select('id, name').in('id', siteIds)
        sitesData = sd || []
      }
      const siteName = new Map<string, string>(sitesData.map((s) => [s.id, s.name]))

      const userIds = Array.from(new Set((roleRows || []).map((r: { user_id: string }) => r.user_id))) as string[]
      let usersData: { id: string; first_name: string; last_name: string }[] = []
      if (userIds.length > 0) {
        const { data: ud } = await (supabase as any)
          .from('users')
          .select('id, first_name, last_name')
          .in('id', userIds)
          .eq('status', 'active')
        usersData = ud || []
      }

      const userName = new Map(usersData.map((u) => [u.id, `${u.first_name} ${u.last_name}`]))

      let shiftsQuery = (supabase as any)
        .from('shifts')
        .select('mechanic_id, clock_on_at, site_id')
        .is('clock_off_at', null)
      if (!isOps && siteId) {
        shiftsQuery = shiftsQuery.eq('site_id', siteId)
      }
      const { data: shiftsData } = await shiftsQuery
      const clockedSet = new Set((shiftsData || []).map((s: { mechanic_id: string }) => s.mechanic_id))
      const clockedAt = new Map(
        (shiftsData || []).map((s: { mechanic_id: string; clock_on_at: string }) => [s.mechanic_id, s.clock_on_at])
      )

      const jobMap = new Map(jobList.map((j) => [j.id, j]))
      let timeQuery = (supabase as any)
        .from('time_entries')
        .select('mechanic_id, job_id, start_time, end_time, duration_seconds, pause_reason_code')
        .gte('start_time', startOfTodayISO())

      const { data: timeRows, error: timeErr } = await timeQuery
      if (timeErr) throw timeErr

      const billableByMechanic = new Map<string, number>()
      for (const row of timeRows || []) {
        if (!overlapsToday(row.start_time, row.end_time)) continue
        const sec = entryBillableSeconds(row)
        if (sec <= 0) continue
        const mid = row.mechanic_id as string
        billableByMechanic.set(mid, (billableByMechanic.get(mid) ?? 0) + sec)
      }

      const openEntries = (timeRows || []).filter((t: { end_time: string | null }) => !t.end_time)
      const activeJobByMech = new Map<string, string>()
      for (const t of openEntries) {
        activeJobByMech.set(t.mechanic_id, t.job_id)
      }

      const mechRows: ExecMechanicRow[] = (roleRows || []).map((r: { user_id: string; site_id: string }) => {
        const jid = activeJobByMech.get(r.user_id) ?? null
        const j = jid ? jobMap.get(jid) : null
        const billSec = billableByMechanic.get(r.user_id) ?? 0
        return {
          mechanicId: r.user_id,
          name: userName.get(r.user_id) ?? r.user_id,
          siteId: r.site_id,
          siteName: siteName.get(r.site_id) ?? '—',
          clockedOn: clockedSet.has(r.user_id),
          clockedOnAt: clockedAt.get(r.user_id) ?? null,
          currentJobId: jid,
          currentJobNumber: j?.job_number ?? null,
          jobStatusLabel: j ? jobStatusLabel(j.status) : clockedSet.has(r.user_id) ? 'Idle' : '—',
          vehicleDisplay: j ? vehicleDisplay(j) : '—',
          billableHoursToday: Math.round((billSec / 3600) * 100) / 100,
        }
      })

      mechRows.sort((a, b) => a.name.localeCompare(b.name))
      setMechanics(mechRows)

      setKpis({
        activeInProgress: inProgress,
        mechanicsClockedOn: mechRows.filter((m) => m.clockedOn).length,
        mechanicsTotal: mechRows.length,
        completedJobsToday: completedToday,
        avgTurnaroundMechanicHours: avgM,
        avgTurnaroundFullHours: avgF,
      })

      setLastUpdated(new Date())
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard')
      setJobs([])
      setMechanics([])
      setStatusSlices([])
      setKpis({
        activeInProgress: 0,
        mechanicsClockedOn: 0,
        mechanicsTotal: 0,
        completedJobsToday: 0,
        avgTurnaroundMechanicHours: null,
        avgTurnaroundFullHours: null,
      })
      setCompletionsByHour(Array(24).fill(0))
    } finally {
      setLoading(false)
    }
  }, [siteId, isOps])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    const ms = getDashboardRefreshIntervalMs()
    const id = setInterval(() => {
      fetchAll()
    }, ms)
    return () => clearInterval(id)
  }, [fetchAll])

  const maxStatusCount = useMemo(() => statusSlices.reduce((m, s) => Math.max(m, s.count), 0), [statusSlices])
  const maxHourly = useMemo(() => completionsByHour.reduce((m, n) => Math.max(m, n), 0), [completionsByHour])

  return {
    jobs,
    mechanics,
    statusSlices,
    kpis,
    completionsByHour,
    maxStatusCount,
    maxHourly,
    loading,
    error,
    fetchAll,
    lastUpdated,
    vehicleDisplay,
    jobStatusLabel,
  }
}
