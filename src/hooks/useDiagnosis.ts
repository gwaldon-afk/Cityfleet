'use client'

// ═══════════════════════════════════════════════════════════════════════════
// useDiagnosis — Diagnosis entries with evidence
// Location: src/hooks/useDiagnosis.ts
// Screen: M-05 | Controls: D-01 (HARD)
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { JobDiagnosis } from '@/lib/supabase/database.types'

export function useDiagnosis(jobId: string) {
  const { user } = useAuth()
  const [findings, setFindings] = useState<JobDiagnosis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFindings = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('job_diagnoses')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true })

    setFindings(data || [])
    setLoading(false)
  }, [jobId])

  useEffect(() => { loadFindings() }, [loadFindings])

  async function addFinding(params: {
    category: string
    finding: string
    evidenceUrls: string[]
  }): Promise<{ success: boolean; error?: string }> {
    if (!user) return { success: false, error: 'Not authenticated' }
    try {
      setError(null)
      const supabase = createClient()

      const { error: insertError } = await supabase
        .from('job_diagnoses')
        .insert({
          job_id: jobId,
          mechanic_id: user.id,
          category: params.category,
          finding: params.finding,
          evidence_urls: params.evidenceUrls,
        })

      if (insertError) throw insertError
      await loadFindings()

      await supabase
        .from('jobs')
        .update({ status: 'diagnosing', updated_at: new Date().toISOString() })
        .eq('id', jobId)

      return { success: true }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  async function submitDiagnosis(): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()
      await supabase
        .from('jobs')
        .update({ status: 'diagnosing', updated_at: new Date().toISOString() })
        .eq('id', jobId)

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  return { findings, hasDiagnosis: findings.length > 0, loading, error, addFinding, submitDiagnosis, loadFindings }
}
