-- Invoices: Workshop Manager and Ops Manager can view and manage invoices for jobs at their site(s).
-- Required for create invoice, mark payment cleared, and release job flow.

CREATE POLICY "WM and OPS select invoices for site jobs"
ON invoices FOR SELECT TO authenticated
USING (
  job_id IN (
    SELECT j.id FROM jobs j
    INNER JOIN user_roles ur ON ur.site_id = j.site_id AND ur.user_id = auth.uid()
    WHERE ur.role IN ('workshop_manager', 'ops_manager') AND ur.site_id IS NOT NULL
  )
);

CREATE POLICY "WM and OPS insert invoices for site jobs"
ON invoices FOR INSERT TO authenticated
WITH CHECK (
  job_id IN (
    SELECT j.id FROM jobs j
    INNER JOIN user_roles ur ON ur.site_id = j.site_id AND ur.user_id = auth.uid()
    WHERE ur.role IN ('workshop_manager', 'ops_manager') AND ur.site_id IS NOT NULL
  )
);

CREATE POLICY "WM and OPS update invoices for site jobs"
ON invoices FOR UPDATE TO authenticated
USING (
  job_id IN (
    SELECT j.id FROM jobs j
    INNER JOIN user_roles ur ON ur.site_id = j.site_id AND ur.user_id = auth.uid()
    WHERE ur.role IN ('workshop_manager', 'ops_manager') AND ur.site_id IS NOT NULL
  )
)
WITH CHECK (
  job_id IN (
    SELECT j.id FROM jobs j
    INNER JOIN user_roles ur ON ur.site_id = j.site_id AND ur.user_id = auth.uid()
    WHERE ur.role IN ('workshop_manager', 'ops_manager') AND ur.site_id IS NOT NULL
  )
);
