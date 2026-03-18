-- Workshop Manager can read shifts at their site (to show who is clocked on on dashboard).

CREATE POLICY "WM read site shifts"
ON shifts FOR SELECT TO authenticated
USING (
  site_id IN (
    SELECT ur.site_id FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'workshop_manager' AND ur.site_id IS NOT NULL
  )
);
