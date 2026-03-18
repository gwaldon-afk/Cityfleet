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
  po_number: 'PO-2026-0418',
  supervisor_notes: 'Check brake pad thickness. Report >30% wear.',
}

const MOCK_PARTS = [
  { id: 'p1', name: 'Oil Filter - Heavy Duty', status: 'issued', qty: 1 },
  { id: 'p2', name: 'Air Filter Element', status: 'issued', qty: 1 },
  { id: 'p3', name: 'Engine Oil 15W-40 (20L)', status: 'issued', qty: 1 },
  { id: 'p4', name: 'Brake Pads - Front Axle', status: 'ordered', qty: 2 },
  { id: 'p5', name: 'Fuel Filter Assembly', status: 'received', qty: 1 },
]

const PAUSE_REASONS = [
  'Waiting on Parts',
  'Waiting on Customer Approval',
  'Waiting on Specialist',
  'Equipment Unavailable',
  'Lunch Break',
  'End of Shift',
  'Other',
]

export default function JobProgressScreen() {
  const params = useParams()
  const jobId = params?.id as string
  const [jobStartTime] = useState(() => new Date(Date.now() - 2 * 60 * 60 * 1000)) // started 2hrs ago
  const [elapsed, setElapsed] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [pauseReason, setPauseReason] = useState('')
  const [pauseNote, setPauseNote] = useState('')
  const [pauseHistory, setPauseHistory] = useState<Array<{ reason: string; time: Date }>>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'parts' | 'history'>('overview')

  // Live timer
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - jobStartTime.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [isPaused, jobStartTime])

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handlePause = () => {
    if (!pauseReason) return
    setIsPaused(true)
    setPauseHistory((prev) => [...prev, { reason: pauseReason + (pauseNote ? ` — ${pauseNote}` : ''), time: new Date() }])
    setShowPauseModal(false)
    setPauseReason('')
    setPauseNote('')
  }

  const handleResume = () => {
    setIsPaused(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued': return 'bg-green-100 text-green-700'
      case 'received': return 'bg-blue-100 text-blue-700'
      case 'ordered': return 'bg-yellow-100 text-yellow-700'
      case 'requested': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header with Live Timer */}
      <div className={`text-white px-4 py-3 ${isPaused ? 'bg-gradient-to-r from-yellow-700 to-yellow-500' : 'bg-gradient-to-r from-green-700 to-green-500'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">CITY FLEET</p>
            <p className="font-bold text-sm">{MOCK_JOB.job_number}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${isPaused ? 'bg-yellow-900/50' : 'bg-green-900/50'}`}>
            {isPaused ? '⏸ PAUSED' : '▶ IN PROGRESS'}
          </span>
        </div>
        <div className="mt-2 text-xs opacity-80">
          {MOCK_JOB.vehicle_name} • {MOCK_JOB.vehicle_id}
        </div>
      </div>

      {/* Live Timer Bar */}
      <div className={`px-4 py-3 text-center ${isPaused ? 'bg-yellow-50 border-b border-yellow-200' : 'bg-green-50 border-b border-green-200'}`}>
        <p className="text-xs text-gray-500 mb-1">Time on Job</p>
        <p className={`text-3xl font-mono font-bold ${isPaused ? 'text-yellow-700' : 'text-green-700'}`}>
          {formatElapsed(elapsed)}
        </p>
        {isPaused && (
          <p className="text-xs text-yellow-600 mt-1 font-semibold">
            ⏸ Timer paused — {pauseHistory[pauseHistory.length - 1]?.reason}
          </p>
        )}
      </div>

      <div className="max-w-md mx-auto">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-white">
          {(['overview', 'parts', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'parts' ? `Parts (${MOCK_PARTS.length})` : tab === 'history' ? `Log (${pauseHistory.length})` : tab}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              <div className="bg-white rounded-lg shadow p-4 space-y-2">
                <h3 className="font-bold text-gray-800 text-sm">Job Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Work Type</p>
                    <p className="text-gray-800">{MOCK_JOB.work_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">PO Reference</p>
                    <p className="text-gray-800">{MOCK_JOB.po_number}</p>
                  </div>
                </div>
                {MOCK_JOB.supervisor_notes && (
                  <div className="bg-blue-50 rounded p-2 mt-2">
                    <p className="text-xs text-blue-600 font-semibold">Supervisor Note</p>
                    <p className="text-sm text-blue-800">{MOCK_JOB.supervisor_notes}</p>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg shadow p-3 text-center">
                  <p className="text-lg font-bold text-gray-800">{MOCK_PARTS.filter(p => p.status === 'issued').length}</p>
                  <p className="text-xs text-gray-500">Parts Issued</p>
                </div>
                <div className="bg-white rounded-lg shadow p-3 text-center">
                  <p className="text-lg font-bold text-yellow-600">{MOCK_PARTS.filter(p => p.status === 'ordered').length}</p>
                  <p className="text-xs text-gray-500">On Order</p>
                </div>
                <div className="bg-white rounded-lg shadow p-3 text-center">
                  <p className="text-lg font-bold text-gray-800">{pauseHistory.length}</p>
                  <p className="text-xs text-gray-500">Pauses</p>
                </div>
              </div>
            </>
          )}

          {/* PARTS TAB */}
          {activeTab === 'parts' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Parts assigned to this job. Contact Workshop Manager for ordering.</p>
              {MOCK_PARTS.map((part) => (
                <div key={part.id} className="bg-white rounded-lg shadow p-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-800 font-medium">{part.name}</p>
                    <p className="text-xs text-gray-500">Qty: {part.qty}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(part.status)}`}>
                    {part.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-xs text-gray-500">Job Started</p>
                <p className="text-sm text-gray-800 font-medium">
                  {jobStartTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {pauseHistory.map((entry, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow p-3 border-l-4 border-yellow-400">
                  <p className="text-xs text-gray-500">Paused</p>
                  <p className="text-sm text-gray-800">{entry.reason}</p>
                  <p className="text-xs text-gray-400">
                    {entry.time.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
              {pauseHistory.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-6">No pauses recorded</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pause Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-4 space-y-3 max-h-[70vh] overflow-y-auto">
            <h3 className="font-bold text-gray-800 text-lg">Pause Job — Reason Required</h3>
            <div className="space-y-2">
              {PAUSE_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setPauseReason(reason)}
                  className={`w-full py-3 px-4 rounded-lg text-left text-sm font-medium border transition-colors ${
                    pauseReason === reason
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            {pauseReason === 'Other' && (
              <textarea
                value={pauseNote}
                onChange={(e) => setPauseNote(e.target.value)}
                placeholder="Please explain..."
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowPauseModal(false); setPauseReason('') }}
                className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handlePause}
                disabled={!pauseReason}
                className="flex-1 py-3 rounded-lg text-white font-semibold text-sm disabled:opacity-40"
                style={{ backgroundColor: pauseReason ? '#B8860B' : '#9CA3AF' }}
              >
                Pause Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-md mx-auto flex gap-3">
          {isPaused ? (
            <button
              onClick={handleResume}
              className="flex-1 py-3 rounded-lg text-white font-bold text-lg bg-green-600"
            >
              ▶ RESUME JOB
            </button>
          ) : (
            <button
              onClick={() => setShowPauseModal(true)}
              className="flex-1 py-3 rounded-lg text-white font-bold text-sm bg-yellow-600"
            >
              ⏸ PAUSE
            </button>
          )}
          <a
            href={jobId ? `/mechanic/job/${jobId}/test` : '/mechanic/jobs'}
            className="flex-1 py-3 rounded-lg text-white font-bold text-sm text-center"
            style={{ backgroundColor: '#B8860B' }}
          >
            WORK COMPLETE →
          </a>
        </div>
      </div>
    </div>
  )
}
