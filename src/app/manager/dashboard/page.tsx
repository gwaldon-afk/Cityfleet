'use client'

import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/protected-route'
import Link from 'next/link'
import {
  useManagerDashboard,
  type ManagerJobRow,
  type MechanicStatus,
} from '@/hooks/useManagerDashboard'
import { useState } from 'react'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'paused', label: 'Paused' },
  { value: 'awaiting_parts', label: 'Awaiting parts' },
  { value: 'awaiting_approval', label: 'Awaiting approval' },
  { value: 'ready_for_review', label: 'Ready for review' },
  { value: 'manager_approved', label: 'Manager approved' },
  { value: 'mechanic_closed', label: 'Mechanic closed' },
  { value: 'ops_review', label: 'Ops review' },
  { value: 'closed_released', label: 'Closed' },
]

function getStatusBadgeClass(status: string): string {
  if (['in_progress', 'approved'].includes(status)) return 'bg-blue-100 text-blue-800'
  if (['ready_for_review', 'manager_approved', 'mechanic_closed'].includes(status)) return 'bg-amber-100 text-amber-800'
  if (['quoted', 'paused', 'awaiting_parts', 'awaiting_approval'].includes(status)) return 'bg-gray-100 text-gray-800'
  if (status === 'closed_released') return 'bg-green-100 text-green-800'
  return 'bg-gray-100 text-gray-700'
}

