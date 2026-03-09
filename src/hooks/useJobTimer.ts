'use client'

// ═══════════════════════════════════════════════════════════════════════════
// useJobTimer — Start / Pause / Resume / Complete time entries
// Location: src/hooks/useJobTimer.ts
// Screens: M-03, M-07 | Controls: L-02 (HARD), L-04
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { TimeEntry } from '@/lib/supabase/database.types'

export function useJobTimer(jobId: string) {
  const { user, activeShift } = useAuth()
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadEntries = useCallback(async () => {
    if (!user) return
    const supabase = createClient()
    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .eq('job_id', jobId)
      .eq('mechanic_id', user.id)
      .order('start_time', { ascending: true })

    if (data) {
      setAllEntries(data)
      setActiveEntry(data.find((e) => e.status === 'active') || null)
    }
  }, [jobId, user])

  useEffect(() => { loadEntries() }, [loadEntries])

  // Live timer tick
  useEffect(() => {
    if (!activeEntry) { setElapsed(getTotalElapsed()); return }
    const tick = () => setElapsed(getTotalElapsed())
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [activeEntry, allEntries])

  function getTotalElapsed(): number {
    let total = 0
    for (const entry of allEntries) {
      const start = new Date(entry.start_time).getTime()
      const end = entry.end_time ? new Date(entry.end_time).getTime() : Date.now()
      if (entry.status !== 'paused' || entry.end_time) {
        total += end - start
      }
    }
    return Math.floor(total / 1000)
  }

  async function startTimer(): Promise<{ success: boolean; error?: string }> {
    if (!user || !activeShift) return { success: false, error: 'Must be clocked on (L-01)' }
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      // L-02 HARD: one active job only
      const { data: existing } = await supabase
        .from('time_entries')
        .select('id, job_id')
        .eq('mechanic_id', user.id)
        .eq('status', 'active')
        .limit(1)

      if (existing && existing.length > 0) {
        return { success: false, error: 'You already have an active job (L-02). Pause or complete it first.' }
      }

      const { data, error: insertError } = await supabase
        .from('time_entries')
        .insert({
          job_id: jobId,
          mechanic_id: user.id,
          shift_id: activeShift.id,
          start_time: new Date().toISOString(),
          status: 'active',
        })
        .select()
        .single()

      if (insertError) throw insertError

      await supabase
        .from('jobs')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', jobId)

      setActiveEntry(data)
      await loadEntries()
      return { success: true }
    } catch (err: any) {
      const msg = err.message || 'Failed to start timer'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  async function pauseTimer(reason: string, note?: string): Promise<{ success: boolean; error?: string }> {
    if (!activeEntry) return { success: false, error: 'No active timer' }
    try {
      setLoading(true)
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('time_entries')
        .update({
          status: 'paused',
          end_time: new Date().toISOString(),
          pause_reason: reason,
          pause_note: note || null,
        })
        .eq('id', activeEntry.id)

      if (updateError) throw updateError

      const jobStatus = reason === 'Waiting on Parts' ? 'awaiting_parts' : 'paused'
      await supabase
        .from('jobs')
        .update({ status: jobStatus, updated_at: new Date().toISOString() })
        .eq('id', jobId)

      setActiveEntry(null)
      await loadEntries()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  async function resumeTimer(): Promise<{ success: boolean; error?: string }> {
    return startTimer()
  }

  async function completeTimer(): Promise<{ success: boolean; error?: string }> {
    if (!activeEntry) return { success: false, error: 'No active timer' }
    try {
      setLoading(true)
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('time_entries')
        .update({ status: 'completed', end_time: new Date().toISOString() })
        .eq('id', activeEntry.id)

      if (updateError) throw updateError
      setActiveEntry(null)
      await loadEntries()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  function formatElapsed(seconds?: number): string {
    const s = seconds ?? elapsed
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  return {
    activeEntry, allEntries, elapsed, isRunning: !!activeEntry,
    loading, error, startTimer, pauseTimer, resumeTimer, completeTimer,
    formatElapsed, loadEntries,
  }
}
