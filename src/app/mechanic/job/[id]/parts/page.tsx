'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

const MOCK_JOB = {
  id: 'job-4822',
  job_number: 'JOB-4822',
  vehicle_id: 'VIN: 6T1BF3EK5CU123456',
  vehicle_name: 'Volvo FH16 — Fleet #V-114',
}

interface IssuedPart {
  id: string
  name: string
  part_number: string
  status: 'requested' | 'ordered' | 'received' | 'issued'
  qty_issued: number
  expected_date?: string
}

interface UsedPart {
  id: string
  name: string
  qty_used: number
  timestamp: Date
}

interface Consumable {
  id: string
  name: string
  qty: number
  unit: string
  timestamp: Date
}

const MOCK_ISSUED_PARTS: IssuedPart[] = [
  { id: 'p1', name: 'Oil Filter - Heavy Duty', part_number: 'OFH-4420', status: 'issued', qty_issued: 1 },
  { id: 'p2', name: 'Air Filter Element', part_number: 'AFE-2210', status: 'issued', qty_issued: 1 },
  { id: 'p3', name: 'Engine Oil 15W-40 (20L)', part_number: 'EO-1540-20', status: 'issued', qty_issued: 1 },
  { id: 'p4', name: 'Brake Pads - Front Axle', part_number: 'BPF-8812', status: 'ordered', qty_issued: 2, expected_date: '5 Mar 2026' },
  { id: 'p5', name: 'Fuel Filter Assembly', part_number: 'FFA-3301', status: 'received', qty_issued: 1 },
]

const CONSUMABLE_PRESETS = [
  { name: 'Engine Oil (litres)', unit: 'L' },
  { name: 'Grease Cartridge', unit: 'each' },
  { name: 'Brake Cleaner', unit: 'can' },
  { name: 'Degreaser', unit: 'L' },
  { name: 'Cable Ties', unit: 'pack' },
  { name: 'Rags / Wipes', unit: 'pack' },
  { name: 'Silicone Spray', unit: 'can' },
  { name: 'Thread Locker', unit: 'tube' },
  { name: 'Coolant (litres)', unit: 'L' },
  { name: 'Other', unit: 'each' },
]

