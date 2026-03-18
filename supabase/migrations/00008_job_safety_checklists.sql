-- job_safety_checklists: table (if missing) + RLS so mechanics can save safety checklist.

CREATE TABLE IF NOT EXISTS job_safety_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  mechanic_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  safe_environment BOOLEAN NOT NULL,
  not_blocking_job BOOLEAN NOT NULL,
  vin_entered TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_job_safety_checklists_job ON job_safety_checklists(job_id);
CREATE INDEX IF NOT EXISTS idx_job_safety_checklists_mechanic ON job_safety_checklists(mechanic_id);

ALTER TABLE job_safety_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mechanic insert own safety checklist" ON job_safety_checklists;
CREATE POLICY "Mechanic insert own safety checklist"
ON job_safety_checklists FOR INSERT TO authenticated
WITH CHECK (mechanic_id = auth.uid());

DROP POLICY IF EXISTS "Mechanic read own safety checklists" ON job_safety_checklists;
CREATE POLICY "Mechanic read own safety checklists"
ON job_safety_checklists FOR SELECT TO authenticated
USING (mechanic_id = auth.uid());
