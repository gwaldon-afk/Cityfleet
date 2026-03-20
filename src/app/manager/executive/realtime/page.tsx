'use client'

import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/protected-route'
import { RealtimeOperationsDashboard } from '@/components/exec/RealtimeOperationsDashboard'

export default function ManagerExecRealtimePage() {
  const { site } = useAuth()
  return (
    <ProtectedRoute allowedRoles={['workshop_manager']}>
      <RealtimeOperationsDashboard
        mode="workshop_manager"
        siteId={site?.id ?? null}
        siteLabel={site?.name}
      />
    </ProtectedRoute>
  )
}
