'use client'

import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/protected-route'
import Link from 'next/link'
import { useOpsCloseoutQueue, type InvoiceSummary } from '@/hooks/useOpsCloseoutQueue'

function paymentBadge(summary: InvoiceSummary): { label: string; className: string } {
  switch (summary) {
    case 'none':
      return { label: 'No invoice', className: 'bg-gray-100 text-gray-700' }
    case 'unpaid':
      return { label: 'Unpaid', className: 'bg-amber-100 text-amber-800' }
    case 'cleared':
      return { label: 'Payment cleared', className: 'bg-green-100 text-green-800' }
    default:
      return { label: '—', className: 'bg-gray-100 text-gray-600' }
  }
}

export default function OpsDashboardPage() {
  const { user, role } = useAuth()
  const {
    jobs,
    invoiceSummaryByJobId,
    loading,
    error,
    fetchAll,
    vehicleDisplay,
    statusLabel,
  } = useOpsCloseoutQueue()

  return (
    <ProtectedRoute allowedRoles={['ops_manager']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="bg-cityfleet-gold/20 border border-cityfleet-gold rounded-lg p-4 flex-1 min-w-0">
              <h1 className="text-xl font-bold text-cityfleet-navy">Ops Manager Dashboard</h1>
              <p className="text-sm text-gray-700 mt-1">
                Signed in as {user?.name} ({role})
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchAll()}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-medium"
            >
              Refresh
            </button>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-2">Close-out queue</h2>
          <p className="text-sm text-gray-600 mb-4">
            Jobs in mechanic closed, manager approved, or ops review. Open a job to create an invoice, mark payment cleared, and release the vehicle.
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cityfleet-gold" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500 text-sm">
              No jobs in the close-out queue (mechanic closed, manager approved, ops review, or closed).
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <th className="px-4 py-3">Job #</th>
                      <th className="px-4 py-3">Vehicle</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3 w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => {
                      const summary = invoiceSummaryByJobId[job.id] ?? 'none'
                      const badge = paymentBadge(summary)
                      return (
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
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {statusLabel(job.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/manager/job/${job.id}`}
                              className="text-cityfleet-gold font-medium text-sm hover:underline"
                            >
                              Invoice & release
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
