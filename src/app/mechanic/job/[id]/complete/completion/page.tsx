'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const CHECKLIST_ITEMS = [
  { id: 'clean', label: 'Vehicle is clean and tidy — no grease marks, no debris', control: 'Q-02' },
  { id: 'workplace', label: 'Workplace cleaned and ready for next job', control: 'Q-02' },
  { id: 'tools', label: 'All tools returned to correct location', control: 'Q-03' },
  { id: 'equipment', label: 'All equipment returned and secured', control: 'Q-03' },
  { id: 'trash', label: 'All trash and waste removed from bay', control: 'Q-02' },
  { id: 'sticker', label: 'Service sticker / tag applied to vehicle (if applicable)', control: 'Q-02' },
]

export default function CompletionScreen() {
  const params = useParams()
  const jobId = params.id as string
  const { user } = useAuth()
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [jobNotes, setJobNotes] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [useVoice, setUseVoice] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const allChecked = CHECKLIST_ITEMS.every((item) => checkedItems[item.id])
  const hasNotes = jobNotes.trim().length > 0 || voiceTranscript.trim().length > 0

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Voice-to-text using Web Speech API
  const startVoiceCapture = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice capture is not supported in this browser. Please use Chrome or type your notes.')
      return
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-AU'

    recognition.onstart = () => setIsRecording(true)
    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setVoiceTranscript(transcript)
    }
    recognition.onerror = () => setIsRecording(false)
    recognition.onend = () => setIsRecording(false)
    recognition.start()

    // Auto-stop after 60 seconds
    setTimeout(() => {
      try { recognition.stop() } catch (e) { /* ignore */ }
    }, 60000)
  }

  const handleSubmit = async () => {
    if (!allChecked || !hasNotes || !user || !jobId) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const supabase = createClient()
      const insertNote = async (content: string, noteType: 'text' | 'voice') => {
        const row: Record<string, unknown> = {
          job_id: jobId,
          created_by: user.id,
          content,
        }
        try {
          await (supabase as any).from('job_notes').insert({ ...row, note_type: noteType })
        } catch {
          await (supabase as any).from('job_notes').insert(row)
        }
      }
      if (jobNotes.trim()) await insertNote(jobNotes.trim(), 'text')
      if (voiceTranscript.trim()) await insertNote(voiceTranscript.trim(), 'voice')
      const { error: jobError } = await (supabase as any)
        .from('jobs')
        .update({ status: 'ready_for_review', updated_at: new Date().toISOString() })
        .eq('id', jobId)
      if (jobError) throw jobError
      setSubmitted(true)
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">CITY FLEET</p>
              <p className="font-bold text-sm">Job</p>
            </div>
            <span className="text-xs bg-blue-900/50 px-2 py-1 rounded">STEP 12 — COMPLETE</span>
          </div>
        </div>
        <div className="max-w-md mx-auto p-6 text-center mt-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Completion Submitted</h2>
          <p className="text-gray-600 mb-1">Checklist complete. Notes recorded (text and/or voice).</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 my-4">
            <p className="text-sm text-blue-800 font-semibold">Workshop Manager has been notified</p>
            <p className="text-xs text-blue-600 mt-1">Your job is now &quot;Ready for Review&quot;. Wait for manager two-hand-touch approval (A-03).</p>
          </div>
          <Link
            href={`/mechanic/job/${jobId}/awaiting`}
            className="block w-full py-3 rounded-lg text-white font-bold text-lg text-center bg-cityfleet-gold"
          >
            VIEW APPROVAL STATUS →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">CITY FLEET</p>
            <p className="font-bold text-sm">Job completion</p>
          </div>
          <span className="text-xs bg-blue-900/50 px-2 py-1 rounded">STEP 12 — COMPLETE</span>
        </div>
      </div>

      {submitError && (
        <div className="max-w-md mx-auto p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{submitError}</div>
        </div>
      )}

      {/* Hard Gate */}
      <div className="bg-red-50 border-b border-red-200 px-4 py-2">
        <p className="text-xs text-red-700 font-semibold">
          ⛔ Q-02/Q-03/Q-04 HARD GATE: All checklist items + job notes required
        </p>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Completion Checklist */}
        <div className="bg-white rounded-lg shadow p-4 space-y-1">
          <h3 className="font-bold text-gray-800 mb-2">Completion Checklist</h3>
          <p className="text-xs text-gray-500 mb-3">All items must be checked before submitting.</p>
          {CHECKLIST_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                checkedItems[item.id] ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div
                className={`w-6 h-6 flex-shrink-0 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                  checkedItems[item.id]
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {checkedItems[item.id] && <span className="text-xs">✓</span>}
              </div>
              <div className="flex-1">
                <p className={`text-sm ${checkedItems[item.id] ? 'text-green-800' : 'text-gray-700'}`}>
                  {item.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Control: {item.control}</p>
              </div>
            </button>
          ))}
          <div className="pt-2">
            <p className={`text-xs font-semibold ${allChecked ? 'text-green-600' : 'text-gray-400'}`}>
              {Object.values(checkedItems).filter(Boolean).length}/{CHECKLIST_ITEMS.length} items completed
            </p>
          </div>
        </div>

        {/* Job Notes — Voice or Text */}
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <h3 className="font-bold text-gray-800">Job Notes <span className="text-red-500">*</span></h3>
          <p className="text-xs text-gray-600">
            Describe work completed. Use voice or text. Original input is always retained for audit.
          </p>

          {/* Toggle Voice / Text */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setUseVoice(false)}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
                !useVoice ? 'bg-white text-gray-800 shadow' : 'text-gray-500'
              }`}
            >
              ⌨ Type
            </button>
            <button
              onClick={() => setUseVoice(true)}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
                useVoice ? 'bg-white text-gray-800 shadow' : 'text-gray-500'
              }`}
            >
              🎤 Voice
            </button>
          </div>

          {useVoice ? (
            <div className="space-y-2">
              <button
                onClick={startVoiceCapture}
                disabled={isRecording}
                className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isRecording ? '🔴 RECORDING... (tap to stop)' : '🎤 TAP TO START RECORDING'}
              </button>
              {voiceTranscript && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Voice Transcript:</p>
                  <p className="text-sm text-gray-800">{voiceTranscript}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    AI will clean up this text for the final job report. Original retained.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <textarea
              value={jobNotes}
              onChange={(e) => setJobNotes(e.target.value)}
              placeholder="Describe the work completed, any issues encountered, parts used, observations..."
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          )}

          {hasNotes && (
            <p className="text-xs text-green-600">✅ Notes captured</p>
          )}
        </div>
      </div>

      {/* Fixed Bottom Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!allChecked || !hasNotes || isSubmitting}
            className="w-full py-3 rounded-lg text-white font-bold text-lg disabled:opacity-40 transition-colors"
            style={{ backgroundColor: allChecked && hasNotes ? '#B8860B' : '#9CA3AF' }}
          >
            {isSubmitting ? 'SUBMITTING...' : 'SUBMIT FOR MANAGER REVIEW'}
          </button>
          {(!allChecked || !hasNotes) && (
            <p className="text-center text-xs text-red-500 mt-1">
              {!allChecked ? 'Complete all checklist items' : 'Add job notes (voice or text)'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
