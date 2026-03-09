'use client'

import { useState, useEffect } from 'react'

export default function ClockOnTest() {
  // HYDRATION FIX: Start as null instead of new Date()
  // This prevents server/client time mismatch
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    // Only runs on client after mount — no hydration error
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-cityfleet-navy to-cityfleet-navy-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-lg p-6 inline-block mb-4 shadow-lg">
            <h1 className="text-3xl font-bold text-cityfleet-navy">CITY FLEET</h1>
            <p className="text-sm text-gray-600 mt-1">TRANSPORT MAINTENANCE</p>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Clock On Test</h2>
          <p className="text-white/80">Testing without authentication</p>
        </div>

        {/* Current Time */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Current Time</p>
            <p className="text-4xl font-bold text-cityfleet-navy">
              {currentTime
                ? currentTime.toLocaleTimeString('en-AU', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  })
                : '--:--:-- --'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {currentTime
                ? currentTime.toLocaleDateString('en-AU', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Loading...'}
            </p>
          </div>
        </div>

        {/* Clock On Section */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <h3 className="text-lg font-bold mb-2">Ready to Start?</h3>
          <p className="text-gray-600 mb-4">
            This is a test page - full functionality requires Supabase connection.
          </p>
          <button
            onClick={() => alert('Clock on would happen here!')}
            className="w-full py-3 rounded-lg text-white font-bold text-lg bg-cityfleet-gold hover:bg-cityfleet-gold/90 transition-colors"
          >
            TEST CLOCK ON BUTTON
          </button>
        </div>

        {/* Status Checks */}
        <div className="text-center text-sm text-white/60 space-y-1">
          <p>✅ Files installed correctly</p>
          <p>✅ Branding working</p>
          <p>⏳ Waiting for Supabase connection</p>
        </div>
      </div>
    </div>
  )
}
