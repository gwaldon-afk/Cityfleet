# Running Supabase migrations

Your project is not yet **linked** to a Supabase project, so `supabase db push` will not work until you link it.

## Option A: Link project and push (recommended long-term)

1. In [Supabase Dashboard](https://supabase.com/dashboard), open your project and note:
   - **Project ref** (Settings → General → Reference ID)
   - **Database password** (Settings → Database) if you need it for linking

2. In the project root, run:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   When prompted, enter your database password if required.

3. Push all migrations:
   ```bash
   supabase db push
   ```

## Option B: Run SQL in Supabase Dashboard (quick one-off)

**Where to paste:** In the Supabase website → your project → **SQL Editor** → click **New query**. The big text box there is where the SQL goes.

**What to paste:** The full SQL from the file in your project:

1. On your computer, open this file in the Cityfleet App project:
   - **`supabase/run_00009_and_00010.sql`**
   (Full path: `City Fleet\Cityfleet App\supabase\run_00009_and_00010.sql`.)
2. Select all (Ctrl+A), copy (Ctrl+C).
3. In Supabase: go to [supabase.com/dashboard](https://supabase.com/dashboard) → open **your project** → left sidebar **SQL Editor** → **New query**.
4. Paste (Ctrl+V) into the query box.
5. Click **Run** (or Ctrl+Enter).

If you get errors like "policy already exists", those parts are already applied; you can ignore them or run only the remaining statements.

## What these migrations do

- **00009** – Lets workshop managers create customers and vehicles (cash/walk-in). Adds `invoices.payment_cleared_at` and a trigger so a job cannot be set to `closed_released` if it has an invoice that is not yet payment-cleared.
- **00010** – Adds `jobs.parent_job_id` to link follow-up jobs (e.g. from defects) to the source job.
- **00011** – Invoices RLS: Workshop Manager and Ops Manager can SELECT, INSERT, and UPDATE invoices for jobs at their site(s). Required for the “Create invoice → Mark payment cleared → Release job” flow. Run **`supabase/migrations/00011_invoices_rls.sql`** in the SQL Editor (same way as above) if you have already run 00009 and 00010.
- **00012** – Admin RLS: Administrators can read all users (including inactive), update users (e.g. status), and INSERT/DELETE on `user_roles` (assign/remove roles and sites). Also admins can read all sites and update sites. Required for the Admin Users and Customer pricing pages. Run **`supabase/migrations/00012_admin_users_roles_sites_rls.sql`** in the SQL Editor.
