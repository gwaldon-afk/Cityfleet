# City Fleet — Supabase setup

## 1. Create Supabase project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard).
2. **New project** → name e.g. `cityfleet-workshop`.
3. **Region**: Australia (or closest).
4. Set and store the **database password** securely.

## 2. Run database migrations

1. In the project: **SQL Editor** → **New query**.
2. Run each migration in order (copy file contents, paste, **Run**):
   - `supabase/migrations/00001_cityfleet_schema_v1.sql`
   - `supabase/migrations/00002_cityfleet_rls_policies.sql`
   - `supabase/migrations/00003_vehicles_sites_users_select.sql` — required for create-job form and job board
   - `supabase/migrations/00004_wm_read_site_shifts.sql` — required for manager dashboard **Mechanics** and **Mechanics clocked on** KPI
   - `supabase/migrations/00005_wm_defects_parts_rls.sql` — required for manager **defect approval** and **parts ordering** (and mechanic defect insert)
   - `supabase/migrations/00006_job_notes_note_type.sql` — required for **job notes** (text/voice) and RLS on `job_notes`
   - `supabase/migrations/00007_mechanic_shifts_rls.sql` — required for **mechanic clock on/off** (RLS on `shifts`)
   - `supabase/migrations/00008_job_safety_checklists.sql` — required for **safety checklist** (table + RLS)
3. In **Table Editor**, confirm tables exist (including `job_safety_checklists`).

## 2b. Seed data (optional — for testing)

1. In **Authentication** → **Providers**: ensure **Email** is enabled (so seed users can sign in).
2. In **SQL Editor** → **New query**, paste the contents of `supabase/seed.sql` and **Run**.
3. Seed creates:
   - **1 site:** City Fleet Sydney
   - **4 users** (same password: `Password1!`):
     - `mechanic@cityfleet.local` — Alex Mechanic (mechanic)
     - `manager@cityfleet.local` — Sam Manager (workshop_manager)
     - `ops@cityfleet.local` — Jordan Ops (ops_manager)
     - `admin@cityfleet.local` — Admin User (administrator)
   - **2 customers**, **2 vehicles**, **2 jobs** (JOB-SEED-001 assigned to mechanic, JOB-SEED-002 unassigned)
4. Sign in at your app’s login page with any of the emails above and `Password1!` to test each role.

## 3. Get API keys

1. **Project Settings** (gear) → **API**.
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (Optional) **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose to client)

## 4. Configure the app

1. In the project root, copy `.env.local.example` to `.env.local`.
2. Set in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` — use the **exact** URL from Dashboard (e.g. `https://pepbvodjevgtlucvwhqm.supabase.co`). A single wrong character (e.g. `whom` instead of `whqm`) causes 500/401.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Restart the dev server after any change to `.env.local`: `npm run dev`.

## 5. Storage bucket (for job attachments)

In Supabase: **Storage** → **New bucket** → name: `job-attachments` → create.  
Apply RLS as needed so only authorised roles can read/write.

## 6. Test constraints (after seeding data)

- Create a job without PO number/date and set status to `approved` → should fail.
- Start a second time entry for the same mechanic while one is active → should fail.
- Set a job to `is_locked = true` and try to update it → should fail.

## 7. Troubleshooting: Login 500 / "Database error querying schema"

**Common cause:** Users created by **manual SQL** (e.g. seed) had `confirmation_token`, `email_change`, `email_change_token_new`, and `recovery_token` as NULL. Supabase Auth requires these to be empty strings. The repo seed now sets them to `''` and includes an UPDATE to fix existing rows.

**If you already ran the seed before this fix:** In **SQL Editor**, run the full `supabase/seed.sql` again (the UPDATE at the end fixes existing auth users). Or run only this once:

```sql
UPDATE auth.users
SET confirmation_token = COALESCE(confirmation_token, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    recovery_token = COALESCE(recovery_token, '')
WHERE confirmation_token IS NULL OR email_change IS NULL OR email_change_token_new IS NULL OR recovery_token IS NULL;
```

Then try signing in again.

If sign-in still returns **500** and the form shows **"Database error querying schema"**:

1. **Check which request failed**  
   Open the browser **Console** (F12 → Console). The app now logs:
   - `[Auth] Token request failed:` — the **auth** endpoint (`/auth/v1/token`) returned an error; check **Supabase Dashboard → Logs → Auth**.
   - `[Auth] REST failed:` or `[Auth] Failed to load users/user_roles` — the **profile** step failed (PostgREST); check **Logs → API** and **Logs → Postgres**.

2. **Confirm seed and IDs**  
   - Use the **repo** seed: `supabase/seed.sql` (not a different script with other emails/IDs).  
   - Mechanic login is `mechanic@cityfleet.local` with id `b0000001-0000-4000-8000-000000000001` in both `auth.users` and `public.users`.  
   - In SQL Editor run:
     - `SELECT id, email FROM auth.users WHERE email = 'mechanic@cityfleet.local';`
     - `SELECT id, email FROM public.users WHERE email = 'mechanic@cityfleet.local';`
     - `SELECT user_id, role, site_id FROM public.user_roles WHERE user_id = (SELECT id FROM public.users WHERE email = 'mechanic@cityfleet.local');`  
   All three should return one row each; same `id` in auth and public.

3. **Confirm migrations**  
   All six migrations must be applied, especially **00003** (authenticated read on `users` and `user_roles`). In **Table Editor** → **users** / **user_roles** → **Policies**, you should see "Authenticated read active users" and "Authenticated read user_roles".

4. **If the 500 is from Auth (token request)**  
   The console will show `[Auth] Token request failed (Supabase Auth 500). Full response:` with the full JSON — copy that and check **Supabase Dashboard → Logs → Auth** (and **Logs → Postgres**) at the time you clicked Sign In. Common causes:
   - **Auth hook** (e.g. custom JWT or "Validate user" hook) that runs on sign-in and hits the DB — temporarily disable or fix the hook.
   - **Database trigger** on `auth.users` that runs on login and errors — check for triggers and fix or disable.
   - **Email provider** disabled — ensure **Authentication → Providers → Email** is enabled.
   - **Project issue** — in Dashboard, **Logs → Auth** will show the exact Postgres/schema error from the token request.

5. **If the 500 is from profile (users/user_roles)**  
   Check **Logs → API** for the failing path (`/rest/v1/users` or `/rest/v1/user_roles`) and the response body. Fix any RLS or schema issue indicated there.

6. **Requests going to the wrong URL (e.g. …whom.supabase.co)**  
   If the browser console shows requests to a URL that doesn’t match your project (e.g. `whom` instead of `whqm`), fix `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`, then **stop and restart** the dev server (`npm run dev`) so the new value is loaded. Clear the site’s storage or use an incognito window to avoid an old token from the wrong project.

---

**Schema**: 22 tables, 3 triggers (one active job per mechanic, PO required, no edit after invoice).  
**RLS**: Policies for jobs, time_entries, customers, audit_log; helpers in `public`: `get_user_role()`, `has_role()`, `user_sites()`.
