'use client'

import ProtectedRoute from '@/components/protected-route'
import { RealtimeOperationsDashboard } from '@/components/exec/RealtimeOperationsDashboard'

export default function OpsExecRealtimePage() {
  return (
    <ProtectedRoute allowedRoles={['ops_manager']}>
      <RealtimeOperationsDashboard mode="ops" siteId={null} />
    </ProtectedRoute>
  )
}
