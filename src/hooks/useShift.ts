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

  async function clockOn(): Promise<{ success: boolean; shift?: Shift; error?: string }> {
    if (!user || !site) return { success: false, error: 'Not authenticated' }
    if (activeShift) return { success: false, error: 'Already clocked on' }

    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      const { data, error: insertError } = await supabase
        .from('shifts')
        .insert({
          user_id: user.id,
          site_id: site.id,
          clock_on: new Date().toISOString(),
          status: 'active',
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

      // L-03 AUTO: Pause any active time entry
      await supabase
        .from('time_entries')
        .update({
          status: 'paused',
          end_time: new Date().toISOString(),
          pause_reason: 'End of Shift',
        })
        .eq('mechanic_id', user.id)
        .eq('status', 'active')

      // Close the shift
      const { error: updateError } = await supabase
        .from('shifts')
        .update({ clock_off: new Date().toISOString(), status: 'completed' })
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
    return Math.floor((Date.now() - new Date(activeShift.clock_on).getTime()) / 1000)
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
