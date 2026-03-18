# Plan: Defects → Follow-up Jobs & Job Creation / Dashboard

**Purpose:** Address two elements: (1) Defects flow — mechanic completes work on defects, WM is notified, client PO for additional work, separate job created and allocated by VIN/plate and previous mechanic; (2) Job creation — based on daily bookings and PO, WM creates job when controls are met, job dashboard with day view and related jobs by vehicle.

---

## Current state (brief)

### Defects
- **Mechanic:** Logs defects on job (description, severity, evidence); submits defects to manager. Defects are stored on the **current job**.
- **Manager:** Sees defects when opening the job (Defects section); can set customer approval (Pending/Approved/Rejected) and estimated cost.
- **Gaps:** No explicit “defects notified to WM” (e.g. dashboard alert or status); no flow to “get PO from client” for additional work; no **separate job** for that additional work; no allocation of the new job to the same mechanic by VIN/plate/previous job.

### Job creation
- **Create job:** `/manager/jobs/new` exists — Customer, Vehicle, PO number, PO date, work type, description, quoted labour/parts/total. Creates job in status `quoted`; WM can then assign mechanic from dashboard.
- **Dashboard:** Shows mechanics (clocked on, current job), KPIs, “Needs your action”, unassigned/paused/awaiting parts, and full job table (Job #, Vehicle, Customer, PO/Date, Status, Assigned to). Filter by status.
- **Gaps:** No concept of “daily bookings” or “PO reply” as input to job creation; no “jobs for today” view; no “related jobs for this vehicle” (other jobs same VIN/plate); create job is not explicitly gated by “controls met” (could add checklist or rules).

---

## Element 1: Defects → WM notification → PO → New job & allocation

### 1.1 Notify Workshop Manager of defects
- **Option A (lightweight):** Add a dashboard section **“Jobs with defects needing action”**: jobs where defects exist and at least one defect has `customer_approval_status = 'pending'` (or a new flag `defects_notified = false` then set to true when WM has seen them).
- **Option B:** When mechanic submits defects, set job status to e.g. `defects_logged` (or keep `in_progress`) and ensure “Needs your action” or a dedicated “Defects to review” list includes these jobs. Manager dashboard already has “Needs your action” for `ready_for_review`; add a similar block for “Defects pending approval” (jobs with unapproved defects).
- **Deliverable:** WM sees which jobs have defects awaiting their review (and optionally customer PO) without opening each job blind.

### 1.2 Record PO from client for additional work
- **Option A:** Use existing **jobs** table: when creating the *follow-up* job, require PO number and PO date (already on create form). So “PO from client” = WM enters PO when creating the new job.
- **Option B:** Use **purchase_orders** table (already in schema): record a PO (po_number, po_date, customer_id, optionally link to job_id later). When creating follow-up job, select “existing PO” or enter new PO and link job to it.
- **Recommendation:** Start with Option A (PO on the new job). Option B can be added if you want a separate PO register before job creation.

### 1.3 Create a separate job for additional work
- **New job:** Different `job_number`; same `vehicle_id` (and thus same vehicle/VIN and plate); same `customer_id`; same `site_id`; new `po_number` / `po_date` for the additional work; description can reference “Follow-up from JOB-XXX – [defect summary]”.
- **Link to origin (optional but useful):** Add **parent_job_id** (or `source_job_id`) to **jobs** via migration: `REFERENCES jobs(id)`. Set it when creating the job “from defects” so you can show “This job is follow-up from JOB-XXX” and list “Follow-up jobs” on the original job.
- **Optional:** Link new job to specific defect(s), e.g. `defects.source_follow_up_job_id` or a table `defect_follow_up_jobs(defect_id, job_id)`. Phase 2 if you need defect-level tracking.

### 1.4 Allocate new job to mechanic (by VIN/plate and previous job)
- **Rule:** Allocate the new job to the **same mechanic** who had the original job (where defects were found), when possible. Identified by: same vehicle (VIN/registration) and “previous job” = job that had the defects.
- **Implementation:**  
  - When WM opens “Create follow-up job from defects” (from job J1), pre-fill vehicle/customer from J1 and **suggest or pre-select** `assigned_mechanic_id = J1.assigned_mechanic_id`.  
  - If “create job” is from dashboard (not from a job), no pre-fill; WM selects mechanic as today (or later add “allocate by vehicle” lookup: “other jobs for this vehicle” → suggest mechanic from latest job on that vehicle).
- **Deliverable:** “Create job from defects” flow: from Manager job detail (job with defects), button **“Create follow-up job for additional work”** → create job form pre-filled (vehicle, customer, description from defects), PO number/date entered, mechanic pre-filled from current job → create → new job appears on dashboard, assigned to that mechanic.

### 1.5 Mechanic “completing work on defects”
- **Clarification:** You said “as a mechanic I was able to complete work on defects identified.” In the current flow, the mechanic **logs** defects on the original job; the **additional** work (approved by client via PO) is done on the **new** job. So “complete work on defects” can mean:  
  - **(A)** On the **original** job: mechanic marks defects as “resolved” or “work done” during test/completion (already partially there on test page with defect resolution checklist); or  
  - **(B)** On the **follow-up** job: mechanic does the actual repair work for the defects that got a PO and a new job.  
- **Plan:** Support both: (A) keep defect resolution on original job (test/sign-off); (B) the “additional work” is the new job — mechanic completes that job as normal (safety → … → sign-off). No change to mechanic flow for (B) except they see the new job in their list (same vehicle, different job number).

---

## Element 2: Job creation and job dashboard

### 2.1 Job creation “based on daily bookings and PO”
- **Daily bookings:** There is no “bookings” table in the current schema. You can either:  
  - **Option A:** Introduce a **bookings** (or **scheduled_work**) table: vehicle_id, customer_id, site_id, booking_date, po_number (optional), po_received_at, status, notes. WM sees “Today’s bookings”; for each booking with PO received (or PO recorded), can “Create job” and pre-fill vehicle/customer/PO from the booking.  
  - **Option B:** Keep job creation as today: WM selects Customer + Vehicle + enters PO number/date. “Daily bookings” is then a **view** or **filter**: “Jobs created today” or “Jobs with PO date = today” on the dashboard, rather than a separate booking entity.  
- **Recommendation:** Start with **Option B** (no new table): job creation stays as-is; add dashboard filter “Today” (e.g. jobs by `created_at` or `po_date` = today). If you later need a formal booking/scheduling step (e.g. customer books in advance before PO), add Option A and “Create job from booking”.

### 2.2 “PO reply or recorded against the vehicle”
- **Today:** PO is stored on the **job** (po_number, po_date). So “PO recorded against the vehicle” = “job(s) for that vehicle that have a PO”.  
- **Enhancement:** On “Create job”, optionally **look up** other jobs for the selected vehicle and show “Existing POs / jobs for this vehicle” so WM doesn’t duplicate. No schema change needed if PO stays on job.

### 2.3 WM creates job “when controls are met”
- **Controls:** Define what “met” means, e.g.: Vehicle selected; Customer selected; PO number and PO date present; Description present. Already enforced on create form.  
- **Optional:** Add an explicit “Pre-create checklist” (e.g. “PO received from client”, “Vehicle confirmed”) as checkboxes or a short policy note on the Create job page. No hard gate in MVP unless you want to block submit until checklist is ticked.

### 2.4 Job dashboard: jobs for day, PO, related jobs by vehicle
- **Jobs for the day:**  
  - Add a **“Today”** (or “Jobs for today”) section or filter: jobs where `created_at::date = today` OR `po_date = today` (configurable). Show in a compact list with Job #, Vehicle, PO, Status, Assigned to.  
- **Relevant details (PO, etc.):** Already in the full job table (PO/Date column). Ensure “Today” view also shows PO number and date.  
- **Related jobs (same vehicle):**  
  - On **Manager job detail** page: add a section **“Other jobs for this vehicle”** — query jobs where `vehicle_id = job.vehicle_id` and `id <> job.id`, order by created_at desc. Shows job number, status, PO, assigned mechanic, link to open.  
  - On **Dashboard:** Optional “Related jobs” column or a small indicator “3 other jobs for this vehicle” with tooltip or link to filter by vehicle.  
- **Deliverables:**  
  - Dashboard: “Jobs for today” block and/or date filter (Today / This week / All).  
  - Manager job detail: “Other jobs for this vehicle” list.  
  - Create job page: optional note “Controls: PO and vehicle required” or a 2–3 item checklist.

### 2.5 Allocation by WM
- Already in place: from dashboard, WM assigns mechanic via dropdown on each job. When creating a follow-up job from defects (Element 1), pre-fill assigned mechanic from the parent job.

---

## Suggested implementation order

| Phase | What | Notes |
|-------|------|--------|
| **1** | **Defects notification to WM** | Dashboard section “Jobs with defects pending approval” (or include in “Needs your action” with a defect count). |
| **2** | **Create follow-up job from job** | On Manager job detail: button “Create follow-up job”. Pre-fill vehicle, customer, description (e.g. “Follow-up from JOB-XXX”); require PO; pre-fill assigned_mechanic_id from current job. New job, new job_number. |
| **3** | **Link follow-up to parent** | Migration: add `parent_job_id` to `jobs`. Set when creating from “Create follow-up job”. Show “Follow-up from JOB-XXX” on new job and “Follow-up jobs: JOB-YYY” on parent job. |
| **4** | **Dashboard: Jobs for today** | Filter or section “Today” (by created_at or po_date). Show key columns including PO. |
| **5** | **Dashboard / Job detail: Related jobs by vehicle** | Job detail page: “Other jobs for this vehicle”. Optional: dashboard indicator. |
| **6** | **Bookings (optional)** | If you need “daily bookings” as a first-class entity (book before PO), add bookings table and “Create job from booking” flow. |

---

## Summary

- **Element 1:** Defects are visible to WM (dashboard); WM gets PO from client (entered when creating the new job); a **separate job** is created for additional work (new job number, same vehicle); that job is **allocated to the same mechanic** (pre-filled from parent job). Optional: `parent_job_id` to link follow-up to original job.  
- **Element 2:** Job creation remains PO + vehicle + customer + description; “controls met” = required fields (and optional checklist). **Job dashboard** gets “Jobs for today” and **related jobs for the same vehicle** (on job detail and optionally on dashboard). “Daily bookings” can be added later as a table and “Create job from booking” if needed.

This plan keeps the single approval button and existing create-job form, and adds the defects→follow-up flow and dashboard improvements you described.
