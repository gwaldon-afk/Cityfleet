# City Fleet Workshop Manager — Project Review & Build Plan

**Date:** February 2026  
**Purpose:** Where we are now, Supabase status, and a clear plan to complete the build.

---

## 1. Where We Are Now

### Done (Phase 1 + Mechanic MVP)

| Area | Status | Notes |
|------|--------|-------|
| **Repo & Git** | Done | GitHub `gwaldon-afk/Cityfleet`, SSH push working |
| **Supabase project** | Done | Schema + RLS migrations run (22 tables, triggers, policies) |
| **Next.js 14 app** | Done | TypeScript, Tailwind, App Router |
| **Supabase connection** | Done | Client, server, middleware; `.env.local` with URL + publishable key |
| **Auth** | Done | Login page, `AuthContext` (user, role, site, shift), protected routes |
| **Mechanic flows** | Done | Clock-on, Jobs list, Job detail with Safety → Diagnosis → Defects → Parts → Awaiting → Complete → Test → Sign-off, Work; hooks for shift, jobs, timers, checklists, defects, parts |
| **Home** | Done | Landing + “Supabase connected” |
| **Dashboard** | Done | Role-based redirect (mechanic → `/mechanic/jobs`, WM → `/manager/dashboard`, OPS → `/ops/dashboard`, admin → `/admin/users`) |
| **Unauthorized / test** | Done | `/unauthorized`, `/test-db` |

### Not Done Yet

| Area | Status | Notes |
|------|--------|-------|
| **Workshop Manager (WM)** | Missing | No `/manager/dashboard` or Job Board (WM-02); create job, assign mechanic, approve jobs, defect approval, parts order |
| **Ops Manager** | Missing | No `/ops/dashboard`; close-out queue, validate costs, invoices, release job |
| **Administrator** | Missing | No `/admin/users`; user management, customer pricing, audit log |
| **API routes** | Partial | Mechanic flows likely call Supabase from client/hooks; no formal Next.js API routes under `/api/` for shifts, jobs, etc. (per your API spec) |
| **Real-time** | Unknown | Supabase Realtime subscriptions for Job Board / live updates not confirmed |
| **Storage** | Partial | `storage.ts` exists; job-attachments bucket + RLS may still need setup in Supabase |
| **UI library** | Not added | Tech stack specifies shadcn/ui; not in `package.json` (app uses Tailwind only) |
| **Seed data** | Unknown | Test users (mechanic/WM/OPS/admin), sites, customers, vehicles for dev/testing |
| **Vercel deploy** | Unknown | Architecture says “deploy to Vercel”; not confirmed |
| **Executive dashboard** | Not started | Real-time ops, productivity, exceptions (per API spec) |

### Summary

- **Phase 1 (foundation):** Effectively complete: Supabase, Next.js, auth, DB schema, RLS.
- **Phase 2 (Mechanic MVP):** Largely complete: Clock On (M-01), Job Sign-On (M-03), Defect Capture (M-06), Final Sign-Off (M-11) and related mechanic screens exist.
- **Gaps:** Workshop Manager, Ops Manager, Administrator UIs and flows; optional API layer and real-time; seed data; optional shadcn; production deploy.

---

## 2. Supabase: Is It Up to Date?

### Current versions (in your `package.json`)

- `@supabase/supabase-js`: **^2.45.0**
- `@supabase/ssr`: **^0.5.2**

### Recommendation

- **@supabase/supabase-js:** 2.45 is fine; the latest stable is 2.99.x. Updating is optional but good for security and features. To update:
  ```bash
  npm install @supabase/supabase-js@latest
  ```
- **@supabase/ssr:** Keep using it for Next.js (server/client/middleware). If you bump `supabase-js`, run `npm install` and re-test auth and RLS.

### What to check in the Supabase dashboard

