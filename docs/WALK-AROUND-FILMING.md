# Walk-around filming (before starting the job)

## What it is

A **walk-around** is a short video (or set of photos) of the **vehicle condition before any work** is done. The mechanic films or photographs the vehicle — exterior and, if relevant, interior — to document its state at job start. This:

- Reduces disputes about damage that was already present
- Supports compliance and audit
- Fits standard workshop practice before starting work

## Where it sits in the flow

- **When:** Before or at the very start of the safety step — i.e. when the mechanic has “started” the job (M-03) and is about to do the **Safety Checklist** (M-04), or as the **first action on M-04** before the safe environment / VIN questions.
- **Order:** **Walk-around filming** → then Safety checklist (VIN, safe environment, not blocking faster job) → then Diagnosis, etc.

So the flow is:

1. Mechanic starts job (M-03).
2. **Record walk-around video (or photos)** — vehicle condition before work.
3. Complete Safety checklist (M-04) — VIN, safe environment, not blocking.
4. Continue to Diagnosis (M-05), Defects (M-06), and rest of the job.

## How it’s stored

- **Storage:** Supabase Storage bucket **`job-attachments`**.
- **Path:** `{jobId}/walkaround/{timestamp}.{ext}` (e.g. `.mp4` for video, `.jpg` for photos).
- **Database:** Rows in **job_attachments** with `job_id`, `file_path`, `file_type` (e.g. `video/mp4` or `image/jpeg`), `uploaded_by`, so the walk-around is clearly “under” that job and can be shown in the relevant area (e.g. “Pre-work walk-around”).

The **AttachmentArea** type in `src/lib/supabase/storage.ts` includes **`walkaround`** for this.

## Implementation notes

- **Capture:** Same as other evidence — phone camera via `<input accept="video/*,image/*" capture="environment">`; optional “Record video” vs “Take photos” so the mechanic can choose.
- **Requirement:** **HARD gate (S-05).** Walk-around video or photos are mandatory. The system blocks “Continue to diagnosis” until at least one walk-around file is uploaded. See Control Matrix in `.cursorrules`.
- **UI:** On **Safety (M-04)** add a first section: “Walk-around — record vehicle condition before work” with “Record video” / “Take photo(s)” and upload; then the existing Safety questions (safe environment, not blocking, VIN). Alternatively, a dedicated “Walk-around” step between Job Start (M-03) and Safety (M-04) can be used if you prefer a separate screen.

---

**Summary:** Yes — there is a **walk-around filming** step before starting the job. It is documented as the first evidence step (before or at the start of Safety), stored under the job as area **walkaround**, and the architecture supports it via `job-attachments` and the `walkaround` attachment area.
