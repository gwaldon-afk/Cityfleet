'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function UnauthorizedPage() {
  const { profile, signOut } = useAuth()
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>

          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
            {profile && (
              <>
                <br />
                <span className="text-sm">
                  Your role: <strong className="text-cityfleet-navy capitalize">{user?.role?.replace('_', ' ') || 'unknown'}</strong>
                </span>
              </>
            )}
          </p>

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="block w-full bg-cityfleet-gold hover:bg-cityfleet-gold-light text-black font-semibold py-3 px-4 rounded-md transition duration-200"
            >
              Go to Your Dashboard
            </Link>

            <button
              onClick={() => signOut()}
              className="block w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-md transition duration-200"
            >
              Sign Out
            </button>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Need access?{' '}
            <a
              href="mailto:support@cityfleet.com.au"
              className="text-cityfleet-navy hover:text-cityfleet-gold font-medium"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
