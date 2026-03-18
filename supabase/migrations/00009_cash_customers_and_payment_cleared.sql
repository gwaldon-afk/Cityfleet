-- Customer: from database OR manual (cash). Vehicle release only after payment cleared.
-- 1) Workshop Manager can create customers and vehicles (for cash/walk-in jobs).
-- 2) Invoices: add payment_cleared_at — vehicle cannot be released until payment made and cleared.
-- 3) Block job release (status -> closed_released) when job has invoice(s) and any invoice not yet cleared.

-- ─── 1. RLS: WM insert customers and vehicles ─────────────────────────────────
CREATE POLICY "WM insert customers"
ON customers FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'workshop_manager' AND ur.site_id IS NOT NULL
  )
);

CREATE POLICY "WM insert vehicles"
ON vehicles FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'workshop_manager' AND ur.site_id IS NOT NULL
  )
);

-- ─── 2. Invoices: payment cleared ─────────────────────────────────────────────
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS payment_cleared_at TIMESTAMPTZ;

COMMENT ON COLUMN invoices.payment_cleared_at IS 'When payment received and cleared; vehicle must not be released until set.';

-- ─── 3. Block job release until invoice payment cleared ─────────────────────
CREATE OR REPLACE FUNCTION check_release_after_payment()
RETURNS TRIGGER AS $$
DECLARE
  has_invoice BOOLEAN;
  all_cleared BOOLEAN;
BEGIN
  -- Only check when transitioning to closed_released (or when setting released_at)
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
