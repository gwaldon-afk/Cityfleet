-- EXEC-01: Ops Manager real-time dashboard needs read access across all sites
-- (jobs were previously limited to ops user's assigned sites only).

CREATE POLICY "OPS read all jobs for network oversight"
ON public.jobs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'ops_manager'
  )
);

CREATE POLICY "OPS read all shifts for network oversight"
ON public.shifts FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'ops_manager'
  )
);

CREATE POLICY "OPS read all time entries for network oversight"
ON public.time_entries FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'ops_manager'
  )
);
