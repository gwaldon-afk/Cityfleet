'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/protected-route'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSiteMechanicsWithStatus } from '@/hooks/useSiteMechanicsWithStatus'

interface JobDetail {
  id: string
  job_number: string
  status: string
  vehicle_id: string
  po_number: string
  po_date: string
  work_type: string | null
  description: string
  created_at: string
  assigned_mechanic_id: string | null
  manager_approved_at: string | null
  vehicle: { registration_number: string | null; vin: string | null; make: string | null; model: string | null } | null
  customer: { name: string } | null
}

interface RelatedJobRow {
  id: string
  job_number: string
  status: string
  assigned_mechanic_id: string | null
}

interface DefectRow {
  id: string
  description: string
  severity: string
  evidence_urls: string[] | null
  customer_approval_status: string | null
  estimated_cost_cents: number | null
}

interface PartRow {
  id: string
  part_number: string
  description: string | null
}

interface JobPartRow {
  id: string
  job_id: string
  part_id: string
  quantity: number
  unit_cost_cents: number | null
  lifecycle_status: string
  part: PartRow | null
}

interface InvoiceRow {
  id: string
  invoice_number: string
  total_cents: number
  payment_type: string | null
  invoice_date: string
  payment_cleared_at: string | null
  created_at: string
}

export default function ManagerJobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { user, site, role } = useAuth()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [defects, setDefects] = useState<DefectRow[]>([])
  const [jobParts, setJobParts] = useState<JobPartRow[]>([])
  const [partsCatalog, setPartsCatalog] = useState<PartRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approveDisclaimer, setApproveDisclaimer] = useState(false)
  const [approving, setApproving] = useState(false)
  const [addPartId, setAddPartId] = useState('')
  const [addPartQty, setAddPartQty] = useState(1)
  const [addingPart, setAddingPart] = useState(false)
  const [relatedJobs, setRelatedJobs] = useState<RelatedJobRow[]>([])
  const [approveDisclaimerByJobId, setApproveDisclaimerByJobId] = useState<Record<string, boolean>>({})
  const [approvingJobId, setApprovingJobId] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)
  const [createInvoiceNumber, setCreateInvoiceNumber] = useState('')
  const [createTotalDollars, setCreateTotalDollars] = useState('')
  const [createPaymentType, setCreatePaymentType] = useState<string>('invoice')
  const [createInvoiceDate, setCreateInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [creatingInvoice, setCreatingInvoice] = useState(false)
  const [clearingPaymentId, setClearingPaymentId] = useState<string | null>(null)
  const [releasing, setReleasing] = useState(false)
  const [assigningMechanic, setAssigningMechanic] = useState(false)
  const [suggestedMechanicId, setSuggestedMechanicId] = useState<string | null>(null)
  const { mechanicsWithStatus, mechanics, loading: mechanicsLoading } = useSiteMechanicsWithStatus()

  const loadJob = useCallback(async () => {
    if (!id) return
    if (role !== 'ops_manager' && !site?.id) return
    const supabase = createClient()
    let q = (supabase as any)
      .from('jobs')
      .select(`
        id, job_number, status, vehicle_id, po_number, po_date, work_type, description, created_at, assigned_mechanic_id, manager_approved_at,
        vehicle:vehicles(registration_number, vin, make, model),
        customer:customers(name)
      `)
      .eq('id', id)
    if (role !== 'ops_manager') q = q.eq('site_id', site!.id)
    const { data, error: e } = await q.single()
    if (e) setError(e.message)
    else setJob(data)
  }, [id, site?.id, role])

  const loadDefects = useCallback(async () => {
    if (!id) return
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from('defects')
      .select('id, description, severity, evidence_urls, customer_approval_status, estimated_cost_cents')
      .eq('job_id', id)
      .order('created_at')
    setDefects(data || [])
  }, [id])

  const loadJobParts = useCallback(async () => {
    if (!id) return
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from('job_parts')
      .select(`
        id, job_id, part_id, quantity, unit_cost_cents, lifecycle_status,
        part:parts(id, part_number, description)
      `)
      .eq('job_id', id)
    setJobParts(data || [])
  }, [id])

  const loadRelatedJobs = useCallback(async (vehicleId: string) => {
    if (!site?.id || !vehicleId) return
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from('jobs')
      .select('id, job_number, status, assigned_mechanic_id')
      .eq('vehicle_id', vehicleId)
      .eq('site_id', site.id)
      .neq('id', id)
      .order('created_at', { ascending: false })
    setRelatedJobs(data || [])
  }, [id, site?.id])

  const loadInvoices = useCallback(async () => {
    if (!id) return
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from('invoices')
      .select('id, invoice_number, total_cents, payment_type, invoice_date, payment_cleared_at, created_at')
      .eq('job_id', id)
      .order('created_at')
    setInvoices(data || [])
  }, [id])

  useEffect(() => {
    if (!id) return
    ;(async () => {
      setLoading(true)
      await loadJob()
      await loadDefects()
      await loadJobParts()
      await loadInvoices()
      setLoading(false)
    })()
  }, [id, loadJob, loadDefects, loadJobParts, loadInvoices])

  useEffect(() => {
    if (job?.vehicle_id) loadRelatedJobs(job.vehicle_id)
  }, [job?.vehicle_id, loadRelatedJobs])

  useEffect(() => {
    if (!job || !relatedJobs.length) {
      setSuggestedMechanicId(null)
      return
    }
    const other = relatedJobs.find(
      (j) => ['in_progress', 'approved'].includes(j.status) && j.assigned_mechanic_id
    )
    setSuggestedMechanicId(other?.assigned_mechanic_id ?? null)
  }, [job, relatedJobs])

  useEffect(() => {
    const supabase = createClient()
    ;(supabase as any)
      .from('parts')
      .select('id, part_number, description')
      .eq('status', 'active')
      .order('part_number')
      .then(({ data }: any) => setPartsCatalog(data || []))
  }, [])

  async function handleApprove() {
    await handleApproveJob(id)
  }

  async function handleApproveJob(jobId: string) {
    if (!user) return
    const checked = jobId === id ? approveDisclaimer : approveDisclaimerByJobId[jobId]
    if (!checked) return
    setApprovingJobId(jobId)
    setError(null)
    try {
      const supabase = createClient()
      const { error: e } = await (supabase as any)
        .from('jobs')
        .update({
          status: 'manager_approved',
          manager_approved_at: new Date().toISOString(),
          manager_approved_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
      if (e) throw e
      if (jobId === id) {
        router.push('/manager/dashboard')
        return
      }
      await loadJob()
      if (job?.vehicle_id) await loadRelatedJobs(job.vehicle_id)
      setApproveDisclaimerByJobId((prev) => ({ ...prev, [jobId]: false }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setApprovingJobId(null)
    }
  }

  async function updateDefectApproval(defectId: string, customer_approval_status: string, estimated_cost_cents: number | null) {
    try {
      const supabase = createClient()
      await (supabase as any)
        .from('defects')
        .update({
          customer_approval_status: customer_approval_status || null,
          estimated_cost_cents: estimated_cost_cents ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', defectId)
      await loadDefects()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleAddPart() {
    if (!addPartId || addPartQty < 1) return
    setAddingPart(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: e } = await (supabase as any)
        .from('job_parts')
        .insert({
          job_id: id,
          part_id: addPartId,
          quantity: addPartQty,
          lifecycle_status: 'ordered',
        })
      if (e) throw e
      setAddPartId('')
      setAddPartQty(1)
      await loadJobParts()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAddingPart(false)
    }
  }

  async function handleCreateInvoice() {
    const num = createInvoiceNumber.trim()
    const totalDollars = parseFloat(createTotalDollars)
    if (!num || Number.isNaN(totalDollars) || totalDollars < 0) {
      setError('Invoice number and a valid total are required.')
      return
    }
    setCreatingInvoice(true)
    setError(null)
    try {
      const supabase = createClient()
      const total_cents = Math.round(totalDollars * 100)
      const { error: e } = await (supabase as any)
        .from('invoices')
        .insert({
          job_id: id,
          invoice_number: num,
          total_cents,
          payment_type: createPaymentType || null,
          invoice_date: createInvoiceDate,
          updated_at: new Date().toISOString(),
        })
      if (e) throw e
      setShowCreateInvoice(false)
      setCreateInvoiceNumber('')
      setCreateTotalDollars('')
      setCreatePaymentType('invoice')
      setCreateInvoiceDate(new Date().toISOString().slice(0, 10))
      await loadInvoices()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreatingInvoice(false)
    }
  }

  async function handleMarkPaymentCleared(invoiceId: string) {
    setClearingPaymentId(invoiceId)
    setError(null)
    try {
      const supabase = createClient()
      const { error: e } = await (supabase as any)
        .from('invoices')
        .update({
          payment_cleared_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
      if (e) throw e
      await loadInvoices()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setClearingPaymentId(null)
    }
  }

  async function handleReleaseJob() {
    setReleasing(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: e } = await (supabase as any)
        .from('jobs')
        .update({
          status: 'closed_released',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (e) throw e
      await loadJob()
      await loadInvoices()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setReleasing(false)
    }
  }

  async function handleAssignMechanic(mechanicId: string | null) {
    setAssigningMechanic(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: e } = await (supabase as any)
        .from('jobs')
        .update({
          assigned_mechanic_id: mechanicId,
          updated_at: new Date().toISOString(),
          ...(mechanicId ? { status: 'approved' } : {}),
        })
        .eq('id', id)
      if (e) throw e
      await loadJob()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAssigningMechanic(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['workshop_manager', 'ops_manager']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cityfleet-gold" />
        </div>
      </ProtectedRoute>
    )
  }

  if (error && !job) {
    return (
      <ProtectedRoute allowedRoles={['workshop_manager', 'ops_manager']}>
        <div className="min-h-screen bg-gray-50 p-6">
          <p className="text-red-600">{error}</p>
          <Link href="/manager/dashboard" className="text-cityfleet-navy underline mt-4 inline-block">← Job board</Link>
        </div>
      </ProtectedRoute>
    )
  }

  const v = job!.vehicle
  const vehicleDisplay = v?.registration_number || [v?.make, v?.model].filter(Boolean).join(' ') || v?.vin || '—'
  const canApprove = job!.status === 'ready_for_review'
  const jobsNeedingApproval: { id: string; job_number: string; status: string }[] = [
    ...(job!.status === 'ready_for_review' ? [{ id: job!.id, job_number: job!.job_number, status: job!.status }] : []),
    ...relatedJobs.filter((j) => j.status === 'ready_for_review'),
  ]

  return (
    <ProtectedRoute allowedRoles={['workshop_manager', 'ops_manager']}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-cityfleet-navy text-white py-4 px-6 shadow">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold">Job {job!.job_number}</h1>
            <Link href="/manager/dashboard" className="text-cityfleet-gold hover:underline text-sm">← Job board</Link>
          </div>
        </header>
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-medium capitalize">{job!.status.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-gray-500">Vehicle</p>
                <p className="font-medium">{vehicleDisplay}</p>
              </div>
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-medium">{job!.customer?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">PO</p>
                <p className="font-medium">{job!.po_number} ({job!.po_date})</p>
              </div>
            </div>
            {job!.work_type && (
              <div>
                <p className="text-gray-500 text-sm">Work type</p>
                <p className="font-medium">{job!.work_type}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500 text-sm">Description</p>
              <p className="font-medium">{job!.description}</p>
            </div>
            <div className="border-t border-gray-100 pt-4 mt-2">
                <p className="text-gray-700 font-medium mb-2">Assign mechanic</p>
                {mechanicsLoading ? (
                  <p className="text-sm text-gray-500">Loading mechanics…</p>
                ) : mechanicsWithStatus.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    No mechanics at this site. Add mechanics in Admin → Users, or assign from the{' '}
                    <Link href="/manager/dashboard" className="text-cityfleet-gold font-medium hover:underline">Job board</Link> (All jobs table).
                  </p>
                ) : (
                  <>
                    <ul className="mb-3 space-y-1.5 text-sm">
                      {mechanicsWithStatus.map(({ mechanic, hasActiveJob, currentJobNumber }) => (
                        <li key={mechanic.id} className="flex items-center gap-2">
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
                              hasActiveJob ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                            title={hasActiveJob ? `On job ${currentJobNumber ?? ''}` : 'Available'}
                          />
                          <span className="text-gray-800">{mechanic.name}</span>
                          {hasActiveJob && currentJobNumber && (
                            <span className="text-gray-500 text-xs">(on {currentJobNumber})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    {suggestedMechanicId && !job!.assigned_mechanic_id && (
                      <p className="text-xs text-blue-700 mb-2">
                        Suggested: {mechanics.find((m) => m.id === suggestedMechanicId)?.name} (currently working on this vehicle)
                      </p>
                    )}
                    <select
                      value={job!.assigned_mechanic_id ?? suggestedMechanicId ?? ''}
                      onChange={(e) => handleAssignMechanic(e.target.value || null)}
                      disabled={assigningMechanic}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[220px]"
                    >
                      <option value="">Unassigned — select mechanic</option>
                      {mechanicsWithStatus.map(({ mechanic }) => (
                        <option key={mechanic.id} value={mechanic.id}>{mechanic.name}</option>
                      ))}
                    </select>
                    {assigningMechanic && <span className="ml-2 text-xs text-gray-500">Saving…</span>}
                  </>
                )}
              </div>
          </div>

          {/* Jobs for this vehicle — two-hand inspection (each job ID recorded separately) */}
          {jobsNeedingApproval.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h2 className="font-semibold text-amber-900 mb-2">Jobs for this vehicle — two-hand inspection</h2>
              <p className="text-sm text-amber-800 mb-4">
                Defects and parts may have led to additional work (separate job). Each job needs its own two-hand approval. Tick and approve each job below; both job IDs are recorded separately (A-01, WM-06).
              </p>
              <ul className="space-y-4">
                {jobsNeedingApproval.map((j) => (
                  <li key={j.id} className="flex flex-wrap items-center gap-3 bg-white rounded-lg p-4 border border-amber-100">
                    <span className="font-medium text-gray-900">Job {j.job_number}</span>
                    <label className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={j.id === id ? approveDisclaimer : (approveDisclaimerByJobId[j.id] ?? false)}
                        onChange={(e) =>
                          j.id === id
                            ? setApproveDisclaimer(e.target.checked)
                            : setApproveDisclaimerByJobId((prev) => ({ ...prev, [j.id]: e.target.checked }))
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-800">I confirm the two-hand inspection is complete for {j.job_number}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleApproveJob(j.id)}
                      disabled={(j.id === id ? !approveDisclaimer : !approveDisclaimerByJobId[j.id]) || approvingJobId !== null}
                      className="px-4 py-2 rounded-lg font-semibold text-white bg-cityfleet-gold hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                    >
                      {approvingJobId === j.id ? 'Approving...' : `Approve ${j.job_number}`}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Create follow-up job (Batch B: additional work from defects) */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-900 mb-2">Additional work from defects or parts needs a separate job (new job number, same vehicle).</p>
            <Link
              href={`/manager/jobs/new?from_job=${id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-cityfleet-navy hover:opacity-90"
            >
              Create follow-up job for this vehicle →
            </Link>
          </div>

          {/* Defects — customer approval & estimated cost */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Defects</h2>
            {defects.length === 0 ? (
              <p className="text-sm text-gray-500">No defects logged for this job.</p>
            ) : (
              <ul className="space-y-4">
                {defects.map((d) => (
                  <li key={d.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${d.severity === 'RED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {d.severity}
                      </span>
                      <span className="text-xs text-gray-500">{(d.evidence_urls?.length ?? 0)} evidence</span>
                    </div>
                    <p className="text-sm text-gray-800 mb-3">{d.description}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="text-xs text-gray-600">Customer approval</label>
                      <select
                        value={d.customer_approval_status ?? 'pending'}
                        onChange={(e) => updateDefectApproval(d.id, e.target.value, d.estimated_cost_cents)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <label className="text-xs text-gray-600 ml-2">Est. cost ($)</label>
                      <input
                        key={`cost-${d.id}-${d.estimated_cost_cents ?? 'n'}`}
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={d.estimated_cost_cents != null ? (d.estimated_cost_cents / 100).toFixed(2) : ''}
                        onBlur={(e) => {
                          const v = e.target.value
                          const cents = v === '' ? null : Math.round(parseFloat(v) * 100)
                          updateDefectApproval(d.id, d.customer_approval_status ?? 'pending', cents)
                        }}
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Parts — order parts for job */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Parts</h2>
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Part</label>
                <select
                  value={addPartId}
                  onChange={(e) => setAddPartId(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm min-w-[200px]"
                >
                  <option value="">Select part...</option>
                  {partsCatalog.map((p) => (
                    <option key={p.id} value={p.id}>{p.part_number} — {p.description || '—'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Qty</label>
                <input
                  type="number"
                  min={1}
                  value={addPartQty}
                  onChange={(e) => setAddPartQty(parseInt(e.target.value, 10) || 1)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm w-20"
                />
              </div>
              <button
                onClick={handleAddPart}
                disabled={!addPartId || addingPart}
                className="px-4 py-2 rounded-lg font-medium text-white bg-cityfleet-navy hover:opacity-90 disabled:opacity-50"
              >
                {addingPart ? 'Adding...' : 'Add part (ordered)'}
              </button>
            </div>
            {jobParts.length === 0 ? (
              <p className="text-sm text-gray-500">No parts on this job yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="pb-2 pr-2">Part</th>
                    <th className="pb-2 pr-2">Qty</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobParts.map((jp) => (
                    <tr key={jp.id} className="border-b border-gray-100">
                      <td className="py-2 pr-2">
                        {jp.part ? `${jp.part.part_number} — ${jp.part.description || '—'}` : jp.part_id}
                      </td>
                      <td className="py-2 pr-2">{jp.quantity}</td>
                      <td className="py-2 capitalize">{jp.lifecycle_status.replace(/_/g, ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Invoices & release — create invoice, mark payment cleared, release job */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Invoices & release</h2>
            <p className="text-sm text-gray-600 mb-4">
              Create an invoice for this job. When payment is received and cleared, mark it below. The vehicle cannot be released until all invoices are payment-cleared.
            </p>
            {!showCreateInvoice ? (
              <button
                type="button"
                onClick={() => setShowCreateInvoice(true)}
                className="mb-4 px-4 py-2 rounded-lg font-medium text-white bg-cityfleet-navy hover:opacity-90"
              >
                + Create invoice
              </button>
            ) : (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3 max-w-md">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Invoice number</label>
                  <input
                    value={createInvoiceNumber}
                    onChange={(e) => setCreateInvoiceNumber(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="e.g. INV-001"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Total ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={createTotalDollars}
                    onChange={(e) => setCreateTotalDollars(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Payment type</label>
                  <select
                    value={createPaymentType}
                    onChange={(e) => setCreatePaymentType(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="invoice">Invoice</option>
                    <option value="card">Card</option>
                    <option value="cash">Cash</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Invoice date</label>
                  <input
                    type="date"
                    value={createInvoiceDate}
                    onChange={(e) => setCreateInvoiceDate(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreateInvoice}
                    disabled={creatingInvoice}
                    className="px-4 py-2 rounded-lg font-medium text-white bg-cityfleet-gold text-cityfleet-navy hover:opacity-90 disabled:opacity-50"
                  >
                    {creatingInvoice ? 'Creating...' : 'Save invoice'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateInvoice(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {invoices.length === 0 ? (
              <p className="text-sm text-gray-500 mb-4">No invoices for this job yet.</p>
            ) : (
              <ul className="space-y-3 mb-4">
                {invoices.map((inv) => (
                  <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 border border-gray-200 rounded-lg p-3">
                    <div className="text-sm">
                      <span className="font-medium">{inv.invoice_number}</span>
                      <span className="text-gray-600 ml-2">${(inv.total_cents / 100).toFixed(2)}</span>
                      <span className="text-gray-500 ml-2">{inv.payment_type || '—'}</span>
                      <span className="text-gray-500 ml-2">{inv.invoice_date}</span>
                      {inv.payment_cleared_at ? (
                        <span className="ml-2 text-green-600">Payment cleared</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarkPaymentCleared(inv.id)}
                          disabled={clearingPaymentId !== null}
                          className="ml-2 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50"
                        >
                          {clearingPaymentId === inv.id ? 'Updating...' : 'Mark payment cleared'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {['mechanic_closed', 'manager_approved', 'ops_review'].includes(job!.status) && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  Release the vehicle when all invoices are payment-cleared. If any invoice is unpaid, the release will be blocked.
                </p>
                <button
                  type="button"
                  onClick={handleReleaseJob}
                  disabled={releasing || (invoices.length > 0 && invoices.some((i) => !i.payment_cleared_at))}
                  className="px-4 py-2 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {releasing ? 'Releasing...' : 'Release job'}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm text-gray-500">Mechanics see this job in their app under My Jobs (mechanic-only flow).</p>
            <Link href="/manager/dashboard" className="text-cityfleet-gold font-medium text-sm hover:underline">← Dashboard</Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
