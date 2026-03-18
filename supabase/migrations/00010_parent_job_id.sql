-- Batch B: Link follow-up jobs to the source job (e.g. additional work from defects).
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS parent_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_parent ON jobs(parent_job_id);

COMMENT ON COLUMN jobs.parent_job_id IS 'Set when this job is follow-up from another (e.g. additional work from defects); source job id.';
