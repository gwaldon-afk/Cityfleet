'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { SiteMechanic } from './useSiteMechanics'

export interface MechanicWithStatus {
  mechanic: SiteMechanic
  clockedOn: boolean
  hasActiveJob: boolean
  currentJobNumber: string | null
}

export function useSiteMechanicsWithStatus() {
  const { site } = useAuth()
  const [mechanics, setMechanics] = useState<SiteMechanic[]>([])
  const [activeShifts, setActiveShifts] = useState<{ mechanic_id: string }[]>([])
  const [activeTimeEntries, setActiveTimeEntries] = useState<{ mechanic_id: string; job_id: string }[]>([])
  const [jobNumberByJobId, setJobNumberByJobId] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!site?.id) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const supabase = createClient()

      const [rolesRes, shiftsRes, siteJobsRes, timeRes] = await Promise.all([
        (supabase as any).from('user_roles').select('user_id').eq('role', 'mechanic').eq('site_id', site.id),
        (supabase as any).from('shifts').select('mechanic_id').eq('site_id', site.id).is('clock_off_at', null),
        (supabase as any).from('jobs').select('id, job_number').eq('site_id', site.id),
        (supabase as any).from('time_entries').select('mechanic_id, job_id').is('end_time', null),
      ])

      const userIds = (rolesRes.data || []).map((r: { user_id: string }) => r.user_id)
      if (userIds.length === 0) {
        setMechanics([])
        setActiveShifts([])
        setActiveTimeEntries([])
        setJobNumberByJobId(new Map())
        return
      }

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
      setActiveShifts(shiftsRes.data || [])

      const siteJobIds = new Set((siteJobsRes.data || []).map((j: { id: string }) => j.id))
      const entries = (timeRes.data || []).filter((t: { job_id: string }) => siteJobIds.has(t.job_id))
      setActiveTimeEntries(entries)

      const jobMap = new Map<string, string>(
        (siteJobsRes.data || []).map((j: { id: string; job_number: string }) => [j.id, j.job_number])
      )
      setJobNumberByJobId(jobMap)
    } catch {
      setMechanics([])
      setActiveShifts([])
      setActiveTimeEntries([])
      setJobNumberByJobId(new Map())
    } finally {
      setLoading(false)
    }
  }, [site?.id])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const clockedOnSet = new Set(activeShifts.map((s) => s.mechanic_id))
  const activeJobByMechanic = new Map(activeTimeEntries.map((t) => [t.mechanic_id, t.job_id]))

  const mechanicsWithStatus: MechanicWithStatus[] = mechanics.map((mechanic) => {
    const currentJobId = activeJobByMechanic.get(mechanic.id) ?? null
    return {
      mechanic,
      clockedOn: clockedOnSet.has(mechanic.id),
      hasActiveJob: currentJobId != null,
      currentJobNumber: currentJobId ? jobNumberByJobId.get(currentJobId) ?? null : null,
    }
  })

  return { mechanicsWithStatus, mechanics, loading, fetchAll }
}
