-- Add note_type to job_notes so we can store text vs voice for audit (Q-04).
-- RLS: mechanics can insert/select job_notes for their assigned jobs.

ALTER TABLE job_notes
  ADD COLUMN IF NOT EXISTS note_type TEXT DEFAULT 'text' CHECK (note_type IN ('text', 'voice', 'ai_cleaned'));

COMMENT ON COLUMN job_notes.note_type IS 'Source: text (typed), voice (speech-to-text), ai_cleaned';

CREATE POLICY "Mechanics manage job_notes on assigned jobs"
ON job_notes FOR ALL TO authenticated
USING (
  job_id IN (SELECT id FROM jobs WHERE assigned_mechanic_id = auth.uid())
)
WITH CHECK (
  job_id IN (SELECT id FROM jobs WHERE assigned_mechanic_id = auth.uid())
);

CREATE POLICY "WM view site job_notes"
ON job_notes FOR SELECT TO authenticated
USING (
  job_id IN (
    SELECT j.id FROM jobs j
    INNER JOIN user_roles ur ON j.site_id = ur.site_id AND ur.site_id IS NOT NULL
    WHERE ur.user_id = auth.uid() AND ur.role = 'workshop_manager'
  )
);
