'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/protected-route'

export default function DashboardPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && profile) {
      // Route to appropriate dashboard based on role
      switch (user.role) {
        case 'mechanic':
          router.push('/mechanic/jobs')
          break
        case 'workshop_manager':
          router.push('/manager/dashboard')
          break
        case 'ops_manager':
          router.push('/ops/dashboard')
          break
        case 'administrator':
          router.push('/admin/users')
          break
        default:
          router.push('/login')
      }
    }
  }, [profile, loading, router])

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cityfleet-gold"></div>
          <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    </ProtectedRoute>
  )
}
