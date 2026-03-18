'use client'

import { useEffect } from 'react'
import { useAuditLog } from '@/hooks/useAuditLog'

export default function AdminAuditPage() {
  const {
    entries,
    loading,
    error,
    page,
    total,
    totalPages,
    pageSize,
    filters,
    setFilter,
    fetchPage,
  } = useAuditLog()

  useEffect(() => {
    fetchPage(0)
  }, [fetchPage])

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString('en-AU', {
        dateStyle: 'short',
        timeStyle: 'medium',
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Audit log</h2>

      <div className="flex flex-wrap items-end gap-4 p-4 bg-gray-50 rounded-lg">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">From date</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilter('dateFrom', e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">To date</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilter('dateTo', e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Entity type</span>
          <input
            type="text"
            value={filters.entityType}
            onChange={(e) => setFilter('entityType', e.target.value)}
            placeholder="e.g. job, invoice"
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-32"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Action</span>
          <input
            type="text"
            value={filters.action}
            onChange={(e) => setFilter('action', e.target.value)}
            placeholder="e.g. update, insert"
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-32"
          />
        </label>
        <button
          type="button"
          onClick={() => fetchPage(0)}
          className="px-4 py-2 rounded-lg bg-cityfleet-navy text-white text-sm font-medium hover:opacity-90"
        >
          Apply
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cityfleet-gold" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {formatDate(row.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.action}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.entity_type}
                        {row.entity_id ? ` ${String(row.entity_id).slice(0, 8)}…` : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.user_id ? String(row.user_id).slice(0, 8) + '…' : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {row.new_data && typeof row.new_data === 'object'
                          ? JSON.stringify(row.new_data).slice(0, 80) + (JSON.stringify(row.new_data).length > 80 ? '…' : '')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {entries.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">No audit entries match the filters.</div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fetchPage(page - 1)}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => fetchPage(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
