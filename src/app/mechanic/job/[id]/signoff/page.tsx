'use client'

import { useState } from 'react'

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
const MOCK_JOB = {
  id: 'job-4822',
  job_number: 'JOB-4822',
  vehicle_id: 'VIN: 6T1BF3EK5CU123456',
  vehicle_name: 'Volvo FH16 — Fleet #V-114',
  work_type: 'Scheduled 500hr Service',
  po_number: 'PO-2026-0418',
  total_hours: '3h 42m',
  start_time: '08:12 AM',
  parts_used: 4,
  defects_logged: 2,
  defects_resolved: 2,
  manager_name: 'Sarah Mitchell',
  approved_at: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
}

export default function FinalSignOffScreen() {
  const [confirmed, setConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  const handleFinalSignOff = () => {
    if (!confirmed) return
    setIsSubmitting(true)
    // TODO: Save to Supabase — close time entry, lock job, update status
    setTimeout(() => {
      setIsSubmitting(false)
      setCompleted(true)
    }, 1500)
  }

  // ─── COMPLETED STATE ────────────────────────────────────────────────────
  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-green-700 to-green-500 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">CITY FLEET</p>
              <p className="font-bold text-sm">{MOCK_JOB.job_number}</p>
            </div>
            <span className="text-xs bg-green-900/50 px-2 py-1 rounded">✅ CLOSED</span>
          </div>
        </div>
        <div className="max-w-md mx-auto p-6 text-center mt-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-5xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Job Complete</h2>
          <p className="text-gray-600 mb-4">
            {MOCK_JOB.job_number} has been closed. Timer stopped. All records locked.
          </p>

          {/* Final Summary Card */}
          <div className="bg-white rounded-lg shadow p-4 text-left mb-6">
            <h3 className="font-bold text-gray-800 text-sm mb-3 text-center">Job Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Job Number</span>
                <span className="font-medium">{MOCK_JOB.job_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vehicle</span>
                <span className="font-medium">{MOCK_JOB.vehicle_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Labour</span>
                <span className="font-bold text-green-600">{MOCK_JOB.total_hours}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Parts Used</span>
                <span className="font-medium">{MOCK_JOB.parts_used}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Defects Resolved</span>
                <span className="font-medium">{MOCK_JOB.defects_resolved}/{MOCK_JOB.defects_logged}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Approved By</span>
                <span className="font-medium">{MOCK_JOB.manager_name}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-xs text-blue-700">
              This job has been sent to OPS for close-out and cost validation (Step 15).
              Time entries and costs are now immutable (L-04).
            </p>
          </div>

          <a
            href="/mechanic/jobs"
            className="block w-full py-3 rounded-lg text-white font-bold text-lg text-center"
            style={{ backgroundColor: '#B8860B' }}
          >
            BACK TO JOB LIST
          </a>
        </div>
      </div>
    )
  }

  // ─── SIGN-OFF SCREEN ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-500 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">CITY FLEET</p>
            <p className="font-bold text-sm">{MOCK_JOB.job_number}</p>
          </div>
          <span className="text-xs bg-green-900/50 px-2 py-1 rounded">STEP 14 — SIGN OFF</span>
        </div>
        <div className="mt-2 text-xs opacity-80">
          {MOCK_JOB.vehicle_name} • {MOCK_JOB.vehicle_id}
        </div>
      </div>

      {/* Approval Confirmation */}
      <div className="bg-green-50 border-b border-green-200 px-4 py-2">
        <p className="text-xs text-green-700 font-semibold">
          ✅ Manager Approved: {MOCK_JOB.manager_name} at{' '}
          {MOCK_JOB.approved_at.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Job Review Summary */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold text-gray-800 mb-3">Job Review</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Job Number</span>
              <span className="text-sm font-bold text-gray-800">{MOCK_JOB.job_number}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Vehicle</span>
              <span className="text-sm text-gray-800">{MOCK_JOB.vehicle_name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Work Type</span>
              <span className="text-sm text-gray-800">{MOCK_JOB.work_type}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">PO Reference</span>
              <span className="text-sm text-gray-800">{MOCK_JOB.po_number}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total Labour Time</span>
              <span className="text-sm font-bold text-green-600">{MOCK_JOB.total_hours}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Parts Used</span>
              <span className="text-sm text-gray-800">{MOCK_JOB.parts_used} items</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Defects</span>
              <span className="text-sm text-gray-800">
                {MOCK_JOB.defects_resolved}/{MOCK_JOB.defects_logged} resolved
              </span>
            </div>
          </div>
        </div>

        {/* What Happens on Sign-Off */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800 font-semibold mb-1">What happens when you sign off:</p>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Your job timer stops permanently</li>
            <li>• All time entries become immutable (L-04)</li>
            <li>• Job moves to OPS close-out queue (Step 15)</li>
            <li>• You can no longer edit this job</li>
          </ul>
        </div>

        {/* Confirmation Checkbox */}
        <div className="bg-white rounded-lg shadow p-4">
          <button
            onClick={() => setConfirmed(!confirmed)}
            className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
              confirmed ? 'bg-green-50' : 'bg-gray-50'
            }`}
          >
            <div
              className={`w-6 h-6 flex-shrink-0 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                confirmed
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'border-gray-300 bg-white'
              }`}
            >
              {confirmed && <span className="text-xs">✓</span>}
            </div>
            <p className="text-sm text-gray-700">
              I confirm that all work on <strong>{MOCK_JOB.job_number}</strong> has been completed
              as required, and I am ready to close this job.
            </p>
          </button>
        </div>
      </div>

      {/* Fixed Bottom Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleFinalSignOff}
            disabled={!confirmed || isSubmitting}
            className="w-full py-3 rounded-lg text-white font-bold text-lg disabled:opacity-40 transition-colors"
            style={{ backgroundColor: confirmed ? '#B8860B' : '#9CA3AF' }}
          >
            {isSubmitting ? 'CLOSING JOB...' : 'FINAL SIGN-OFF — CLOSE JOB'}
          </button>
          <p className="text-center text-xs text-gray-400 mt-1">
            Control A-03 • L-04 • This action cannot be undone
          </p>
        </div>
      </div>
    </div>
  )
}
