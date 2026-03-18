'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/protected-route'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSiteMechanics } from '@/hooks/useSiteMechanics'

interface Customer {
  id: string
  name: string
}

interface Vehicle {
  id: string
  registration_number: string | null
  vin: string | null
  make: string | null
  model: string | null
  customer_id: string
}

function generateJobNumber(): string {
  const d = new Date()
  const date = d.toISOString().slice(0, 10).replace(/-/g, '')
  const r = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `JOB-${date}-${r}`
}

export default function CreateJobPage() {
  const { site } = useAuth()
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [customerSource, setCustomerSource] = useState<'database' | 'cash'>('database')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [cashCustomerName, setCashCustomerName] = useState('')
  const [cashRego, setCashRego] = useState('')
  const [cashVin, setCashVin] = useState('')
  const [cashMake, setCashMake] = useState('')
  const [cashModel, setCashModel] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [poDate, setPoDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [workType, setWorkType] = useState('')
  const [description, setDescription] = useState('')
  const [quotedLabourHours, setQuotedLabourHours] = useState('')
  const [quotedPartsCost, setQuotedPartsCost] = useState('')
  const [quotedTotal, setQuotedTotal] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fromJobId, setFromJobId] = useState<string | null>(null)
  const [prefillVehicleId, setPrefillVehicleId] = useState<string | null>(null)
  const [assignedMechanicId, setAssignedMechanicId] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const { mechanics } = useSiteMechanics()

  const loadCustomers = useCallback(async () => {
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from('customers')
      .select('id, name')
      .eq('status', 'active')
      .order('name')
    setCustomers(data || [])
  }, [])

  const loadVehicles = useCallback(async (customerId: string) => {
    if (!customerId) {
      setVehicles([])
      setVehicleId('')
      return
    }
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from('vehicles')
      .select('id, registration_number, vin, make, model, customer_id')
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .order('registration_number')
    setVehicles(data || [])
    setVehicleId('')
  }, [])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  useEffect(() => {
    loadVehicles(selectedCustomerId)
  }, [selectedCustomerId, loadVehicles])

  useEffect(() => {
    const fromJob = searchParams.get('from_job')
    if (!fromJob || !site?.id) return
    setFromJobId(fromJob)
    const supabase = createClient()
    ;(supabase as any)
      .from('jobs')
      .select('id, job_number, vehicle_id, customer_id, description, assigned_mechanic_id')
      .eq('id', fromJob)
      .eq('site_id', site.id)
      .single()
      .then(({ data, error: e }: { data: any; error: any }) => {
        if (e || !data) return
        setSelectedCustomerId(data.customer_id)
        setDescription(`Follow-up from ${data.job_number} - additional work`)
        setPrefillVehicleId(data.vehicle_id)
        setAssignedMechanicId(data.assigned_mechanic_id || null)
      })
  }, [searchParams, site?.id])

  useEffect(() => {
    if (prefillVehicleId && vehicles.some((v) => v.id === prefillVehicleId)) {
      setVehicleId(prefillVehicleId)
      setPrefillVehicleId(null)
    }
  }, [vehicles, prefillVehicleId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const isCash = customerSource === 'cash'
    if (isCash) {
      if (!site?.id || !cashCustomerName.trim() || !cashRego.trim() || !poNumber.trim() || !poDate || !description.trim()) {
        setError('Please fill in required fields: Cash customer name, Registration, PO number, PO date, Description.')
        return
      }
    } else {
      if (!site?.id || !vehicleId || !poNumber.trim() || !poDate || !description.trim()) {
        setError('Please fill in required fields: Customer, Vehicle, PO number, PO date, Description.')
        return
      }
    }
    setSubmitting(true)
    setError(null)
    try {
      const supabase = createClient()
      let customerId: string
      let vehicleIdToUse: string

      if (isCash) {
        const { data: newCustomer, error: custErr } = await (supabase as any)
          .from('customers')
          .insert({
            name: cashCustomerName.trim(),
            contact_name: 'Cash',
            status: 'active',
          })
          .select('id')
          .single()
        if (custErr) throw custErr
        customerId = newCustomer.id

        const { data: newVehicle, error: vehErr } = await (supabase as any)
          .from('vehicles')
          .insert({
            customer_id: customerId,
            registration_number: cashRego.trim(),
            vin: cashVin.trim() || null,
            make: cashMake.trim() || null,
            model: cashModel.trim() || null,
            status: 'active',
          })
          .select('id')
          .single()
        if (vehErr) throw vehErr
        vehicleIdToUse = newVehicle.id
      } else {
        const vehicle = vehicles.find((v) => v.id === vehicleId)
        customerId = vehicle?.customer_id || selectedCustomerId
        vehicleIdToUse = vehicleId
        if (!customerId) {
          setError('Customer is required.')
          setSubmitting(false)
          return
        }
      }

      let jobNumber = generateJobNumber()
      let attempts = 0
      const maxAttempts = 5
      while (attempts < maxAttempts) {
        const { data: existing } = await (supabase as any)
          .from('jobs')
          .select('id')
          .eq('job_number', jobNumber)
          .maybeSingle()
        if (!existing) break
        jobNumber = generateJobNumber()
        attempts++
      }

      const { error: insertError } = await (supabase as any)
        .from('jobs')
        .insert({
          job_number: jobNumber,
          vehicle_id: vehicleIdToUse,
          customer_id: customerId,
          site_id: site.id,
          po_number: poNumber.trim(),
          po_date: poDate,
          work_type: workType.trim() || null,
          description: description.trim(),
          quoted_labour_hours: quotedLabourHours ? parseFloat(quotedLabourHours) : null,
          quoted_parts_cost: quotedPartsCost ? parseFloat(quotedPartsCost) : null,
          quoted_total: quotedTotal ? parseFloat(quotedTotal) : null,
          status: fromJobId && assignedMechanicId ? 'approved' : 'quoted',
          ...(fromJobId ? { parent_job_id: fromJobId, assigned_mechanic_id: assignedMechanicId || null } : {}),
        })
        .select('id')
        .single()

      if (insertError) throw insertError
      router.push('/manager/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to create job')
    } finally {
      setSubmitting(false)
    }
  }

  function vehicleLabel(v: Vehicle): string {
    if (v.registration_number) return v.registration_number
    return [v.make, v.model, v.vin].filter(Boolean).join(' ') || v.id.slice(0, 8)
  }

  return (
    <ProtectedRoute allowedRoles={['workshop_manager']}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-cityfleet-navy text-white py-4 px-6 shadow">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold">Create job</h1>
            <Link href="/manager/dashboard" className="text-cityfleet-gold hover:underline text-sm">
              ← Job board
            </Link>
          </div>
        </header>

        <div className="max-w-2xl mx-auto p-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {fromJobId && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-sm">
                Follow-up job — same vehicle, new job number. Assign the same mechanic below if desired.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer <span className="text-red-500">*</span></label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="customerSource"
                    checked={customerSource === 'database'}
                    onChange={() => setCustomerSource('database')}
                    className="rounded border-gray-300"
                  />
                  From database
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="customerSource"
                    checked={customerSource === 'cash'}
                    onChange={() => setCustomerSource('cash')}
                    className="rounded border-gray-300"
                  />
                  Cash / walk-in (enter name)
                </label>
              </div>

              {customerSource === 'database' ? (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required={customerSource === 'database'}
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={cashCustomerName}
                  onChange={(e) => setCashCustomerName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Customer name (e.g. John Smith)"
                  required={customerSource === 'cash'}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle <span className="text-red-500">*</span></label>
              {customerSource === 'database' ? (
                <>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required={customerSource === 'database'}
                    disabled={!selectedCustomerId}
                  >
                    <option value="">Select vehicle...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{vehicleLabel(v)}</option>
                    ))}
                  </select>
                  {selectedCustomerId && vehicles.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">No active vehicles for this customer. Add a vehicle in Admin or choose another customer.</p>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={cashRego}
                    onChange={(e) => setCashRego(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Registration number *"
                    required={customerSource === 'cash'}
                  />
                  <input
                    type="text"
                    value={cashVin}
                    onChange={(e) => setCashVin(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="VIN (optional)"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={cashMake}
                      onChange={(e) => setCashMake(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Make (optional)"
                    />
                    <input
                      type="text"
                      value={cashModel}
                      onChange={(e) => setCashModel(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Model (optional)"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PO number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. PO-12345"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PO date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={poDate}
                  onChange={(e) => setPoDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work type</label>
              <input
                type="text"
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. Service, Repair"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Describe the work to be done..."
                required
              />
            </div>

            {fromJobId && mechanics.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign mechanic</label>
                <p className="text-xs text-gray-500 mb-1">Pre-filled from source job; change if needed.</p>
                <select
                  value={assignedMechanicId || ''}
                  onChange={(e) => setAssignedMechanicId(e.target.value || null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {mechanics.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quoted labour (hrs)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={quotedLabourHours}
                  onChange={(e) => setQuotedLabourHours(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quoted parts ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={quotedPartsCost}
                  onChange={(e) => setQuotedPartsCost(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quoted total ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={quotedTotal}
                  onChange={(e) => setQuotedTotal(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 rounded-lg font-semibold text-white bg-cityfleet-gold hover:opacity-90 disabled:opacity-50 transition"
              >
                {submitting ? 'Creating...' : 'Create job'}
              </button>
              <Link
                href="/manager/dashboard"
                className="py-3 px-6 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}
