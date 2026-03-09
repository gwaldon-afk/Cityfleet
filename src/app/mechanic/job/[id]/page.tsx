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
  po_number: string
  description: string
  priority: string
  due_date: string
  estimated_hours: number
  status: string
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [vehicleJobs, setVehicleJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [activeJob, setActiveJob] = useState<any>(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadJobDetails()
    checkForActiveJob()
  }, [params.id])

  const loadJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customer:customers(name)
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error

      setJob({
        ...data,
        customer_name: data.customer?.name || 'Unknown'
      })

      // Load all jobs for this vehicle
      if (data.vehicle_identifier) {
        const { data: allJobs } = await supabase
          .from('jobs')
          .select('id, job_number, status, description')
          .eq('vehicle_identifier', data.vehicle_identifier)
          .neq('id', params.id)
          .order('created_at', { ascending: false })
          .limit(5)

        setVehicleJobs(allJobs || [])
      }
    } catch (err) {
      console.error('Error loading job:', err)
      alert('Error loading job details')
    } finally {
      setLoading(false)
    }
  }

  const checkForActiveJob = async () => {
    if (!user) return

    try {
      // L-02: Check for active job
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          job:jobs(job_number, vehicle_identifier)
        `)
        .eq('mechanic_id', user.id)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1)
        .single()

      if (data && !error) {
        setActiveJob(data)
      }
    } catch (err) {
      // No active job found - this is fine
      setActiveJob(null)
    }
  }

  const handleStartJob = async () => {
    if (!user || !job) return

    // L-02 HARD GATE: Check for active job
    if (activeJob && activeJob.job_id !== job.id) {
      const proceed = confirm(
        `You already have an active job (Job #${activeJob.job.job_number} - ${activeJob.job.vehicle_identifier}).\n\n` +
        `You must pause or complete that job before starting this one.\n\n` +
        `Would you like to go to that job now?`
      )
      
      if (proceed) {
        router.push(`/mechanic/job/${activeJob.job_id}/work`)
      }
      return
    }

    setStarting(true)

    try {
      // Create time entry (start job)
      const { error: timeError } = await supabase
        .from('time_entries')
        .insert({
          job_id: job.id,
          mechanic_id: user.id,
          start_time: new Date().toISOString()
        })

      if (timeError) throw timeError

      // Update job status
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ status: 'in_progress' })
        .eq('id', job.id)

      if (jobError) throw jobError

      // Redirect to safety checklist (Step 4 - MANDATORY)
      router.push(`/mechanic/job/${job.id}/safety`)
    } catch (err: any) {
      alert(`Error starting job: ${err.message}`)
    } finally {
      setStarting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cityfleet-gold"></div>
          <p className="mt-4 text-gray-600">Loading job...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <button
            onClick={() => router.push('/mechanic/jobs')}
            className="text-cityfleet-gold hover:underline"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    )
  }

  const isActive = activeJob?.job_id === job.id
  const canStart = job.status === 'assigned' || job.status === 'in_progress'

  return (
    <ProtectedRoute allowedRoles={['mechanic']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-cityfleet-navy text-white py-4 px-6 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => router.push('/mechanic/jobs')}
              className="text-sm text-white/70 hover:text-white mb-2 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Jobs
            </button>
            <h1 className="text-xl font-bold">Job #{job.job_number}</h1>
            <p className="text-sm text-white/70">{job.vehicle_identifier}</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Active Job Warning */}
          {activeJob && activeJob.job_id !== job.id && (
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">You Have an Active Job</h3>
                  <p className="text-sm text-red-800">
                    Job #{activeJob.job.job_number} ({activeJob.job.vehicle_identifier}) is currently active. 
                    You must pause or complete it before starting this job.
                  </p>
                  <button
                    onClick={() => router.push(`/mechanic/job/${activeJob.job_id}/work`)}
                    className="mt-2 text-sm font-medium text-red-900 underline"
                  >
                    Go to Active Job
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Job Details Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Job Details</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Vehicle</p>
                <p className="font-semibold text-gray-900">{job.vehicle_identifier}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-semibold text-gray-900">{job.customer_name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">PO Number</p>
                <p className="font-semibold text-gray-900">{job.po_number || 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Priority</p>
                <p className="font-semibold text-gray-900 capitalize">{job.priority}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="font-semibold text-gray-900">
                  {job.due_date ? new Date(job.due_date).toLocaleDateString('en-AU') : 'N/A'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Estimated Hours</p>
                <p className="font-semibold text-gray-900">{job.estimated_hours || 'N/A'}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Description</p>
              <p className="text-gray-900">{job.description || 'No description provided'}</p>
            </div>
          </div>

          {/* Other Jobs for This Vehicle */}
          {vehicleJobs.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Other Jobs for This Vehicle</h3>
              <div className="space-y-2">
                {vehicleJobs.map(vJob => (
                  <div key={vJob.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-gray-900">Job #{vJob.job_number}</p>
                      <p className="text-sm text-gray-600">{vJob.description}</p>
                    </div>
                    <span className="text-xs font-medium text-gray-600 capitalize">{vJob.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {isActive ? (
              <button
                onClick={() => router.push(`/mechanic/job/${job.id}/work`)}
                className="w-full bg-status-in-progress hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-md transition text-lg"
              >
                Continue Working on This Job
              </button>
            ) : canStart ? (
              <button
                onClick={handleStartJob}
                disabled={starting || (activeJob && activeJob.job_id !== job.id)}
                className="w-full bg-cityfleet-gold hover:bg-cityfleet-gold-light text-black font-semibold py-4 px-6 rounded-md transition text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {starting ? 'Starting Job...' : 'START JOB'}
              </button>
            ) : (
              <div className="text-center text-gray-600">
                <p>This job cannot be started yet.</p>
                <p className="text-sm mt-1">Status: {job.status}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
