'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expiredMessage, setExpiredMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      setExpiredMessage('Your session expired. Please sign in again.')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await login(email, password)
      if (result.success) {
        router.push('/dashboard')
      } else {
        setError(result.error || 'Login failed. Please check your credentials.')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cityfleet-navy to-cityfleet-navy-light">
      {/* Header Bar - Gold */}
      <div className="w-full bg-cityfleet-gold py-3 px-6 flex justify-end items-center gap-4">
        <a href="tel:(07)30637722" className="text-sm text-black hover:underline">
          (07) 3063 7722
        </a>
        <a href="mailto:info@cityfleet.com.au" className="text-sm text-black hover:underline">
          info@cityfleet.com.au
        </a>
      </div>

      {/* Main Login Container */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="bg-white rounded-lg p-6 inline-block mb-4 shadow-lg">
              <h1 className="text-3xl font-bold text-cityfleet-navy">
                CITY FLEET
              </h1>
              <p className="text-sm text-gray-600 mt-1">TRANSPORT MAINTENANCE</p>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Workshop Manager</h2>
            <p className="text-white/80">Sign in to access your dashboard</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            {expiredMessage && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-800">{expiredMessage}</p>
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-cityfleet-gold focus:border-transparent outline-none transition"
                  placeholder="your.email@company.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-cityfleet-gold focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-cityfleet-gold border-gray-300 rounded focus:ring-cityfleet-gold"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <a href="/forgot-password" className="text-sm text-cityfleet-navy hover:text-cityfleet-gold transition">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cityfleet-gold hover:bg-cityfleet-gold-light text-black font-semibold py-3 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                Need access?{' '}
                <a href="mailto:support@cityfleet.com.au" className="text-cityfleet-navy hover:text-cityfleet-gold font-medium">
                  Contact your supervisor
                </a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-white/60 text-sm">
            <p>© 2026 City Fleet Transport Maintenance</p>
            <p className="mt-1">Internal Use Only</p>
          </div>
        </div>
      </div>
    </div>
  )
}
