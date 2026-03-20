'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  useExecRealtimeDashboard,
  type ExecJobRow,
} from '@/hooks/useExecRealtimeDashboard'
import { getDashboardRefreshIntervalMs } from '@/lib/dashboard-constants'

type Props = {
  mode: 'ops' | 'workshop_manager'
  /** Workshop Manager: current site. Ops: null (all sites). */
  siteId: string | null
  siteLabel?: string
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

export function RealtimeOperationsDashboard({ mode, siteId, siteLabel }: Props) {
  const isOps = mode === 'ops'
  const {
    jobs,
    mechanics,
    statusSlices,
    kpis,
    completionsByHour,
    maxStatusCount,
    maxHourly,
    loading,
    error,
    fetchAll,
    lastUpdated,
    vehicleDisplay,
    jobStatusLabel,
  } = useExecRealtimeDashboard({
    siteId: isOps ? null : siteId,
    isOps,
  })

  const [drillStatus, setDrillStatus] = useState<string | null>(null)
  const [drillMechanicId, setDrillMechanicId] = useState<string | null>(null)

  const jobBase = mode === 'ops' ? '/manager/job' : '/manager/job'

  const filteredJobs = useMemo(() => {
    let list = jobs
    if (drillStatus) list = list.filter((j) => j.status === drillStatus)
    if (drillMechanicId) list = list.filter((j) => j.assigned_mechanic_id === drillMechanicId)
    return list
  }, [jobs, drillStatus, drillMechanicId])

  const refreshSec = Math.round(getDashboardRefreshIntervalMs() / 1000)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-cityfleet-navy text-white py-4 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wide">EXEC-01</p>
            <h1 className="text-xl font-bold">Real-time operations</h1>
            <p className="text-sm text-white/80 mt-1">
              {isOps ? 'All sites' : siteLabel ?? 'Your site'} · Auto-refresh every {refreshSec}s
              {lastUpdated && (
                <span className="ml-2 opacity-70">
                  · Last updated {lastUpdated.toLocaleTimeString('en-AU')}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchAll()}
              className="text-sm text-white/80 hover:text-white"
            >
              Refresh now
            </button>
            <Link
              href={isOps ? '/ops/dashboard' : '/manager/dashboard'}
              className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg"
            >
              ← Back
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-900">
          <strong>Billable hours (today):</strong> time on job excluding segments on hold (
          <code className="bg-amber-100 px-1 rounded">pause_reason_code</code> set).
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {loading && jobs.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cityfleet-gold" />
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <KpiCard label="Active (in progress)" value={kpis.activeInProgress} accent="border-cityfleet-navy" />
              <KpiCard
                label="Mechanics clocked on"
                value={`${kpis.mechanicsClockedOn} / ${kpis.mechanicsTotal}`}
                accent="border-green-500"
              />
              <KpiCard label="Completed jobs today" value={kpis.completedJobsToday} accent="border-blue-500" />
              <KpiCard
                label="Avg turnaround (→ mechanic close)"
                value={kpis.avgTurnaroundMechanicHours != null ? `${kpis.avgTurnaroundMechanicHours.toFixed(1)} h` : '—'}
                sub="Jobs with completed_at today"
                accent="border-amber-500"
              />
              <KpiCard
                label="Avg turnaround (→ released)"
                value={kpis.avgTurnaroundFullHours != null ? `${kpis.avgTurnaroundFullHours.toFixed(1)} h` : '—'}
                sub="Jobs with released_at today"
                accent="border-purple-500"
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Status breakdown — drill-down */}
              <section className="bg-white rounded-xl shadow overflow-hidden">
                <h2 className="px-4 py-3 font-semibold text-gray-900 border-b">Job status breakdown</h2>
                <p className="px-4 py-2 text-xs text-gray-500">Click a bar to filter the job list below.</p>
                <div className="p-4 space-y-2">
                  {statusSlices.length === 0 ? (
                    <p className="text-sm text-gray-500">No jobs in scope.</p>
                  ) : (
                    statusSlices.map((s) => {
                      const pct = maxStatusCount ? Math.round((s.count / maxStatusCount) * 100) : 0
                      const active = drillStatus === s.status
                      return (
                        <button
                          key={s.status}
                          type="button"
                          onClick={() => {
                            setDrillStatus((prev) => (prev === s.status ? null : s.status))
                            setDrillMechanicId(null)
                          }}
                          className={`w-full text-left rounded-lg border transition ${
                            active ? 'border-cityfleet-gold bg-amber-50' : 'border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between text-sm px-3 py-1">
                            <span className="font-medium text-gray-800">{s.label}</span>
                            <span className="text-gray-600">{s.count}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded mx-3 mb-2 overflow-hidden">
                            <div
                              className="h-full bg-cityfleet-navy/80 rounded"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </section>

              {/* Hourly completions today */}
              <section className="bg-white rounded-xl shadow overflow-hidden">
                <h2 className="px-4 py-3 font-semibold text-gray-900 border-b">Jobs completed by hour (today)</h2>
                <p className="px-4 py-2 text-xs text-gray-500">Based on released_at (fallback completed_at).</p>
                <div className="p-4 flex items-end gap-1 h-40">
                  {completionsByHour.map((n, h) => {
                    const hgt = maxHourly ? Math.round((n / maxHourly) * 100) : 0
                    return (
                      <div key={h} className="flex-1 flex flex-col items-center justify-end group min-w-0">
                        <span className="text-[10px] text-gray-400 mb-1 opacity-0 group-hover:opacity-100">{n}</span>
                        <div
                          className="w-full bg-cityfleet-gold/80 rounded-t min-h-[4px] transition-all"
                          style={{ height: `${Math.max(4, hgt)}%` }}
                          title={`${h}:00 — ${n} job(s)`}
                        />
                        <span className="text-[9px] text-gray-500 mt-1">{h}</span>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>

            {/* Mechanics */}
            <section className="bg-white rounded-xl shadow overflow-hidden">
              <h2 className="px-4 py-3 font-semibold text-gray-900 border-b">Mechanics & utilization</h2>
              <p className="px-4 py-2 text-xs text-gray-500">
                Billable hours today (excl. on-hold). Click a row to filter jobs assigned to that mechanic.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase">
                      <th className="px-4 py-2">Mechanic</th>
                      {isOps && <th className="px-4 py-2">Site</th>}
                      <th className="px-4 py-2">Clocked on</th>
                      <th className="px-4 py-2">Current job</th>
                      <th className="px-4 py-2">Stage</th>
                      <th className="px-4 py-2">Vehicle</th>
                      <th className="px-4 py-2">Billable h (today)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mechanics.length === 0 ? (
                      <tr>
                        <td colSpan={isOps ? 7 : 6} className="px-4 py-6 text-center text-gray-500">
                          No mechanics in scope.
                        </td>
                      </tr>
                    ) : (
                      mechanics.map((m) => {
                        const rowActive = drillMechanicId === m.mechanicId
                        return (
                          <tr
                            key={`${m.mechanicId}-${m.siteId}`}
                            className={`border-t border-gray-100 cursor-pointer hover:bg-gray-50/80 ${
                              rowActive ? 'bg-amber-50' : ''
                            }`}
                            onClick={() => {
                              setDrillMechanicId((prev) => (prev === m.mechanicId ? null : m.mechanicId))
                              setDrillStatus(null)
                            }}
                          >
                            <td className="px-4 py-2 font-medium text-gray-900">{m.name}</td>
                            {isOps && <td className="px-4 py-2 text-gray-600">{m.siteName}</td>}
                            <td className="px-4 py-2">
                              {m.clockedOn ? (
                                <span className="text-green-700">Yes {m.clockedOnAt && `(${formatTime(m.clockedOnAt)})`}</span>
                              ) : (
                                <span className="text-gray-400">Off</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {m.currentJobId ? (
                                <Link
                                  href={`${jobBase}/${m.currentJobId}`}
                                  className="text-cityfleet-navy font-medium hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {m.currentJobNumber}
                                </Link>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-4 py-2">{m.jobStatusLabel}</td>
                            <td className="px-4 py-2">{m.vehicleDisplay}</td>
                            <td className="px-4 py-2 tabular-nums">{m.billableHoursToday.toFixed(2)}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Drill-down job list */}
            <section className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-gray-900">Job list {drillStatus || drillMechanicId ? '(filtered)' : '(all in scope)'}</h2>
                {(drillStatus || drillMechanicId) && (
                  <button
                    type="button"
                    className="text-sm text-cityfleet-navy hover:underline"
                    onClick={() => {
                      setDrillStatus(null)
                      setDrillMechanicId(null)
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase">
                      <th className="px-4 py-2">Job #</th>
                      {isOps && <th className="px-4 py-2">Site</th>}
                      <th className="px-4 py-2">Vehicle</th>
                      <th className="px-4 py-2">Customer</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2 w-28">Open</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan={isOps ? 6 : 5} className="px-4 py-6 text-center text-gray-500">
                          No jobs match the current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredJobs.map((j: ExecJobRow) => (
                        <tr key={j.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                          <td className="px-4 py-2">
                            <Link href={`${jobBase}/${j.id}`} className="font-medium text-cityfleet-navy hover:underline">
                              {j.job_number}
                            </Link>
                          </td>
                          {isOps && <td className="px-4 py-2 text-gray-600">{j.site?.name ?? '—'}</td>}
                          <td className="px-4 py-2">{vehicleDisplay(j)}</td>
                          <td className="px-4 py-2">{j.customer?.name ?? '—'}</td>
                          <td className="px-4 py-2">{jobStatusLabel(j.status)}</td>
                          <td className="px-4 py-2">
                            <Link href={`${jobBase}/${j.id}`} className="text-cityfleet-gold text-xs font-medium hover:underline">
                              View →
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent: string
}) {
  return (
    <div className={`bg-white rounded-xl shadow p-4 border-l-4 ${accent}`}>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}
