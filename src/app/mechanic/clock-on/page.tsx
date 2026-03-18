'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useShift } from '@/hooks/useShift'
import ProtectedRoute from '@/components/protected-route'

export default function ClockOnPage() {
  const { user, site } = useAuth()
  const { isClockedOn, loading, error, clockOn } = useShift()
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [procedureAcknowledged, setProcedureAcknowledged] = useState(false)
  const [messagesAcknowledged, setMessagesAcknowledged] = useState(false)
  const [fitForWork, setFitForWork] = useState(false)

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Already clocked on → go straight to jobs (part of daily flow)
  useEffect(() => {
    if (!user) return
    if (isClockedOn) {
      router.replace('/mechanic/jobs')
    }
  }, [user, isClockedOn, router])

  const handleClockOn = async () => {
    if (!fitForWork) return
    const result = await clockOn({
      procedure_acknowledged: procedureAcknowledged,
      messages_acknowledged: messagesAcknowledged,
      fit_for_work: true,
      confirmed_at: new Date().toISOString(),
    })
    if (result.success) {
      router.replace('/mechanic/jobs')
    }
  }

  return (
    <ProtectedRoute allowedRoles={['mechanic']}>
      <div className="min-h-screen bg-gradient-to-br from-cityfleet-navy to-cityfleet-navy-light flex flex-col">
        {/* Header */}
        <div className="w-full bg-cityfleet-gold py-3 px-6 flex justify-between items-center">
          <span className="text-sm font-semibold text-black">CITY FLEET</span>
          <a href="tel:(07)30637722" className="text-sm text-black hover:underline">(07) 3063 7722</a>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-6">
              <div className="bg-white rounded-lg p-6 inline-block mb-4 shadow-lg">
                <h1 className="text-3xl font-bold text-cityfleet-navy">CITY FLEET</h1>
                <p className="text-sm text-gray-600 mt-1">TRANSPORT MAINTENANCE</p>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Clock On</h2>
              <p className="text-white/80">Start your shift to see your jobs</p>
            </div>

            {/* Current time */}
            <div className="bg-white rounded-lg shadow-xl p-6 mb-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Current time</p>
                <p className="text-4xl font-bold text-cityfleet-navy">
                  {currentTime
                    ? currentTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
                    : '--:--:-- --'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {currentTime ? currentTime.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '...'}
                </p>
              </div>
            </div>

            {/* Site */}
            {site && (
              <div className="bg-white/10 rounded-lg p-4 mb-4 text-center text-white">
                <p className="text-sm">Site</p>
                <p className="font-semibold">{site.name}</p>
              </div>
            )}

            {/* Step: Review procedure for the day */}
            <div className="bg-white rounded-lg shadow-xl p-6 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Procedure for today</h3>
              <p className="text-sm text-gray-600 mb-3">
                Review the relevant procedure or pre-start for this shift. (Content can be set by your manager or from site config.)
              </p>
              <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 mb-3 min-h-[60px]">
                No procedure set for today. When configured, daily safety or toolbox content will appear here.
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={procedureAcknowledged}
                  onChange={(e) => setProcedureAcknowledged(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-cityfleet-gold focus:ring-cityfleet-gold"
                />
                <span className="text-sm text-gray-700">I have reviewed the procedure for today.</span>
              </label>
            </div>

            {/* Step: Note any messages */}
            <div className="bg-white rounded-lg shadow-xl p-6 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Messages / notices</h3>
              <p className="text-sm text-gray-600 mb-3">
                Check for any site or company messages before starting.
              </p>
              <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 mb-3 min-h-[48px]">
                No new messages. When your manager posts notices, they will appear here.
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={messagesAcknowledged}
                  onChange={(e) => setMessagesAcknowledged(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-cityfleet-gold focus:ring-cityfleet-gold"
                />
                <span className="text-sm text-gray-700">I have read and noted any messages.</span>
              </label>
            </div>

            {/* Step: Fit for work (L-01) — required */}
            <div className="bg-white rounded-lg shadow-xl p-6 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Fit for work</h3>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fitForWork}
                  onChange={(e) => setFitForWork(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-cityfleet-gold focus:ring-cityfleet-gold"
                />
                <span className="text-sm text-gray-700">
                  I confirm I am fit for work and ready to start my shift (L-01).
                </span>
              </label>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleClockOn}
              disabled={!procedureAcknowledged || !messagesAcknowledged || !fitForWork || loading}
              className="w-full py-3 rounded-lg text-black font-bold text-lg bg-cityfleet-gold hover:bg-cityfleet-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Clocking on...' : 'Clock on'}
            </button>

            <p className="text-center text-white/60 text-sm mt-4">
              After clock on you’ll be taken to your job list.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