export default function PartsScreen() {
  const params = useParams()
  const jobId = params.id as string

  const [activeTab, setActiveTab] = useState<'status' | 'record' | 'consumables'>('status')
  const [usedParts, setUsedParts] = useState<UsedPart[]>([])
  const [consumables, setConsumables] = useState<Consumable[]>([])

  // Record parts usage
  const [selectedPartId, setSelectedPartId] = useState('')
  const [qtyUsed, setQtyUsed] = useState('')

  // Add consumable
  const [selectedConsumable, setSelectedConsumable] = useState('')
  const [consumableQty, setConsumableQty] = useState('')
  const [customConsumable, setCustomConsumable] = useState('')

  const issuedParts = MOCK_ISSUED_PARTS.filter((p) => p.status === 'issued')
  const pendingParts = MOCK_ISSUED_PARTS.filter((p) => p.status !== 'issued')

  const recordPartUsage = () => {
    const part = MOCK_ISSUED_PARTS.find((p) => p.id === selectedPartId)
    if (!part || !qtyUsed) return
    const entry: UsedPart = {
      id: `used-${Date.now()}`,
      name: part.name,
      qty_used: parseInt(qtyUsed),
      timestamp: new Date(),
    }
    setUsedParts((prev) => [...prev, entry])
    setSelectedPartId('')
    setQtyUsed('')
  }

  const addConsumable = () => {
    if (!selectedConsumable || !consumableQty) return
    const preset = CONSUMABLE_PRESETS.find((c) => c.name === selectedConsumable)
    const name = selectedConsumable === 'Other' ? customConsumable || 'Other consumable' : selectedConsumable
    const entry: Consumable = {
      id: `con-${Date.now()}`,
      name,
      qty: parseFloat(consumableQty),
      unit: preset?.unit || 'each',
      timestamp: new Date(),
    }
    setConsumables((prev) => [...prev, entry])
    setSelectedConsumable('')
    setConsumableQty('')
    setCustomConsumable('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued': return 'bg-green-100 text-green-700'
      case 'received': return 'bg-blue-100 text-blue-700'
      case 'ordered': return 'bg-yellow-100 text-yellow-700'
      case 'requested': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'issued': return '✅'
      case 'received': return '📦'
      case 'ordered': return '🚚'
      case 'requested': return '📋'
      default: return '•'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cityfleet-navy to-cityfleet-navy-light text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">CITY FLEET</p>
            <p className="font-bold text-sm">{MOCK_JOB.job_number}</p>
          </div>
          <span className="text-xs bg-blue-900/50 px-2 py-1 rounded">PARTS &amp; CONSUMABLES</span>
        </div>
        <div className="mt-2 text-xs opacity-80">
          {MOCK_JOB.vehicle_name} • {MOCK_JOB.vehicle_id}
        </div>
      </div>

      {/* Control Info */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
        <p className="text-xs text-blue-700 font-semibold">
          P-02: All parts must be linked to this job • P-03: Controlled lifecycle enforced
        </p>
      </div>

      <div className="max-w-md mx-auto">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-white">
          {([
            { key: 'status', label: `Status (${MOCK_ISSUED_PARTS.length})` },
            { key: 'record', label: `Used (${usedParts.length})` },
            { key: 'consumables', label: `Consumables (${consumables.length})` },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {/* ─── STATUS TAB ──────────────────────────────────────── */}
          {activeTab === 'status' && (
            <>
              {issuedParts.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-2">Available for Use</h3>
                  <div className="space-y-2">
                    {issuedParts.map((part) => (
                      <div key={part.id} className="bg-white rounded-lg shadow p-3 border-l-4 border-green-500">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{part.name}</p>
                            <p className="text-xs text-gray-500">Part #: {part.part_number} • Qty: {part.qty_issued}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(part.status)}`}>
                            {getStatusIcon(part.status)} {part.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingParts.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-2">On Order / Pending</h3>
                  <div className="space-y-2">
                    {pendingParts.map((part) => (
                      <div key={part.id} className="bg-white rounded-lg shadow p-3 border-l-4 border-yellow-400">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{part.name}</p>
                            <p className="text-xs text-gray-500">
                              Part #: {part.part_number} • Qty: {part.qty_issued}
                              {part.expected_date && ` • ETA: ${part.expected_date}`}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(part.status)}`}>
                            {getStatusIcon(part.status)} {part.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">
                  Parts are ordered by your Workshop Manager. You will be notified when parts arrive and are issued to your job.
                  Contact your manager if you need additional parts.
                </p>
              </div>
            </>
          )}

          {/* ─── RECORD USAGE TAB ────────────────────────────────── */}
          {activeTab === 'record' && (
            <>
              <div className="bg-white rounded-lg shadow p-4 space-y-3">
                <h3 className="font-bold text-gray-800">Record Part Used</h3>
                <p className="text-xs text-gray-600">
                  Select from issued parts and record the quantity you used.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Part</label>
                  <select
                    value={selectedPartId}
                    onChange={(e) => setSelectedPartId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select issued part...</option>
                    {issuedParts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.part_number}) — Qty issued: {p.qty_issued}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Used</label>
                  <input
                    type="number"
                    value={qtyUsed}
                    onChange={(e) => setQtyUsed(e.target.value)}
                    placeholder="Enter quantity..."
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <button
                  onClick={recordPartUsage}
                  disabled={!selectedPartId || !qtyUsed}
                  className="w-full py-2 rounded-lg text-white font-semibold text-sm disabled:opacity-40 transition-colors bg-cityfleet-navy disabled:bg-gray-400"
                >
                  + RECORD USAGE
                </button>
              </div>

              {usedParts.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-2">Parts Used on This Job</h3>
                  <div className="space-y-2">
                    {usedParts.map((p) => (
                      <div key={p.id} className="bg-white rounded-lg shadow p-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{p.name}</p>
                          <p className="text-xs text-gray-500">
                            Qty: {p.qty_used} • {p.timestamp.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <button
                          onClick={() => setUsedParts((prev) => prev.filter((x) => x.id !== p.id))}
                          className="text-red-400 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {usedParts.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-4">No parts recorded yet</p>
              )}
            </>
          )}

          {/* ─── CONSUMABLES TAB ─────────────────────────────────── */}
          {activeTab === 'consumables' && (
            <>
              <div className="bg-white rounded-lg shadow p-4 space-y-3">
                <h3 className="font-bold text-gray-800">Add Consumable</h3>
                <p className="text-xs text-gray-600">
                  Record consumables used (oil, grease, cleaner, etc.). These are added to job cost.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consumable</label>
                  <select
                    value={selectedConsumable}
                    onChange={(e) => setSelectedConsumable(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select consumable...</option>
                    {CONSUMABLE_PRESETS.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {selectedConsumable === 'Other' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={customConsumable}
                      onChange={(e) => setCustomConsumable(e.target.value)}
                      placeholder="Describe the consumable..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity {selectedConsumable && `(${CONSUMABLE_PRESETS.find((c) => c.name === selectedConsumable)?.unit || 'each'})`}
                  </label>
                  <input
                    type="number"
                    value={consumableQty}
                    onChange={(e) => setConsumableQty(e.target.value)}
                    placeholder="Enter quantity..."
                    min="0.1"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <button
                  onClick={addConsumable}
                  disabled={!selectedConsumable || !consumableQty}
                  className="w-full py-2 rounded-lg text-white font-semibold text-sm disabled:opacity-40 transition-colors bg-cityfleet-navy disabled:bg-gray-400"
                >
                  + ADD CONSUMABLE
                </button>
              </div>

              {consumables.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-2">Consumables Used</h3>
                  <div className="space-y-2">
                    {consumables.map((c) => (
                      <div key={c.id} className="bg-white rounded-lg shadow p-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{c.name}</p>
                          <p className="text-xs text-gray-500">
                            Qty: {c.qty} {c.unit} • {c.timestamp.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <button
                          onClick={() => setConsumables((prev) => prev.filter((x) => x.id !== c.id))}
                          className="text-red-400 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {consumables.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-4">No consumables recorded yet</p>
              )}
            </>
          )}
        </div>

        {/* Back to Job */}
        <div className="px-4">
          <a
            href={`/mechanic/job/${jobId}/work`}
            className="block w-full py-3 rounded-lg text-center font-semibold text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ← BACK TO JOB
          </a>
        </div>
      </div>
    </div>
  )
}
