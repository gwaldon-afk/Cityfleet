# City Fleet — Client UAT / demo testing manual

## Application URL (Vercel)

**Open the app:** [https://cityfleet-git-main-gary-waldons-projects.vercel.app/](https://cityfleet-git-main-gary-waldons-projects.vercel.app/)

Plain text: `https://cityfleet-git-main-gary-waldons-projects.vercel.app/`

---

## Login credentials (Phase A — seed users)

**Password for all accounts:** `Password1!`

| Role | Email | Password |
|------|--------|----------|
| Mechanic | mechanic@cityfleet.local | Password1! |
| Workshop Manager | manager@cityfleet.local | Password1! |
| Ops Manager | ops@cityfleet.local | Password1! |
| Administrator | admin@cityfleet.local | Password1! |

Use the **Application URL** above → **Log in** with the email and password for the role you are testing.

*(Phase B adds more users — see **docs/SEED-DATA.md**.)*

---

This manual assumes the Vercel deployment is connected to your **Supabase project** (same database as configured in Vercel environment variables).

---

## 1. Before testers start

| Step | Action |
|------|--------|
| Env on Vercel | Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to this Supabase project. |
| Database | Run all migrations, then `supabase/seed.sql` (and optionally `seed_phase_b.sql`) in **Supabase → SQL Editor**. |
| Auth | **Authentication → Providers → Email** enabled. |
| Storage | Create bucket **`job-attachments`** (if not exists). For walk-around photos to **display** without errors, use a **public** bucket or add policies so mechanics can read objects they uploaded. |

---

## 2. Where to reset demo data

There is **no reset button in the app** — reset is done in **Supabase SQL Editor**.

1. Open **`supabase/reset_demo.sql`** in this repo.  
2. Paste and run it in **SQL Editor** (it deletes shifts, job data, time entries, invoices, attachments, etc.).  
3. Run **`supabase/seed.sql`** again (then **`seed_phase_b.sql`** if you use Phase B).  

Full reference: **`docs/SEED-DATA.md`** (accounts, what each seed creates, troubleshooting).

**After reset:** testers sign in again; **Clock on** if required; open jobs from **My Jobs**.

---

## 3. What each role is for

| Role | Typical use in UAT |
|------|---------------------|
| Mechanic | My Jobs, clock on, safety checklist, diagnosis, work flow |
| Workshop Manager | Dashboard, assign mechanics, approve jobs, invoices |
| Ops Manager | Cross-site / ops views (if enabled in your build) |
| Administrator | Admin screens |

Logins are in **Login credentials** at the top of this document.

---

## 4. Suggested test flows

### 4.1 Mechanic — full path (happy path)

1. Log in as **mechanic@cityfleet.local** / `Password1!`.  
2. **Clock on** (if your build requires it).  
3. Open **My Jobs** — you should see **JOB-SEED-001** and **JOB-SEED-002** (both approved and assigned to Alex in current seed).  
4. Open **JOB-SEED-002** (or any job not yet started).  
5. **Start job** → **Safety checklist**.  
6. **Walk-around:** upload a photo/video **or** tick **Skip walk-around (demo only)** for UAT.  
7. Answer **Yes** to safety questions; confirm **VIN** (pre-filled from vehicle when seeded).  
8. Continue through **Diagnosis → Work → …** as far as your demo requires.

### 4.2 Manager

1. Log in as **manager@cityfleet.local**.  
2. Open a job from the dashboard; **assign mechanic** if needed.  
3. **Approve** jobs / review defects / **Invoices & release** as needed.

### 4.3 “Cannot open job” / empty My Jobs

- **Job must be `approved` and assigned to that mechanic** to appear in **My Jobs**.  
- If you only see one job, run the UPDATE in **`seed.sql`** comments for **JOB-SEED-002** or do a full **reset + seed** (section 2).  
- **Deep links** (`/mechanic/job/<uuid>/...`) work only if RLS allows that user to read the job.

---

## 5. Console errors (406 / network)

- **406** from Supabase REST usually came from **`.single()`** when **zero rows** were returned (e.g. no active time entry). The app has been updated to use **`.maybeSingle()`** where appropriate. If you still see 406, note the **exact request URL** and tell the dev team.  
- **Walk-around image fails to load:** often **private bucket** + public URL — fix Storage policies or make the bucket public for demo (section 1).  
- **“Mechanic already has an active job”:** close open time entries (see **SEED-DATA.md** troubleshooting SQL).

---

## 6. What to report

- URL + role + steps.  
- Screenshot of **Network** tab for failed request (status + URL).  
- Approximate time (helps correlate with Supabase logs).

---

## 7. Security reminder

Change or remove seed users and passwords before any **production** or long-lived shared environment.

---

## PDF for clients

To create a **PDF**: open this file in VS Code / Cursor (preview), GitHub, or any Markdown viewer, then **Print → Save as PDF**. You can also paste the **Application URL** and **Login credentials** table into Word or Google Docs and export as PDF.
