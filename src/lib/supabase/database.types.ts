// ═══════════════════════════════════════════════════════════════════════════
// CITY FLEET — Database Types (Supabase Schema)
// Location: src/lib/supabase/database.types.ts
// Maps to the 24-table Supabase schema deployed in Phase 1
// ═══════════════════════════════════════════════════════════════════════════

// ─── USER & AUTH ────────────────────────────────────────────────────────────
export type UserRole = 'mechanic' | 'workshop_manager' | 'ops_manager' | 'administrator'

export interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  status: 'active' | 'inactive'
  created_at: string
}

export interface UserRoleRecord {
  id: string
  user_id: string
  role: UserRole
  site_id: string | null
}

// ─── SITE ────────────────────────────────────────────────────────────────────
export interface Site {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  postcode: string | null
  phone: string | null
  email: string | null
  timezone: string
  operating_hours: string | null
  status: 'active' | 'inactive'
  created_at: string
}

// ─── CUSTOMER ────────────────────────────────────────────────────────────────
export interface Customer {
  id: string
  name: string
  account_number: string | null
  account_type: 'cash' | 'account'
  labour_rate: number
  parts_margin_pct: number
  consumables_margin_pct: number
  po_required: boolean
  status: 'active' | 'inactive'
  created_at: string
}

// ─── VEHICLE ─────────────────────────────────────────────────────────────────
export interface Vehicle {
  id: string
  vin: string | null
  fleet_number: string | null
  radio_number: string | null
  make: string | null
  model: string | null
  year: number | null
  customer_id: string
  status: 'active' | 'inactive'
  created_at: string
}

// ─── JOB ─────────────────────────────────────────────────────────────────────
export type JobStatus =
  | 'quoted' | 'approved' | 'in_progress' | 'paused'
  | 'awaiting_parts' | 'awaiting_approval' | 'diagnosing'
  | 'defects_logged' | 'testing' | 'ready_for_review'
  | 'manager_approved' | 'mechanic_closed' | 'ops_review'
  | 'closed_released'

export interface Job {
  id: string
  job_number: string
  vehicle_id: string
  customer_id: string
  site_id: string
  po_number: string | null
  work_type: string | null
  description: string | null
  status: JobStatus
  assigned_mechanic_id: string | null
  estimated_hours: number | null
  quote_amount: number | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  due_date: string | null
  parent_job_id: string | null
  supervisor_notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// ─── SHIFT (L-01) ────────────────────────────────────────────────────────────
export interface Shift {
  id: string
  user_id: string
  site_id: string
  clock_on: string
  clock_off: string | null
  status: 'active' | 'completed'
  created_at: string
}

// ─── TIME ENTRY (L-02, L-04, L-05) ──────────────────────────────────────────
export interface TimeEntry {
  id: string
  job_id: string
  mechanic_id: string
  shift_id: string
  start_time: string
  end_time: string | null
  pause_reason: string | null
  pause_note: string | null
  status: 'active' | 'paused' | 'completed'
  created_at: string
}

// ─── SAFETY CHECKLIST (S-01 to S-04) ─────────────────────────────────────────
export interface JobSafetyChecklist {
  id: string
  job_id: string
  mechanic_id: string
  safe_environment: boolean
  not_blocking_faster_job: boolean
  vin_entered: string | null
  completed_at: string
  created_at: string
}

// ─── DIAGNOSIS (D-01) ────────────────────────────────────────────────────────
export interface JobDiagnosis {
  id: string
  job_id: string
  mechanic_id: string
  category: string
  finding: string
  evidence_urls: string[]
  created_at: string
}

// ─── DEFECT (D-02, D-03, D-04) ──────────────────────────────────────────────
export type DefectSeverity = 'RED' | 'ORANGE'
export type DefectStatus = 'logged' | 'approved' | 'rejected' | 'deferred' | 'resolved'

export interface JobDefect {
  id: string
  job_id: string
  mechanic_id: string
  description: string
  severity: DefectSeverity
  category: string
  evidence_urls: string[]
  status: DefectStatus
  created_at: string
}

// ─── JOB PARTS (P-02, P-03) ──────────────────────────────────────────────────
export type PartLifecycleStatus = 'requested' | 'ordered' | 'received' | 'issued'

export interface JobPart {
  id: string
  job_id: string
  part_id: string | null
  part_number: string | null
  part_description: string
  quantity: number
  unit_cost: number | null
  status: PartLifecycleStatus
  expected_delivery: string | null
  created_at: string
}

// ─── CONSUMABLE ──────────────────────────────────────────────────────────────
export interface JobConsumable {
  id: string
  job_id: string
  mechanic_id: string
  name: string
  quantity: number
  unit: string
  created_at: string
}

// ─── PART USAGE ──────────────────────────────────────────────────────────────
export interface JobPartUsage {
  id: string
  job_id: string
  job_part_id: string
  mechanic_id: string
  quantity_used: number
  created_at: string
}

// ─── ODOMETER READINGS ───────────────────────────────────────────────────────
export interface JobOdometerReading {
  id: string
  job_id: string
  mechanic_id: string
  reading_type: 'pre_work' | 'post_work'
  value: number | null
  photo_url: string | null
  created_at: string
}

// ─── ATTACHMENTS ─────────────────────────────────────────────────────────────
export interface JobAttachment {
  id: string
  job_id: string
  user_id: string
  stage: 'pre' | 'during' | 'post'
  file_url: string
  file_type: string | null
  description: string | null
  ocr_text: string | null
  created_at: string
}

// ─── NOTES (Q-04) ────────────────────────────────────────────────────────────
export interface JobNote {
  id: string
  job_id: string
  user_id: string
  note_type: 'text' | 'voice' | 'ai_cleaned'
  content: string
  original_content: string | null
  created_at: string
}

// ─── COMPLETION CHECKLIST (Q-02, Q-03) ───────────────────────────────────────
export interface JobCompletionChecklist {
  id: string
  job_id: string
  mechanic_id: string
  vehicle_clean: boolean
  workplace_clean: boolean
  tools_returned: boolean
  equipment_returned: boolean
  trash_removed: boolean
  service_sticker_applied: boolean
  completed_at: string
  created_at: string
}

// ─── TEST CONFIRMATION (Q-01) ────────────────────────────────────────────────
export interface JobTestConfirmation {
  id: string
  job_id: string
  mechanic_id: string
  test_completed: boolean
  test_type: 'step_out' | 'test_drive' | 'both'
  notes: string | null
  created_at: string
}

// ─── APPROVALS (A-01 to A-05) ────────────────────────────────────────────────
export type ApprovalType = 'manager_two_hand_touch' | 'mechanic_final' | 'ops_closeout' | 'ops_final'

export interface JobApproval {
  id: string
  job_id: string
  approval_type: ApprovalType
  approved_by: string
  disclaimer_text: string | null
  notes: string | null
  created_at: string
}

// ─── VIEW TYPES (joined for UI) ──────────────────────────────────────────────
export interface JobWithVehicle extends Job {
  vehicle?: Vehicle
  customer?: Customer
}

export interface MechanicProfile extends User {
  roles: UserRoleRecord[]
  site?: Site
}
