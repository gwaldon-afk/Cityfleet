# Manager control before job close & job notes (voice/text)

## 1. Voice-to-text for job notes (mechanic)

**Yes.** The mechanic completion flow includes **voice-to-text** for job notes:

- **Where:** Mechanic job completion screen — **Step 12 Complete** (`/mechanic/job/[id]/complete/completion`).
- **How:** Toggle **⌨ Type** / **🎤 Voice**. In Voice mode, tap **TAP TO START RECORDING**; the app uses the browser **Web Speech API** (SpeechRecognition) to capture speech and show a live transcript. Original transcript is kept for audit.
- **Persistence:** On **SUBMIT FOR MANAGER REVIEW**, notes are saved to `job_notes`:
  - Typed notes → `note_type: 'text'`.
  - Voice transcript → `note_type: 'voice'`.
- **Requirement:** Migration `00006_job_notes_note_type.sql` adds `note_type` and RLS so mechanics can create notes on their assigned jobs. Run it for completion notes (and voice) to work.

---

## 2. Control the manager must confirm before the job can be closed

**Control A-03 (HARD):** *Mechanic CANNOT finalise job without manager approval.*

In practice this is the **two-hand-touch** manager approval (also A-01, WM-06):

1. Mechanic marks the job **Ready for review** (completion checklist + job notes submitted).
2. **Workshop Manager** must explicitly confirm:
   - Opens the job from the dashboard (e.g. **Needs your action** or job list).
   - On the job detail page, when status is **Ready for review**, the **“Approve job”** section is shown.
   - Manager must tick: **“I have reviewed and approve this job”**.
   - Manager clicks **Approve job**.
3. Only then does the job move to **Manager approved** (`manager_approved_at` / `manager_approved_by` set). The mechanic can then do **final sign-off** and close the job (status → `mechanic_closed`).

So the **single control** the manager must confirm before the job can be closed is: **two-hand-touch approval** — i.e. the manager has reviewed the work and approves it, recorded via the disclaimer and **Approve job** action on the manager job detail page.

---

## 3. Defects/parts = additional work → separate job; both jobs need two-hand approval

Defects (with customer approval and estimated cost) and parts (ordered for defect repairs) relate to **additional work** that is done on a **separate job** (different job number). Both the original job and the follow-up job require their own **two-hand inspection** and approval.

**Flow on manager job detail:**

- The page loads **all jobs for this vehicle** that are **Ready for review** (the current job plus any related job on the same vehicle, e.g. a follow-up job from defects).
- The section **“Jobs for this vehicle — two-hand inspection”** lists each of those jobs with:
  - Job number (each job ID is separate).
  - Checkbox: **“I confirm the two-hand inspection is complete for JOB-XXX”**.
  - Button: **“Approve JOB-XXX”** (or **“Approve JOB-YYY”** for the other job).
- The manager can tick both jobs and approve each one. Each approval is recorded **per job ID** (separate `manager_approved_at` / `manager_approved_by` for each job). There is no single “approve all” that merges job IDs — both job IDs are always stored and approved separately.
