'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/protected-route'

export default function DashboardPage() {
  const { user, role, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    // Route to appropriate dashboard based on role (from user_roles in Supabase)
    switch (role) {
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
  }, [user, role, isLoading, router])

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