function vehicleDisplay(job: ManagerJobRow): string {
  const v = job.vehicle
  if (!v) return '—'
  if (v.registration_number) return v.registration_number
  return [v.make, v.model].filter(Boolean).join(' ') || v.vin || '—'
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

export default function ManagerDashboardPage() {
  const { user, site } = useAuth()
  const {
    jobs,
    mechanics,
    mechanicsWithStatus,
    summary,
    needsAttentionJobs,
    jobsWithPendingDefects,
    jobsForToday,
    unassignedJobs,
    pausedJobs,
    awaitingPartsJobs,
    blockedJobs,
    loading,
    error,
    fetchAll,
    assignMechanic,
    vehicleDisplay: vDisplay,
  } = useManagerDashboard()
  const [statusFilter, setStatusFilter] = useState('')
  const [assigningId, setAssigningId] = useState<string | null>(null)

  const filtered = statusFilter ? jobs.filter((j) => j.status === statusFilter) : jobs

  async function onAssign(jobId: string, mechanicId: string) {
    setAssigningId(jobId)
    await assignMechanic(jobId, mechanicId || null)
    setAssigningId(null)
  }

  return (
    <ProtectedRoute allowedRoles={['workshop_manager']}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-cityfleet-navy text-white py-4 px-6 shadow-lg">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">Site dashboard</h1>
              <p className="text-sm text-white/80">
                {site?.name ?? 'Site'} • {user?.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fetchAll()}
                className="text-white/80 hover:text-white text-sm"
              >
                Refresh
              </button>
              <Link
                href="/manager/executive/realtime"
                className="px-3 py-2 rounded-lg border border-white/40 text-white text-sm hover:bg-white/10"
              >
                Real-time operations
              </Link>
              <Link
                href="/manager/jobs/new"
                className="inline-flex items-center gap-2 bg-cityfleet-gold text-cityfleet-navy font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition"
              >
                + Create job
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cityfleet-gold" />
            </div>
          ) : (
            <>
              {/* KPI strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white rounded-xl shadow p-4 border-l-4 border-cityfleet-navy">
                  <p className="text-2xl font-bold text-gray-900">{mechanicsWithStatus.filter((m) => m.clockedOn).length}</p>
                  <p className="text-sm text-gray-600">Mechanics clocked on</p>
                </div>
                <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
                  <p className="text-2xl font-bold text-gray-900">{summary.inProgress}</p>
                  <p className="text-sm text-gray-600">Jobs in progress</p>
                </div>
                <div className="bg-white rounded-xl shadow p-4 border-l-4 border-orange-500">
                  <p className="text-2xl font-bold text-gray-900">{summary.paused}</p>
                  <p className="text-sm text-gray-600">Paused jobs</p>
                </div>
                <div className="bg-white rounded-xl shadow p-4 border-l-4 border-amber-500">
                  <p className="text-2xl font-bold text-gray-900">{summary.needsManager}</p>
                  <p className="text-sm text-gray-600">Need your action</p>
                </div>
                <div className="bg-white rounded-xl shadow p-4 border-l-4 border-gray-400">
                  <p className="text-2xl font-bold text-gray-900">{summary.awaitingParts}</p>
                  <p className="text-sm text-gray-600">Awaiting parts</p>
                </div>
                <div className="bg-white rounded-xl shadow p-4 border-l-4 border-gray-500">
                  <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                  <p className="text-sm text-gray-600">Total jobs (site)</p>
                </div>
              </div>

              {/* Mechanics at a glance */}
              <section className="bg-white rounded-xl shadow overflow-hidden">
                <h2 className="px-4 py-3 font-semibold text-gray-900 border-b border-gray-100">
                  Mechanics
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Clocked on</th>
                        <th className="px-4 py-3">Current job</th>
                        <th className="px-4 py-3">Stage / status</th>
                        <th className="px-4 py-3">Vehicle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mechanicsWithStatus.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-gray-500 text-sm">
                            No mechanics at this site.
                          </td>
                        </tr>
                      ) : (
                        mechanicsWithStatus.map((m: MechanicStatus) => (
                          <tr key={m.mechanic.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-medium text-gray-900">{m.mechanic.name}</td>
                            <td className="px-4 py-3">
                              {m.clockedOn ? (
                                <span className="inline-flex items-center gap-1.5 text-green-700 text-sm">
                                  <span className="w-2 h-2 rounded-full bg-green-500" />
                                  Yes {m.clockedOnAt && `(${formatTime(m.clockedOnAt)})`}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">Off</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {m.currentJobNumber ? (
                                <Link
                                  href={`/manager/job/${m.currentJobId}`}
                                  className="text-cityfleet-navy font-medium hover:underline"
                                >
                                  {m.currentJobNumber}
                                </Link>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{m.jobStatusLabel}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{m.jobVehicleDisplay}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Needs your action */}
              {needsAttentionJobs.length > 0 && (
                <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h2 className="font-semibold text-amber-900 mb-3">Needs your action</h2>
                  <p className="text-sm text-amber-800 mb-3">
                    Jobs marked ready for review — approve to allow mechanic to proceed.
                  </p>
                  <ul className="space-y-2">
                    {needsAttentionJobs.map((job) => (
                      <li key={job.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 shadow-sm">
                        <div>
                          <span className="font-medium text-gray-900">{job.job_number}</span>
                          <span className="text-gray-600 text-sm ml-2">{vDisplay(job)}</span>
                          <span className="text-gray-500 text-sm ml-2">{job.customer?.name}</span>
                        </div>
                        <Link
                          href={`/manager/job/${job.id}`}
                          className="text-amber-700 font-medium text-sm hover:underline"
                        >
                          Review →
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Jobs for today (Batch C) */}
              <section className="bg-white rounded-xl shadow overflow-hidden">
                <h2 className="px-4 py-3 font-semibold text-gray-900 border-b border-gray-100">
                  Jobs for today
                  <span className="text-gray-500 font-normal ml-2">({jobsForToday.length})</span>
                </h2>
                {jobsForToday.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-500 text-sm">
                    No jobs created or due today (by created date or PO date).
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          <th className="px-4 py-3">Job #</th>
                          <th className="px-4 py-3">Vehicle</th>
                          <th className="px-4 py-3">PO / Date</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Assigned to</th>
                          <th className="px-4 py-3 w-20" />
                        </tr>
                      </thead>
                      <tbody>
                        {jobsForToday.map((job) => (
                          <tr key={job.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                            <td className="px-4 py-3">
                              <Link
                                href={`/manager/job/${job.id}`}
                                className="font-medium text-cityfleet-navy hover:underline"
                              >
                                {job.job_number}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{vehicleDisplay(job)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {job.po_number} {job.po_date && `• ${job.po_date}`}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeClass(job.status)}`}>
                                {job.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {job.assigned_mechanic_id
                                ? mechanics.find((m) => m.id === job.assigned_mechanic_id)?.name ?? '—'
                                : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <Link
                                href={`/manager/job/${job.id}`}
                                className="text-cityfleet-gold font-medium text-sm hover:underline"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Jobs with defects pending approval (Batch A) */}
              {jobsWithPendingDefects.length > 0 && (
                <section className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <h2 className="font-semibold text-orange-900 mb-3">
                    Jobs with defects pending approval
                    <span className="text-orange-700 font-normal ml-2">({summary.defectsPendingApproval} job{summary.defectsPendingApproval !== 1 ? 's' : ''})</span>
                  </h2>
                  <p className="text-sm text-orange-800 mb-3">
                    These jobs have defects awaiting customer/manager approval. Review and set approval status, then get PO from client for any follow-up work.
                  </p>
                  <ul className="space-y-2">
                    {jobsWithPendingDefects.map((job) => (
                      <li key={job.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 shadow-sm">
                        <div>
                          <span className="font-medium text-gray-900">{job.job_number}</span>
                          <span className="text-gray-600 text-sm ml-2">{vDisplay(job)}</span>
                          <span className="text-gray-500 text-sm ml-2">{job.customer?.name}</span>
                        </div>
                        <Link
                          href={`/manager/job/${job.id}`}
                          className="text-orange-700 font-medium text-sm hover:underline"
                        >
                          Review defects →
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Outstanding: unassigned, paused, awaiting parts */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {unassignedJobs.length > 0 && (
                  <section className="bg-white rounded-xl shadow p-4">
                    <h2 className="font-semibold text-gray-900 mb-2">Unassigned jobs</h2>
                    <p className="text-sm text-gray-600 mb-3">Assign a mechanic to get work started.</p>
                    <ul className="space-y-1.5">
                      {unassignedJobs.slice(0, 5).map((job) => (
                        <li key={job.id} className="flex justify-between text-sm">
                          <Link href={`/manager/job/${job.id}`} className="text-cityfleet-navy hover:underline">
                            {job.job_number}
                          </Link>
                          <span className="text-gray-500">{vDisplay(job)}</span>
                        </li>
                      ))}
                      {unassignedJobs.length > 5 && (
                        <li className="text-gray-500 text-sm">+{unassignedJobs.length - 5} more</li>
                      )}
                    </ul>
                  </section>
                )}
                {pausedJobs.length > 0 && (
                  <section className="bg-white rounded-xl shadow p-4 border-l-4 border-orange-500">
                    <h2 className="font-semibold text-gray-900 mb-2">Paused jobs</h2>
                    <p className="text-sm text-gray-600 mb-3">Jobs currently paused — follow up with mechanic or customer.</p>
                    <ul className="space-y-1.5">
                      {pausedJobs.slice(0, 5).map((job) => (
                        <li key={job.id} className="flex justify-between text-sm">
                          <Link href={`/manager/job/${job.id}`} className="text-cityfleet-navy hover:underline">
                            {job.job_number}
                          </Link>
                          <span className="text-gray-500">{vDisplay(job)}</span>
                        </li>
                      ))}
                      {pausedJobs.length > 5 && (
                        <li className="text-gray-500 text-sm">+{pausedJobs.length - 5} more</li>
                      )}
                    </ul>
                  </section>
                )}
                {awaitingPartsJobs.length > 0 && (
                  <section className="bg-white rounded-xl shadow p-4 border-l-4 border-amber-500">
                    <h2 className="font-semibold text-gray-900 mb-2">Awaiting parts</h2>
                    <p className="text-sm text-gray-600 mb-3">Jobs waiting on parts — track orders and ETA.</p>
                    <ul className="space-y-1.5">
                      {awaitingPartsJobs.slice(0, 5).map((job) => (
                        <li key={job.id} className="flex justify-between text-sm">
                          <Link href={`/manager/job/${job.id}`} className="text-cityfleet-navy hover:underline">
                            {job.job_number}
                          </Link>
                          <span className="text-gray-500">{vDisplay(job)}</span>
                        </li>
                      ))}
                      {awaitingPartsJobs.length > 5 && (
                        <li className="text-gray-500 text-sm">+{awaitingPartsJobs.length - 5} more</li>
                      )}
                    </ul>
                  </section>
                )}
              </div>

              {/* Job pipeline summary */}
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="text-gray-600">Pipeline:</span>
                <span className="text-gray-700"><strong>{summary.unassigned}</strong> unassigned</span>
                <span className="text-gray-700"><strong>{summary.assigned}</strong> assigned</span>
                <span className="text-blue-600"><strong>{summary.inProgress}</strong> in progress</span>
                <span className="text-orange-600"><strong>{summary.paused}</strong> paused</span>
                <span className="text-amber-600"><strong>{summary.awaitingParts}</strong> awaiting parts</span>
                <span className="text-gray-700"><strong>{summary.completed}</strong> completed</span>
              </div>

              {/* Full job table */}
              <section className="bg-white rounded-xl shadow overflow-hidden">
                <h2 className="px-4 py-3 font-semibold text-gray-900 border-b border-gray-100">
                  All jobs
                </h2>
                <div className="flex flex-wrap items-center gap-4 p-4 border-b border-gray-100">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    Filter
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {filtered.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 text-sm">
                    {statusFilter ? 'No jobs match this filter.' : 'No jobs yet for this site.'}
                    {!statusFilter && (
                      <Link href="/manager/jobs/new" className="block text-cityfleet-gold font-medium mt-2">
                        Create first job
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          <th className="px-4 py-3">Job #</th>
                          <th className="px-4 py-3">Vehicle</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">PO / Date</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Assigned to</th>
                          <th className="px-4 py-3 w-20" />
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((job) => (
                          <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="px-4 py-3">
                              <Link
                                href={`/manager/job/${job.id}`}
                                className="font-medium text-cityfleet-navy hover:underline"
                              >
                                {job.job_number}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{vehicleDisplay(job)}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{job.customer?.name ?? '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {job.po_number} {job.po_date && `• ${job.po_date}`}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeClass(job.status)}`}>
                                {job.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={job.assigned_mechanic_id ?? ''}
                                onChange={(e) => onAssign(job.id, e.target.value)}
                                disabled={assigningId === job.id}
                                className="border border-gray-300 rounded px-2 py-1 text-sm w-full max-w-[160px]"
                              >
                                <option value="">Unassigned</option>
                                {mechanics.map((m) => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <Link
                                href={`/manager/job/${job.id}`}
                                className="text-cityfleet-gold font-medium text-sm hover:underline"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

        </div>
      </div>
    </ProtectedRoute>
  )
}
