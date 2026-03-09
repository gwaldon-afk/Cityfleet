'use client'

// ═══════════════════════════════════════════════════════════════════════════
// useDefects — Defect capture with evidence + severity
// Location: src/hooks/useDefects.ts
// Screen: M-06 | Controls: D-02, D-03 (HARD), D-04 (HARD)
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { JobDefect, DefectSeverity } from '@/lib/supabase/database.types'

export function useDefects(jobId: string) {
  const { user } = useAuth()
  const [defects, setDefects] = useState<JobDefect[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDefects = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('job_defects')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true })

    setDefects(data || [])
    setLoading(false)
  }, [jobId])

  useEffect(() => { loadDefects() }, [loadDefects])

  async function addDefect(params: {
    description: string
    severity: DefectSeverity
    category: string
    evidenceUrls: string[]
  }): Promise<{ success: boolean; error?: string }> {
    if (!user) return { success: false, error: 'Not authenticated' }
    if (!params.evidenceUrls?.length) return { success: false, error: 'D-03 HARD: Photo/video evidence is mandatory' }
    if (!params.severity) return { success: false, error: 'D-04 HARD: Severity (RED/ORANGE) is mandatory' }

    try {
      setError(null)
      const supabase = createClient()

      const { error: insertError } = await supabase
        .from('job_defects')
        .insert({
          job_id: jobId,
          mechanic_id: user.id,
          description: params.description,
          severity: params.severity,
          category: params.category,
          evidence_urls: params.evidenceUrls,
          status: 'logged',
        })

      if (insertError) throw insertError
      await loadDefects()
      return { success: true }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  async function submitDefects(): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()
      await supabase
        .from('jobs')
        .update({ status: 'defects_logged', updated_at: new Date().toISOString() })
        .eq('id', jobId)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const redDefects = defects.filter((d) => d.severity === 'RED')
  const orangeDefects = defects.filter((d) => d.severity === 'ORANGE')

  return {
    defects, redDefects, orangeDefects, hasDefects: defects.length > 0,
    loading, error, addDefect, submitDefects, loadDefects,
  }
}