1. **Project Settings → API:** Confirm “Publishable” key is the one in `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. **Table Editor:** All 22 tables present and RLS on (no errors when opening tables).
3. **Storage:** Create bucket `job-attachments` if not already; add RLS so only authorised roles can read/write.
4. **Auth:** If you use Email/Password, ensure “Confirm email” is on or off as you want for dev.

**Verdict:** Supabase setup is in place and usable. Updating the JS client is recommended but not blocking; the main gap is building the remaining roles (WM, OPS, Admin) and any API/real-time you want.

---

## 3. Plan to Complete the Build

### Phase A — Quick wins (1–2 days)

1. **Create placeholder routes** so dashboard redirects don’t 404:
   - `/manager/dashboard` → “Workshop Manager dashboard – coming soon”
   - `/ops/dashboard` → “Ops Manager dashboard – coming soon”
   - `/admin/users` → “Admin – coming soon”
2. **Optional:** Update Supabase packages (`@supabase/supabase-js@latest`, then `npm install`).
3. **Optional:** Add shadcn/ui (per tech stack) and use it for new components going forward.
4. **Seed data:** Add a small SQL seed (1 site, 2–3 users with different roles, 1–2 customers, 1–2 vehicles, 1–2 jobs) so you can log in as mechanic/WM/OPS/admin and click through without errors.

### Phase B — Workshop Manager MVP (priority)

1. **WM-02 Job Board**  
   - Page: `/manager/dashboard` (or `/manager/jobs`).  
   - List jobs for the manager’s site(s), filters (status, vehicle, etc.), real-time updates (Supabase subscription on `jobs` for `site_id`).
2. **Create job**  
   - Form: vehicle, customer, PO number/date, description, etc.  
   - Call Supabase (or `/api/jobs` POST) and enforce PO (C-01, C-02).
3. **Assign mechanic**  
   - From Job Board, assign a mechanic; update `jobs.assigned_mechanic_id`.
4. **Approve job (manager)**  
   - After mechanic marks “ready_for_review”, WM approves (manager disclaimer, lock costs A-01, A-02) → status `manager_approved`.
5. **Defect approval**  
   - WM view/approve defects (customer_approval_status, estimated_cost) per API spec.
6. **Parts order**  
   - After defect approval, allow ordering parts (job_part, lifecycle_status 'ordered') per P-01.

### Phase C — Ops Manager MVP

1. **Close-out queue**  
   - `/ops/dashboard`: list jobs in `ops_review` (and optionally `manager_approved`), sort by longest open.
2. **Validate costs**  
   - OPS marks supplier_invoices_validated, margins_approved.
3. **Invoicing**  
   - POST `/api/invoices` (or Supabase): create invoice record, generate PDF URL (or placeholder), enforce B-01.
4. **Release job**  
   - After payment confirmed (B-02–B-04), set status `closed_released`, lock job (L-05, I-03).

### Phase D — Administrator

1. **User management**  
   - `/admin/users`: list users, create user (email, name, roles, site_ids), using Supabase Auth + `users` / `user_roles` tables.
2. **Customer pricing**  
   - Edit customer labour_rate_cents, parts_margin_percent (forward-only per spec).
3. **Audit log**  
   - Read-only view of `audit_log` (filter by entity_type, date range).

### Phase E — Polish & production

1. **API layer (optional)**  
   - Add Next.js API routes under `/api/` that mirror your API spec (shifts, jobs, defects, invoices, etc.) and call Supabase server-side; keeps RLS and centralises validation.
2. **Real-time**  
   - Ensure Job Board and any “live” lists use Supabase Realtime subscriptions where needed.
3. **Storage**  
   - Confirm `job-attachments` bucket and RLS; ensure defect evidence and attachments use Supabase Storage.
4. **Deploy**  
   - Connect repo to Vercel, set env vars (Supabase URL + Publishable key), deploy; test login and one full mechanic flow.

---

## 4. Suggested Order of Work

1. **Phase A** — Placeholder routes + seed data (and optional Supabase/shadcn update).  
2. **Phase B** — Workshop Manager (Job Board → create job → assign → approve → defects → parts).  
3. **Phase C** — Ops (close-out → validate → invoice → release).  
4. **Phase D** — Admin (users, customer pricing, audit log).  
5. **Phase E** — API/real-time/storage/deploy as needed.

This gets you from “mechanic app + auth” to “full workshop lifecycle” and then production-ready.

---

## 5. Reference

- **Technical Architecture:** `02_CityFleet_TechnicalArchitecture_v1.0.md` (API spec, RLS, integrations, deployment).
- **Database schema:** `supabase/migrations/00001_cityfleet_schema_v1.sql`, `00002_cityfleet_rls_policies.sql`.
- **Supabase setup:** `SUPABASE_SETUP.md` in project root.
