'use client'

// ═══════════════════════════════════════════════════════════════════════════
// useJobParts — Parts & Consumables recording
// Location: src/hooks/useJobParts.ts
// Screen: PARTS | Controls: P-02, P-03
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { JobPart, JobConsumable, JobPartUsage } from '@/lib/supabase/database.types'

export function useJobParts(jobId: string) {
  const { user } = useAuth()
  const [parts, setParts] = useState<JobPart[]>([])
  const [consumables, setConsumables] = useState<JobConsumable[]>([])
  const [usages, setUsages] = useState<JobPartUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadParts = useCallback(async () => {
    try {
      const supabase = createClient()

      const { data: partsData } = await supabase
        .from('job_parts').select('*').eq('job_id', jobId).order('created_at', { ascending: true })
      setParts(partsData || [])

      const { data: consumablesData } = await supabase
        .from('job_consumables').select('*').eq('job_id', jobId).order('created_at', { ascending: true })
      setConsumables(consumablesData || [])

      const { data: usageData } = await supabase
        .from('job_part_usages').select('*').eq('job_id', jobId)
      setUsages(usageData || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => { loadParts() }, [loadParts])

  async function recordPartUsage(jobPartId: string, quantityUsed: number): Promise<{ success: boolean; error?: string }> {
    if (!user) return { success: false, error: 'Not authenticated' }
    try {
      const supabase = createClient()
      const { error: insertError } = await supabase
        .from('job_part_usages')
        .insert({ job_id: jobId, job_part_id: jobPartId, mechanic_id: user.id, quantity_used: quantityUsed })
      if (insertError) throw insertError
      await loadParts()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  async function addConsumable(params: { name: string; quantity: number; unit: string }): Promise<{ success: boolean; error?: string }> {
    if (!user) return { success: false, error: 'Not authenticated' }
    try {
      const supabase = createClient()
      const { error: insertError } = await supabase
        .from('job_consumables')
        .insert({ job_id: jobId, mechanic_id: user.id, name: params.name, quantity: params.quantity, unit: params.unit })
      if (insertError) throw insertError
      await loadParts()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  async function removeConsumable(consumableId: string): Promise<{ success: boolean }> {
    try {
      const supabase = createClient()
      await supabase.from('job_consumables').delete().eq('id', consumableId)
      await loadParts()
      return { success: true }
    } catch {
      return { success: false }
    }
  }

  const issuedParts = parts.filter((p) => p.status === 'issued')
  const orderedParts = parts.filter((p) => p.status === 'ordered')
  const receivedParts = parts.filter((p) => p.status === 'received')
  const requestedParts = parts.filter((p) => p.status === 'requested')

  return {
    parts, consumables, usages, issuedParts, orderedParts, receivedParts, requestedParts,
    loading, error, recordPartUsage, addConsumable, removeConsumable, loadParts,
  }
}
