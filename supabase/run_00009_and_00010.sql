-- Run this in Supabase Dashboard → SQL Editor if you are not using supabase db push.
-- Applies: 00009 (cash customers, payment_cleared_at, release trigger) and 00010 (parent_job_id).

-- ─── 00009: Cash customers and payment cleared ─────────────────────────────────

-- 1. RLS: WM insert customers and vehicles (drop first so script can be re-run)
DROP POLICY IF EXISTS "WM insert customers" ON customers;
CREATE POLICY "WM insert customers"
ON customers FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'workshop_manager' AND ur.site_id IS NOT NULL
  )
);

DROP POLICY IF EXISTS "WM insert vehicles" ON vehicles;
CREATE POLICY "WM insert vehicles"
ON vehicles FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'workshop_manager' AND ur.site_id IS NOT NULL
  )
);

-- 2. Invoices: payment cleared
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS payment_cleared_at TIMESTAMPTZ;

COMMENT ON COLUMN invoices.payment_cleared_at IS 'When payment received and cleared; vehicle must not be released until set.';

-- 3. Block job release until invoice payment cleared
CREATE OR REPLACE FUNCTION check_release_after_payment()
RETURNS TRIGGER AS $$
DECLARE
  has_invoice BOOLEAN;
  all_cleared BOOLEAN;
BEGIN
  IF NEW.status = 'closed_released' AND (OLD.status IS NULL OR OLD.status <> 'closed_released') THEN
    SELECT EXISTS (SELECT 1 FROM invoices WHERE job_id = NEW.id) INTO has_invoice;
    IF has_invoice THEN
      SELECT NOT EXISTS (
        SELECT 1 FROM invoices WHERE job_id = NEW.id AND payment_cleared_at IS NULL
      ) INTO all_cleared;
      IF NOT all_cleared THEN
        RAISE EXCEPTION 'Vehicle cannot be released: invoice exists but payment has not been made and cleared.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_release_after_payment ON jobs;
CREATE TRIGGER enforce_release_after_payment
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION check_release_after_payment();

-- ─── 00010: Parent job id (follow-up jobs) ─────────────────────────────────────

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS parent_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_parent ON jobs(parent_job_id);

COMMENT ON COLUMN jobs.parent_job_id IS 'Set when this job is follow-up from another (e.g. additional work from defects); source job id.';
