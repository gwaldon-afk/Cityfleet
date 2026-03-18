-- Run this in Supabase SQL Editor to verify/fix job_safety_checklists for the app.
-- 1) Ensure table has required columns (add if missing)
-- 2) Enable RLS and create policies so mechanics can insert/select

-- Add completed_at if your table was created without it
ALTER TABLE public.job_safety_checklists
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add created_at if missing
ALTER TABLE public.job_safety_checklists
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Ensure not_blocking_job exists (app uses this name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_safety_checklists' AND column_name = 'not_blocking_job'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_safety_checklists' AND column_name = 'not_blocking_faster_job'
  ) THEN
    ALTER TABLE public.job_safety_checklists RENAME COLUMN not_blocking_faster_job TO not_blocking_job;
  END IF;
END $$;

-- RLS
ALTER TABLE public.job_safety_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mechanic insert own safety checklist" ON public.job_safety_checklists;
CREATE POLICY "Mechanic insert own safety checklist"
ON public.job_safety_checklists FOR INSERT TO authenticated
WITH CHECK (mechanic_id = auth.uid());

DROP POLICY IF EXISTS "Mechanic read own safety checklists" ON public.job_safety_checklists;
CREATE POLICY "Mechanic read own safety checklists"
ON public.job_safety_checklists FOR SELECT TO authenticated
USING (mechanic_id = auth.uid());

-- Verify: list policies (should show the two above)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'job_safety_checklists';
