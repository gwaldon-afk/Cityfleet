'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Legacy URL: /mechanic/completion.
 * Completion is at /mechanic/job/[id]/complete/completion.
 * Redirect to jobs list (no job id available here).
 */
export default function CompletionRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/mechanic/jobs')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-6">
        <p className="text-gray-600 mb-4">Redirecting to your jobs…</p>
        <a href="/mechanic/jobs" className="text-cityfleet-gold font-medium hover:underline">
          Go to Jobs
        </a>
      </div>
    </div>
  )
}
