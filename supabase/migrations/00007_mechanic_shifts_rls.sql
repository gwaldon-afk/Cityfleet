-- Mechanics: read own shifts, clock on (insert), clock off (update).
-- Fixes "new row violates row-level security policy for table 'shifts'".
-- Idempotent: safe to run multiple times (drops then recreates).

DROP POLICY IF EXISTS "Mechanic read own shifts" ON shifts;
CREATE POLICY "Mechanic read own shifts"
ON shifts FOR SELECT TO authenticated
USING (mechanic_id = auth.uid());

DROP POLICY IF EXISTS "Mechanic insert own shift" ON shifts;
CREATE POLICY "Mechanic insert own shift"
ON shifts FOR INSERT TO authenticated
WITH CHECK (mechanic_id = auth.uid());

DROP POLICY IF EXISTS "Mechanic update own shift" ON shifts;
CREATE POLICY "Mechanic update own shift"
ON shifts FOR UPDATE TO authenticated
USING (mechanic_id = auth.uid())
WITH CHECK (mechanic_id = auth.uid());
