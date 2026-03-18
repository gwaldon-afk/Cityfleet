'use client'

// ═══════════════════════════════════════════════════════════════════════════
// useShift — Clock On / Clock Off
// Location: src/hooks/useShift.ts
// Screen: M-01 | Controls: L-01 (HARD), L-03 (AUTO)
// ═══════════════════════════════════════════════════════════════════════════
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { Shift } from '@/lib/supabase/database.types'

export function useShift() {
  const { user, site, activeShift, refreshShift } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function clockOn(fitForWorkDeclaration?: Record<string, unknown>): Promise<{ success: boolean; shift?: Shift; error?: string }> {
    if (!user || !site) return { success: false, error: 'Not authenticated' }
    if (activeShift) return { success: false, error: 'Already clocked on' }

    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      const { data, error: insertError } = await (supabase as any)
        .from('shifts')
        .insert({
          mechanic_id: user.id,
          site_id: site.id,
          clock_on_at: new Date().toISOString(),
          fit_for_work_declaration: fitForWorkDeclaration ?? null,
        })
        .select()
        .single()

      if (insertError) throw insertError
      await refreshShift()
      return { success: true, shift: data }
    } catch (err: any) {
      const msg = err.message || 'Failed to clock on'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  async function clockOff(): Promise<{ success: boolean; error?: string }> {
    if (!user || !activeShift) return { success: false, error: 'No active shift' }

    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      // L-03 AUTO: Pause any active time entry (end_time null = active)
      await (supabase as any)
        .from('time_entries')
        .update({
          end_time: new Date().toISOString(),
          pause_reason_code: 'End of Shift',
        })
        .eq('mechanic_id', user.id)
        .is('end_time', null)

      // Close the shift (set clock_off_at; active = clock_off_at is null)
      const { error: updateError } = await (supabase as any)
        .from('shifts')
        .update({ clock_off_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', activeShift.id)

      if (updateError) throw updateError
      await refreshShift()
      return { success: true }
    } catch (err: any) {
      const msg = err.message || 'Failed to clock off'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  function getShiftDuration(): number {
    if (!activeShift) return 0
    const clockOn = (activeShift as any).clock_on_at ?? (activeShift as any).clock_on
    if (!clockOn) return 0
    return Math.floor((Date.now() - new Date(clockOn).getTime()) / 1000)
  }

  return {
    activeShift,
    isClockedOn: !!activeShift,
    loading,
    error,
    clockOn,
    clockOff,
    getShiftDuration,
  }
}
