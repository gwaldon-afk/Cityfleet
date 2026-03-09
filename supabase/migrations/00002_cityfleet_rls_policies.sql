-- City Fleet Workshop Manager — RLS Policies v1.0
-- Run after 00001_cityfleet_schema_v1.sql
-- Helper functions in public schema (Supabase auth schema is managed)

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_role(check_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = check_role
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_sites()
RETURNS TABLE(site_id UUID) AS $$
  SELECT site_id FROM public.user_roles
  WHERE user_id = auth.uid()
  AND site_id IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================================================
-- JOBS
-- =============================================================================

CREATE POLICY "Mechanics see assigned jobs"
ON jobs FOR SELECT TO authenticated
USING (
  assigned_mechanic_id = auth.uid()
  AND site_id IN (
    SELECT ur.site_id FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'mechanic' AND ur.site_id IS NOT NULL
  )
);

CREATE POLICY "Mechanics update assigned jobs"
ON jobs FOR UPDATE TO authenticated
USING (
  assigned_mechanic_id = auth.uid() AND is_locked = FALSE
)
WITH CHECK (
  assigned_mechanic_id = auth.uid() AND is_locked = FALSE
);

CREATE POLICY "WM see site jobs"
ON jobs FOR SELECT TO authenticated
USING (
  site_id IN (
    SELECT ur.site_id FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'workshop_manager' AND ur.site_id IS NOT NULL
  )
);

CREATE POLICY "WM manage site jobs"
ON jobs FOR ALL TO authenticated
USING (
  site_id IN (
    SELECT ur.site_id FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'workshop_manager' AND ur.site_id IS NOT NULL
  )
)
WITH CHECK (
  site_id IN (
    SELECT ur.site_id FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'workshop_manager' AND ur.site_id IS NOT NULL
  )
);

CREATE POLICY "OPS see multi-site jobs"
ON jobs FOR SELECT TO authenticated
USING (
  site_id IN (
    SELECT ur.site_id FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'ops_manager' AND ur.site_id IS NOT NULL
  )
);

CREATE POLICY "OPS approve jobs"
ON jobs FOR UPDATE TO authenticated
USING (
  site_id IN (
    SELECT ur.site_id FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'ops_manager' AND ur.site_id IS NOT NULL
  )
  AND status IN ('ops_review', 'manager_approved')
);

CREATE POLICY "Admins read all jobs"
ON jobs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'administrator'
  )
);

-- =============================================================================
-- TIME_ENTRIES
-- =============================================================================

CREATE POLICY "Mechanics manage own time"
ON time_entries FOR ALL TO authenticated
USING (mechanic_id = auth.uid())
WITH CHECK (mechanic_id = auth.uid());

CREATE POLICY "WM view site time entries"
ON time_entries FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jobs j
    INNER JOIN user_roles ur ON j.site_id = ur.site_id AND ur.site_id IS NOT NULL
    WHERE j.id = time_entries.job_id
    AND ur.user_id = auth.uid()
    AND ur.role = 'workshop_manager'
  )
);

-- =============================================================================
-- CUSTOMERS
-- =============================================================================

CREATE POLICY "All users view customers"
ON customers FOR SELECT TO authenticated
USING (status = 'active');

CREATE POLICY "Admins manage customers"
ON customers FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'administrator')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'administrator')
);

-- =============================================================================
-- AUDIT_LOG
-- =============================================================================

CREATE POLICY "All users create audit logs"
ON audit_log FOR INSERT TO authenticated
WITH CHECK (TRUE);

CREATE POLICY "Admins view audit logs"
ON audit_log FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'administrator')
);

-- No DELETE/UPDATE on audit_log (immutable)
