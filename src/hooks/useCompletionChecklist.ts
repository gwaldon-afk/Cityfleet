'use client'

// ═══════════════════════════════════════════════════════════════════════════
// useCompletionChecklist — Clean-down checklist + job notes
// Location: src/hooks/useCompletionChecklist.ts
// Screen: M-09 | Controls: Q-02, Q-03, Q-04 (all HARD)
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { JobCompletionChecklist, JobNote } from '@/lib/supabase/database.types'

type InsertJobCompletionChecklist = Omit<JobCompletionChecklist, 'id' | 'created_at'>

export function useCompletionChecklist(jobId: string) {
  const { user } = useAuth()
  const [checklist, setChecklist] = useState<JobCompletionChecklist | null>(null)
  const [notes, setNotes] = useState<JobNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!user) return
      const supabase = createClient()

      const { data: checklistData } = await supabase
        .from('job_completion_checklists').select('*').eq('job_id', jobId).maybeSingle()
      setChecklist(checklistData)

      const { data: notesData } = await supabase
        .from('job_notes').select('*').eq('job_id', jobId).order('created_at', { ascending: true })
      setNotes(notesData || [])
      setLoading(false)
    }
    load()
  }, [jobId, user])

  async function submitChecklist(params: {
    vehicleClean: boolean
    workplaceClean: boolean
    toolsReturned: boolean
    equipmentReturned: boolean
    trashRemoved: boolean
    serviceStickerApplied: boolean
  }): Promise<{ success: boolean; error?: string }> {
    if (!user) return { success: false, error: 'Not authenticated' }
    if (!params.vehicleClean || !params.workplaceClean || !params.trashRemoved) {
      return { success: false, error: 'Q-02 HARD: All cleanliness items must be confirmed' }
    }
    if (!params.toolsReturned || !params.equipmentReturned) {
      return { success: false, error: 'Q-03 HARD: Tools and equipment return must be confirmed' }
    }

    try {
      setError(null)
      const supabase = createClient()

      // Table may not be in generated DB types (Supabase client 2.99 strict typing)
      const payload: InsertJobCompletionChecklist = {
        job_id: jobId,
        mechanic_id: user.id,
        vehicle_clean: params.vehicleClean,
        workplace_clean: params.workplaceClean,
        tools_returned: params.toolsReturned,
        equipment_returned: params.equipmentReturned,
        trash_removed: params.trashRemoved,
        service_sticker_applied: params.serviceStickerApplied,
        completed_at: new Date().toISOString(),
      }
      const { data, error: insertError } = await (supabase as any)
        .from('job_completion_checklists')
        .insert(payload)
        .select()
        .single()

      if (insertError) throw insertError
      setChecklist(data)
      return { success: true }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  async function addNote(params: {
    noteType: 'text' | 'voice'
    content: string
    originalContent?: string
  }): Promise<{ success: boolean; error?: string }> {
    if (!user) return { success: false, error: 'Not authenticated' }
    if (!params.content?.trim()) return { success: false, error: 'Q-04 HARD: Job notes are required' }

    try {
      const supabase = createClient()
      const { error: insertError } = await (supabase as any)
        .from('job_notes')
        .insert({
          job_id: jobId,
          created_by: user.id,
          note_type: params.noteType ?? 'text',
          content: params.content,
        })

      if (insertError) throw insertError

      const { data } = await supabase
        .from('job_notes').select('*').eq('job_id', jobId).order('created_at', { ascending: true })
      setNotes(data || [])
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  async function markReadyForReview(): Promise<{ success: boolean; error?: string }> {
    if (!checklist) return { success: false, error: 'Completion checklist must be submitted first' }
    if (notes.length === 0) return { success: false, error: 'Q-04 HARD: At least one job note is required' }

    try {
      const supabase = createClient()
      await supabase
        .from('jobs')
        .update({ status: 'ready_for_review', updated_at: new Date().toISOString() })
        .eq('id', jobId)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  return {
    checklist, notes, isChecklistCompleted: !!checklist, hasNotes: notes.length > 0,
    loading, error, submitChecklist, addNote, markReadyForReview,
  }
}
