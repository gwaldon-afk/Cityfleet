'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useShift } from '@/hooks/useShift'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/protected-route'

interface JobRow {
  id: string
  job_number: string
  status: string
  created_at: string
  vehicle?: { registration_number?: string; make?: string; model?: string } | null
  customer?: { name?: string } | null
}

export default function MechanicJobsList() {
  const { user, activeShift, isLoading: authLoading } = useAuth()
  const { clockOff } = useShift()
  const router = useRouter()
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)

  // L-01: Clock on is part of daily flow — must be clocked on before seeing jobs
  useEffect(() => {
    if (authLoading || !user) return
    if (!activeShift) {
      router.replace('/mechanic/clock-on')
      return
    }
    loadJobs()
  }, [user, activeShift, authLoading, router])

  async function loadJobs() {
    if (!user) return
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await (supabase as any)
        .from('jobs')
        .select(`
          id,
          job_number,
          status,
          created_at,
          vehicle:vehicles(registration_number, make, model),
          customer:customers(name)
        `)
        .eq('assigned_mechanic_id', user.id)
        .in('status', ['approved', 'in_progress', 'paused', 'awaiting_parts'])
        .order('created_at', { ascending: true })

      if (error) throw error
      setJobs(data || [])
    } catch (err) {
      console.error('Error loading jobs:', err)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'in_progress': return 'bg-status-in-progress text-white'
      case 'approved': return 'bg-status-assigned text-white'
      case 'paused': return 'bg-status-paused text-white'
      case 'awaiting_parts': return 'bg-status-blocked text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'in_progress': return 'In Progress'
      case 'approved': return 'Assigned'
      case 'paused': return 'Paused'
      case 'awaiting_parts': return 'Awaiting Parts'
      default: return status
    }
  }

  function vehicleDisplay(job: JobRow): string {
    const v = job.vehicle
    if (!v) return '—'
    if (v.registration_number) return v.registration_number
    return [v.make, v.model].filter(Boolean).join(' ') || '—'
  }

  async function handleClockOff() {
    const result = await clockOff()
    if (result.success) router.replace('/mechanic/clock-on')
  }

  const clockOnAt = activeShift && ((activeShift as any).clock_on_at ?? (activeShift as any).clock_on)

  return (
    <ProtectedRoute allowedRoles={['mechanic']}>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-cityfleet-navy text-white py-4 px-6 shadow-lg">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">My Jobs</h1>
              <p className="text-sm text-white/70">{user?.first_name || 'Mechanic'}</p>
            </div>
            <button
              onClick={handleClockOff}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition text-sm"
            >
              Clock off
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          {clockOnAt && (
            <div className="bg-status-in-progress/10 border border-status-in-progress rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-status-in-progress rounded-full animate-pulse" />
                <p className="text-sm font-medium text-gray-900">
                  Shift started at {new Date(clockOnAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cityfleet-gold" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs assigned</h3>
              <p className="text-gray-600">You don’t have any jobs right now. Check with your supervisor.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => router.push(`/mechanic/job/${job.id}`)}
                  className="w-full bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-left"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Job #{job.job_number}</h3>
                      <p className="text-sm text-gray-600">{vehicleDisplay(job)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(job.status)}`}>
                      {getStatusLabel(job.status)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-600">Customer</p>
                    <p className="font-medium text-gray-900">{job.customer?.name ?? '—'}</p>
                  </div>
                  <div className="mt-4 flex items-center text-cityfleet-gold text-sm font-medium">
                    View details
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
