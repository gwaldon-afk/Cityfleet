'use client'

import { useState } from 'react'
import { useAdminCustomers } from '@/hooks/useAdminCustomers'

export default function AdminCustomersPage() {
  const { customers, loading, error, fetchAll, updatePricing } = useAdminCustomers()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [labourDollars, setLabourDollars] = useState('')
  const [partsMargin, setPartsMargin] = useState('')
  const [saving, setSaving] = useState(false)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  function startEdit(c: { id: string; labour_rate_cents: number | null; parts_margin_percent: number | null }) {
    setEditingId(c.id)
    setLabourDollars(c.labour_rate_cents != null ? (c.labour_rate_cents / 100).toFixed(2) : '')
    setPartsMargin(c.parts_margin_percent != null ? String(c.parts_margin_percent) : '')
  }

  async function savePricing() {
    if (!editingId) return
    const labourCents = labourDollars === '' ? null : Math.round(parseFloat(labourDollars) * 100)
    const margin = partsMargin === '' ? null : parseFloat(partsMargin)
    if (labourCents !== null && (Number.isNaN(labourCents) || labourCents < 0)) {
      setErrMsg('Labour rate must be a non-negative number.')
      return
    }
    if (margin !== null && (Number.isNaN(margin) || margin < 0 || margin > 100)) {
      setErrMsg('Parts margin must be between 0 and 100.')
      return
    }
    setSaving(true)
    setErrMsg(null)
    try {
      await updatePricing(editingId, labourCents, margin)
      setEditingId(null)
    } catch (e: any) {
      setErrMsg(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Customer pricing</h2>
        <button
          type="button"
          onClick={() => fetchAll()}
          className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}
      {errMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{errMsg}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cityfleet-gold" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Labour rate ($/hr)</th>
                  <th className="px-4 py-3">Parts margin %</th>
                  <th className="px-4 py-3 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.contact_name || c.contact_email || '—'}</td>
                    {editingId === c.id ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={labourDollars}
                            onChange={(e) => setLabourDollars(e.target.value)}
                            className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={partsMargin}
                            onChange={(e) => setPartsMargin(e.target.value)}
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={savePricing}
                            disabled={saving}
                            className="text-sm text-cityfleet-navy font-medium hover:underline disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-sm text-gray-600 hover:underline ml-2"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {c.labour_rate_cents != null ? `$${(c.labour_rate_cents / 100).toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {c.parts_margin_percent != null ? `${c.parts_margin_percent}%` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => startEdit(c)}
                            className="text-sm text-cityfleet-gold font-medium hover:underline"
                          >
                            Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {customers.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">No customers found.</div>
          )}
        </div>
      )}
    </div>
  )
}
