'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { extractOdometerFromImage } from '@/lib/ocr'

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
const MOCK_JOB = {
  id: 'job-4822',
  job_number: 'JOB-4822',
  vehicle_id: 'VIN: 6T1BF3EK5CU123456',
  vehicle_name: 'Volvo FH16 — Fleet #V-114',
  pre_odometer: 245832, // captured at M-04 safety checklist
}

const MOCK_DEFECTS = [
  { id: 'd1', description: 'Brake pads worn >50% — front axle', severity: 'RED' as const },
  { id: 'd2', description: 'Minor oil seep — rear diff housing', severity: 'ORANGE' as const },
]

export default function TestDriveScreen() {
  const params = useParams()
  const router = useRouter()
  const jobId = params?.id as string
  const [testDriveCompleted, setTestDriveCompleted] = useState<boolean | null>(null)
  const [postOdometer, setPostOdometer] = useState('')
  const [odometerPhoto, setOdometerPhoto] = useState<string | null>(null)
  const [defectResolutions, setDefectResolutions] = useState<Record<string, 'resolved' | 'unresolved' | ''>>({})
  const [unresolvdNote, setUnresolvedNote] = useState<Record<string, string>>({})
  const [postRepairPhotos, setPostRepairPhotos] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [odometerScanning, setOdometerScanning] = useState(false)
  const odometerInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const handleOdometerPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (ev.target?.result) setOdometerPhoto(ev.target.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
    setOdometerScanning(true)
    try {
      const km = await extractOdometerFromImage(file)
      if (km != null) setPostOdometer(String(km))
    } catch {
      // OCR failed — user can enter km manually
    } finally {
      setOdometerScanning(false)
    }
  }

  const handlePostRepairPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (ev.target?.result) setPostRepairPhotos((prev) => [...prev, ev.target!.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const kmDifference = postOdometer ? parseInt(postOdometer) - MOCK_JOB.pre_odometer : 0

  const allDefectsResolved = MOCK_DEFECTS.every((d) => defectResolutions[d.id])

  const canSubmit =
    testDriveCompleted === true &&
    postOdometer &&
    odometerPhoto &&
    allDefectsResolved &&
    postRepairPhotos.length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    // TODO: Save to Supabase
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
    }, 1000)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">CITY FLEET</p>
              <p className="font-bold text-sm">{MOCK_JOB.job_number}</p>
            </div>
            <span className="text-xs bg-blue-900/50 px-2 py-1 rounded">STEP 11 — TEST</span>
          </div>
        </div>
        <div className="max-w-md mx-auto p-6 text-center mt-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Test Confirmed</h2>
          <p className="text-gray-600 mb-1">Odometer: {MOCK_JOB.pre_odometer} → {postOdometer} ({kmDifference} km)</p>
          <p className="text-sm text-gray-500 mb-6">Proceed to completion checklist.</p>
          <button
            type="button"
            onClick={() => {
              if (jobId) router.push(`/mechanic/job/${jobId}/complete/completion`)
              else router.push('/mechanic/jobs')
            }}
            className="block w-full py-3 rounded-lg text-white font-bold text-lg text-center"
            style={{ backgroundColor: '#B8860B' }}
          >
            CONTINUE TO COMPLETION →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">CITY FLEET</p>
            <p className="font-bold text-sm">{MOCK_JOB.job_number}</p>
          </div>
          <span className="text-xs bg-blue-900/50 px-2 py-1 rounded">STEP 11 — TEST</span>
        </div>
        <div className="mt-2 text-xs opacity-80">
          {MOCK_JOB.vehicle_name} • {MOCK_JOB.vehicle_id}
        </div>
      </div>

      {/* Hard Gate */}
      <div className="bg-red-50 border-b border-red-200 px-4 py-2">
        <p className="text-xs text-red-700 font-semibold">
          ⛔ Q-01 HARD GATE: Test / test drive must be confirmed before sign-off
        </p>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Test Drive Confirmation */}
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <h3 className="font-bold text-gray-800">Test Drive Confirmation</h3>
          <p className="text-sm text-gray-600">Have you test driven or step-out tested this vehicle?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTestDriveCompleted(true)}
              className={`py-3 rounded-lg font-bold text-sm border-2 transition-all ${
                testDriveCompleted === true
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-green-50 text-green-700 border-green-300 hover:border-green-500'
              }`}
            >
              ✅ YES — Tested
            </button>
            <button
              onClick={() => setTestDriveCompleted(false)}
              className={`py-3 rounded-lg font-bold text-sm border-2 transition-all ${
                testDriveCompleted === false
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-red-50 text-red-700 border-red-300 hover:border-red-500'
              }`}
            >
              ❌ NO
            </button>
          </div>
          {testDriveCompleted === false && (
            <p className="text-xs text-red-600 font-semibold bg-red-50 p-2 rounded">
              ⚠ Test drive is mandatory. Vehicle cannot be signed off without testing.
            </p>
          )}
        </div>

        {/* Post-Work Odometer */}
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <h3 className="font-bold text-gray-800">Post-Work Odometer</h3>
          <div className="bg-gray-50 rounded p-2 text-sm">
            <span className="text-gray-500">Pre-work reading: </span>
            <span className="font-bold">{MOCK_JOB.pre_odometer.toLocaleString()} km</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Odometer Reading <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={postOdometer}
              onChange={(e) => setPostOdometer(e.target.value)}
              placeholder={odometerScanning ? 'Scanning…' : 'Enter km reading or use photo OCR'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            {postOdometer && (
              <p className={`text-xs mt-1 font-semibold ${kmDifference > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                {kmDifference > 0
                  ? `✅ Vehicle driven ${kmDifference} km during test`
                  : '⚠ Reading same or lower than pre-work'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo of Odometer <span className="text-red-500">*</span>
            </label>
            <input ref={odometerInputRef} type="file" accept="image/*" capture="environment" onChange={handleOdometerPhoto} className="hidden" />
            {odometerPhoto ? (
              <div className="relative inline-block">
                <img src={odometerPhoto} alt="Odometer" className="w-32 h-24 object-cover rounded" />
                <button
                  onClick={() => setOdometerPhoto(null)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => odometerInputRef.current?.click()}
                disabled={odometerScanning}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-600 disabled:opacity-50"
              >
                {odometerScanning ? '⏳ Scanning…' : '📷 Take photo of odometer (OCR will try to fill reading)'}
              </button>
            )}
            <p className="text-xs text-gray-500 mt-1">If OCR fails, enter the km reading manually above.</p>
          </div>
        </div>

        {/* Defect Resolution */}
        {MOCK_DEFECTS.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <h3 className="font-bold text-gray-800">Defect Resolution</h3>
            <p className="text-xs text-gray-600">Confirm each approved defect has been resolved.</p>
            {MOCK_DEFECTS.map((d) => (
              <div key={d.id} className={`p-3 rounded-lg border-l-4 ${d.severity === 'RED' ? 'border-red-500 bg-red-50' : 'border-orange-400 bg-orange-50'}`}>
                <p className="text-sm text-gray-800 mb-2">{d.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDefectResolutions((prev) => ({ ...prev, [d.id]: 'resolved' }))}
                    className={`flex-1 py-2 rounded text-xs font-semibold border transition-all ${
                      defectResolutions[d.id] === 'resolved'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-green-700 border-green-300'
                    }`}
                  >
                    ✅ Resolved
                  </button>
                  <button
                    onClick={() => setDefectResolutions((prev) => ({ ...prev, [d.id]: 'unresolved' }))}
                    className={`flex-1 py-2 rounded text-xs font-semibold border transition-all ${
                      defectResolutions[d.id] === 'unresolved'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-red-700 border-red-300'
                    }`}
                  >
                    ❌ Unable
                  </button>
                </div>
                {defectResolutions[d.id] === 'unresolved' && (
                  <textarea
                    value={unresolvdNote[d.id] || ''}
                    onChange={(e) => setUnresolvedNote((prev) => ({ ...prev, [d.id]: e.target.value }))}
                    placeholder="Explain why this defect could not be resolved..."
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-2"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Post-Repair Photos */}
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <h3 className="font-bold text-gray-800">Post-Repair Evidence</h3>
          <p className="text-xs text-gray-600">Minimum 1 post-repair photo required.</p>
          <input ref={photoInputRef} type="file" accept="image/*" capture="environment" multiple onChange={handlePostRepairPhotos} className="hidden" />
          <button
            onClick={() => photoInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-600"
          >
            📷 Take post-repair photo(s)
          </button>
          {postRepairPhotos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {postRepairPhotos.map((photo, idx) => (
                <div key={idx} className="relative flex-shrink-0">
                  <img src={photo} alt={`Post-repair ${idx + 1}`} className="w-16 h-16 object-cover rounded" />
                  <button
                    onClick={() => setPostRepairPhotos((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full py-3 rounded-lg text-white font-bold text-lg disabled:opacity-40 transition-colors"
            style={{ backgroundColor: canSubmit ? '#B8860B' : '#9CA3AF' }}
          >
            {isSubmitting ? 'SUBMITTING...' : 'CONFIRM TEST COMPLETE'}
          </button>
          {!canSubmit && (
            <p className="text-center text-xs text-red-500 mt-1">
              Complete all fields above to continue
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
