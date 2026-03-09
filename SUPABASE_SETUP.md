# City Fleet — Supabase setup

## 1. Create Supabase project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard).
2. **New project** → name e.g. `cityfleet-workshop`.
3. **Region**: Australia (or closest).
4. Set and store the **database password** securely.

## 2. Run database migrations

1. In the project: **SQL Editor** → **New query**.
2. Open `supabase/migrations/00001_cityfleet_schema_v1.sql`, copy all, paste, **Run**.
3. Then open `supabase/migrations/00002_cityfleet_rls_policies.sql`, copy all, paste, **Run**.
4. In **Table Editor**, confirm all 22 tables exist.

## 3. Get API keys

1. **Project Settings** (gear) → **API**.
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (Optional) **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose to client)

## 4. Configure the app

1. In the project root, copy `.env.local.example` to `.env.local`.
2. Set in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Restart the dev server: `npm run dev`.

## 5. Storage bucket (for job attachments)

In Supabase: **Storage** → **New bucket** → name: `job-attachments` → create.  
Apply RLS as needed so only authorised roles can read/write.

## 6. Test constraints (after seeding data)

- Create a job without PO number/date and set status to `approved` → should fail.
- Start a second time entry for the same mechanic while one is active → should fail.
- Set a job to `is_locked = true` and try to update it → should fail.

---

**Schema**: 22 tables, 3 triggers (one active job per mechanic, PO required, no edit after invoice).  
**RLS**: Policies for jobs, time_entries, customers, audit_log; helpers in `public`: `get_user_role()`, `has_role()`, `user_sites()`.
