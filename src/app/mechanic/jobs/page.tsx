'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/protected-route'

interface Job {
  id: string
  job_number: string
  vehicle_identifier: string
  customer_name: string
  status: 'assigned' | 'in_progress' | 'paused' | 'awaiting_parts' | 'completed'
  priority: 'high' | 'normal' | 'low'
  created_at: string
}

export default function MechanicJobsList() {
  const { user } = useAuth()
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [activeShift, setActiveShift] = useState<any>(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (user) {
      checkShiftAndLoadJobs()
    }
  }, [user])

  const checkShiftAndLoadJobs = async () => {
    if (!user) return

    try {
      // Check active shift (L-01: must be clocked on)
      const { data: shiftData } = await supabase
        .from('shifts')
        .select('*')
        .eq('mechanic_id', user.id)
        .eq('status', 'active')
        .order('clock_in_time', { ascending: false })
        .limit(1)
        .single()

      setActiveShift(shiftData)

      if (!shiftData) {
        // Not clocked on - redirect to clock on
        router.push('/mechanic/clock-on')
        return
      }

      // Load assigned jobs
      const { data: jobsData, error } = await supabase
        .from('jobs')
        .select(`
          id,
          job_number,
          vehicle_identifier,
          status,
          priority,
          created_at,
          customer:customers(name)
        `)
        .eq('assigned_mechanic_id', user.id)
        .in('status', ['assigned', 'in_progress', 'paused', 'awaiting_parts'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })

      if (error) throw error

      // Transform data
      const transformedJobs = jobsData?.map(job => ({
        ...job,
     customer_name: (job.customer as any)?.name || 'Unknown Customer'
      })) || []

      setJobs(transformedJobs)
    } catch (err) {
      console.error('Error loading jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-status-in-progress text-white'
      case 'assigned': return 'bg-status-assigned text-white'
      case 'paused': return 'bg-status-paused text-white'
      case 'awaiting_parts': return 'bg-status-blocked text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress': return 'In Progress'
      case 'assigned': return 'Assigned'
      case 'paused': return 'Paused'
      case 'awaiting_parts': return 'Awaiting Parts'
      default: return status
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <span className="text-xs font-semibold text-red-600">HIGH</span>
      case 'low': return <span className="text-xs font-semibold text-gray-500">LOW</span>
      default: return null
    }
  }

  const handleClockOff = () => {
    router.push('/mechanic/clock-on')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cityfleet-gold"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['mechanic']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
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
              Clock Off
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          {/* Shift Info */}
          {activeShift && (
            <div className="bg-status-in-progress/10 border border-status-in-progress rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-status-in-progress rounded-full animate-pulse"></div>
                <p className="text-sm font-medium text-gray-900">
                  Shift started at {new Date(activeShift.clock_in_time).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )}

          {/* Job List */}
          {jobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Assigned</h3>
              <p className="text-gray-600">
                You don't have any jobs assigned right now. Check with your supervisor.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => router.push(`/mechanic/job/${job.id}`)}
                  className="w-full bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Job #{job.job_number}</h3>
                      <p className="text-sm text-gray-600">{job.vehicle_identifier}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(job.priority)}
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(job.status)}`}>
                        {getStatusLabel(job.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Customer</p>
                      <p className="font-medium text-gray-900">{job.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Created</p>
                      <p className="font-medium text-gray-900">
                        {new Date(job.created_at).toLocaleDateString('en-AU')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center text-cityfleet-gold text-sm font-medium">
                    View Details
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
