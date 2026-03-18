'use client'

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import CreateJobPageContent from './CreateJobPageContent' './CreateJobPageContent'

export default function CreateJobPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cityfleet-gold" />
        </div>
      }
    >
      <CreateJobPageContent />
    </Suspense>
  )
}
