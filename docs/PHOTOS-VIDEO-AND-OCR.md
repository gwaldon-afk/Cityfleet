# Photos, video, and OCR — confirmation and architecture

## Confirmation: mechanics can take photos and videos on their phones

- The app is **mobile-first PWA** (per PRD); mechanics use phones to capture **photos and video**.
- Capture uses the **browser file input** with `accept="image/*"` and/or `accept="video/*"` and `capture="environment"` so the device opens **camera** on mobile.
- **Upload:** Files (or base64 from camera) are uploaded to **Supabase Storage** and linked to the job via **job_attachments** (and, for defects, **defects.evidence_urls**).
- Media is **saved under the job** and under the **relevant area** (safety/VIN, diagnosis, defects, test/odometer, completion) via:
  - **job_attachments** — `job_id` + `file_path` (path in bucket) + optional category/stage in path.
  - **defects** — `evidence_urls` array (URLs or paths to defect evidence).
  - **job_odometer_readings** (or equivalent) — `photo_url` for odometer photo; extracted value in `value` / vehicle `odometer_km`.

So yes: mechanics can take photos and videos on their phones, and those are saved to the job under the relevant area.

---

## PRD steps that require photos (or video)

From the PRD / control matrix and mechanic screens:

| Step | Screen / area | What is required | Control |
|------|----------------|-------------------|---------|
| **Before start** | M-03 → M-04 | **Walk-around filming** — video (or photos) of vehicle condition before any work. Done before or as first part of Safety. Saved under job area `walkaround` or `safety`. | Best practice |
| **4. Safety checklist** | M-04 Safety | **VIN** mandatory (S-04). VIN can be **entered manually** or captured from a **photo of VIN plate/dashboard** → OCR → text stored in job/vehicle. Optional: photo of licence plate for registration. | S-04 HARD |
| **5. Diagnosis** | M-05 Diagnosis | **Evidence photos** for each finding (D-01). Photos saved as job attachments (diagnosis area). | D-01 |
| **6. Defect capture** | M-06 Defects | **Photo or video evidence mandatory per defect** (D-03). Evidence saved to storage and URLs in **defects.evidence_urls**. | D-03 HARD |
| **11. Test / test-drive** | M-08 Test | **Odometer reading** + **photo of odometer**. Odometer value extracted from photo (OCR) and stored in job/vehicle; photo saved as attachment. Post-repair photos optional but recommended. | Q-01 / evidence |
| **12. Completion** | M-09 Completion | Job notes (voice/text). Optional: photos for completion evidence. | — |

**Summary of steps that require photos (per PRD):**

1. **Walk-around (before starting work):** Video (or photo set) of vehicle condition before any work — first step when starting the job or at top of Safety (M-04). Saved as job attachments (area `walkaround` or `safety`).
2. **Safety (M-04):** VIN (and optionally licence plate) — photo → OCR → text into vehicle/job fields.
3. **Diagnosis (M-05):** Evidence photos per finding → job attachments (diagnosis).
4. **Defects (M-06):** Photo or video **mandatory** per defect → storage + **defects.evidence_urls**.
5. **Test (M-08):** Odometer photo → OCR → value in job/vehicle; odometer photo and post-repair photos saved as attachments.

---

## Architecture: how images are saved and OCR is used

### Storage

- **Bucket:** `job-attachments` (Supabase Storage). Create in Supabase Dashboard if not already present; apply RLS so only authorised roles can read/write.
- **Path pattern:** `{jobId}/{area}/{category?}/{timestamp}.{ext}`  
  - **area** = e.g. `safety` | `diagnosis` | `defects` | `odometer` | `completion` so media is “under the relevant area” of the job.
- **Table:** **job_attachments** — `job_id`, `file_path` (path in bucket), `file_type`, `file_size_bytes`, `uploaded_by`, optional `ocr_text` (if column exists). Links each file to the job.
- **Defects:** Table **defects** has **evidence_urls** (TEXT[]). After upload, append the public URL (or path) to `evidence_urls` for that defect.

### OCR and where text is stored

- **VIN (and licence plate):**  
  - Photo of VIN plate/dashboard (and optionally licence plate) → **OCR** (e.g. Tesseract.js) → extract 17-char VIN and/or plate number.  
  - **Stored in:** **vehicles.vin** (and **vehicles.registration_number** if plate is captured). Job is linked to vehicle, so job card has VIN via vehicle. If the app also stores “VIN confirmed” on the job (e.g. safety checklist), that field can hold the same value.
- **Odometer:**  
  - Photo of odometer → **OCR** (Tesseract.js) → extract numeric reading.  
  - **Stored in:**  
    - **vehicles.odometer_km** (current reading), and/or  
    - Job-level odometer readings (e.g. **job_odometer_readings** or similar: pre/post, value + `photo_url`).  
  So the “relevant fields of the job card” (and vehicle) are populated from OCR.

### Flow (high level)

1. Mechanic taps “Take photo” / “Take video” on the relevant screen (safety, diagnosis, defects, test).
2. Browser opens camera (or file picker); file or data URL is obtained.
3. **Upload** file to Supabase Storage → get `file_path` (and public URL if needed).
4. **Insert** row in **job_attachments** with `job_id`, `file_path`, `file_type`, `uploaded_by`, and optional `ocr_text`.
5. For **defects:** also append URL to **defects.evidence_urls** for that defect.
6. When the photo is **VIN / plate / odometer:** run **OCR** on the image (client or server); parse VIN (17 chars), plate number, or numeric odometer; **update** **vehicles.vin**, **vehicles.registration_number**, **vehicles.odometer_km** and/or job odometer records.

---

## What is in place vs what to wire

| Piece | Status |
|-------|--------|
| **Storage bucket** | Documented (`job-attachments`); must be created in Supabase and RLS applied. |
| **job_attachments table** | In schema: `job_id`, `file_path`, `file_type`, `file_size_bytes`, `uploaded_by`. |
| **defects.evidence_urls** | In schema (TEXT[]). |
| **vehicles.vin, vehicles.odometer_km, vehicles.registration_number** | In schema; ready for OCR output. |
| **Upload helper** | `storage.ts`: upload by file or base64; path-based `createAttachmentRecord` aligned with schema. |
| **Camera capture in UI** | Defects: file input + base64 in state (D-03); Test: odometer + post-repair file inputs. Photos not yet persisted to storage/DB in all screens. |
| **OCR (Tesseract.js)** | `src/lib/ocr.ts`: `extractVINFromImage`, `extractOdometerFromImage`, `extractLicencePlateFromImage`. Wire on Safety (VIN/plate) and Test (odometer); write results to vehicles.vin, vehicles.registration_number, vehicles.odometer_km / job odometer. |
| **VIN/odometer → vehicle/job fields** | Architecture supports it; Safety and Test screens to call OCR and update vehicles / job_odometer_readings. |

---

## Summary

- **Mechanics can take photos and videos on their phones** and these are (or will be) **saved to the job under the relevant area** via Supabase Storage and **job_attachments** (and **defects.evidence_urls** for defects).
- **PRD steps that require photos:** (1) Safety – VIN/plate photo → OCR → vehicle fields; (2) Diagnosis – evidence photos; (3) Defects – **photo or video mandatory per defect**; (4) Test – odometer photo → OCR → value + photo stored.
- **Architecture:** Bucket `job-attachments`, path by job + area, **job_attachments** and **defects.evidence_urls**; **OCR** (Tesseract.js) for VIN, licence plate, and odometer; extracted text stored in **vehicles.vin**, **vehicles.registration_number**, **vehicles.odometer_km** and job-level odometer fields so the job card has the correct data.
