# City Fleet App — Client demo and sharing

## Is the app “full working” for the workflow?

**Yes.** The app covers the full workshop workflow for **three roles**:

| Role | What they can do |
|------|-------------------|
| **Mechanic** | Clock on → pick job → safety checklist → diagnosis → work → defects/parts → test drive → completion → submit for manager review → final sign-off. |
| **Workshop Manager** | Dashboard (jobs for today, needs action, defects pending, unassigned/paused/awaiting parts). Create job (DB or cash customer). Assign mechanic. Two-hand approve jobs ready for review. Manage defects/parts. Create follow-up job from defects. **Invoices & release:** create invoice, mark payment cleared, release job when all invoices cleared. |
| **Ops Manager** | Close-out queue (jobs in mechanic closed / manager approved / ops review). Open any job → same invoice & release flow: create invoice, mark payment cleared, release job. |

**Not built yet:** **Administrator** — the Admin Users page is a placeholder. User management, customer pricing, and audit log are planned but not implemented.

---

## How to share with the client for review and testing

### 1. Run the app locally (you demo)

1. **Supabase**
   - Use your Supabase project (or create one).
   - Apply all migrations (00001 through 00011). See `docs/MIGRATIONS.md`.
   - Run the seed (in SQL Editor, run `supabase/seed.sql`) so the three demo users + jobs exist.

2. **Environment**
   - In the app root, ensure `.env.local` has:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Start the app**
   - `npm install` then `npm run dev`.
   - Open **http://localhost:3000** (or the port shown).

4. **Give the client**
   - **Option A – Live demo:** Share your screen and walk through the 3-role flow (see demo script below).
   - **Option B – They test on their machine:** Send them the repo (or a zip), the same `.env.local` values (or a separate Supabase project), and these instructions. They run `npm install`, `npm run dev`, and use the logins below.

### 2. Share via a hosted URL (they test without installing)

- Deploy the Next.js app (e.g. **Vercel**, **Netlify**) and point it at your Supabase project (same env vars).
- Send the client the **deployed URL** (e.g. `https://cityfleet-demo.vercel.app`) and the **test logins** below.
- They open the URL in a browser, log in as each role, and test. No need to run code locally.

### 3. Test logins (all roles, same password)

From the seed, **password for all:** `Password1!`

| Role | Email | Use for |
|------|--------|--------|
| Mechanic | mechanic@cityfleet.local | Do work on a job, complete, submit for review. |
| Workshop Manager | manager@cityfleet.local | Approve jobs, create jobs, assign mechanic, invoices & release. |
| Ops Manager | ops@cityfleet.local | Close-out queue, invoice & release. |
| Administrator | admin@cityfleet.local | Logs in but only sees placeholder (Admin not built yet). |

---

## 3-role demo script (how they interact and flow)

Use this to show the client how the three roles work together.

### Setup before the demo

- Ensure seed has run (so you have JOB-SEED-001 and JOB-SEED-002, and the mechanic is assigned to JOB-SEED-001).
- Optional: have one job already in `ready_for_review` so you can start with Manager approval.

### 1) Workshop Manager

- Log in as **manager@cityfleet.local** / **Password1!**
- **Dashboard:** Show “Jobs for today”, “Needs your action” (if any), “Jobs with defects pending approval”, “Unassigned jobs”, “All jobs”.
- **Create job:** Click “Create job” → choose customer (from DB or cash), vehicle, PO, description → create. Show job in “All jobs”; assign a mechanic if you like.
- **Approve a job:** If a job is “Ready for review”, open it → two-hand disclaimer → “Approve JOB-XXX”. Explain that the mechanic has submitted this job for your approval.
- **Defects / follow-up:** Open a job with defects → set customer approval, estimated cost. Show “Create follow-up job for this vehicle” and that it pre-fills vehicle/customer/mechanic.
- **Invoices & release:** On a job in “Mechanic closed” / “Manager approved” / “Ops review”, show “Invoices & release” → “Create invoice” (number, total, payment type, date) → save. Then “Mark payment cleared” on the invoice. Then “Release job” (only enabled when all invoices are cleared). Explain: vehicle cannot be released until payment is cleared.

### 2) Mechanic

- Log out (or use an incognito window). Log in as **mechanic@cityfleet.local** / **Password1!**
- **Clock on** (if the app has clock-on).
- **My Jobs:** Show the assigned job(s). Open one.
- Walk through: **Safety** → **Diagnosis** → **Work** → **Defects** (add if needed) → **Parts** → **Test** → **Completion** → **Submit for manager review**. Explain that once submitted, the job appears for the Workshop Manager as “Ready for review”.
- **Final sign-off:** If the manager has already approved, show the mechanic can do final sign-off (if that step is in the flow).

### 3) Ops Manager

- Log out. Log in as **ops@cityfleet.local** / **Password1!**
- **Close-out queue:** Show the list of jobs in mechanic closed / manager approved / ops review (and closed). Columns: Job #, Vehicle, Customer, Status, Payment (No invoice / Unpaid / Payment cleared).
- Click **“Invoice & release”** (or the job number) → opens the **same** job page as the manager (invoice & release section). Show: create invoice → mark payment cleared → release job. Explain that Ops and Manager both use this flow; Ops focus on close-out and payment before release.

### 4) Admin (not built)

- Log in as **admin@cityfleet.local** / **Password1!**
- Show the Admin Users page and say: “This is the placeholder; user management, customer pricing, and audit log will be built here.”

---

## Summary

- **Full working app** for **Mechanic, Workshop Manager, and Ops Manager** across the full workflow, including **invoices and release**.
- **Admin** is **not** implemented yet (placeholder only).
- **Share for client:** run locally and demo, or deploy and send URL + test logins; use the 3-role demo script to show how the roles interact and flow.
