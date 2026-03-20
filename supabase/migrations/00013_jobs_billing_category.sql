-- Jobs: billing category for rework (invoiced work redone at no cost to client).
-- Drives EXEC-04 metrics, exception reporting, and labour attribution.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS billing_category TEXT NOT NULL DEFAULT 'standard'
  CHECK (billing_category IN ('standard', 'rework_no_charge'));

COMMENT ON COLUMN public.jobs.billing_category IS
  'standard = normal billable job. rework_no_charge = client was invoiced; job redone at no cost (Executive / performance metrics).';

CREATE INDEX IF NOT EXISTS idx_jobs_billing_category ON public.jobs(billing_category);
