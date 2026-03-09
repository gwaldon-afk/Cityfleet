'use client'

// ═══════════════════════════════════════════════════════════════════════════
// CITY FLEET — Protected Route Component
// Location: src/components/protected-route.tsx
// Redirects unauthenticated users to /login
// Optionally restricts by role
// ═══════════════════════════════════════════════════════════════════════════
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, UserRole } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    // Not logged in → go to login
    if (!user) {
      router.push('/login')
      return
    }

    // Logged in but wrong role → unauthorized
    if (allowedRoles && role && !allowedRoles.includes(role)) {
      router.push('/unauthorized')
      return
    }
  }, [user, role, isLoading, router, allowedRoles])

  // Show nothing while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) return null

  // Wrong role
  if (allowedRoles && role && !allowedRoles.includes(role)) return null

  return <>{children}</>
}
