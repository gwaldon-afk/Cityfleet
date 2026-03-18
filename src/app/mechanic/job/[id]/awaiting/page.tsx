'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
const MOCK_JOB = {
  id: 'job-4822',
  job_number: 'JOB-4822',
  vehicle_id: 'VIN: 6T1BF3EK5CU123456',
  vehicle_name: 'Volvo FH16 — Fleet #V-114',
  work_type: 'Scheduled 500hr Service',
  total_hours: '3h 42m',
  submitted_at: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
}

type ApprovalStatus = 'pending' | 'approved' | 'returned'

export default function AwaitingApprovalScreen() {
  const params = useParams()
  const jobId = params?.id as string
  const [status, setStatus] = useState<ApprovalStatus>('pending')
  const [waitTime, setWaitTime] = useState('')
  const [returnNotes, setReturnNotes] = useState('')

  // Simulate waiting time ticker
  useEffect(() => {
    const updateWait = () => {
      const diff = Math.floor((Date.now() - MOCK_JOB.submitted_at.getTime()) / 1000)
      const m = Math.floor(diff / 60)
      const s = diff % 60
      setWaitTime(`${m}m ${s.toString().padStart(2, '0')}s`)
    }
    updateWait()
    const timer = setInterval(updateWait, 1000)
    return () => clearInterval(timer)
  }, [])

  // In production, this would be a Supabase realtime subscription
  // listening for status changes on this job
  const simulateApproval = () => {
    setStatus('approved')
  }

  const simulateReturn = () => {
    setReturnNotes('Grease marks found on driver door panel. Please clean and re-submit.')
    setStatus('returned')
  }

  // ─── APPROVED STATE ─────────────────────────────────────────────────────
  if (status === 'approved') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-green-700 to-green-500 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">CITY FLEET</p>
              <p className="font-bold text-sm">{MOCK_JOB.job_number}</p>
            </div>
            <span className="text-xs bg-green-900/50 px-2 py-1 rounded">✅ APPROVED</span>
          </div>
        </div>
        <div className="max-w-md mx-auto p-6 text-center mt-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Manager Approved</h2>
          <p className="text-gray-600 mb-1">
            Workshop Manager has reviewed and approved your work.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Proceed to final sign-off to close this job.
          </p>
          <a
            href={jobId ? `/mechanic/job/${jobId}/signoff` : '/mechanic/jobs'}
            className="block w-full py-3 rounded-lg text-white font-bold text-lg text-center"
            style={{ backgroundColor: '#B8860B' }}
          >
            FINAL SIGN-OFF →
          </a>
        </div>
      </div>
    )
  }

  // ─── RETURNED STATE ─────────────────────────────────────────────────────
  if (status === 'returned') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-red-700 to-red-500 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">CITY FLEET</p>
              <p className="font-bold text-sm">{MOCK_JOB.job_number}</p>
            </div>
            <span className="text-xs bg-red-900/50 px-2 py-1 rounded">↩ RETURNED</span>
          </div>
        </div>
        <div className="max-w-md mx-auto p-6 mt-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">↩</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">Returned by Manager</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
            <p className="text-sm text-red-800 font-semibold mb-1">Manager Notes:</p>
            <p className="text-sm text-red-700">{returnNotes}</p>
          </div>
          <p className="text-sm text-gray-600 text-center mb-6">
            Address the issues above and re-submit your completion checklist.
          </p>
          <a
            href={jobId ? `/mechanic/job/${jobId}/complete/completion` : '/mechanic/jobs'}
            className="block w-full py-3 rounded-lg text-white font-bold text-lg text-center"
            style={{ backgroundColor: '#B8860B' }}
          >
            GO BACK TO COMPLETION →
          </a>
        </div>
      </div>
    )
  }

  // ─── PENDING STATE (DEFAULT) ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">CITY FLEET</p>
            <p className="font-bold text-sm">{MOCK_JOB.job_number}</p>
          </div>
          <span className="text-xs bg-blue-900/50 px-2 py-1 rounded">STEP 13 — AWAITING</span>
        </div>
        <div className="mt-2 text-xs opacity-80">
          {MOCK_JOB.vehicle_name}
        </div>
      </div>

      {/* Control Gate Info */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
        <p className="text-xs text-yellow-700 font-semibold">
          ⏳ A-03 HARD GATE: You cannot finalize this job until the Workshop Manager approves
        </p>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Waiting Indicator */}
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800 mb-1">Awaiting Manager Approval</h2>
          <p className="text-sm text-gray-600">
            Your work has been submitted for two-hand-touch review.
          </p>
          <div className="mt-4 bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Waiting for</p>
            <p className="text-2xl font-mono font-bold text-blue-600">{waitTime}</p>
          </div>
        </div>

        {/* Job Summary (read-only) */}
        <div className="bg-white rounded-lg shadow p-4 space-y-2">
          <h3 className="font-bold text-gray-800 text-sm">Job Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-gray-500">Job Number</p>
              <p className="text-gray-800 font-medium">{MOCK_JOB.job_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Work Type</p>
              <p className="text-gray-800">{MOCK_JOB.work_type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Hours</p>
              <p className="text-gray-800 font-medium">{MOCK_JOB.total_hours}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Vehicle</p>
              <p className="text-gray-800">{MOCK_JOB.vehicle_name}</p>
            </div>
          </div>
        </div>

        {/* Status Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800 font-semibold">What happens next?</p>
          <p className="text-xs text-blue-700 mt-1">
            The Workshop Manager will physically inspect the vehicle, review your notes and evidence,
            then sign a formal disclaimer confirming quality. You&apos;ll be notified once approved.
          </p>
        </div>

        {/* DEV: Simulation Buttons (remove in production) */}
        <div className="bg-gray-100 rounded-lg p-3 border border-dashed border-gray-300">
          <p className="text-xs text-gray-500 mb-2 text-center">DEV TESTING — Simulate manager action:</p>
          <div className="flex gap-2">
            <button
              onClick={simulateApproval}
              className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold"
            >
              ✅ Simulate Approve
            </button>
            <button
              onClick={simulateReturn}
              className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold"
            >
              ↩ Simulate Return
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
